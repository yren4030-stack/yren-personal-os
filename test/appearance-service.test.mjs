/**
 * Appearance backward compatibility: the legacy fields (material /
 * frostIntensity / transparencyLevel) remain persisted but the final
 * user-facing model is theme + liquidGlassStyle ('clear' | 'tinted').
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { AppearanceService, DEFAULT_APPEARANCE } from '../src/application/appearance-service.mjs'
import { normalizeAppearancePatch } from '../src/application/desktop-api.mjs'

function memoryStorage(initial = null) {
  let state = initial
  return { load: () => state, save: (x) => { state = x } }
}

test('DEFAULT_APPEARANCE carries the new optical profile with legacy fields intact', () => {
  assert.equal(DEFAULT_APPEARANCE.liquidGlassStyle, 'clear')
  assert.equal(DEFAULT_APPEARANCE.theme, 'light')
  assert.equal(DEFAULT_APPEARANCE.glassStrength, 60)
  assert.ok('frostIntensity' in DEFAULT_APPEARANCE)
  assert.ok('transparencyLevel' in DEFAULT_APPEARANCE)
  assert.ok('material' in DEFAULT_APPEARANCE)
})

test('legacy stored state without liquidGlassStyle maps to clear by default', () => {
  const legacy = { material: 'frosted', frostIntensity: 60, transparencyLevel: 40, theme: 'light' }
  const service = new AppearanceService(memoryStorage(legacy))
  assert.equal(service.get().liquidGlassStyle, 'clear')
})

test('legacy stored state that previously preferred opacity maps to tinted', () => {
  const legacyOpaque = { material: 'frosted', frostIntensity: 60, transparencyLevel: 15, theme: 'light' }
  const service = new AppearanceService(memoryStorage(legacyOpaque))
  assert.equal(service.get().liquidGlassStyle, 'tinted')
})

test('stored liquidGlassStyle is preserved on load; invalid values fall back to clear', () => {
  const tinted = new AppearanceService(memoryStorage({ liquidGlassStyle: 'tinted', theme: 'dark' }))
  assert.equal(tinted.get().liquidGlassStyle, 'tinted')
  assert.equal(tinted.get().theme, 'dark')
  const clear = new AppearanceService(memoryStorage({ liquidGlassStyle: 'clear' }))
  assert.equal(clear.get().liquidGlassStyle, 'clear')
  const bogus = new AppearanceService(memoryStorage({ liquidGlassStyle: 'holographic' }))
  assert.equal(bogus.get().liquidGlassStyle, 'clear')
})

test('update persists liquidGlassStyle through the existing path', () => {
  const storage = memoryStorage()
  const service = new AppearanceService(storage)
  const updated = service.update({ liquidGlassStyle: 'tinted' })
  assert.equal(updated.liquidGlassStyle, 'tinted')
  assert.equal(storage.load().liquidGlassStyle, 'tinted')
  assert.equal(service.get().liquidGlassStyle, 'tinted')
})

test('glassStrength is clamped, defaults to 60, and persists through Appearance', () => {
  const low = new AppearanceService(memoryStorage({ glassStrength: -20 }))
  assert.equal(low.get().glassStrength, 0)
  const high = new AppearanceService(memoryStorage({ glassStrength: 120 }))
  assert.equal(high.get().glassStrength, 100)
  const storage = memoryStorage()
  const service = new AppearanceService(storage)
  assert.equal(service.update({ glassStrength: 85 }).glassStrength, 85)
  assert.equal(storage.load().glassStrength, 85)
})

test('normalizeAppearancePatch accepts the new field and keeps legacy fields working', () => {
  assert.deepEqual(normalizeAppearancePatch({ liquidGlassStyle: 'tinted' }), { ok: true, patch: { liquidGlassStyle: 'tinted' } })
  assert.deepEqual(normalizeAppearancePatch({ liquidGlassStyle: 'clear' }), { ok: true, patch: { liquidGlassStyle: 'clear' } })
  assert.equal(normalizeAppearancePatch({ liquidGlassStyle: 'neon' }).ok, false)
  assert.deepEqual(normalizeAppearancePatch({ theme: 'dark', frostIntensity: 42 }), { ok: true, patch: { theme: 'dark', frostIntensity: 42 } })
  assert.deepEqual(normalizeAppearancePatch({ glassStrength: 85 }), { ok: true, patch: { glassStrength: 85 } })
  assert.equal(normalizeAppearancePatch({ glassStrength: 101 }).patch.glassStrength, 100)
  assert.equal(normalizeAppearancePatch({ unexpected: 1 }).ok, false)
})
