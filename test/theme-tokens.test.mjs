/**
 * Adaptive Liquid Glass theme + responsive-layout proofs (deterministic).
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { computeGlassTokens } from '../apps/desktop/renderer/src/glass-tokens.mjs'
import { resolveTheme, prefersDark } from '../apps/desktop/renderer/src/theme.mjs'
import { FOUNDATION_TOKENS } from '../apps/desktop/renderer/src/ui-foundation.mjs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/glass.css', import.meta.url), 'utf8')
const mainSrc = readFileSync(new URL('../apps/desktop/electron/main.mjs', import.meta.url), 'utf8')

const LIGHT = { theme: 'light', liquidGlassStyle: 'clear', glassStrength: 60 }
const DARK = { theme: 'dark', liquidGlassStyle: 'clear', glassStrength: 60 }

test('light theme tokens exist', () => {
  const light = computeGlassTokens(LIGHT)
  const explicit = computeGlassTokens(LIGHT)
  assert.deepEqual(explicit, light)
  assert.equal(explicit.glassBg, 'rgba(248, 247, 245, 0.880)')
  assert.ok(css.includes(":root[data-theme='dark']"), 'CSS carries a dark theme block')
  assert.ok(css.includes('--text-primary'), 'semantic text tokens exist')
  assert.ok(css.includes('--bg-depth-1'), 'semantic depth tokens exist')
})

test('dark theme tokens exist and use graphite smoked glass', () => {
  const dark = computeGlassTokens(DARK)
  assert.equal(dark.glassBg, 'rgba(24, 24, 28, 0.850)', 'dark fill is the canonical graphite baseline')
  assert.equal(dark.glassBorder, '1px solid rgba(255, 255, 255, 0.200)', 'dark glass uses the canonical perimeter border')
  assert.equal(dark.glassHighlight, 'linear-gradient(180deg, rgba(255, 255, 255, 0.100), transparent 22%)', 'dark glass keeps a restrained edge highlight')
  assert.ok(css.includes(':root[data-theme=\'dark\']') || css.includes(':root[data-theme="dark"]'))
  assert.equal(FOUNDATION_TOKENS.colors.dark['text-primary'], '#f2f2f6', 'dark text token is Foundation-owned')
})

test('light and dark tokens differ at identical appearance settings', () => {
  const light = computeGlassTokens(LIGHT)
  const dark = computeGlassTokens(DARK)
  assert.notEqual(light.glassBg, dark.glassBg)
  assert.notEqual(light.glassBorder, dark.glassBorder)
  assert.notEqual(light.glassHighlight, dark.glassHighlight)
  assert.notEqual(light.glassShadow, dark.glassShadow)
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

test('clear vs tinted keeps one application-wide optical profile', () => {
  const lightClear = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  const lightTinted = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'tinted' })
  assert.equal(lightClear.glassBlur, lightTinted.glassBlur, 'light: blur is canonical')
  assert.equal(lightClear.glassBg, lightTinted.glassBg, 'light: fill is canonical')
  assert.equal(lightClear.alpha, lightTinted.alpha, 'light: fill alpha is canonical')

  const darkClear = computeGlassTokens({ theme: 'dark', liquidGlassStyle: 'clear' })
  const darkTinted = computeGlassTokens({ theme: 'dark', liquidGlassStyle: 'tinted' })
  assert.equal(darkClear.glassBlur, darkTinted.glassBlur, 'dark: regular blur is fixed')
  assert.equal(darkClear.glassBg, darkTinted.glassBg, 'dark: regular fill is fixed')
  assert.equal(darkClear.alpha, darkTinted.alpha, 'dark: regular fill alpha is fixed')
})

test('Global Glass Strength is the only exposed optical control', () => {
  const src = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')
  assert.equal(src.includes('settings.glassMaterial'), false)
  assert.equal(src.includes('settings.frosted'), false)
  assert.equal(src.includes('settings.glassEffect'), false)
  assert.equal(src.includes('settings.frostIntensity'), false)
  assert.equal(src.includes('settings.transparencyLevel'), false)
  assert.equal(src.includes('type="range"'), true, 'the global strength control is exposed')
  assert.ok(src.includes('min="0"') && src.includes('max="100"'), 'strength uses the bounded 0-100 range')
  assert.ok(src.includes('glassStrength'), 'strength is wired to Appearance state')
  assert.ok(src.includes('settings.appearanceMode'), 'appearance mode control exists')
  assert.ok(src.includes('settings.glassStrength'), 'Glass Strength control exists')
  assert.ok(src.includes('settings.desktopBackgroundCurrent'), 'background placeholder exists')
  assert.equal(src.includes('settings.clearOption'), false, 'clear material selector is not exposed in Step 2.6')
  assert.equal(src.includes('settings.tintedOption'), false, 'tinted material selector is not exposed in Step 2.6')
})

test('Appearance UI labels: 浅色 / 深色 / 自动 and truthful placeholders', () => {
  const i18n = readFileSync(new URL('../apps/desktop/renderer/src/i18n/zh-CN.mjs', import.meta.url), 'utf8')
  assert.ok(i18n.includes("themeLight: '浅色'"))
  assert.ok(i18n.includes("themeDark: '深色'"))
  assert.ok(i18n.includes("themeSystem: '自动'"))
  assert.ok(i18n.includes("liquidGlassCurrent: '当前：默认'"))
  assert.ok(i18n.includes("desktopBackgroundCurrent: '正在使用默认背景。'"))
  assert.ok(i18n.includes("appearanceMode: '外观模式'"))
})

test('no CSS zoom / transform-scale responsiveness hack', () => {
  assert.equal(/zoom\s*:/.test(css), false, 'no CSS zoom')
  // transform: scale() is allowed only as a tiny control interaction (the
  // range-thumb hover), never on layout containers.
  for (const selector of ['.app-shell', '.main', '.page', '.sidebar', '.card', '.glass', '.stat-grid', '.project-grid', '.detail-grid', '.settings-card']) {
    const rule = css.match(new RegExp(escapeRegExp(selector) + '\\s*\\{([\\s\\S]*?)\\n\\}'))
    if (rule) {
      assert.equal(/transform:\s*scale\(/.test(rule[1]), false, `${selector} must not use transform scale`)
    }
  }
  assert.equal(mainSrc.includes('setZoomFactor'), false, 'no webFrame zoom')
})

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('component responsiveness uses container queries on the main content', () => {
  const mainRule = css.match(/\.main\s*\{([\s\S]*?)\n\}/)
  assert.ok(mainRule && mainRule[1].includes('container-type: inline-size'), '.main establishes a query container')
  assert.ok(css.includes('@container (max-width: 900px)'), 'container query exists for the detail stack')
})

test('responsive CSS: sidebar has full (232px) and compact (76px) states with a breakpoint', () => {
  assert.equal(FOUNDATION_TOKENS.layout['sidebar-width'], '232px', 'full sidebar width token is Foundation-owned')
  const media = css.match(/@media \(max-width: 1179px\) \{([\s\S]*?)\n\}/)
  assert.ok(media, 'compact sidebar media query must exist')
  assert.ok(media[1].includes('width: 76px'), 'compact sidebar width 76px')
  assert.ok(media[1].includes('.nav-label'), 'labels collapse in compact mode')
})

test('responsive CSS: project detail rail is fluid before stacking when the CONTENT column narrows', () => {
  assert.ok(css.includes('minmax(300px, min(34%, 480px))'), 'detail rail shrinks fluidly with a proportionate cap')
  const container = css.match(/@container \(max-width: 900px\) \{([\s\S]*?)\n\}/)
  assert.ok(container, 'detail stack container query must exist')
  assert.ok(container[1].includes('.detail-grid'), 'container block targets .detail-grid')
  assert.ok(container[1].includes('grid-template-columns: 1fr'), 'detail columns stack to one')
})

test('responsive CSS: Home stat grid is fluid across 4/3/2 column configurations', () => {
  assert.ok(css.includes('repeat(auto-fit, minmax(280px, 1fr))'), 'stat grid uses fluid auto-fit minmax')
  // Auto-fit column count from actual available width (track 280px, gap ~16px).
  const columns = (contentWidth) => Math.floor((contentWidth + 16) / 296)
  assert.equal(columns(1304), 4, 'wide content resolves 4 columns')
  assert.equal(columns(1144), 3, 'standard content resolves 3 columns')
  assert.equal(columns(984), 3, 'medium content resolves 3 columns')
  assert.equal(columns(760), 2, 'narrow content resolves 2 columns')
  assert.equal(columns(620), 2, 'minimum-window content resolves 2 columns')
})

test('responsive CSS: settings width is bounded and left-aligned across compact', () => {
  const compact = css.match(/@container \(max-width: 760px\) \{([\s\S]*?)\n\}/)
  assert.ok(compact && compact[1].includes('.settings-groups'), 'compact tier targets settings groups')
  assert.ok(compact[1].includes('width: 100%'), 'compact settings fills available width')
  assert.match(css, /\.settings-groups\s*\{[\s\S]*?width: min\(100%, 780px\);[\s\S]*?margin-inline: 0;/, 'settings stays left-aligned with a bounded reading width')
  assert.match(compact[1], /\.settings-row\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/, 'compact settings rows stack vertically')
})

test('no one global page max-width artificially constrains every module', () => {
  const pageRule = css.match(/\.page\s*\{([\s\S]*?)\n\}/)
  assert.ok(pageRule)
  assert.equal(pageRule[1].includes('max-width'), false, 'the global .page rule must not cap every module')
})

test('compact-sidebar mode reclaims width immediately (no ghost width)', () => {
  assert.ok(css.includes('flex: 1 1 auto'), '.main reclaims freed width')
  assert.ok(css.includes('min-width: 0'), 'flex/grid children can shrink')
  const media = css.match(/@media \(max-width: 1179px\) \{([\s\S]*?)\n\}/)
  assert.ok(media && media[1].includes('width: 76px'), 'sidebar collapses at its single structural breakpoint')
})

test('760px layout contains no deliberate fixed horizontal overflow', () => {
  // Every fixed pixel width in the stylesheet must be a structural/sidebar
  // value or an inner min/max cap, never a content width that could overflow.
  // Media/container-query max-widths are adaptation thresholds, not element widths.
  const allowed = new Set([232, 76, 200, 280, 260, 300, 480, 520])
  for (const match of css.matchAll(/(?:^|[^-])(?:width|min-width|max-width):\s*(\d+)px/g)) {
    const value = Number(match[1])
    const context = css.slice(Math.max(0, match.index - 80), match.index)
    if (value >= 400 && !context.includes('@media') && !context.includes('@container')) {
      assert.ok(allowed.has(value), `unexpected fixed width ${value}px would risk overflow at 760px`)
    }
  }
})

test('theme tokens do not alter layout geometry', () => {
  const dark = css.match(/:root\[data-theme='dark'\] \{([\s\S]*?)\n\}/)
  assert.ok(dark, 'dark token block must exist')
  // The dark block may only declare --custom-properties; no layout property
  // declarations are allowed (geometry stays identical across themes).
  const layoutProperty = /^\s*(width|min-width|max-width|margin|padding|gap|flex|position|display|overflow|grid-template|inset|transform)\s*:/m
  assert.equal(layoutProperty.test(dark[1]), false, 'dark theme must only swap colors/materials, not geometry')
})

test('Electron window sets a reasonable minimum desktop size', () => {
  assert.ok(mainSrc.includes('minWidth: 760'), 'BrowserWindow minWidth must be set')
  assert.ok(mainSrc.includes('minHeight: 600'), 'BrowserWindow minHeight must be set')
})
