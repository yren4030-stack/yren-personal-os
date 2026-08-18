/**
 * Compatibility adapter for the pre-foundation Liquid Glass API.
 * All values and computation come from resolveFoundationTokens(); this file
 * does not own a second optical model.
 */

import { resolveFoundationTokens } from './ui-foundation.mjs'

export const LIQUID_GLASS_STYLES = Object.freeze({ CLEAR: 'clear', TINTED: 'tinted' })
export const MATERIAL_VARIANTS = Object.freeze({ REGULAR: 'regular', CLEAR: 'clear', CONTENT: 'content' })

export function resolveLiquidGlass({ theme = 'light', userStyle = 'clear', variant = 'regular', role, size } = {}) {
  const resolved = resolveFoundationTokens({ appearance: theme, liquidGlassStyle: userStyle, glassRole: role, glassSize: size })
  return resolved.glass[variant === 'clear' ? 'clear' : variant === 'content' ? 'content' : 'regular']
}

/** Legacy object shape derived directly from the resolved foundation map. */
export function computeGlassTokens(appearance = {}) {
  const resolved = resolveFoundationTokens({
    appearance: appearance.theme || appearance,
    liquidGlassStyle: appearance.liquidGlassStyle,
    increasedContrast: appearance.increasedContrast === true,
    reducedTransparency: appearance.reducedTransparency === true,
  })
  const regular = resolved.glass.regular
  const clear = resolved.glass.clear
  const content = resolved.glass.content
  return {
    glassBg: regular.background,
    glassBlur: regular.blur,
    glassBorder: regular.border,
    glassShadow: regular.shadow,
    glassSaturation: regular.saturation.toFixed(2),
    glassBrightness: regular.brightness.toFixed(2),
    glassContrast: regular.contrast.toFixed(2),
    glassHighlight: regular.highlight,
    glassRimLight: regular.rimLight,
    glassRimShade: regular.rimShade,
    glassSpecular: regular.specular,
    glassReflection: regular.reflection,
    glassSpill: regular.spill,
    glassClearBg: clear.background,
    glassClearBlur: clear.blur,
    glassClearBorder: clear.border,
    glassClearShadow: clear.shadow,
    glassClearSaturation: clear.saturation.toFixed(2),
    glassClearBrightness: clear.brightness.toFixed(2),
    glassClearContrast: clear.contrast.toFixed(2),
    glassClearHighlight: clear.highlight,
    glassClearRimLight: clear.rimLight,
    glassClearSpecular: clear.specular,
    glassContentBg: content.background,
    glassContentBlur: content.blur,
    glassContentBorder: content.border,
    glassContentShadow: content.shadow,
    glassContentSaturation: content.saturation.toFixed(2),
    glassContentBrightness: content.brightness.toFixed(2),
    glassContentContrast: content.contrast.toFixed(2),
    regularFillAlpha: regular.fillAlpha,
    regularBlurPx: regular.blurPx,
    clearFillAlpha: clear.fillAlpha,
    contentFillAlpha: content.fillAlpha,
    blurPx: regular.blurPx,
    alpha: regular.fillAlpha,
  }
}

/** Compatibility DOM writer; new renderer code applies the resolved map. */
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
  for (const [name, value] of Object.entries(values)) root.style.setProperty(name, value)
}
