import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { DeepSeekHarnessHostBinding } from '../src/infrastructure/runtime/deepseek-harness-host-binding.mjs'
import { DeepSeekHarnessAgentRuntimeAdapter } from '../src/infrastructure/runtime/deepseek-harness-agent-runtime-adapter.mjs'
import { createProjectReadProposeComposition } from '../src/composition/project-read-propose-composition.mjs'
import { createProject, createTask } from '../src/domain/project/project.mjs'
import { FakeAgentRuntime } from './support/fake-agent-runtime.mjs'
import { startDshMockServer } from './support/dsh-mock-server.mjs'

const dshRoot = process.env.DSH_ROOT
if (!dshRoot) {
  throw new Error('DSH_ROOT env var is required for real DSH agent-turn integration tests')
}

const T0 = '2026-08-15T04:40:00.000Z'
const SUCCESS_JSON = '{"title":"Review project priorities","rationale":"The current project context indicates this is the next useful step."}'

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), 'yren-03c-'))
  return { dir, dbPath: join(dir, 'test.db') }
}

/** Start the mock server + a real DSH host binding; returns one ordered cleanup. */
async function startTurnBinding({ successText, sequence } = {}) {
  const mock = await startDshMockServer({ dshRoot, successText, sequence })
  const binding = new DeepSeekHarnessHostBinding({
    dshRoot,
    extraEnv: { POS_DSH_MOCK_BASE_URL: mock.baseURL, POS_DSH_TEST_API_KEY: 'mock-key' },
    startupTimeoutMs: 60000,
    requestTimeoutMs: 60000,
    shutdownTimeoutMs: 15000,
  })
  try {
    await binding.start()
  } catch (error) {
    // Resource safety: the mock LLM HTTP server is already listening here.
    // If the host binding cannot start (e.g. the environment cannot spawn
    // the DSH child process), close the mock before rethrowing so the test
    // process does not hang on an open server handle.
    await mock.close()
    throw error
  }
  return {
    mock,
    binding,
    async cleanup() {
      await binding.stop()
      await mock.close()
    },
  }
}

test('real agent turn completes and the mock server received a real chat request', async (t) => {
  const turn = await startTurnBinding({ successText: SUCCESS_JSON })
  t.after(async () => {
    await turn.cleanup()
  })
  const adapter = new DeepSeekHarnessAgentRuntimeAdapter(turn.binding.bridge)

  const proposal = await adapter.proposeNextProjectStep({
    context: { project: { id: 'p1', title: 'Personal OS' }, tasks: [] },
  })

  assert.equal(proposal.title, 'Review project priorities')
  assert.equal(proposal.rationale, 'The current project context indicates this is the next useful step.')
  assert.ok(turn.mock.requests.length >= 1, 'mock server should have captured at least one request')
  assert.ok(turn.mock.requests[0].path.endsWith('/chat/completions'))
})

test('full application flow: propose persists pending proposal, approve adds one task, survives reopen', async (t) => {
  const turn = await startTurnBinding({ successText: SUCCESS_JSON })
  const { dir, dbPath } = tempDb()
  const adapter = new DeepSeekHarnessAgentRuntimeAdapter(turn.binding.bridge)

  let comp = createProjectReadProposeComposition({
    databasePath: dbPath,
    agentRuntime: adapter,
    clock: () => new Date(T0),
  })
  t.after(async () => {
    comp.close()
    await turn.cleanup()
    rmSync(dir, { recursive: true, force: true })
  })

  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  await comp.taskRepository.save(createTask({ id: 't1', projectId: 'p1', title: 'Existing', createdAt: T0 }))

  const proposal = await comp.service.proposeNextStep('p1')
  assert.equal(proposal.status, 'pending-approval')
  assert.equal(proposal.title, 'Review project priorities')
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 1)

  await comp.service.approveProposal(proposal.id)
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 2)
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'approved')
  comp.close()

  comp = createProjectReadProposeComposition({ databasePath: dbPath, agentRuntime: new FakeAgentRuntime() })
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 2)
  assert.equal((await comp.proposalRepository.getById(proposal.id)).status, 'approved')
  comp.close()
})

test('invalid agent JSON fails closed with no proposal or task', async (t) => {
  const turn = await startTurnBinding({ successText: 'this is NOT valid JSON' })
  const { dir, dbPath } = tempDb()
  const adapter = new DeepSeekHarnessAgentRuntimeAdapter(turn.binding.bridge)
  const comp = createProjectReadProposeComposition({ databasePath: dbPath, agentRuntime: adapter })
  t.after(async () => {
    comp.close()
    await turn.cleanup()
    rmSync(dir, { recursive: true, force: true })
  })

  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))

  await assert.rejects(comp.service.proposeNextStep('p1'), (error) => {
    assert.equal(error.code, 'INVALID_AGENT_PROPOSAL')
    return true
  })
  assert.equal(comp.db.prepare('SELECT COUNT(*) AS n FROM proposals').get().n, 0)
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 0)
})

test('provider transport failure fails closed with no proposal or task', async (t) => {
  const turn = await startTurnBinding({ sequence: ['server_error'] })
  const { dir, dbPath } = tempDb()
  const adapter = new DeepSeekHarnessAgentRuntimeAdapter(turn.binding.bridge)
  const comp = createProjectReadProposeComposition({ databasePath: dbPath, agentRuntime: adapter })
  t.after(async () => {
    comp.close()
    await turn.cleanup()
    rmSync(dir, { recursive: true, force: true })
  })

  await comp.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))

  await assert.rejects(comp.service.proposeNextStep('p1'))
  assert.equal(comp.db.prepare('SELECT COUNT(*) AS n FROM proposals').get().n, 0)
  assert.equal((await comp.taskRepository.listByProjectId('p1')).length, 0)
})

test('a valid turn succeeds after a prior invalid turn', async (t) => {
  const invalidTurn = await startTurnBinding({ successText: 'this is NOT valid JSON' })
  const invalidAdapter = new DeepSeekHarnessAgentRuntimeAdapter(invalidTurn.binding.bridge)
  t.after(async () => {
    await invalidTurn.cleanup()
  })

  await assert.rejects(invalidAdapter.proposeNextProjectStep({ context: {} }), (error) => {
    assert.equal(error.code, 'INVALID_AGENT_PROPOSAL')
    return true
  })

  const validTurn = await startTurnBinding({ successText: SUCCESS_JSON })
  const validAdapter = new DeepSeekHarnessAgentRuntimeAdapter(validTurn.binding.bridge)
  t.after(async () => {
    await validTurn.cleanup()
  })

  const proposal = await validAdapter.proposeNextProjectStep({ context: { project: { id: 'p1', title: 'Personal OS' }, tasks: [] } })
  assert.equal(proposal.title, 'Review project priorities')
})
