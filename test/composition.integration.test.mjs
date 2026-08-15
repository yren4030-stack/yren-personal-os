import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createProjectReadProposeComposition } from '../src/composition/project-read-propose-composition.mjs'
import { createProject, createTask } from '../src/domain/project/project.mjs'
import { ProjectReadProposeService } from '../src/application/project-read-propose-loop.mjs'
import { FakeAgentRuntime } from './support/fake-agent-runtime.mjs'

const T0 = '2026-08-15T04:40:00.000Z'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'yren-comp-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function composeAt(path, { agentRuntime } = {}) {
  return createProjectReadProposeComposition({
    databasePath: path,
    agentRuntime: agentRuntime ?? new FakeAgentRuntime(),
    clock: () => new Date(T0),
  })
}

test('composition opens a DB and wires the service over the ports', (t) => {
  const dir = tempDir(t)
  const fake = new FakeAgentRuntime()
  const comp = composeAt(join(dir, 'test.db'), { agentRuntime: fake })

  assert.ok(comp.service instanceof ProjectReadProposeService)
  assert.equal(typeof comp.projectRepository.getById, 'function')
  assert.equal(typeof comp.taskRepository.save, 'function')
  assert.equal(typeof comp.proposalRepository.replace, 'function')
  assert.equal(typeof comp.unitOfWork.run, 'function')
  comp.close()
})

test('propose persists a proposal; close/reopen preserves project, task, and proposal', async (t) => {
  const dir = tempDir(t)
  const path = join(dir, 'test.db')
  const fake = new FakeAgentRuntime()

  let comp = composeAt(path, { agentRuntime: fake })
  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  await comp.taskRepository.save(createTask({ id: 't1', projectId: 'p1', title: 'Existing task', createdAt: T0 }))

  const proposal = await comp.service.proposeNextStep('p1')

  // The fake runtime received only the frozen read-only context.
  assert.equal(fake.calls.length, 1)
  assert.equal(Object.isFrozen(fake.calls[0]), true)
  assert.equal(Object.isFrozen(fake.calls[0].project), true)
  assert.equal(Object.isFrozen(fake.calls[0].tasks), true)

  // Propose persisted the proposal but created no task.
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 1)
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'pending-approval')
  comp.close()

  comp = composeAt(path, { agentRuntime: fake })
  assert.equal((await comp.projectRepository.getById('p1')).title, 'Personal OS')
  const tasks = await comp.taskRepository.listByProjectId('p1')
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].id, 't1')
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'pending-approval')
  comp.close()
})

test('approval adds exactly one task, marks the proposal approved, and survives reopen', async (t) => {
  const dir = tempDir(t)
  const path = join(dir, 'test.db')

  let comp = composeAt(path)
  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const proposal = await comp.service.proposeNextStep('p1')
  await comp.service.approveProposal(proposal.id)
  comp.close()

  comp = composeAt(path)
  const tasks = await comp.taskRepository.listByProjectId('p1')
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].title, 'Implement Project bookshelf skeleton')
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'approved')
  comp.close()
})

test('rejection never creates a task, marks the proposal rejected, and survives reopen', async (t) => {
  const dir = tempDir(t)
  const path = join(dir, 'test.db')

  let comp = composeAt(path)
  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const proposal = await comp.service.proposeNextStep('p1')
  await comp.service.rejectProposal(proposal.id)
  comp.close()

  comp = composeAt(path)
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 0)
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'rejected')
  comp.close()
})

test('approve transaction rolls back when its second write fails (integration level)', async (t) => {
  const dir = tempDir(t)
  const path = join(dir, 'test.db')
  const comp = composeAt(path)

  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const proposal = await comp.service.proposeNextStep('p1')
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'pending-approval')

  // A proposal repository that delegates to the real SQLite repository but
  // fails on `replace` (approve's second write), over the same connection.
  const failingProposals = {
    getById: (id) => comp.proposalRepository.getById(id),
    save: (p) => comp.proposalRepository.save(p),
    replace: async () => {
      throw new Error('simulated replace failure')
    },
  }

  const service = new ProjectReadProposeService({
    projectRepository: comp.projectRepository,
    taskRepository: comp.taskRepository,
    proposalRepository: failingProposals,
    unitOfWork: comp.unitOfWork,
    agentRuntime: new FakeAgentRuntime(),
    clock: () => new Date(T0),
  })

  await assert.rejects(service.approveProposal(proposal.id), /simulated replace failure/)

  // The task write was rolled back and the proposal stayed pending-approval.
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 0)
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'pending-approval')
  comp.close()
})

test('close/dispose releases the DB resource so the temp file is deletable', (t) => {
  const dir = tempDir(t)
  const path = join(dir, 'test.db')
  const comp = composeAt(path)

  assert.equal(existsSync(path), true)
  comp.close()
  comp.dispose() // idempotent; must not throw

  // If the DB file were still locked, removal would fail on Windows.
  assert.doesNotThrow(() => rmSync(path, { force: true }))
  assert.equal(existsSync(path), false)
})
