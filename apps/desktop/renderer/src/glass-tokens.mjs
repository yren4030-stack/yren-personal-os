/**
 * Renderer-owned glass material token mapping (pure presentation logic).
 *
 * computeGlassTokens maps the persisted appearance state onto the centralized
 * --glass-* CSS custom properties consumed by every glass surface. It is a
 * pure function of the appearance object (no DOM), so it is deterministic and
 * unit-testable. The two sliders stay independent:
 *   - 磨砂强度 (frostIntensity) controls blur/diffusion only.
 *   - 通透程度 (transparencyLevel) controls surface alpha only.
 *
 * FROSTED (磨砂): strong blur range 0–32px, relatively opaque surface.
 * TRANSPARENT (通透): lighter blur range 0–14px, surface alpha 0.72→0.20
 * (never zero, always readable).
 */

function clampSlider(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

/**
 * @param {{ material?: string, frostIntensity?: number, transparencyLevel?: number }} appearance
 * @returns {{ glassBg: string, glassBlur: string, glassBorder: string, glassSaturation: string, glassShadow: string, blurPx: number, alpha: number }}
 */
export function computeGlassTokens(appearance) {
  const material = appearance && appearance.material === 'transparent' ? 'transparent' : 'frosted'
  const frost = clampSlider(appearance && appearance.frostIntensity) / 100
  const transparency = clampSlider(appearance && appearance.transparencyLevel) / 100

  const blurPx = material === 'frosted' ? frost * 32 : frost * 14
  // Rounded to 3 decimals so the numeric value matches the CSS string exactly.
  const alpha = Math.round((material === 'frosted' ? 0.66 - transparency * 0.18 : 0.72 - transparency * 0.52) * 1000) / 1000

  return {
    glassBg: `rgba(255, 255, 255, ${alpha.toFixed(3)})`,
    glassBlur: `${blurPx.toFixed(1)}px`,
    glassBorder: `1px solid rgba(0, 0, 0, ${material === 'transparent' ? 0.04 : 0.08})`,
    glassSaturation: material === 'frosted' ? '1.35' : '1.05',
    glassShadow:
      material === 'transparent'
        ? 'inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 1px 2px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(0, 0, 0, 0.05)'
        : 'inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 28px rgba(0, 0, 0, 0.08)',
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
}
