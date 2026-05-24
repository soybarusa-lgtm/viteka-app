import { useDashboard } from '../hooks/useDashboard'

const PRIORITY_DOT = {
  urgent: 'bg-red-400',
  high:   'bg-orange-300',
  medium: 'bg-amber-300',
  low:    'bg-gray-300',
}

const STATUS_MAP = {
  active:      { label: 'Activo',      bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  in_progress: { label: 'En curso',    bg: 'bg-sky-50',      text: 'text-sky-700'     },
  pending:     { label: 'Pendiente',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  blocked:     { label: 'Bloqueado',   bg: 'bg-red-50',      text: 'text-red-600'     },
  review:      { label: 'Revisión',    bg: 'bg-violet-50',   text: 'text-violet-700'  },
  completed:   { label: 'Finalizado',  bg: 'bg-gray-100',    text: 'text-gray-400'    },
  open:        { label: 'Abierta',     bg: 'bg-red-50',      text: 'text-red-600'     },
  resolved:    { label: 'Resuelta',    bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  closed:      { label: 'Cerrada',     bg: 'bg-gray-100',    text: 'text-gray-400'    },
}

function Badge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-400' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function Dot({ priority }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT[priority] || 'bg-gray-300'}`} />
}

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 60)   return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  return `${Math.floor(m / 1440)}d`
}

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function Skeleton() {
  return (
    <div className="animate-pulse px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-6">
      <div className="h-14 bg-gray-200/60 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200/60 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-56 bg-gray-200/60 rounded-2xl" />
        <div className="h-56 bg-gray-200/60 rounded-2xl" />
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, alert = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 hover:border-gray-300 transition-all duration-150 focus:outline-none"
    >
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl mb-3 sm:mb-4 ${
        alert ? 'bg-red-50 text-red-500' : 'bg-[#f0f7f4] text-[#1c473c]'
      }`}>
        {icon}
      </div>
      <p className={`text-xl sm:text-2xl font-semibold tracking-tight ${
        alert && value > 0 ? 'text-red-500' : 'text-gray-900'
      }`}>{value}</p>
      <p className="mt-0.5 text-[12px] sm:text-[13px] text-gray-500">{label}</p>
      {sub && <p className="mt-1 text-[10px] sm:text-[11px] text-gray-400">{sub}</p>}
    </button>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200/80 overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function SectionHead({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-5 py-4">
      <h2 className="text-sm font-medium text-gray-900">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-xs text-gray-400 hover:text-gray-600 transition">
          {action} →
        </button>
      )}
    </div>
  )
}

export default function Dashboard({ profile, navigate }) {
  const { data, loading, error, refresh } = useDashboard(profile?.company_id)
  const go = (page, params) => navigate(page, params)

  const hora   = new Date().getHours()
  const saludo = hora < 13 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = profile?.full_name?.split(' ')[0] || 'usuario'
  const hoy    = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  const hoyStr = hoy.charAt(0).toUpperCase() + hoy.slice(1)

  if (loading) return <Skeleton />

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={refresh} className="rounded-xl bg-[#1c473c] px-4 py-2 text-sm font-medium text-white hover:bg-[#163a31] transition">
          Reintentar
        </button>
      </div>
    </div>
  )

  const total = data.projectsTotal || 1

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f5f0' }}>
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10 md:pb-12">

        {/* HERO */}
        <div className="mb-6 sm:mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-900">{saludo}, {nombre}</h1>
            <p className="mt-1 text-sm text-gray-400">{hoyStr}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => go('pharmacies')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 sm:px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
              <IcPlus /> <span className="hidden sm:inline">Nueva farmacia</span><span className="sm:hidden">Farmacia</span>
            </button>
            <button onClick={() => go('projects')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-[#1c473c] px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-[#163a31] transition">
              <IcPlus /> <span className="hidden sm:inline">Nuevo proyecto</span><span className="sm:hidden">Proyecto</span>
            </button>
          </div>
        </div>

        {/* KPIs globales */}
        <div className="mb-4 sm:mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon={<IcPharmacy />} label="Farmacias"         value={data.pharmacies}     sub="en cartera"                                                    onClick={() => go('pharmacies')} />
          <KpiCard icon={<IcFolder />}   label="Proyectos activos" value={data.projectsActive} sub={`de ${data.projectsTotal} totales`}                           onClick={() => go('projects')} />
          <KpiCard icon={<IcTask />}     label="Tareas pendientes" value={data.tasksPending}    sub={data.tasksOverdue > 0 ? `${data.tasksOverdue} vencidas` : 'Al día'} alert={data.tasksOverdue > 0} onClick={() => go('tasks')} />
          <KpiCard icon={<IcAlert />}    label="Incidencias"       value={data.incidentsOpen}  sub="abiertas"                                                      alert={data.incidentsOpen > 0} onClick={() => go('incidents')} />
        </div>

        {/* Fila principal */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <SectionHead title="Proyectos recientes" action="Ver todos" onAction={() => go('projects')} />
            <div className="border-t border-gray-100">
              {data.recentProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-gray-300">
                  <IcFolder className="h-7 w-7" />
                  <p className="text-sm">Sin proyectos</p>
                </div>
              ) : (
                <div>
                  {data.recentProjects.map(p => (
                    <button key={p.id} onClick={() => go('project-detail', { projectId: p.id })}
                      className="flex w-full items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                      <Dot priority={p.priority} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-800">{p.name}</p>
                        <p className="truncate text-[11px] text-gray-400 mt-0.5">{p.pharmacies?.name || '—'}</p>
                      </div>
                      <Badge status={p.status} />
                      <span className="shrink-0 text-[11px] text-gray-400">{fmt(p.due_date)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <SectionHead title="Estado de proyectos" action="Proyectos" onAction={() => go('projects')} />
            <div className="border-t border-gray-100 p-4 sm:p-5 space-y-4">
              {data.projectsByStatus.map(item => {
                const pct = Math.round((item.count / total) * 100)
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium text-gray-700">{item.count}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
              <div className="p-4 text-center">
                <p className="text-xl font-semibold text-gray-900">{data.projectsTotal}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Totales</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xl font-semibold text-[#1c473c]">{data.projectsActive}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Activos</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Fila inferior */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <SectionHead title="Incidencias abiertas" action="Ver todas" onAction={() => go('incidents')} />
            <div className="border-t border-gray-100">
              {data.recentIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-300">
                  <IcCheck className="h-6 w-6 text-emerald-400" />
                  <p className="text-sm text-gray-400">Sin incidencias abiertas</p>
                </div>
              ) : (
                <div>
                  {data.recentIncidents.map(inc => (
                    <button key={inc.id} onClick={() => go('incidents')}
                      className="flex w-full items-start gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                      <Dot priority={inc.priority} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-800">{inc.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{inc.pharmacies?.name || '—'} · {timeAgo(inc.created_at)}</p>
                      </div>
                      <Badge status={inc.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-4 sm:px-5 py-3">
              <span className="text-xs text-gray-400">Checklists en curso</span>
              <span className="text-sm font-medium text-gray-700">{data.checklistsInProgress}</span>
            </div>
          </Card>

          <Card>
            <SectionHead title="Tareas urgentes" action="Ver todas" onAction={() => go('tasks')} />
            <div className="border-t border-gray-100">
              {(!data.urgentTasks || data.urgentTasks.length === 0) ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-300">
                  <IcTask className="h-6 w-6 text-emerald-400" />
                  <p className="text-sm text-gray-400">No hay tareas urgentes</p>
                </div>
              ) : (
                <div>
                  {data.urgentTasks.map(t => (
                    <button key={t.id} onClick={() => go('tasks')}
                      className="flex w-full items-start gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                      <Dot priority={t.priority} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-800">{t.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{t.projects?.name || '—'} · vence {fmt(t.due_date)}</p>
                      </div>
                      <Badge status={t.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 px-4 sm:px-5 py-3">
              <span className="text-xs text-gray-400">Pendientes hoy</span>
              <span className="text-sm font-medium text-gray-700">{data.tasksPending}</span>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}

function IcPlus()                            { return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcPharmacy()                        { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IcFolder({ className = 'h-4 w-4' }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> }
function IcTask({ className = 'h-4 w-4' })   { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> }
function IcAlert()                           { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IcCheck({ className = 'h-4 w-4' })  { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
