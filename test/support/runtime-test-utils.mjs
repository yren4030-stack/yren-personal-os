import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRuntimeProcessBridge } from '../../src/infrastructure/runtime/index.mjs'
import { buildChildEnvironment } from '../../src/infrastructure/runtime/environment.mjs'

export const TEST_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const fixtureChildPath = join(dirname(fileURLToPath(import.meta.url)), 'fixture-child.mjs')

/** Start a bridge to the fixture child; registers stop() as a test teardown. */
export function startBridge(t, { env = {}, startupTimeoutMs = 5000, requestTimeoutMs = 3000, shutdownTimeoutMs = 3000 } = {}) {
  const bridge = createRuntimeProcessBridge({
    executable: process.execPath,
    args: [fixtureChildPath],
    cwd: TEST_ROOT,
    env: buildChildEnvironment({ ...env }),
    startupTimeoutMs,
    requestTimeoutMs,
    shutdownTimeoutMs,
  })
  t.after(async () => {
    try {
      await bridge.stop()
    } catch {
      // ignore
    }
  })
  return bridge
}

/** Resolve once on an EventEmitter 'event'. */
export function once(emitter, event) {
  return new Promise((resolve) => emitter.once(event, resolve))
}

/** Best-effort existence check for a Windows PID (signal 0). */
export function pidExists(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
