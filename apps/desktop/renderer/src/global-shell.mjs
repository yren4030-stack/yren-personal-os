import { t } from './i18n/index.mjs'

/**
 * Global shell model — the cross-cutting utility layer of the whole-product
 * App Shell.
 *
 * These capabilities belong to the entire Personal OS, not to any single
 * product space (Home / Manage / Library / Create / Publish / Settings).
 *
 * Step 2 scope: only stable, clear, testable GLOBAL ENTRY SKELETONS.
 * `availability: 'skeleton'` means the entry exists and is reachable, but the
 * backend capability is not implemented yet and must never be faked.
 */
export const GLOBAL_ENTRIES = Object.freeze(
  [
    { id: 'main-ai', kind: 'panel', labelKey: 'global.mainAi', descriptionKey: 'global.mainAiDescription', availability: 'skeleton' },
    { id: 'search', kind: 'panel', labelKey: 'global.search', descriptionKey: 'global.searchDescription', availability: 'skeleton' },
    { id: 'notifications', kind: 'panel', labelKey: 'global.notifications', descriptionKey: 'global.notificationsDescription', availability: 'skeleton' },
    { id: 'proposals', kind: 'panel', labelKey: 'global.proposals', descriptionKey: 'global.proposalsDescription', availability: 'entry' },
    { id: 'quick-create', kind: 'panel', labelKey: 'global.quickCreate', descriptionKey: 'global.quickCreateDescription', availability: 'skeleton' },
  ].map((entry) => Object.freeze({ ...entry, label: t(entry.labelKey), description: t(entry.descriptionKey) })),
)

/** The only valid values for the single global panel state. */
export const GLOBAL_PANEL_IDS = Object.freeze(['main-ai', 'search', 'notifications', 'proposals', 'quick-create'])

export function getGlobalEntry(id) {
  return GLOBAL_ENTRIES.find((entry) => entry.id === id) || null
}

export function isGlobalPanelId(id) {
  return GLOBAL_PANEL_IDS.includes(id)
}

/**
 * Current Context — STRICTLY DERIVED, READ-ONLY, NON-PERSISTENT presentation.
 * It derives from renderer state that already exists (route + selectedProject).
 * It never creates a Context store, memory, DB row, or runtime contract.
 */
export function deriveCurrentContext({ route, selectedProject, projectTitle = null }) {
  const context = { route, space: null, projectId: null, projectTitle: null }
  if (route === 'home') {
    context.space = t('nav.home')
  } else if (route === 'projects') {
    context.space = t('nav.manage')
  } else if (route === 'project' && selectedProject) {
    context.space = t('nav.manage')
    context.projectId = selectedProject
    context.projectTitle = projectTitle
  } else if (route === 'settings') {
    context.space = t('nav.settings')
  } else if (route === 'manage') {
    context.space = t('nav.manage')
  } else if (route === 'library') {
    context.space = t('nav.library')
  } else if (route === 'create') {
    context.space = t('nav.create')
  } else if (route === 'publish') {
    context.space = t('nav.publish')
  } else {
    // Unknown / skeleton routes: keep the route id as the only signal.
    context.space = route
  }
  return context
}
