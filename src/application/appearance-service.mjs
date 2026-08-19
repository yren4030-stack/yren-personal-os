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

export const DEFAULT_APPEARANCE = Object.freeze({
  material: 'frosted',
  frostIntensity: 60,
  transparencyLevel: 40,
  theme: 'light',
  liquidGlassStyle: 'clear',
  glassStrength: 60,
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
        this.state = {
          material: stored.material === 'transparent' ? 'transparent' : 'frosted',
          frostIntensity: this._clamp(stored.frostIntensity, 60),
          transparencyLevel: this._clamp(stored.transparencyLevel, 40),
          theme: stored.theme === 'dark' || stored.theme === 'system' ? stored.theme : 'light',
          glassStrength: this._clamp(stored.glassStrength, 60),
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

  get() {
    return { ...this.state }
  }

  update(patch) {
    this.state = {
      ...this.state,
      ...patch,
      ...(Object.prototype.hasOwnProperty.call(patch, 'glassStrength')
        ? { glassStrength: this._clamp(patch.glassStrength, 60) }
        : {}),
    }
    this.storage.save(this.state)
    return this.get()
  }
}
