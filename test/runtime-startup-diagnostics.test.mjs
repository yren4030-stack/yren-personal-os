import test from 'node:test'
import assert from 'node:assert/strict'

import { RuntimeProcessBridge, RUNTIME_BRIDGE_STATES, redactSensitive } from '../src/infrastructure/runtime/runtime-process-bridge.mjs'

test('redactSensitive masks obvious credential/token forms', () => {
  const input = [
    'api key: sk-abcdef1234567890XYZ',
    'API_KEY=abc123def456ghi789',
    'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc.def',
    'password = hunter2secret',
    'access-token: tok_1234567890',
    'Bearer eyJhbGciOiJIUzI1NiJ9.zzz.www',
    'ordinary diagnostic line: file not found',
  ].join('\n')

  const out = redactSensitive(input)
  assert.equal(out.includes('sk-abcdef1234567890XYZ'), false)
  assert.ok(out.includes('sk-***'), 'sk- token form redacted')
  assert.equal(out.includes('abc123def456ghi789'), false)
  assert.equal(out.includes('eyJhbGciOiJIUzI1NiJ9.abc.def'), false)
  assert.ok(out.includes('Authorization=***'))
  assert.ok(out.includes('Bearer ***'), 'bare bearer token redacted')
  assert.equal(out.includes('hunter2secret'), false)
  assert.equal(out.includes('tok_1234567890'), false)
  assert.equal(out.includes('eyJhbGciOiJIUzI1NiJ9.zzz.www'), false)
  // Normal diagnostic content is preserved.
  assert.ok(out.includes('ordinary diagnostic line: file not found'))
})

test('stderr capture is bounded by stderrMaxChars (default 16000)', () => {
  const bridge = new RuntimeProcessBridge({ executable: 'C:\\node.exe', cwd: 'C:\\x' })
  assert.equal(bridge.stderrMaxChars, 16000)

  const small = new RuntimeProcessBridge({ executable: 'C:\\node.exe', cwd: 'C:\\x', stderrMaxChars: 64 })
  assert.equal(small.stderrMaxChars, 64)
})

test('startup rejection carries the bounded redacted stderr as error.stderr', () => {
  const bridge = new RuntimeProcessBridge({ executable: 'C:\\node.exe', cwd: 'C:\\x' })
  // Redaction happens at capture time; the error carries the stored text verbatim.
  bridge.stderrText = redactSensitive('fatal: cannot find module\napi_key=sk-abcdef1234567890XYZ\n')

  const error = new Error('runtime child exited before ready (code=1, signal=null)')
  bridge._rejectStartup(error)

  // Same error object (identity preserved for the Main-side caller).
  assert.equal(error.message, 'runtime child exited before ready (code=1, signal=null)')
  assert.equal(typeof error.stderr, 'string')
  assert.equal(error.stderr, bridge.stderrText, 'attached stderr is the stored (bounded, redacted) text')
  assert.ok(error.stderr.includes('fatal: cannot find module'))
  assert.equal(error.stderr.includes('sk-abcdef1234567890XYZ'), false, 'stderr attached to the error is redacted')
  assert.ok(error.stderr.includes('api_key=***'))
})

test('no ready-reject pending: attach still happens, nothing else is touched', () => {
  const bridge = new RuntimeProcessBridge({ executable: 'C:\\node.exe', cwd: 'C:\\x' })
  bridge.stderrText = 'boom'
  const error = new Error('boom')
  assert.doesNotThrow(() => bridge._rejectStartup(error))
  assert.equal(error.stderr, 'boom')
  assert.equal(bridge.state, RUNTIME_BRIDGE_STATES.idle)
})
