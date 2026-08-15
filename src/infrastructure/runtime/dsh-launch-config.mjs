/**
 * Real DSH source/runtime descriptor seam.
 *
 * The DSH source location is always caller-supplied (no hardcoded machine
 * paths, no Developer Harness install path). The child runs the frozen DSH
 * TypeScript source plane through tsx (`node --import tsx/esm`), with cwd set
 * to the DSH root so tsx resolves workspace imports via that repo's tsconfig.
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { buildChildEnvironment } from './environment.mjs'

const REAL_DSH_HOST_CHILD_ENTRY = join(dirname(fileURLToPath(import.meta.url)), 'real-dsh-host-child.mjs')

export function resolveRealDshHostChildEntry() {
  return REAL_DSH_HOST_CHILD_ENTRY
}

/**
 * Build a RuntimeProcessBridge-compatible launch config for the real DSH host
 * child. `dshRoot` is supplied by the caller (e.g. an Electron main, a CLI
 * argument, or a validation runner); it is never read from a hardcoded path.
 *
 * `hostChildEntry`: explicit child-entry path (Desktop Main supplies the
 * repository-owned source entry resolved outside the Vite bundle). When
 * omitted, the source-sibling default applies — correct when this module runs
 * as source (03C tests/validators), but NEVER correct inside a bundled
 * Electron Main, where import.meta.url points at .vite/build/. The resolved
 * entry MUST exist or the config throws CHILD_ENTRY_MISSING before any spawn
 * (fail closed).
 *
 * Electron main process caveat: inside Electron, `process.execPath` is the
 * Electron binary, NOT Node. Spawning it with Node CLI flags would boot a
 * second Electron app that never speaks the stdio protocol. When running
 * under Electron we therefore set ELECTRON_RUN_AS_NODE=1 on the child so the
 * same binary behaves as plain Node (the documented Electron pattern).
 * `isElectron` may be injected explicitly for tests.
 */
export function createDeepSeekHarnessLaunchConfig({ dshRoot, executable = process.execPath, hostChildEntry, extraEnv = {}, isElectron }) {
  if (!dshRoot || typeof dshRoot !== 'string') {
    throw new TypeError('createDeepSeekHarnessLaunchConfig requires a dshRoot string')
  }
  const entry = hostChildEntry !== undefined ? hostChildEntry : REAL_DSH_HOST_CHILD_ENTRY
  if (!existsSync(entry)) {
    const error = new Error(`DSH host child entry does not exist: ${entry}`)
    error.code = 'CHILD_ENTRY_MISSING'
    throw error
  }
  const runningInElectron = isElectron === undefined ? Boolean(process.versions && process.versions.electron) : Boolean(isElectron)
  const envExtra = { DSH_ROOT: dshRoot, ...extraEnv }
  if (runningInElectron) {
    envExtra.ELECTRON_RUN_AS_NODE = '1'
  }
  return {
    executable,
    args: ['--import', 'tsx/esm', entry],
    cwd: dshRoot,
    env: buildChildEnvironment(envExtra),
  }
}
