/**
 * RuntimeProcessBridge — Personal OS-owned boundary to a dedicated runtime
 * child process over framed JSON-lines stdio.
 *
 * Responsibilities: spawn, stdin write, stdout line parse, request/response
 * correlation, ready handshake, startup/request/shutdown timeouts, graceful
 * shutdown, unexpected-exit (crash) detection, explicit restart, bounded
 * stderr capture, and lifecycle state.
 */
import { EventEmitter } from 'node:events'
import { spawn } from 'node:child_process'
import readline from 'node:readline'
import { randomUUID } from 'node:crypto'
import { encodeMessage, decodeMessage } from './protocol.mjs'

export const RUNTIME_BRIDGE_STATES = Object.freeze({
  idle: 'idle',
  starting: 'starting',
  ready: 'ready',
  stopping: 'stopping',
  stopped: 'stopped',
  crashed: 'crashed',
})

/**
 * Minimal redaction for obvious credential/token forms in captured child
 * stderr. Applied at capture time so stored/printed stderr never contains
 * API keys, tokens, passwords, or authorization headers.
 */
export function redactSensitive(text) {
  return String(text)
    .replace(/\bsk-[A-Za-z0-9_-]{6,}\b/g, 'sk-***')
    .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|authorization)\b\s*[:=]\s*["']?(?:bearer\s+)?[^\s"',;]+/gi, '$1=***')
    .replace(/\bbearer\s+[a-z0-9._~+/=-]+/gi, 'Bearer ***')
}

export class RuntimeProcessBridge extends EventEmitter {
  constructor({
    executable,
    args = [],
    cwd,
    env,
    startupTimeoutMs = 10000,
    requestTimeoutMs = 30000,
    shutdownTimeoutMs = 5000,
    stderrMaxChars = 16000,
  }) {
    super()
    if (!executable) throw new TypeError('RuntimeProcessBridge requires an executable')
    this.executable = executable
    this.args = [...args]
    this.cwd = cwd
    this.env = env
    this.startupTimeoutMs = startupTimeoutMs
    this.requestTimeoutMs = requestTimeoutMs
    this.shutdownTimeoutMs = shutdownTimeoutMs
    this.stderrMaxChars = stderrMaxChars

    this.state = RUNTIME_BRIDGE_STATES.idle
    this.child = null
    this.pending = new Map() // id -> { resolve, reject, timer, method }
    this.stderrText = ''

    this._startupTimer = null
    this._readyResolve = null
    this._readyReject = null
    this._rl = null
  }

  get pid() {
    return this.child && this.child.pid ? this.child.pid : null
  }

  get stderr() {
    return this.stderrText
  }

  async start() {
    if (this.state === RUNTIME_BRIDGE_STATES.ready) return this
    if (this.state === RUNTIME_BRIDGE_STATES.starting || this.state === RUNTIME_BRIDGE_STATES.stopping) {
      throw new Error(`cannot start while state is ${this.state}`)
    }
    this.state = RUNTIME_BRIDGE_STATES.starting
    this.emit('state', this.state)

    let child
    try {
      child = spawn(this.executable, this.args, {
        cwd: this.cwd,
        env: this.env,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (error) {
      this.state = RUNTIME_BRIDGE_STATES.crashed
      this.emit('state', this.state)
      this.emit('crash', { error })
      throw error
    }
    this.child = child
    this._attach(child)

    const readyPromise = new Promise((resolve, reject) => {
      this._readyResolve = resolve
      this._readyReject = reject
    })

    this._startupTimer = setTimeout(() => {
      this._rejectStartup(new Error(`startup timeout after ${this.startupTimeoutMs}ms`))
      if (this.child) {
        try {
          this.child.kill('SIGKILL')
        } catch {
          // ignore
        }
      }
    }, this.startupTimeoutMs)

    try {
      await readyPromise
    } catch (error) {
      clearTimeout(this._startupTimer)
      this._startupTimer = null
      this._readyResolve = null
      this._readyReject = null
      if (this.state === RUNTIME_BRIDGE_STATES.starting) {
        this.state = RUNTIME_BRIDGE_STATES.crashed
        this.emit('state', this.state)
      }
      throw error
    }

    clearTimeout(this._startupTimer)
    this._startupTimer = null
    this._readyResolve = null
    this._readyReject = null
    this.state = RUNTIME_BRIDGE_STATES.ready
    this.emit('state', this.state)
    this.emit('ready', { pid: child.pid })
    return this
  }

  request(method, params = {}) {
    if (this.state !== RUNTIME_BRIDGE_STATES.ready) {
      return Promise.reject(new Error(`bridge not ready (state: ${this.state})`))
    }
    const id = randomUUID()
    const message = { type: 'request', id, method, params }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`request timeout after ${this.requestTimeoutMs}ms: ${method}`))
      }, this.requestTimeoutMs)
      this.pending.set(id, { resolve, reject, timer, method })
      try {
        this.child.stdin.write(encodeMessage(message))
      } catch (error) {
        clearTimeout(timer)
        this.pending.delete(id)
        reject(error)
      }
    })
  }

  async stop() {
    if (this.state === RUNTIME_BRIDGE_STATES.idle || this.state === RUNTIME_BRIDGE_STATES.stopped) return
    if (this.state === RUNTIME_BRIDGE_STATES.stopping) return
    if (this.state === RUNTIME_BRIDGE_STATES.crashed) {
      this.state = RUNTIME_BRIDGE_STATES.stopped
      this.emit('state', this.state)
      return
    }

    this.state = RUNTIME_BRIDGE_STATES.stopping
    this.emit('state', this.state)

    const child = this.child
    if (!child) {
      this.state = RUNTIME_BRIDGE_STATES.stopped
      this.emit('state', this.state)
      return
    }

    const exited = new Promise((resolve) => {
      const onDone = () => resolve()
      this.once('stopped', onDone)
      this.once('crash', onDone)
    })

    if (child.stdin && child.stdin.writable) {
      try {
        child.stdin.write(encodeMessage({ type: 'request', id: randomUUID(), method: 'shutdown', params: {} }))
      } catch {
        // fall through to force kill
      }
    }

    const killTimer = setTimeout(() => {
      if (this.child) {
        try {
          this.child.kill('SIGKILL')
        } catch {
          // ignore
        }
      }
    }, this.shutdownTimeoutMs)

    await exited
    clearTimeout(killTimer)
    this.state = RUNTIME_BRIDGE_STATES.stopped
    this.emit('state', this.state)
  }

  async restart() {
    if (this.state === RUNTIME_BRIDGE_STATES.ready || this.state === RUNTIME_BRIDGE_STATES.starting || this.state === RUNTIME_BRIDGE_STATES.stopping) {
      await this.stop()
    }
    return this.start()
  }

  close() {
    return this.stop()
  }

  _attach(child) {
    const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
    this._rl = rl
    rl.on('line', (line) => this._handleLine(line))

    child.stderr.on('data', (chunk) => {
      // Bounded (stderrMaxChars) and redacted at capture: stored/printed
      // stderr never contains credential/token forms.
      this.stderrText = (this.stderrText + redactSensitive(chunk.toString())).slice(-this.stderrMaxChars)
    })

    child.on('error', (error) => {
      this._rejectStartup(error)
      this._failPending(error)
      this._teardownChild()
      this.state = RUNTIME_BRIDGE_STATES.crashed
      this.emit('state', this.state)
      this.emit('crash', { error })
    })

    child.on('exit', (code, signal) => {
      this._onExit(code, signal)
    })
  }

  _handleLine(line) {
    let message
    try {
      message = decodeMessage(line)
    } catch {
      this.emit('protocol-error', { reason: 'malformed-json' })
      return
    }
    if (message === null || typeof message !== 'object') {
      // non-framed noise line from the child; ignore
      return
    }
    if (message.type === 'response') {
      this._handleResponse(message)
    } else if (message.type === 'event') {
      this._handleEvent(message)
    } else if (message.type === 'request') {
      this.emit('unexpected-request', message)
    } else {
      this.emit('protocol-error', { reason: 'unknown-message-type' })
    }
  }

  _handleResponse(message) {
    const entry = this.pending.get(message.id)
    if (!entry) {
      this.emit('stale-response', message)
      return
    }
    clearTimeout(entry.timer)
    this.pending.delete(message.id)
    if (message.ok) {
      entry.resolve(message.result)
    } else {
      const error = new Error((message.error && message.error.message) || 'runtime request failed')
      error.code = (message.error && message.error.code) || 'RUNTIME_ERROR'
      entry.reject(error)
    }
  }

  _handleEvent(message) {
    if (message.event === 'ready') {
      if (this._readyResolve) {
        const resolve = this._readyResolve
        this._readyResolve = null
        this._readyReject = null
        resolve(message.payload || {})
      }
      return
    }
    this.emit('event', message)
  }

  _rejectStartup(error) {
    // Attach the bounded, redacted child stderr to the startup error so the
    // Main-side caller can surface the child's fatal reason in the console.
    if (error && typeof error === 'object') {
      error.stderr = this.stderrText
    }
    if (this._readyReject) {
      const reject = this._readyReject
      this._readyResolve = null
      this._readyReject = null
      reject(error)
    }
  }

  _failPending(error) {
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer)
      entry.reject(error)
    }
    this.pending.clear()
  }

  _onExit(code, signal) {
    this._failPending(new Error(`runtime child exited (code=${code}, signal=${signal})`))
    this._teardownChild()

    if (this.state === RUNTIME_BRIDGE_STATES.stopping || this.state === RUNTIME_BRIDGE_STATES.stopped) {
      this.state = RUNTIME_BRIDGE_STATES.stopped
      this.emit('state', this.state)
      this.emit('stopped', { code, signal })
      return
    }

    if (this.state === RUNTIME_BRIDGE_STATES.starting) {
      this._rejectStartup(new Error(`runtime child exited before ready (code=${code}, signal=${signal})`))
    }

    this.state = RUNTIME_BRIDGE_STATES.crashed
    this.emit('state', this.state)
    this.emit('crash', { code, signal })
  }

  _teardownChild() {
    if (this._rl) {
      try {
        this._rl.close()
      } catch {
        // ignore
      }
      this._rl = null
    }
    this.child = null
    if (this._startupTimer) {
      clearTimeout(this._startupTimer)
      this._startupTimer = null
    }
  }
}
