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
function KpiCard({ icon, label, value, sub, accent = '#005643' }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E8EDF2] bg-white p-6">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: accent + '18' }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="mt-5">
        <p className="text-[13px] text-[#94A3B8]">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">{value}</p>
        {sub && <p className="mt-1 text-[12px] text-[#94A3B8]">{sub}</p>}
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-[#E8EDF2] bg-white px-4 py-3 text-[13px] font-medium text-[#334155] transition hover:border-[#005643]/30 hover:bg-[#f0fdf8] hover:text-[#005643]"
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  )
}

function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Activo',      bg: '#DCFCE7', color: '#166534' },
    pending:   { label: 'Pendiente',   bg: '#FEF9C3', color: '#854D0E' },
    blocked:   { label: 'Bloqueado',   bg: '#FEE2E2', color: '#991B1B' },
    review:    { label: 'En revisión', bg: '#DBEAFE', color: '#1E40AF' },
    completed: { label: 'Finalizado',  bg: '#F1F5F9', color: '#475569' },
    cancelled: { label: 'Cancelado',   bg: '#F1F5F9', color: '#94A3B8' },
    in_progress: { label: 'En curso',  bg: '#DCFCE7', color: '#166534' },
  }
  const cfg = map[status] || { label: status, bg: '#F1F5F9', color: '#64748B' }
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

function PriorityDot({ priority }) {
  const map = {
    urgent: '#EF4444',
    high:   '#F97316',
    medium: '#EAB308',
    low:    '#94A3B8',
  }
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: map[priority] || '#94A3B8' }}
      title={priority}
    />
  )
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#E8EDF2]">
        <div
          className="h-full rounded-full bg-[#005643]"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[12px] text-[#94A3B8]">{value}%</span>
    </div>
  )
}

function EmptyRow({ cols, message }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-10 text-center text-sm text-[#94A3B8]">
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
  // KPI calculations
  const stats = useMemo(() => {
    const activeProjects = projects.filter(p =>
      p.status === 'active' || p.status === 'in_progress'
    )
    const pendingChecklists = checklists.filter(c => c.status !== 'completed')
    const blockedTasks = checklists.reduce(
      (acc, c) => acc + (c.stats?.blocked || 0), 0
    )
    const totalTasks = checklists.reduce(
      (acc, c) => acc + (c.stats?.total || 0), 0
    )
    const completedTasks = checklists.reduce(
      (acc, c) => acc + (c.stats?.completed || 0), 0
    )
    const globalProgress = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

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

  // Recent data
  const recentProjects = projects.slice(0, 6)
  const recentChecklists = checklists.slice(0, 5)

  // Projects by status for mini chart
  const byStatus = useMemo(() => [
    { label: 'Activos',     count: projects.filter(p => p.status === 'active').length,    color: '#005643' },
    { label: 'Pendientes',  count: projects.filter(p => p.status === 'pending').length,   color: '#EAB308' },
    { label: 'Bloqueados',  count: projects.filter(p => p.status === 'blocked').length,   color: '#EF4444' },
    { label: 'Finalizados', count: projects.filter(p => p.status === 'completed').length, color: '#94A3B8' },
  ], [projects])

  function go(page) {
    if (onNavigate) onNavigate(page)
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Resumen de actividad del portal de soporte técnico
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction icon="＋" label="Nueva farmacia"  onClick={() => go('clients')} />
          <QuickAction icon="＋" label="Nuevo proyecto"  onClick={() => go('projects')} />
          <QuickAction icon="＋" label="Nueva tarea"     onClick={() => go('tasks')} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<IconPharmacy />}
          label="Farmacias"
          value={stats.totalClients}
          sub="clientes activos"
        />
        <KpiCard
          icon={<IconFolder />}
          label="Proyectos activos"
          value={stats.activeProjects}
          sub={`de ${projects.length} totales`}
        />
        <KpiCard
          icon={<IconChecklist />}
          label="Checklists en curso"
          value={stats.pendingChecklists}
          sub={`${stats.globalProgress}% completado global`}
        />
        <KpiCard
          icon={<IconAlert />}
          label="Tareas bloqueadas"
          value={stats.blockedTasks}
          sub="requieren atención"
          accent="#EF4444"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">

        {/* Projects table */}
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8EDF2]">
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Proyectos recientes</h2>
            <button
              onClick={() => go('projects')}
              className="text-[13px] font-medium text-[#005643] hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  {['Proyecto', 'Farmacia', 'Estado', 'Progreso'].map(h => (
                    <th key={h} className="px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {recentProjects.length === 0 ? (
                  <EmptyRow cols={4} message="No hay proyectos todavía" />
                ) : recentProjects.map(project => (
                  <tr key={project.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <PriorityDot priority={project.priority} />
                        <span className="text-[14px] font-medium text-[#0F172A]">
                          {project.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#64748B]">
                      {project.clients?.pharmacy_name || project.clients?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-6 py-4">
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
          <div className="rounded-2xl border border-[#E8EDF2] bg-white p-6">
            <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Estado proyectos</h2>
            <div className="space-y-3">
              {byStatus.map(item => {
                const total = projects.length || 1
                const pct = Math.round((item.count / total) * 100)
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="text-[#334155]">{item.label}</span>
                      <span className="font-medium text-[#0F172A]">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
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
          <div className="flex-1 rounded-2xl border border-[#E8EDF2] bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">Actividad reciente</h2>
              <button
                onClick={() => go('checklists')}
                className="text-[13px] font-medium text-[#005643] hover:underline"
              >
                Ver →
              </button>
            </div>
            {recentChecklists.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Sin actividad reciente.</p>
            ) : (
              <div className="space-y-3">
                {recentChecklists.map(c => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: c.status === 'completed' ? '#DCFCE7' : '#F1F5F9' }}
                    >
                      <span style={{ color: c.status === 'completed' ? '#166534' : '#94A3B8', fontSize: 13 }}>
                        {c.status === 'completed' ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#0F172A]">{c.title}</p>
                      <p className="text-[12px] text-[#94A3B8]">
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
        <div className="rounded-2xl border border-[#E8EDF2] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Plantillas</h2>
            <button onClick={() => go('checklists')} className="text-[13px] font-medium text-[#005643] hover:underline">Ver →</button>
          </div>
          {templates.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">Sin plantillas todavía.</p>
          ) : (
            <div className="space-y-2">
              {templates.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2">
                  <span className="truncate text-[13px] text-[#334155]">{t.name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-medium text-[#166534]">
                    activa
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global progress */}
        <div className="rounded-2xl border border-[#E8EDF2] bg-white p-6">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-1">Progreso global</h2>
          <p className="text-[12px] text-[#94A3B8] mb-6">Tareas en todos los checklists</p>
          <div className="flex items-center justify-center">
            <CircleProgress value={stats.globalProgress} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-[#F8FAFC] py-3">
              <p className="text-xl font-semibold text-[#0F172A]">{stats.completedTasks}</p>
              <p className="text-[11px] text-[#94A3B8]">completadas</p>
            </div>
            <div className="rounded-xl bg-[#F8FAFC] py-3">
              <p className="text-xl font-semibold text-[#0F172A]">{stats.totalTasks - stats.completedTasks}</p>
              <p className="text-[11px] text-[#94A3B8]">pendientes</p>
            </div>
          </div>
        </div>

        {/* Quick summary */}
        <div className="rounded-2xl border border-[#E8EDF2] bg-white p-6">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Resumen rápido</h2>
          <div className="space-y-4">
            <SummaryRow label="Farmacias registradas" value={clients.length} onClick={() => go('clients')} />
            <SummaryRow label="Proyectos totales" value={projects.length} onClick={() => go('projects')} />
            <SummaryRow label="Checklists totales" value={checklists.length} onClick={() => go('checklists')} />
            <SummaryRow label="Plantillas activas" value={templates.filter(t => t.is_active).length} onClick={() => go('checklists')} />
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
      <circle cx="55" cy="55" r={r} fill="none" stroke="#F1F5F9" strokeWidth="10" />
      <circle
        cx="55" cy="55" r={r}
        fill="none"
        stroke="#005643"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="55" y="59" textAnchor="middle" fontSize="18" fontWeight="600" fill="#0F172A">
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
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-[#F8FAFC]"
    >
      <span className="text-[13px] text-[#64748B]">{label}</span>
      <span className="text-[14px] font-semibold text-[#0F172A]">{value}</span>
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
