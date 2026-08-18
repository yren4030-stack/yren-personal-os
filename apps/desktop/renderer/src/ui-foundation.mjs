/**
 * macOS 26 UI Foundation primitives.
 *
 * This module is renderer-only and intentionally contains no product data,
 * persistence, IPC, or runtime behavior. FOUNDATION_TOKENS is the single
 * runtime value source; applyFoundationTokens writes the selected variant to
 * semantic CSS custom properties consumed by ui-foundation.css.
 */

export const SEMANTIC_COLOR_ROLES = Object.freeze([
  'background',
  'surface',
  'surface-elevated',
  'surface-glass',
  'text-primary',
  'text-secondary',
  'text-tertiary',
  'separator',
  'accent',
  'success',
  'warning',
  'critical',
  'selection',
  'focus',
])

const FOUNDATION_GLASS_PROFILES = Object.freeze({
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

const FOUNDATION_GLASS_SIZES = Object.freeze({
  small: Object.freeze({ fill: 0.85, blur: 0.75, border: 1.1, contact: 0.8, ambient: 0.7, specular: 1.1 }),
  medium: Object.freeze({ fill: 1, blur: 1, border: 1, contact: 1, ambient: 1, specular: 1 }),
  large: Object.freeze({ fill: 1.05, blur: 1.1, border: 1, contact: 1.1, ambient: 1.15, specular: 1 }),
})

const FOUNDATION_GLASS_ROLES = Object.freeze({
  navigation: Object.freeze({ size: 'large', spill: 1.2 }),
  panel: Object.freeze({ size: 'medium', spill: 1 }),
  control: Object.freeze({ size: 'small', spill: 1 }),
  floating: Object.freeze({ size: 'small', spill: 1.1, specular: 1.15 }),
})

const LIGHT_GLASS = Object.freeze({
  regular: Object.freeze({
    background: 'rgba(255, 255, 255, 0.147)',
    border: '1px solid rgba(0, 0, 0, 0.16)',
    shadow: 'rgba(255, 255, 255, 0.6) inset 0 1px 0, rgba(255, 255, 255, 0.55) inset 0 0 0 1px, rgba(0, 0, 0, 0.07) inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, 0.044), 0 18px 50px -20px rgba(0, 0, 0, 0.115)',
    blur: '13.2px',
    saturation: '1.25',
    brightness: '1.05',
    contrast: '1.03',
    highlight: 'rgba(255, 255, 255, 0.6)',
    rimLight: 'rgba(255, 255, 255, 0.55)',
    rimShade: 'rgba(0, 0, 0, 0.07)',
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), transparent 46%)',
    reflection: 'linear-gradient(180deg, transparent 42%, rgba(255, 255, 255, 0.6) 100%)',
    spill: 'linear-gradient(160deg, rgba(150, 158, 186, 0.144), transparent 52%)',
  }),
  clear: Object.freeze({
    background: 'rgba(255, 255, 255, 0.075)',
    border: '1px solid rgba(0, 0, 0, 0.198)',
    shadow: 'rgba(255, 255, 255, 0.6) inset 0 1px 0, rgba(255, 255, 255, 0.6) inset 0 0 0 1px, rgba(0, 0, 0, 0.08) inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, 0.026), 0 18px 50px -20px rgba(0, 0, 0, 0.046)',
    blur: '5.8px',
    saturation: '1.3',
    brightness: '1.06',
    contrast: '1.04',
    highlight: 'rgba(255, 255, 255, 0.6)',
    rimLight: 'rgba(255, 255, 255, 0.6)',
    rimShade: 'rgba(0, 0, 0, 0.08)',
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), transparent 46%)',
    reflection: 'linear-gradient(180deg, transparent 42%, rgba(255, 255, 255, 0.6) 100%)',
    spill: 'linear-gradient(160deg, rgba(150, 158, 186, 0.08), transparent 52%)',
  }),
})

const DARK_GLASS = Object.freeze({
  regular: Object.freeze({
    background: 'rgba(34, 36, 42, 0.173)',
    border: '1px solid rgba(255, 255, 255, 0.184)',
    shadow: 'rgba(255, 255, 255, 0.42) inset 0 1px 0, rgba(255, 255, 255, 0.46) inset 0 0 0 1px, rgba(0, 0, 0, 0.32) inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, 0.05), 0 18px 50px -20px rgba(0, 0, 0, 0.32)',
    blur: '15.2px',
    saturation: '1.1',
    brightness: '1.04',
    contrast: '1.03',
    highlight: 'rgba(255, 255, 255, 0.42)',
    rimLight: 'rgba(255, 255, 255, 0.46)',
    rimShade: 'rgba(0, 0, 0, 0.32)',
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.42), transparent 46%)',
    reflection: 'linear-gradient(180deg, transparent 42%, rgba(255, 255, 255, 0.42) 100%)',
    spill: 'linear-gradient(160deg, rgba(110, 122, 160, 0.17), transparent 52%)',
  }),
  clear: Object.freeze({
    background: 'rgba(34, 36, 42, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.228)',
    shadow: 'rgba(255, 255, 255, 0.4) inset 0 1px 0, rgba(255, 255, 255, 0.46) inset 0 0 0 1px, rgba(0, 0, 0, 0.3) inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, 0.03), 0 18px 50px -20px rgba(0, 0, 0, 0.18)',
    blur: '6.7px',
    saturation: '1.15',
    brightness: '1.05',
    contrast: '1.04',
    highlight: 'rgba(255, 255, 255, 0.4)',
    rimLight: 'rgba(255, 255, 255, 0.46)',
    rimShade: 'rgba(0, 0, 0, 0.3)',
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent 46%)',
    reflection: 'linear-gradient(180deg, transparent 42%, rgba(255, 255, 255, 0.4) 100%)',
    spill: 'linear-gradient(160deg, rgba(110, 122, 160, 0.08), transparent 52%)',
  }),
})

export const FOUNDATION_TOKENS = Object.freeze({
  colors: Object.freeze({
    light: Object.freeze({
      background: '#f1eff6',
      surface: '#f9f8fb',
      'surface-elevated': '#ffffff',
      'surface-glass': 'rgba(246, 246, 246, 0.62)',
      'text-primary': '#1b1b1f',
      'text-secondary': '#6b6b72',
      'text-tertiary': '#777780',
      separator: 'rgba(0, 0, 0, 0.12)',
      accent: '#7849d1',
      success: '#34c759',
      warning: '#ff9f0a',
      critical: '#ff453a',
      selection: 'rgba(120, 73, 209, 0.16)',
      focus: 'rgba(120, 73, 209, 0.46)',
    }),
    dark: Object.freeze({
      background: '#15161a',
      surface: '#1b1d23',
      'surface-elevated': '#26282f',
      'surface-glass': 'rgba(38, 38, 40, 0.58)',
      'text-primary': '#f2f2f6',
      'text-secondary': '#b9bbc3',
      'text-tertiary': '#9a9ca7',
      separator: 'rgba(255, 255, 255, 0.14)',
      accent: '#a984ff',
      success: '#32d74b',
      warning: '#ffd60a',
      critical: '#ff453a',
      selection: 'rgba(169, 132, 255, 0.28)',
      focus: 'rgba(169, 132, 255, 0.62)',
    }),
  }),
  interaction: Object.freeze({
    light: Object.freeze({
      'button-primary-text': '#ffffff',
      'button-primary-hover': '#6a3fbd',
      'button-primary-pressed': '#5b35a3',
      'button-primary-selected': '#5b35a3',
      'button-critical-hover': '#d9362e',
      'button-critical-pressed': '#c62828',
      'button-critical-selected': '#c62828',
      'button-neutral-hover': 'rgba(0, 0, 0, 0.07)',
      'button-neutral-pressed': 'rgba(0, 0, 0, 0.12)',
    }),
    dark: Object.freeze({
      'button-primary-text': '#15161a',
      'button-primary-hover': '#b99cff',
      'button-primary-pressed': '#c7afff',
      'button-primary-selected': '#c7afff',
      'button-critical-hover': '#ff756b',
      'button-critical-pressed': '#ff8a80',
      'button-critical-selected': '#ff8a80',
      'button-neutral-hover': 'rgba(255, 255, 255, 0.07)',
      'button-neutral-pressed': 'rgba(255, 255, 255, 0.12)',
    }),
  }),
  contrast: Object.freeze({
    light: Object.freeze({
      separator: 'rgba(0, 0, 0, 0.3)',
      focus: '#4f22a8',
      'text-primary': '#111116',
      'text-secondary': '#4f4f58',
      selection: 'rgba(120, 73, 209, 0.28)',
    }),
    dark: Object.freeze({
      separator: 'rgba(255, 255, 255, 0.34)',
      focus: '#d0bfff',
      'text-primary': '#ffffff',
      'text-secondary': '#e5e5eb',
      selection: 'rgba(169, 132, 255, 0.42)',
    }),
  }),
  glass: Object.freeze({ light: LIGHT_GLASS, dark: DARK_GLASS }),
  glassModel: Object.freeze({
    profiles: FOUNDATION_GLASS_PROFILES,
    sizes: FOUNDATION_GLASS_SIZES,
    roles: FOUNDATION_GLASS_ROLES,
    fillRgb: Object.freeze({ light: '255, 255, 255', dark: '34, 36, 42' }),
    borderRgb: Object.freeze({ light: '0, 0, 0', dark: '255, 255, 255' }),
    highlightRgb: Object.freeze({ light: '255, 255, 255', dark: '255, 255, 255' }),
    shadeRgb: Object.freeze({ light: '0, 0, 0', dark: '0, 0, 0' }),
    spillRgb: Object.freeze({ light: '150, 158, 186', dark: '110, 122, 160' }),
  }),
  layout: Object.freeze({
    'shell-padding': 'clamp(8px, 1vw, 12px)',
    'shell-gap': 'clamp(10px, 1vw, 12px)',
    'page-padding-x': 'clamp(14px, 2.2vw, 24px)',
    'page-padding-bottom': 'clamp(16px, 2vw, 28px)',
    'section-gap': 'clamp(16px, 1.5vw, 24px)',
    'grid-gap': 'clamp(12px, 1.4vw, 16px)',
    'sidebar-width': '232px',
    'control-height': '40px',
    'page-title-size': 'clamp(24px, 2.6vw, 28px)',
  }),
  spacing: Object.freeze({ 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 }),
  radius: Object.freeze({ 'control-sm': 6, 'control-md': 8, 'surface-sm': 10, 'surface-md': 12, 'surface-lg': 16, floating: 20, capsule: 999 }),
  typography: Object.freeze({
    family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", "Microsoft YaHei", sans-serif',
    caption: Object.freeze({ size: 11, weight: 400 }),
    label: Object.freeze({ size: 12, weight: 500 }),
    body: Object.freeze({ size: 13, weight: 400 }),
    bodyStrong: Object.freeze({ size: 13, weight: 600 }),
    section: Object.freeze({ size: 14, weight: 600 }),
    title3: Object.freeze({ size: 17, weight: 600 }),
    title2: Object.freeze({ size: 20, weight: 600 }),
    title1: Object.freeze({ size: 24, weight: 600 }),
    hero: Object.freeze({ size: 32, weight: 700 }),
  }),
  motion: Object.freeze({ hover: 120, press: 100, selection: 160, popover: 200, panel: 240, page: 280 }),
  geometry: Object.freeze({ 'control-height': 32, 'icon-only-size': 32, 'border-width': 1, 'focus-width': 2, 'focus-offset': 2, 'disabled-opacity': 0.45 }),
})

export const FOUNDATION_STATES = Object.freeze([
  'default',
  'hover',
  'pressed',
  'focus-visible',
  'active',
  'disabled',
])

function resolveTheme(theme) {
  return theme === 'dark' ? 'dark' : 'light'
}

function resolveRoot(root) {
  if (root && root.style && root.dataset) return root
  if (typeof document !== 'undefined') return document.documentElement
  return null
}

function writeTokenGroup(root, prefix, values, transform = (value) => value) {
  for (const [name, value] of Object.entries(values)) {
    root.style.setProperty(`${prefix}${name}`, transform(value))
  }
}

function applyLegacyAliases(root) {
  const aliases = {
    '--accent': 'var(--ui-color-accent)',
    '--accent-hover': 'var(--ui-interaction-button-primary-hover)',
    '--accent-soft': 'var(--ui-color-selection)',
    '--accent-tint': 'color-mix(in srgb, var(--ui-color-accent) 8%, transparent)',
    '--accent-focus': 'var(--ui-color-focus)',
    '--bg-base': 'var(--ui-color-background)',
    '--bg-depth-1': 'var(--ui-color-surface)',
    '--bg-depth-2': 'var(--ui-color-background)',
    '--text-primary': 'var(--ui-color-text-primary)',
    '--text-secondary': 'var(--ui-color-text-secondary)',
    '--text-tertiary': 'var(--ui-color-text-tertiary)',
    '--control-bg': 'color-mix(in srgb, var(--ui-color-text-primary) 6%, transparent)',
    '--control-bg-active': 'var(--ui-color-surface-elevated)',
    '--control-solid': 'var(--ui-color-surface-elevated)',
    '--control-border': 'var(--ui-geometry-border-width) solid var(--ui-color-separator)',
    '--btn-secondary-bg': 'var(--ui-color-surface-elevated)',
    '--btn-secondary-bg-hover': 'var(--ui-interaction-button-neutral-hover)',
    '--hover-bg': 'var(--ui-interaction-button-neutral-hover)',
    '--interact-hover': 'color-mix(in srgb, var(--ui-glass-regular-highlight) 35%, transparent)',
    '--interact-active': 'color-mix(in srgb, var(--ui-glass-regular-highlight) 55%, transparent)',
    '--chip-bg': 'var(--ui-color-selection)',
    '--track-bg': 'var(--ui-color-separator)',
    '--empty-bg': 'var(--ui-color-surface)',
    '--divider': 'var(--ui-color-separator)',
    '--scrollbar-thumb': 'var(--ui-color-separator)',
    '--glass-edge-top': 'var(--ui-glass-regular-highlight)',
    '--status-success': 'var(--ui-color-success)',
    '--status-warning': 'var(--ui-color-warning)',
    '--status-danger': 'var(--ui-color-critical)',
    '--error-bg': 'color-mix(in srgb, var(--ui-color-critical) 7%, transparent)',
    '--error-border': 'color-mix(in srgb, var(--ui-color-critical) 18%, transparent)',
    '--error-text': 'var(--ui-color-critical)',
    '--radius-window': 'var(--ui-radius-floating)',
    '--radius-glass-large': 'var(--ui-radius-floating)',
    '--radius-glass-medium': 'var(--ui-radius-surface-lg)',
    '--radius-control': 'var(--ui-radius-surface-sm)',
    '--radius-capsule': 'var(--ui-radius-capsule)',
    '--shell-padding': 'var(--ui-layout-shell-padding)',
    '--shell-gap': 'var(--ui-layout-shell-gap)',
    '--page-padding-x': 'var(--ui-layout-page-padding-x)',
    '--page-padding-bottom': 'var(--ui-layout-page-padding-bottom)',
    '--section-gap': 'var(--ui-layout-section-gap)',
    '--grid-gap': 'var(--ui-layout-grid-gap)',
    '--sidebar-width': 'var(--ui-layout-sidebar-width)',
    '--control-height': 'var(--ui-layout-control-height)',
    '--page-title-size': 'var(--ui-layout-page-title-size)',
    '--glass-bg': 'var(--ui-glass-regular-background)',
    '--glass-blur': 'var(--ui-glass-regular-blur)',
    '--glass-border': 'var(--ui-glass-regular-border)',
    '--glass-shadow': 'var(--ui-glass-regular-shadow)',
    '--glass-saturation': 'var(--ui-glass-regular-saturation)',
    '--glass-brightness': 'var(--ui-glass-regular-brightness)',
    '--glass-contrast': 'var(--ui-glass-regular-contrast)',
    '--glass-highlight': 'var(--ui-glass-regular-highlight)',
    '--glass-rim-light': 'var(--ui-glass-regular-rim-light)',
    '--glass-rim-shade': 'var(--ui-glass-regular-rim-shade)',
    '--glass-specular': 'var(--ui-glass-regular-specular)',
    '--glass-reflection': 'var(--ui-glass-regular-reflection)',
    '--glass-spill': 'var(--ui-glass-regular-spill)',
    '--glass-clear-bg': 'var(--ui-glass-clear-background)',
    '--glass-clear-blur': 'var(--ui-glass-clear-blur)',
    '--glass-clear-border': 'var(--ui-glass-clear-border)',
    '--glass-clear-shadow': 'var(--ui-glass-clear-shadow)',
    '--glass-clear-saturation': 'var(--ui-glass-clear-saturation)',
    '--glass-clear-brightness': 'var(--ui-glass-clear-brightness)',
    '--glass-clear-contrast': 'var(--ui-glass-clear-contrast)',
    '--glass-clear-highlight': 'var(--ui-glass-clear-highlight)',
    '--glass-clear-rim-light': 'var(--ui-glass-clear-rim-light)',
    '--glass-clear-specular': 'var(--ui-glass-clear-specular)',
    '--glass-content-bg': 'var(--ui-color-surface)',
    '--glass-content-blur': '0px',
    '--glass-content-border': 'var(--ui-content-border)',
    '--glass-content-shadow': 'var(--ui-content-shadow)',
    '--glass-content-saturation': '1',
    '--glass-content-brightness': '1',
    '--glass-content-contrast': '1',
    '--glass-bg-content': 'var(--ui-color-surface)',
  }
  for (const [name, value] of Object.entries(aliases)) root.style.setProperty(name, value)
}

/** Apply one selected theme from FOUNDATION_TOKENS to semantic CSS vars. */
export function applyFoundationTokens(root, theme = 'light', options = {}) {
  const target = resolveRoot(root)
  const resolvedTheme = resolveTheme(theme)
  if (!target) return resolvedTheme

  const colors = FOUNDATION_TOKENS.colors[resolvedTheme]
  const interaction = FOUNDATION_TOKENS.interaction[resolvedTheme]
  const contrast = FOUNDATION_TOKENS.contrast[resolvedTheme]
  const glass = FOUNDATION_TOKENS.glass[resolvedTheme]

  writeTokenGroup(target, '--ui-color-', colors)
  writeTokenGroup(target, '--ui-interaction-', interaction)
  writeTokenGroup(target, '--ui-contrast-', contrast)
  writeTokenGroup(target, '--ui-space-', FOUNDATION_TOKENS.spacing, (value) => `${value}px`)
  writeTokenGroup(target, '--ui-radius-', FOUNDATION_TOKENS.radius, (value) => `${value}px`)
  writeTokenGroup(target, '--ui-motion-', FOUNDATION_TOKENS.motion, (value) => `${value}ms`)
  writeTokenGroup(target, '--ui-geometry-', FOUNDATION_TOKENS.geometry, (value) => typeof value === 'number' && value < 1 ? String(value) : `${value}px`)
  writeTokenGroup(target, '--ui-layout-', FOUNDATION_TOKENS.layout)
  target.style.setProperty('--ui-content-border', 'var(--ui-geometry-border-width) solid var(--ui-color-separator)')
  target.style.setProperty('--ui-content-shadow', 'none')

  for (const [name, token] of Object.entries(FOUNDATION_TOKENS.typography)) {
    if (name === 'family') {
      target.style.setProperty('--ui-font-family', token)
      continue
    }
    target.style.setProperty(`--ui-type-${name}-size`, `${token.size}px`)
    target.style.setProperty(`--ui-type-${name}-weight`, String(token.weight))
  }

  if (!options.preserveGlass) {
    for (const [material, values] of Object.entries(glass)) {
      writeTokenGroup(target, `--ui-glass-${material}-`, values)
    }
  }

  applyLegacyAliases(target)
  target.dataset.foundationTheme = resolvedTheme
  return resolvedTheme
}

export function resolveFoundationPreferences(preferences = {}) {
  return Object.freeze({
    reducedMotion: preferences.reducedMotion === true,
    reducedTransparency: preferences.reducedTransparency === true,
    increasedContrast: preferences.increasedContrast === true,
  })
}

export function readFoundationPreferences() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return resolveFoundationPreferences()
  }

  return resolveFoundationPreferences({
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches,
    increasedContrast: window.matchMedia('(prefers-contrast: more)').matches,
  })
}

/** Apply explicit accessibility preferences to a renderer root. */
export function applyFoundationPreferences(rootOrPreferences, maybePreferences) {
  const hasExplicitRoot = Boolean(rootOrPreferences && rootOrPreferences.style && rootOrPreferences.dataset)
  const target = hasExplicitRoot ? rootOrPreferences : resolveRoot()
  const preferences = hasExplicitRoot ? maybePreferences : rootOrPreferences
  const resolved = resolveFoundationPreferences(preferences || readFoundationPreferences())
  if (!target) return resolved

  target.dataset.reducedMotion = String(resolved.reducedMotion)
  target.dataset.reducedTransparency = String(resolved.reducedTransparency)
  target.dataset.increasedContrast = String(resolved.increasedContrast)
  return resolved
}

/** Watch supported Web/Electron accessibility media-query changes. */
export function watchFoundationPreferences(onChange) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}

  const queries = [
    window.matchMedia('(prefers-reduced-motion: reduce)'),
    window.matchMedia('(prefers-reduced-transparency: reduce)'),
    window.matchMedia('(prefers-contrast: more)'),
  ]
  const handler = () => onChange(readFoundationPreferences())
  for (const query of queries) query.addEventListener?.('change', handler)
  return () => {
    for (const query of queries) query.removeEventListener?.('change', handler)
  }
}

/** Initialize and keep the Foundation token and preference layers current. */
export function initializeFoundation() {
  if (typeof document === 'undefined') return () => {}

  const root = document.documentElement
  applyFoundationTokens(root, root.dataset.theme)
  applyFoundationPreferences(root)
  const stopPreferences = watchFoundationPreferences((preferences) => applyFoundationPreferences(root, preferences))
  const observer = typeof MutationObserver === 'function'
    ? new MutationObserver(() => applyFoundationTokens(root, root.dataset.theme, { preserveGlass: true }))
    : null
  observer?.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

  return () => {
    stopPreferences()
    observer?.disconnect()
  }
}
