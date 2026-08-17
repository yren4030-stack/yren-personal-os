import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  GLOBAL_ENTRIES,
  GLOBAL_PANEL_IDS,
  getGlobalEntry,
  isGlobalPanelId,
  deriveCurrentContext,
} from '../apps/desktop/renderer/src/global-shell.mjs'
import { messages, t } from '../apps/desktop/renderer/src/i18n/index.mjs'

const appSource = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')

test('global shell exposes exactly the six step-2 global capabilities', () => {
  assert.deepEqual(GLOBAL_ENTRIES.map((entry) => entry.id), ['main-ai', 'search', 'notifications', 'proposals', 'quick-create'])
  assert.deepEqual(GLOBAL_PANEL_IDS, ['main-ai', 'search', 'notifications', 'proposals', 'quick-create'])
  assert.equal(GLOBAL_ENTRIES.length, 5, 'five panel entries; Current Context is derived UI, not a panel')
})

test('global entries have complete required fields and unique ids', () => {
  const ids = GLOBAL_ENTRIES.map((entry) => entry.id)
  assert.equal(new Set(ids).size, ids.length, 'no duplicate global entry ids')
  for (const entry of GLOBAL_ENTRIES) {
    assert.equal(typeof entry.labelKey, 'string')
    assert.equal(typeof entry.descriptionKey, 'string')
    assert.equal(typeof entry.kind, 'string')
    assert.equal(typeof entry.availability, 'string')
    assert.equal(typeof entry.label, 'string')
    assert.equal(typeof entry.description, 'string')
    assert.ok(entry.label.length > 0)
    assert.ok(entry.description.length > 0)
  }
})

test('every global entry is rendered by the global utility bar', () => {
  const shellSource = readFileSync(new URL('../apps/desktop/renderer/src/global-shell.mjs', import.meta.url), 'utf8')
  for (const entry of GLOBAL_ENTRIES) {
    assert.match(shellSource, new RegExp(`id: '${entry.id}'`), `global-shell.mjs declares ${entry.id}`)
  }
  assert.match(appSource, /GLOBAL_ENTRIES\.map/, 'App.jsx renders all entries from the single model')
  assert.match(appSource, /global-utility-bar/)
  assert.match(appSource, /role="toolbar"/)
})

test('global entries are buttons with aria-expanded and no fake success', () => {
  assert.match(appSource, /aria-expanded=\{active\}/)
  assert.match(appSource, /aria-controls="global-panel"/)
  // Skeleton entries never claim a real backend.
  assert.doesNotMatch(appSource, /global\.(mainAiStatus|searchStatus|notificationsStatus|quickCreateStatus).*ok/i)
  for (const id of ['main-ai', 'search', 'notifications', 'quick-create']) {
    assert.equal(getGlobalEntry(id).availability, 'skeleton', `${id} must remain skeleton`)
  }
})

test('proposal entry is a real entry that navigates to the preserved project flow', () => {
  assert.equal(getGlobalEntry('proposals').availability, 'entry')
  assert.match(appSource, /onNavigate\('projects'\)/, 'global proposal entry navigates to Manage → Projects')
  // Existing real proposal flow must remain wired in ProjectDetailPage.
  assert.match(appSource, /proposeNextStep/)
  assert.match(appSource, /proposals\.approve/)
  assert.match(appSource, /proposals\.reject/)
  // No second proposal domain: no fake proposal list rendering in the global panel body.
  assert.doesNotMatch(appSource, /global.*proposal.*map|fake.*proposal/i)
})

test('current context is derived, read-only and non-persistent', () => {
  const home = deriveCurrentContext({ route: 'home', selectedProject: null })
  assert.deepEqual(home, { route: 'home', space: t('nav.home'), projectId: null, projectTitle: null })

  const project = deriveCurrentContext({ route: 'project', selectedProject: 'p1', projectTitle: null })
  assert.equal(project.space, t('nav.manage'))
  assert.equal(project.projectId, 'p1')
  assert.equal(project.projectTitle, null)

  const projects = deriveCurrentContext({ route: 'projects', selectedProject: null })
  assert.equal(projects.space, t('nav.manage'))
  assert.equal(projects.projectId, null)

  const settings = deriveCurrentContext({ route: 'settings', selectedProject: null })
  assert.equal(settings.space, t('nav.settings'))

  // Current Context is a pure function of existing renderer state.
  assert.match(appSource, /deriveCurrentContext\(/)
  assert.doesNotMatch(appSource, /localStorage|sessionStorage|indexedDB/, 'no persistence for current context')
})

test('global panel state is a single enum, not five booleans', () => {
  assert.match(appSource, /useState\(null\).*activeGlobalPanel|const \[activeGlobalPanel, setActiveGlobalPanel\] = useState\(null\)/)
  assert.match(appSource, /setActiveGlobalPanel\(\(current\) => \(current === id \? null : id\)\)/, 'single toggle handler')
})

test('existing step-1 routes remain rendered', () => {
  assert.match(appSource, /route === 'home' && <HomePage/)
  assert.match(appSource, /route === 'projects' && <ProjectsPage/)
  assert.match(appSource, /route === 'project' && <ProjectDetailPage/)
  assert.match(appSource, /route === 'settings' && <SettingsPage/)
})

test('global i18n keys exist', () => {
  const g = messages.global
  const required = [
    'label', 'mainAi', 'mainAiDescription', 'search', 'searchDescription',
    'notifications', 'notificationsDescription', 'proposals', 'proposalsDescription',
    'quickCreate', 'quickCreateDescription', 'skeleton', 'notImplemented',
    'laterSlice', 'close', 'mainAiStatus', 'searchInputPlaceholder', 'searchStatus',
    'notificationsStatus', 'proposalsStatus', 'proposalsGoToProjects',
    'quickCreateStatus', 'quickCreateItems', 'currentContext',
  ]
  for (const key of required) {
    assert.equal(typeof g[key], 'string', `global.${key} must be a string`)
    assert.ok(g[key].length > 0, `global.${key} must not be empty`)
  }
})

test('no hardcoded Chinese in App.jsx global shell', () => {
  // User-visible text must come from i18n, not be hardcoded in JSX.
  const zhChars = appSource.match(/[\u4e00-\u9fff]/g)
  assert.equal(zhChars, null, 'App.jsx must not contain hardcoded Chinese user-visible text')
})

test('no new business routes were introduced for global skeletons', () => {
  // Global entries are cross-cutting; Current Context is derived UI.
  assert.doesNotMatch(appSource, /route === 'main-ai'|route === 'search'|route === 'notifications'|route === 'quick-create'/)
  assert.ok(isGlobalPanelId('main-ai'))
  assert.equal(isGlobalPanelId('not-a-panel'), false)
})
