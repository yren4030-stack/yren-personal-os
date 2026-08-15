/**
 * Adaptive Liquid Glass theme + responsive-layout proofs (deterministic).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { computeGlassTokens } from '../apps/desktop/renderer/src/glass-tokens.mjs'
import { resolveTheme, prefersDark } from '../apps/desktop/renderer/src/theme.mjs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/glass.css', import.meta.url), 'utf8')
const mainSrc = readFileSync(new URL('../apps/desktop/electron/main.mjs', import.meta.url), 'utf8')

const LIGHT = { theme: 'light', frostIntensity: 60, transparencyLevel: 40 }
const DARK = { theme: 'dark', frostIntensity: 60, transparencyLevel: 40 }

test('light theme tokens exist', () => {
  const light = computeGlassTokens({ frostIntensity: 60, transparencyLevel: 40 })
  const explicit = computeGlassTokens(LIGHT)
  assert.deepEqual(explicit, light)
  assert.match(explicit.glassBg, /^rgba\(255, 255, 255, /)
  assert.ok(css.includes(":root[data-theme='dark']"), 'CSS carries a dark theme block')
  assert.ok(css.includes('--text-primary'), 'semantic text tokens exist')
  assert.ok(css.includes('--bg-depth-1'), 'semantic depth tokens exist')
})

test('dark theme tokens exist and use graphite smoked glass', () => {
  const dark = computeGlassTokens(DARK)
  assert.match(dark.glassBg, /^rgba\(34, 36, 42, /, 'dark fill is graphite')
  assert.match(dark.glassBorder, /^1px solid rgba\(255, 255, 255, /, 'dark glass has a brighter perimeter border')
  assert.ok(dark.glassHighlight.startsWith('rgba(255, 255, 255, '), 'dark glass keeps a white edge highlight')
  assert.ok(css.includes(':root[data-theme=\'dark\']') || css.includes(':root[data-theme="dark"]'))
  assert.ok(css.includes('--text-primary: #f2f2f6'), 'dark text tokens exist')
})

test('light and dark tokens differ at identical slider values', () => {
  const light = computeGlassTokens(LIGHT)
  const dark = computeGlassTokens(DARK)
  assert.notEqual(light.glassBg, dark.glassBg)
  assert.notEqual(light.glassBorder, dark.glassBorder)
  assert.notEqual(light.glassHighlight, dark.glassHighlight)
  assert.notEqual(light.glassShadow, dark.glassShadow)
  // The transparency curve itself is theme-independent.
  assert.equal(light.alpha, dark.alpha)
})

test('theme preference resolution: light/dark force, system follows abstraction', () => {
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme('light', false), 'light')
  assert.equal(resolveTheme('dark', false), 'dark')
  assert.equal(resolveTheme('dark', true), 'dark')
  assert.equal(resolveTheme('system', false), 'light')
  assert.equal(resolveTheme('system', true), 'dark')
  assert.equal(prefersDark(), false, 'prefersDark is a safe no-op outside a browser')
  assert.ok(['light', 'dark'].includes(resolveTheme('system')), 'system always resolves to a concrete theme')
})

test('frost slider affects global blur in BOTH themes', () => {
  for (const theme of ['light', 'dark']) {
    const low = computeGlassTokens({ theme, frostIntensity: 0, transparencyLevel: 50 })
    const high = computeGlassTokens({ theme, frostIntensity: 100, transparencyLevel: 50 })
    assert.equal(low.blurPx, 0, `${theme} blur at frost 0`)
    assert.equal(high.blurPx, 32, `${theme} blur at frost 100`)
    assert.notEqual(low.glassBlur, high.glassBlur, `${theme} blur must differ`)
  }
})

test('transparency slider affects global glass fill in BOTH themes', () => {
  for (const theme of ['light', 'dark']) {
    const dense = computeGlassTokens({ theme, frostIntensity: 60, transparencyLevel: 0 })
    const open = computeGlassTokens({ theme, frostIntensity: 60, transparencyLevel: 100 })
    assert.equal(dense.alpha, 0.78, `${theme} alpha at transparency 0`)
    assert.equal(open.alpha, 0.07, `${theme} alpha at transparency 100`)
    assert.notEqual(dense.glassBg, open.glassBg, `${theme} fill must differ`)
  }
})

test('no material selector returned (Liquid Glass model preserved)', () => {
  const src = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')
  assert.equal(src.includes('settings.glassMaterial'), false)
  assert.equal(src.includes('settings.frosted'), false)
  assert.equal(src.includes('settings.transparent'), false)
  assert.equal(src.includes('className="segmented"'), false)
})

test('responsive CSS: sidebar has full (232px) and compact (76px) states with a breakpoint', () => {
  const full = /\.sidebar\s*\{\s*width:\s*232px/.test(css)
  assert.ok(full, 'full sidebar width 232px must exist')
  const media = css.match(/@media \(max-width: 1179px\) \{([\s\S]*?)\n\}/)
  assert.ok(media, 'compact sidebar media query must exist')
  assert.ok(media[1].includes('width: 76px'), 'compact sidebar width 76px')
  assert.ok(media[1].includes('.nav-label'), 'labels collapse in compact mode')
})

test('responsive CSS: project detail stacks vertically at narrow width', () => {
  const media = css.match(/@media \(max-width: 1080px\) \{([\s\S]*?)\n\}/)
  assert.ok(media, 'detail breakpoint media query must exist')
  assert.ok(media[1].includes('.detail-grid'), 'detail media block targets .detail-grid')
  assert.ok(media[1].includes('grid-template-columns: 1fr'), 'detail columns stack to one')
})

test('responsive CSS: stat grid and settings adapt to narrower windows', () => {
  const statMedia = css.match(/@media \(max-width: 1179px\) \{([\s\S]*?)\n\}/)
  assert.ok(statMedia[1].includes('.stat-grid'), 'stat grid adapts in the medium breakpoint')
  assert.ok(statMedia[1].includes('repeat(2, 1fr)'), 'stat grid becomes 2 columns')
  const narrow = css.match(/@media \(max-width: 900px\) \{([\s\S]*?)\n\}/)
  assert.ok(narrow, 'narrow desktop breakpoint must exist')
  assert.ok(narrow[1].includes('.settings-card'), 'settings adapts at narrow width')
  assert.ok(narrow[1].includes('max-width: none'), 'settings card expands to content width')
  assert.ok(narrow[1].includes('.project-grid'), 'project grid reflows at narrow width')
})

test('Electron window sets a reasonable minimum desktop size', () => {
  assert.ok(mainSrc.includes('minWidth: 760'), 'BrowserWindow minWidth must be set')
  assert.ok(mainSrc.includes('minHeight: 600'), 'BrowserWindow minHeight must be set')
})
