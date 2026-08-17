import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { APP_SPACES, NAVIGATION_ROUTE_IDS } from '../apps/desktop/renderer/src/navigation.mjs'
import {
  FEATURE_SKELETON_ROUTE_IDS,
  isFeatureSkeletonRoute,
  resolveFeatureSkeleton,
} from '../apps/desktop/renderer/src/feature-skeleton.mjs'
import { messages, t } from '../apps/desktop/renderer/src/i18n/index.mjs'

const appSource = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')
const featureSkeletonSource = readFileSync(new URL('../apps/desktop/renderer/src/feature-skeleton.mjs', import.meta.url), 'utf8')

const EXPECTED_FEATURE_SKELETON_ROUTES = [
  'manage-goals', 'manage-planning', 'manage-execution', 'manage-review',
  'library-knowledge', 'library-assets', 'library-files', 'library-collections',
  'create-ai-lab', 'create-canvas', 'create-workflows', 'create-outputs',
  'publish-candidates', 'publish-portfolio', 'publish-public-content',
]

test('exactly the 15 contract feature routes are feature skeletons', () => {
  assert.deepEqual([...FEATURE_SKELETON_ROUTE_IDS].sort(), [...EXPECTED_FEATURE_SKELETON_ROUTES].sort())
  assert.equal(FEATURE_SKELETON_ROUTE_IDS.length, 15)
})

test('feature skeletons are exactly the non-real secondary navigation items', () => {
  const secondary = APP_SPACES.flatMap((spaceItem) => spaceItem.children)
  const nonReal = secondary.filter((child) => !child.real).map((child) => child.id)
  assert.deepEqual([...FEATURE_SKELETON_ROUTE_IDS].sort(), [...nonReal].sort())
  assert.deepEqual(secondary.filter((child) => child.real).map((child) => child.id), ['projects'])
})

test('real, space-landing and global routes are never feature skeletons', () => {
  for (const id of ['home', 'projects', 'settings', 'manage', 'library', 'create', 'publish']) {
    assert.equal(isFeatureSkeletonRoute(id), false, `${id} must not be a feature skeleton`)
  }
  assert.equal(isFeatureSkeletonRoute('project'), false, 'Project Detail stays a real non-nav route')
  assert.equal(isFeatureSkeletonRoute('main-ai'), false)
  assert.equal(isFeatureSkeletonRoute('search'), false)
  assert.equal(isFeatureSkeletonRoute('not-a-route'), false)
})

test('resolveFeatureSkeleton returns an honest presentation for every feature route', () => {
  for (const id of EXPECTED_FEATURE_SKELETON_ROUTES) {
    const view = resolveFeatureSkeleton(id)
    assert.ok(view, `${id} must resolve`)
    assert.equal(view.route, id)
    assert.ok(view.title.length > 0, `${id} title`)
    assert.ok(view.description.length > 0, `${id} description`)
    assert.equal(view.status, t('featureSkeleton.status'))
    assert.equal(view.availability, t('featureSkeleton.notAvailable'))
    assert.ok(view.futureSlice.length > 0, `${id} future slice`)
    assert.ok(view.spaceRoute, `${id} must belong to a space`)
    assert.ok(view.spaceLabel.length > 0)
  }
})

test('navigation descriptions are actually used by the feature skeleton view', () => {
  assert.equal(resolveFeatureSkeleton('manage-goals').description, t('nav.manageGoalsDescription'))
  assert.equal(resolveFeatureSkeleton('create-canvas').description, t('nav.createCanvasDescription'))
  assert.equal(resolveFeatureSkeleton('publish-portfolio').description, t('nav.publishPortfolioDescription'))
})

test('future slice metadata comes only from the accepted presentation model', () => {
  // No confirmed roadmap slice → honest "Later Slice" fallback.
  assert.equal(resolveFeatureSkeleton('library-files').futureSlice, t('featureSkeleton.laterSlice'))
  assert.equal(resolveFeatureSkeleton('library-collections').futureSlice, t('featureSkeleton.laterSlice'))
  // Accepted roadmap phases (02 §12 Phase B–E) drive specific labels.
  assert.equal(resolveFeatureSkeleton('manage-goals').futureSlice, t('featureSkeleton.sliceManagement'))
  assert.equal(resolveFeatureSkeleton('manage-planning').futureSlice, t('featureSkeleton.sliceManagement'))
  assert.equal(resolveFeatureSkeleton('library-knowledge').futureSlice, t('featureSkeleton.sliceKnowledge'))
  assert.equal(resolveFeatureSkeleton('library-assets').futureSlice, t('featureSkeleton.sliceAiAssets'))
  assert.equal(resolveFeatureSkeleton('create-ai-lab').futureSlice, t('featureSkeleton.sliceAiLab'))
  assert.equal(resolveFeatureSkeleton('create-canvas').futureSlice, t('featureSkeleton.sliceCanvas'))
  assert.equal(resolveFeatureSkeleton('create-workflows').futureSlice, t('featureSkeleton.sliceCanvas'))
  assert.equal(resolveFeatureSkeleton('create-outputs').futureSlice, t('featureSkeleton.sliceOutputs'))
  assert.equal(resolveFeatureSkeleton('publish-candidates').futureSlice, t('featureSkeleton.slicePublish'))
})

test('App.jsx renders FeatureSkeleton for feature routes and keeps real pages', () => {
  assert.match(appSource, /<FeatureSkeleton item=\{routeNav\} space=\{currentSpace\} onNavigate=\{navigate\} \/>/)
  assert.match(appSource, /route === 'home' && <HomePage/)
  assert.match(appSource, /route === 'projects' && <ProjectsPage/)
  assert.match(appSource, /route === 'project' && <ProjectDetailPage/)
  assert.match(appSource, /route === 'settings' && <SettingsPage/)
})

test('space landing pages are not replaced by the feature skeleton', () => {
  assert.match(appSource, /spaceLandingRoutes\.includes\(route\) && currentSpace && <SpaceLandingPage/)
  assert.doesNotMatch(appSource, /<FeatureSkeleton[^>]*SpaceLanding/)
})

test('no new business routes were introduced by Step 3', () => {
  // Unchanged route model: 6 spaces + 16 secondary items; 'project' stays a non-nav child.
  assert.equal(NAVIGATION_ROUTE_IDS.length, 22)
  const ids = new Set(NAVIGATION_ROUTE_IDS)
  for (const id of EXPECTED_FEATURE_SKELETON_ROUTES) assert.ok(ids.has(id), `${id} remains a nav route`)
  for (const id of ['main-ai', 'search', 'notifications', 'quick-create']) {
    assert.ok(!ids.has(id), `${id} must not become a business route`)
  }
})

test('existing real project proposal flow is preserved', () => {
  assert.match(appSource, /proposeNextStep/)
  assert.match(appSource, /proposals\.approve/)
  assert.match(appSource, /proposals\.reject/)
})

test('Step 2 global entries are preserved', () => {
  assert.match(appSource, /GLOBAL_ENTRIES\.map/)
  assert.match(appSource, /global-utility-bar/)
  assert.match(appSource, /deriveCurrentContext\(/)
})

test('feature skeletons contain no fake business data or persistence', () => {
  assert.doesNotMatch(appSource, /localStorage|sessionStorage|indexedDB/)
  assert.doesNotMatch(featureSkeletonSource, /localStorage|sessionStorage|indexedDB|fetch\(|sqlite|window\.personalOS/)
  // No fake counts / KPI anywhere in the skeleton presentation module.
  assert.doesNotMatch(featureSkeletonSource, /count|kpi|progress|timeline/i)
})

test('feature skeleton i18n keys exist and are non-empty', () => {
  const fs = messages.featureSkeleton
  const required = [
    'status', 'willDo', 'currentAvailability', 'notAvailable', 'futureSlice',
    'laterSlice', 'backToSpace', 'sliceManagement', 'sliceKnowledge',
    'sliceAiAssets', 'sliceAiLab', 'sliceCanvas', 'sliceOutputs', 'slicePublish',
  ]
  for (const key of required) {
    assert.equal(typeof fs[key], 'string', `featureSkeleton.${key} must be a string`)
    assert.ok(fs[key].length > 0, `featureSkeleton.${key} must not be empty`)
  }
})

test('no hardcoded Chinese user-visible text in App.jsx or feature-skeleton.mjs', () => {
  for (const source of [appSource, featureSkeletonSource]) {
    const zhChars = source.match(/[\u4e00-\u9fff]/g)
    assert.equal(zhChars, null, 'user-visible text must come from i18n')
  }
})

test('no DB / IPC / preload / runtime capabilities were introduced', () => {
  assert.doesNotMatch(featureSkeletonSource, /window\.personalOS|ipcRenderer|require\(|import\(/)
  assert.doesNotMatch(appSource, /ipcRenderer|require\(['"]electron/)
})
