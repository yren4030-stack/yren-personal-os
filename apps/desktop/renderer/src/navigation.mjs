import { t } from './i18n/index.mjs'

function item({ id, icon, labelKey, descriptionKey, real = false }) {
  return Object.freeze({
    id,
    icon,
    labelKey,
    label: t(labelKey),
    descriptionKey,
    description: t(descriptionKey),
    real,
  })
}

function space({ id, route = id, icon, labelKey, descriptionKey, children = [] }) {
  return Object.freeze({
    id,
    route,
    icon,
    labelKey,
    label: t(labelKey),
    descriptionKey,
    description: t(descriptionKey),
    children: Object.freeze(children),
  })
}

/**
 * The single renderer-owned route hierarchy for the whole-product shell.
 *
 * This is deliberately a small data model rather than a routing framework:
 * App.jsx still owns the route state, while this module keeps the product map
 * inspectable and prevents the old feature-by-feature sidebar from returning.
 */
export const APP_SPACES = Object.freeze([
  space({
    id: 'home',
    icon: 'home',
    labelKey: 'nav.home',
    descriptionKey: 'nav.homeDescription',
  }),
  space({
    id: 'manage',
    icon: 'grid',
    labelKey: 'nav.manage',
    descriptionKey: 'nav.manageDescription',
    children: [
      item({ id: 'manage-goals', icon: 'target', labelKey: 'nav.manageGoals', descriptionKey: 'nav.manageGoalsDescription' }),
      item({ id: 'projects', icon: 'grid', labelKey: 'nav.projects', descriptionKey: 'nav.projectsDescription', real: true }),
      item({ id: 'manage-planning', icon: 'calendar', labelKey: 'nav.managePlanning', descriptionKey: 'nav.managePlanningDescription' }),
      item({ id: 'manage-execution', icon: 'zap', labelKey: 'nav.manageExecution', descriptionKey: 'nav.manageExecutionDescription' }),
      item({ id: 'manage-review', icon: 'repeat', labelKey: 'nav.manageReview', descriptionKey: 'nav.manageReviewDescription' }),
    ],
  }),
  space({
    id: 'library',
    icon: 'book',
    labelKey: 'nav.library',
    descriptionKey: 'nav.libraryDescription',
    children: [
      item({ id: 'library-knowledge', icon: 'book', labelKey: 'nav.libraryKnowledge', descriptionKey: 'nav.libraryKnowledgeDescription' }),
      item({ id: 'library-assets', icon: 'sparkles', labelKey: 'nav.libraryAssets', descriptionKey: 'nav.libraryAssetsDescription' }),
      item({ id: 'library-files', icon: 'folder', labelKey: 'nav.libraryFiles', descriptionKey: 'nav.libraryFilesDescription' }),
      item({ id: 'library-collections', icon: 'grid', labelKey: 'nav.libraryCollections', descriptionKey: 'nav.libraryCollectionsDescription' }),
    ],
  }),
  space({
    id: 'create',
    icon: 'sparkles',
    labelKey: 'nav.create',
    descriptionKey: 'nav.createDescription',
    children: [
      item({ id: 'create-ai-lab', icon: 'sparkles', labelKey: 'nav.createAiLab', descriptionKey: 'nav.createAiLabDescription' }),
      item({ id: 'create-canvas', icon: 'layout', labelKey: 'nav.createCanvas', descriptionKey: 'nav.createCanvasDescription' }),
      item({ id: 'create-workflows', icon: 'repeat', labelKey: 'nav.createWorkflows', descriptionKey: 'nav.createWorkflowsDescription' }),
      item({ id: 'create-outputs', icon: 'database', labelKey: 'nav.createOutputs', descriptionKey: 'nav.createOutputsDescription' }),
    ],
  }),
  space({
    id: 'publish',
    icon: 'send',
    labelKey: 'nav.publish',
    descriptionKey: 'nav.publishDescription',
    children: [
      item({ id: 'publish-candidates', icon: 'folder', labelKey: 'nav.publishCandidates', descriptionKey: 'nav.publishCandidatesDescription' }),
      item({ id: 'publish-portfolio', icon: 'book', labelKey: 'nav.publishPortfolio', descriptionKey: 'nav.publishPortfolioDescription' }),
      item({ id: 'publish-public-content', icon: 'send', labelKey: 'nav.publishPublicContent', descriptionKey: 'nav.publishPublicContentDescription' }),
    ],
  }),
  space({
    id: 'settings',
    icon: 'settings',
    labelKey: 'nav.settings',
    descriptionKey: 'nav.settingsDescription',
  }),
])

export const NAVIGATION_ROUTE_IDS = Object.freeze([
  ...APP_SPACES.map((spaceItem) => spaceItem.route),
  ...APP_SPACES.flatMap((spaceItem) => spaceItem.children.map((child) => child.id)),
])

export function getSpace(route) {
  return APP_SPACES.find((spaceItem) => spaceItem.route === route || spaceItem.children.some((child) => child.id === route))
}

export function findNavigationRoute(route) {
  for (const spaceItem of APP_SPACES) {
    if (spaceItem.route === route) return spaceItem
    const child = spaceItem.children.find((itemValue) => itemValue.id === route)
    if (child) return child
  }
  return null
}

export function isSpaceActive(spaceItem, route) {
  return spaceItem.route === route || spaceItem.children.some((child) => child.id === route)
}
