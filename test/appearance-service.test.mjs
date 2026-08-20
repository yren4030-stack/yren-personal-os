/**
 * Appearance backward compatibility: the legacy fields (material /
 * frostIntensity / transparencyLevel) remain persisted but the final
 * user-facing model is theme + liquidGlassStyle ('clear' | 'tinted').
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { APPEARANCE_PRESETS, AppearanceService, DEFAULT_APPEARANCE, DEFAULT_UI_CONTAINER_SIZES, DEFAULT_UI_LAYOUT_PRESETS, DEFAULT_UI_SCALE_PROFILE, UI_SCALE_RANGE } from '../src/application/appearance-service.mjs'
import { normalizeAppearancePatch } from '../src/application/desktop-api.mjs'

function memoryStorage(initial = null) {
  let state = initial
  return { load: () => state, save: (x) => { state = x } }
}

test('DEFAULT_APPEARANCE carries the new optical profile with legacy fields intact', () => {
  assert.equal(DEFAULT_APPEARANCE.liquidGlassStyle, 'clear')
  assert.equal(DEFAULT_APPEARANCE.theme, 'light')
  assert.equal(DEFAULT_APPEARANCE.glassStrength, 30)
  assert.equal(DEFAULT_APPEARANCE.appearancePreset, APPEARANCE_PRESETS.default)
  assert.deepEqual(DEFAULT_APPEARANCE.customAppearance, { glassStrength: 30, uiScaleProfile: DEFAULT_UI_SCALE_PROFILE, uiContainerSizes: DEFAULT_UI_CONTAINER_SIZES })
  assert.equal(DEFAULT_APPEARANCE.uiScale, UI_SCALE_RANGE.default)
  assert.deepEqual(DEFAULT_APPEARANCE.uiScaleProfile, DEFAULT_UI_SCALE_PROFILE)
  assert.deepEqual(DEFAULT_APPEARANCE.uiContainerSizes, DEFAULT_UI_CONTAINER_SIZES)
  assert.deepEqual(DEFAULT_APPEARANCE.uiLayoutPresets, DEFAULT_UI_LAYOUT_PRESETS)
  assert.deepEqual(DEFAULT_APPEARANCE.desktopBackground, { kind: 'default' })
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

test('glassStrength is clamped, defaults to 30, and persists through Appearance', () => {
  const low = new AppearanceService(memoryStorage({ glassStrength: -20 }))
  assert.equal(low.get().glassStrength, 0)
  const high = new AppearanceService(memoryStorage({ glassStrength: 120 }))
  assert.equal(high.get().glassStrength, 100)
  const storage = memoryStorage()
  const service = new AppearanceService(storage)
  assert.equal(service.get().glassStrength, 30)
  assert.equal(service.get().appearancePreset, 'default')
  assert.equal(service.update({ glassStrength: 85 }).glassStrength, 85)
  assert.equal(service.get().appearancePreset, 'custom')
  assert.equal(storage.load().glassStrength, 85)
})

test('appearance presets persist default and custom values as one user choice', () => {
  const storage = memoryStorage()
  const service = new AppearanceService(storage)
  const profile = { typography: 115 }
  service.update({ appearancePreset: 'custom', glassStrength: 72, uiScaleProfile: profile })
  assert.deepEqual(service.get(), { ...DEFAULT_APPEARANCE, appearancePreset: 'custom', glassStrength: 72, uiScale: 115, uiScaleProfile: profile, customAppearance: { glassStrength: 72, uiScaleProfile: profile, uiContainerSizes: {} } })
  service.update({ appearancePreset: 'default', glassStrength: 30, uiScaleProfile: DEFAULT_UI_SCALE_PROFILE })
  assert.equal(service.get().appearancePreset, 'default')
  assert.equal(service.get().glassStrength, 30)
  assert.equal(service.get().uiScale, 100)
  assert.deepEqual(service.get().customAppearance, { glassStrength: 72, uiScaleProfile: profile, uiContainerSizes: {} })
  service.update({ appearancePreset: 'custom', glassStrength: 72, uiScaleProfile: service.get().customAppearance.uiScaleProfile })
  assert.equal(service.get().glassStrength, 72)
  assert.equal(service.get().uiScaleProfile.typography, 115)
  assert.equal('width' in service.get().uiScaleProfile, false)
})

test('typography scale stays within the 85-125 Foundation range', () => {
  const profile = { typography: 115 }
  const service = new AppearanceService(memoryStorage())
  assert.deepEqual(service.update({ uiScaleProfile: profile }).uiScaleProfile, profile)
  assert.equal(service.update({ uiScaleProfile: { ...profile, typography: 140 } }).uiScaleProfile.typography, 125)
})

test('named layout presets persist complete UI customization without changing business data', () => {
  const storage = memoryStorage()
  const service = new AppearanceService(storage)
  const profile = { typography: 110 }
  const sizes = { sidebar: { width: 280, height: 900 }, 'home-stat-projects': { width: 320 } }
  const preset = { id: 'layout-reading', name: '阅读布局', glassStrength: 42, liquidGlassStyle: 'clear', uiScaleProfile: profile, uiContainerSizes: sizes }
  const saved = service.update({ uiLayoutPresets: [preset], uiLayoutPresetId: preset.id, glassStrength: 42, uiScaleProfile: profile, uiContainerSizes: sizes })
  assert.equal(saved.uiLayoutPresetId, 'layout-reading')
  assert.equal(saved.uiLayoutPresets[0].name, '阅读布局')
  assert.deepEqual(saved.uiContainerSizes, sizes)
  const reloaded = new AppearanceService(memoryStorage(storage.load()))
  assert.equal(reloaded.get().uiLayoutPresetId, 'layout-reading')
  assert.deepEqual(reloaded.get().uiLayoutPresets[0].uiContainerSizes, sizes)
})

test('uiScale is bounded, defaults safely, and persists through Appearance', () => {
  const low = new AppearanceService(memoryStorage({ uiScale: 40 }))
  const high = new AppearanceService(memoryStorage({ uiScale: 160 }))
  const invalid = new AppearanceService(memoryStorage({ uiScale: 'invalid' }))
  assert.equal(low.get().uiScale, UI_SCALE_RANGE.min)
  assert.equal(high.get().uiScale, UI_SCALE_RANGE.max)
  assert.equal(invalid.get().uiScale, UI_SCALE_RANGE.default)

  const storage = memoryStorage()
  const service = new AppearanceService(storage)
  assert.equal(service.update({ uiScale: 85 }).uiScale, 85)
  assert.equal(storage.load().uiScale, 85)
  assert.equal(service.update({ uiScale: 125 }).uiScale, 125)
})

test('desktop background accepts only the normalized managed shape and resets safely', () => {
  const custom = new AppearanceService(memoryStorage({
    desktopBackground: { kind: 'custom', assetId: 'desktop-background-test', url: 'yren-appearance://appearance/desktop-background-test.png' },
  }))
  assert.deepEqual(custom.get().desktopBackground, { kind: 'custom', assetId: 'desktop-background-test', url: 'yren-appearance://appearance/desktop-background-test.png' })

  const unsafe = new AppearanceService(memoryStorage({
    desktopBackground: { kind: 'custom', assetId: '../outside', url: 'file:///outside.png' },
  }))
  assert.deepEqual(unsafe.get().desktopBackground, { kind: 'default' })

  const storage = memoryStorage()
  const service = new AppearanceService(storage)
  service.update({ desktopBackground: { kind: 'custom', assetId: 'managed-1', url: 'file:///managed/managed-1.webp' } })
  assert.equal(service.get().desktopBackground.kind, 'custom')
  assert.deepEqual(service.update({ desktopBackground: { kind: 'default' } }).desktopBackground, { kind: 'default' })
  assert.deepEqual(storage.load().desktopBackground, { kind: 'default' })
})

test('normalizeAppearancePatch accepts the new field and keeps legacy fields working', () => {
  assert.deepEqual(normalizeAppearancePatch({ liquidGlassStyle: 'tinted' }), { ok: true, patch: { liquidGlassStyle: 'tinted' } })
  assert.deepEqual(normalizeAppearancePatch({ liquidGlassStyle: 'clear' }), { ok: true, patch: { liquidGlassStyle: 'clear' } })
  assert.equal(normalizeAppearancePatch({ liquidGlassStyle: 'neon' }).ok, false)
  assert.deepEqual(normalizeAppearancePatch({ theme: 'dark', frostIntensity: 42 }), { ok: true, patch: { theme: 'dark', frostIntensity: 42 } })
  assert.deepEqual(normalizeAppearancePatch({ glassStrength: 85 }), { ok: true, patch: { glassStrength: 85 } })
  assert.deepEqual(normalizeAppearancePatch({ uiScale: 85 }), { ok: true, patch: { uiScale: 85 } })
  assert.deepEqual(normalizeAppearancePatch({ uiScaleProfile: { mode: 'separate', unified: 100, typography: 115, width: 95, height: 105, verticalSpacing: 90, horizontalSpacing: 120 } }), { ok: true, patch: { uiScaleProfile: { typography: 115 } } })
  assert.deepEqual(normalizeAppearancePatch({ uiContainerSizes: { sidebar: { width: 280, height: 900 } } }), { ok: true, patch: { uiContainerSizes: { sidebar: { width: 280, height: 900 } } } })
  assert.equal(normalizeAppearancePatch({ uiLayoutPresetId: 'layout-reading' }).ok, true)
  assert.deepEqual(normalizeAppearancePatch({ appearancePreset: 'custom' }), { ok: true, patch: { appearancePreset: 'custom' } })
  assert.equal(normalizeAppearancePatch({ appearancePreset: 'other' }).ok, false)
  assert.equal(normalizeAppearancePatch({ uiScale: 84 }).patch.uiScale, 85)
  assert.equal(normalizeAppearancePatch({ uiScale: 126 }).patch.uiScale, 125)
  assert.deepEqual(normalizeAppearancePatch({ desktopBackground: { kind: 'default' } }), { ok: true, patch: { desktopBackground: { kind: 'default' } } })
  assert.equal(normalizeAppearancePatch({ desktopBackground: { kind: 'custom', assetId: 'managed', url: 'file:///managed.png' } }).ok, false)
  assert.equal(normalizeAppearancePatch({ glassStrength: 101 }).patch.glassStrength, 100)
  assert.equal(normalizeAppearancePatch({ unexpected: 1 }).ok, false)
})
