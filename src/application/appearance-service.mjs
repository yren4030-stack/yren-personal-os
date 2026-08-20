/**
 * AppearanceSettingsService — owns the desktop presentation preferences
 * (theme, Liquid Glass optical profile, plus legacy material fields kept for
 * backward compatibility). Non-sensitive preferences persisted through an
 * injectable storage adapter owned by the Desktop Main process (never the
 * Renderer).
 *
 * The legacy fields (material / frostIntensity / transparencyLevel) remain in
 * the persisted shape for compatibility but no longer drive the user-facing
 * UI; the final appearance is defined by `theme` + `liquidGlassStyle`
 * ('clear' | 'tinted').
 */

export const UI_SCALE_RANGE = Object.freeze({ min: 85, max: 125, default: 100 })
export const APPEARANCE_PRESETS = Object.freeze({ default: 'default', custom: 'custom' })
export const DEFAULT_UI_SCALE_PROFILE = Object.freeze({
  mode: 'unified',
  unified: UI_SCALE_RANGE.default,
  typography: UI_SCALE_RANGE.default,
  width: UI_SCALE_RANGE.default,
  height: UI_SCALE_RANGE.default,
  verticalSpacing: UI_SCALE_RANGE.default,
  horizontalSpacing: UI_SCALE_RANGE.default,
})
export const DEFAULT_UI_CONTAINER_SIZES = Object.freeze({})
export const DEFAULT_UI_LAYOUT_PRESETS = Object.freeze([])

export const DEFAULT_APPEARANCE = Object.freeze({
  material: 'frosted',
  frostIntensity: 60,
  transparencyLevel: 40,
  theme: 'light',
  liquidGlassStyle: 'clear',
  glassStrength: 30,
  uiScale: UI_SCALE_RANGE.default,
  uiScaleProfile: DEFAULT_UI_SCALE_PROFILE,
  uiContainerSizes: DEFAULT_UI_CONTAINER_SIZES,
  uiLayoutPresetId: 'default',
  uiLayoutPresets: DEFAULT_UI_LAYOUT_PRESETS,
  appearancePreset: APPEARANCE_PRESETS.default,
  customAppearance: Object.freeze({ glassStrength: 30, uiScaleProfile: DEFAULT_UI_SCALE_PROFILE, uiContainerSizes: DEFAULT_UI_CONTAINER_SIZES }),
  desktopBackground: Object.freeze({ kind: 'default' }),
})

export class AppearanceService {
  /**
   * @param {{ load: () => object, save: (state: object) => void }} storage
   */
  constructor(storage) {
    this.storage = storage
    this.state = { ...DEFAULT_APPEARANCE }
    this._load()
  }

  _load() {
    try {
      const stored = this.storage.load()
      if (stored && typeof stored === 'object') {
        const glassStrength = this._clamp(stored.glassStrength, DEFAULT_APPEARANCE.glassStrength)
        const uiScale = this._clampUiScale(stored.uiScale)
        const uiScaleProfile = this._normalizeUiScaleProfile(stored.uiScaleProfile, { ...DEFAULT_UI_SCALE_PROFILE, unified: uiScale })
        const uiContainerSizes = this._normalizeUiContainerSizes(stored.uiContainerSizes)
        const customAppearance = this._normalizeCustomAppearance(stored.customAppearance, { glassStrength, uiScaleProfile, uiContainerSizes })
        const uiLayoutPresets = this._normalizeUiLayoutPresets(stored.uiLayoutPresets)
        const uiLayoutPresetId = stored.uiLayoutPresetId === 'default' || uiLayoutPresets.some((preset) => preset.id === stored.uiLayoutPresetId)
          ? stored.uiLayoutPresetId || 'default'
          : 'default'
        const hasCustomUiLayout = uiScaleProfile.mode === 'separate' || Object.values(uiScaleProfile).some((value) => typeof value === 'number' && value !== UI_SCALE_RANGE.default) || Object.keys(uiContainerSizes).length > 0
        this.state = {
          material: stored.material === 'transparent' ? 'transparent' : 'frosted',
          frostIntensity: this._clamp(stored.frostIntensity, 60),
          transparencyLevel: this._clamp(stored.transparencyLevel, 40),
          theme: stored.theme === 'dark' || stored.theme === 'system' ? stored.theme : 'light',
          glassStrength,
          uiScale: uiScaleProfile.unified,
          uiScaleProfile,
          uiContainerSizes,
          uiLayoutPresetId,
          uiLayoutPresets,
          appearancePreset:
            stored.appearancePreset === APPEARANCE_PRESETS.custom || stored.appearancePreset === APPEARANCE_PRESETS.default
              ? stored.appearancePreset
              : glassStrength === DEFAULT_APPEARANCE.glassStrength && !hasCustomUiLayout
                ? APPEARANCE_PRESETS.default
                : APPEARANCE_PRESETS.custom,
          customAppearance,
          desktopBackground: this._normalizeDesktopBackground(stored.desktopBackground),
          // New optical profile; legacy states without it map from their old
          // opacity preference (low transparencyLevel = previously preferred a
          // substantially more opaque surface → tinted; otherwise clear).
          liquidGlassStyle:
            stored.liquidGlassStyle === 'tinted'
              ? 'tinted'
              : stored.liquidGlassStyle === 'clear'
                ? 'clear'
                : this._clamp(stored.transparencyLevel, 40) <= 30
                  ? 'tinted'
                  : 'clear',
        }
      }
    } catch {
      // Corrupt or missing settings fall back to defaults.
    }
  }

  _clamp(value, fallback) {
    const n = Number(value)
    if (!Number.isFinite(n)) return fallback
    return Math.min(100, Math.max(0, Math.round(n)))
  }

  _clampUiScale(value) {
    const n = Number(value)
    if (!Number.isFinite(n)) return UI_SCALE_RANGE.default
    return Math.min(UI_SCALE_RANGE.max, Math.max(UI_SCALE_RANGE.min, Math.round(n)))
  }

  _normalizeUiScaleProfile(value, fallback = DEFAULT_UI_SCALE_PROFILE) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    const unified = this._clampUiScale(source.unified ?? fallback.unified)
    const mode = source.mode === 'separate' ? 'separate' : 'unified'
    return {
      mode,
      unified,
      typography: this._clampUiScale(source.typography ?? (mode === 'unified' ? unified : fallback.typography)),
      width: this._clampUiScale(source.width ?? (mode === 'unified' ? unified : fallback.width)),
      height: this._clampUiScale(source.height ?? (mode === 'unified' ? unified : fallback.height)),
      verticalSpacing: this._clampUiScale(source.verticalSpacing ?? (mode === 'unified' ? unified : fallback.verticalSpacing)),
      horizontalSpacing: this._clampUiScale(source.horizontalSpacing ?? (mode === 'unified' ? unified : fallback.horizontalSpacing)),
    }
  }

  _normalizeCustomAppearance(value, fallback = DEFAULT_APPEARANCE.customAppearance) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...fallback }
    const legacyProfile = value.uiScaleProfile || (value.uiScale !== undefined ? { ...fallback.uiScaleProfile, unified: value.uiScale } : fallback.uiScaleProfile)
    return {
      glassStrength: this._clamp(value.glassStrength, fallback.glassStrength),
      uiScaleProfile: this._normalizeUiScaleProfile(legacyProfile, fallback.uiScaleProfile),
      uiContainerSizes: this._normalizeUiContainerSizes(value.uiContainerSizes ?? fallback.uiContainerSizes),
    }
  }

  _normalizeUiContainerSizes(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    const sizes = {}
    for (const [id, size] of Object.entries(value)) {
      if (!/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(id) || !size || typeof size !== 'object' || Array.isArray(size)) continue
      const width = Number(size.width)
      const height = Number(size.height)
      if (Number.isFinite(width) && width >= 160 && width <= 2400) sizes[id] = { ...(sizes[id] || {}), width: Math.round(width) }
      if (Number.isFinite(height) && height >= 120 && height <= 2000) sizes[id] = { ...(sizes[id] || {}), height: Math.round(height) }
      if (!Object.keys(sizes[id] || {}).length) delete sizes[id]
    }
    return sizes
  }

  _normalizeUiLayoutPresets(value) {
    if (!Array.isArray(value)) return []
    return value.slice(0, 20).flatMap((preset) => {
      if (!preset || typeof preset !== 'object' || Array.isArray(preset)) return []
      const id = typeof preset.id === 'string' && /^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(preset.id) ? preset.id : ''
      const name = typeof preset.name === 'string' ? preset.name.trim().slice(0, 48) : ''
      if (!id || !name || id === 'default') return []
      return [{
        id,
        name,
        glassStrength: this._clamp(preset.glassStrength, DEFAULT_APPEARANCE.glassStrength),
        liquidGlassStyle: preset.liquidGlassStyle === 'tinted' ? 'tinted' : 'clear',
        uiScaleProfile: this._normalizeUiScaleProfile(preset.uiScaleProfile),
        uiContainerSizes: this._normalizeUiContainerSizes(preset.uiContainerSizes),
      }]
    })
  }

  _normalizeDesktopBackground(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { kind: 'default' }
    const managedUrl = typeof value.url === 'string' && (
      value.url.startsWith('file:///') || /^yren-appearance:\/\/appearance\/desktop-background-[a-z0-9-]+\.(png|jpg|jpeg|webp)$/i.test(value.url)
    )
    if (value.kind !== 'custom' || typeof value.assetId !== 'string' || !/^[a-z0-9-]+$/i.test(value.assetId) || !managedUrl) return { kind: 'default' }
    return { kind: 'custom', assetId: value.assetId, url: value.url }
  }

  get() {
    return { ...this.state }
  }

  update(patch) {
    const hasGlassStrength = Object.prototype.hasOwnProperty.call(patch, 'glassStrength')
    const hasUiScale = Object.prototype.hasOwnProperty.call(patch, 'uiScale') || Object.prototype.hasOwnProperty.call(patch, 'uiScaleProfile')
    const hasUiContainerSizes = Object.prototype.hasOwnProperty.call(patch, 'uiContainerSizes')
    const hasUiLayoutPresets = Object.prototype.hasOwnProperty.call(patch, 'uiLayoutPresets')
    const hasUiLayoutPresetId = Object.prototype.hasOwnProperty.call(patch, 'uiLayoutPresetId')
    const glassStrength = hasGlassStrength ? this._clamp(patch.glassStrength, DEFAULT_APPEARANCE.glassStrength) : this.state.glassStrength
    const uiScaleProfile = Object.prototype.hasOwnProperty.call(patch, 'uiScaleProfile')
      ? this._normalizeUiScaleProfile(patch.uiScaleProfile, this.state.uiScaleProfile)
      : Object.prototype.hasOwnProperty.call(patch, 'uiScale')
        ? this._normalizeUiScaleProfile({ ...this.state.uiScaleProfile, mode: 'unified', unified: this._clampUiScale(patch.uiScale) })
        : this.state.uiScaleProfile
    const uiScale = uiScaleProfile.unified
    const uiContainerSizes = hasUiContainerSizes ? this._normalizeUiContainerSizes(patch.uiContainerSizes) : this.state.uiContainerSizes
    const uiLayoutPresets = hasUiLayoutPresets ? this._normalizeUiLayoutPresets(patch.uiLayoutPresets) : this.state.uiLayoutPresets
    const requestedLayoutPresetId = hasUiLayoutPresetId ? patch.uiLayoutPresetId : this.state.uiLayoutPresetId
    const uiLayoutPresetId = requestedLayoutPresetId === 'default' || uiLayoutPresets.some((preset) => preset.id === requestedLayoutPresetId)
      ? requestedLayoutPresetId
      : 'default'
    const appearancePreset = Object.prototype.hasOwnProperty.call(patch, 'appearancePreset')
      ? patch.appearancePreset === APPEARANCE_PRESETS.custom ? APPEARANCE_PRESETS.custom : APPEARANCE_PRESETS.default
      : hasGlassStrength || hasUiScale || hasUiContainerSizes ? APPEARANCE_PRESETS.custom : this.state.appearancePreset
    this.state = {
      ...this.state,
      ...patch,
      glassStrength,
      uiScale,
      uiScaleProfile,
      uiContainerSizes,
      uiLayoutPresetId,
      uiLayoutPresets,
      appearancePreset,
      customAppearance: appearancePreset === APPEARANCE_PRESETS.custom && (hasGlassStrength || hasUiScale || hasUiContainerSizes)
        ? { glassStrength, uiScaleProfile, uiContainerSizes }
        : this.state.customAppearance,
      ...(Object.prototype.hasOwnProperty.call(patch, 'desktopBackground')
        ? { desktopBackground: this._normalizeDesktopBackground(patch.desktopBackground) }
        : {}),
    }
    this.storage.save(this.state)
    return this.get()
  }
}
