/**
 * Display-environment geometry proofs (pure, fixture-driven; no monitors
 * required). All values are DEVICE-INDEPENDENT (DIP) — Electron's workArea
 * already converts physical pixels through the Windows scale factor.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  classifyDisplay,
  computeInitialBounds,
  clampBoundsToWorkArea,
  findDisplayForBounds,
  DISPLAY_CLASSES,
} from '../src/infrastructure/desktop/display-environment.mjs'

const workArea = (width, height, x = 0, y = 0) => ({ x, y, width, height })

test('display classification is driven by effective DIP size', () => {
  // 1366-class laptop.
  assert.equal(classifyDisplay({ workAreaWidth: 1366, workAreaHeight: 728, scaleFactor: 1 }), DISPLAY_CLASSES.COMPACT)
  // 1080p @ 100% and @ 125% (DIP 1536×864).
  assert.equal(classifyDisplay({ workAreaWidth: 1920, workAreaHeight: 1040, scaleFactor: 1 }), DISPLAY_CLASSES.STANDARD)
  assert.equal(classifyDisplay({ workAreaWidth: 1536, workAreaHeight: 832, scaleFactor: 1.25 }), DISPLAY_CLASSES.STANDARD)
  // QHD @ 125% (DIP 2048×1152) → large.
  assert.equal(classifyDisplay({ workAreaWidth: 2048, workAreaHeight: 1152, scaleFactor: 1.25 }), DISPLAY_CLASSES.LARGE)
  // 4K @ 150% (DIP 2560×1440) → large; @ 200% (DIP 1920×1080) → standard.
  assert.equal(classifyDisplay({ workAreaWidth: 2560, workAreaHeight: 1440, scaleFactor: 1.5 }), DISPLAY_CLASSES.LARGE)
  assert.equal(classifyDisplay({ workAreaWidth: 1920, workAreaHeight: 1080, scaleFactor: 2 }), DISPLAY_CLASSES.STANDARD)
  // Large DIP work areas → ultra.
  assert.equal(classifyDisplay({ workAreaWidth: 3440, workAreaHeight: 1440, scaleFactor: 1 }), DISPLAY_CLASSES.ULTRA)
})

test('initial bounds never exceed the work area, are centered, and respect minimums', () => {
  const fixtures = [
    { workArea: workArea(1366, 728), min: 760 / 600 },
    { workArea: workArea(1920, 1040) },
    { workArea: workArea(2560, 1400) },
    { workArea: workArea(1536, 832) },
  ]
  for (const { workArea: wa } of fixtures) {
    const bounds = computeInitialBounds({ workArea: wa })
    assert.ok(bounds.width <= wa.width, `width ${bounds.width} <= workArea ${wa.width}`)
    assert.ok(bounds.height <= wa.height, `height ${bounds.height} <= workArea ${wa.height}`)
    assert.ok(bounds.width >= 760, 'minimum width respected where physically possible')
    assert.ok(bounds.x >= wa.x && bounds.x + bounds.width <= wa.x + wa.width, 'x inside work area')
    assert.ok(bounds.y >= wa.y && bounds.y + bounds.height <= wa.y + wa.height, 'y inside work area')
    // Centered within the work area.
    assert.equal(bounds.x - wa.x, Math.round((wa.width - bounds.width) / 2))
    assert.equal(bounds.y - wa.y, Math.round((wa.height - bounds.height) / 2))
  }
})

test('larger effective desktops receive larger useful initial windows', () => {
  const laptop = computeInitialBounds({ workArea: workArea(1366, 728) })
  const hd = computeInitialBounds({ workArea: workArea(1920, 1040) })
  const qhd = computeInitialBounds({ workArea: workArea(2560, 1400) })
  assert.ok(hd.width > laptop.width && hd.height > laptop.height)
  assert.ok(qhd.width > hd.width && qhd.height > hd.height)
})

test('DPI scaling does not trigger raw physical-pixel assumptions', () => {
  // A 4K monitor at 150% reports the same DIP work area as a QHD monitor at
  // 100% → identical geometry. Never "3840 physical pixels == giant UI".
  const at4k150 = computeInitialBounds({ workArea: workArea(2560, 1400) })
  const atQhd100 = computeInitialBounds({ workArea: workArea(2560, 1400) })
  assert.deepEqual(at4k150, atQhd100)
  assert.ok(at4k150.width < 2560, 'window is not edge-to-edge by default')
})

test('small laptop display uses most of the work area without exceeding it', () => {
  const bounds = computeInitialBounds({ workArea: workArea(1366, 728) })
  assert.equal(bounds.width, 1065) // 78% of 1366
  assert.equal(bounds.height, 600) // clamped to minHeight on short work areas
})

test('clampBoundsToWorkArea re-homes off-screen and oversized windows', () => {
  const wa = workArea(1920, 1040, 100, 50)
  // Fully off-screen to the right.
  const offRight = clampBoundsToWorkArea({ x: 5000, y: 5000, width: 1200, height: 800 }, wa)
  assert.ok(offRight.x + offRight.width <= wa.x + wa.width, 'pushed back into work area')
  assert.ok(offRight.y + offRight.height <= wa.y + wa.height)
  // Oversized window shrinks into the work area.
  const oversized = clampBoundsToWorkArea({ x: 0, y: 0, width: 5000, height: 5000 }, wa)
  assert.deepEqual(oversized, { x: wa.x, y: wa.y, width: wa.width, height: wa.height })
})

test('findDisplayForBounds picks the intersecting display and returns null when none', () => {
  const displays = [
    { id: 1, workArea: workArea(1920, 1040) },
    { id: 2, workArea: workArea(1920, 1040, 1920, 0) },
  ]
  const onSecond = findDisplayForBounds(displays, { x: 2500, y: 200, width: 800, height: 600 })
  assert.equal(onSecond.id, 2)
  const nowhere = findDisplayForBounds(displays, { x: 10000, y: 10000, width: 400, height: 400 })
  assert.equal(nowhere, null)
})
