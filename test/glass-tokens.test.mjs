import test from 'node:test'
import assert from 'node:assert/strict'

import { computeGlassTokens } from '../apps/desktop/renderer/src/glass-tokens.mjs'

function tokens(material, frostIntensity, transparencyLevel) {
  return computeGlassTokens({ material, frostIntensity, transparencyLevel })
}

test('Frosted 0 and Frosted 100 produce different blur values (host-visible range)', () => {
  const low = tokens('frosted', 0, 40)
  const high = tokens('frosted', 100, 40)
  assert.equal(low.blurPx, 0)
  assert.equal(high.blurPx, 32)
  assert.notEqual(low.glassBlur, high.glassBlur)
})

test('Transparent 0 and Transparent 100 produce materially different background alpha', () => {
  const solid = tokens('transparent', 60, 0)
  const open = tokens('transparent', 60, 100)
  assert.equal(solid.alpha, 0.72)
  assert.equal(open.alpha, 0.2)
  assert.ok(open.alpha < solid.alpha, 'higher transparency level must lower alpha')
  assert.notEqual(solid.glassBg, open.glassBg)
})

test('frostIntensity never overwrites transparencyLevel (alpha is transparency-driven only)', () => {
  const a = tokens('frosted', 0, 55)
  const b = tokens('frosted', 100, 55)
  assert.equal(a.alpha, b.alpha)
  assert.equal(a.glassBg, b.glassBg)
})

test('transparencyLevel never replaces frostIntensity (blur is frost-driven only)', () => {
  const a = tokens('transparent', 42, 0)
  const b = tokens('transparent', 42, 100)
  assert.equal(a.blurPx, b.blurPx)
  assert.equal(a.glassBlur, b.glassBlur)
})

test('appearance returned from persisted storage recreates identical tokens', () => {
  // Shape the AppearanceService returns after load/clamp.
  const persisted = { material: 'transparent', frostIntensity: 42, transparencyLevel: 77, theme: 'light' }
  const first = computeGlassTokens(persisted)
  const second = computeGlassTokens({ ...persisted })
  assert.deepEqual(first, second)
  assert.equal(first.glassBg, second.glassBg)
  assert.equal(first.glassBlur, second.glassBlur)
})

test('token values stay within safe clamped ranges for all slider positions', () => {
  for (const value of [0, 1, 25, 50, 99, 100]) {
    const frosted = tokens('frosted', value, value)
    assert.ok(frosted.blurPx >= 0 && frosted.blurPx <= 32, `frosted blur ${frosted.blurPx}`)
    assert.ok(frosted.alpha >= 0.48 && frosted.alpha <= 0.66, `frosted alpha ${frosted.alpha}`)

    const transparent = tokens('transparent', value, value)
    assert.ok(transparent.blurPx >= 0 && transparent.blurPx <= 14, `transparent blur ${transparent.blurPx}`)
    assert.ok(transparent.alpha >= 0.2 && transparent.alpha <= 0.72, `transparent alpha ${transparent.alpha}`)
    assert.ok(transparent.alpha > 0, 'alpha must never reach zero')
  }

  // Out-of-range persisted values clamp instead of producing NaN/invalid CSS.
  const clamped = tokens('transparent', -5, 150)
  assert.equal(clamped.blurPx, 0)
  assert.equal(clamped.alpha, 0.2)
  assert.ok(Number.isFinite(clamped.blurPx) && Number.isFinite(clamped.alpha))
})

test('token output is CSS-ready and the mapping is renderer-only (no backend contract)', () => {
  const t = tokens('frosted', 60, 40)
  assert.match(t.glassBg, /^rgba\(255, 255, 255, 0\.\d{3}\)$/)
  assert.match(t.glassBlur, /^\d+(\.\d+)?px$/)
  assert.match(t.glassBorder, /^1px solid rgba\(0, 0, 0, 0\.0\d\)$/)
  assert.match(t.glassSaturation, /^1\.\d+$/)
  assert.ok(t.glassShadow.includes('inset'), 'glass has a subtle inner edge highlight')
})
