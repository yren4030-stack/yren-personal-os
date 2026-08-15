import test from 'node:test'
import assert from 'node:assert/strict'

import { createRuntimeProcessBridge } from '../src/infrastructure/runtime/index.mjs'
import { buildChildEnvironment } from '../src/infrastructure/runtime/environment.mjs'
import { startBridge, once, pidExists, fixtureChildPath, TEST_ROOT } from './support/runtime-test-utils.mjs'

test('1. child runs as a dedicated process with a different PID', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  assert.notEqual(bridge.pid, process.pid)
  assert.ok(bridge.pid > 0)
})

test('2. ready handshake completes', async (t) => {
  const bridge = startBridge(t)
  const ready = once(bridge, 'ready')
  await bridge.start()
  const payload = await ready
  assert.equal(bridge.state, 'ready')
  assert.equal(payload.pid, bridge.pid)
})

test('3. ping returns pong', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const result = await bridge.request('ping')
  assert.deepEqual(result, { pong: true })
})

test('4. concurrent requests correlate correctly', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const [a, b, c] = await Promise.all([
    bridge.request('ping'),
    bridge.request('ping'),
    bridge.request('ping'),
  ])
  assert.equal(a.pong, true)
  assert.equal(b.pong, true)
  assert.equal(c.pong, true)
})

test('5. propose-next-project-step returns a mapped candidate', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const result = await bridge.request('propose-next-project-step', {
    context: { project: { id: 'p1', title: 'Personal OS', status: 'active' }, tasks: [] },
  })
  assert.equal(typeof result.title, 'string')
  assert.ok(result.title.length > 0)
  assert.equal(typeof result.rationale, 'string')
})

test('6. graceful shutdown reaches stopped state', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  await bridge.stop()
  assert.equal(bridge.state, 'stopped')
})

test('7. child exits after shutdown', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const pid = bridge.pid
  await bridge.stop()
  assert.equal(bridge.state, 'stopped')
  assert.equal(pidExists(pid), false)
})

test('8. child crash does not terminate the parent', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const crash = once(bridge, 'crash')
  bridge.request('crash').catch(() => {})
  await crash
  // Reaching here proves the parent process survived the child crash.
  assert.equal(bridge.state, 'crashed')
})

test('9. crash is detected with an exit signal', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const crash = once(bridge, 'crash')
  bridge.request('crash').catch(() => {})
  const info = await crash
  assert.equal(bridge.state, 'crashed')
  assert.ok(info.code === 9 || info.signal !== null || info.error !== undefined)
})

test('10. explicit restart reaches ready again', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  bridge.request('crash').catch(() => {})
  await once(bridge, 'crash')
  await bridge.restart()
  assert.equal(bridge.state, 'ready')
})

test('11. restarted child has a different PID', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const pid1 = bridge.pid
  bridge.request('crash').catch(() => {})
  await once(bridge, 'crash')
  await bridge.restart()
  assert.notEqual(bridge.pid, pid1)
})

test('12. requests work after restart', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  bridge.request('crash').catch(() => {})
  await once(bridge, 'crash')
  await bridge.restart()
  const result = await bridge.request('ping')
  assert.equal(result.pong, true)
})

test('13. startup timeout rejects start', async (t) => {
  const bridge = createRuntimeProcessBridge({
    executable: process.execPath,
    args: [fixtureChildPath],
    cwd: TEST_ROOT,
    env: buildChildEnvironment({ FIXTURE_NO_READY: '1' }),
    startupTimeoutMs: 300,
    requestTimeoutMs: 3000,
  })
  t.after(async () => {
    try {
      await bridge.stop()
    } catch {
      // ignore
    }
  })
  await assert.rejects(bridge.start(), /startup timeout/)
})

test('14. request timeout rejects the request', async (t) => {
  const bridge = startBridge(t, { requestTimeoutMs: 300 })
  await bridge.start()
  await assert.rejects(bridge.request('never-respond'), /request timeout/)
  assert.equal(bridge.state, 'ready')
})

test('15. malformed child output does not crash the parent', async (t) => {
  const bridge = startBridge(t)
  await bridge.start()
  const result = await bridge.request('malformed')
  assert.deepEqual(result, { done: true })
  assert.equal(bridge.state, 'ready')
  const ping = await bridge.request('ping')
  assert.equal(ping.pong, true)
})
