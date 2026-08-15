import React, { useCallback, useEffect, useRef, useState } from 'react'
import { t } from './i18n/index.mjs'
import { computeGlassTokens, applyGlassTokens } from './glass-tokens.mjs'

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
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
}

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Navigation (zh-CN)                                                 */
/* ------------------------------------------------------------------ */

const NAV = [
  {
    group: t('nav.work'),
    items: [
      { id: 'home', icon: 'home', label: t('nav.home') },
      { id: 'projects', icon: 'grid', label: t('nav.projects') },
      { id: 'canvas', icon: 'layout', label: t('nav.canvas'), soon: true },
      { id: 'calendar', icon: 'calendar', label: t('nav.calendar'), soon: true },
    ],
  },
  {
    group: t('nav.knowledge'),
    items: [
      { id: 'knowledge', icon: 'book', label: t('nav.knowledgeBase'), soon: true },
      { id: 'files', icon: 'folder', label: t('nav.files'), soon: true },
    ],
  },
  {
    group: t('nav.ai'),
    items: [
      { id: 'agent', icon: 'sparkles', label: t('nav.agent'), soon: true },
      { id: 'skills', icon: 'zap', label: t('nav.skills'), soon: true },
      { id: 'automations', icon: 'repeat', label: t('nav.automations'), soon: true },
      { id: 'memory', icon: 'database', label: t('nav.memory'), soon: true },
    ],
  },
  {
    group: t('nav.system'),
    items: [{ id: 'settings', icon: 'settings', label: t('nav.settings') }],
  },
]

const ROUTE_IDS = ['home', 'projects', 'project', 'settings']

/* ------------------------------------------------------------------ */
/* Appearance -> glass tokens                                          */
/* ------------------------------------------------------------------ */

function applyAppearance(appearance) {
  applyGlassTokens(computeGlassTokens(appearance))
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
      <div className="card boot" style={{ minHeight: 240 }}>
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
    <button type="button" className="card card-hover project-card" onClick={onOpen}>
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

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [route, setRoute] = useState('home')
  const [selectedProject, setSelectedProject] = useState(null)
  const [appearance, setAppearance] = useState(null)

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
    if (appearance) applyAppearance(appearance)
  }, [appearance])

  const navigate = (id) => {
    setRoute(id)
    setSelectedProject(null)
  }
  const openProject = (id) => {
    setSelectedProject(id)
    setRoute('project')
  }

  if (!appearance) {
    return (
      <div className="boot">
        <div className="spinner" />
        {t('common.loading')}
      </div>
    )
  }

  const routeNav = NAV.flatMap((g) => g.items).find((item) => item.id === route)

  return (
    <div className="app-shell">
      <aside className="sidebar card">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="sparkles" size={16} />
          </div>
          <div>
            <div className="brand-name">{t('app.name')}</div>
            <div className="brand-sub">{t('app.tagline')}</div>
          </div>
        </div>

        {NAV.map((group) => (
          <div key={group.group}>
            <div className="nav-group-label">{group.group}</div>
            {group.items.map((item) => (
              <button key={item.id} type="button" className={`nav-item${route === item.id ? ' active' : ''}`} onClick={() => navigate(item.id)}>
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {item.soon && <span className="soon-chip">{t('nav.comingSoon')}</span>}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-foot">
          {t('app.name')} · {t('app.version')}
        </div>
      </aside>

      <main className="main">
        {route === 'home' && <HomePage navigate={openProject} />}
        {route === 'projects' && <ProjectsPage openProject={openProject} />}
        {route === 'project' && <ProjectDetailPage projectId={selectedProject} onBack={() => navigate('projects')} />}
        {route === 'settings' && <SettingsPage appearance={appearance} setAppearance={setAppearance} />}
        {!ROUTE_IDS.includes(route) && <ComingSoon label={routeNav ? routeNav.label : route} />}
      </main>
    </div>
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
        <div className="card stat-card">
          <span className="stat-label">{t('home.projects')}</span>
          <span className="stat-value">{projects.length}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">{t('home.tasks')}</span>
          <span className="stat-value">{totalTasks}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">{t('home.pendingProposals')}</span>
          <span className="stat-value">{pending}</span>
        </div>
        <div className="card stat-card">
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
          <div className="card list-card">
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
      <button type="button" className="btn btn-ghost" style={{ margin: '4px 0 8px -10px' }} onClick={onBack}>
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
              <div className="card list-card">
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
              <Empty text={t('projectDetail.noPendingProposals')} />
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
          <div className="card list-card">
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
    <div className="card proposal-card">
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
    applyGlassTokens(computeGlassTokens({ ...appearance, ...patch }))
    // 2) Persist through the existing window.personalOS.v1 contract with a
    //    light trailing debounce, then 3) reconcile with the persisted value.
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

      <div className="card settings-card">
        <Section title={t('settings.appearance')}>
          <div className="field">
            <span className="field-label">{t('settings.glassMaterial')}</span>
            <div className="segmented">
              <button type="button" className={appearance.material === 'frosted' ? 'active' : ''} onClick={() => update({ material: 'frosted' })}>
                {t('settings.frosted')}
              </button>
              <button type="button" className={appearance.material === 'transparent' ? 'active' : ''} onClick={() => update({ material: 'transparent' })}>
                {t('settings.transparent')}
              </button>
            </div>
          </div>

          <div className="field">
            <div className="field-label-row">
              <span>{t('settings.frostIntensity')}</span>
              <span className="field-value">{appearance.frostIntensity}</span>
            </div>
            <input type="range" min="0" max="100" value={appearance.frostIntensity} onChange={(e) => update({ frostIntensity: Number(e.target.value) })} />
          </div>

          <div className="field">
            <div className="field-label-row">
              <span>{t('settings.transparencyLevel')}</span>
              <span className="field-value">{appearance.transparencyLevel}</span>
            </div>
            <input type="range" min="0" max="100" value={appearance.transparencyLevel} onChange={(e) => update({ transparencyLevel: Number(e.target.value) })} />
          </div>

          <div className="field">
            <span className="field-label">{t('settings.theme')}</span>
            <select value={appearance.theme} onChange={(e) => update({ theme: e.target.value })}>
              <option value="light">{t('settings.themeLight')}</option>
              <option value="dark">{t('settings.themeDark')}</option>
              <option value="system">{t('settings.themeSystem')}</option>
            </select>
          </div>
        </Section>
      </div>
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
      <div className="card coming-soon">
        <div className="coming-soon-icon">
          <Icon name="sparkles" size={22} />
        </div>
        <p>{t('comingSoon.description')}</p>
      </div>
    </div>
  )
}
