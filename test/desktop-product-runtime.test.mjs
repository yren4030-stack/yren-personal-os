import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createDesktopProductRuntime, DESKTOP_RUNTIME_MODES } from '../src/composition/desktop-product-runtime.mjs'
import { FakeAgentRuntime } from './support/fake-agent-runtime.mjs'
import { createProject, createTask } from '../src/domain/project/project.mjs'
import { ERROR_CODES } from '../src/application/desktop-api.mjs'

const T0 = '2026-08-15T04:40:00.000Z'

function memoryStorage() {
  let state = null
  return { load: () => state, save: (x) => { state = x } }
}

/** Create a runtime over a temp DB with one ordered cleanup hook (stop, then rm). */
async function makeRuntime(t, options) {
  const dir = mkdtempSync(join(tmpdir(), 'yren-04a-rt-'))
  const runtime = await createDesktopProductRuntime({
    databasePath: join(dir, 'test.db'),
    appearanceStorage: memoryStorage(),
    ...options,
  })
  t.after(async () => {
    try { await runtime.stop() } catch { /* ignore */ }
    rmSync(dir, { recursive: true, force: true })
  })
  return runtime
}

async function fakeMock() {
  return { baseURL: 'http://127.0.0.1:59999', close: async () => {} }
}

test('unknown runtime mode is rejected', async () => {
  await assert.rejects(
    createDesktopProductRuntime({ mode: 'bogus', databasePath: 'x', appearanceStorage: memoryStorage() }),
    /unknown desktop runtime mode/,
  )
})

test('unit-test-fake requires an explicit fakeAgentRuntime (no implicit fake)', async () => {
  await assert.rejects(
    createDesktopProductRuntime({ mode: DESKTOP_RUNTIME_MODES.UNIT_TEST_FAKE, databasePath: 'x', appearanceStorage: memoryStorage() }),
    /requires an explicit fakeAgentRuntime/,
  )
})

test('real-dsh and validation modes require dshRoot (no silent fake fallback)', async () => {
  await assert.rejects(
    createDesktopProductRuntime({ mode: DESKTOP_RUNTIME_MODES.REAL_DSH, databasePath: 'x', appearanceStorage: memoryStorage() }),
    /requires dshRoot/,
  )
  await assert.rejects(
    createDesktopProductRuntime({ mode: DESKTOP_RUNTIME_MODES.VALIDATION_LOCAL_MOCK, databasePath: 'x', appearanceStorage: memoryStorage() }),
    /requires dshRoot/,
  )
})

test('validation-local-mock requires an explicit startMockServer', async () => {
  await assert.rejects(
    createDesktopProductRuntime({ mode: DESKTOP_RUNTIME_MODES.VALIDATION_LOCAL_MOCK, databasePath: 'x', appearanceStorage: memoryStorage(), dshRoot: 'C:/dsh' }),
    /requires startMockServer/,
  )
})

test('a not-started real runtime reports unavailable and propose returns RUNTIME_UNAVAILABLE', async (t) => {
  const runtime = await makeRuntime(t, {
    mode: DESKTOP_RUNTIME_MODES.VALIDATION_LOCAL_MOCK,
    dshRoot: 'C:/dsh',
    startMockServer: fakeMock,
  })

  const status = runtime.facade.getRuntimeStatus()
  assert.equal(status.ok, true)
  assert.equal(status.data.state, 'starting')
  assert.equal(status.data.mode, 'validation-local-mock')

  const propose = await runtime.facade.proposeNextStep('p1')
  assert.equal(propose.ok, false)
  assert.equal(propose.error.code, ERROR_CODES.RUNTIME_UNAVAILABLE)
})

test('unit-test-fake runtime is ready and drives the real Proposal First flow through the facade', async (t) => {
  const runtime = await makeRuntime(t, {
    mode: DESKTOP_RUNTIME_MODES.UNIT_TEST_FAKE,
    fakeAgentRuntime: new FakeAgentRuntime(),
    clock: () => new Date(T0),
  })

  assert.equal(runtime.facade.getRuntimeStatus().data.state, 'ready')

  await runtime.composition.projectRepository.save(createProject({ id: 'p1', title: 'Personal OS', createdAt: T0 }))
  await runtime.composition.taskRepository.save(createTask({ id: 't1', projectId: 'p1', title: 'Existing', createdAt: T0 }))

  const propose = await runtime.facade.proposeNextStep('p1')
  assert.equal(propose.ok, true)
  assert.equal(propose.data.status, 'pending-approval')

  const ws = await runtime.facade.getWorkspace('p1')
  assert.equal(ws.data.summary.taskCount, 1)
  assert.equal(ws.data.summary.pendingProposalCount, 1)

  const approve = await runtime.facade.approveProposal(propose.data.proposalId)
  assert.equal(approve.ok, true)
  assert.equal((await runtime.facade.getWorkspace('p1')).data.summary.taskCount, 2)
})

test('runtime.stop() disposes the SQLite composition and the facade rejects afterwards', async (t) => {
  const runtime = await makeRuntime(t, {
    mode: DESKTOP_RUNTIME_MODES.UNIT_TEST_FAKE,
    fakeAgentRuntime: new FakeAgentRuntime(),
  })
  await runtime.stop()
  assert.equal(runtime.facade.getRuntimeStatus().data.state, 'unavailable')
  const propose = await runtime.facade.proposeNextStep('p1')
  assert.equal(propose.ok, false)
  assert.equal(propose.error.code, ERROR_CODES.RUNTIME_UNAVAILABLE)
})
