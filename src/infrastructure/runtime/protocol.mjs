/**
 * Personal OS-owned cross-process runtime protocol.
 *
 * One framed message per line over stdio. Framing is a fixed text prefix
 * followed by exactly one JSON object. Only JSON-safe plain data may cross this
 * boundary — never Error instances, functions, class instances, database or
 * filesystem handles, or SDK objects.
 */
import { randomUUID } from 'node:crypto'

export const FRAMING_PREFIX = 'POSIPC '

export class ProtocolError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ProtocolError'
  }
}

/** Serialize a JSON-safe message into one framed line ending with a newline. */
export function encodeMessage(message) {
  if (message === null || typeof message !== 'object') {
    throw new TypeError('protocol message must be a JSON-safe object')
  }
  return `${FRAMING_PREFIX}${JSON.stringify(message)}\n`
}

/**
 * Parse one framed line.
 * @returns {object|null} the decoded message, or `null` if the line does not
 *   carry the framing prefix (treated as non-protocol noise).
 * @throws {ProtocolError} if the line is framed but not valid JSON.
 */
export function decodeMessage(line) {
  if (typeof line !== 'string') return null
  if (!line.startsWith(FRAMING_PREFIX)) return null
  const payload = line.slice(FRAMING_PREFIX.length)
  let parsed
  try {
    parsed = JSON.parse(payload)
  } catch {
    throw new ProtocolError('malformed framed message: invalid JSON')
  }
  return parsed
}

export function buildRequest(method, params = {}) {
  return { type: 'request', id: randomUUID(), method, params }
}

export function buildSuccessResponse(id, result = {}) {
  return { type: 'response', id, ok: true, result }
}

export function buildFailureResponse(id, code, message) {
  return { type: 'response', id, ok: false, error: { code, message } }
}

export function buildEvent(event, payload = {}) {
  return { type: 'event', event, payload }
}

export function isRequest(message) {
  return !!message && message.type === 'request'
}

export function isResponse(message) {
  return !!message && message.type === 'response'
}

export function isEvent(message) {
  return !!message && message.type === 'event'
}
