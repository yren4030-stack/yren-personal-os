import React, { useCallback, useEffect, useRef, useState } from 'react'
import { t } from './i18n/index.mjs'
import { applyFoundationTokens, resolveFoundationTokens } from './ui-foundation.mjs'
import { resolveTheme, prefersDark, applyTheme, watchSystemTheme } from './theme.mjs'
import { APP_SPACES, findNavigationRoute, getSpace, isSpaceActive } from './navigation.mjs'
import { GLOBAL_ENTRIES, getGlobalEntry, deriveCurrentContext } from './global-shell.mjs'
import { isFeatureSkeletonRoute } from './feature-skeleton.mjs'

const api = () => window.personalOS?.v1

/* ------------------------------------------------------------------ */
/* Inline icon set (stroke, currentColor) — no icon package needed    */
/* ------------------------------------------------------------------ */

const ICONS = {
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  sparkles: (
    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" />
  ),
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  repeat: (
    <>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
    </>
  ),
  send: (
    <>
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4Z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  x: (
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
}

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Appearance -> glass tokens                                          */
/* ------------------------------------------------------------------ */

function applyAppearance(appearance, theme) {
  applyTheme(theme)
  const root = document.documentElement
  applyFoundationTokens(root, resolveFoundationTokens({
    appearance: theme,
    liquidGlassStyle: appearance.liquidGlassStyle,
    glassStrength: appearance.glassStrength,
    increasedContrast: root.dataset.increasedContrast === 'true',
    reducedTransparency: root.dataset.reducedTransparency === 'true',
  }))
  glassDebugLog(appearance, theme)
}

/**
 * Development-only rendering diagnostic: enable in DevTools with
 * `window.__GLASS_DEBUG__ = true`, then change appearance settings. Proves
 * that the root CSS variables and the real surface computed styles follow
 * the selection. Never shown in the UI; no personal data.
 */
function glassDebugLog(appearance, theme) {
  if (typeof window === 'undefined' || !window.__GLASS_DEBUG__) return
  const rootStyle = getComputedStyle(document.documentElement)
  const surface = document.querySelector('.sidebar') || document.querySelector('.card')
  const surfaceStyle = surface ? getComputedStyle(surface) : null
  console.debug('[glass-debug]', {
    theme,
    liquidGlass: appearance.liquidGlassStyle,
    rootBlur: rootStyle.getPropertyValue('--glass-blur').trim(),
    rootBg: rootStyle.getPropertyValue('--glass-bg').trim(),
    rootBorder: rootStyle.getPropertyValue('--glass-border').trim(),
    rootSaturation: rootStyle.getPropertyValue('--glass-saturation').trim(),
    surfaceBackdrop: surfaceStyle ? surfaceStyle.backdropFilter : null,
    surfaceBackground: surfaceStyle ? surfaceStyle.background : null,
    opaqueParent: 'none (html/#root/.app-shell/.main/.page all transparent; body holds the depth layer)',
  })
}

/* ------------------------------------------------------------------ */
/* Presentation mappings (backend values unchanged)                   */
/* ------------------------------------------------------------------ */

function displayTitle(project) {
  return project.id === 'validation-project' ? t('home.validationProject') : project.title
}

function runtimeView(runtime) {
  const data = runtime && runtime.ok ? runtime.data : { mode: null, state: 'unavailable', externalModel: false }
  const mode = data.mode === 'validation-local-mock' ? t('home.validationMode') : data.mode === 'real-dsh' ? t('home.localMode') : data.mode
  const state = data.state === 'ready' ? t('home.aiReady') : data.state === 'starting' ? t('home.aiStarting') : data.state === 'unavailable' ? t('home.aiUnavailable') : data.state
  const external = data.externalModel ? t('home.externalUsed') : t('home.externalNotUsed')
  return { stateKey: data.state, mode, state, external }
}

function taskStatusLabel(status) {
  if (status === 'todo') return t('projectDetail.statusTodo')
  if (status === 'in-progress' || status === 'doing') return t('common.inProgress')
  if (status === 'done' || status === 'completed') return t('common.done')
  return status
}

function proposalStatusLabel(status) {
  if (status === 'pending-approval') return t('projectDetail.statusPending')
  if (status === 'approved') return t('projectDetail.statusApproved')
  if (status === 'rejected') return t('projectDetail.statusRejected')
  return status
}

function kindLabel(kind) {
  if (kind === 'project') return t('projectDetail.kindProject')
  if (kind === 'task') return t('projectDetail.kindTask')
  if (kind === 'proposal') return t('projectDetail.kindProposal')
  return kind
}

function activityStatusLabel(item) {
  if (item.kind === 'proposal') return proposalStatusLabel(item.status)
  if (item.kind === 'task') return taskStatusLabel(item.status)
  if (item.status === 'active') return t('common.inProgress')
  if (item.status === 'done' || item.status === 'completed') return t('common.done')
  return item.status
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

/* ------------------------------------------------------------------ */
/* Shared small components                                             */
/* ------------------------------------------------------------------ */

function useAsync(fn, deps) {
  const [value, setValue] = useState(null)
  useEffect(() => {
    let alive = true
    fn().then((r) => {
      if (alive) setValue(r)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return value
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>
      {children}
    </div>
  )
}

function Empty({ text }) {
  return <div className="empty">{text}</div>
}

function PageLoading() {
  return (
    <div className="page">
      <div className="card ui-liquid-glass page-glass-surface boot" data-material="regular" style={{ minHeight: 240 }}>
        <div className="spinner" />
        {t('common.loading')}
      </div>
    </div>
  )
}

function PageError({ error }) {
  return (
    <div className="page">
      <div className="error-banner">
        {error.code}
        {error.message ? `: ${error.message}` : ''}
      </div>
    </div>
  )
}

function ProjectCard({ project, onOpen }) {
  return (
    <button type="button" className="card card-hover project-card ui-liquid-glass page-glass-surface" data-material="regular" onClick={onOpen}>
      <span className="project-title">{displayTitle(project)}</span>
      <span className="project-meta">{t('common.tasksCount', { n: project.taskCount })}</span>
      <span className="open-affordance">{t('projects.openProject')} →</span>
    </button>
  )
}

function ActivityRow({ item }) {
  return (
    <div className="list-row">
      <span className={`chip ${item.kind === 'proposal' ? 'chip-accent' : 'chip-neutral'}`}>{kindLabel(item.kind)}</span>
      <span className="grow">{item.title}</span>
      <span className="chip chip-neutral">{activityStatusLabel(item)}</span>
      <span className="list-time">{formatTime(item.at)}</span>
    </div>
  )
}

function SidebarNavigation({ route, navigate }) {
  return (
    <nav className="nav-shell" aria-label={t('nav.spaces')}>
      <div className="nav-group-label">{t('nav.spaces')}</div>
      {APP_SPACES.map((space) => {
        const active = isSpaceActive(space, route)
        return (
          <React.Fragment key={space.id}>
            <button
              type="button"
              title={space.label}
              aria-current={active ? 'page' : undefined}
              className={`nav-item nav-primary${active ? ' active' : ''}`}
              onClick={() => navigate(space.route)}
            >
              <Icon name={space.icon} size={17} />
              <span className="nav-label">{space.label}</span>
            </button>

            {active && space.children.length > 0 && (
              <div className="nav-secondary" aria-label={space.label}>
                <div className="nav-subgroup-label">{t('nav.secondary')}</div>
                {space.children.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    aria-current={route === item.id ? 'page' : undefined}
                    className={`nav-item nav-secondary-item${route === item.id ? ' active' : ''}`}
                    onClick={() => navigate(item.id)}
                  >
                    <Icon name={item.icon} size={16} />
                    <span className="nav-label">{item.label}</span>
                    <span className={`soon-chip${item.real ? ' real-chip' : ''}`}>
                      {item.real ? t('nav.realCapability') : t('nav.comingSoon')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

function SpaceLandingPage({ space, onNavigate }) {
  return (
    <div className="page">
      <PageHeader title={space.label} subtitle={space.description} />
      <Section title={t('nav.secondary')}>
        <div className="space-link-grid">
          {space.children.map((item) => (
            <button type="button" key={item.id} className="card card-hover space-link-card ui-liquid-glass page-glass-surface" data-material="regular" onClick={() => onNavigate(item.id)}>
              <span className="space-link-icon"><Icon name={item.icon} size={20} /></span>
              <span className="space-link-heading">
                <span className="space-link-title">{item.label}</span>
                <span className={`chip ${item.real ? 'chip-accent' : 'chip-neutral'}`}>
                  {item.real ? t('nav.realCapability') : t('nav.skeleton')}
                </span>
              </span>
              <span className="space-link-description">{item.description}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Global shell - cross-cutting utility layer (Step 2 skeletons)       */
/* ------------------------------------------------------------------ */

const GLOBAL_ICONS = { 'main-ai': 'sparkles', search: 'search', notifications: 'bell', proposals: 'repeat', 'quick-create': 'plus' }

function GlobalUtilityBar({ activePanel, onToggle, onNavigate }) {
  const entries = Object.fromEntries(GLOBAL_ENTRIES.map((entry) => [entry.id, entry]))
  const renderEntry = (id, className = '') => {
    const entry = entries[id]
    if (!entry) return null
    const active = activePanel === entry.id
    return (
      <button
        key={entry.id}
        type="button"
        className={`global-entry ui-button${className ? ` ${className}` : ''}${active ? ' active' : ''}`}
        data-variant="tertiary"
        data-state={active ? 'open' : 'default'}
        title={entry.description}
        aria-label={entry.label}
        aria-expanded={active}
        aria-controls="global-panel"
        onClick={() => onToggle(entry.id)}
      >
        <Icon name={GLOBAL_ICONS[entry.id]} size={17} />
        <span className="global-entry-label">{entry.label}</span>
        <span className="soon-chip">{t('global.skeleton')}</span>
      </button>
    )
  }
  const renderPanel = (id, presentation = 'popover') => activePanel === id ? (
    <GlobalPanel
      id={id}
      presentation={presentation}
      onClose={() => onToggle(null)}
      onNavigate={onNavigate}
    />
  ) : null

  return (
    <div className="global-utility-bar ui-liquid-glass" data-material="regular" role="toolbar" aria-label={t('global.label')}>
      <div className="command-item-slot toolbar-search-slot" aria-label={entries.search.label}>
        {renderEntry('search')}
        {renderPanel('search')}
      </div>

      <div className="command-item-slot toolbar-notifications-slot" aria-label={entries.notifications.label}>
        {renderEntry('notifications')}
        {renderPanel('notifications')}
      </div>

      <div className="command-item-slot toolbar-proposals-slot" aria-label={entries.proposals.label}>
        {renderEntry('proposals')}
        {renderPanel('proposals')}
      </div>

      <div className="command-item-slot toolbar-create-slot" aria-label={entries['quick-create'].label}>
        {renderEntry('quick-create', 'global-entry-create')}
        {renderPanel('quick-create')}
      </div>

      <div className="command-item-slot toolbar-ai-slot" aria-label={entries['main-ai'].label}>
        {renderEntry('main-ai')}
      </div>
    </div>
  )
}

function CurrentContextChip({ context }) {
  if (!context || (!context.projectId && !context.projectTitle)) return null
  const objectLabel = context.projectTitle || `Project ${context.projectId}`
  return (
    <div className="current-context" aria-label={t('global.currentContext')}>
      <Icon name="info" size={14} />
      <span className="current-context-label">{t('global.currentContext')}</span>
      <span className="current-context-value grow">{objectLabel}</span>
    </div>
  )
}

function GlobalPanel({ id, presentation = 'popover', context, onClose, onNavigate }) {
  const entry = getGlobalEntry(id)
  if (!entry) return null
  return (
    <div className={`global-panel global-panel-${id} global-panel-${presentation} ui-liquid-glass content-bearing-glass`} data-material="regular" id="global-panel" role="dialog" aria-label={entry.label}>
      <div className="global-panel-header">
        <span className="global-panel-title">{entry.label}</span>
        <button type="button" className="btn btn-ghost global-panel-close" onClick={onClose} aria-label={t('global.close')}>
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="global-panel-body">
        <GlobalPanelBody id={id} context={context} onNavigate={onNavigate} />
      </div>
    </div>
  )
}

function GlobalPanelBody({ id, context, onNavigate }) {
  if (id === 'main-ai') {
    return (
      <>
        {context?.projectId && <CurrentContextChip context={context} />}
        <SkeletonNotice text={t('global.mainAiStatus')} />
      </>
    )
  }
  if (id === 'search') {
    return (
      <div className="global-search-skeleton">
        <input type="search" className="input" placeholder={t('global.searchInputPlaceholder')} aria-label={t('global.search')} disabled />
        <SkeletonNotice text={t('global.searchStatus')} />
      </div>
    )
  }
  if (id === 'notifications') {
    return <SkeletonNotice text={t('global.notificationsStatus')} />
  }
  if (id === 'proposals') {
    return (
      <div>
        <p>{t('global.proposalsStatus')}</p>
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('projects')}>
          {t('global.proposalsGoToProjects')}
        </button>
      </div>
    )
  }
  if (id === 'quick-create') {
    return (
      <div>
        <SkeletonNotice text={t('global.quickCreateStatus')} />
        <p className="global-note">{t('global.quickCreateItems')}</p>
      </div>
    )
  }
  return null
}

function SkeletonNotice({ text }) {
  return (
    <div className="card coming-soon global-skeleton-notice">
      <div className="coming-soon-icon">
        <Icon name="sparkles" size={22} />
      </div>
      <p>{text}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Feature skeleton (Step 3)                                          */
/* ------------------------------------------------------------------ */

/**
 * Honest, consistent skeleton view for not-yet-implemented feature routes.
 * Presentation only: shows the area title, its future responsibility (from
 * the navigation description), current availability ("no formal capability
 * yet"), and the expected future slice. Navigation back to the owning space
 * is the only allowed action — no fake data, no fake business operations.
 */
function FeatureSkeleton({ item, space, onNavigate }) {
  const futureSlice = item.futureSliceKey ? t(item.futureSliceKey) : t('featureSkeleton.laterSlice')
  return (
    <div className="page">
      <PageHeader title={item.label} subtitle={t('featureSkeleton.status')} />
      <div className="card ui-liquid-glass page-glass-surface feature-skeleton" data-material="regular">
        <div className="feature-skeleton-icon">
          <Icon name="sparkles" size={22} />
        </div>

        <div className="feature-skeleton-block">
          <span className="field-label">{t('featureSkeleton.willDo')}</span>
          <p className="feature-skeleton-description">{item.description}</p>
        </div>

        <div className="feature-skeleton-block">
          <span className="field-label">{t('featureSkeleton.currentAvailability')}</span>
          <p className="feature-skeleton-availability">{t('featureSkeleton.notAvailable')}</p>
        </div>

        <div className="feature-skeleton-block">
          <span className="field-label">{t('featureSkeleton.futureSlice')}</span>
          <span className="chip chip-neutral">{futureSlice}</span>
        </div>

        {space && (
          <button type="button" className="btn btn-secondary" onClick={() => onNavigate(space.route)}>
            <Icon name="chevronLeft" size={16} />
            {t('featureSkeleton.backToSpace', { space: space.label })}
          </button>
        )}
      </div>
    </div>
  )
}



export default function App() {
  const [route, setRoute] = useState('home')
  const [selectedProject, setSelectedProject] = useState(null)
  const [appearance, setAppearance] = useState(null)
  const [systemDark, setSystemDark] = useState(() => prefersDark())
  const [activeGlobalPanel, setActiveGlobalPanel] = useState(null)

  const effectiveTheme = appearance ? resolveTheme(appearance.theme, systemDark) : 'light'

  useEffect(() => {
    let alive = true
    api().appearance.get().then((r) => {
      if (alive && r.ok) setAppearance(r.data)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (appearance) applyAppearance(appearance, effectiveTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearance, effectiveTheme])

  // SYSTEM theme: react to OS theme changes while the app is running.
  const followsSystem = Boolean(appearance && appearance.theme === 'system')
  useEffect(() => {
    if (!followsSystem) return undefined
    return watchSystemTheme(setSystemDark)
  }, [followsSystem])

  useEffect(() => {
    if (!activeGlobalPanel) return undefined
    const handleGlobalPanelKeyDown = (event) => {
      if (event.key === 'Escape') setActiveGlobalPanel(null)
    }
    window.addEventListener('keydown', handleGlobalPanelKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalPanelKeyDown)
  }, [activeGlobalPanel])

  // Development-only layout diagnostic: enable in DevTools with
  // `window.__LAYOUT_DEBUG__ = true`, then resize the window. Warns whenever
  // horizontal overflow appears. Never shown in the UI.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.__LAYOUT_DEBUG__) return undefined
    const check = () => {
      const { scrollWidth, clientWidth } = document.documentElement
      if (scrollWidth > clientWidth + 1) {
        console.warn('[layout-debug] horizontal overflow', { scrollWidth, clientWidth })
      }
    }
    window.addEventListener('resize', check)
    check()
    return () => window.removeEventListener('resize', check)
  }, [])

  const navigate = (id) => {
    setRoute(id)
    setSelectedProject(null)
    setActiveGlobalPanel(null)
  }
  const openProject = (id) => {
    setSelectedProject(id)
    setRoute('project')
    setActiveGlobalPanel(null)
  }
  const toggleGlobalPanel = (id) => {
    setActiveGlobalPanel((current) => (current === id ? null : id))
  }
  const closeGlobalPanel = () => setActiveGlobalPanel(null)

  if (!appearance) {
    return (
      <div className="boot">
        <div className="spinner" />
        {t('common.loading')}
      </div>
    )
  }

  const routeNav = findNavigationRoute(route)
  const currentSpace = getSpace(route)
  const spaceLandingRoutes = ['manage', 'library', 'create', 'publish']
  const realRoutes = ['home', 'projects', 'project', 'settings']
  const currentContext = deriveCurrentContext({
    route,
    selectedProject,
    projectTitle: null, // derived from existing renderer state only; Step 2 does not read/store titles
  })
  return (
    <>
      <div className="app-window-background" data-layer="window-environment" aria-hidden="true" />
      <div className="app-shell" data-layer="window">
        <aside className="sidebar ui-liquid-glass" data-material="regular" data-layer="navigation">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="sparkles" size={16} />
          </div>
          <div>
            <div className="brand-name">{t('app.name')}</div>
            <div className="brand-sub">{t('app.tagline')}</div>
          </div>
        </div>

        <SidebarNavigation route={route} navigate={navigate} />

        <div className="sidebar-foot">
          {t('app.name')} · {t('app.version')}
        </div>
        </aside>

        <div className="app-main" data-layer="workspace">
        <main className="main content-workspace" data-layer="content">
          {route === 'home' && <HomePage navigate={openProject} />}
          {spaceLandingRoutes.includes(route) && currentSpace && <SpaceLandingPage space={currentSpace} onNavigate={navigate} />}
          {route === 'projects' && <ProjectsPage openProject={openProject} />}
          {route === 'project' && <ProjectDetailPage projectId={selectedProject} onBack={() => navigate('projects')} />}
          {route === 'settings' && <SettingsPage appearance={appearance} setAppearance={setAppearance} />}
          {!realRoutes.includes(route) && !spaceLandingRoutes.includes(route) && (isFeatureSkeletonRoute(route) && routeNav ? (
            <FeatureSkeleton item={routeNav} space={currentSpace} onNavigate={navigate} />
          ) : (
            <ComingSoon label={routeNav ? routeNav.label : route} />
          ))}
        </main>
        </div>

        <div className="command-layer" data-layer="controls">
          <GlobalUtilityBar activePanel={activeGlobalPanel} onToggle={toggleGlobalPanel} onNavigate={navigate} />
          {activeGlobalPanel === 'main-ai' && (
            <GlobalPanel
              id="main-ai"
              presentation="focus"
              context={currentContext}
              onClose={closeGlobalPanel}
              onNavigate={navigate}
            />
          )}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Home — basic product dashboard (real read-model data only)          */
/* ------------------------------------------------------------------ */

function HomePage({ navigate }) {
  const data = useAsync(async () => {
    const list = await api().projects.list()
    const projects = list.ok ? list.data : []
    const workspaces = await Promise.all(projects.map((p) => api().projects.getWorkspace(p.id)))
    const runtime = await api().runtime.status()
    return { projects, workspaces, runtime }
  }, [])

  if (!data) return <PageLoading />

  const { projects, workspaces, runtime } = data
  const totalTasks = projects.reduce((n, p) => n + p.taskCount, 0)
  const pending = workspaces.reduce((n, ws) => n + (ws.ok ? ws.data.summary.pendingProposalCount : 0), 0)
  const activity = workspaces
    .flatMap((ws) => (ws.ok ? ws.data.activity : []))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8)
  const rt = runtimeView(runtime)

  return (
    <div className="page">
      <PageHeader title={t('home.title')} subtitle={t('home.subtitle')} />

      <div className="stat-grid">
          <div className="card ui-liquid-glass page-glass-surface stat-card" data-material="regular">
          <span className="stat-label">{t('home.projects')}</span>
          <span className="stat-value">{projects.length}</span>
        </div>
          <div className="card ui-liquid-glass page-glass-surface stat-card" data-material="regular">
          <span className="stat-label">{t('home.tasks')}</span>
          <span className="stat-value">{totalTasks}</span>
        </div>
          <div className="card ui-liquid-glass page-glass-surface stat-card" data-material="regular">
          <span className="stat-label">{t('home.pendingProposals')}</span>
          <span className="stat-value">{pending}</span>
        </div>
          <div className="card ui-liquid-glass page-glass-surface stat-card" data-material="regular">
          <span className="stat-label">{t('home.localAI')}</span>
          <span className="stat-value small ai-stat">
            <span className={`status-dot ${rt.stateKey}`} />
            {rt.state}
          </span>
          <span className="stat-sub">
            {rt.mode} · {rt.external}
          </span>
        </div>
      </div>

      <Section title={t('home.recentProjects')}>
        {projects.length === 0 ? (
          <Empty text={t('home.noProjects')} />
        ) : (
          <div className="project-grid">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={() => navigate(p.id)} />
            ))}
          </div>
        )}
      </Section>

      <Section title={t('home.recentActivity')}>
        {activity.length === 0 ? (
          <Empty text={t('home.noActivity')} />
        ) : (
          <div className="card ui-liquid-glass page-glass-surface list-card" data-material="regular">
            {activity.map((item, i) => (
              <ActivityRow key={`${item.kind}-${item.id}-${i}`} item={item} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

function ProjectsPage({ openProject }) {
  const projects = useAsync(() => api().projects.list(), [])
  if (!projects) return <PageLoading />
  if (!projects.ok) return <PageError error={projects.error} />

  return (
    <div className="page">
      <PageHeader title={t('projects.title')} subtitle={t('projects.subtitle')} />
      {projects.data.length === 0 ? (
        <Empty text={t('projects.empty')} />
      ) : (
        <div className="project-grid">
          {projects.data.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={() => openProject(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Project detail                                                      */
/* ------------------------------------------------------------------ */

function ProjectDetailPage({ projectId, onBack }) {
  const [ws, setWs] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    api().projects.getWorkspace(projectId).then(setWs)
  }, [projectId])

  useEffect(reload, [reload])

  if (!ws) return <PageLoading />
  if (!ws.ok) return <PageError error={ws.error} />

  const data = ws.data
  const pending = data.proposals.filter((p) => p.status === 'pending-approval')

  const propose = async () => {
    setBusy(true)
    setError(null)
    const r = await api().projects.proposeNextStep(projectId)
    setBusy(false)
    if (!r.ok) setError(r.error)
    reload()
  }

  const decide = async (proposalId, action) => {
    setBusy(true)
    setError(null)
    const r = action === 'approve' ? await api().proposals.approve(proposalId) : await api().proposals.reject(proposalId)
    setBusy(false)
    if (!r.ok) setError(r.error)
    reload()
  }

  return (
    <div className="page">
      <button type="button" className="btn btn-ghost detail-page-back" onClick={onBack}>
        <Icon name="chevronLeft" size={16} />
        {t('common.back')}
      </button>

      <div className="detail-header">
        <div>
          <h1 className="page-title">{displayTitle(data.project)}</h1>
          <p className="page-subtitle">
            {t('projectDetail.taskCount', { n: data.summary.taskCount })} ·{' '}
            {t('projectDetail.proposalCount', { n: data.summary.pendingProposalCount })}
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={propose}>
          {busy ? t('projectDetail.proposing') : t('projectDetail.proposeNextStep')}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error.code}
          {error.message ? `: ${error.message}` : ''}
        </div>
      )}

      <div className="detail-grid">
        <div>
          <Section title={t('projectDetail.tasks')}>
            {data.tasks.length === 0 ? (
              <Empty text={t('projectDetail.noTasks')} />
            ) : (
                <div className="card ui-liquid-glass page-glass-surface list-card" data-material="regular">
                {data.tasks.map((task) => (
                  <div key={task.id} className="list-row">
                    <span className="grow">{task.title}</span>
                    <span className="chip chip-neutral">{taskStatusLabel(task.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div>
          <Section title={t('projectDetail.pendingProposals')}>
            {pending.length === 0 ? (
              <div className="card proposal-card proposal-empty-card ui-liquid-glass page-glass-surface" data-material="regular">
                <div className="proposal-empty-state">{t('projectDetail.noPendingProposals')}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pending.map((p) => (
                  <ProposalCard key={p.id} proposal={p} busy={busy} onApprove={() => decide(p.id, 'approve')} onReject={() => decide(p.id, 'reject')} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      <Section title={t('projectDetail.activity')}>
        {data.activity.length === 0 ? (
          <Empty text={t('projectDetail.noActivity')} />
        ) : (
          <div className="card ui-liquid-glass page-glass-surface list-card" data-material="regular">
            {data.activity.map((item, i) => (
              <ActivityRow key={`${item.kind}-${item.id}-${i}`} item={item} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function ProposalCard({ proposal, busy, onApprove, onReject }) {
  return (
    <div className="card proposal-card ui-liquid-glass page-glass-surface" data-material="regular">
      <span className="chip chip-accent" style={{ alignSelf: 'flex-start' }}>
        {proposalStatusLabel(proposal.status)}
      </span>
      <div className="proposal-title">{proposal.title}</div>
      <span className="proposal-label">{t('projectDetail.proposalRationale')}</span>
      <p className="proposal-rationale">{proposal.rationale}</p>
      <div className="proposal-actions">
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={onReject}>
          {t('common.reject')}
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onApprove}>
          {t('projectDetail.approveAndCreateTask')}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Settings — Appearance panel                                         */
/* ------------------------------------------------------------------ */

function SettingsPage({ appearance, setAppearance }) {
  const persistTimer = useRef(null)

  const update = (patch) => {
    // 1) Live: apply the material to the workspace immediately (while dragging).
    const root = document.documentElement
    const next = { ...appearance, ...patch }
    applyFoundationTokens(root, resolveFoundationTokens({
      appearance: root.dataset.foundationTheme || 'light',
      liquidGlassStyle: next.liquidGlassStyle,
      glassStrength: next.glassStrength,
      increasedContrast: root.dataset.increasedContrast === 'true',
      reducedTransparency: root.dataset.reducedTransparency === 'true',
    }))
    // 2) Persist through the existing window.personalOS.v1 contract with a
    //    light trailing debounce, then 3) reconcile with the persisted value.
    setAppearance(next)
    clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(async () => {
      const r = await api().appearance.update(patch)
      if (r.ok) setAppearance(r.data)
    }, 120)
  }

  useEffect(() => () => clearTimeout(persistTimer.current), [])

  return (
    <div className="page">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Section title={t('settings.appearance')}>
        <div className="settings-groups">
          <div className="card ui-liquid-glass page-glass-surface settings-appearance-module" data-material="regular">
            <div className="settings-row settings-mode-row">
              <div className="settings-row-copy">
                <span className="settings-row-title">{t('settings.appearanceMode')}</span>
                <span className="settings-row-description">{t('settings.appearanceModeDescription')}</span>
              </div>
              <div className="segmented" role="group" aria-label={t('settings.appearanceMode')}>
                <button type="button" className={appearance.theme === 'light' ? 'active' : ''} aria-pressed={appearance.theme === 'light'} onClick={() => update({ theme: 'light' })}>
                  {t('settings.themeLight')}
                </button>
                <button type="button" className={appearance.theme === 'dark' ? 'active' : ''} aria-pressed={appearance.theme === 'dark'} onClick={() => update({ theme: 'dark' })}>
                  {t('settings.themeDark')}
                </button>
                <button type="button" className={appearance.theme === 'system' ? 'active' : ''} aria-pressed={appearance.theme === 'system'} onClick={() => update({ theme: 'system' })}>
                  {t('settings.themeSystem')}
                </button>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-copy">
                <span className="settings-row-title">{t('settings.liquidGlass')}</span>
                <span className="settings-row-description">{t('settings.liquidGlassDescription')}</span>
              </div>
              <div className="settings-strength-control">
                <output className="settings-strength-value" htmlFor="glass-strength-slider">{t('settings.glassStrengthValue', { n: appearance.glassStrength ?? 60 })}</output>
                <input
                  id="glass-strength-slider"
                  className="settings-strength-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={appearance.glassStrength ?? 60}
                  aria-label={t('settings.glassStrength')}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={appearance.glassStrength ?? 60}
                  onChange={(event) => update({ glassStrength: Number(event.target.value) })}
                />
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row-copy">
                <span className="settings-row-title">{t('settings.desktopBackground')}</span>
                <span className="settings-row-description">{t('settings.desktopBackgroundDescription')}</span>
              </div>
              <span className="settings-status">{t('settings.desktopBackgroundCurrent')}</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Coming soon                                                         */
/* ------------------------------------------------------------------ */

function ComingSoon({ label }) {
  return (
    <div className="page">
      <PageHeader title={label} subtitle={t('nav.comingSoon')} />
        <div className="card ui-liquid-glass page-glass-surface coming-soon" data-material="regular">
        <div className="coming-soon-icon">
          <Icon name="sparkles" size={22} />
        </div>
        <p>{t('comingSoon.description')}</p>
      </div>
    </div>
  )
}
