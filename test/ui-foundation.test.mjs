import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  FOUNDATION_STATES,
  FOUNDATION_TOKENS,
  SEMANTIC_COLOR_ROLES,
  applyFoundationPreferences,
  applyFoundationTokens,
  buildLegacyAliases,
  initializeFoundation,
  registerFoundationLifecycle,
  resolveButtonTokens,
  resolveFoundationTokens,
  resolveFoundationPreferences,
  normalizeGlassStrength,
  resolveGlassStrengthProfile,
  normalizeUiScale,
  normalizeUiScaleProfile,
} from '../apps/desktop/renderer/src/ui-foundation.mjs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/ui-foundation.css', import.meta.url), 'utf8')
const rendererCss = readFileSync(new URL('../apps/desktop/renderer/src/glass.css', import.meta.url), 'utf8')
const main = readFileSync(new URL('../apps/desktop/renderer/src/main.jsx', import.meta.url), 'utf8')

function createRoot() {
  const values = {}
  return {
    dataset: {},
    style: {
      setProperty(name, value) {
        values[name] = value
      },
    },
    values,
  }
}

test('semantic color roles and light/dark token sets are complete', () => {
  assert.deepEqual(Object.keys(FOUNDATION_TOKENS.colors.light), SEMANTIC_COLOR_ROLES)
  assert.deepEqual(Object.keys(FOUNDATION_TOKENS.colors.dark), SEMANTIC_COLOR_ROLES)
  assert.equal(FOUNDATION_TOKENS.colors.light['surface-glass'], 'rgba(246, 246, 246, 0.62)')
  assert.match(css, /color: var\(--ui-color-text-primary\)/)
  assert.match(css, /background: var\(--ui-glass-background\)/)
})

test('runtime CSS vars are applied from FOUNDATION_TOKENS without a CSS token table', () => {
  const root = createRoot()
  applyFoundationTokens(root, 'dark')

  assert.equal(root.values['--ui-color-surface-glass'], FOUNDATION_TOKENS.colors.dark['surface-glass'])
  assert.equal(root.values['--ui-interaction-button-primary-hover'], FOUNDATION_TOKENS.interaction.dark['button-primary-hover'])
  assert.equal(root.values['--ui-space-4'], '16px')
  assert.equal(root.values['--ui-radius-surface-md'], '12px')
  assert.equal(root.values['--ui-motion-panel'], '240ms')
  assert.equal(root.values['--ui-glass-clear-blur'], 'var(--ui-glass-canonical-blur)')
  assert.equal(root.values['--ui-glass-canonical-blur'], resolveFoundationTokens({ appearance: 'dark' }).glass.clear.blur)
  assert.equal(root.dataset.foundationTheme, 'dark')
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}/i)
  assert.doesNotMatch(css, /--glass-(?:bg|border|blur|saturation)(?:[:;\s])/)
})

test('spacing, concentric radius, typography and motion tokens match the foundation', () => {
  assert.deepEqual(FOUNDATION_TOKENS.spacing, { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 })
  assert.equal(FOUNDATION_TOKENS.radius['control-sm'], 6)
  assert.equal(FOUNDATION_TOKENS.radius['surface-lg'], 16)
  assert.equal(FOUNDATION_TOKENS.radius.capsule, 999)
  assert.equal(FOUNDATION_TOKENS.typography.body.size, 13)
  assert.equal(FOUNDATION_TOKENS.typography.hero.size, 32)
  assert.equal(FOUNDATION_TOKENS.motion.panel, 240)
  assert.equal(FOUNDATION_TOKENS.motion.reducedMotion, undefined)
  assert.match(css, /font-family: var\(--ui-font-family\)/)
})

test('UI Scale resolves one bounded runtime token map for typography, geometry and layout', () => {
  assert.equal(normalizeUiScale(84), 85)
  assert.equal(normalizeUiScale(126), 125)
  const compact = resolveFoundationTokens({ appearance: 'light', uiScale: 85 })
  const baseline = resolveFoundationTokens({ appearance: 'light', uiScale: 100 })
  const wide = resolveFoundationTokens({ appearance: 'light', uiScale: 125 })

  assert.equal(compact.uiScale, 85)
  assert.equal(compact.scaleFactor, 0.85)
  assert.equal(wide.scaleFactor, 1.25)
  assert.ok(compact.typography.body.size < baseline.typography.body.size)
  assert.ok(wide.typography.title1.size > baseline.typography.title1.size)
  assert.ok(compact.spacing[4] < baseline.spacing[4])
  assert.ok(wide.radius['surface-md'] > baseline.radius['surface-md'])
  assert.ok(compact.geometry['control-height'] < baseline.geometry['control-height'])
  assert.equal(compact.geometry['disabled-opacity'], baseline.geometry['disabled-opacity'])
  assert.ok(compact.layout['sidebar-width'].includes('197.2px'))
  assert.equal(compact.glass.regular.fill, baseline.glass.regular.fill)
  assert.equal(wide.glass.regular.blur, baseline.glass.regular.blur)

  const root = createRoot()
  applyFoundationTokens(root, compact)
  assert.equal(root.values['--ui-scale'], '0.85')
  assert.equal(root.values['--ui-scale-percent'], '85%')
  assert.equal(root.values['--ui-geometry-border-width'], '0.85px')
  assert.equal(root.values['--ui-geometry-disabled-opacity'], '0.45')
  assert.equal(root.dataset.uiScale, '85')
})

test('separate UI Scale resolves text and spacing while container size stays interaction-owned', () => {
  const profile = { mode: 'separate', unified: 100, typography: 115, width: 90, height: 110, verticalSpacing: 85, horizontalSpacing: 125 }
  assert.deepEqual(normalizeUiScaleProfile(profile), profile)
  const resolved = resolveFoundationTokens({ appearance: 'light', uiScaleProfile: profile })
  const baseline = resolveFoundationTokens({ appearance: 'light', uiScaleProfile: { mode: 'unified', unified: 100 } })
  assert.equal(resolved.uiScaleMode, 'separate')
  assert.equal(resolved.typographyScale, 115)
  assert.equal(resolved.widthScale, 100)
  assert.equal(resolved.heightScale, 100)
  assert.equal(resolved.typography.body.size, baseline.typography.body.size * 1.15)
  assert.equal(resolved.geometry['control-height'], baseline.geometry['control-height'])
  assert.equal(resolved.spacingVertical[4], 16 * 0.85)
  assert.equal(resolved.spacingHorizontal[4], 16 * 1.25)
  const root = createRoot()
  applyFoundationTokens(root, resolved)
  assert.equal(root.values['--ui-scale-typography'], '1.15')
  assert.equal(root.values['--ui-scale-width'], '1')
  assert.equal(root.values['--ui-scale-height'], '1')
  assert.equal(root.values['--ui-space-v-4'], '13.6px')
  assert.equal(root.values['--ui-space-h-4'], '20px')
  assert.equal(root.dataset.uiScaleMode, 'separate')
})

test('foundation bootstrap initializes tokens and accessibility preferences', () => {
  const previousDocument = globalThis.document
  const root = createRoot()
  globalThis.document = { documentElement: root }
  try {
    const stop = initializeFoundation()
    assert.equal(root.values['--ui-color-background'], FOUNDATION_TOKENS.colors.light.background)
    assert.equal(root.values['--ui-font-family'], FOUNDATION_TOKENS.typography.family)
    assert.equal(root.dataset.foundationTheme, 'light')
    assert.equal(root.dataset.reducedMotion, 'false')
    assert.equal(root.dataset.foundationAppearance, 'clear')
    stop()
  } finally {
    globalThis.document = previousDocument
  }
  assert.match(main, /import \{ initializeFoundation, registerFoundationLifecycle \} from ['"]\.\/ui-foundation\.mjs['"]/)
  assert.match(main, /const disposeFoundation = initializeFoundation\(\)/)
  assert.match(main, /registerFoundationLifecycle\(/)
})

test('foundation re-application preserves the current Appearance UI Scale', () => {
  const previousDocument = globalThis.document
  const root = createRoot()
  root.dataset.uiScale = '85'
  globalThis.document = { documentElement: root }
  try {
    const stop = initializeFoundation()
    assert.equal(root.values['--ui-scale'], '0.85')
    assert.equal(root.values['--ui-scale-percent'], '85%')
    stop()
  } finally {
    globalThis.document = previousDocument
  }
})

test('foundation exposes explicit interaction states and button/search primitives', () => {
  assert.deepEqual(FOUNDATION_STATES, ['default', 'hover', 'pressed', 'focus-visible', 'selected', 'active', 'disabled'])
  for (const selector of [
    '.ui-button[data-variant=\'primary\']',
    '.ui-button[data-variant=\'secondary\']',
    '.ui-button[data-variant=\'destructive\']',
    '.ui-button[data-variant=\'icon-only\']',
    '.ui-search[data-state=\'results\']',
    '.ui-popover',
    '.ui-menu',
    '.ui-sheet',
  ]) {
    assert.ok(css.includes(selector), `missing ${selector}`)
  }
  assert.match(css, /\.ui-button:focus-visible/)
  assert.match(css, /\.ui-button:disabled/)
  assert.match(css, /\.ui-button\[data-state='pressed'\]/)
  assert.match(css, /\.ui-button\[data-state='active'\]/)
  assert.match(css, /\.ui-search\[data-state='typing'\]/)
  assert.match(css, /\.ui-search\[data-state='clear'/)
})

test('resolveFoundationTokens is deterministic and resolves accessibility inputs', () => {
  const normal = resolveFoundationTokens({ appearance: 'light', liquidGlassStyle: 'clear' })
  const contrast = resolveFoundationTokens({ appearance: 'light', liquidGlassStyle: 'clear', increasedContrast: true })
  const reduced = resolveFoundationTokens({ appearance: 'light', liquidGlassStyle: 'clear', reducedTransparency: true })
  assert.deepEqual(normal, resolveFoundationTokens({ appearance: 'light', liquidGlassStyle: 'clear' }))
  assert.notEqual(normal.colors['text-primary'], contrast.colors['text-primary'])
  assert.notEqual(normal.colors.separator, contrast.colors.separator)
  assert.equal(reduced.glass.regular.blur, '0px')
  assert.equal(reduced.glass.regular.shadow, 'none')
  assert.equal(buildLegacyAliases(contrast)['--accent'], 'var(--ui-interaction-button-primary)')
})

test('Glass Strength uses one bounded deterministic optical mapping for Light and Dark', () => {
  assert.equal(normalizeGlassStrength(-1), 0)
  assert.equal(normalizeGlassStrength(101), 100)
  assert.equal(normalizeGlassStrength('not-a-number'), 30)
  assert.equal(resolveFoundationTokens({ appearance: 'light' }).glassStrength, 30)
  assert.equal(resolveGlassStrengthProfile(60).delta, 0)

  for (const theme of ['light', 'dark']) {
    const low = resolveFoundationTokens({ appearance: theme, glassStrength: 30 }).glass.regular
    const baseline = resolveFoundationTokens({ appearance: theme, glassStrength: 60 }).glass.regular
    const high = resolveFoundationTokens({ appearance: theme, glassStrength: 85 }).glass.regular
    assert.equal(low.glassStrength, 30)
    assert.equal(baseline.glassStrength, 60)
    assert.equal(high.glassStrength, 85)
    assert.ok(low.fillAlpha < baseline.fillAlpha && baseline.fillAlpha < high.fillAlpha, `${theme}: fill increases with strength`)
    assert.ok(low.blurPx < baseline.blurPx && baseline.blurPx < high.blurPx, `${theme}: blur increases with strength`)
    assert.doesNotMatch(low.specular, /135deg|160deg/)
    assert.doesNotMatch(high.specular, /135deg|160deg/)
  }
  assert.notEqual(
    resolveFoundationTokens({ appearance: 'light', glassStrength: 30 }).contentBearing.fill,
    resolveFoundationTokens({ appearance: 'light', glassStrength: 85 }).contentBearing.fill,
  )
})

test('Glass Strength freezes clear, baseline, and stable optical anchors', () => {
  assert.equal(resolveGlassStrengthProfile(0).delta, -1)
  assert.equal(resolveGlassStrengthProfile(60).delta, 0)
  assert.equal(resolveGlassStrengthProfile(100).delta, 1)
  assert.notEqual(resolveGlassStrengthProfile(15).delta, -0.75)
  assert.notEqual(resolveGlassStrengthProfile(85).delta, 0.625)
  for (const theme of ['light', 'dark']) {
    const clear = resolveFoundationTokens({ appearance: theme, glassStrength: 0 })
    const baseline = resolveFoundationTokens({ appearance: theme, glassStrength: 60 })
    const stable = resolveFoundationTokens({ appearance: theme, glassStrength: 100 })

    assert.ok(clear.glass.regular.fillAlpha < baseline.glass.regular.fillAlpha)
    assert.ok(clear.glass.regular.blurPx < baseline.glass.regular.blurPx)
    assert.ok(stable.glass.regular.fillAlpha > baseline.glass.regular.fillAlpha)
    assert.ok(stable.glass.regular.blurPx > baseline.glass.regular.blurPx)
    assert.ok(clear.glass.regular.fillAlpha <= 0.24, `${theme}: 0% remains highly transmissive`)
    assert.equal(stable.glass.regular.fillAlpha, 0.94, `${theme}: 100% keeps the established endpoint`)
    for (const material of [clear.glass.regular, baseline.glass.regular, stable.glass.regular]) {
      assert.match(material.edgeLensing, /^radial-gradient\(/)
      assert.notEqual(material.edgeTop, 'none')
      assert.notEqual(material.edgeSide, 'none')
      assert.notEqual(material.edgeBottom, 'none')
      assert.equal(material.reflection, 'none')
      assert.equal(material.spill, 'none')
      assert.doesNotMatch(material.specular, /135deg|160deg/)
    }
    assert.equal(baseline.glass.regular.background, theme === 'dark' ? 'rgba(24, 24, 28, 0.850)' : 'rgba(248, 247, 245, 0.880)')
    assert.ok(clear.contentBearing.fill !== stable.contentBearing.fill)
    assert.ok(clear.contentBearing.blur !== stable.contentBearing.blur)
  }
})

test('content-bearing runtime profile is shared and reduced transparency remains opaque', () => {
  const light = resolveFoundationTokens({ appearance: 'light', glassStrength: 60 })
  const dark = resolveFoundationTokens({ appearance: 'dark', glassStrength: 60 })
  assert.equal(light.contentBearing.fill, 'rgba(248, 247, 245, 0.880)')
  assert.equal(light.contentBearing.blur, '44px')
  assert.equal(dark.contentBearing.fill, 'rgba(24, 24, 28, 0.850)')
  assert.equal(dark.contentBearing.blur, '44px')
  assert.match(light.contentBearing.edgeLensing, /^radial-gradient\(/)
  assert.match(dark.contentBearing.edgeLensing, /^radial-gradient\(/)

  const reduced = resolveFoundationTokens({ appearance: 'light', glassStrength: 0, reducedTransparency: true })
  assert.equal(reduced.contentBearing.blur, '0px')
  assert.equal(reduced.contentBearing.shadow, 'none')
  assert.equal(reduced.contentBearing.edgeLensing, 'none')
})

test('dark regular Glass uses a uniform graphite baseline without diagonal split light', () => {
  const dark = resolveFoundationTokens({ appearance: 'dark', glassStrength: 60 }).glass.regular
  assert.equal(dark.background, 'rgba(24, 24, 28, 0.850)')
  assert.equal(dark.border, '1px solid rgba(255, 255, 255, 0.200)')
  assert.equal(dark.shadow, '0 1px 2px rgba(0, 0, 0, 0.340), 0 18px 50px -20px rgba(0, 0, 0, 0.460)')
  assert.equal(dark.blur, '44px')
  assert.equal(dark.saturation, 1.2)
  assert.equal(dark.highlight, 'linear-gradient(180deg, rgba(255, 255, 255, 0.100), transparent 22%)')
  assert.match(dark.specular, /linear-gradient\(180deg/)
  assert.equal(dark.reflection, 'none')
  assert.equal(dark.spill, 'none')
  assert.doesNotMatch(dark.specular, /135deg|160deg/)
  const root = createRoot()
  applyFoundationTokens(root, resolveFoundationTokens({ appearance: 'dark', glassStrength: 60 }))
  assert.equal(root.values['--ui-glass-regular-background'], 'var(--ui-glass-canonical-background)')
  assert.equal(root.values['--ui-glass-canonical-background'], 'rgba(24, 24, 28, 0.850)')
  assert.equal(root.values['--ui-glass-regular-saturation'], 'var(--ui-glass-canonical-saturation)')
  assert.equal(root.values['--ui-glass-canonical-saturation'], '120%')
  assert.equal(root.values['--ui-glass-regular-specular'], 'var(--ui-glass-canonical-specular)')
  assert.equal(root.values['--ui-glass-canonical-specular'], dark.specular)
  assert.equal(root.values['--ui-glass-regular-spill'], 'var(--ui-glass-canonical-spill)')
  assert.equal(root.values['--ui-glass-canonical-spill'], 'none')
})

test('applyFoundationTokens applies resolved contrast and transparency maps', () => {
  const normalRoot = createRoot()
  const contrastRoot = createRoot()
  const reducedRoot = createRoot()
  applyFoundationTokens(normalRoot, resolveFoundationTokens({ appearance: 'light', glassStrength: 60 }))
  applyFoundationTokens(contrastRoot, resolveFoundationTokens({ appearance: 'light', increasedContrast: true, glassStrength: 60 }))
  applyFoundationTokens(reducedRoot, resolveFoundationTokens({ appearance: 'light', reducedTransparency: true }))
  assert.equal(normalRoot.values['--ui-color-text-primary'], FOUNDATION_TOKENS.colors.light['text-primary'])
  assert.equal(contrastRoot.values['--ui-color-text-primary'], FOUNDATION_TOKENS.contrast.light['text-primary'])
  assert.equal(contrastRoot.values['--ui-color-separator'], FOUNDATION_TOKENS.contrast.light.separator)
  assert.equal(contrastRoot.values['--ui-interaction-button-primary'], FOUNDATION_TOKENS.contrast.light['button-primary'])
  assert.equal(contrastRoot.values['--ui-interaction-selection-background'], FOUNDATION_TOKENS.contrast.light['selection-background'])
  assert.equal(contrastRoot.values['--ui-glass-regular-background'], 'var(--ui-glass-canonical-background)')
  assert.equal(contrastRoot.values['--ui-glass-canonical-background'], 'rgba(248, 247, 245, 0.880)')
  assert.equal(contrastRoot.values['--ui-glass-canonical-border'], FOUNDATION_TOKENS.contrast.light.glass.regular.border)
  assert.equal(reducedRoot.values['--ui-glass-regular-blur'], 'var(--ui-glass-canonical-blur)')
  assert.equal(reducedRoot.values['--ui-glass-canonical-blur'], '0px')
  assert.equal(reducedRoot.values['--ui-glass-regular-shadow'], 'var(--ui-glass-canonical-shadow)')
  assert.equal(reducedRoot.values['--ui-glass-canonical-shadow'], 'none')
  assert.equal(reducedRoot.values['--glass-bg'], 'var(--ui-glass-regular-background)')
})

test('applyFoundationTokens publishes the single runtime Glass Strength source', () => {
  const root = createRoot()
  const resolved = resolveFoundationTokens({ appearance: 'light', glassStrength: 85 })
  applyFoundationTokens(root, resolved)
  assert.equal(root.values['--ui-glass-strength'], '85')
  assert.equal(root.dataset.foundationGlassStrength, '85')
  const reduced = resolveFoundationTokens({ appearance: 'light', glassStrength: 85, reducedTransparency: true })
  assert.equal(reduced.glass.regular.blur, '0px')
  assert.equal(reduced.glass.regular.shadow, 'none')
})

test('resolveButtonTokens keeps primary and destructive semantic identity', () => {
  for (const variant of ['primary', 'destructive']) {
    const normal = resolveButtonTokens({ variant, state: 'default' })
    const hover = resolveButtonTokens({ variant, state: 'hover' })
    const pressed = resolveButtonTokens({ variant, state: 'pressed' })
    const selected = resolveButtonTokens({ variant, state: 'selected' })
    const disabled = resolveButtonTokens({ variant, state: 'disabled' })
    assert.notEqual(normal.background, hover.background)
    assert.notEqual(hover.background, pressed.background)
    assert.notEqual(pressed.background, selected.background)
    assert.equal(selected.variant, variant)
    assert.equal(disabled.disabledOpacity, FOUNDATION_TOKENS.geometry['disabled-opacity'])
  }
})

test('increased contrast reaches real primary, segmented and sidebar semantic tokens', () => {
  const normal = resolveFoundationTokens({ appearance: 'light' })
  const contrast = resolveFoundationTokens({ appearance: 'light', increasedContrast: true })
  const normalPrimary = resolveButtonTokens({ variant: 'primary' })
  const contrastPrimary = resolveButtonTokens({ variant: 'primary', increasedContrast: true })
  assert.notEqual(normalPrimary.background, contrastPrimary.background)
  assert.notEqual(normalPrimary.border, contrastPrimary.border)
  assert.notEqual(normal.interaction['button-primary'], contrast.interaction['button-primary'])
  assert.notEqual(normal.interaction['button-primary-hover'], contrast.interaction['button-primary-hover'])
  assert.notEqual(normal.interaction['button-primary-selected'], contrast.interaction['button-primary-selected'])
  assert.notEqual(normal.interaction['selection-background'], contrast.interaction['selection-background'])
  assert.notEqual(normal.interaction['selection-text'], contrast.interaction['selection-text'])
  assert.notEqual(normal.interaction['selection-boundary'], contrast.interaction['selection-boundary'])
  assert.equal(normal.glass.regular.background, contrast.glass.regular.background)
  assert.notEqual(normal.glass.regular.border, contrast.glass.regular.border)
  assert.equal(normal.glass.clear.background, contrast.glass.clear.background)
  assert.match(main, /registerFoundationLifecycle\(/)
  assert.match(rendererCss, /\.btn-primary[\s\S]*background: var\(--ui-interaction-button-primary\)/)
  assert.match(rendererCss, /\.segmented button\.active[\s\S]*var\(--ui-interaction-selection-background\)/)
  assert.match(css, /\.ui-liquid-glass[\s\S]*background: var\(--ui-glass-background\)/)
})

test('initializeFoundation is idempotent and removes listeners on dispose', () => {
  const previousDocument = globalThis.document
  const previousWindow = globalThis.window
  const previousObserver = globalThis.MutationObserver
  const root = createRoot()
  const queries = new Map()
  const makeQuery = (name) => ({ matches: false, listeners: new Set(), addEventListener(_type, fn) { this.listeners.add(fn) }, removeEventListener(_type, fn) { this.listeners.delete(fn) } })
  const unloadHandlers = new Set()
  globalThis.window = {
    matchMedia(name) { if (!queries.has(name)) queries.set(name, makeQuery(name)); return queries.get(name) },
    addEventListener(type, handler) { if (type === 'unload') unloadHandlers.add(handler) },
    removeEventListener(type, handler) { if (type === 'unload') unloadHandlers.delete(handler) },
  }
  class FakeObserver { constructor() { this.disconnected = false; FakeObserver.instances.push(this) } observe() {} disconnect() { this.disconnected = true } }
  FakeObserver.instances = []
  globalThis.MutationObserver = FakeObserver
  globalThis.document = { documentElement: root }
  try {
    const first = initializeFoundation()
    assert.deepEqual([...queries.values()].map((query) => query.listeners.size), [1, 1, 1])
    const second = initializeFoundation()
    assert.equal(FakeObserver.instances[0].disconnected, true)
    assert.deepEqual([...queries.values()].map((query) => query.listeners.size), [1, 1, 1])
    first()
    second()
    assert.deepEqual([...queries.values()].map((query) => query.listeners.size), [0, 0, 0])
    const hot = { dispose(handler) { this.handler = handler } }
    const third = initializeFoundation()
    const stopLifecycle = registerFoundationLifecycle({ dispose: third, windowObject: globalThis.window, hot })
    assert.equal(unloadHandlers.size, 1)
    stopLifecycle()
    assert.equal(unloadHandlers.size, 0)
    const fourth = initializeFoundation()
    registerFoundationLifecycle({ dispose: fourth, windowObject: globalThis.window, hot })
    assert.equal(unloadHandlers.size, 1)
    hot.handler()
    assert.equal(unloadHandlers.size, 0)
  } finally {
    globalThis.document = previousDocument
    globalThis.window = previousWindow
    globalThis.MutationObserver = previousObserver
  }
})

test('primary and destructive button states retain semantic hover and pressed tokens', () => {
  assert.match(css, /\.ui-button\[data-variant='primary'\]:hover[^}]+background: var\(--ui-interaction-button-primary-hover\)/s)
  assert.match(css, /\.ui-button\[data-variant='primary'\]:active[^}]+background: var\(--ui-interaction-button-primary-pressed\)/s)
  assert.match(css, /\.ui-button\[data-variant='destructive'\]:hover[^}]+background: var\(--ui-interaction-button-critical-hover\)/s)
  assert.match(css, /\.ui-button\[data-variant='destructive'\]:active[^}]+background: var\(--ui-interaction-button-critical-pressed\)/s)
  assert.match(css, /\.ui-button\[data-variant='primary'\]\[data-state='selected'\][^}]+background-color: var\(--ui-interaction-button-primary-selected\)/s)
  assert.match(css, /\.ui-button\[data-variant='destructive'\]\[data-state='selected'\][^}]+background-color: var\(--ui-interaction-button-critical-selected\)/s)
  assert.match(css, /data-state='selected'\]:not\(\[data-variant='primary'\]\):not\(\[data-variant='destructive'\]\)/)
  assert.doesNotMatch(css, /\.ui-button:hover:not\(:disabled\),/)
  assert.doesNotMatch(css, /!important/)
})

test('Liquid Glass has fallback and nested-material guardrails', () => {
  assert.match(css, /\.ui-liquid-glass \{[\s\S]*backdrop-filter:/)
  assert.match(css, /@supports not \(\(backdrop-filter: blur\(1px\)\)\)/)
  assert.match(css, /\.ui-liquid-glass \.ui-liquid-glass:not\(\.content-bearing-glass\) \{[\s\S]*backdrop-filter: none;/)
  assert.match(css, /prefers-reduced-transparency: reduce/)
})

test('accessibility preferences resolve safely and can be applied without product/runtime access', () => {
  assert.deepEqual(resolveFoundationPreferences({ reducedMotion: 1, reducedTransparency: true, increasedContrast: false }), {
    reducedMotion: false,
    reducedTransparency: true,
    increasedContrast: false,
  })

  const root = createRoot()
  const result = applyFoundationPreferences(root, { reducedMotion: true, reducedTransparency: true, increasedContrast: true })
  assert.deepEqual(result, { reducedMotion: true, reducedTransparency: true, increasedContrast: true })
  assert.deepEqual(root.dataset, {
    reducedMotion: 'true',
    reducedTransparency: 'true',
    increasedContrast: 'true',
  })
})
