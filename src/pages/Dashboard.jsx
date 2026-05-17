import { useMemo } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function KpiCard({ icon, label, value, sub, accent }) {
  const color = accent || 'var(--primary)'
  return (
    <div className="card flex flex-col justify-between">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: color + '22' }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="mt-5">
        <p className="text-[13px]" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
        {sub && <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>{sub}</p>}
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-[13px] font-medium transition"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--surface)',
        color: 'var(--text)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.backgroundColor = 'var(--primary-soft)'
        e.currentTarget.style.color = 'var(--primary)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.backgroundColor = 'var(--surface)'
        e.currentTarget.style.color = 'var(--text)'
      }}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  )
}

function StatusBadge({ status }) {
  const map = {
    active:      { label: 'Activo',      cls: 'badge-green' },
    in_progress: { label: 'En curso',    cls: 'badge-green' },
    pending:     { label: 'Pendiente',   cls: 'badge-amber' },
    blocked:     { label: 'Bloqueado',   cls: 'badge-red'   },
    review:      { label: 'En revisión', cls: 'badge-blue'  },
    completed:   { label: 'Finalizado',  cls: 'badge-gray'  },
    cancelled:   { label: 'Cancelado',   cls: 'badge-gray'  },
  }
  const cfg = map[status] || { label: status, cls: 'badge-gray' }
  return <span className={cfg.cls}>{cfg.label}</span>
}

function PriorityDot({ priority }) {
  const map = {
    urgent: '#EF4444',
    high:   '#F97316',
    medium: '#EAB308',
    low:    'var(--muted)',
  }
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: map[priority] || 'var(--muted)' }}
      title={priority}
    />
  )
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--surface-soft)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, backgroundColor: 'var(--primary)' }}
        />
      </div>
      <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{value}%</span>
    </div>
  )
}

function EmptyRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
        {message}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard({
  clients = [],
  projects = [],
  templates = [],
  checklists = [],
  onNavigate,
}) {
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p =>
      p.status === 'active' || p.status === 'in_progress'
    )
    const pendingChecklists = checklists.filter(c => c.status !== 'completed')
    const blockedTasks = checklists.reduce((acc, c) => acc + (c.stats?.blocked || 0), 0)
    const totalTasks = checklists.reduce((acc, c) => acc + (c.stats?.total || 0), 0)
    const completedTasks = checklists.reduce((acc, c) => acc + (c.stats?.completed || 0), 0)
    const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalClients: clients.length,
      activeProjects: activeProjects.length,
      pendingChecklists: pendingChecklists.length,
      blockedTasks,
      globalProgress,
      totalTasks,
      completedTasks,
    }
  }, [clients, projects, checklists])

  const recentProjects  = projects.slice(0, 6)
  const recentChecklists = checklists.slice(0, 5)

  const byStatus = useMemo(() => [
    { label: 'Activos',     count: projects.filter(p => p.status === 'active').length,    color: 'var(--primary)' },
    { label: 'Pendientes',  count: projects.filter(p => p.status === 'pending').length,   color: '#EAB308' },
    { label: 'Bloqueados',  count: projects.filter(p => p.status === 'blocked').length,   color: 'var(--danger)' },
    { label: 'Finalizados', count: projects.filter(p => p.status === 'completed').length, color: 'var(--muted)' },
  ], [projects])

  function go(page) {
    if (onNavigate) onNavigate(page)
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title text-2xl">Dashboard</h1>
          <p className="page-subtitle">Resumen de actividad del portal de soporte técnico</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction icon="＋" label="Nueva farmacia"  onClick={() => go('clients')} />
          <QuickAction icon="＋" label="Nuevo proyecto"  onClick={() => go('projects')} />
          <QuickAction icon="＋" label="Nueva tarea"     onClick={() => go('tasks')} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={<IconPharmacy />}  label="Farmacias"          value={stats.totalClients}        sub="clientes activos" />
        <KpiCard icon={<IconFolder />}    label="Proyectos activos"  value={stats.activeProjects}      sub={`de ${projects.length} totales`} />
        <KpiCard icon={<IconChecklist />} label="Checklists en curso" value={stats.pendingChecklists}  sub={`${stats.globalProgress}% completado global`} />
        <KpiCard icon={<IconAlert />}     label="Tareas bloqueadas"  value={stats.blockedTasks}        sub="requieren atención" accent="var(--danger)" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">

        {/* Projects table */}
        <div className="table-wrap overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Proyectos recientes</h2>
            <button
              onClick={() => go('projects')}
              className="text-[13px] font-medium hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base min-w-[560px]">
              <thead>
                <tr>
                  {['Proyecto', 'Farmacia', 'Estado', 'Progreso'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentProjects.length === 0 ? (
                  <EmptyRow cols={4} message="No hay proyectos todavía" />
                ) : recentProjects.map(project => (
                  <tr key={project.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <PriorityDot priority={project.priority} />
                        <span className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
                          {project.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-[13px]" style={{ color: 'var(--muted)' }}>
                      {project.clients?.pharmacy_name || project.clients?.name || '—'}
                    </td>
                    <td><StatusBadge status={project.status} /></td>
                    <td>
                      <ProgressBar
                        value={
                          project.status === 'completed' ? 100 :
                          project.status === 'active'    ? 60  :
                          project.status === 'pending'   ? 10  : 30
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Status breakdown */}
          <div className="card">
            <h2 className="text-[15px] font-semibold mb-4" style={{ color: 'var(--text)' }}>Estado proyectos</h2>
            <div className="space-y-3">
              {byStatus.map(item => {
                const total = projects.length || 1
                const pct = Math.round((item.count / total) * 100)
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span style={{ color: 'var(--text)' }}>{item.label}</span>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--surface-soft)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent checklists */}
          <div className="card flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Actividad reciente</h2>
              <button
                onClick={() => go('checklists')}
                className="text-[13px] font-medium hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Ver →
              </button>
            </div>
            {recentChecklists.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin actividad reciente.</p>
            ) : (
              <div className="space-y-3">
                {recentChecklists.map(c => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: c.status === 'completed' ? 'var(--primary-soft)' : 'var(--surface-soft)',
                      }}
                    >
                      <span style={{ color: c.status === 'completed' ? 'var(--primary)' : 'var(--muted)', fontSize: 13 }}>
                        {c.status === 'completed' ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.title}</p>
                      <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                        {c.projects?.clients?.pharmacy_name || c.projects?.name || 'Sin proyecto'}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: templates + stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Templates */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Plantillas</h2>
            <button onClick={() => go('checklists')} className="text-[13px] font-medium hover:underline" style={{ color: 'var(--primary)' }}>Ver →</button>
          </div>
          {templates.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin plantillas todavía.</p>
          ) : (
            <div className="space-y-2">
              {templates.slice(0, 5).map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'var(--surface-soft)' }}
                >
                  <span className="truncate text-[13px]" style={{ color: 'var(--text)' }}>{t.name}</span>
                  <span className="badge-green ml-2 shrink-0">activa</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global progress */}
        <div className="card">
          <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Progreso global</h2>
          <p className="text-[12px] mb-6" style={{ color: 'var(--muted)' }}>Tareas en todos los checklists</p>
          <div className="flex items-center justify-center">
            <CircleProgress value={stats.globalProgress} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl py-3" style={{ backgroundColor: 'var(--surface-soft)' }}>
              <p className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{stats.completedTasks}</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>completadas</p>
            </div>
            <div className="rounded-xl py-3" style={{ backgroundColor: 'var(--surface-soft)' }}>
              <p className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{stats.totalTasks - stats.completedTasks}</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>pendientes</p>
            </div>
          </div>
        </div>

        {/* Quick summary */}
        <div className="card">
          <h2 className="text-[15px] font-semibold mb-4" style={{ color: 'var(--text)' }}>Resumen rápido</h2>
          <div className="space-y-4">
            <SummaryRow label="Farmacias registradas"  value={clients.length}                              onClick={() => go('clients')} />
            <SummaryRow label="Proyectos totales"       value={projects.length}                             onClick={() => go('projects')} />
            <SummaryRow label="Checklists totales"      value={checklists.length}                           onClick={() => go('checklists')} />
            <SummaryRow label="Plantillas activas"      value={templates.filter(t => t.is_active).length}  onClick={() => go('checklists')} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Circular progress
// ---------------------------------------------------------------------------
function CircleProgress({ value = 0 }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width="120" height="120" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--surface-soft)" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="55" y="59" textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--text)">
        {value}%
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Summary row
// ---------------------------------------------------------------------------
function SummaryRow({ label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[var(--surface-soft)]"
    >
      <span className="text-[13px]" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{value}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------
function IconPharmacy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconChecklist() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
