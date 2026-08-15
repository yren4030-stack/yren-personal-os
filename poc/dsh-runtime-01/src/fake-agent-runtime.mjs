import { RuntimeError, RuntimeState, assertAgentRuntimePort } from './runtime-contract.mjs'

export class FakeAgentRuntime {
  #state = RuntimeState.IDLE
  #sessions = new Map()
  #listeners = new Map()
  #nextSession = 1
  #nextRun = 1

  async getRuntimeStatus() {
    return { state: this.#state, adapter: 'fake' }
  }

  async createSession(input = {}) {
    this.#ensureOpen()
    const sessionId = input.sessionId ?? `fake-session-${this.#nextSession++}`
    this.#sessions.set(sessionId, { id: sessionId, messages: [] })
    return { sessionId, adapter: 'fake' }
  }

  async prompt(sessionId, input) {
    this.#ensureOpen()
    const session = this.#sessions.get(sessionId)
    if (!session) throw new RuntimeError('session-not-found', `Unknown session: ${sessionId}`)

    const runId = `fake-run-${this.#nextRun++}`
    const text = typeof input === 'string' ? input : input?.text
    const response = `fake:${text ?? ''}`

    this.#state = RuntimeState.RUNNING
    this.#emit(sessionId, { type: 'runtime-status', runId, state: RuntimeState.RUNNING })
    session.messages.push({ role: 'user', text: text ?? '', runId })
    this.#emit(sessionId, { type: 'user-message', runId, text: text ?? '' })
    session.messages.push({ role: 'assistant', text: response, runId })
    this.#emit(sessionId, { type: 'assistant-message', runId, text: response })
    this.#state = RuntimeState.IDLE
    this.#emit(sessionId, { type: 'runtime-status', runId, state: RuntimeState.IDLE })

    return {
      runId,
      sessionId,
      accepted: true,
      completed: true,
      finalResponse: response,
    }
  }

  subscribe(sessionId, listener) {
    this.#ensureOpen()
    const listeners = this.#listeners.get(sessionId) ?? new Set()
    listeners.add(listener)
    this.#listeners.set(sessionId, listeners)
    return () => listeners.delete(listener)
  }

  async close() {
    this.#state = RuntimeState.CLOSED
    this.#listeners.clear()
  }

  #emit(sessionId, event) {
    for (const listener of this.#listeners.get(sessionId) ?? []) listener(event)
  }

  #ensureOpen() {
    if (this.#state === RuntimeState.CLOSED) {
      throw new RuntimeError('runtime-unavailable', 'Runtime is closed')
    }
  }
}

assertAgentRuntimePort(new FakeAgentRuntime())
