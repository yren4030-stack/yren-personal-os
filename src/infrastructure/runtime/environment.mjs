/**
 * Explicit child-process environment whitelist seam.
 *
 * The runtime bridge must NOT forward the full parent environment by default.
 * Only a minimal set of variables a Windows/Node child demonstrably needs is
 * allowed, plus caller-supplied test/development variables. Secrets (API keys,
 * tokens, passwords, credentials) are never forwarded by default.
 */

const DEFAULT_ALLOWED = Object.freeze(['PATH', 'SYSTEMROOT', 'TEMP', 'TMP'])

export const CHILD_ENVIRONMENT_ALLOWED_KEYS = DEFAULT_ALLOWED

/**
 * Build a child environment containing only the whitelisted standard variables
 * plus any explicit caller-supplied extras.
 * @param {Record<string, string|number|boolean>} [extra]
 */
export function buildChildEnvironment(extra = {}) {
  const env = {}
  for (const key of DEFAULT_ALLOWED) {
    const value = process.env[key]
    if (value !== undefined) env[key] = value
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === null) continue
    env[key] = String(value)
  }
  return env
}
