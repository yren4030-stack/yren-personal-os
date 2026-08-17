import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  APP_SPACES,
  NAVIGATION_ROUTE_IDS,
  findNavigationRoute,
  getSpace,
  isSpaceActive,
} from '../apps/desktop/renderer/src/navigation.mjs'

const byId = (id) => APP_SPACES.find((space) => space.id === id)
const appSource = readFileSync(new URL('../apps/desktop/renderer/src/App.jsx', import.meta.url), 'utf8')

test('the renderer exposes one six-space product shell', () => {
  assert.deepEqual(APP_SPACES.map((space) => space.id), ['home', 'manage', 'library', 'create', 'publish', 'settings'])
  assert.deepEqual(APP_SPACES.map((space) => space.route), ['home', 'manage', 'library', 'create', 'publish', 'settings'])
})

test('secondary navigation belongs to the correct product space', () => {
  assert.deepEqual(byId('manage').children.map((item) => item.id), [
    'manage-goals', 'projects', 'manage-planning', 'manage-execution', 'manage-review',
  ])
  assert.deepEqual(byId('library').children.map((item) => item.id), [
    'library-knowledge', 'library-assets', 'library-files', 'library-collections',
  ])
  assert.deepEqual(byId('create').children.map((item) => item.id), [
    'create-ai-lab', 'create-canvas', 'create-workflows', 'create-outputs',
  ])
  assert.deepEqual(byId('publish').children.map((item) => item.id), [
    'publish-candidates', 'publish-portfolio', 'publish-public-content',
  ])
})

test('existing real routes remain in the new hierarchy', () => {
  assert.equal(findNavigationRoute('home').real, undefined)
  assert.equal(findNavigationRoute('projects').real, true)
  assert.equal(findNavigationRoute('settings').id, 'settings')
  assert.equal(NAVIGATION_ROUTE_IDS.includes('project'), false, 'Project Detail stays a non-nav child route')
  assert.match(appSource, /route === 'home' && <HomePage/)
  assert.match(appSource, /route === 'projects' && <ProjectsPage/)
  assert.match(appSource, /route === 'project' && <ProjectDetailPage/)
  assert.match(appSource, /route === 'settings' && <SettingsPage/)
  assert.match(appSource, /<ComingSoon label=/)
})

test('the old parallel feature sidebar is not rendered alongside the product spaces', () => {
  assert.match(appSource, /<SidebarNavigation route=\{route\} navigate=\{navigate\} \/>/)
  assert.doesNotMatch(appSource, /nav\.(work|knowledge|ai|system)/)
  assert.doesNotMatch(appSource, /const NAV = \[/)
})

test('space activation follows the route hierarchy', () => {
  const manage = byId('manage')
  const library = byId('library')
  assert.equal(isSpaceActive(manage, 'manage'), true)
  assert.equal(isSpaceActive(manage, 'projects'), true)
  assert.equal(isSpaceActive(manage, 'library-knowledge'), false)
  assert.equal(getSpace('library-knowledge'), library)
})

test('only Projects is marked as real in Step 1 secondary navigation', () => {
  const secondary = APP_SPACES.flatMap((space) => space.children)
  assert.deepEqual(secondary.filter((item) => item.real).map((item) => item.id), ['projects'])
})
