/**
 * Desktop development resolver for the DSH Host child entry.
 *
 * The child entry must NEVER be derived from a bundler-generated module
 * location: after Vite bundles dsh-launch-config into Electron Main,
 * import.meta.url belongs to .vite/build/main.js, so a source-sibling guess
 * would point at .vite/build/real-dsh-host-child.mjs (which does not exist).
 *
 * Desktop Main therefore resolves the repository-owned source child explicitly
 * from stable dev contexts (Electron app path, bundle dir, cwd), verifying the
 * file exists before any spawn. A future packaged runtime can supply a
 * different stable resource entry through the same launch-config contract.
 */
import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'

const CHILD_REL = join('src', 'infrastructure', 'runtime', 'real-dsh-host-child.mjs')

/**
 * @param {object} ctx
 * @param {string} ctx.appPath    Electron app.getAppPath() (Forge dev: apps/desktop)
 * @param {string} ctx.bundleDir  __dirname of the bundled Main (…/.vite/build)
 * @param {string} ctx.cwd        process.cwd()
 * @returns {string|null} first existing candidate, or null when none exists
 */
export function resolveDesktopHostChildEntry({ appPath, bundleDir, cwd }) {
  const candidates = [
    // Forge dev: app path is <repo>/apps/desktop → repo root is two levels up.
    join(dirname(dirname(appPath)), CHILD_REL),
    // Bundled Main at <repo>/apps/desktop/.vite/build → four levels up.
    join(bundleDir, '..', '..', '..', '..', CHILD_REL),
    // Host runs forge from <repo>/apps/desktop → cwd two levels up.
    join(cwd, '..', '..', CHILD_REL),
  ]
  return candidates.find((path) => existsSync(path)) ?? null
}
