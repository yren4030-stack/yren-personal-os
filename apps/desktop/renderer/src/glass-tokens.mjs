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

import { FOUNDATION_TOKENS } from './ui-foundation.mjs'

export const LIQUID_GLASS_STYLES = Object.freeze({ CLEAR: 'clear', TINTED: 'tinted' })
export const MATERIAL_VARIANTS = Object.freeze({ REGULAR: 'regular', CLEAR: 'clear', CONTENT: 'content' })

/**
 * Coordinated optical profiles per variant × user style. Every profile is the
 * full optical stack; userStyle changes several axes together, never alpha
 * alone.
 */
/** Surface-size multipliers (not user-facing). */


/** Role → size + environmental spill emphasis. */
const {
  profiles: PROFILES,
  sizes: SIZES,
  roles: ROLES,
  fillRgb: FILL_RGB,
  borderRgb: BORDER_RGB,
  highlightRgb: HIGHLIGHT_RGB,
  shadeRgb: SHADE_RGB,
  spillRgb: SPILL_RGB,
} = FOUNDATION_TOKENS.glassModel

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
    highlightRgb: HIGHLIGHT_RGB[dark ? 'dark' : 'light'],
    shadeRgb: SHADE_RGB[dark ? 'dark' : 'light'],
  }
}

function formatShadow(resolved) {
  const highlight = `rgba(${resolved.highlightRgb}, ${Math.min(0.6, resolved.specularAlpha + 0.15).toFixed(3)})`
  const rimLight = `rgba(${resolved.highlightRgb}, ${resolved.rimLightAlpha.toFixed(3)})`
  const rimShade = `rgba(${resolved.shadeRgb}, ${resolved.rimShadeAlpha.toFixed(3)})`
  return {
    highlight,
    rimLight,
    shadow: `${highlight} inset 0 1px 0, ${rimLight} inset 0 0 0 1px, ${rimShade} inset 0 -1px 0, 0 1px 2px rgba(${resolved.shadeRgb}, ${resolved.contactAlpha.toFixed(3)}), 0 18px 50px -20px rgba(${resolved.shadeRgb}, ${resolved.ambientAlpha.toFixed(3)})`,
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

  const spillColor = SPILL_RGB[dark ? 'dark' : 'light']

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
    glassRimShade: `rgba(${regular.shadeRgb}, ${regular.rimShadeAlpha.toFixed(3)})`,
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
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const values = {
    '--ui-glass-regular-background': tokens.glassBg,
    '--ui-glass-regular-blur': tokens.glassBlur,
    '--ui-glass-regular-border': tokens.glassBorder,
    '--ui-glass-regular-shadow': tokens.glassShadow,
    '--ui-glass-regular-saturation': tokens.glassSaturation,
    '--ui-glass-regular-brightness': tokens.glassBrightness,
    '--ui-glass-regular-contrast': tokens.glassContrast,
    '--ui-glass-regular-highlight': tokens.glassHighlight,
    '--ui-glass-regular-rim-light': tokens.glassRimLight,
    '--ui-glass-regular-rim-shade': tokens.glassRimShade,
    '--ui-glass-regular-specular': tokens.glassSpecular,
    '--ui-glass-regular-reflection': tokens.glassReflection,
    '--ui-glass-regular-spill': tokens.glassSpill,
    '--ui-glass-clear-background': tokens.glassClearBg,
    '--ui-glass-clear-blur': tokens.glassClearBlur,
    '--ui-glass-clear-border': tokens.glassClearBorder,
    '--ui-glass-clear-shadow': tokens.glassClearShadow,
    '--ui-glass-clear-saturation': tokens.glassClearSaturation,
    '--ui-glass-clear-brightness': tokens.glassClearBrightness,
    '--ui-glass-clear-contrast': tokens.glassClearContrast,
    '--ui-glass-clear-highlight': tokens.glassClearHighlight,
    '--ui-glass-clear-rim-light': tokens.glassClearRimLight,
    '--ui-glass-clear-specular': tokens.glassClearSpecular,
    '--ui-glass-content-background': tokens.glassContentBg,
    '--ui-glass-content-blur': tokens.glassContentBlur,
    '--ui-glass-content-border': tokens.glassContentBorder,
    '--ui-glass-content-shadow': tokens.glassContentShadow,
    '--ui-glass-content-saturation': tokens.glassContentSaturation,
    '--ui-glass-content-brightness': tokens.glassContentBrightness,
    '--ui-glass-content-contrast': tokens.glassContentContrast,
  }
  for (const [name, value] of Object.entries(values)) {
    root.style.setProperty(name, value)
  }
}
