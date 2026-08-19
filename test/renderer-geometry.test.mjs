import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../apps/desktop/renderer/src/glass.css', import.meta.url), 'utf8')
const app = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')

test('Step 2.8 uses one shared shell alignment grid across density states', () => {
  assert.match(css, /--ui-shell-sidebar-width:\s*var\(--ui-layout-sidebar-width\)/)
  assert.match(css, /--ui-shell-sidebar-content-gap:\s*var\(--ui-space-3\)/)
  assert.match(css, /--ui-shell-content-right-inset:\s*var\(--ui-space-4\)/)
  assert.match(css, /@media \(min-width: 1440px\)[\s\S]*--ui-shell-content-right-inset:\s*var\(--ui-space-6\)/)
  assert.match(css, /@media \(max-width: 1179px\)[\s\S]*--ui-shell-sidebar-width:\s*var\(--ui-shell-sidebar-width-compact\)/)
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*--ui-shell-min-content-width:\s*0px/)
})

test('Step 2.8 geometry consumes Foundation radius and spacing tokens', () => {
  assert.match(css, /\.app-shell \.sidebar[\s\S]*border-radius:\s*var\(--ui-radius-floating\)/)
  assert.match(css, /\.content-workspace \.section-title[\s\S]*margin:\s*0 0 var\(--ui-space-3\)/)
  assert.match(css, /\.detail-grid[\s\S]*gap:\s*var\(--ui-layout-grid-gap\)/)
  assert.match(css, /\.list-row[\s\S]*padding:\s*var\(--ui-space-2\) var\(--ui-space-1\)/)
  assert.match(css, /\.chip,[\s\S]*border-radius:\s*var\(--ui-radius-capsule\)/)
  assert.match(css, /\.command-layer \.command-item-slot > \.global-entry[\s\S]*border-radius:\s*var\(--ui-radius-capsule\)/)
})

test('Project Detail back navigation follows content rhythm instead of inline geometry', () => {
  assert.match(app, /className="btn btn-ghost detail-page-back"/)
  assert.doesNotMatch(app, /style=\{\{ margin: ['"]4px 0 8px -10px['"] \}\}/)
  assert.match(css, /\.detail-page-back[\s\S]*margin:\s*0 0 var\(--ui-space-4\)/)
})

test('Step 2.8 keeps command bar and compact controls inside their safe area', () => {
  assert.match(css, /\.command-layer \.global-utility-bar[\s\S]*min-height:\s*calc\(var\(--ui-geometry-control-height\) \+ var\(--ui-space-2\)\)/)
  assert.match(css, /\.command-layer \.command-item-slot > \.global-entry[\s\S]*min-height:\s*var\(--ui-geometry-control-height\)/)
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.app-shell \.content-workspace[\s\S]*padding-inline:\s*var\(--ui-space-2\)/)
})
