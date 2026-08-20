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
import { buildLegacyAliases, resolveFoundationTokens } from '../apps/desktop/renderer/src/ui-foundation.mjs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/glass.css', import.meta.url), 'utf8')
const foundationCss = readFileSync(new URL('../apps/desktop/renderer/src/ui-foundation.css', import.meta.url), 'utf8')
const tokensSrc = readFileSync(new URL('../apps/desktop/renderer/src/glass-tokens.mjs', import.meta.url), 'utf8')
const foundationSrc = readFileSync(new URL('../apps/desktop/renderer/src/ui-foundation.mjs', import.meta.url), 'utf8')
const appSrc = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')

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
const surfaceSelectors = ['.sidebar', '.stat-card', '.project-card', '.settings-appearance-module', '.proposal-card', '.list-card']

test('formal renderer surfaces consume the single Foundation regular material', () => {
  assert.match(foundationCss, /\.ui-liquid-glass\s*\{[\s\S]*background: var\(--ui-glass-background\)/)
  assert.match(foundationCss, /\.ui-liquid-glass\s*\{[\s\S]*backdrop-filter: blur\(var\(--ui-glass-blur\)/)
  assert.match(appSrc, /function CanonicalGlassSurface\(/)
  assert.match(appSrc, /canonical-glass-surface ui-liquid-glass/)
  for (const marker of [
    /CanonicalGlassSurface as="aside" layoutId="sidebar" className="sidebar"/,
    /CanonicalGlassSurface as="main" glass=\{false\} layoutId="main-workspace" className="main content-workspace"/,
    /layoutId=\{id === 'main-ai' \? 'global-panel-main-ai' : undefined\}/,
  ]) {
    assert.match(appSrc, marker, `renderer must mount ${marker} on the shared material`)
  }
  const shared = findRule('.card, .glass')
  assert.ok(shared, 'shared card hook must exist')
  assert.equal(/\bbackground\s*:/.test(shared.body), false, 'card hook must not own material')
  assert.equal(shared.body.includes('backdrop-filter'), false, 'card hook must not own material')
})

test('Foundation materials are mounted through one regular surface and one shared content-bearing profile', () => {
  assert.match(foundationCss, /\.ui-liquid-glass\[data-material='clear'\]/)
  assert.match(foundationCss, /\.ui-liquid-glass\s*\{[\s\S]*var\(--ui-glass-regular-/)
  assert.match(appSrc, /global-panel-\$\{id\}[\s\S]*content-bearing-glass/)
  assert.match(foundationCss, /\.ui-liquid-glass\.content-bearing-glass\s*\{[\s\S]*var\(--ui-glass-canonical-background\)/)
  assert.doesNotMatch(appSrc, /data-material="clear"/)
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
    if (/card|sidebar/.test(rule.selector) && !rule.selector.includes('::') && rule.selector !== '.glass-l1, .sidebar' && !rule.selector.includes('.card.glass-l1') && !rule.selector.includes('reduced-transparency') && !rule.selector.includes('prefers-reduced-transparency')) {
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

test('glass tokens are runtime aliases owned by FOUNDATION_TOKENS', () => {
  const aliases = buildLegacyAliases(resolveFoundationTokens({ appearance: 'light' }))
  assert.equal(aliases['--glass-bg'], 'var(--ui-glass-regular-background)')
  assert.equal(aliases['--glass-blur'], 'var(--ui-glass-regular-blur)')
  assert.equal(/--glass-(?:bg|blur|border|shadow)\s*:\s*(?:#|rgba|linear-gradient|[0-9])/i.test(css), false)
  assert.match(foundationCss, /background: var\(--ui-glass-background\)/)
  assert.match(foundationCss, /backdrop-filter: blur\(var\(--ui-glass-blur\)/)
  assert.match(appSrc, /CanonicalGlassSurface as="aside" layoutId="sidebar" className="sidebar"/)
  assert.match(appSrc, /CanonicalGlassSurface className="global-utility-bar"/)
  assert.match(appSrc, /content-bearing-glass/)
  assert.ok(foundationSrc.includes('--glass-highlight'))
  assert.ok(foundationSrc.includes('--glass-edge-lensing'))
})

test('formal surfaces do not split into component-local material hierarchies', () => {
  const shared = findRule('.card, .glass')
  assert.ok(shared)
  assert.equal(/\bbackground\s*:/.test(shared.body), false)
  assert.equal(shared.body.includes('backdrop-filter'), false)
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /\.glass-l1|\.glass-float/)
  assert.match(foundationCss, /content-bearing-glass/)
  assert.doesNotMatch(appSrc, /global-panel-\$\{id\}[^\n]*ui-liquid-glass[^\n]*ui-liquid-glass/)
})

test('edge/specular/reflection construction tokens exist in both theme scopes', () => {
  for (const token of ['--glass-specular', '--glass-reflection', '--glass-spill', '--glass-rim-light', '--glass-rim-shade', '--glass-edge-top', '--glass-edge-side', '--glass-edge-bottom', '--glass-edge-lensing', '--glass-edge-softening', '--glass-clear-rim-light']) {
    assert.ok(foundationSrc.includes(token), `${token} alias must exist`)
  }
  const dark = resolveFoundationTokens({ appearance: 'dark' }).glass.regular
  assert.ok(dark.specular)
  assert.ok(dark.rimShade)
  assert.ok(dark.rimLight)
})

test('shared content rows do not receive independent backdrop-filter (glass only at surface boundaries)', () => {
  for (const selector of ['.list-row', '.nav-item', '.chip', '.btn', '.field']) {
    const rule = findRule(selector)
    assert.ok(rule, `${selector} rule must exist`)
    assert.equal(rule.body.includes('backdrop-filter'), false, `${selector} must not carry its own backdrop-filter`)
  }
})

test('segmented control stays a semantic control without nested Glass', () => {
  const group = findRule('.segmented')
  assert.ok(group)
  assert.equal(group.body.includes('background'), false)
  assert.equal(group.body.includes('backdrop-filter'), false)
  assert.doesNotMatch(readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8'), /className="segmented ui-liquid-glass"/)
  const active = findRule('.segmented button.active')
  assert.ok(active)
  assert.ok(active.body.includes('var(--ui-interaction-selection-background)'))
  assert.equal(active.body.includes('var(--glass-clear-specular)'), false)
})

test('no WebGL / canvas material renderer is introduced', () => {
  const rendererSources = [
    tokensSrc,
    readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8'),
  ].join('\n')
  assert.equal(/webgl/i.test(rendererSources), false)
  assert.equal(/getContext\(/i.test(rendererSources), false)
  assert.equal(/<canvas/i.test(rendererSources), false)
})

test('reduced-motion and reduced-transparency safety blocks exist', () => {
  assert.ok(css.includes('prefers-reduced-motion'), 'reduced-motion media query must exist')
  assert.ok(css.includes('prefers-reduced-transparency'), 'reduced-transparency fallback must exist')
})

test('DOM writer targets documentElement (root scope inherited by all surfaces)', () => {
  assert.ok(tokensSrc.includes('document.documentElement'))
  for (const key of [
    '--ui-glass-regular-background', '--ui-glass-regular-blur', '--ui-glass-regular-shadow',
    '--ui-glass-clear-background', '--ui-glass-clear-blur', '--ui-glass-clear-shadow',
    '--ui-glass-content-background', '--ui-glass-content-border', '--ui-glass-content-shadow',
  ]) {
    assert.ok(tokensSrc.includes(`'${key}'`), `applyGlassTokens must write ${key}`)
  }
})

test('coherent concentric radius system exists', () => {
  for (const token of ['--radius-window', '--radius-glass-large', '--radius-glass-medium', '--radius-control', '--radius-capsule']) {
    assert.ok(foundationSrc.includes(token), `${token} alias must exist`)
  }
  const card = findRule('.card, .glass')
  assert.ok(card.body.includes('var(--ui-radius-surface-md)'), 'card hook uses the foundation surface radius')
  assert.match(foundationCss, /\.ui-liquid-glass\.sidebar,[\s\S]*border-radius: var\(--ui-radius-floating\)/)
})

test('real renderer accessibility and Content First boundary are wired', () => {
  assert.match(css, /html\[data-reduced-transparency='true'\][\s\S]*\.sidebar[\s\S]*backdrop-filter: none;/)
  assert.match(css, /html\[data-reduced-transparency='true'\][\s\S]*-webkit-backdrop-filter: none;/)
  assert.match(css, /html\[data-reduced-motion='true'\]/)
  assert.match(css, /\.btn-primary\[data-state='selected'\]/)
  assert.match(css, /\.btn-destructive\[data-state='selected'\]/)
  assert.doesNotMatch(css, /prefers-contrast|data-increased-contrast/)
  assert.equal(appSrc.includes('card glass-l1 proposal-card'), false, 'proposal content is not a glass surface')
  assert.match(appSrc, /CanonicalGlassSurface className="card proposal-card/)
  assert.equal(findRule('.card, .glass').body.includes('backdrop-filter'), false)
})

test('pending proposal empty state uses the shared proposal glass surface', () => {
  const pendingSection = appSrc.match(/projectDetail\.pendingProposals[\s\S]*?<\/Section>/)
  assert.ok(pendingSection, 'Project Detail must render the pending proposal section')
  assert.match(pendingSection[0], /CanonicalGlassSurface className="card proposal-card proposal-empty-card page-glass-surface"/)
  assert.match(pendingSection[0], /proposal-empty-state/)
  assert.doesNotMatch(pendingSection[0], /<Empty text=\{t\('projectDetail\.noPendingProposals'\)\} \/>/)

  const proposalRule = findRule('.proposal-card')
  assert.ok(proposalRule, 'proposal module layout rule must exist')
  assert.doesNotMatch(proposalRule.body, /background|border|box-shadow|backdrop-filter/)
})

test('clear vs tinted resolve to the same canonical application material', () => {
  const clear = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  const tinted = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'tinted' })
  assert.equal(clear.glassBlur, tinted.glassBlur)
  assert.equal(clear.glassBg, tinted.glassBg)
  assert.equal(clear.glassBorder, tinted.glassBorder)

  // Legacy continuous fields remain irrelevant to the engine.
  assert.deepEqual(
    computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear', material: 'frosted', frostIntensity: 50, transparencyLevel: 50 }),
    computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' }),
  )
})
