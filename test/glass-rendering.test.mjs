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

test('shared glass surface rule consumes the centralized CONTENT tokens (Level 2)', () => {
  const shared = findRule('.card, .glass')
  assert.ok(shared, 'shared .card/.glass rule must exist')
  assert.ok(shared.body.includes('background: var(--glass-bg-content)'))
  assert.ok(shared.body.includes('backdrop-filter: blur(var(--glass-blur-content)) saturate(var(--glass-saturation))'))
  assert.ok(shared.body.includes('-webkit-backdrop-filter: blur(var(--glass-blur-content)) saturate(var(--glass-saturation))'))
  assert.ok(shared.body.includes('border: var(--glass-border-content)'))
  assert.ok(shared.body.includes('box-shadow: var(--glass-shadow-content)'))
})

test('Level-1 and floating rules consume their engine token sets', () => {
  const l1 = findRule('.glass-l1, .sidebar')
  assert.ok(l1)
  assert.ok(l1.body.includes('var(--glass-bg)'), 'L1 uses the functional fill')
  assert.ok(l1.body.includes('var(--glass-lift)'), 'L1 carries the lift layer')
  assert.ok(l1.body.includes('var(--glass-rim)'), 'L1 carries the refractive rim')
  const float = findRule('.glass-float')
  assert.ok(float)
  assert.ok(float.body.includes('var(--glass-bg-float)'), 'floating uses its own clearer fill')
  assert.ok(float.body.includes('var(--glass-blur-float)'), 'floating uses its own scattering')
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
  // Pseudo-element edge-highlight layers (::before/::after) are excluded: they
  // are the intended inner-light overlay, not a glass-background override. The
  // Level-1 engine rule (.glass-l1, .sidebar) is the same engine, explicitly
  // re-consumed — also excluded.
  for (const rule of rules.slice(sharedIndex + 1)) {
    if (/card|sidebar/.test(rule.selector) && !rule.selector.includes('::') && rule.selector !== '.glass-l1, .sidebar') {
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

test('glass tokens are defined only in :root and consumed by their surface rules', () => {
  const rootRule = findRule(':root')
  assert.ok(rootRule, ':root rule must exist')
  const l1 = findRule('.glass-l1, .sidebar')
  assert.ok(l1)
  const shared = findRule('.card, .glass')
  assert.ok(shared)
  const float = findRule('.glass-float')
  assert.ok(float)

  const base = ['--glass-bg', '--glass-blur', '--glass-border', '--glass-shadow']
  for (const token of base) {
    assert.ok(rootRule.body.includes(token), `${token} must be defined in :root`)
  }
  assert.ok(l1.body.includes('var(--glass-bg)'), 'L1 consumes the functional fill')
  assert.ok(l1.body.includes('var(--glass-blur)'), 'L1 consumes the functional scattering')
  assert.ok(shared.body.includes('var(--glass-bg-content)'), 'content consumes the content fill')
  assert.ok(shared.body.includes('var(--glass-blur-content)'), 'content consumes the content scattering')
  assert.ok(float.body.includes('var(--glass-bg-float)'), 'floating consumes the floating fill')

  // No rule other than the :root scopes and the surface rules may reference
  // the material-core tokens. (--glass-border is intentionally also consumed
  // by controls such as .btn-secondary and select; --glass-shadow may be
  // LAYERED on depth-hierarchy surfaces, never replaced by a fixed shadow.)
  for (const rule of rules) {
    if (
      rule.selector === ':root' ||
      rule.selector.startsWith(':root[') ||
      rule.selector === '.card, .glass' ||
      rule.selector === '.glass-l1, .sidebar' ||
      rule.selector === '.glass-l1' ||
      rule.selector === '.glass-float' ||
      rule.selector === '.segmented button.active' ||
      rule.selector.startsWith('@media (prefers-reduced-transparency')
    ) continue
    for (const token of ['--glass-bg', '--glass-blur', '--glass-saturation']) {
      // Boundary match: --glass-bg-content / --glass-blur-content etc. are
      // distinct tokens owned by the content surface, not violations.
      const boundary = new RegExp(token + '(?!-)')
      assert.equal(boundary.test(rule.body), false, `${rule.selector} must not reference ${token}`)
    }
    if (/--glass-shadow(?!-)/.test(rule.body)) {
      assert.ok(
        rule.body.includes('box-shadow: var(--glass-shadow),'),
        `${rule.selector} must layer --glass-shadow, not replace it`,
      )
    }
  }
  assert.ok(css.split('--glass-highlight').length - 1 >= 1, '--glass-highlight token must exist')
})

test('semantic glass levels exist and Level 1 differs from Level 2 treatment', () => {
  const l1 = findRule('.glass-l1, .sidebar')
  assert.ok(l1, 'Level-1 glass rule must exist')
  // L1 explicitly consumes the SAME global engine (frost/transparency stay global).
  assert.ok(l1.body.includes('var(--glass-bg)'))
  assert.ok(l1.body.includes('var(--glass-blur)'))
  // L1 floats above content: deeper lift layered on the base shadow.
  assert.ok(l1.body.includes('var(--glass-lift)'))

  const shared = findRule('.card, .glass')
  assert.ok(shared)
  assert.equal(shared.body.includes('--glass-lift'), false, 'Level 2 must stay flatter (no lift)')
  assert.equal(shared.body.includes('--glass-specular'), false, 'Level 2 must not carry the specular layer')
  assert.equal(shared.body.includes('--glass-reflection'), false, 'Level 2 must not carry the reflection layer')

  // Pseudo layers: L1 specular + internal reflection; L2 keeps only the top light.
  const l1Before = findRule('.glass-l1::before, .sidebar::before')
  const l1After = findRule('.glass-l1::after, .sidebar::after')
  assert.ok(l1Before && l1Before.body.includes('var(--glass-specular)'), 'L1 specular highlight layer exists')
  assert.ok(l1After && l1After.body.includes('var(--glass-reflection)'), 'L1 internal reflection layer exists')
  assert.ok(l1After.body.includes('var(--glass-edge-dark)'), 'L1 darker lower edge exists')
  assert.ok(l1Before.body.includes('pointer-events: none'), 'overlay layers never capture input')
  assert.ok(l1After.body.includes('pointer-events: none'))
})

test('edge/specular/reflection construction tokens exist in both theme scopes', () => {
  for (const token of ['--glass-lift', '--glass-specular', '--glass-reflection', '--glass-edge-dark', '--glass-rim']) {
    assert.ok(css.includes(token), `${token} token must exist`)
  }
  const dark = css.match(/:root\[data-theme='dark'\] \{([\s\S]*?)\n\}/)
  assert.ok(dark && dark[1].includes('--glass-specular'), 'dark theme defines its own specular/edge set')
  assert.ok(dark[1].includes('--glass-edge-dark'), 'dark theme keeps a darker lower edge')
  assert.ok(dark[1].includes('--glass-rim'), 'dark theme keeps a refractive rim')
})

test('shared content rows do not receive independent backdrop-filter (glass only at surface boundaries)', () => {
  for (const selector of ['.list-row', '.nav-item', '.chip', '.btn', '.field']) {
    const rule = findRule(selector)
    assert.ok(rule, `${selector} rule must exist`)
    assert.equal(rule.body.includes('backdrop-filter'), false, `${selector} must not carry its own backdrop-filter`)
  }
})

test('reduced-motion and reduced-transparency safety blocks exist', () => {
  assert.ok(css.includes('prefers-reduced-motion'), 'reduced-motion media query must exist')
  assert.ok(css.includes('prefers-reduced-transparency'), 'reduced-transparency fallback must exist')
})

test('DOM writer targets documentElement (root scope inherited by all surfaces)', () => {
  assert.ok(tokensSrc.includes('document.documentElement'))
  // The writer iterates a key list and prefixes with '--'; assert the keys.
  for (const key of [
    'glassBg', 'glassBlur', 'glassBorder', 'glassShadow', 'glassSaturation', 'glassHighlight',
    'glassSpecular', 'glassReflection', 'glassEdgeDark', 'glassLift', 'glassRim',
    'glassBgContent', 'glassBlurContent', 'glassBorderContent', 'glassShadowContent',
    'glassBgFloat', 'glassBlurFloat', 'glassBorderFloat', 'glassShadowFloat',
  ]) {
    assert.ok(tokensSrc.includes(`'${key}'`), `applyGlassTokens must write --${key}`)
  }
})

test('coherent concentric radius system exists', () => {
  for (const token of ['--radius-window', '--radius-glass-large', '--radius-glass-medium', '--radius-control', '--radius-capsule']) {
    assert.ok(css.includes(token), `${token} must exist`)
  }
  const card = findRule('.card, .glass')
  assert.ok(card.body.includes('var(--radius-glass-medium)'), 'cards use the medium glass radius')
  const sidebar = findRule('.sidebar')
  assert.ok(sidebar.body.includes('var(--radius-glass-large)'), 'sidebar uses the large glass radius')
})

test('clear vs tinted produces different computed token values (selection → token link)', () => {
  const clear = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  const tinted = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'tinted' })
  assert.notEqual(clear.glassBlur, tinted.glassBlur)
  assert.notEqual(clear.glassBg, tinted.glassBg)

  // Legacy continuous fields remain irrelevant to the engine.
  assert.deepEqual(
    computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear', material: 'frosted', frostIntensity: 50, transparencyLevel: 50 }),
    computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' }),
  )
})
