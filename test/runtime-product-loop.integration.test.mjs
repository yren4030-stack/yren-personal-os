import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createDeepSeekHarnessAgentRuntime } from '../src/infrastructure/runtime/index.mjs'
import { createProjectReadProposeComposition } from '../src/composition/project-read-propose-composition.mjs'
import { createProject, createTask } from '../src/domain/project/project.mjs'
import { FakeAgentRuntime } from './support/fake-agent-runtime.mjs'
import { startBridge, once } from './support/runtime-test-utils.mjs'

const T0 = '2026-08-15T04:40:00.000Z'

function tempDb(t) {
  const dir = mkdtempSync(join(tmpdir(), 'yren-runtime-loop-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return join(dir, 'test.db')
}

test('persistent product loop runs through the runtime bridge', async (t) => {
  const dbPath = tempDb(t)
  const bridge = startBridge(t)
  await bridge.start()
  const agentRuntime = createDeepSeekHarnessAgentRuntime(bridge)

  let comp = createProjectReadProposeComposition({
    databasePath: dbPath,
    agentRuntime,
    clock: () => new Date(T0),
  })

  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  await comp.taskRepository.save(createTask({ id: 't1', projectId: 'p1', title: 'Existing task', createdAt: T0 }))

  // propose: context crosses the process boundary, proposal is persisted, task unchanged.
  const proposal = await comp.service.proposeNextStep('p1')
  assert.equal(proposal.status, 'pending-approval')
  assert.equal(proposal.title, 'Implement Project bookshelf skeleton')
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 1)

  // approve: task +1, proposal approved.
  await comp.service.approveProposal(proposal.id)
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 2)
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'approved')

  // close runtime + DB, then reopen DB and confirm persisted state.
  comp.close()
  await bridge.stop()

  comp = createProjectReadProposeComposition({
    databasePath: dbPath,
    agentRuntime: new FakeAgentRuntime(),
  })
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 2)
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'approved')
  comp.close()
})

test('child crash during propose fails safely and leaves a valid DB', async (t) => {
  const dbPath = tempDb(t)
  // Fixture child is configured to crash on the next propose request.
  const bridge = startBridge(t, { env: { FIXTURE_CRASH_ON_PROPOSE: '1' } })
  await bridge.start()
  const agentRuntime = createDeepSeekHarnessAgentRuntime(bridge)

  const comp = createProjectReadProposeComposition({
    databasePath: dbPath,
    agentRuntime,
    clock: () => new Date(T0),
  })
  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))

  // propose crashes the child mid-request: the service must fail explicitly.
  await assert.rejects(comp.service.proposeNextStep('p1'), /runtime child exited/)

  // No proposal and no task were created; the DB is still valid and queryable.
  const proposalCount = comp.db.prepare('SELECT COUNT(*) AS n FROM proposals WHERE project_id = ?').get('p1').n
  assert.equal(proposalCount, 0)
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 0)

  // Caller explicitly re-establishes a healthy runtime (fresh bridge, no crash mode).
  const healthyBridge = startBridge(t)
  await healthyBridge.start()
  const healthyRuntime = createDeepSeekHarnessAgentRuntime(healthyBridge)
  const comp2 = createProjectReadProposeComposition({
    databasePath: dbPath,
    agentRuntime: healthyRuntime,
    clock: () => new Date(T0),
  })

  // Next proposal succeeds; exactly one proposal, still no task.
  const proposal = await comp2.service.proposeNextStep('p1')
  assert.equal(proposal.status, 'pending-approval')
  assert.equal((await comp2.taskRepository.listByProjectId('p1')).length, 0)
  assert.equal((await comp2.proposalRepository.getById(proposal.id)).status, 'pending-approval')

  comp.close()
  comp2.close()
  await healthyBridge.stop()
})
