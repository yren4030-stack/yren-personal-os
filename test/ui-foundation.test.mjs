import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  FOUNDATION_STATES,
  FOUNDATION_TOKENS,
  SEMANTIC_COLOR_ROLES,
  applyFoundationPreferences,
  resolveFoundationPreferences,
} from '../apps/desktop/renderer/src/ui-foundation.mjs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/ui-foundation.css', import.meta.url), 'utf8')

test('semantic color roles and light/dark token sets are complete', () => {
  assert.deepEqual(Object.keys(FOUNDATION_TOKENS.colors.light), SEMANTIC_COLOR_ROLES)
  assert.deepEqual(Object.keys(FOUNDATION_TOKENS.colors.dark), SEMANTIC_COLOR_ROLES)
  assert.match(css, /--ui-color-background:/)
  assert.match(css, /:root\[data-theme='dark'\]/)
  assert.match(css, /--ui-color-surface-glass: var\(--glass-bg\)/)
})

test('spacing, concentric radius, typography and motion tokens match the foundation', () => {
  assert.deepEqual(FOUNDATION_TOKENS.spacing, { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 })
  assert.equal(FOUNDATION_TOKENS.radius['control-sm'], 6)
  assert.equal(FOUNDATION_TOKENS.radius['surface-lg'], 16)
  assert.equal(FOUNDATION_TOKENS.radius.capsule, 999)
  assert.equal(FOUNDATION_TOKENS.typography.body.size, 13)
  assert.equal(FOUNDATION_TOKENS.typography.hero.size, 32)
  assert.equal(FOUNDATION_TOKENS.motion.reducedMotion, undefined)
  assert.equal(FOUNDATION_TOKENS.motion.panel, 240)
  assert.match(css, /--ui-font-family: -apple-system, BlinkMacSystemFont/)
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

  const previousDocument = globalThis.document
  const root = { dataset: {} }
  globalThis.document = { documentElement: root }
  try {
    const result = applyFoundationPreferences({ reducedMotion: true, reducedTransparency: true, increasedContrast: true })
    assert.deepEqual(result, { reducedMotion: true, reducedTransparency: true, increasedContrast: true })
    assert.deepEqual(root.dataset, {
      reducedMotion: 'true',
      reducedTransparency: 'true',
      increasedContrast: 'true',
    })
  } finally {
    globalThis.document = previousDocument
  }
})
