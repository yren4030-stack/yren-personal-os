/**
 * Renderer-owned theme identity: light / dark / system.
 *
 * The resolved theme is written onto document.documentElement.dataset.theme
 * ('light' | 'dark'); every semantic token in glass.css is scoped to
 * `:root[data-theme=...]`. SYSTEM follows prefers-color-scheme and reacts to
 * OS theme changes live while the app runs (watchSystemTheme).
 */

export function prefersDark() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

/**
 * Resolve a persisted theme preference ('light' | 'dark' | 'system') to a
 * concrete theme. Explicit preferences always win; system falls back to the
 * OS preference (injectable for deterministic tests).
 */
export function resolveTheme(preference, systemDark = prefersDark()) {
  if (preference === 'dark') return 'dark'
  if (preference === 'light') return 'light'
  return systemDark ? 'dark' : 'light'
}

/** Write the concrete theme identity onto the document root (Renderer only). */
export function applyTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
  }
}

/**
 * Subscribe to OS theme changes while the app runs. Returns an unsubscribe
 * function. No-op (safe) outside a browser with matchMedia.
 */
export function watchSystemTheme(onChange) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  if (typeof mq.addEventListener !== 'function') {
    return () => {}
  }
  const handler = () => onChange(mq.matches)
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
