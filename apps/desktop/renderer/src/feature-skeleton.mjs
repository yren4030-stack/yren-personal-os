/**
 * Step 3 — Feature Skeleton presentation model.
 *
 * Pure data/presentation module: no DOM, no window, no business I/O. It
 * derives the honest skeleton presentation for every not-yet-implemented
 * feature route from the single navigation model (navigation.mjs) and the
 * i18n dictionary.
 *
 * Truthfulness contract:
 * - Presentation ONLY: displayed status is always "not implemented";
 * - Real Data Source = NONE; allowed actions are navigation only;
 * - Future Slice is presentation metadata (futureSliceKey) sourced from the
 *   accepted architecture roadmap (02 §12 Phase B–E) or falls back to
 *   "Later Slice"; it is never a business fact.
 */

import { t } from './i18n/index.mjs'
import { APP_SPACES, findNavigationRoute, getSpace } from './navigation.mjs'

/** Every secondary navigation item that is not real is a Feature Skeleton. */
export const FEATURE_SKELETON_ROUTE_IDS = Object.freeze(
  APP_SPACES.flatMap((spaceItem) =>
    spaceItem.children.filter((child) => !child.real).map((child) => child.id),
  ),
)

export function isFeatureSkeletonRoute(route) {
  return FEATURE_SKELETON_ROUTE_IDS.includes(route)
}

/**
 * Resolve the honest presentation for one feature skeleton route.
 * Returns null for unknown routes and for real/landing/global routes.
 *
 * The returned object is presentation-only:
 * { route, spaceId, spaceLabel, spaceRoute, title, description, status,
 *   availability, futureSliceKey, futureSlice }
 */
export function resolveFeatureSkeleton(route) {
  if (!isFeatureSkeletonRoute(route)) return null
  const item = findNavigationRoute(route)
  const space = getSpace(route)
  if (!item || item.real) return null
  return {
    route: item.id,
    spaceId: space ? space.id : null,
    spaceLabel: space ? space.label : null,
    spaceRoute: space ? space.route : null,
    title: item.label,
    description: item.description,
    status: t('featureSkeleton.status'),
    availability: t('featureSkeleton.notAvailable'),
    futureSliceKey: item.futureSliceKey || 'featureSkeleton.laterSlice',
    futureSlice: item.futureSliceKey ? t(item.futureSliceKey) : t('featureSkeleton.laterSlice'),
  }
}
