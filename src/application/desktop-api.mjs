/**
 * Personal OS-owned Desktop API V1 contract.
 *
 * Stable, JSON-safe result envelope + error codes + input validation that the
 * Electron Main entry re-validates (the Renderer is untrusted). The Renderer
 * only ever sees `window.personalOS.v1` — never repositories, services, or the
 * raw DatabaseSync/DSH objects.
 */

export const DESKTOP_API_VERSION = 'v1'

export const ERROR_CODES = Object.freeze({
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROPOSAL_NOT_FOUND: 'PROPOSAL_NOT_FOUND',
  PROPOSAL_NOT_PENDING: 'PROPOSAL_NOT_PENDING',
  AGENT_TURN_FAILED: 'AGENT_TURN_FAILED',
  AGENT_OUTPUT_MISSING: 'AGENT_OUTPUT_MISSING',
  INVALID_AGENT_PROPOSAL: 'INVALID_AGENT_PROPOSAL',
  RUNTIME_UNAVAILABLE: 'RUNTIME_UNAVAILABLE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
})

/** Success envelope. */
export function ok(data) {
  return { ok: true, data }
}

/** Failure envelope. `retryable` is optional and only for transient conditions. */
export function fail(code, message, retryable) {
  const error = { code, message }
  if (retryable !== undefined) error.retryable = retryable
  return { ok: false, error }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export function validateId(value, name) {
  if (!isNonEmptyString(value)) {
    return fail(ERROR_CODES.INVALID_REQUEST, `${name} must be a non-empty string`)
  }
  return null
}

/** Validate a projectId / proposalId; returns a failure envelope or null. */
export function validateProjectId(id) {
  return validateId(id, 'projectId')
}

export function validateProposalId(id) {
  return validateId(id, 'proposalId')
}

const MATERIAL_MODES = new Set(['frosted', 'transparent'])
const THEMES = new Set(['light', 'dark', 'system'])

/** Clamp an integer to [min, max]. */
function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * Validate and normalize an appearance patch. Returns
 * `{ ok: true, patch }` or `{ ok: false, error }`. Unknown fields are rejected.
 */
export function normalizeAppearancePatch(patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'appearance patch must be an object' } }
  }
  const allowed = new Set(['material', 'frostIntensity', 'transparencyLevel', 'theme', 'liquidGlassStyle', 'glassStrength'])
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: `unexpected appearance field: ${key}` } }
    }
  }
  const normalized = {}
  if ('material' in patch) {
    if (!MATERIAL_MODES.has(patch.material)) {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'material must be frosted or transparent' } }
    }
    normalized.material = patch.material
  }
  if ('frostIntensity' in patch) {
    normalized.frostIntensity = clampInt(patch.frostIntensity, 0, 100, NaN)
  }
  if ('transparencyLevel' in patch) {
    normalized.transparencyLevel = clampInt(patch.transparencyLevel, 0, 100, NaN)
  }
  if ('theme' in patch) {
    if (!THEMES.has(patch.theme)) {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'theme must be light, dark, or system' } }
    }
    normalized.theme = patch.theme
  }
  if ('liquidGlassStyle' in patch) {
    if (patch.liquidGlassStyle !== 'clear' && patch.liquidGlassStyle !== 'tinted') {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'liquidGlassStyle must be clear or tinted' } }
    }
    normalized.liquidGlassStyle = patch.liquidGlassStyle
  }
  if ('glassStrength' in patch) normalized.glassStrength = clampInt(patch.glassStrength, 0, 100, NaN)
  return { ok: true, patch: normalized }
}
