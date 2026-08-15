import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { computeGlassTokens } from '../apps/desktop/renderer/src/glass-tokens.mjs'

function tokens(frostIntensity, transparencyLevel) {
  return computeGlassTokens({ frostIntensity, transparencyLevel })
}

test('no material-mode selection is required to compute glass tokens', () => {
  const t = tokens(60, 40)
  assert.equal(typeof t.glassBg, 'string')
  assert.equal(typeof t.glassBlur, 'string')
  assert.equal(typeof t.glassBorder, 'string')
  assert.equal(typeof t.glassSaturation, 'string')
  assert.equal(typeof t.glassShadow, 'string')
  assert.equal(typeof t.glassHighlight, 'string')
  assert.ok(Number.isFinite(t.blurPx) && Number.isFinite(t.alpha))
})

test('frostIntensity 0 vs 100 changes global blur significantly', () => {
  assert.equal(tokens(0, 40).blurPx, 0)
  assert.equal(tokens(100, 40).blurPx, 32)
  assert.notEqual(tokens(0, 40).glassBlur, tokens(100, 40).glassBlur)
})

test('transparencyLevel 0 vs 100 changes global alpha significantly', () => {
  assert.equal(tokens(60, 0).alpha, 0.78)
  assert.equal(tokens(60, 100).alpha, 0.07)
  assert.notEqual(tokens(60, 0).glassBg, tokens(60, 100).glassBg)
})

test('transparency range targets: 0 dense, 100 almost clear but never zero', () => {
  assert.ok(tokens(60, 0).alpha >= 0.75, 'transparency 0 must stay dense (alpha >= ~0.75)')
  const open = tokens(60, 100).alpha
  assert.ok(open <= 0.08, `transparency 100 must be almost clear (alpha <= ~0.08), got ${open}`)
  assert.ok(open > 0, 'alpha must never reach exactly 0')
})

test('transparency 90 is substantially clearer than transparency 70', () => {
  const at70 = tokens(60, 70).alpha
  const at90 = tokens(60, 90).alpha
  assert.ok(at70 - at90 >= 0.1, `alpha(70)=${at70} must be >= 0.1 above alpha(90)=${at90}`)
  assert.equal(at70, 0.349)
  assert.equal(at90, 0.167)
})

test('transparency response is monotonic across the whole range', () => {
  let previous = Infinity
  for (let v = 0; v <= 100; v += 5) {
    const alpha = tokens(60, v).alpha
    assert.ok(alpha < previous, `alpha must strictly decrease as transparency rises (v=${v})`)
    previous = alpha
  }
})

test('both parameters change simultaneously (combined Liquid Glass states)', () => {
  // frost 10 / transparency 90 → clear, transparent glass
  const clear = tokens(10, 90)
  assert.equal(clear.blurPx, 3.2)
  assert.equal(clear.alpha, 0.167)

  // frost 85 / transparency 25 → dense, heavily diffused glass
  const dense = tokens(85, 25)
  assert.equal(dense.blurPx, 27.2)
  assert.equal(dense.alpha, 0.678)

  // frost 55 / transparency 65 → balanced Liquid Glass
  const balanced = tokens(55, 65)
  assert.equal(balanced.blurPx, 17.6)
  assert.equal(balanced.alpha, 0.392)

  // All three states are visually distinct from each other.
  assert.notEqual(clear.glassBlur, dense.glassBlur)
  assert.notEqual(clear.glassBg, dense.glassBg)
})

test('high transparency never dims content: no element-opacity token is produced', () => {
  const t = tokens(60, 100)
  assert.equal('opacity' in t, false)
  assert.equal('glassOpacity' in t, false)
  assert.ok(t.alpha > 0, 'the fill stays materially present (border/highlight/shadow carry the edge)')
  // Shadow lightens at high transparency but never disappears.
  assert.ok(tokens(60, 0).glassShadow !== tokens(60, 100).glassShadow)
  assert.ok(tokens(60, 100).glassShadow.includes('rgba(0, 0, 0, 0.02'))
})

test('changing frost does not overwrite transparency', () => {
  const a = tokens(0, 55)
  const b = tokens(100, 55)
  assert.equal(a.alpha, b.alpha)
  assert.equal(a.glassBg, b.glassBg)
})

test('changing transparency does not overwrite frost', () => {
  const a = tokens(42, 0)
  const b = tokens(42, 100)
  assert.equal(a.blurPx, b.blurPx)
  assert.equal(a.glassBlur, b.glassBlur)
})

test('restored persisted settings recreate identical global tokens', () => {
  const persisted = { frostIntensity: 42, transparencyLevel: 77, theme: 'light' }
  const first = computeGlassTokens(persisted)
  const second = computeGlassTokens({ ...persisted })
  assert.deepEqual(first, second)
})

test('obsolete material field (frosted/transparent) has zero effect on tokens', () => {
  const plain = tokens(60, 40)
  assert.deepEqual(computeGlassTokens({ material: 'frosted', frostIntensity: 60, transparencyLevel: 40 }), plain)
  assert.deepEqual(computeGlassTokens({ material: 'transparent', frostIntensity: 60, transparencyLevel: 40 }), plain)
})

test('Settings UI no longer exposes the 磨砂/通透 material selector', () => {
  const src = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')
  assert.equal(src.includes('settings.glassMaterial'), false)
  assert.equal(src.includes('settings.frosted'), false)
  assert.equal(src.includes('settings.transparent'), false)
  assert.equal(src.includes('className="segmented"'), false)
  assert.equal(src.includes("material: 'frosted'"), false)
  assert.equal(src.includes("material: 'transparent'"), false)
})

test('token values stay within safe clamped ranges for all slider positions', () => {
  for (const value of [0, 1, 25, 50, 99, 100]) {
    const t = tokens(value, value)
    assert.ok(t.blurPx >= 0 && t.blurPx <= 32, `blur ${t.blurPx}`)
    assert.ok(t.alpha >= 0.07 && t.alpha <= 0.78, `alpha ${t.alpha}`)
    assert.ok(t.alpha > 0, 'alpha must never reach zero')
    assert.ok(Number.isFinite(t.alpha) && Number.isFinite(t.blurPx))
  }
  const clamped = tokens(-5, 150)
  assert.equal(clamped.blurPx, 0)
  assert.equal(clamped.alpha, 0.07)
  assert.ok(Number.isFinite(clamped.blurPx) && Number.isFinite(clamped.alpha))
})

test('token output is CSS-ready and the mapping is renderer-only (no backend contract)', () => {
  const t = tokens(60, 40)
  assert.match(t.glassBg, /^rgba\(255, 255, 255, 0\.\d{3}\)$/)
  assert.match(t.glassBlur, /^\d+(\.\d+)?px$/)
  assert.match(t.glassBorder, /^1px solid rgba\(0, 0, 0, 0\.\d{3}\)$/)
  assert.match(t.glassSaturation, /^\d\.\d{2}$/)
  assert.match(t.glassHighlight, /^rgba\(255, 255, 255, 0\.\d{3}\)$/)
  assert.ok(t.glassShadow.includes('inset 0 1px 0'), 'glass has a subtle inner edge highlight')
})
