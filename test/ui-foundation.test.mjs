import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  FOUNDATION_STATES,
  FOUNDATION_TOKENS,
  SEMANTIC_COLOR_ROLES,
  applyFoundationPreferences,
  applyFoundationTokens,
  initializeFoundation,
  resolveFoundationPreferences,
} from '../apps/desktop/renderer/src/ui-foundation.mjs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/ui-foundation.css', import.meta.url), 'utf8')
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
  assert.equal(root.values['--ui-glass-clear-blur'], FOUNDATION_TOKENS.glass.dark.clear.blur)
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

test('foundation bootstrap initializes tokens and accessibility preferences', () => {
  const previousDocument = globalThis.document
  const root = createRoot()
  globalThis.document = { documentElement: root }
  try {
    const stop = initializeFoundation()
    assert.equal(root.values['--ui-color-background'], FOUNDATION_TOKENS.colors.light.background)
    assert.equal(root.values['--ui-font-family'], FOUNDATION_TOKENS.typography.family)
    assert.deepEqual(root.dataset, {
      foundationTheme: 'light',
      reducedMotion: 'false',
      reducedTransparency: 'false',
      increasedContrast: 'false',
    })
    stop()
  } finally {
    globalThis.document = previousDocument
  }
  assert.match(main, /import \{ initializeFoundation \} from ['"]\.\/ui-foundation\.mjs['"]/)
  assert.match(main, /initializeFoundation\(\)/)
})

test('foundation exposes explicit interaction states and button/search primitives', () => {
  assert.deepEqual(FOUNDATION_STATES, ['default', 'hover', 'pressed', 'focus-visible', 'active', 'disabled'])
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

test('primary and destructive button states retain semantic hover and pressed tokens', () => {
  assert.match(css, /\.ui-button\[data-variant='primary'\]:hover[^}]+background: var\(--ui-interaction-button-primary-hover\)/s)
  assert.match(css, /\.ui-button\[data-variant='primary'\]:active[^}]+background: var\(--ui-interaction-button-primary-pressed\)/s)
  assert.match(css, /\.ui-button\[data-variant='destructive'\]:hover[^}]+background: var\(--ui-interaction-button-critical-hover\)/s)
  assert.match(css, /\.ui-button\[data-variant='destructive'\]:active[^}]+background: var\(--ui-interaction-button-critical-pressed\)/s)
  assert.doesNotMatch(css, /\.ui-button:hover:not\(:disabled\),/)
})

test('Liquid Glass has fallback and nested-material guardrails', () => {
  assert.match(css, /\.ui-liquid-glass \{[\s\S]*backdrop-filter:/)
  assert.match(css, /@supports not \(\(backdrop-filter: blur\(1px\)\)\)/)
  assert.match(css, /\.ui-liquid-glass \.ui-liquid-glass \{[\s\S]*backdrop-filter: none;/)
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
