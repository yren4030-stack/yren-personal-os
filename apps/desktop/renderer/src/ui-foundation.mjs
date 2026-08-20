/**
 * macOS 26 renderer foundation.
 * FOUNDATION_TOKENS is the only design-input source. The pure resolver turns
 * those inputs into one runtime semantic map; DOM application and legacy CSS
 * aliases only consume that resolved map.
 */

export const SEMANTIC_COLOR_ROLES = Object.freeze([
  'background', 'surface', 'surface-elevated', 'surface-glass', 'text-primary',
  'text-secondary', 'text-tertiary', 'separator', 'accent', 'success',
  'warning', 'critical', 'selection', 'focus',
])

export const FOUNDATION_STATES = Object.freeze([
  'default', 'hover', 'pressed', 'focus-visible', 'selected', 'active', 'disabled',
])

export const UI_SCALE_RANGE = Object.freeze({ min: 85, max: 125, default: 100 })
export const UI_SCALE_PROFILE_DEFAULTS = Object.freeze({
  mode: 'unified',
  unified: UI_SCALE_RANGE.default,
  typography: UI_SCALE_RANGE.default,
  width: UI_SCALE_RANGE.default,
  height: UI_SCALE_RANGE.default,
  verticalSpacing: UI_SCALE_RANGE.default,
  horizontalSpacing: UI_SCALE_RANGE.default,
})

const CANONICAL_APPLICATION_GLASS = Object.freeze({
  light: Object.freeze({
    fill: 'rgba(248, 247, 245, 0.88)', blur: '44px', saturation: '120%', brightness: '1.02',
    border: '1px solid rgba(0, 0, 0, 0.16)', shadow: '0 1px 2px rgba(0, 0, 0, 0.14), 0 18px 50px -20px rgba(0, 0, 0, 0.22)',
    specular: 'linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 22%)', spill: 'none',
  }),
  dark: Object.freeze({
    fill: 'rgba(24, 24, 28, 0.85)', blur: '44px', saturation: '120%', brightness: '1.02',
    border: '1px solid rgba(255, 255, 255, 0.20)', shadow: '0 1px 2px rgba(0, 0, 0, 0.34), 0 18px 50px -20px rgba(0, 0, 0, 0.46)',
    specular: 'linear-gradient(180deg, rgba(255, 255, 255, 0.10), transparent 22%)', spill: 'none',
  }),
})

export const FOUNDATION_TOKENS = Object.freeze({
  colors: Object.freeze({
    light: Object.freeze({
      background: '#f1eff6', surface: '#f9f8fb', 'surface-elevated': '#ffffff',
      'surface-glass': 'rgba(246, 246, 246, 0.62)', 'text-primary': '#1b1b1f',
      'text-secondary': '#6b6b72', 'text-tertiary': '#777780', separator: 'rgba(0, 0, 0, 0.12)',
      accent: '#7849d1', success: '#34c759', warning: '#ff9f0a', critical: '#ff453a',
      selection: 'rgba(120, 73, 209, 0.16)', focus: 'rgba(120, 73, 209, 0.46)',
    }),
    dark: Object.freeze({
      background: '#15161a', surface: '#1b1d23', 'surface-elevated': '#26282f',
      'surface-glass': 'rgba(38, 38, 40, 0.58)', 'text-primary': '#f2f2f6',
      'text-secondary': '#b9bbc3', 'text-tertiary': '#9a9ca7', separator: 'rgba(255, 255, 255, 0.14)',
      accent: '#a984ff', success: '#32d74b', warning: '#ffd60a', critical: '#ff453a',
      selection: 'rgba(169, 132, 255, 0.28)', focus: 'rgba(169, 132, 255, 0.62)',
    }),
  }),
  interaction: Object.freeze({
    light: Object.freeze({
      'button-primary': '#7849d1', 'button-primary-text': '#ffffff', 'button-primary-hover': '#6a3fbd', 'button-primary-pressed': '#5b35a3', 'button-primary-selected': '#643bb0',
      'button-critical-hover': '#d9362e', 'button-critical-pressed': '#c62828', 'button-critical-selected': '#b92121',
      'button-neutral-hover': 'rgba(0, 0, 0, 0.07)', 'button-neutral-pressed': 'rgba(0, 0, 0, 0.12)',
      'selection-background': 'rgba(120, 73, 209, 0.16)', 'selection-text': '#643bb0', 'selection-boundary': 'rgba(120, 73, 209, 0.34)',
      'button-primary-boundary': '1px solid transparent', 'button-primary-shadow': '0 4px 14px rgba(120, 73, 209, 0.24)', 'button-primary-hover-shadow': '0 6px 18px rgba(120, 73, 209, 0.3)',
    }),
    dark: Object.freeze({
      'button-primary': '#a984ff', 'button-primary-text': '#15161a', 'button-primary-hover': '#b99cff', 'button-primary-pressed': '#c7afff', 'button-primary-selected': '#af8fff',
      'button-critical-hover': '#ff756b', 'button-critical-pressed': '#ff8a80', 'button-critical-selected': '#ff6d63',
      'button-neutral-hover': 'rgba(255, 255, 255, 0.07)', 'button-neutral-pressed': 'rgba(255, 255, 255, 0.12)',
      'selection-background': 'rgba(169, 132, 255, 0.28)', 'selection-text': '#d0bfff', 'selection-boundary': 'rgba(208, 191, 255, 0.58)',
      'button-primary-boundary': '1px solid transparent', 'button-primary-shadow': '0 4px 14px rgba(169, 132, 255, 0.28)', 'button-primary-hover-shadow': '0 6px 18px rgba(169, 132, 255, 0.34)',
    }),
  }),
  contrast: Object.freeze({
    light: Object.freeze({
      separator: 'rgba(0, 0, 0, 0.3)', focus: '#4f22a8', 'text-primary': '#111116', 'text-secondary': '#4f4f58', selection: 'rgba(120, 73, 209, 0.28)',
      'button-primary': '#6638bd', 'button-primary-hover': '#52279f', 'button-primary-pressed': '#431d87', 'button-primary-selected': '#4d2497',
      'button-primary-text': '#ffffff', 'button-primary-boundary': '1px solid rgba(49, 23, 111, 0.72)', 'button-primary-shadow': '0 4px 14px rgba(49, 23, 111, 0.38)', 'button-primary-hover-shadow': '0 6px 18px rgba(49, 23, 111, 0.46)',
      'selection-background': 'rgba(120, 73, 209, 0.28)', 'selection-text': '#4f22a8', 'selection-boundary': 'rgba(79, 34, 168, 0.7)',
      glass: Object.freeze({
        regular: Object.freeze({ background: 'rgba(255, 255, 255, 0.24)', border: '1px solid rgba(0, 0, 0, 0.3)', shadow: '0 1px 2px rgba(0, 0, 0, 0.18), 0 18px 50px -20px rgba(0, 0, 0, 0.22)' }),
        clear: Object.freeze({ background: 'rgba(255, 255, 255, 0.16)', border: '1px solid rgba(0, 0, 0, 0.3)', shadow: '0 1px 2px rgba(0, 0, 0, 0.16), 0 12px 36px -18px rgba(0, 0, 0, 0.2)' }),
      }),
    }),
    dark: Object.freeze({
      separator: 'rgba(255, 255, 255, 0.34)', focus: '#d0bfff', 'text-primary': '#ffffff', 'text-secondary': '#e5e5eb', selection: 'rgba(169, 132, 255, 0.42)',
      'button-primary': '#b99cff', 'button-primary-hover': '#c7afff', 'button-primary-pressed': '#d4c2ff', 'button-primary-selected': '#c0a7ff',
      'button-primary-text': '#15161a', 'button-primary-boundary': '1px solid rgba(235, 226, 255, 0.76)', 'button-primary-shadow': '0 4px 14px rgba(0, 0, 0, 0.38)', 'button-primary-hover-shadow': '0 6px 18px rgba(0, 0, 0, 0.48)',
      'selection-background': 'rgba(169, 132, 255, 0.42)', 'selection-text': '#ffffff', 'selection-boundary': 'rgba(208, 191, 255, 0.78)',
      glass: Object.freeze({
        regular: Object.freeze({ background: 'rgba(52, 55, 64, 0.86)', border: '1px solid rgba(255, 255, 255, 0.34)', shadow: '0 1px 2px rgba(0, 0, 0, 0.34), 0 18px 50px -20px rgba(0, 0, 0, 0.42)' }),
        clear: Object.freeze({ background: 'rgba(48, 51, 60, 0.78)', border: '1px solid rgba(255, 255, 255, 0.34)', shadow: '0 1px 2px rgba(0, 0, 0, 0.3), 0 12px 36px -18px rgba(0, 0, 0, 0.38)' }),
      }),
    }),
  }),
  glass: Object.freeze({
  strength: Object.freeze({ min: 0, max: 100, default: 30 }),
    canonical: CANONICAL_APPLICATION_GLASS,
    contentBearing: CANONICAL_APPLICATION_GLASS,
    edge: Object.freeze({
      light: Object.freeze({ top: 0.10, side: 0.048, bottom: 0.036, lensing: 0.06, softening: 0.035 }),
      dark: Object.freeze({ top: 0.09, side: 0.045, bottom: 0.032, lensing: 0.05, softening: 0.03 }),
    }),
    palette: Object.freeze({ light: Object.freeze({ fillRgb: '255, 255, 255', borderRgb: '0, 0, 0', highlightRgb: '255, 255, 255', shadeRgb: '0, 0, 0', spillRgb: '150, 158, 186' }), dark: Object.freeze({ fillRgb: '34, 36, 42', borderRgb: '255, 255, 255', highlightRgb: '255, 255, 255', shadeRgb: '0, 0, 0', spillRgb: '110, 122, 160' }) }),
  }),
  spacing: Object.freeze({ 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 }),
  radius: Object.freeze({ 'control-sm': 6, 'control-md': 8, 'surface-sm': 10, 'surface-md': 12, 'surface-lg': 16, floating: 20, capsule: 999 }),
  typography: Object.freeze({
    family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Microsoft YaHei", sans-serif',
    caption: Object.freeze({ size: 11, weight: 400 }), label: Object.freeze({ size: 12, weight: 500 }), body: Object.freeze({ size: 13, weight: 400 }), bodyStrong: Object.freeze({ size: 13, weight: 600 }), section: Object.freeze({ size: 14, weight: 600 }), title3: Object.freeze({ size: 17, weight: 600 }), title2: Object.freeze({ size: 20, weight: 600 }), title1: Object.freeze({ size: 24, weight: 600 }), hero: Object.freeze({ size: 32, weight: 700 }),
  }),
  motion: Object.freeze({ hover: 120, press: 100, selection: 160, popover: 200, panel: 240, page: 280 }),
  geometry: Object.freeze({ 'control-height': 32, 'icon-only-size': 32, 'border-width': 1, 'focus-width': 2, 'focus-offset': 2, 'disabled-opacity': 0.45 }),
  layout: Object.freeze({ 'shell-padding': 'clamp(8px, 1vw, 12px)', 'shell-gap': 'clamp(10px, 1vw, 12px)', 'page-padding-x': 'clamp(14px, 2.2vw, 24px)', 'page-padding-bottom': 'clamp(16px, 2vw, 28px)', 'section-gap': 'clamp(16px, 1.5vw, 24px)', 'grid-gap': 'clamp(12px, 1.4vw, 16px)', 'sidebar-width': '232px', 'control-height': '40px', 'page-title-size': 'clamp(24px, 2.6vw, 28px)' }),
})

function resolveTheme(theme) { return theme === 'dark' ? 'dark' : 'light' }
function resolveRoot(root) { if (root && root.style && root.dataset) return root; if (typeof document !== 'undefined') return document.documentElement; return null }
function rgba(rgb, alpha) { return `rgba(${rgb}, ${alpha.toFixed(3)})` }

export function normalizeUiScale(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return UI_SCALE_RANGE.default
  return Math.min(UI_SCALE_RANGE.max, Math.max(UI_SCALE_RANGE.min, Math.round(n)))
}

export function normalizeUiScaleProfile(value, fallback = UI_SCALE_PROFILE_DEFAULTS) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const clampScale = (candidate, defaultValue) => normalizeUiScale(candidate ?? defaultValue)
  const unified = clampScale(source.unified, fallback.unified)
  const mode = source.mode === 'separate' ? 'separate' : 'unified'
  return Object.freeze({
    mode,
    unified,
    typography: clampScale(source.typography, mode === 'unified' ? unified : fallback.typography),
    width: clampScale(source.width, mode === 'unified' ? unified : fallback.width),
    height: clampScale(source.height, mode === 'unified' ? unified : fallback.height),
    verticalSpacing: clampScale(source.verticalSpacing, mode === 'unified' ? unified : fallback.verticalSpacing),
    horizontalSpacing: clampScale(source.horizontalSpacing, mode === 'unified' ? unified : fallback.horizontalSpacing),
  })
}

function scaleCssMetrics(value, factor) {
  return String(value).replace(/(-?\d+(?:\.\d+)?)px/g, (_match, number) => `${(Number(number) * factor).toFixed(3).replace(/\.?(0+)$/, '')}px`)
}

function resolveScaledTokens(profile) {
  const unifiedFactor = profile.unified / 100
  const typographyFactor = profile.typography / 100
  // Separate mode delegates width/height to selected-container resizing; the
  // stored profile fields remain only for backward-compatible persistence.
  const widthFactor = profile.mode === 'unified' ? profile.width / 100 : 1
  const heightFactor = profile.mode === 'unified' ? profile.height / 100 : 1
  const verticalSpacingFactor = profile.verticalSpacing / 100
  const horizontalSpacingFactor = profile.horizontalSpacing / 100
  const spacingVertical = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.spacing).map(([name, value]) => [name, value * verticalSpacingFactor])))
  const spacingHorizontal = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.spacing).map(([name, value]) => [name, value * horizontalSpacingFactor])))
  const radiusFactor = Math.sqrt(widthFactor * heightFactor)
  const radius = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.radius).map(([name, value]) => [name, name === 'capsule' ? value : value * radiusFactor])))
  const geometry = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.geometry).map(([name, value]) => {
    if (typeof value !== 'number' || name === 'disabled-opacity') return [name, value]
    const factor = name.includes('height') || name.includes('offset') ? heightFactor : widthFactor
    return [name, value * factor]
  })))
  const typography = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.typography).map(([name, value]) => [name, name === 'family' ? value : Object.freeze({ ...value, size: value.size * typographyFactor })])))
  const layout = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.layout).map(([name, value]) => {
    const factor = name.includes('padding-x') || name.includes('sidebar-width') || name.includes('grid-gap') ? horizontalSpacingFactor : verticalSpacingFactor
    return [name, scaleCssMetrics(value, factor)]
  })))
  const layoutHorizontal = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.layout).map(([name, value]) => [name, scaleCssMetrics(value, horizontalSpacingFactor)])))
  const layoutVertical = Object.freeze(Object.fromEntries(Object.entries(FOUNDATION_TOKENS.layout).map(([name, value]) => [name, scaleCssMetrics(value, verticalSpacingFactor)])))
  return { factor: unifiedFactor, spacing: spacingVertical, spacingVertical, spacingHorizontal, radius, geometry, typography, layout, layoutHorizontal, layoutVertical }
}

export function normalizeGlassStrength(value) {
  const { min, max, default: fallback } = FOUNDATION_TOKENS.glass.strength
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

const GLASS_STRENGTH_NEUTRAL = 60

function easedStrengthProgress(strength) {
  const progress = strength <= GLASS_STRENGTH_NEUTRAL ? strength / GLASS_STRENGTH_NEUTRAL : (strength - GLASS_STRENGTH_NEUTRAL) / 40
  return progress * progress * (3 - 2 * progress)
}

/**
 * One bounded optical mapping shared by every Foundation material. The
 * neutral point is 60, preserving the established optical baseline while the
 * user-facing default is 30 and keeping the
 * ends useful: lower values reveal more environment; higher values stabilize
 * the frosted body. Reduced Transparency bypasses this mapping entirely.
 */
export function resolveGlassStrengthProfile(value = FOUNDATION_TOKENS.glass.strength.default) {
  const strength = normalizeGlassStrength(value)
  const progress = easedStrengthProgress(strength)
  const delta = strength <= GLASS_STRENGTH_NEUTRAL ? progress - 1 : progress
  return Object.freeze({
    value: strength,
    delta,
    progress,
    fill: delta * 0.10,
    blur: delta * 8,
    saturation: delta * 0.10,
    brightness: delta * 0.012,
    border: delta * 0.018,
    rimLight: delta * 0.015,
    rimShade: delta * 0.008,
    specular: delta * 0.018,
    edgeTop: delta * 0.010,
    edgeSide: delta * 0.007,
    edgeBottom: delta * 0.005,
    lensing: delta * 0.008,
    softening: delta * 0.006,
    contact: delta * 0.035,
    ambient: delta * 0.04,
    shadow: delta * 0.05,
  })
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }

function adjustRgbaAlphas(value, delta, min, max) {
  return value.replace(/rgba\(\s*(\d+\s*,\s*\d+\s*,\s*\d+)\s*,\s*([\d.]+)\s*\)/g, (_match, rgb, alpha) => rgba(rgb, clamp(Number(alpha) + delta, min, max)))
}

function applyGlassStrength(material, glassStrength) {
  const profile = resolveGlassStrengthProfile(glassStrength)
  return {
    ...material,
    glassStrength: profile.value,
    fillAlpha: clamp(material.fillAlpha + profile.fill, 0.04, 0.92),
    blurPx: clamp(material.blurPx + profile.blur, 4, 48),
    brightness: clamp(material.brightness + profile.brightness, 0.96, 1.08),
    saturation: clamp(material.saturation + profile.saturation, 1, 1.6),
    borderAlpha: clamp(material.borderAlpha + profile.border, 0.04, 0.24),
    rimLightAlpha: clamp(Math.min(material.rimLightAlpha, 0.18) + profile.rimLight, 0.02, 0.24),
    rimShadeAlpha: clamp(material.rimShadeAlpha + profile.rimShade, 0.02, 0.16),
    specularAlpha: clamp(Math.min(material.specularAlpha, 0.16) + profile.specular, 0.02, 0.24),
    contactAlpha: clamp(material.contactAlpha + profile.contact, 0.02, 0.45),
    ambientAlpha: clamp(material.ambientAlpha + profile.ambient, 0.02, 0.45),
    shadowAlpha: clamp((material.shadowAlpha ?? material.ambientAlpha) + profile.shadow, 0.12, 0.46),
  }
}

function resolveEdgeOptics(theme, palette, sizeSpec, profile) {
  const base = FOUNDATION_TOKENS.glass.edge[theme]
  const scale = sizeSpec?.edge || 1
  const top = clamp(base.top * scale + profile.edgeTop, 0.02, 0.16)
  const side = clamp(base.side * scale + profile.edgeSide, 0.015, 0.10)
  const bottom = clamp(base.bottom * scale + profile.edgeBottom, 0.012, 0.08)
  const lensing = clamp(base.lensing * scale + profile.lensing, 0.018, 0.10)
  const softening = clamp(base.softening * scale + profile.softening, 0.012, 0.08)
  return {
    edgeTop: rgba(palette.highlightRgb, top),
    edgeSide: rgba(palette.highlightRgb, side),
    edgeBottom: rgba(palette.shadeRgb, bottom),
    edgeLensing: `radial-gradient(ellipse 26% 78% at 0% 50%, ${rgba(palette.highlightRgb, lensing)}, transparent 72%), radial-gradient(ellipse 26% 78% at 100% 50%, ${rgba(palette.highlightRgb, lensing)}, transparent 72%)`,
    edgeSoftening: rgba(palette.shadeRgb, softening),
  }
}

const NO_EDGE_OPTICS = Object.freeze({ edgeTop: 'none', edgeSide: 'none', edgeBottom: 'none', edgeLensing: 'none', edgeSoftening: 'transparent' })

function cssAlpha(value, fallback = 0) {
  const match = String(value).match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/)
  return match ? Number(match[1]) : fallback
}

function resolveCanonicalGlassMaterial(theme, colors, reducedTransparency, glassStrength, contrastGlass) {
  const material = FOUNDATION_TOKENS.glass.canonical[theme]
  if (!reducedTransparency) {
    const profile = resolveGlassStrengthProfile(glassStrength)
    const palette = FOUNDATION_TOKENS.glass.palette[theme]
    const edge = resolveEdgeOptics(theme, palette, { edge: 1 }, profile)
    const fillAtZero = theme === 'dark' ? 0.24 : 0.20
    const fillAtBaseline = theme === 'dark' ? 0.85 : 0.88
    const fillProgress = profile.progress
    const fillAlpha = Number((profile.value <= GLASS_STRENGTH_NEUTRAL
      ? fillAtZero + (fillAtBaseline - fillAtZero) * fillProgress
      : fillAtBaseline + (0.94 - fillAtBaseline) * fillProgress).toFixed(3))
    const bodyRgb = theme === 'dark' ? '24, 24, 28' : '248, 247, 245'
    const resolved = {
      ...material,
      ...edge,
      glassStrength: profile.value,
      fill: rgba(bodyRgb, clamp(fillAlpha, 0.18, 0.94)),
      fillAlpha,
      blur: `${profile.value <= GLASS_STRENGTH_NEUTRAL ? 16 + (44 - 16) * fillProgress : 44 + (48 - 44) * fillProgress}px`,
      saturation: `${Math.round(profile.value <= GLASS_STRENGTH_NEUTRAL ? 108 + (120 - 108) * fillProgress : 120 + (128 - 120) * fillProgress)}%`,
      brightness: String(clamp(profile.value <= GLASS_STRENGTH_NEUTRAL ? 1.005 + (1.02 - 1.005) * fillProgress : 1.02 + (1.032 - 1.02) * fillProgress, 1, 1.05)),
      border: adjustRgbaAlphas(material.border, profile.border, 0.08, 0.28),
      shadow: adjustRgbaAlphas(material.shadow, profile.shadow, 0.10, 0.52),
      specular: adjustRgbaAlphas(material.specular, profile.specular * 0.35, 0.04, 0.16),
    }
    return Object.freeze(contrastGlass ? { ...resolved, border: contrastGlass.border || resolved.border, shadow: contrastGlass.shadow || resolved.shadow } : resolved)
  }
  return Object.freeze({
    ...material,
    ...NO_EDGE_OPTICS,
    glassStrength: normalizeGlassStrength(glassStrength),
    fillAlpha: 1,
    fill: colors['surface-elevated'],
    blur: '0px',
    saturation: '100%',
    brightness: '1',
    border: `1px solid ${colors.separator}`,
    shadow: 'none',
    specular: 'none',
    spill: 'none',
  })
}

function canonicalToGlassMaterial(canonical, theme, variant) {
  const palette = FOUNDATION_TOKENS.glass.palette[theme]
  return Object.freeze({
    variant,
    glassStrength: canonical.glassStrength,
    fillAlpha: canonical.fillAlpha,
    blurPx: Number.parseFloat(canonical.blur) || 0,
    brightness: Number(canonical.brightness),
    contrast: 1,
    saturation: Number.parseFloat(canonical.saturation) / 100,
    borderAlpha: cssAlpha(canonical.border),
    rimLightAlpha: cssAlpha(canonical.edgeTop),
    rimShadeAlpha: cssAlpha(canonical.edgeBottom),
    specularAlpha: cssAlpha(canonical.specular),
    contactAlpha: cssAlpha(canonical.shadow, 0.04),
    ambientAlpha: cssAlpha(canonical.shadow, 0.12),
    shadowAlpha: cssAlpha(canonical.shadow, 0.12),
    spillAlpha: 0,
    fillRgb: palette.fillRgb,
    borderRgb: palette.borderRgb,
    background: canonical.fill,
    border: canonical.border,
    shadow: canonical.shadow,
    blur: canonical.blur,
    highlight: canonical.specular,
    rimLight: canonical.edgeTop,
    rimShade: canonical.edgeBottom,
    specular: canonical.specular,
    reflection: 'none',
    spill: 'none',
    edgeTop: canonical.edgeTop,
    edgeSide: canonical.edgeSide,
    edgeBottom: canonical.edgeBottom,
    edgeLensing: canonical.edgeLensing,
    edgeSoftening: canonical.edgeSoftening,
  })
}

/** Pure, deterministic resolver for the complete renderer foundation. */
export function resolveFoundationTokens(options = {}) {
  const appearance = typeof options.appearance === 'object' && options.appearance !== null ? options.appearance : {}
  const theme = resolveTheme(typeof options.appearance === 'string' ? options.appearance : options.theme || appearance.theme)
  const userStyle = (options.liquidGlassStyle || appearance.liquidGlassStyle) === 'tinted' ? 'tinted' : 'clear'
  const increasedContrast = options.increasedContrast === true
  const reducedTransparency = options.reducedTransparency === true
  const glassStrength = normalizeGlassStrength(options.glassStrength ?? appearance.glassStrength)
  const uiScaleProfile = normalizeUiScaleProfile(options.uiScaleProfile ?? appearance.uiScaleProfile ?? {
    unified: options.uiScale ?? appearance.uiScale,
  })
  const uiScale = uiScaleProfile.unified
  const scaled = resolveScaledTokens(uiScaleProfile)
  const base = FOUNDATION_TOKENS.colors[theme]
  const contrast = FOUNDATION_TOKENS.contrast[theme]
  const colors = Object.freeze(increasedContrast ? { ...base, separator: contrast.separator, focus: contrast.focus, selection: contrast.selection, 'text-primary': contrast['text-primary'], 'text-secondary': contrast['text-secondary'] } : { ...base })
  const contrastGlass = increasedContrast ? contrast.glass : null
  const canonical = resolveCanonicalGlassMaterial(theme, colors, reducedTransparency, glassStrength, contrastGlass?.regular)
  const glass = Object.freeze({
    regular: canonicalToGlassMaterial(canonical, theme, 'regular'),
    clear: canonicalToGlassMaterial(canonical, theme, 'clear'),
    content: canonicalToGlassMaterial(canonical, theme, 'content'),
  })
  const contentBearing = canonical
  const interaction = Object.freeze(increasedContrast ? { ...FOUNDATION_TOKENS.interaction[theme], ...Object.fromEntries(Object.entries(contrast).filter(([name]) => name.startsWith('button-') || name.startsWith('selection-'))) } : FOUNDATION_TOKENS.interaction[theme])
  return Object.freeze({
    theme, userStyle, glassStrength, uiScale, uiScaleProfile,
    uiScaleMode: uiScaleProfile.mode,
    typographyScale: uiScaleProfile.typography,
    widthScale: uiScaleProfile.mode === 'unified' ? uiScaleProfile.width : 100,
    heightScale: uiScaleProfile.mode === 'unified' ? uiScaleProfile.height : 100,
    verticalSpacingScale: uiScaleProfile.verticalSpacing,
    horizontalSpacingScale: uiScaleProfile.horizontalSpacing,
    scaleFactor: scaled.factor, increasedContrast, reducedTransparency, colors, interaction, contrast,
    spacing: scaled.spacing, spacingVertical: scaled.spacingVertical, spacingHorizontal: scaled.spacingHorizontal,
    radius: scaled.radius, typography: scaled.typography, motion: FOUNDATION_TOKENS.motion, geometry: scaled.geometry,
    layout: scaled.layout, layoutHorizontal: scaled.layoutHorizontal, layoutVertical: scaled.layoutVertical,
    glass, contentBearing,
  })
}

/** Legacy names remain aliases only; no legacy value table is maintained. */
export function buildLegacyAliases(resolved) {
  if (!resolved || !resolved.colors || !resolved.glass) throw new TypeError('buildLegacyAliases requires resolved Foundation tokens')
  const colorAlias = (name) => `var(--ui-color-${name})`
  const glassAlias = (variant, name) => {
    if (!resolved.glass[variant]) throw new TypeError(`unknown Foundation glass variant: ${variant}`)
    return `var(--ui-glass-${variant}-${name})`
  }
  return {
    '--accent': 'var(--ui-interaction-button-primary)', '--accent-hover': 'var(--ui-interaction-button-primary-hover)', '--accent-soft': colorAlias('selection'), '--accent-tint': 'var(--ui-interaction-selection-background)', '--accent-focus': colorAlias('focus'),
    '--bg-base': 'var(--ui-color-background)', '--bg-depth-1': 'var(--ui-color-surface)', '--bg-depth-2': 'var(--ui-color-background)', '--text-primary': 'var(--ui-color-text-primary)', '--text-secondary': 'var(--ui-color-text-secondary)', '--text-tertiary': 'var(--ui-color-text-tertiary)',
    '--control-bg': 'color-mix(in srgb, var(--ui-color-text-primary) 6%, transparent)', '--control-bg-active': 'var(--ui-color-surface-elevated)', '--control-solid': 'var(--ui-color-surface-elevated)', '--control-border': 'var(--ui-geometry-border-width) solid var(--ui-color-separator)', '--btn-secondary-bg': 'var(--ui-color-surface-elevated)', '--btn-secondary-bg-hover': 'var(--ui-interaction-button-neutral-hover)', '--hover-bg': 'var(--ui-interaction-button-neutral-hover)', '--interact-hover': 'color-mix(in srgb, var(--ui-glass-regular-highlight) 35%, transparent)', '--interact-active': 'color-mix(in srgb, var(--ui-glass-regular-highlight) 55%, transparent)', '--chip-bg': 'var(--ui-color-selection)', '--track-bg': 'var(--ui-color-separator)', '--empty-bg': 'var(--ui-color-surface)', '--divider': 'var(--ui-color-separator)', '--scrollbar-thumb': 'var(--ui-color-separator)', '--glass-edge-top': 'var(--ui-glass-regular-highlight)',
    '--status-success': 'var(--ui-color-success)', '--status-warning': 'var(--ui-color-warning)', '--status-danger': 'var(--ui-color-critical)', '--error-bg': 'color-mix(in srgb, var(--ui-color-critical) 7%, transparent)', '--error-border': 'color-mix(in srgb, var(--ui-color-critical) 18%, transparent)', '--error-text': 'var(--ui-color-critical)',
    '--radius-window': 'var(--ui-radius-floating)', '--radius-glass-large': 'var(--ui-radius-floating)', '--radius-glass-medium': 'var(--ui-radius-surface-lg)', '--radius-control': 'var(--ui-radius-surface-sm)', '--radius-capsule': 'var(--ui-radius-capsule)', '--shell-padding': 'var(--ui-layout-shell-padding)', '--shell-gap': 'var(--ui-layout-shell-gap)', '--page-padding-x': 'var(--ui-layout-page-padding-x)', '--page-padding-bottom': 'var(--ui-layout-page-padding-bottom)', '--section-gap': 'var(--ui-layout-section-gap)', '--grid-gap': 'var(--ui-layout-grid-gap)', '--sidebar-width': 'var(--ui-layout-sidebar-width)', '--control-height': 'var(--ui-layout-control-height)', '--page-title-size': 'var(--ui-layout-page-title-size)',
    '--glass-bg': glassAlias('regular', 'background'), '--glass-blur': glassAlias('regular', 'blur'), '--glass-border': glassAlias('regular', 'border'), '--glass-shadow': glassAlias('regular', 'shadow'), '--glass-saturation': glassAlias('regular', 'saturation'), '--glass-brightness': glassAlias('regular', 'brightness'), '--glass-contrast': glassAlias('regular', 'contrast'), '--glass-highlight': glassAlias('regular', 'highlight'), '--glass-rim-light': glassAlias('regular', 'rim-light'), '--glass-rim-shade': glassAlias('regular', 'rim-shade'), '--glass-specular': glassAlias('regular', 'specular'), '--glass-reflection': glassAlias('regular', 'reflection'), '--glass-spill': glassAlias('regular', 'spill'), '--glass-edge-top': glassAlias('regular', 'edge-top'), '--glass-edge-side': glassAlias('regular', 'edge-side'), '--glass-edge-bottom': glassAlias('regular', 'edge-bottom'), '--glass-edge-lensing': glassAlias('regular', 'edge-lensing'), '--glass-edge-softening': glassAlias('regular', 'edge-softening'),
    '--glass-clear-bg': glassAlias('clear', 'background'), '--glass-clear-blur': glassAlias('clear', 'blur'), '--glass-clear-border': glassAlias('clear', 'border'), '--glass-clear-shadow': glassAlias('clear', 'shadow'), '--glass-clear-saturation': glassAlias('clear', 'saturation'), '--glass-clear-brightness': glassAlias('clear', 'brightness'), '--glass-clear-contrast': glassAlias('clear', 'contrast'), '--glass-clear-highlight': glassAlias('clear', 'highlight'), '--glass-clear-rim-light': glassAlias('clear', 'rim-light'), '--glass-clear-specular': glassAlias('clear', 'specular'), '--glass-content-bg': glassAlias('content', 'background'), '--glass-content-fill': 'var(--ui-glass-content-bearing-fill)', '--glass-content-blur': 'var(--ui-glass-content-bearing-blur)', '--glass-content-border': glassAlias('content', 'border'), '--glass-content-shadow': glassAlias('content', 'shadow'), '--glass-content-saturation': glassAlias('content', 'saturation'), '--glass-content-brightness': glassAlias('content', 'brightness'), '--glass-content-contrast': glassAlias('content', 'contrast'), '--glass-bg-content': glassAlias('content', 'background'),
  }
}

function writeGroup(root, prefix, values, transform = (value) => value) { for (const [name, value] of Object.entries(values)) root.style.setProperty(`${prefix}${name}`, transform(value, name)) }

function writeGlass(root, resolved) {
  const material = resolved.glass.regular
  for (const key of ['background', 'border', 'shadow', 'blur', 'saturation', 'brightness', 'contrast', 'highlight', 'rimLight', 'rimShade', 'specular', 'reflection', 'spill', 'edgeTop', 'edgeSide', 'edgeBottom', 'edgeLensing', 'edgeSoftening']) {
    const cssName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    const value = key === 'saturation' && typeof material[key] === 'number' ? `${Math.round(material[key] * 100)}%` : material[key]
    root.style.setProperty(`--ui-glass-canonical-${cssName}`, value)
    for (const variant of Object.keys(resolved.glass)) root.style.setProperty(`--ui-glass-${variant}-${cssName}`, `var(--ui-glass-canonical-${cssName})`)
  }
  for (const variant of Object.keys(resolved.glass)) root.style.setProperty(`--ui-glass-${variant}-fill-alpha`, `var(--ui-glass-canonical-fill-alpha)`)
  root.style.setProperty('--ui-glass-canonical-fill-alpha', String(material.fillAlpha))
}

function writeContentBearing(root) {
  const aliases = {
    fill: 'background', border: 'border', shadow: 'shadow', blur: 'blur', saturation: 'saturation',
    brightness: 'brightness', specular: 'specular', spill: 'spill', edgeTop: 'edge-top', edgeSide: 'edge-side',
    edgeBottom: 'edge-bottom', edgeLensing: 'edge-lensing', edgeSoftening: 'edge-softening',
  }
  for (const [name, canonicalName] of Object.entries(aliases)) root.style.setProperty(`--ui-glass-content-bearing-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, `var(--ui-glass-canonical-${canonicalName})`)
  root.style.setProperty('--ui-glass-content-bearing-fill-alpha', 'var(--ui-glass-canonical-fill-alpha)')
}

export function applyFoundationTokens(root, resolvedOrTheme = 'light', options = {}) {
  const target = resolveRoot(root)
  const resolved = resolvedOrTheme && resolvedOrTheme.glass ? resolvedOrTheme : resolveFoundationTokens({ appearance: resolvedOrTheme, ...options })
  if (!target) return resolved
  writeGroup(target, '--ui-color-', resolved.colors)
  writeGroup(target, '--ui-interaction-', resolved.interaction)
  writeGroup(target, '--ui-contrast-', resolved.contrast)
  writeGroup(target, '--ui-space-', resolved.spacing, (value) => `${value}px`)
  writeGroup(target, '--ui-space-v-', resolved.spacingVertical, (value) => `${value}px`)
  writeGroup(target, '--ui-space-h-', resolved.spacingHorizontal, (value) => `${value}px`)
  writeGroup(target, '--ui-radius-', resolved.radius, (value) => `${value}px`)
  writeGroup(target, '--ui-motion-', resolved.motion, (value) => `${value}ms`)
  writeGroup(target, '--ui-geometry-', resolved.geometry, (value, name) => name === 'disabled-opacity' ? String(value) : `${value}px`)
  writeGroup(target, '--ui-layout-', resolved.layout)
  writeGroup(target, '--ui-layout-horizontal-', resolved.layoutHorizontal)
  writeGroup(target, '--ui-layout-vertical-', resolved.layoutVertical)
  target.style.setProperty('--ui-content-border', 'var(--ui-geometry-border-width) solid var(--ui-color-separator)')
  target.style.setProperty('--ui-content-shadow', 'none')
  target.style.setProperty('--ui-scale', String(resolved.scaleFactor))
  target.style.setProperty('--ui-scale-percent', `${resolved.uiScale}%`)
  target.style.setProperty('--ui-scale-mode', resolved.uiScaleMode)
  target.style.setProperty('--ui-scale-typography', String(resolved.typographyScale / 100))
  target.style.setProperty('--ui-scale-width', String(resolved.widthScale / 100))
  target.style.setProperty('--ui-scale-height', String(resolved.heightScale / 100))
  target.style.setProperty('--ui-scale-spacing-vertical', String(resolved.verticalSpacingScale / 100))
  target.style.setProperty('--ui-scale-spacing-horizontal', String(resolved.horizontalSpacingScale / 100))
  for (const [name, token] of Object.entries(resolved.typography)) {
    if (name === 'family') target.style.setProperty('--ui-font-family', token)
    else { target.style.setProperty(`--ui-type-${name}-size`, `${token.size}px`); target.style.setProperty(`--ui-type-${name}-weight`, String(token.weight)) }
  }
  writeGlass(target, resolved)
  writeContentBearing(target)
  target.style.setProperty('--ui-glass-strength', String(resolved.glassStrength))
  for (const [name, value] of Object.entries(buildLegacyAliases(resolved))) target.style.setProperty(name, value)
  target.dataset.foundationTheme = resolved.theme
  target.dataset.foundationAppearance = resolved.userStyle
  target.dataset.foundationIncreasedContrast = String(resolved.increasedContrast)
  target.dataset.foundationReducedTransparency = String(resolved.reducedTransparency)
  target.dataset.foundationGlassStrength = String(resolved.glassStrength)
  target.dataset.uiScale = String(resolved.uiScale)
  target.dataset.uiScaleMode = resolved.uiScaleMode
  target.dataset.uiTypographyScale = String(resolved.typographyScale)
  target.dataset.uiWidthScale = String(resolved.widthScale)
  target.dataset.uiHeightScale = String(resolved.heightScale)
  target.dataset.uiVerticalSpacingScale = String(resolved.verticalSpacingScale)
  target.dataset.uiHorizontalSpacingScale = String(resolved.horizontalSpacingScale)
  return resolved
}

export function resolveButtonTokens({ variant = 'secondary', state = 'default', theme = 'light', increasedContrast = false } = {}) {
  const resolved = resolveFoundationTokens({ appearance: theme, increasedContrast })
  const normalizedState = FOUNDATION_STATES.includes(state) ? state : 'default'
  const primary = variant === 'primary'
  const destructive = variant === 'destructive'
  let background = variant === 'secondary' ? resolved.colors['surface-elevated'] : 'transparent'
  let color = resolved.colors['text-primary']
  let border = `var(--ui-geometry-border-width) solid ${resolved.colors.separator}`
  if (primary) {
    color = resolved.interaction['button-primary-text']; background = resolved.interaction['button-primary']
    border = resolved.interaction['button-primary-boundary']
    if (normalizedState === 'hover') background = resolved.interaction['button-primary-hover']
    if (normalizedState === 'pressed' || normalizedState === 'active') background = resolved.interaction['button-primary-pressed']
    if (normalizedState === 'selected') background = resolved.interaction['button-primary-selected']
  } else if (destructive) {
    color = resolved.colors.critical; background = 'color-mix(in srgb, var(--ui-color-critical) 12%, transparent)'
    if (normalizedState === 'hover') { background = resolved.interaction['button-critical-hover']; color = resolved.interaction['button-primary-text'] }
    if (normalizedState === 'pressed' || normalizedState === 'active') { background = resolved.interaction['button-critical-pressed']; color = resolved.interaction['button-primary-text'] }
    if (normalizedState === 'selected') { background = resolved.interaction['button-critical-selected']; color = resolved.interaction['button-primary-text'] }
  } else if (normalizedState === 'hover') background = resolved.interaction['button-neutral-hover']
  else if (normalizedState === 'pressed' || normalizedState === 'active') background = resolved.interaction['button-neutral-pressed']
  return Object.freeze({ variant, state: normalizedState, background, color, border, focus: resolved.colors.focus, disabledOpacity: resolved.geometry['disabled-opacity'] })
}

export function resolveFoundationPreferences(preferences = {}) { return Object.freeze({ reducedMotion: preferences.reducedMotion === true, reducedTransparency: preferences.reducedTransparency === true, increasedContrast: preferences.increasedContrast === true }) }

export function readFoundationPreferences() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return resolveFoundationPreferences()
  return resolveFoundationPreferences({ reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches, increasedContrast: window.matchMedia('(prefers-contrast: more)').matches })
}

export function applyFoundationPreferences(rootOrPreferences, maybePreferences) {
  const hasRoot = Boolean(rootOrPreferences && rootOrPreferences.style && rootOrPreferences.dataset)
  const target = hasRoot ? rootOrPreferences : resolveRoot()
  const resolved = resolveFoundationPreferences(hasRoot ? maybePreferences : rootOrPreferences || readFoundationPreferences())
  if (!target) return resolved
  target.dataset.reducedMotion = String(resolved.reducedMotion); target.dataset.reducedTransparency = String(resolved.reducedTransparency); target.dataset.increasedContrast = String(resolved.increasedContrast)
  return resolved
}

export function watchFoundationPreferences(onChange) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const queries = [window.matchMedia('(prefers-reduced-motion: reduce)'), window.matchMedia('(prefers-reduced-transparency: reduce)'), window.matchMedia('(prefers-contrast: more)')]
  const handler = () => onChange(readFoundationPreferences())
  for (const query of queries) query.addEventListener?.('change', handler)
  return () => { for (const query of queries) query.removeEventListener?.('change', handler) }
}

let activeFoundationDispose = null

export function initializeFoundation() {
  activeFoundationDispose?.()
  if (typeof document === 'undefined') return () => {}
  const root = document.documentElement
  let preferences = readFoundationPreferences()
  const applyResolved = () => {
    const resolved = resolveFoundationTokens({
      appearance: root.dataset.theme,
      glassStrength: root.dataset.foundationGlassStrength,
      uiScaleProfile: {
        mode: root.dataset.uiScaleMode,
        unified: root.dataset.uiScale,
        typography: root.dataset.uiTypographyScale,
        width: root.dataset.uiWidthScale,
        height: root.dataset.uiHeightScale,
        verticalSpacing: root.dataset.uiVerticalSpacingScale,
        horizontalSpacing: root.dataset.uiHorizontalSpacingScale,
      },
      ...preferences,
    })
    applyFoundationTokens(root, resolved)
    applyFoundationPreferences(root, preferences)
  }
  applyResolved()
  const stopPreferences = watchFoundationPreferences((next) => { preferences = next; applyResolved() })
  const observer = typeof MutationObserver === 'function' ? new MutationObserver(applyResolved) : null
  observer?.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
  const dispose = () => { stopPreferences(); observer?.disconnect(); if (activeFoundationDispose === dispose) activeFoundationDispose = null }
  activeFoundationDispose = dispose
  return dispose
}

export function registerFoundationLifecycle({ dispose, windowObject, hot } = {}) {
  const cleanupFoundation = typeof dispose === 'function' ? dispose : initializeFoundation()
  const target = windowObject || (typeof window !== 'undefined' ? window : null)
  let active = true
  const handleUnload = () => {
    if (!active) return
    active = false
    cleanupFoundation()
    target?.removeEventListener?.('unload', handleUnload)
  }
  target?.addEventListener?.('unload', handleUnload, { once: true })
  hot?.dispose?.(() => {
    active = false
    cleanupFoundation()
    target?.removeEventListener?.('unload', handleUnload)
  })
  return () => {
    active = false
    cleanupFoundation()
    target?.removeEventListener?.('unload', handleUnload)
  }
}
