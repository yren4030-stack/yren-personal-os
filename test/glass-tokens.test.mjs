import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { computeGlassTokens, resolveLiquidGlass, LIQUID_GLASS_STYLES, MATERIAL_VARIANTS } from '../apps/desktop/renderer/src/glass-tokens.mjs'
import { FOUNDATION_TOKENS, resolveFoundationTokens } from '../apps/desktop/renderer/src/ui-foundation.mjs'

const source = readFileSync(new URL('../apps/desktop/renderer/src/glass-tokens.mjs', import.meta.url), 'utf8')

test('user liquidGlassStyle remains clear | tinted (Axis 1 preserved)', () => {
  assert.equal(LIQUID_GLASS_STYLES.CLEAR, 'clear')
  assert.equal(LIQUID_GLASS_STYLES.TINTED, 'tinted')
  const clear = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  const tinted = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'tinted' })
  assert.notEqual(clear.glassBg, tinted.glassBg)
})

test('Foundation is the only runtime optical value source', () => {
  assert.match(source, /resolveFoundationTokens/)
  assert.doesNotMatch(source, /const (?:PROFILES|SIZES|ROLES|FILL_RGB|BORDER_RGB)\s*=\s*Object\.freeze/)
  assert.doesNotMatch(source, /glassModel|LIGHT_GLASS|DARK_GLASS/)
  assert.match(source, /--ui-glass-regular-background/)
  assert.equal(FOUNDATION_TOKENS.glass.profiles.regular.clear.fill, 0.14)
})

test('internal material variants exist: regular, clear, content (Axis 2)', () => {
  assert.equal(MATERIAL_VARIANTS.REGULAR, 'regular')
  assert.equal(MATERIAL_VARIANTS.CLEAR, 'clear')
  assert.equal(MATERIAL_VARIANTS.CONTENT, 'content')
  for (const variant of Object.values(MATERIAL_VARIANTS)) {
    const resolved = resolveLiquidGlass({ theme: 'light', userStyle: 'clear', variant })
    assert.ok(Number.isFinite(resolved.fillAlpha) && Number.isFinite(resolved.blurPx))
    assert.ok(resolved.brightness > 0 && resolved.contrast > 0, `${variant} carries luminosity tokens`)
  }
})

test('user style and internal variant are SEPARATE axes', () => {
  // Same user style, different variant → different material.
  const regular = resolveLiquidGlass({ theme: 'light', userStyle: 'clear', variant: 'regular' })
  const clearVariant = resolveLiquidGlass({ theme: 'light', userStyle: 'clear', variant: 'clear' })
  assert.notEqual(regular.fillAlpha, clearVariant.fillAlpha)
  assert.notEqual(regular.blurPx, clearVariant.blurPx)
  assert.ok(regular.edgeLensing.startsWith('radial-gradient('))

  // Same variant, different user style → coordinated change, never alpha only.
  const clearStyle = resolveLiquidGlass({ theme: 'light', userStyle: 'clear', variant: 'regular' })
  const tintedStyle = resolveLiquidGlass({ theme: 'light', userStyle: 'tinted', variant: 'regular' })
  assert.notEqual(clearStyle.fillAlpha, tintedStyle.fillAlpha)
  assert.notEqual(clearStyle.blurPx, tintedStyle.blurPx)
  assert.notEqual(clearStyle.ambientAlpha, tintedStyle.ambientAlpha)
  assert.doesNotMatch(clearStyle.specular, /135deg|160deg/)
  assert.doesNotMatch(tintedStyle.specular, /135deg|160deg/)
})

test('regular vs clear differ across transmission, scattering, luminosity, rim and shadow', () => {
  const regular = resolveLiquidGlass({ theme: 'light', userStyle: 'clear', variant: 'regular' })
  const clearVariant = resolveLiquidGlass({ theme: 'light', userStyle: 'clear', variant: 'clear' })
  assert.ok(regular.fillAlpha > clearVariant.fillAlpha, 'transmission differs (clear transmits more)')
  assert.ok(regular.blurPx > clearVariant.blurPx, 'scattering differs (clear scatters less)')
  assert.notEqual(regular.brightness, clearVariant.brightness, 'luminosity differs')
  assert.ok(regular.rimLightAlpha >= clearVariant.rimLightAlpha, 'perimeter remains bounded by the Foundation')
  assert.notEqual(regular.contactAlpha, clearVariant.contactAlpha, 'contact shadow differs')
  assert.notEqual(regular.ambientAlpha, clearVariant.ambientAlpha, 'ambient shadow differs')
})

test('light REGULAR glass carries the full refractive perimeter stack', () => {
  const t = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  assert.ok(t.glassRimLight.startsWith('rgba('), 'rim light token exists')
  assert.ok(t.glassRimShade.startsWith('rgba(0, 0, 0,'), 'opposite-edge shade exists')
  assert.ok(t.glassSpecular.startsWith('linear-gradient(180deg,'), 'restrained top-edge specular exists')
  assert.equal(t.glassReflection, 'none', 'large reflection wash is disabled')
  assert.equal(t.glassSpill, 'none', 'diagonal environmental spill is disabled')
  assert.ok(t.glassEdgeTop.startsWith('rgba('), 'top edge illumination exists')
  assert.ok(t.glassEdgeSide.startsWith('rgba('), 'side edge cue exists')
  assert.ok(t.glassEdgeBottom.startsWith('rgba('), 'bottom separation exists')
  assert.ok(t.glassEdgeLensing.startsWith('radial-gradient('), 'edge lensing approximation exists')
  assert.ok(t.glassEdgeSoftening.startsWith('rgba('), 'edge softening exists')
  // The composed shadow contains: inner ring, opposite-edge shade, contact
  // shadow and ambient shadow.
  assert.ok(t.glassShadow.includes('inset 0 0 0 1px'), 'inner ring (glass thickness)')
  assert.ok(t.glassShadow.includes('inset 0 -1px 0'), 'opposite-edge shade in shadow')
  assert.ok(t.glassShadow.includes('0 1px 2px'), 'tight contact shadow')
  assert.ok(t.glassShadow.includes('0 18px 50px'), 'large soft ambient shadow')
  // Center stays clear: low white veil.
  assert.ok(t.regularFillAlpha < 0.2, `regular center veil is low (${t.regularFillAlpha})`)
})

test('light CLEAR glass carries its own refractive perimeter', () => {
  const t = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  assert.ok(t.glassClearRimLight.startsWith('rgba('), 'clear rim light exists')
  assert.ok(t.glassClearSpecular.startsWith('linear-gradient(180deg,'), 'clear top-edge specular exists')
  assert.ok(t.glassClearEdgeLensing.startsWith('radial-gradient('), 'clear edge lensing exists')
  assert.ok(t.glassClearShadow.includes('inset 0 0 0 1px'), 'clear inner ring')
  assert.ok(t.clearFillAlpha < t.regularFillAlpha, 'clear transmits more than regular')
})

test('dark regular and dark clear profiles exist (same physical model)', () => {
  const regular = computeGlassTokens({ theme: 'dark', liquidGlassStyle: 'clear' })
  assert.match(regular.glassBg, /^rgba\(38, 38, 40, /, 'dark regular uses graphite fill')
  assert.match(regular.glassBorder, /^1px solid rgba\(255, 255, 255, /, 'dark regular has a brighter rim border')
  assert.ok(regular.glassRimLight.startsWith('rgba(255, 255, 255,'), 'dark rim light is white')
  const clearVariant = resolveLiquidGlass({ theme: 'dark', userStyle: 'clear', variant: 'clear' })
  assert.match(clearVariant.fillRgb, /34, 36, 42/, 'dark clear uses graphite palette')
  assert.ok(regular.blurPx > 0 && clearVariant.blurPx > 0)
})

test('user tinted preference coordinates optical tokens, never alpha alone', () => {
  const clear = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  const tinted = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'tinted' })
  assert.notEqual(clear.glassBg, tinted.glassBg)
  assert.notEqual(clear.glassBlur, tinted.glassBlur, 'scattering changes')
  assert.notEqual(clear.glassBorder, tinted.glassBorder, 'edge changes')
  assert.notEqual(clear.glassShadow, tinted.glassShadow, 'shadow changes')
  assert.doesNotMatch(clear.glassSpecular, /135deg|160deg/)
  assert.doesNotMatch(tinted.glassSpecular, /135deg|160deg/)
})

test('standard content material is quieter than regular glass', () => {
  const t = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  assert.equal(t.glassContentBg, resolveFoundationTokens({ appearance: 'light' }).colors.surface, 'content uses stable surface')
  assert.equal(t.glassContentBlur, '0px', 'content has no blur')
  assert.equal(t.glassContentShadow, 'none', 'content has no glass shadow')
})

test('legacy continuous fields stay irrelevant; invalid inputs fall back safely', () => {
  const base = computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear' })
  assert.deepEqual(
    computeGlassTokens({ theme: 'light', liquidGlassStyle: 'clear', material: 'transparent', frostIntensity: 100, transparencyLevel: 0 }),
    base,
  )
  const bad = computeGlassTokens({ theme: 'neon', liquidGlassStyle: 'holographic' })
  assert.deepEqual(bad, base, 'unknown style/theme falls back to clear + light')
})
