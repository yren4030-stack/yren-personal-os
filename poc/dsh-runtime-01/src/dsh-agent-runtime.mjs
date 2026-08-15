import { randomUUID } from 'node:crypto'
import { RuntimeError, RuntimeState, assertAgentRuntimePort } from './runtime-contract.mjs'

const DEFAULT_SDK_PACKAGE = '@deepseek-ai/dsh-sdk-client'

export class DeepSeekHarnessAdapter {
  #options
  #sdkModule
  #harness
  #state = RuntimeState.IDLE
  #closed = false
  #sessions = new Set()
  #listeners = new Map()

  constructor(options) {
    if (!options?.launch?.command) throw new TypeError('launch.command is required')
    this.#options = options
    this.#sdkModule = options.sdkModule
  }

  async getRuntimeStatus() {
    return {
      state: this.#closed ? RuntimeState.CLOSED : this.#state,
      adapter: 'deepseek-harness',
      runtimeVersion: this.#options.runtimeVersion,
      runtimeCommit: this.#options.runtimeCommit,
    }
  }

  async createSession(input = {}) {
    this.#ensureOpen()
    const sessionId = input.sessionId ?? `pos-session-${randomUUID().replaceAll('-', '')}`
    this.#sessions.add(sessionId)
    return { sessionId, adapter: 'deepseek-harness' }
  }

  async prompt(sessionId, input) {
    this.#ensureOpen()
    if (!this.#sessions.has(sessionId)) {
      throw new RuntimeError('session-not-found', `Unknown session: ${sessionId}`)
    }

    const text = typeof input === 'string' ? input : input?.text
    if (typeof text !== 'string' || text.length === 0) {
      throw new TypeError('prompt text must be a non-empty string')
    }

    const runId = `pos-run-${randomUUID().replaceAll('-', '')}`
    const harness = await this.#getHarness()
    this.#state = RuntimeState.RUNNING
    this.#emit(sessionId, { type: 'runtime-status', runId, state: RuntimeState.RUNNING })

    try {
      const result = await harness.run(text, {
        sessionId,
        onNotification: notification => {
          for (const event of mapNotification(notification, runId)) this.#emit(sessionId, event)
        },
      })
      this.#state = RuntimeState.IDLE
      this.#emit(sessionId, { type: 'runtime-status', runId, state: RuntimeState.IDLE })
      return {
        runId,
        sessionId: result.sessionId,
        accepted: true,
        completed: true,
        finalResponse: result.finalResponse,
      }
    } catch (error) {
      this.#state = RuntimeState.UNAVAILABLE
      this.#emit(sessionId, {
        type: 'runtime-error',
        runId,
        error: mapRuntimeError(error),
      })
      throw mapRuntimeError(error)
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
    if (this.#closed) return
    this.#closed = true
    try {
      await this.#harness?.close()
    } finally {
      this.#state = RuntimeState.CLOSED
      this.#listeners.clear()
    }
  }

  async #getHarness() {
    if (this.#harness) return this.#harness
    const sdk = this.#sdkModule ?? await import(this.#options.sdkPackage ?? DEFAULT_SDK_PACKAGE)
    if (typeof sdk?.DeepSeekHarness !== 'function') {
      throw new RuntimeError('runtime-protocol-error', 'DeepSeekHarness SDK export is unavailable')
    }
    this.#harness = new sdk.DeepSeekHarness({
      launch: {
        command: this.#options.launch.command,
        args: this.#options.launch.args ?? [],
        cwd: this.#options.launch.cwd,
        env: this.#options.launch.env,
        requestTimeoutMs: this.#options.launch.requestTimeoutMs,
        shutdownTimeoutMs: this.#options.launch.shutdownTimeoutMs,
        disposeEofGraceMs: this.#options.launch.disposeEofGraceMs,
        disposeGraceMs: this.#options.launch.disposeGraceMs,
      },
      cwd: this.#options.cwd,
      provider: this.#options.provider,
      model: this.#options.model,
      maxTokens: this.#options.maxTokens,
    })
    return this.#harness
  }

  #emit(sessionId, event) {
    for (const listener of this.#listeners.get(sessionId) ?? []) listener(event)
  }

  #ensureOpen() {
    if (this.#closed) throw new RuntimeError('runtime-unavailable', 'Runtime is closed')
  }
}

function mapNotification(notification, runId) {
  const method = notification?.method
  const params = notification?.params ?? {}
  if (method === 'session.status') {
    return [{
      type: 'runtime-status',
      runId,
      state: params.status === 'running' ? RuntimeState.RUNNING : RuntimeState.IDLE,
      runtimeSessionId: params.sessionId,
    }]
  }
  if (method === 'session.event') {
    return [{
      type: 'runtime-event',
      runId,
      runtimeSessionId: params.sessionId,
      event: sanitizeSessionEvent(params.event),
    }]
  }
  return [{
    type: 'runtime-notification',
    runId,
    method: typeof method === 'string' ? method : 'unknown',
  }]
}

function sanitizeSessionEvent(event) {
  if (!event || typeof event !== 'object') return { type: 'unknown' }
  return {
    type: typeof event.type === 'string' ? event.type : 'unknown',
  }
}

function mapRuntimeError(error) {
  if (error instanceof RuntimeError) return error
  const name = error?.name
  if (name === 'TransportClosedError') {
    return new RuntimeError('runtime-transport-lost', 'DeepSeek Harness runtime transport closed', { cause: error })
  }
  if (name === 'RequestTimeoutError') {
    return new RuntimeError('runtime-timeout', 'DeepSeek Harness runtime request timed out', { cause: error })
  }
  if (name === 'SdkProtocolError' || name === 'JsonRpcResponseError') {
    return new RuntimeError('runtime-protocol-error', 'DeepSeek Harness runtime protocol error', { cause: error })
  }
  return new RuntimeError('agent-failed', 'DeepSeek Harness agent run failed', { cause: error })
}

assertAgentRuntimePort(new DeepSeekHarnessAdapter({
  launch: { command: 'node' },
  sdkModule: { DeepSeekHarness: class {} },
}))
