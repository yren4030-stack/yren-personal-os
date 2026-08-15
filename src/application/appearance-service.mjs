/**
 * AppearanceSettingsService — owns the desktop presentation preferences
 * (material mode, frost intensity, transparency level, theme). These are
 * non-sensitive preferences, persisted through an injectable storage adapter
 * owned by the Desktop Main process (never the Renderer).
 */

export const DEFAULT_APPEARANCE = Object.freeze({
  material: 'frosted',
  frostIntensity: 60,
  transparencyLevel: 40,
  theme: 'light',
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
    this.state = { ...this.state, ...patch }
    this.storage.save(this.state)
    return this.get()
  }
}
