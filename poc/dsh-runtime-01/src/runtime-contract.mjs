export const RuntimeState = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  CLOSED: 'closed',
  UNAVAILABLE: 'unavailable',
})

export class RuntimeError extends Error {
  constructor(code, message, options = {}) {
    super(message, options)
    this.name = 'RuntimeError'
    this.code = code
  }
}

export function assertAgentRuntimePort(runtime) {
  const required = [
    'getRuntimeStatus',
    'createSession',
    'prompt',
    'subscribe',
    'close',
  ]

  for (const method of required) {
    if (typeof runtime?.[method] !== 'function') {
      throw new TypeError(`AgentRuntimePort missing method: ${method}`)
    }
  }

  return runtime
}
