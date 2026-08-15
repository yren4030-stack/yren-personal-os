import test from 'node:test'
import assert from 'node:assert/strict'

import { DeepSeekHarnessHostBinding } from '../src/infrastructure/runtime/deepseek-harness-host-binding.mjs'

const dshRoot = process.env.DSH_ROOT
if (!dshRoot) {
  throw new Error('DSH_ROOT env var is required for real DSH host integration tests')
}

function makeBinding(t, overrides = {}) {
  const binding = new DeepSeekHarnessHostBinding({
    dshRoot,
    startupTimeoutMs: 60000,
    requestTimeoutMs: 30000,
    shutdownTimeoutMs: 15000,
    ...overrides,
  })
  t.after(async () => {
    try {
      await binding.stop()
    } catch {
      // ignore
    }
  })
  return binding
}

/** Resolve the next `dsh-host-frame` event payload matching the predicate. */
function waitForFrame(binding, predicate, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let timer
    const handler = (message) => {
      if (message.event !== 'dsh-host-frame') return
      if (predicate && !predicate(message.payload)) return
      cleanup()
      resolve(message.payload)
    }
    const cleanup = () => {
      clearTimeout(timer)
      binding.off('event', handler)
    }
    timer = setTimeout(() => {
      cleanup()
      reject(new Error('timed out waiting for dsh-host-frame'))
    }, timeoutMs)
    binding.on('event', handler)
  })
}

function pidExists(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

test('1. real DSH host boots as a dedicated process', async (t) => {
  const binding = makeBinding(t)
  await binding.start()
  assert.ok(binding.pid > 0)
  assert.notEqual(binding.pid, process.pid)
})

test('2. real host info reports the frozen release and transport', async (t) => {
  const binding = makeBinding(t)
  await binding.start()
  const info = await binding.hostInfo()
  assert.equal(info.host, 'real-dsh-apiproxy')
  assert.equal(info.dshVersion, '0.1.0-rc.5')
  assert.equal(info.transport, 'stdio-json-lines')
  assert.equal(info.networkPortRequired, false)
  assert.equal(info.httpServerRequired, false)
  assert.equal(info.modelRuntimeConfigured, false)
})

test('3. ping / pong', async (t) => {
  const binding = makeBinding(t)
  await binding.start()
  const result = await binding.ping()
  assert.deepEqual(result, { pong: true })
})

test('4-11. real approval roundtrip: request -> mux frame -> respond -> allowed-once', async (t) => {
  const binding = makeBinding(t)
  await binding.start()

  const requestedPromise = waitForFrame(binding, (p) => p.frame && p.frame.type === 'approval/requested')
  const { sessionId } = await binding.approvalStart({
    toolName: 'personal-os-03b-probe',
    reason: 'Personal OS Real DSH Host Binding 03B',
  })
  const requested = await requestedPromise

  assert.equal(requested.frame.type, 'approval/requested')
  assert.equal(requested.frame.toolName, 'personal-os-03b-probe')
  assert.equal(requested.frame.sessionId, sessionId)
  assert.equal(typeof requested.rpcId, 'string')
  assert.equal(typeof requested.frame.approvalId, 'string')

  const resolvedPromise = waitForFrame(binding, (p) => p.frame && p.frame.type === 'approval/resolved')
  const receipt = await binding.clientResponse({
    rpcId: requested.rpcId,
    sessionId: requested.frame.sessionId,
    approvalId: requested.frame.approvalId,
    outcome: 'allowed-once',
  })
  assert.equal(receipt.accepted, true)

  const resolved = await resolvedPromise
  assert.equal(resolved.frame.approvalId, requested.frame.approvalId)
  assert.equal(resolved.frame.outcome, 'allowed-once')
})

test('12-13. graceful shutdown exits the child cleanly', async (t) => {
  const binding = makeBinding(t)
  await binding.start()
  const pid = binding.pid
  await binding.stop()
  assert.equal(binding.state, 'stopped')
  assert.equal(pidExists(pid), false)
})

test('14-18. crash isolation, explicit restart, and a fresh approval roundtrip', async (t) => {
  const binding = makeBinding(t)
  await binding.start()
  const pid1 = binding.pid

  const crashed = new Promise((resolve) => binding.once('crash', resolve))
  binding.bridge.request('crash').catch(() => {})
  await crashed
  assert.equal(binding.state, 'crashed')

  await binding.restart()
  assert.notEqual(binding.pid, pid1)

  const info = await binding.hostInfo()
  assert.equal(info.dshVersion, '0.1.0-rc.5')

  const requestedPromise = waitForFrame(binding, (p) => p.frame && p.frame.type === 'approval/requested')
  await binding.approvalStart({ toolName: 'personal-os-03b-probe', reason: 'after restart' })
  const requested = await requestedPromise
  const receipt = await binding.clientResponse({
    rpcId: requested.rpcId,
    sessionId: requested.frame.sessionId,
    approvalId: requested.frame.approvalId,
    outcome: 'allowed-once',
  })
  assert.equal(receipt.accepted, true)
})
