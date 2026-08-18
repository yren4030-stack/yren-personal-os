/**
 * macOS 26 UI Foundation primitives.
 *
 * This module is renderer-only and intentionally contains no product data,
 * persistence, IPC, or runtime behavior. The values are implementation tokens
 * derived from the single authoritative UI specification.
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
  spacing: Object.freeze({
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
  }),
  radius: Object.freeze({
    'control-sm': 6,
    'control-md': 8,
    'surface-sm': 10,
    'surface-md': 12,
    'surface-lg': 16,
    floating: 20,
    capsule: 999,
  }),
  typography: Object.freeze({
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
  motion: Object.freeze({
    hover: 120,
    press: 100,
    selection: 160,
    popover: 200,
    panel: 240,
    page: 280,
  }),
})

export const FOUNDATION_STATES = Object.freeze([
  'default',
  'hover',
  'pressed',
  'focus-visible',
  'active',
  'disabled',
])

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

/** Apply explicit accessibility preferences to the renderer root. */
export function applyFoundationPreferences(preferences = readFoundationPreferences()) {
  if (typeof document === 'undefined') return preferences

  const resolved = resolveFoundationPreferences(preferences)
  const root = document.documentElement
  root.dataset.reducedMotion = String(resolved.reducedMotion)
  root.dataset.reducedTransparency = String(resolved.reducedTransparency)
  root.dataset.increasedContrast = String(resolved.increasedContrast)
  return resolved
}
