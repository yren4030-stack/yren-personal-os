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
    profiles: Object.freeze({
      regular: Object.freeze({
        clear: Object.freeze({ fill: 0.14, blur: 12, brightness: 1.05, contrast: 1.03, saturation: 1.25, border: 0.16, rimLight: 0.55, rimShade: 0.07, specular: 0.5, contact: 0.04, ambient: 0.1, spill: 0.12 }),
        tinted: Object.freeze({ fill: 0.32, blur: 18, brightness: 1.02, contrast: 1.05, saturation: 1.4, border: 0.18, rimLight: 0.4, rimShade: 0.09, specular: 0.35, contact: 0.05, ambient: 0.14, spill: 0.16 }),
      }),
      clear: Object.freeze({
        clear: Object.freeze({ fill: 0.08, blur: 7, brightness: 1.06, contrast: 1.04, saturation: 1.3, border: 0.18, rimLight: 0.6, rimShade: 0.08, specular: 0.55, contact: 0.03, ambient: 0.06, spill: 0.14 }),
        tinted: Object.freeze({ fill: 0.2, blur: 12, brightness: 1.03, contrast: 1.05, saturation: 1.45, border: 0.2, rimLight: 0.45, rimShade: 0.1, specular: 0.4, contact: 0.04, ambient: 0.09, spill: 0.18 }),
      }),
    }),
    sizes: Object.freeze({
      small: Object.freeze({ fill: 0.85, blur: 0.75, border: 1.1, contact: 0.8, ambient: 0.7, specular: 1.1 }),
      medium: Object.freeze({ fill: 1, blur: 1, border: 1, contact: 1, ambient: 1, specular: 1 }),
      large: Object.freeze({ fill: 1.05, blur: 1.1, border: 1.1, contact: 1.1, ambient: 1.15, specular: 1 }),
    }),
    roles: Object.freeze({ navigation: Object.freeze({ size: 'large', spill: 1.2 }), panel: Object.freeze({ size: 'medium', spill: 1 }), control: Object.freeze({ size: 'small', spill: 1 }), floating: Object.freeze({ size: 'small', spill: 1.1, specular: 1.15 }) }),
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

function resolveMaterial(model, palette, colors, theme, styleName, variant, role, size, reducedTransparency, contrastGlass) {
  if (variant === 'content') return Object.freeze({ variant, fillAlpha: 1, blurPx: 0, brightness: 1, contrast: 1, saturation: 1, borderAlpha: 0, fillRgb: palette.fillRgb, borderRgb: palette.borderRgb, background: colors.surface, border: `1px solid ${colors.separator}`, shadow: 'none', blur: '0px', highlight: 'none', rimLight: 'none', rimShade: 'none', specular: 'none', reflection: 'none', spill: 'none' })
  const style = model.profiles[variant][styleName]
  const roleSpec = model.roles[role] || model.roles.panel
  const sizeSpec = model.sizes[size || roleSpec.size] || model.sizes.medium
  const material = {
    variant,
    fillAlpha: style.fill * sizeSpec.fill,
    blurPx: style.blur * sizeSpec.blur,
    brightness: style.brightness * (theme === 'dark' ? 0.99 : 1),
    contrast: style.contrast,
    saturation: style.saturation * (theme === 'dark' ? 0.92 : 1),
    borderAlpha: style.border * sizeSpec.border,
    rimLightAlpha: Math.min(0.7, style.rimLight * (theme === 'dark' ? 1.15 : 1)),
    rimShadeAlpha: style.rimShade * (theme === 'dark' ? 1.3 : 1),
    specularAlpha: Math.min(0.65, style.specular * sizeSpec.specular * (roleSpec.specular || 1) * (theme === 'dark' ? 0.85 : 1)),
    contactAlpha: style.contact * sizeSpec.contact,
    ambientAlpha: style.ambient * sizeSpec.ambient,
    spillAlpha: style.spill * (roleSpec.spill || 1),
  }
  if (reducedTransparency) return Object.freeze({ ...material, fillRgb: palette.fillRgb, borderRgb: palette.borderRgb, fillAlpha: 1, blurPx: 0, background: colors['surface-elevated'], border: `1px solid ${colors.separator}`, shadow: 'none', blur: '0px', highlight: 'none', rimLight: 'none', rimShade: 'none', specular: 'none', reflection: 'none', spill: 'none' })
  const highlight = rgba(palette.highlightRgb, Math.min(0.6, material.specularAlpha + 0.15))
  const rimLight = rgba(palette.highlightRgb, material.rimLightAlpha)
  const rimShade = rgba(palette.shadeRgb, material.rimShadeAlpha)
  const shadow = `${highlight} inset 0 1px 0, ${rimLight} inset 0 0 0 1px, ${rimShade} inset 0 -1px 0, 0 1px 2px ${rgba(palette.shadeRgb, material.contactAlpha)}, 0 18px 50px -20px ${rgba(palette.shadeRgb, material.ambientAlpha)}`
  return Object.freeze({ ...material, fillRgb: palette.fillRgb, borderRgb: palette.borderRgb, background: contrastGlass?.background || rgba(palette.fillRgb, material.fillAlpha), border: contrastGlass?.border || `1px solid ${rgba(palette.borderRgb, material.borderAlpha)}`, shadow: contrastGlass?.shadow || shadow, blur: `${material.blurPx.toFixed(1)}px`, highlight, rimLight, rimShade, specular: `linear-gradient(135deg, ${highlight}, transparent 46%)`, reflection: `linear-gradient(180deg, transparent 42%, ${highlight} 100%)`, spill: `linear-gradient(160deg, ${rgba(palette.spillRgb, material.spillAlpha)}, transparent 52%)` })
}

/** Pure, deterministic resolver for the complete renderer foundation. */
export function resolveFoundationTokens(options = {}) {
  const appearance = typeof options.appearance === 'object' && options.appearance !== null ? options.appearance : {}
  const theme = resolveTheme(typeof options.appearance === 'string' ? options.appearance : options.theme || appearance.theme)
  const userStyle = (options.liquidGlassStyle || appearance.liquidGlassStyle) === 'tinted' ? 'tinted' : 'clear'
  const increasedContrast = options.increasedContrast === true
  const reducedTransparency = options.reducedTransparency === true
  const base = FOUNDATION_TOKENS.colors[theme]
  const contrast = FOUNDATION_TOKENS.contrast[theme]
  const colors = Object.freeze(increasedContrast ? { ...base, separator: contrast.separator, focus: contrast.focus, selection: contrast.selection, 'text-primary': contrast['text-primary'], 'text-secondary': contrast['text-secondary'] } : { ...base })
  const model = FOUNDATION_TOKENS.glass
  const palette = model.palette[theme]
  const contrastGlass = increasedContrast ? contrast.glass : null
  const glass = Object.freeze({
    regular: resolveMaterial(model, palette, colors, theme, userStyle, 'regular', options.glassRole || 'navigation', options.glassSize, reducedTransparency, contrastGlass?.regular),
    clear: resolveMaterial(model, palette, colors, theme, userStyle, 'clear', options.glassRole || 'control', options.glassSize, reducedTransparency, contrastGlass?.clear),
    content: resolveMaterial(model, palette, colors, theme, userStyle, 'content', 'panel', options.glassSize, reducedTransparency, null),
  })
  const interaction = Object.freeze(increasedContrast ? { ...FOUNDATION_TOKENS.interaction[theme], ...Object.fromEntries(Object.entries(contrast).filter(([name]) => name.startsWith('button-') || name.startsWith('selection-'))) } : FOUNDATION_TOKENS.interaction[theme])
  return Object.freeze({ theme, userStyle, increasedContrast, reducedTransparency, colors, interaction, contrast, spacing: FOUNDATION_TOKENS.spacing, radius: FOUNDATION_TOKENS.radius, typography: FOUNDATION_TOKENS.typography, motion: FOUNDATION_TOKENS.motion, geometry: FOUNDATION_TOKENS.geometry, layout: FOUNDATION_TOKENS.layout, glass })
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
    '--glass-bg': glassAlias('regular', 'background'), '--glass-blur': glassAlias('regular', 'blur'), '--glass-border': glassAlias('regular', 'border'), '--glass-shadow': glassAlias('regular', 'shadow'), '--glass-saturation': glassAlias('regular', 'saturation'), '--glass-brightness': glassAlias('regular', 'brightness'), '--glass-contrast': glassAlias('regular', 'contrast'), '--glass-highlight': glassAlias('regular', 'highlight'), '--glass-rim-light': glassAlias('regular', 'rim-light'), '--glass-rim-shade': glassAlias('regular', 'rim-shade'), '--glass-specular': glassAlias('regular', 'specular'), '--glass-reflection': glassAlias('regular', 'reflection'), '--glass-spill': glassAlias('regular', 'spill'),
    '--glass-clear-bg': glassAlias('clear', 'background'), '--glass-clear-blur': glassAlias('clear', 'blur'), '--glass-clear-border': glassAlias('clear', 'border'), '--glass-clear-shadow': glassAlias('clear', 'shadow'), '--glass-clear-saturation': glassAlias('clear', 'saturation'), '--glass-clear-brightness': glassAlias('clear', 'brightness'), '--glass-clear-contrast': glassAlias('clear', 'contrast'), '--glass-clear-highlight': glassAlias('clear', 'highlight'), '--glass-clear-rim-light': glassAlias('clear', 'rim-light'), '--glass-clear-specular': glassAlias('clear', 'specular'), '--glass-content-bg': glassAlias('content', 'background'), '--glass-content-blur': glassAlias('content', 'blur'), '--glass-content-border': glassAlias('content', 'border'), '--glass-content-shadow': glassAlias('content', 'shadow'), '--glass-content-saturation': glassAlias('content', 'saturation'), '--glass-content-brightness': glassAlias('content', 'brightness'), '--glass-content-contrast': glassAlias('content', 'contrast'), '--glass-bg-content': glassAlias('content', 'background'),
  }
}

function writeGroup(root, prefix, values, transform = (value) => value) { for (const [name, value] of Object.entries(values)) root.style.setProperty(`${prefix}${name}`, transform(value)) }

function writeGlass(root, resolved) {
  for (const [variant, material] of Object.entries(resolved.glass)) {
    for (const key of ['background', 'border', 'shadow', 'blur', 'saturation', 'brightness', 'contrast', 'highlight', 'rimLight', 'rimShade', 'specular', 'reflection', 'spill']) {
      const cssName = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      root.style.setProperty(`--ui-glass-${variant}-${cssName}`, material[key])
    }
    root.style.setProperty(`--ui-glass-${variant}-fill-alpha`, String(material.fillAlpha))
  }
}

export function applyFoundationTokens(root, resolvedOrTheme = 'light', options = {}) {
  const target = resolveRoot(root)
  const resolved = resolvedOrTheme && resolvedOrTheme.glass ? resolvedOrTheme : resolveFoundationTokens({ appearance: resolvedOrTheme, ...options })
  if (!target) return resolved
  writeGroup(target, '--ui-color-', resolved.colors)
  writeGroup(target, '--ui-interaction-', resolved.interaction)
  writeGroup(target, '--ui-contrast-', resolved.contrast)
  writeGroup(target, '--ui-space-', resolved.spacing, (value) => `${value}px`)
  writeGroup(target, '--ui-radius-', resolved.radius, (value) => `${value}px`)
  writeGroup(target, '--ui-motion-', resolved.motion, (value) => `${value}ms`)
  writeGroup(target, '--ui-geometry-', resolved.geometry, (value) => typeof value === 'number' && value < 1 ? String(value) : `${value}px`)
  writeGroup(target, '--ui-layout-', resolved.layout)
  target.style.setProperty('--ui-content-border', 'var(--ui-geometry-border-width) solid var(--ui-color-separator)')
  target.style.setProperty('--ui-content-shadow', 'none')
  for (const [name, token] of Object.entries(resolved.typography)) {
    if (name === 'family') target.style.setProperty('--ui-font-family', token)
    else { target.style.setProperty(`--ui-type-${name}-size`, `${token.size}px`); target.style.setProperty(`--ui-type-${name}-weight`, String(token.weight)) }
  }
  writeGlass(target, resolved)
  for (const [name, value] of Object.entries(buildLegacyAliases(resolved))) target.style.setProperty(name, value)
  target.dataset.foundationTheme = resolved.theme
  target.dataset.foundationAppearance = resolved.userStyle
  target.dataset.foundationIncreasedContrast = String(resolved.increasedContrast)
  target.dataset.foundationReducedTransparency = String(resolved.reducedTransparency)
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
  const applyResolved = () => { const resolved = resolveFoundationTokens({ appearance: root.dataset.theme, ...preferences }); applyFoundationTokens(root, resolved); applyFoundationPreferences(root, preferences) }
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
