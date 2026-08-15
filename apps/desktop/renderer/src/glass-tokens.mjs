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
 * @param {{ frostIntensity?: number, transparencyLevel?: number, theme?: string }} appearance
 *   `theme`: 'light' | 'dark' (defaults to 'light' when absent/unknown —
 *   legacy compatibility; the persisted `material` field stays irrelevant).
 * @returns {{ glassBg: string, glassBlur: string, glassBorder: string, glassSaturation: string, glassShadow: string, glassHighlight: string, blurPx: number, alpha: number }}
 */
export function computeGlassTokens(appearance) {
  const frost = clampSlider(appearance && appearance.frostIntensity) / 100
  const t = clampSlider(appearance && appearance.transparencyLevel) / 100
  const dark = appearance && appearance.theme === 'dark'

  // Liquid Glass base: blur follows frost (0→32px). Alpha follows transparency
  // through a power easing (t^1.4): gradual opening at low values, clearly
  // more transparent in the mid range, rapidly approaching clear glass above
  // 80 — but never exactly 0 (fill stays materially present via border,
  // highlight and shadow). Theme only swaps the color FAMILIES: white-tinted
  // glass in light mode, graphite smoked glass in dark mode — the same curve.
  const blurPx = frost * 32
  const eased = Math.pow(t, 1.4)
  const alpha = Math.round((0.78 - (0.78 - 0.07) * eased) * 1000) / 1000
  const fill = dark ? '34, 36, 42' : '255, 255, 255'
  // Edge response: border and inner highlight strengthen slightly with
  // transparency so clear glass keeps a defined edge. Dark glass uses a
  // brighter perimeter border (light-on-dark edge definition).
  const borderRgb = dark ? '255, 255, 255' : '0, 0, 0'
  const borderAlpha = dark ? 0.06 + t * 0.08 : 0.05 + t * 0.05
  const highlightAlpha = dark ? 0.1 + t * 0.14 : 0.28 + t * 0.18
  const saturation = dark ? 1.05 + frost * 0.2 : 1.05 + frost * 0.35
  const highlight = `rgba(255, 255, 255, ${highlightAlpha.toFixed(3)})`
  // Depth response: outer shadow lightens at high transparency, never gone.
  // Dark mode shadows are deeper (black ambient over graphite).
  const shadowNear = (dark ? 0.06 : 0.04) * (1 - 0.5 * t)
  const shadowFar = (dark ? 0.14 : 0.08) * (1 - 0.6 * t)

  return {
    glassBg: `rgba(${fill}, ${alpha.toFixed(3)})`,
    glassBlur: `${blurPx.toFixed(1)}px`,
    glassBorder: `1px solid rgba(${borderRgb}, ${borderAlpha.toFixed(3)})`,
    glassSaturation: saturation.toFixed(2),
    glassHighlight: highlight,
    glassShadow: `${highlight} inset 0 1px 0, 0 1px 2px rgba(0, 0, 0, ${shadowNear.toFixed(3)}), 0 6px 24px rgba(0, 0, 0, ${shadowFar.toFixed(3)})`,
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
