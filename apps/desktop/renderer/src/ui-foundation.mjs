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

const LIGHT_GLASS = Object.freeze({
  regular: Object.freeze({
    background: 'rgba(255, 255, 255, 0.147)',
    border: '1px solid rgba(0, 0, 0, 0.16)',
    shadow: 'rgba(255, 255, 255, 0.6) inset 0 1px 0, rgba(255, 255, 255, 0.55) inset 0 0 0 1px, rgba(0, 0, 0, 0.07) inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, 0.044), 0 18px 50px -20px rgba(0, 0, 0, 0.115)',
    blur: '13.2px',
    saturation: '1.25',
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), transparent 46%)',
    spill: 'linear-gradient(160deg, rgba(150, 158, 186, 0.144), transparent 52%)',
  }),
  clear: Object.freeze({
    background: 'rgba(255, 255, 255, 0.075)',
    border: '1px solid rgba(0, 0, 0, 0.198)',
    shadow: 'rgba(255, 255, 255, 0.6) inset 0 1px 0, rgba(255, 255, 255, 0.6) inset 0 0 0 1px, rgba(0, 0, 0, 0.08) inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, 0.026), 0 18px 50px -20px rgba(0, 0, 0, 0.046)',
    blur: '5.8px',
    saturation: '1.3',
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6), transparent 46%)',
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
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.42), transparent 46%)',
    spill: 'linear-gradient(160deg, rgba(110, 122, 160, 0.17), transparent 52%)',
  }),
  clear: Object.freeze({
    background: 'rgba(34, 36, 42, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.228)',
    shadow: 'rgba(255, 255, 255, 0.4) inset 0 1px 0, rgba(255, 255, 255, 0.46) inset 0 0 0 1px, rgba(0, 0, 0, 0.3) inset 0 -1px 0, 0 1px 2px rgba(0, 0, 0, 0.03), 0 18px 50px -20px rgba(0, 0, 0, 0.18)',
    blur: '6.7px',
    saturation: '1.15',
    specular: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent 46%)',
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
      'button-critical-hover': '#d9362e',
      'button-critical-pressed': '#c62828',
      'button-neutral-hover': 'rgba(0, 0, 0, 0.07)',
      'button-neutral-pressed': 'rgba(0, 0, 0, 0.12)',
    }),
    dark: Object.freeze({
      'button-primary-text': '#15161a',
      'button-primary-hover': '#b99cff',
      'button-primary-pressed': '#c7afff',
      'button-critical-hover': '#ff756b',
      'button-critical-pressed': '#ff8a80',
      'button-neutral-hover': 'rgba(255, 255, 255, 0.07)',
      'button-neutral-pressed': 'rgba(255, 255, 255, 0.12)',
    }),
  }),
  contrast: Object.freeze({
    light: Object.freeze({ separator: 'rgba(0, 0, 0, 0.3)', focus: '#4f22a8' }),
    dark: Object.freeze({ separator: 'rgba(255, 255, 255, 0.34)', focus: '#d0bfff' }),
  }),
  glass: Object.freeze({ light: LIGHT_GLASS, dark: DARK_GLASS }),
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

/** Apply one selected theme from FOUNDATION_TOKENS to semantic CSS vars. */
export function applyFoundationTokens(root, theme = 'light') {
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

  for (const [name, token] of Object.entries(FOUNDATION_TOKENS.typography)) {
    if (name === 'family') {
      target.style.setProperty('--ui-font-family', token)
      continue
    }
    target.style.setProperty(`--ui-type-${name}-size`, `${token.size}px`)
    target.style.setProperty(`--ui-type-${name}-weight`, String(token.weight))
  }

  for (const [material, values] of Object.entries(glass)) {
    writeTokenGroup(target, `--ui-glass-${material}-`, values)
  }

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
    ? new MutationObserver(() => applyFoundationTokens(root, root.dataset.theme))
    : null
  observer?.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

  return () => {
    stopPreferences()
    observer?.disconnect()
  }
}
