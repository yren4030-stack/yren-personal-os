import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createSqlitePersistence, SCHEMA_VERSION } from '../src/infrastructure/sqlite/index.mjs'
import { createProject, createTask } from '../src/domain/project/project.mjs'
import { ProjectReadProposeService } from '../src/application/project-read-propose-loop.mjs'
import {
  PROJECT_REPOSITORY_METHODS,
  TASK_REPOSITORY_METHODS,
  PROPOSAL_REPOSITORY_METHODS,
  UNIT_OF_WORK_METHODS,
} from '../src/domain/project/ports.mjs'

const T0 = '2026-08-15T04:40:00.000Z'

// Every test DB lives in a per-test temp directory and is removed afterwards.
function tempPersistence(t) {
  const dir = mkdtempSync(join(tmpdir(), 'yren-sqlite-'))
  const path = join(dir, 'test.db')
  const persistence = createSqlitePersistence(path)
  t.after(() => {
    try {
      persistence.close()
    } catch {
      // already closed
    }
    rmSync(dir, { recursive: true, force: true })
  })
  return { persistence, path }
}

function makeAgent() {
  return {
    async proposeNextProjectStep() {
      return { title: 'Implement Project bookshelf skeleton', rationale: 'Foundation is ready.' }
    },
  }
}

function makeService(persistence, overrides = {}) {
  return new ProjectReadProposeService({
    projectRepository: persistence.projectRepository,
    taskRepository: persistence.taskRepository,
    proposalRepository: persistence.proposalRepository,
    unitOfWork: persistence.unitOfWork,
    agentRuntime: makeAgent(),
    clock: () => new Date(T0),
    ...overrides,
  })
}

test('sqlite adapters satisfy the repository ports', (t) => {
  const { persistence } = tempPersistence(t)
  for (const m of PROJECT_REPOSITORY_METHODS) {
    assert.equal(typeof persistence.projectRepository[m], 'function', `projectRepository.${m}`)
  }
  for (const m of TASK_REPOSITORY_METHODS) {
    assert.equal(typeof persistence.taskRepository[m], 'function', `taskRepository.${m}`)
  }
  for (const m of PROPOSAL_REPOSITORY_METHODS) {
    assert.equal(typeof persistence.proposalRepository[m], 'function', `proposalRepository.${m}`)
  }
  for (const m of UNIT_OF_WORK_METHODS) {
    assert.equal(typeof persistence.unitOfWork[m], 'function', `unitOfWork.${m}`)
  }
})

test('schema migrates to V1 with foreign_keys enabled', (t) => {
  const { persistence } = tempPersistence(t)
  const version = persistence.db.prepare('PRAGMA user_version').get()
  const fk = persistence.db.prepare('PRAGMA foreign_keys').get()
  assert.equal(Number(version.user_version), SCHEMA_VERSION)
  assert.equal(Number(fk.foreign_keys), 1)
})

test('project round-trip', async (t) => {
  const { persistence } = tempPersistence(t)
  const project = createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 })
  await persistence.projectRepository.save(project)
  assert.deepEqual(await persistence.projectRepository.getById('p1'), project)
})

test('task round-trip', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const task = createTask({ id: 't1', projectId: 'p1', title: 'Build foundation', createdAt: T0 })
  await persistence.taskRepository.save(task)
  assert.deepEqual(await persistence.taskRepository.getById('t1'), task)
})

test('listByProjectId does not cross projects', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'One', createdAt: T0 }))
  await persistence.projectRepository.save(createProject({ id: 'p2', title: 'Two', createdAt: T0 }))
  await persistence.taskRepository.save(createTask({ id: 't1', projectId: 'p1', title: 'A', createdAt: T0 }))
  await persistence.taskRepository.save(createTask({ id: 't2', projectId: 'p2', title: 'B', createdAt: T0 }))

  assert.deepEqual((await persistence.taskRepository.listByProjectId('p1')).map((x) => x.id), ['t1'])
  assert.deepEqual((await persistence.taskRepository.listByProjectId('p2')).map((x) => x.id), ['t2'])
})

test('proposal round-trip', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const proposal = Object.freeze({
    id: 'pr1',
    projectId: 'p1',
    type: 'create-task',
    title: 'Add bookshelf',
    rationale: 'Ready.',
    status: 'pending-approval',
    createdAt: T0,
  })
  await persistence.proposalRepository.save(proposal)
  assert.deepEqual(await persistence.proposalRepository.getById('pr1'), proposal)
})

test('proposal replace transitions status', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const proposal = Object.freeze({
    id: 'pr1',
    projectId: 'p1',
    type: 'create-task',
    title: 'Add bookshelf',
    rationale: '',
    status: 'pending-approval',
    createdAt: T0,
  })
  await persistence.proposalRepository.save(proposal)

  await persistence.proposalRepository.replace(Object.freeze({ ...proposal, status: 'approved' }))
  const stored = await persistence.proposalRepository.getById('pr1')
  assert.equal(stored.status, 'approved')
  assert.equal(stored.title, 'Add bookshelf')
})

test('propose persists a proposal but creates no task', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const service = makeService(persistence)

  const proposal = await service.proposeNextStep('p1')

  assert.equal(proposal.status, 'pending-approval')
  assert.equal((await persistence.taskRepository.listByProjectId('p1')).length, 0)
  assert.equal((await persistence.proposalRepository.getById(proposal.id)).status, 'pending-approval')
})

test('approve creates exactly one task and marks the proposal approved', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const service = makeService(persistence)

  const proposal = await service.proposeNextStep('p1')
  await service.approveProposal(proposal.id)

  const tasks = await persistence.taskRepository.listByProjectId('p1')
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].title, 'Implement Project bookshelf skeleton')
  assert.equal((await persistence.proposalRepository.getById(proposal.id)).status, 'approved')
})

test('reject marks the proposal rejected and never creates a task', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  const service = makeService(persistence)

  const proposal = await service.proposeNextStep('p1')
  await service.rejectProposal(proposal.id)

  assert.equal((await persistence.taskRepository.listByProjectId('p1')).length, 0)
  assert.equal((await persistence.proposalRepository.getById(proposal.id)).status, 'rejected')
})

test('data persists after closing and reopening a file DB', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'yren-sqlite-'))
  const path = join(dir, 'test.db')
  t.after(() => rmSync(dir, { recursive: true, force: true }))

  let p = createSqlitePersistence(path)
  await p.projectRepository.save(createProject({ id: 'p1', title: 'Persist', createdAt: T0 }))
  await p.taskRepository.save(createTask({ id: 't1', projectId: 'p1', title: 'Task', createdAt: T0 }))
  p.close()

  p = createSqlitePersistence(path)
  assert.equal((await p.projectRepository.getById('p1')).title, 'Persist')
  const tasks = await p.taskRepository.listByProjectId('p1')
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].id, 't1')
  p.close()
})

test('foreign key enforcement rejects an orphan task', async (t) => {
  const { persistence } = tempPersistence(t)
  await assert.rejects(
    persistence.taskRepository.save(createTask({ id: 'orphan', projectId: 'missing-project', title: 'x', createdAt: T0 })),
    /FOREIGN KEY/i
  )
})

test('unit-of-work rolls back earlier writes when a later write fails', async (t) => {
  const { persistence } = tempPersistence(t)
  await persistence.projectRepository.save(createProject({ id: 'p1', title: 'P', createdAt: T0 }))
  const task = createTask({ id: 't1', projectId: 'p1', title: 'T', createdAt: T0 })
  const badProposal = Object.freeze({
    id: 'pr1',
    projectId: 'missing-project', // violates the proposals -> projects foreign key
    type: 'create-task',
    title: 'X',
    rationale: '',
    status: 'pending-approval',
    createdAt: T0,
  })

  await assert.rejects(
    persistence.unitOfWork.run(async () => {
      await persistence.taskRepository.save(task)
      await persistence.proposalRepository.save(badProposal)
    }),
    /FOREIGN KEY/i
  )

  // The task write was rolled back together with the failed proposal write.
  assert.equal(await persistence.taskRepository.getById('t1'), null)
})
