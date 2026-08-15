/**
 * Display-environment model for the Desktop shell (pure, deterministic).
 *
 * All geometry uses Electron's DEVICE-INDEPENDENT work-area rectangles (DIP):
 * Electron's screen module already converts physical pixels through the
 * Windows scale factor, so no raw physical-pixel assumptions are made here.
 * Display classification and window geometry are pure functions of the
 * work-area + scale factor and are unit-tested with fixtures.
 */

export const DISPLAY_CLASSES = Object.freeze({
  COMPACT: 'compact',
  STANDARD: 'standard',
  LARGE: 'large',
  ULTRA: 'ultra',
})

/**
 * Classify an effective desktop work area (DIP) into a semantic class.
 * 1366-class laptops → compact; 1080p → standard; QHD → large; 4K DIP →
 * ultra. The scale factor is accepted for signature completeness;
 * classification is driven by the EFFECTIVE DIP size, never by raw physical
 * pixels.
 */
export function classifyDisplay({ workAreaWidth, workAreaHeight, scaleFactor }) {
  void scaleFactor // classification is DIP-driven by design
  const diagonal = Math.hypot(workAreaWidth, workAreaHeight)
  if (diagonal < 1600) return DISPLAY_CLASSES.COMPACT
  if (diagonal < 2300) return DISPLAY_CLASSES.STANDARD
  if (diagonal < 3200) return DISPLAY_CLASSES.LARGE
  return DISPLAY_CLASSES.ULTRA
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Initial BrowserWindow bounds for a display work area (DIP rectangle with
 * x/y). Fluid work-area ratios with sane limits: never exceeds the work area,
 * never below the minimum size, always centered inside the work area. Larger
 * effective desktops receive larger useful windows; the window is never
 * maximized edge-to-edge by default.
 */
export function computeInitialBounds({ workArea, minWidth = 760, minHeight = 600 }) {
  const width = clamp(Math.round(workArea.width * 0.78), minWidth, workArea.width)
  const height = clamp(Math.round(workArea.height * 0.82), minHeight, workArea.height)
  return {
    x: workArea.x + Math.round((workArea.width - width) / 2),
    y: workArea.y + Math.round((workArea.height - height) / 2),
    width,
    height,
  }
}

/**
 * Clamp arbitrary window bounds so they stay fully inside a work area
 * (off-screen restore / display-removed re-homing). Size is clamped to the
 * work area; position is pushed back so the whole window is visible.
 */
export function clampBoundsToWorkArea(bounds, workArea) {
  const width = Math.min(bounds.width, workArea.width)
  const height = Math.min(bounds.height, workArea.height)
  const x = clamp(bounds.x, workArea.x, workArea.x + workArea.width - width)
  const y = clamp(bounds.y, workArea.y, workArea.y + workArea.height - height)
  return { x, y, width, height }
}

/**
 * Pick the display whose work area has the largest intersection with the
 * window bounds; returns null when the window intersects no display.
 */
export function findDisplayForBounds(displays, bounds) {
  let best = null
  let bestArea = 0
  for (const display of displays) {
    const work = display.workArea
    const overlapX = Math.max(0, Math.min(bounds.x + bounds.width, work.x + work.width) - Math.max(bounds.x, work.x))
    const overlapY = Math.max(0, Math.min(bounds.y + bounds.height, work.y + work.height) - Math.max(bounds.y, work.y))
    const area = overlapX * overlapY
    if (area > bestArea) {
      bestArea = area
      best = display
    }
  }
  return best
}
