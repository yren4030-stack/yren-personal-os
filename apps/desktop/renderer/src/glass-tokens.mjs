/**
 * Renderer-owned Liquid Glass optical engine (pure presentation logic).
 *
 * TWO SEPARATE AXES:
 *
 * AXIS 1 — USER preference (`liquidGlassStyle`): 'clear' | 'tinted'
 *   The macOS-26-style user setting. Kept exactly as exposed in Settings.
 *
 * AXIS 2 — INTERNAL component material variant (never user-facing):
 *   - 'regular': text-heavy functional surfaces (sidebar, proposal panel,
 *     settings control regions, popovers, inspectors).
 *   - 'clear':   small/lightweight floating controls (segmented glass
 *     capsules, compact action capsules, floating toolbars).
 *   - 'content': STANDARD content material (project/task/activity cards,
 *     dashboard content, ordinary page sections) — NOT full Liquid Glass.
 *
 * final = userStyle + variant + theme + surface size (role).
 *
 * The optical model is perimeter-driven: transmission/scattering/luminosity
 * define the center; refractive rim, specular response, internal reflection,
 * opposite-edge shade, contact + ambient shadows and environmental color
 * spill define the perimeter — never alpha + blur alone.
 */

export const LIQUID_GLASS_STYLES = Object.freeze({ CLEAR: 'clear', TINTED: 'tinted' })
export const MATERIAL_VARIANTS = Object.freeze({ REGULAR: 'regular', CLEAR: 'clear', CONTENT: 'content' })

/**
 * Coordinated optical profiles per variant × user style. Every profile is the
 * full optical stack; userStyle changes several axes together, never alpha
 * alone.
 */
const PROFILES = Object.freeze({
  regular: Object.freeze({
    clear: Object.freeze({ fill: 0.14, blur: 12, brightness: 1.05, contrast: 1.03, saturation: 1.25, border: 0.16, rimLight: 0.55, rimShade: 0.07, specular: 0.5, reflection: 0.3, contact: 0.04, ambient: 0.1, spill: 0.12 }),
    tinted: Object.freeze({ fill: 0.32, blur: 18, brightness: 1.02, contrast: 1.05, saturation: 1.4, border: 0.18, rimLight: 0.4, rimShade: 0.09, specular: 0.35, reflection: 0.42, contact: 0.05, ambient: 0.14, spill: 0.16 }),
  }),
  clear: Object.freeze({
    clear: Object.freeze({ fill: 0.08, blur: 7, brightness: 1.06, contrast: 1.04, saturation: 1.3, border: 0.18, rimLight: 0.6, rimShade: 0.08, specular: 0.55, reflection: 0.22, contact: 0.03, ambient: 0.06, spill: 0.14 }),
    tinted: Object.freeze({ fill: 0.2, blur: 12, brightness: 1.03, contrast: 1.05, saturation: 1.45, border: 0.2, rimLight: 0.45, rimShade: 0.1, specular: 0.4, reflection: 0.32, contact: 0.04, ambient: 0.09, spill: 0.18 }),
  }),
  content: Object.freeze({
    clear: Object.freeze({ fill: 0.13, blur: 9, brightness: 1.03, contrast: 1.02, saturation: 1.2, border: 0.12, rimLight: 0.3, rimShade: 0.05, specular: 0.25, reflection: 0.18, contact: 0.03, ambient: 0.06, spill: 0.08 }),
    tinted: Object.freeze({ fill: 0.28, blur: 14, brightness: 1.02, contrast: 1.03, saturation: 1.3, border: 0.14, rimLight: 0.24, rimShade: 0.07, specular: 0.2, reflection: 0.26, contact: 0.04, ambient: 0.09, spill: 0.11 }),
  }),
})

/** Surface-size multipliers (not user-facing). */
const SIZES = Object.freeze({
  small: Object.freeze({ fill: 0.85, blur: 0.75, border: 1.1, contact: 0.8, ambient: 0.7, specular: 1.1 }),
  medium: Object.freeze({ fill: 1, blur: 1, border: 1, contact: 1, ambient: 1, specular: 1 }),
  large: Object.freeze({ fill: 1.05, blur: 1.1, border: 1, contact: 1.1, ambient: 1.15, specular: 1 }),
})

/** Role → size + environmental spill emphasis. */
const ROLES = Object.freeze({
  navigation: Object.freeze({ size: 'large', spill: 1.2 }),
  panel: Object.freeze({ size: 'medium', spill: 1 }),
  control: Object.freeze({ size: 'small', spill: 1 }),
  floating: Object.freeze({ size: 'small', spill: 1.1, specular: 1.15 }),
})

const FILL_RGB = Object.freeze({ light: '255, 255, 255', dark: '34, 36, 42' })
const BORDER_RGB = Object.freeze({ light: '0, 0, 0', dark: '255, 255, 255' })

function round3(value) {
  return Math.round(value * 1000) / 1000
}

/**
 * Resolve the full semantic optical stack for one surface.
 * @param {object} [options]
 * @param {'light'|'dark'} [options.theme]
 * @param {'clear'|'tinted'} [options.userStyle]
 * @param {'regular'|'clear'|'content'} [options.variant]
 * @param {'navigation'|'panel'|'control'|'floating'} [options.role]
 * @param {'small'|'medium'|'large'} [options.size]
 */
export function resolveLiquidGlass({ theme = 'light', userStyle = 'clear', variant = 'regular', role = 'panel', size } = {}) {
  const dark = theme === 'dark'
  const profile = PROFILES[variant === 'clear' ? 'clear' : variant === 'content' ? 'content' : 'regular']
  const style = profile[userStyle === 'tinted' ? 'tinted' : 'clear']
  const roleSpec = ROLES[role] || ROLES.panel
  const sizeSpec = SIZES[size || roleSpec.size] || SIZES.medium
  const specularExtra = roleSpec.specular || 1

  return {
    fillAlpha: round3(style.fill * sizeSpec.fill),
    blurPx: round3(style.blur * sizeSpec.blur),
    brightness: round3(style.brightness * (dark ? 0.99 : 1)),
    contrast: round3(style.contrast),
    saturation: round3(style.saturation * (dark ? 0.92 : 1)),
    borderAlpha: round3(style.border * sizeSpec.border),
    rimLightAlpha: round3(Math.min(0.7, style.rimLight * (dark ? 1.15 : 1))),
    rimShadeAlpha: round3(style.rimShade * (dark ? 1.3 : 1)),
    specularAlpha: round3(Math.min(0.65, style.specular * sizeSpec.specular * specularExtra * (dark ? 0.85 : 1))),
    reflectionAlpha: round3(style.reflection * (dark ? 1.1 : 1)),
    contactAlpha: round3(style.contact * sizeSpec.contact),
    ambientAlpha: round3(style.ambient * sizeSpec.ambient),
    spillAlpha: round3(style.spill * (roleSpec.spill || 1)),
    fillRgb: FILL_RGB[dark ? 'dark' : 'light'],
    borderRgb: BORDER_RGB[dark ? 'dark' : 'light'],
  }
}

function formatShadow(resolved) {
  const highlight = `rgba(255, 255, 255, ${Math.min(0.6, resolved.specularAlpha + 0.15).toFixed(3)})`
  const rimLight = `rgba(255, 255, 255, ${resolved.rimLightAlpha.toFixed(3)})`
  const rimShade = `rgba(0, 0, 0, ${resolved.rimShadeAlpha.toFixed(3)})`
  return {
    highlight,
    rimLight,
    shadow: `${highlight} inset 0 1px 0, ${rimLight} inset 0 0 0 1px, ${rimShade} inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, ${resolved.contactAlpha.toFixed(3)}), 0 18px 50px -20px rgba(0, 0, 0, ${resolved.ambientAlpha.toFixed(3)})`,
  }
}

/**
 * Compute the complete semantic token set for the document root.
 * @param {{ theme?: string, liquidGlassStyle?: string }} appearance
 */
export function computeGlassTokens(appearance = {}) {
  const dark = appearance.theme === 'dark'
  const userStyle = appearance.liquidGlassStyle === 'tinted' ? 'tinted' : 'clear'
  const theme = dark ? 'dark' : 'light'

  const regular = resolveLiquidGlass({ theme, userStyle, variant: 'regular', role: 'navigation' })
  const clear = resolveLiquidGlass({ theme, userStyle, variant: 'clear', role: 'control' })
  const content = resolveLiquidGlass({ theme, userStyle, variant: 'content', role: 'panel' })

  const r = formatShadow(regular)
  const c = formatShadow(clear)
  const k = formatShadow(content)

  const spillColor = dark ? '110, 122, 160' : '150, 158, 186'

  return {
    // REGULAR liquid glass (text-heavy functional surfaces).
    glassBg: `rgba(${regular.fillRgb}, ${regular.fillAlpha.toFixed(3)})`,
    glassBlur: `${regular.blurPx.toFixed(1)}px`,
    glassBorder: `1px solid rgba(${regular.borderRgb}, ${regular.borderAlpha.toFixed(3)})`,
    glassShadow: r.shadow,
    glassSaturation: regular.saturation.toFixed(2),
    glassBrightness: regular.brightness.toFixed(2),
    glassContrast: regular.contrast.toFixed(2),
    glassHighlight: r.highlight,
    glassRimLight: r.rimLight,
    glassRimShade: `rgba(0, 0, 0, ${regular.rimShadeAlpha.toFixed(3)})`,
    glassSpecular: `linear-gradient(135deg, ${r.highlight}, transparent 46%)`,
    glassReflection: `linear-gradient(180deg, transparent 42%, ${r.highlight} 100%)`,
    glassSpill: `linear-gradient(160deg, rgba(${spillColor}, ${regular.spillAlpha.toFixed(3)}), transparent 52%)`,
    // CLEAR liquid glass (small floating controls, segmented capsules).
    glassClearBg: `rgba(${clear.fillRgb}, ${clear.fillAlpha.toFixed(3)})`,
    glassClearBlur: `${clear.blurPx.toFixed(1)}px`,
    glassClearBorder: `1px solid rgba(${clear.borderRgb}, ${clear.borderAlpha.toFixed(3)})`,
    glassClearShadow: c.shadow,
    glassClearSaturation: clear.saturation.toFixed(2),
    glassClearBrightness: clear.brightness.toFixed(2),
    glassClearContrast: clear.contrast.toFixed(2),
    glassClearHighlight: c.highlight,
    glassClearRimLight: c.rimLight,
    glassClearSpecular: `linear-gradient(135deg, ${c.highlight}, transparent 46%)`,
    // STANDARD content material (ordinary content cards).
    glassContentBg: `rgba(${content.fillRgb}, ${content.fillAlpha.toFixed(3)})`,
    glassContentBlur: `${content.blurPx.toFixed(1)}px`,
    glassContentBorder: `1px solid rgba(${content.borderRgb}, ${content.borderAlpha.toFixed(3)})`,
    glassContentShadow: k.shadow,
    glassContentSaturation: content.saturation.toFixed(2),
    glassContentBrightness: content.brightness.toFixed(2),
    glassContentContrast: content.contrast.toFixed(2),
    // Numeric summaries for deterministic tests.
    regularFillAlpha: regular.fillAlpha,
    regularBlurPx: regular.blurPx,
    clearFillAlpha: clear.fillAlpha,
    contentFillAlpha: content.fillAlpha,
    blurPx: regular.blurPx,
    alpha: regular.fillAlpha,
  }
}

/** Write the computed semantic tokens onto the document root (Renderer only). */
export function applyGlassTokens(tokens) {
  const root = document.documentElement
  for (const key of [
    'glassBg', 'glassBlur', 'glassBorder', 'glassShadow', 'glassSaturation', 'glassBrightness', 'glassContrast',
    'glassHighlight', 'glassRimLight', 'glassRimShade', 'glassSpecular', 'glassReflection', 'glassSpill',
    'glassClearBg', 'glassClearBlur', 'glassClearBorder', 'glassClearShadow', 'glassClearSaturation',
    'glassClearBrightness', 'glassClearContrast', 'glassClearHighlight', 'glassClearRimLight', 'glassClearSpecular',
    'glassContentBg', 'glassContentBlur', 'glassContentBorder', 'glassContentShadow',
    'glassContentSaturation', 'glassContentBrightness', 'glassContentContrast',
  ]) {
    root.style.setProperty(`--${key}`, tokens[key])
  }
}
