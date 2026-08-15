/**
 * DeepSeekHarnessHostBinding — infrastructure binding that owns the lifecycle
 * of a Real DSH Host child through the generic RuntimeProcessBridge.
 *
 * It exposes only Personal OS-owned methods (hostInfo, approvalStart,
 * clientResponse, ping, start/stop/restart) and forwards unsolicited DSH host
 * frames to subscribers via the bridge's generic `event` envelope. It never
 * reaches into DSH internals and never crosses a non-JSON-safe value.
 */
import { RuntimeProcessBridge } from './runtime-process-bridge.mjs'
import { createDeepSeekHarnessLaunchConfig } from './dsh-launch-config.mjs'

export class DeepSeekHarnessHostBinding {
  constructor({
    dshRoot,
    executable,
    extraEnv = {},
    startupTimeoutMs = 30000,
    requestTimeoutMs = 30000,
    shutdownTimeoutMs = 10000,
  }) {
    this.dshRoot = dshRoot
    const config = createDeepSeekHarnessLaunchConfig({ dshRoot, executable, extraEnv })
    this.bridge = new RuntimeProcessBridge({
      ...config,
      startupTimeoutMs,
      requestTimeoutMs,
      shutdownTimeoutMs,
    })
  }

  get pid() {
    return this.bridge.pid
  }

  get state() {
    return this.bridge.state
  }

  async start() {
    return this.bridge.start()
  }

  async stop() {
    return this.bridge.stop()
  }

  async restart() {
    return this.bridge.restart()
  }

  close() {
    return this.bridge.close()
  }

  on(event, handler) {
    this.bridge.on(event, handler)
    return this
  }

  once(event, handler) {
    this.bridge.once(event, handler)
    return this
  }

  off(event, handler) {
    this.bridge.off(event, handler)
    return this
  }

  async ping() {
    return this.bridge.request('ping')
  }

  async hostInfo() {
    return this.bridge.request('dsh-host-info')
  }

  async approvalStart(params = {}) {
    return this.bridge.request('approval-start', params)
  }

  async clientResponse(params) {
    return this.bridge.request('client-response', params)
  }
}
