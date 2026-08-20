/**
 * Compatibility adapter for the pre-foundation Liquid Glass API.
 * All values and computation come from resolveFoundationTokens(); this file
 * does not own a second optical model.
 */

import { resolveFoundationTokens } from './ui-foundation.mjs'

export const LIQUID_GLASS_STYLES = Object.freeze({ CLEAR: 'clear', TINTED: 'tinted' })
export const MATERIAL_VARIANTS = Object.freeze({ REGULAR: 'regular', CLEAR: 'clear', CONTENT: 'content' })

export function resolveLiquidGlass({ theme = 'light', userStyle = 'clear', variant = 'regular', role, size, glassStrength, uiScale } = {}) {
  const resolved = resolveFoundationTokens({ appearance: theme, liquidGlassStyle: userStyle, glassRole: role, glassSize: size, glassStrength, uiScale })
  return resolved.glass[variant === 'clear' ? 'clear' : variant === 'content' ? 'content' : 'regular']
}

/** Legacy object shape derived directly from the resolved foundation map. */
export function computeGlassTokens(appearance = {}) {
  const resolved = resolveFoundationTokens({
    appearance: appearance.theme || appearance,
    liquidGlassStyle: appearance.liquidGlassStyle,
    increasedContrast: appearance.increasedContrast === true,
    reducedTransparency: appearance.reducedTransparency === true,
    glassStrength: appearance.glassStrength,
    uiScale: appearance.uiScale,
  })
  const regular = resolved.glass.regular
  const clear = resolved.glass.clear
  const content = resolved.glass.content
  const contentBearing = resolved.contentBearing
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
    glassEdgeTop: regular.edgeTop,
    glassEdgeSide: regular.edgeSide,
    glassEdgeBottom: regular.edgeBottom,
    glassEdgeLensing: regular.edgeLensing,
    glassEdgeSoftening: regular.edgeSoftening,
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
    glassClearEdgeTop: clear.edgeTop,
    glassClearEdgeSide: clear.edgeSide,
    glassClearEdgeBottom: clear.edgeBottom,
    glassClearEdgeLensing: clear.edgeLensing,
    glassClearEdgeSoftening: clear.edgeSoftening,
    glassContentBg: content.background,
    glassContentBlur: content.blur,
    glassContentBorder: content.border,
    glassContentShadow: content.shadow,
    glassContentSaturation: content.saturation.toFixed(2),
    glassContentBrightness: content.brightness.toFixed(2),
    glassContentContrast: content.contrast.toFixed(2),
    glassContentBearingFill: contentBearing.fill,
    glassContentBearingFillAlpha: contentBearing.fillAlpha,
    glassContentBearingBlur: contentBearing.blur,
    glassContentBearingBorder: contentBearing.border,
    glassContentBearingShadow: contentBearing.shadow,
    glassContentBearingSaturation: contentBearing.saturation,
    glassContentBearingBrightness: contentBearing.brightness,
    glassContentBearingSpecular: contentBearing.specular,
    glassContentBearingEdgeTop: contentBearing.edgeTop,
    glassContentBearingEdgeSide: contentBearing.edgeSide,
    glassContentBearingEdgeBottom: contentBearing.edgeBottom,
    glassContentBearingEdgeLensing: contentBearing.edgeLensing,
    glassContentBearingEdgeSoftening: contentBearing.edgeSoftening,
    regularFillAlpha: regular.fillAlpha,
    regularBlurPx: regular.blurPx,
    clearFillAlpha: clear.fillAlpha,
    contentFillAlpha: content.fillAlpha,
    blurPx: regular.blurPx,
    alpha: regular.fillAlpha,
    glassStrength: resolved.glassStrength,
    uiScale: resolved.uiScale,
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
    '--ui-glass-regular-edge-top': tokens.glassEdgeTop,
    '--ui-glass-regular-edge-side': tokens.glassEdgeSide,
    '--ui-glass-regular-edge-bottom': tokens.glassEdgeBottom,
    '--ui-glass-regular-edge-lensing': tokens.glassEdgeLensing,
    '--ui-glass-regular-edge-softening': tokens.glassEdgeSoftening,
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
    '--ui-glass-clear-edge-top': tokens.glassClearEdgeTop,
    '--ui-glass-clear-edge-side': tokens.glassClearEdgeSide,
    '--ui-glass-clear-edge-bottom': tokens.glassClearEdgeBottom,
    '--ui-glass-clear-edge-lensing': tokens.glassClearEdgeLensing,
    '--ui-glass-clear-edge-softening': tokens.glassClearEdgeSoftening,
    '--ui-glass-content-background': tokens.glassContentBg,
    '--ui-glass-content-blur': tokens.glassContentBlur,
    '--ui-glass-content-border': tokens.glassContentBorder,
    '--ui-glass-content-shadow': tokens.glassContentShadow,
    '--ui-glass-content-saturation': tokens.glassContentSaturation,
    '--ui-glass-content-brightness': tokens.glassContentBrightness,
    '--ui-glass-content-contrast': tokens.glassContentContrast,
    '--ui-glass-content-bearing-fill': tokens.glassContentBearingFill,
    '--ui-glass-content-bearing-blur': tokens.glassContentBearingBlur,
    '--ui-glass-content-bearing-border': tokens.glassContentBearingBorder,
    '--ui-glass-content-bearing-shadow': tokens.glassContentBearingShadow,
    '--ui-glass-content-bearing-saturation': tokens.glassContentBearingSaturation,
    '--ui-glass-content-bearing-brightness': tokens.glassContentBearingBrightness,
    '--ui-glass-content-bearing-specular': tokens.glassContentBearingSpecular,
    '--ui-glass-content-bearing-edge-top': tokens.glassContentBearingEdgeTop,
    '--ui-glass-content-bearing-edge-side': tokens.glassContentBearingEdgeSide,
    '--ui-glass-content-bearing-edge-bottom': tokens.glassContentBearingEdgeBottom,
    '--ui-glass-content-bearing-edge-lensing': tokens.glassContentBearingEdgeLensing,
    '--ui-glass-content-bearing-edge-softening': tokens.glassContentBearingEdgeSoftening,
  }
  const canonical = {
    background: tokens.glassBg,
    blur: tokens.glassBlur,
    border: tokens.glassBorder,
    shadow: tokens.glassShadow,
    saturation: tokens.glassSaturation,
    brightness: tokens.glassBrightness,
    contrast: tokens.glassContrast,
    highlight: tokens.glassHighlight,
    rimLight: tokens.glassRimLight,
    rimShade: tokens.glassRimShade,
    specular: tokens.glassSpecular,
    reflection: tokens.glassReflection,
    spill: tokens.glassSpill,
    edgeTop: tokens.glassEdgeTop,
    edgeSide: tokens.glassEdgeSide,
    edgeBottom: tokens.glassEdgeBottom,
    edgeLensing: tokens.glassEdgeLensing,
    edgeSoftening: tokens.glassEdgeSoftening,
  }
  for (const [name, value] of Object.entries(canonical)) root.style.setProperty(`--ui-glass-canonical-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value)
  root.style.setProperty('--ui-glass-canonical-fill-alpha', String(tokens.regularFillAlpha))
  for (const [name, value] of Object.entries(values)) root.style.setProperty(name, value)
  for (const variant of ['regular', 'clear', 'content']) {
    for (const name of Object.keys(canonical)) root.style.setProperty(`--ui-glass-${variant}-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, `var(--ui-glass-canonical-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)})`)
  }
  for (const [name, canonicalName] of Object.entries({ fill: 'background', border: 'border', shadow: 'shadow', blur: 'blur', saturation: 'saturation', brightness: 'brightness', specular: 'specular', edgeTop: 'edge-top', edgeSide: 'edge-side', edgeBottom: 'edge-bottom', edgeLensing: 'edge-lensing', edgeSoftening: 'edge-softening' })) root.style.setProperty(`--ui-glass-content-bearing-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, `var(--ui-glass-canonical-${canonicalName})`)
  root.style.setProperty('--ui-glass-content-bearing-fill-alpha', 'var(--ui-glass-canonical-fill-alpha)')
  if (tokens.glassStrength !== undefined) root.style.setProperty('--ui-glass-strength', String(tokens.glassStrength))
  if (tokens.uiScale !== undefined) {
    root.style.setProperty('--ui-scale', String(tokens.uiScale / 100))
    root.style.setProperty('--ui-scale-percent', `${tokens.uiScale}%`)
  }
}
