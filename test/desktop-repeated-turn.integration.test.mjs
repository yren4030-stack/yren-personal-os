/**
 * Repeated agent-turn integration test for the Desktop validation runtime.
 *
 * ONE Desktop runtime + ONE DSH host + ONE reusable localhost mock must
 * support multiple independent agent turns in the same session (real product
 * behavior). Host-validated: boots the real DSH host child, so it runs on the
 * ordinary Windows host under tsx with DSH_ROOT set (03C style), not in the
 * Harness sandbox.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createDesktopProductRuntime, DESKTOP_RUNTIME_MODES } from '../src/composition/desktop-product-runtime.mjs'
import { createProject } from '../src/domain/project/project.mjs'
import { startDshMockServer } from './support/dsh-mock-server.mjs'

const dshRoot = process.env.DSH_ROOT
if (!dshRoot) {
  throw new Error('DSH_ROOT env var is required for repeated-turn integration tests')
}

const T0 = '2026-08-15T04:40:00.000Z'
const SUCCESS_JSON = '{"title":"Review project priorities","rationale":"The current project context indicates this is the next useful step."}'

function memoryStorage() {
  let state = null
  return { load: () => state, save: (x) => { state = x } }
}

test('one runtime supports repeated turns: propose → approve → propose → reject → propose', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'yren-04a-turns-'))
  let mockRef = null

  const runtime = await createDesktopProductRuntime({
    mode: DESKTOP_RUNTIME_MODES.VALIDATION_LOCAL_MOCK,
    databasePath: join(dir, 'test.db'),
    appearanceStorage: memoryStorage(),
    dshRoot,
    startMockServer: async () => {
      const mock = await startDshMockServer({ dshRoot, successText: SUCCESS_JSON, repeatLast: true })
      mockRef = mock
      return mock
    },
  })
  t.after(async () => {
    try {
      await runtime.stop()
    } catch {
      // ignore
    }
    rmSync(dir, { recursive: true, force: true })
  })

  await runtime.start()
  const facade = runtime.facade
  assert.equal(facade.getRuntimeStatus().data.state, 'ready')

  await runtime.composition.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))

  // ---- Turn 1: propose → approve → task count 1 ----
  const turn1 = await facade.proposeNextStep('p1')
  assert.equal(turn1.ok, true)
  assert.equal(turn1.data.status, 'pending-approval')
  assert.equal(turn1.data.title, 'Review project priorities')

  const approve = await facade.approveProposal(turn1.data.proposalId)
  assert.equal(approve.ok, true)
  assert.equal((await facade.getWorkspace('p1')).data.summary.taskCount, 1)

  // ---- Turn 2: propose → still 1 task → reject → still 1 task, rejected ----
  const turn2 = await facade.proposeNextStep('p1')
  assert.equal(turn2.ok, true)
  assert.equal(turn2.data.status, 'pending-approval')
  assert.equal((await facade.getWorkspace('p1')).data.summary.taskCount, 1)

  const reject = await facade.rejectProposal(turn2.data.proposalId)
  assert.equal(reject.ok, true)
  const wsAfterReject = await facade.getWorkspace('p1')
  assert.equal(wsAfterReject.data.summary.taskCount, 1)
  assert.equal(wsAfterReject.data.proposals.find((p) => p.id === turn2.data.proposalId).status, 'rejected')

  // ---- Turn 3: propose succeeds again, still 1 task ----
  const turn3 = await facade.proposeNextStep('p1')
  assert.equal(turn3.ok, true)
  assert.equal(turn3.data.status, 'pending-approval')
  assert.equal((await facade.getWorkspace('p1')).data.summary.taskCount, 1)

  // ---- Mock telemetry: every request consumed 'success', never exhausted ----
  assert.ok(mockRef, 'mock instance captured for telemetry')
  assert.ok(mockRef.requests.length >= 3, `expected >= 3 chat requests, got ${mockRef.requests.length}`)
  for (const record of mockRef.requests) {
    assert.equal(record.behavior, 'success', `request ${record.attempt} must be success, got ${record.behavior}`)
  }
  assert.equal(mockRef.requests.some((r) => r.behavior === 'script_exhausted'), false)
})
