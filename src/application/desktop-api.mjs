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
const UI_SCALE_MIN = 85
const UI_SCALE_MAX = 125

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
  const allowed = new Set(['material', 'frostIntensity', 'transparencyLevel', 'theme', 'liquidGlassStyle', 'glassStrength', 'uiScale', 'uiScaleProfile', 'uiContainerSizes', 'uiLayoutPresetId', 'uiLayoutPresets', 'appearancePreset', 'desktopBackground'])
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
  if ('uiScale' in patch) normalized.uiScale = clampInt(patch.uiScale, UI_SCALE_MIN, UI_SCALE_MAX, NaN)
  if ('uiScaleProfile' in patch) {
    const profile = patch.uiScaleProfile
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'uiScaleProfile must be an object' } }
    }
    const scale = (value) => clampInt(value, UI_SCALE_MIN, UI_SCALE_MAX, NaN)
    normalized.uiScaleProfile = {
      typography: scale(profile.typography),
    }
  }
  if ('uiContainerSizes' in patch) {
    const sizes = patch.uiContainerSizes
    if (!sizes || typeof sizes !== 'object' || Array.isArray(sizes)) {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'uiContainerSizes must be an object' } }
    }
    const normalizedSizes = {}
    for (const [id, size] of Object.entries(sizes)) {
      if (!/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(id) || !size || typeof size !== 'object' || Array.isArray(size)) continue
      const width = clampInt(size.width, 160, 2400, NaN)
      const height = clampInt(size.height, 120, 2000, NaN)
      if (Number.isFinite(width) || Number.isFinite(height)) normalizedSizes[id] = {
        ...(Number.isFinite(width) ? { width } : {}),
        ...(Number.isFinite(height) ? { height } : {}),
      }
    }
    normalized.uiContainerSizes = normalizedSizes
  }
  if ('uiLayoutPresetId' in patch) {
    if (typeof patch.uiLayoutPresetId !== 'string' || !/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(patch.uiLayoutPresetId)) {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'uiLayoutPresetId is invalid' } }
    }
    normalized.uiLayoutPresetId = patch.uiLayoutPresetId
  }
  if ('uiLayoutPresets' in patch) {
    if (!Array.isArray(patch.uiLayoutPresets)) {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'uiLayoutPresets must be an array' } }
    }
    normalized.uiLayoutPresets = patch.uiLayoutPresets.slice(0, 20).flatMap((preset) => {
      if (!preset || typeof preset !== 'object' || Array.isArray(preset) || typeof preset.id !== 'string' || typeof preset.name !== 'string') return []
      if (!/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(preset.id) || preset.id === 'default') return []
      const sizes = {}
      if (preset.uiContainerSizes && typeof preset.uiContainerSizes === 'object' && !Array.isArray(preset.uiContainerSizes)) {
        for (const [id, size] of Object.entries(preset.uiContainerSizes)) {
          if (!/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(id) || !size || typeof size !== 'object' || Array.isArray(size)) continue
          const width = clampInt(size.width, 160, 2400, NaN)
          const height = clampInt(size.height, 120, 2000, NaN)
          if (Number.isFinite(width) || Number.isFinite(height)) sizes[id] = { ...(Number.isFinite(width) ? { width } : {}), ...(Number.isFinite(height) ? { height } : {}) }
        }
      }
      const profile = preset.uiScaleProfile
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return []
      const scale = (value) => clampInt(value, UI_SCALE_MIN, UI_SCALE_MAX, NaN)
      return [{
        id: preset.id,
        name: preset.name.trim().slice(0, 48),
        glassStrength: clampInt(preset.glassStrength, 0, 100, 30),
        liquidGlassStyle: preset.liquidGlassStyle === 'tinted' ? 'tinted' : 'clear',
        uiScaleProfile: { typography: scale(profile.typography) },
        uiContainerSizes: sizes,
      }]
    })
  }
  if ('appearancePreset' in patch) {
    if (patch.appearancePreset !== 'default' && patch.appearancePreset !== 'custom') {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'appearancePreset must be default or custom' } }
    }
    normalized.appearancePreset = patch.appearancePreset
  }
  if ('desktopBackground' in patch) {
    const background = patch.desktopBackground
    if (!background || typeof background !== 'object' || Array.isArray(background) || background.kind !== 'default') {
      return { ok: false, error: { code: ERROR_CODES.INVALID_REQUEST, message: 'desktopBackground may only be reset through the dedicated desktop background controls' } }
    }
    normalized.desktopBackground = { kind: 'default' }
  }
  return { ok: true, patch: normalized }
}
