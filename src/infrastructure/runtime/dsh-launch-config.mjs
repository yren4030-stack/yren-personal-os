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
import { buildChildEnvironment } from './environment.mjs'

const REAL_DSH_HOST_CHILD_ENTRY = join(dirname(fileURLToPath(import.meta.url)), 'real-dsh-host-child.mjs')

export function resolveRealDshHostChildEntry() {
  return REAL_DSH_HOST_CHILD_ENTRY
}

/**
 * Build a RuntimeProcessBridge-compatible launch config for the real DSH host
 * child. `dshRoot` is supplied by the caller (e.g. an Electron main, a CLI
 * argument, or a validation runner); it is never read from a hardcoded path.
 */
export function createDeepSeekHarnessLaunchConfig({ dshRoot, executable = process.execPath, extraEnv = {} }) {
  if (!dshRoot || typeof dshRoot !== 'string') {
    throw new TypeError('createDeepSeekHarnessLaunchConfig requires a dshRoot string')
  }
  return {
    executable,
    args: ['--import', 'tsx/esm', REAL_DSH_HOST_CHILD_ENTRY],
    cwd: dshRoot,
    env: buildChildEnvironment({ DSH_ROOT: dshRoot, ...extraEnv }),
  }
}
