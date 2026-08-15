/**
 * Renderer-owned Liquid Glass optical engine (pure presentation logic).
 *
 * Personal OS has ONE material engine — Liquid Glass — controlled by two
 * USER-FACING axes plus internal surface roles:
 *   - appearance: 'light' | 'dark'
 *   - liquidGlass: 'clear' | 'tinted'   (coordinated optical profiles)
 *   - surfaceRole: 'content' | 'panel' | 'navigation' | 'floating' | 'control'
 *
 * The legacy continuous fields (frostIntensity / transparencyLevel) no longer
 * drive the UI; they remain only in the persisted shape for compatibility.
 * Each profile is a coordinated optical stack (transmission, scattering,
 * edge/refraction, specular, reflection, shadow), never an alpha-only tweak.
 * resolveLiquidGlass is pure and deterministic; applyGlassTokens writes the
 * resulting semantic tokens onto the document root.
 */

export const LIQUID_GLASS_STYLES = Object.freeze({ CLEAR: 'clear', TINTED: 'tinted' })

/**
 * Coordinated optical profiles. Every profile defines the full stack; a
 * profile change moves several axes together (blur, tint, edge, specular,
 * reflection, shadow), so clear vs tinted is never an alpha-only difference.
 */
const PROFILES = Object.freeze({
  clear: Object.freeze({
    fill: Object.freeze({ light: 0.2, dark: 0.24 }),
    blur: 14,
    saturation: Object.freeze({ light: 1.3, dark: 1.2 }),
    border: Object.freeze({ light: 0.12, dark: 0.16 }),
    specular: Object.freeze({ light: 0.5, dark: 0.35 }),
    reflection: Object.freeze({ light: 0.32, dark: 0.38 }),
    rim: Object.freeze({ light: 0.1, dark: 0.14 }),
    shadowNear: 0.03,
    shadowFar: 0.06,
    lift: Object.freeze({ light: 0.2, dark: 0.45 }),
  }),
  tinted: Object.freeze({
    fill: Object.freeze({ light: 0.5, dark: 0.46 }),
    blur: 26,
    saturation: Object.freeze({ light: 1.45, dark: 1.3 }),
    border: Object.freeze({ light: 0.16, dark: 0.12 }),
    specular: Object.freeze({ light: 0.3, dark: 0.24 }),
    reflection: Object.freeze({ light: 0.45, dark: 0.5 }),
    rim: Object.freeze({ light: 0.07, dark: 0.1 }),
    shadowNear: 0.05,
    shadowFar: 0.1,
    lift: Object.freeze({ light: 0.3, dark: 0.6 }),
  }),
})

/**
 * Semantic surface-role multipliers over the global profile.
 * - content:  quieter STANDARD translucent material (project/task/activity).
 * - panel:    base functional material (settings container).
 * - navigation: sidebar — full fidelity, deeper lift.
 * - floating: small action surfaces — clearer, thinner, sharper edge.
 * - control:  compact controls — lightest touch.
 */
const ROLES = Object.freeze({
  content: Object.freeze({ fill: 0.92, blur: 0.8, border: 0.9, shadow: 0.7, lift: 0, specular: 0, reflection: 0 }),
  panel: Object.freeze({ fill: 1, blur: 1, border: 1, shadow: 1, lift: 1, specular: 1, reflection: 1 }),
  navigation: Object.freeze({ fill: 0.96, blur: 1.05, border: 1, shadow: 1, lift: 1.25, specular: 1.1, reflection: 1 }),
  floating: Object.freeze({ fill: 0.8, blur: 0.7, border: 1.15, shadow: 0.6, lift: 0.8, specular: 1.2, reflection: 0.9 }),
  control: Object.freeze({ fill: 0.75, blur: 0.6, border: 1.2, shadow: 0.5, lift: 0.6, specular: 1.3, reflection: 0.8 }),
})

const FILL_RGB = Object.freeze({ light: '255, 255, 255', dark: '34, 36, 42' })
const BORDER_RGB = Object.freeze({ light: '0, 0, 0', dark: '255, 255, 255' })

function pick(map, dark) {
  return map[dark ? 'dark' : 'light']
}

function round3(value) {
  return Math.round(value * 1000) / 1000
}

/**
 * Resolve the coordinated optical profile for a surface role.
 * @param {object} [options]
 * @param {'light'|'dark'} [options.appearance]
 * @param {'clear'|'tinted'} [options.liquidGlass]
 * @param {keyof ROLES} [options.surfaceRole]
 * @returns {{
 *   fillAlpha: number, blurPx: number, saturation: number,
 *   borderAlpha: number, specularAlpha: number, reflectionAlpha: number,
 *   rimAlpha: number, shadowNear: number, shadowFar: number, liftAlpha: number,
 *   fillRgb: string, borderRgb: string
 * }}
 */
export function resolveLiquidGlass({ appearance = 'light', liquidGlass = 'clear', surfaceRole = 'panel' } = {}) {
  const dark = appearance === 'dark'
  const profile = PROFILES[liquidGlass === 'tinted' ? 'tinted' : 'clear']
  const role = ROLES[surfaceRole] || ROLES.panel
  return {
    fillAlpha: round3(pick(profile.fill, dark) * role.fill),
    blurPx: round3(profile.blur * role.blur),
    saturation: round3(pick(profile.saturation, dark)),
    borderAlpha: round3(pick(profile.border, dark) * role.border),
    specularAlpha: round3(pick(profile.specular, dark) * role.specular),
    reflectionAlpha: round3(pick(profile.reflection, dark) * role.reflection),
    rimAlpha: round3(pick(profile.rim, dark)),
    shadowNear: round3(profile.shadowNear * role.shadow),
    shadowFar: round3(profile.shadowFar * role.shadow),
    liftAlpha: round3(pick(profile.lift, dark) * role.lift),
    fillRgb: FILL_RGB[dark ? 'dark' : 'light'],
    borderRgb: BORDER_RGB[dark ? 'dark' : 'light'],
  }
}

function formatLayerSet(resolved, roleKey) {
  const highlightAlpha = Math.min(0.6, resolved.specularAlpha + 0.18)
  const highlight = `rgba(255, 255, 255, ${highlightAlpha.toFixed(3)})`
  return {
    bg: `rgba(${resolved.fillRgb}, ${resolved.fillAlpha.toFixed(3)})`,
    blur: `${resolved.blurPx.toFixed(1)}px`,
    border: `1px solid rgba(${resolved.borderRgb}, ${resolved.borderAlpha.toFixed(3)})`,
    shadow: `${highlight} inset 0 1px 0, 0 1px 2px rgba(0, 0, 0, ${resolved.shadowNear.toFixed(3)}), 0 6px 24px rgba(0, 0, 0, ${resolved.shadowFar.toFixed(3)})`,
    role: roleKey,
  }
}

/**
 * Compute the full semantic token set for the document root.
 * @param {{ theme?: string, liquidGlassStyle?: string }} appearance
 */
export function computeGlassTokens(appearance = {}) {
  const dark = appearance.theme === 'dark'
  const liquidGlass = appearance.liquidGlassStyle === 'tinted' ? 'tinted' : 'clear'

  const functional = resolveLiquidGlass({ appearance: dark ? 'dark' : 'light', liquidGlass, surfaceRole: 'navigation' })
  const content = resolveLiquidGlass({ appearance: dark ? 'dark' : 'light', liquidGlass, surfaceRole: 'content' })
  const floating = resolveLiquidGlass({ appearance: dark ? 'dark' : 'light', liquidGlass, surfaceRole: 'floating' })

  const f = formatLayerSet(functional, 'navigation')
  const c = formatLayerSet(content, 'content')
  const fl = formatLayerSet(floating, 'floating')

  const highlight = `rgba(255, 255, 255, ${Math.min(0.6, functional.specularAlpha + 0.18).toFixed(3)})`
  const rimColor = dark ? '255, 255, 255' : '255, 255, 255'
  const rim = `rgba(${rimColor}, ${functional.rimAlpha.toFixed(3)})`

  return {
    // Functional (Level 1) — full Liquid Glass fidelity.
    glassBg: f.bg,
    glassBlur: f.blur,
    glassBorder: f.border,
    glassShadow: f.shadow,
    glassHighlight: highlight,
    glassSaturation: functional.saturation.toFixed(2),
    // Level-1 optical layers.
    glassSpecular: `linear-gradient(135deg, ${highlight}, transparent 46%)`,
    glassReflection: `linear-gradient(180deg, transparent 40%, ${highlight} 100%)`,
    glassEdgeDark: `inset 0 -1px 0 rgba(0, 0, 0, ${dark ? 0.4 : 0.05})`,
    glassLift: `0 18px 40px -18px rgba(0, 0, 0, ${functional.liftAlpha.toFixed(3)})`,
    glassRim: rim,
    // Content (Level 2) — quieter standard translucent material.
    glassBgContent: c.bg,
    glassBlurContent: c.blur,
    glassBorderContent: c.border,
    glassShadowContent: c.shadow,
    // Floating (small functional surfaces) — clearer, thinner.
    glassBgFloat: fl.bg,
    glassBlurFloat: fl.blur,
    glassBorderFloat: fl.border,
    glassShadowFloat: fl.shadow,
    // Numeric summaries for deterministic tests.
    functionalFillAlpha: functional.fillAlpha,
    functionalBlurPx: functional.blurPx,
    contentFillAlpha: content.fillAlpha,
    floatingFillAlpha: floating.fillAlpha,
    blurPx: functional.blurPx,
    alpha: functional.fillAlpha,
  }
}

/** Write the computed semantic tokens onto the document root (Renderer only). */
export function applyGlassTokens(tokens) {
  const root = document.documentElement
  for (const key of [
    'glassBg', 'glassBlur', 'glassBorder', 'glassShadow', 'glassHighlight', 'glassSaturation',
    'glassSpecular', 'glassReflection', 'glassEdgeDark', 'glassLift', 'glassRim',
    'glassBgContent', 'glassBlurContent', 'glassBorderContent', 'glassShadowContent',
    'glassBgFloat', 'glassBlurFloat', 'glassBorderFloat', 'glassShadowFloat',
  ]) {
    root.style.setProperty(`--${key}`, tokens[key])
  }
}
