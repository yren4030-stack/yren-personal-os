/**
 * Deterministic static proofs for the Liquid Glass rendering chain:
 * shared surface rule consumes the tokens, no later override, no opaque
 * parent between the body depth layer and the glass, tokens defined in
 * :root only, and the DOM writer targets documentElement.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { computeGlassTokens } from '../apps/desktop/renderer/src/glass-tokens.mjs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/glass.css', import.meta.url), 'utf8')
const tokensSrc = readFileSync(new URL('../apps/desktop/renderer/src/glass-tokens.mjs', import.meta.url), 'utf8')

function ruleChunks() {
  // Strip comments so leading section comments do not pollute selectors.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return clean
    .split('}')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const brace = chunk.indexOf('{')
      return { selector: chunk.slice(0, brace).replace(/\s+/g, ' ').trim(), body: chunk.slice(brace + 1).trim() }
    })
}
const rules = ruleChunks()

const findRule = (selector) => rules.find((r) => r.selector === selector)
const surfaceSelectors = ['.sidebar', '.stat-card', '.project-card', '.settings-card', '.proposal-card', '.list-card']

test('shared glass surface rule consumes the centralized tokens', () => {
  const shared = findRule('.card, .glass')
  assert.ok(shared, 'shared .card/.glass rule must exist')
  assert.ok(shared.body.includes('background: var(--glass-bg)'))
  assert.ok(shared.body.includes('backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation))'))
  assert.ok(shared.body.includes('-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation))'))
  assert.ok(shared.body.includes('border: var(--glass-border)'))
  assert.ok(shared.body.includes('box-shadow: var(--glass-shadow)'))
})

test('no later CSS rule overrides background/backdrop-filter/opacity on glass surfaces', () => {
  const sharedIndex = rules.findIndex((r) => r.selector === '.card, .glass')
  assert.ok(sharedIndex >= 0)
  for (const selector of surfaceSelectors) {
    const rule = findRule(selector)
    assert.ok(rule, `${selector} rule must exist`)
    assert.equal(rule.body.includes('background'), false, `${selector} must not set background`)
    assert.equal(rule.body.includes('backdrop-filter'), false, `${selector} must not set backdrop-filter`)
    assert.equal(rule.body.includes('opacity'), false, `${selector} must not set opacity`)
  }
  // No rule AFTER the shared rule may set a background on any *-card surface.
  for (const rule of rules.slice(sharedIndex + 1)) {
    if (/card|sidebar/.test(rule.selector)) {
      assert.equal(rule.body.includes('background'), false, `later rule ${rule.selector} must not override glass background`)
      assert.equal(rule.body.includes('backdrop-filter'), false, `later rule ${rule.selector} must not override backdrop-filter`)
    }
  }
})

test('no opaque parent blocks the body depth layer (GLASS_BACKDROP_SOURCE_LAYER = body)', () => {
  const rootGroup = findRule('html, body, #root')
  assert.ok(rootGroup)
  assert.equal(rootGroup.body.includes('background'), false, 'html/body/#root group must not add an opaque fill')

  const body = findRule('body')
  assert.ok(body)
  assert.ok(body.body.includes('radial-gradient('), 'body must carry the neutral depth fields')
  assert.ok(body.body.includes('linear-gradient('))
  assert.equal(body.body.includes('background-color'), false)
  assert.equal(/\bbackground:\s*#/.test(body.body), false, 'body depth must be gradients, not a solid fill')

  for (const selector of ['.app-shell', '.main', '.page']) {
    const rule = findRule(selector)
    assert.ok(rule, `${selector} rule must exist`)
    assert.equal(rule.body.includes('background'), false, `${selector} must be transparent`)
  }
})

test('glass tokens are defined only in :root and consumed by the shared surface rule', () => {
  const defs = ['--glass-bg', '--glass-blur', '--glass-border', '--glass-saturation', '--glass-shadow']
  const rootRule = findRule(':root')
  assert.ok(rootRule, ':root rule must exist')
  const shared = findRule('.card, .glass')
  assert.ok(shared)
  for (const token of defs) {
    assert.ok(rootRule.body.includes(token), `${token} must be defined in :root`)
    assert.ok(shared.body.includes(token), `${token} must be consumed by the shared surface rule`)
  }
  // No rule other than :root and the shared surface rule may reference the
  // material-core tokens. (--glass-border is intentionally also consumed by
  // controls such as .btn-secondary and select.)
  for (const rule of rules) {
    if (rule.selector === ':root' || rule.selector === '.card, .glass') continue
    for (const token of ['--glass-bg', '--glass-blur', '--glass-saturation', '--glass-shadow']) {
      assert.equal(rule.body.includes(token), false, `${rule.selector} must not reference ${token}`)
    }
  }
  assert.ok(css.split('--glass-highlight').length - 1 >= 1, '--glass-highlight token must exist')
})

test('DOM writer targets documentElement (root scope inherited by all surfaces)', () => {
  assert.ok(tokensSrc.includes('document.documentElement'))
  for (const token of ['--glass-bg', '--glass-blur', '--glass-border', '--glass-shadow', '--glass-saturation', '--glass-highlight']) {
    assert.ok(tokensSrc.includes(`'${token}'`), `applyGlassTokens must write ${token}`)
  }
})

test('frost 0/100 and transparency 0/100 produce different computed token values (slider → token link)', () => {
  const low = computeGlassTokens({ frostIntensity: 0, transparencyLevel: 50 })
  const high = computeGlassTokens({ frostIntensity: 100, transparencyLevel: 50 })
  assert.notEqual(low.glassBlur, high.glassBlur)

  const dense = computeGlassTokens({ frostIntensity: 50, transparencyLevel: 0 })
  const open = computeGlassTokens({ frostIntensity: 50, transparencyLevel: 100 })
  assert.notEqual(dense.glassBg, open.glassBg)

  // Legacy material field remains irrelevant.
  assert.deepEqual(computeGlassTokens({ material: 'frosted', frostIntensity: 50, transparencyLevel: 50 }), computeGlassTokens({ frostIntensity: 50, transparencyLevel: 50 }))
})
