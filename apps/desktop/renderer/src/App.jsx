import React, { useCallback, useEffect, useState } from 'react'

const api = () => window.personalOS?.v1

const NAV = [
  { group: 'WORK', items: [{ id: 'home', label: 'Home' }, { id: 'projects', label: 'Projects' }, { id: 'canvas', label: 'Canvas', soon: true }, { id: 'calendar', label: 'Calendar', soon: true }] },
  { group: 'KNOWLEDGE', items: [{ id: 'knowledge', label: 'Knowledge', soon: true }, { id: 'files', label: 'Files', soon: true }] },
  { group: 'AI', items: [{ id: 'agent', label: 'Agent', soon: true }, { id: 'skills', label: 'Skills', soon: true }, { id: 'automations', label: 'Automations', soon: true }, { id: 'memory', label: 'Memory', soon: true }] },
  { group: 'SYSTEM', items: [{ id: 'settings', label: 'Settings' }] },
]

function applyAppearance(appearance) {
  const root = document.documentElement
  const material = appearance.material === 'transparent' ? 'transparent' : 'frosted'
  const blur = material === 'frosted' ? (appearance.frostIntensity / 100) * 30 : 0
  const alpha = material === 'transparent' ? (1 - appearance.transparencyLevel / 100) * 0.6 : 0.62
  root.style.setProperty('--glass-blur', `${blur}px`)
  root.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${alpha.toFixed(3)})`)
  root.style.setProperty('--glass-border', `1px solid rgba(0, 0, 0, ${material === 'transparent' ? 0.04 : 0.08})`)
}

export default function App() {
  const [route, setRoute] = useState('home')
  const [selectedProject, setSelectedProject] = useState(null)
  const [appearance, setAppearance] = useState(null)

  useEffect(() => {
    let alive = true
    api().appearance.get().then((r) => {
      if (alive && r.ok) setAppearance(r.data)
    })
    return () => { alive = false }
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

  if (!appearance) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <aside className="glass" style={{ width: 220, margin: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {NAV.map((group) => (
          <div key={group.group}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', margin: '12px 0 4px' }}>{group.group}</div>
            {group.items.map((item) => (
              <button
                key={item.id}
                className="nav-link"
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', fontWeight: route === item.id ? 700 : 400 }}
                onClick={() => navigate(item.id)}
              >
                {item.label}{item.soon ? ' · Soon' : ''}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, margin: 12, marginLeft: 0, overflow: 'auto', padding: 8 }}>
        {route === 'home' && <HomePage navigate={openProject} />}
        {route === 'projects' && <ProjectsPage openProject={openProject} />}
        {route === 'project' && <ProjectDetailPage projectId={selectedProject} />}
        {route === 'settings' && <SettingsPage appearance={appearance} setAppearance={setAppearance} />}
        {route !== 'home' && route !== 'projects' && route !== 'project' && route !== 'settings' && <ComingSoon />}
      </main>
    </div>
  )
}

function useAsync(fn, deps) {
  const [value, setValue] = useState(null)
  useEffect(() => {
    let alive = true
    fn().then((r) => { if (alive) setValue(r) })
    return () => { alive = false }
  }, deps)
  return value
}

function HomePage({ navigate }) {
  const projects = useAsync(() => api().projects.list(), [])
  const runtime = useAsync(() => api().runtime.status(), [])

  if (!projects || !runtime) return <p>Loading…</p>
  const total = projects.ok ? projects.data : []
  const pending = total.reduce((n, p) => n + 0, 0) // pending count comes from detail; shown in Projects detail
  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2>Home</h2>
      <p>Projects: <strong>{total.length}</strong></p>
      <p>Local AI: <strong>{runtime.ok ? runtime.data.mode : 'unknown'}</strong> (external model: {runtime.ok && runtime.data.externalModel ? 'yes' : 'no'})</p>
      {total.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No projects yet.</p>
      ) : (
        <ul>
          {total.map((p) => (
            <li key={p.id}>
              <button className="nav-link" style={{ background: 'transparent', padding: 4 }} onClick={() => navigate(p.id)}>
                {p.title} — {p.taskCount} task{p.taskCount === 1 ? '' : 's'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProjectsPage({ openProject }) {
  const projects = useAsync(() => api().projects.list(), [])
  if (!projects) return <p>Loading…</p>
  if (!projects.ok) return <p>Error: {projects.error.code}</p>
  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2>Projects</h2>
      {projects.data.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No projects yet.</p>
      ) : (
        projects.data.map((p) => (
          <button key={p.id} className="glass nav-link" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 16 }} onClick={() => openProject(p.id)}>
            <strong>{p.title}</strong>
            <div style={{ color: 'var(--text-secondary)' }}>{p.taskCount} tasks · {p.status}</div>
          </button>
        ))
      )}
    </div>
  )
}

function ProjectDetailPage({ projectId }) {
  const [ws, setWs] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    api().projects.getWorkspace(projectId).then(setWs)
  }, [projectId])

  useEffect(reload, [reload])

  if (!ws) return <p>Loading…</p>
  if (!ws.ok) return <p>Error: {ws.error.code}</p>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass" style={{ padding: 24 }}>
        <h2>{data.project.title}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{data.summary.taskCount} tasks · {data.summary.pendingProposalCount} pending proposal</p>
        <button className="primary" disabled={busy} onClick={propose}>{busy ? 'Working…' : 'AI 建议下一步'}</button>
        {error && <p style={{ color: '#b3261e' }}>{error.code}: {error.message}</p>}
      </div>

      {pending.map((p) => (
        <ProposalCard key={p.id} proposal={p} busy={busy} onApprove={() => decide(p.id, 'approve')} onReject={() => decide(p.id, 'reject')} />
      ))}

      <div className="glass" style={{ padding: 24 }}>
        <h3>Tasks</h3>
        {data.tasks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No tasks yet.</p>
        ) : (
          data.tasks.map((task) => <div key={task.id} style={{ padding: '6px 0' }}>{task.title} · <span style={{ color: 'var(--text-secondary)' }}>{task.status}</span></div>)
        )}
      </div>

      <ActivityPanel items={data.activity} />
    </div>
  )
}

function ProposalCard({ proposal, busy, onApprove, onReject }) {
  return (
    <div className="glass" style={{ padding: 20, border: '1px solid var(--accent-soft)' }}>
      <div style={{ color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>Pending Approval</div>
      <h3 style={{ margin: 0 }}>{proposal.title}</h3>
      <p style={{ color: 'var(--text-secondary)' }}>{proposal.rationale}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={busy} onClick={onReject}>Reject</button>
        <button className="primary" disabled={busy} onClick={onApprove}>Approve & Create Task</button>
      </div>
    </div>
  )
}

function ActivityPanel({ items }) {
  return (
    <div className="glass" style={{ padding: 24 }}>
      <h3>Activity</h3>
      {!items || items.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No activity recorded.</p>
      ) : (
        items.map((item, i) => (
          <div key={`${item.kind}-${item.id}-${i}`} style={{ padding: '6px 0' }}>
            <span style={{ color: 'var(--accent)' }}>[{item.kind}]</span> {item.title} · <span style={{ color: 'var(--text-secondary)' }}>{item.status}</span>
          </div>
        ))
      )}
    </div>
  )
}

function SettingsPage({ appearance, setAppearance }) {
  const update = async (patch) => {
    const r = await api().appearance.update(patch)
    if (r.ok) setAppearance(r.data)
  }
  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2>Appearance</h2>
      <label style={{ display: 'block', margin: '16px 0 8px' }}>Material Style</label>
      <select value={appearance.material} onChange={(e) => update({ material: e.target.value })}>
        <option value="frosted">Frosted</option>
        <option value="transparent">Transparent</option>
      </select>

      <label style={{ display: 'block', margin: '16px 0 8px' }}>Frost Intensity (blur) — {appearance.frostIntensity}</label>
      <input type="range" min="0" max="100" value={appearance.frostIntensity} onChange={(e) => update({ frostIntensity: Number(e.target.value) })} />

      <label style={{ display: 'block', margin: '16px 0 8px' }}>Transparency Level (opacity) — {appearance.transparencyLevel}</label>
      <input type="range" min="0" max="100" value={appearance.transparencyLevel} onChange={(e) => update({ transparencyLevel: Number(e.target.value) })} />

      <label style={{ display: 'block', margin: '16px 0 8px' }}>Theme</label>
      <select value={appearance.theme} onChange={(e) => update({ theme: e.target.value })}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  )
}

function ComingSoon() {
  return (
    <div className="glass" style={{ padding: 24 }}>
      <h2>Coming Soon</h2>
      <p style={{ color: 'var(--text-secondary)' }}>This page is not implemented in the first visible slice.</p>
    </div>
  )
}
