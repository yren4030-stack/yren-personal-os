import test from 'node:test'
import assert from 'node:assert/strict'

import { computeGlassTokens, resolveLiquidGlass, LIQUID_GLASS_STYLES } from '../apps/desktop/renderer/src/glass-tokens.mjs'

function tokens(theme, liquidGlass) {
  return computeGlassTokens({ theme, liquidGlassStyle: liquidGlass })
}

test('clear profile exists (coordinated optical stack, light)', () => {
  const t = tokens('light', 'clear')
  assert.equal(t.glassBg, 'rgba(255, 255, 255, 0.192)')
  assert.equal(t.blurPx, 14.7)
  assert.ok(t.glassBlur.endsWith('px'))
  assert.match(t.glassBorder, /^1px solid rgba\(0, 0, 0, 0\.120\)$/)
  assert.ok(t.glassSpecular.startsWith('linear-gradient(135deg,'), 'clear profile carries a specular layer')
  assert.ok(t.glassReflection.startsWith('linear-gradient(180deg,'), 'clear profile carries an internal reflection')
  assert.ok(t.glassRim.startsWith('rgba('), 'clear profile carries a refractive rim')
})

test('tinted profile exists (coordinated optical stack, light)', () => {
  const t = tokens('light', 'tinted')
  assert.equal(t.glassBg, 'rgba(255, 255, 255, 0.480)')
  assert.equal(t.blurPx, 27.3)
  assert.match(t.glassBorder, /^1px solid rgba\(0, 0, 0, 0\.160\)$/)
})

test('clear and tinted are coordinated profiles, not alpha-only differences', () => {
  const clear = tokens('light', 'clear')
  const tinted = tokens('light', 'tinted')
  // Several optical axes move together: transmission, scattering, edge,
  // specular, shadow — never alpha alone.
  assert.notEqual(clear.glassBg, tinted.glassBg)
  assert.notEqual(clear.glassBlur, tinted.glassBlur)
  assert.notEqual(clear.glassBorder, tinted.glassBorder)
  assert.notEqual(clear.glassShadow, tinted.glassShadow)
  assert.notEqual(clear.glassSpecular, tinted.glassSpecular)
  assert.ok(clear.alpha < tinted.alpha, 'clear transmits more than tinted')
  assert.ok(clear.blurPx < tinted.blurPx, 'tinted scatters more than clear')
  assert.ok(clear.glassShadow.length > 0 && tinted.glassShadow.length > 0)
})

test('light + clear and light + tinted produce valid tokens', () => {
  for (const style of [LIQUID_GLASS_STYLES.CLEAR, LIQUID_GLASS_STYLES.TINTED]) {
    const t = tokens('light', style)
    assert.match(t.glassBg, /^rgba\(255, 255, 255, 0\.\d{3}\)$/)
    assert.ok(Number.isFinite(t.alpha) && Number.isFinite(t.blurPx))
    assert.ok(t.alpha > 0 && t.alpha < 1)
  }
})

test('dark + clear and dark + tinted use smoked graphite glass', () => {
  const clear = tokens('dark', 'clear')
  const tinted = tokens('dark', 'tinted')
  assert.match(clear.glassBg, /^rgba\(34, 36, 42, /, 'dark clear uses graphite fill')
  assert.match(tinted.glassBg, /^rgba\(34, 36, 42, /, 'dark tinted uses graphite fill')
  assert.match(clear.glassBorder, /^1px solid rgba\(255, 255, 255, /, 'dark glass keeps a brighter perimeter border')
  assert.ok(tinted.alpha > clear.alpha, 'dark tinted is more substantial than dark clear')
  assert.notEqual(clear.glassBg, tinted.glassBg)
})

test('content surfaces use a quieter material than functional glass (no full Liquid Glass on cards)', () => {
  const t = tokens('light', 'clear')
  assert.ok(t.contentFillAlpha < t.functionalFillAlpha, 'content fill is quieter')
  assert.ok(t.glassBgContent !== t.glassBg, 'content and functional fills differ')
  assert.ok(t.glassBlurContent !== t.glassBlur, 'content scattering is lower')
})

test('floating surfaces are clearer/thinner than functional glass (size-adaptive)', () => {
  const t = tokens('light', 'clear')
  assert.ok(t.floatingFillAlpha < t.functionalFillAlpha, 'floating fill is thinner')
  assert.ok(t.glassBgFloat !== t.glassBg)
  assert.ok(t.glassBlurFloat !== t.glassBlur)
})

test('legacy material/frost/transparency fields no longer drive the UI', () => {
  const base = tokens('light', 'clear')
  const legacy = computeGlassTokens({
    theme: 'light',
    liquidGlassStyle: 'clear',
    material: 'transparent',
    frostIntensity: 100,
    transparencyLevel: 0,
  })
  assert.deepEqual(legacy, base, 'legacy continuous fields must be ignored')
})

test('resolveLiquidGlass applies semantic role multipliers', () => {
  const panel = resolveLiquidGlass({ appearance: 'light', liquidGlass: 'clear', surfaceRole: 'panel' })
  const content = resolveLiquidGlass({ appearance: 'light', liquidGlass: 'clear', surfaceRole: 'content' })
  const floating = resolveLiquidGlass({ appearance: 'light', liquidGlass: 'clear', surfaceRole: 'floating' })
  assert.equal(panel.fillAlpha, 0.2)
  assert.equal(content.fillAlpha, 0.184)
  assert.equal(floating.fillAlpha, 0.16)
  assert.ok(floating.borderAlpha > panel.borderAlpha, 'floating edges are sharper')
  assert.ok(content.blurPx < panel.blurPx, 'content scatters less')
})

test('values stay finite and clamped for invalid inputs', () => {
  const badStyle = computeGlassTokens({ theme: 'neon', liquidGlassStyle: 'holographic' })
  const clear = tokens('light', 'clear')
  assert.deepEqual(badStyle, clear, 'unknown style/theme falls back to clear + light')
  const t = tokens('dark', 'tinted')
  assert.ok(Number.isFinite(t.alpha) && Number.isFinite(t.blurPx))
  assert.ok(t.alpha > 0 && t.alpha < 1)
  assert.ok(t.blurPx > 0 && t.blurPx <= 40)
})
