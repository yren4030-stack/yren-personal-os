/**
 * Renderer-owned Liquid Glass material token mapping (pure presentation logic).
 *
 * Personal OS has ONE global material engine — Liquid Glass. There is no
 * material mode enum: two independent continuous parameters drive the whole
 * UI:
 *   - 磨砂强度 (frostIntensity): backdrop blur / diffusion / saturation only.
 *   - 通透程度 (transparencyLevel): surface alpha / background transmission /
 *     edge highlight only.
 *
 * computeGlassTokens is a pure function of the two parameters (any legacy
 * `material` field is ignored — zero rendering effect, compatibility only),
 * so it is deterministic and unit-testable. Future visual work (edge
 * highlight, specular response, refraction, depth) can refine the base preset
 * without touching the Settings data model.
 */

function clampSlider(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

/**
 * @param {{ frostIntensity?: number, transparencyLevel?: number }} appearance
 * @returns {{ glassBg: string, glassBlur: string, glassBorder: string, glassSaturation: string, glassShadow: string, glassHighlight: string, blurPx: number, alpha: number }}
 */
export function computeGlassTokens(appearance) {
  const frost = clampSlider(appearance && appearance.frostIntensity) / 100
  const transparency = clampSlider(appearance && appearance.transparencyLevel) / 100

  // Liquid Glass base: blur follows frost (0→32px); alpha follows
  // transparency (0.74 dense → 0.24 open, never invisible).
  const blurPx = frost * 32
  const alpha = Math.round((0.74 - transparency * 0.5) * 1000) / 1000
  const borderAlpha = 0.05 + transparency * 0.05
  const highlightAlpha = 0.28 + transparency * 0.18
  const saturation = 1.05 + frost * 0.35
  const highlight = `rgba(255, 255, 255, ${highlightAlpha.toFixed(3)})`

  return {
    glassBg: `rgba(255, 255, 255, ${alpha.toFixed(3)})`,
    glassBlur: `${blurPx.toFixed(1)}px`,
    glassBorder: `1px solid rgba(0, 0, 0, ${borderAlpha.toFixed(3)})`,
    glassSaturation: saturation.toFixed(2),
    glassHighlight: highlight,
    glassShadow: `${highlight} inset 0 1px 0, 0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 24px rgba(0, 0, 0, 0.08)`,
    blurPx,
    alpha,
  }
}

/** Write the computed tokens onto the document root (Renderer only). */
export function applyGlassTokens(tokens) {
  const root = document.documentElement
  root.style.setProperty('--glass-bg', tokens.glassBg)
  root.style.setProperty('--glass-blur', tokens.glassBlur)
  root.style.setProperty('--glass-border', tokens.glassBorder)
  root.style.setProperty('--glass-shadow', tokens.glassShadow)
  root.style.setProperty('--glass-saturation', tokens.glassSaturation)
  root.style.setProperty('--glass-highlight', tokens.glassHighlight)
}
