import test from 'node:test'
import assert from 'node:assert/strict'

import {
  FRAMING_PREFIX,
  ProtocolError,
  encodeMessage,
  decodeMessage,
  buildRequest,
  buildSuccessResponse,
  buildFailureResponse,
  buildEvent,
  isRequest,
  isResponse,
  isEvent,
} from '../src/infrastructure/runtime/protocol.mjs'

test('encodeMessage produces a framed line ending with a newline', () => {
  const line = encodeMessage({ type: 'event', event: 'ready', payload: {} })
  assert.ok(line.startsWith(FRAMING_PREFIX))
  assert.ok(line.endsWith('\n'))
  assert.equal(line.split('\n').length, 2) // exactly one trailing newline
})

test('decodeMessage round-trips a message', () => {
  const original = { type: 'request', id: 'r1', method: 'ping', params: { a: 1 } }
  const decoded = decodeMessage(encodeMessage(original).trimEnd())
  assert.deepEqual(decoded, original)
})

test('decodeMessage returns null for non-framed lines', () => {
  assert.equal(decodeMessage('some stray stdout text'), null)
  assert.equal(decodeMessage(''), null)
  assert.equal(decodeMessage(null), null)
})

test('decodeMessage throws ProtocolError for framed but invalid JSON', () => {
  assert.throws(() => decodeMessage(`${FRAMING_PREFIX}{not-json`), ProtocolError)
})

test('envelope builders produce the documented shapes', () => {
  const req = buildRequest('ping', { x: 1 })
  assert.equal(req.type, 'request')
  assert.equal(typeof req.id, 'string')
  assert.equal(req.method, 'ping')
  assert.deepEqual(req.params, { x: 1 })
  assert.equal(isRequest(req), true)

  const ok = buildSuccessResponse('id1', { pong: true })
  assert.deepEqual(ok, { type: 'response', id: 'id1', ok: true, result: { pong: true } })
  assert.equal(isResponse(ok), true)

  const fail = buildFailureResponse('id1', 'E_X', 'boom')
  assert.deepEqual(fail, { type: 'response', id: 'id1', ok: false, error: { code: 'E_X', message: 'boom' } })

  const ev = buildEvent('ready', { pid: 42 })
  assert.deepEqual(ev, { type: 'event', event: 'ready', payload: { pid: 42 } })
  assert.equal(isEvent(ev), true)
})

test('the boundary is JSON-only: functions do not survive serialization', () => {
  const withFunction = { type: 'event', event: 'x', payload: { fn: () => 1, value: 7 } }
  const decoded = decodeMessage(encodeMessage(withFunction).trimEnd())
  assert.equal('fn' in decoded.payload, false) // function was dropped by JSON
  assert.equal(decoded.payload.value, 7)
})

test('encodeMessage rejects non-object messages', () => {
  assert.throws(() => encodeMessage('a string'), TypeError)
  assert.throws(() => encodeMessage(null), TypeError)
})
