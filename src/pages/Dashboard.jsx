import { useDashboard } from '../hooks/useDashboard'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PRIORITY_COLOR = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  medium: 'bg-yellow-400',
  low:    'bg-gray-300',
}

const STATUS_BADGE = {
  active:      { label: 'Activo',      cls: 'badge-teal'   },
  in_progress: { label: 'En curso',    cls: 'badge-teal'   },
  pending:     { label: 'Pendiente',   cls: 'badge-yellow' },
  blocked:     { label: 'Bloqueado',   cls: 'badge-red'    },
  review:      { label: 'En revisión', cls: 'badge-blue'   },
  completed:   { label: 'Finalizado',  cls: 'badge-gray'   },
  open:        { label: 'Abierta',     cls: 'badge-red'    },
  resolved:    { label: 'Resuelta',    cls: 'badge-green'  },
  closed:      { label: 'Cerrada',     cls: 'badge-gray'   },
}

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE[status] || { label: status, cls: 'badge-gray' }
  return <span className={cfg.cls}>{cfg.label}</span>
}

function PriorityDot({ priority }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLOR[priority] || 'bg-gray-300'}`}
      title={priority}
    />
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

// ---------------------------------------------------------------------------
// KpiCard
// ---------------------------------------------------------------------------
function KpiCard({ icon, label, value, sub, accent = 'teal', alert = false }) {
  const iconBg  = alert ? 'bg-red-50'   : `bg-${accent}-50`
  const iconClr = alert ? 'text-red-600' : `text-${accent}-600`
  const valClr  = alert && value > 0 ? 'text-red-600' : 'text-gray-900'
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <span className={iconClr}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`mt-1 text-3xl font-semibold tracking-tight ${valClr}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-32 bg-gray-100" />
        ))}
      </div>
      <div className="card h-64 bg-gray-100" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card h-64 bg-gray-100" />
        <div className="card h-64 bg-gray-100" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard principal
// ---------------------------------------------------------------------------
export default function Dashboard({ profile, navigate }) {
  const { data, loading, error, refresh } = useDashboard(profile?.company_id)

  function go(page, params) { navigate(page, params) }

  const hora = new Date().getHours()
  const saludo = hora < 13 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = profile?.full_name?.split(' ')[0] || 'usuario'

  if (loading) return <Skeleton />

  if (error) return (
    <div className="page-container">
      <div className="card p-8 text-center space-y-3">
        <p className="text-red-500 font-medium">Error al cargar el dashboard</p>
        <p className="text-sm text-gray-400">{error}</p>
        <button onClick={refresh} className="btn-primary">Reintentar</button>
      </div>
    </div>
  )

  const totalProjects = data.projectsTotal || 1

  return (
    <div className="page-container space-y-8">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{saludo}, {nombre} 👋</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de actividad · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => go('pharmacies')} className="btn-secondary">
            <IconPlus /> Nueva farmacia
          </button>
          <button onClick={() => go('projects')} className="btn-primary">
            <IconPlus /> Nuevo proyecto
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<IconPharmacy />}
          label="Farmacias activas"
          value={data.pharmacies}
          sub="clientes en cartera"
          accent="teal"
        />
        <KpiCard
          icon={<IconFolder />}
          label="Proyectos activos"
          value={data.projectsActive}
          sub={`de ${data.projectsTotal} totales`}
          accent="blue"
        />
        <KpiCard
          icon={<IconTask />}
          label="Tareas pendientes"
          value={data.tasksPending}
          sub={data.tasksOverdue > 0 ? `${data.tasksOverdue} vencidas` : 'al día'}
          accent="teal"
          alert={data.tasksOverdue > 0}
        />
        <KpiCard
          icon={<IconAlert />}
          label="Incidencias abiertas"
          value={data.incidentsOpen}
          sub="requieren atención"
          accent="red"
          alert={data.incidentsOpen > 0}
        />
      </div>

      {/* ── Proyectos recientes ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Proyectos recientes</h2>
          <button onClick={() => go('projects')} className="text-xs font-medium text-teal-600 hover:text-teal-700">Ver todos →</button>
        </div>
        {data.recentProjects.length === 0 ? (
          <div className="empty-state py-12">
            <p className="text-sm">No hay proyectos todavía</p>
            <button onClick={() => go('projects')} className="mt-3 btn-primary">Crear proyecto</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table min-w-[520px]">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Farmacia</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {data.recentProjects.map(p => (
                  <tr
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => go('project-detail', { projectId: p.id })}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <PriorityDot priority={p.priority} />
                        <span className="font-medium text-gray-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-500">{p.pharmacies?.name || '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <span className="capitalize text-gray-600 text-xs">{p.priority || '—'}</span>
                    </td>
                    <td className="text-gray-500 text-xs">
                      {p.due_date ? new Date(p.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Fila inferior: Estado proyectos + Incidencias ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* Estado de proyectos */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Estado de proyectos</h2>
            <button onClick={() => go('projects')} className="text-xs font-medium text-teal-600 hover:text-teal-700">Ver todos →</button>
          </div>
          <div className="space-y-3">
            {data.projectsByStatus.map(item => {
              const pct = Math.round((item.count / totalProjects) * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold text-gray-800">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-semibold text-gray-900">{data.projectsTotal}</p>
              <p className="text-xs text-gray-400 mt-0.5">totales</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-semibold text-teal-700">{data.projectsActive}</p>
              <p className="text-xs text-teal-500 mt-0.5">activos</p>
            </div>
          </div>
        </div>

        {/* Incidencias recientes */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Incidencias abiertas</h2>
            <button onClick={() => go('incidents')} className="text-xs font-medium text-teal-600 hover:text-teal-700">Ver todas →</button>
          </div>
          {data.recentIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 space-y-2">
              <IconCheck className="w-8 h-8 text-teal-400" />
              <p className="text-sm">Sin incidencias abiertas 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentIncidents.map(inc => (
                <div
                  key={inc.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => go('incidents')}
                >
                  <PriorityDot priority={inc.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{inc.title}</p>
                    <p className="text-xs text-gray-400">{inc.pharmacies?.name || '—'} · {timeAgo(inc.created_at)}</p>
                  </div>
                  <StatusBadge status={inc.status} />
                </div>
              ))}
            </div>
          )}
          {/* Mini stat */}
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">Checklists en curso</span>
            <span className="text-sm font-semibold text-gray-800">{data.checklistsInProgress}</span>
          </div>
        </div>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function IconPlus() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
}
function IconPharmacy() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
}
function IconFolder() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
}
function IconTask() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
}
function IconAlert() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
}
function IconCheck({ className = 'w-5 h-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
}
