import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  PlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'

const STATUS_LABEL = {
  pending: 'Pendiente',
  active: 'Activo',
  in_progress: 'En curso',
  blocked: 'Bloqueado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
}

const STATUS_COLOR = {
  pending: 'bg-amber-50 text-amber-700',
  active: 'bg-teal-50 text-teal-700',
  in_progress: 'bg-sky-50 text-sky-700',
  blocked: 'bg-rose-50 text-rose-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-slate-100 text-slate-500',
}

const PRIORITY_COLOR = {
  low: 'bg-slate-300',
  medium: 'bg-sky-400',
  high: 'bg-orange-400',
  critical: 'bg-rose-500',
}

const SHORTCUTS = [
  { to: '/farmacias', label: 'Farmacias', Icon: BuildingStorefrontIcon },
  { to: '/personas', label: 'Personas', Icon: UsersIcon },
  { to: '/proyectos', label: 'Proyectos', Icon: FolderOpenIcon },
  { to: '/documentos', label: 'Documentación', Icon: DocumentTextIcon },
]

function dateKey(value) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-')
}

function resolveProjectRange(period, customFrom, customTo) {
  const now = new Date()
  if (period === 'custom') return { from: customFrom, to: customTo }
  if (period === 'year') return { from: dateKey(new Date(now.getFullYear(), 0, 1)), to: dateKey(new Date(now.getFullYear(), 11, 31)) }
  if (period === 'quarter') {
    const firstMonth = Math.floor(now.getMonth() / 3) * 3
    return { from: dateKey(new Date(now.getFullYear(), firstMonth, 1)), to: dateKey(new Date(now.getFullYear(), firstMonth + 3, 0)) }
  }
  return { from: dateKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)) }
}

function fmtDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function Stat({ label, value, alert = false }) {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4">
      <p className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${alert ? 'text-rose-600' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${alert ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

function TaskRow({ task, overdue = false }) {
  const content = (
    <div className="flex items-start gap-3 px-3 py-3 transition hover:bg-slate-50">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-sm font-bold text-slate-800">{task.title}</p>
          {overdue && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">{fmtDate(task.due_date)}</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-400">{task.project_name}{task.pharmacy_name ? ` · ${task.pharmacy_name}` : ''}</p>
      </div>
      <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
    </div>
  )

  return task.project_id ? <Link to={`/proyectos/${task.project_id}`} title={task.description || task.title}>{content}</Link> : content
}

function TaskSection({ title, count, tasks, empty, overdue = false }) {
  return (
    <section>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className={`text-xs font-extrabold uppercase tracking-[0.14em] ${overdue ? 'text-rose-700' : 'text-teal-800'}`}>{title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${overdue ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'}`}>{count}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {tasks.length ? tasks.slice(0, 6).map(task => <TaskRow key={task.id} task={task} overdue={overdue} />) : <p className="px-4 py-5 text-sm text-slate-400">{empty}</p>}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const companyId = profile?.company_id
  const now = new Date()
  const [projectPeriod, setProjectPeriod] = useState('month')
  const [customFrom, setCustomFrom] = useState(dateKey(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [customTo, setCustomTo] = useState(dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)))
  const projectRange = useMemo(() => resolveProjectRange(projectPeriod, customFrom, customTo), [projectPeriod, customFrom, customTo])
  const { data, loading, error } = useDashboard(companyId, { projectFrom: projectRange.from, projectTo: projectRange.to })

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 rounded-2xl border border-teal-900/10 bg-[linear-gradient(120deg,#00695c_0%,#00584f_70%,#0e91a0_100%)] px-5 py-4 text-white shadow-lg shadow-teal-900/10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-teal-100">Centro operativo · {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">Prioridades del día</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/farmacias/nueva" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-teal-800 shadow-sm transition hover:bg-teal-50">
            <PlusIcon className="h-4 w-4" /> Nueva farmacia
          </Link>
          <Link to="/proyectos?create=1&type=commercial" className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-white/20">
            <PlusIcon className="h-4 w-4" /> Nuevo proyecto
          </Link>
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0">
        <Stat label="Farmacias" value={data?.pharmacies ?? 0} />
        <Stat label="Proyectos activos" value={data?.projectsActive ?? 0} />
        <Stat label="Tareas abiertas" value={data?.tasksPending ?? 0} />
        <Stat label="Vencidas" value={data?.tasksOverdue ?? 0} alert={(data?.tasksOverdue ?? 0) > 0} />
      </section>

      <nav aria-label="Accesos directos" className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <span className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Accesos</span>
        {SHORTCUTS.map(({ to, label, Icon }) => (
          <Link key={to} to={to} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800">
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-700">Agenda operativa</p>
              <h2 className="mt-0.5 font-display text-base font-extrabold text-slate-900">Trabajo que requiere atención</h2>
            </div>
            <CalendarDaysIcon className="h-5 w-5 text-teal-700" />
          </div>
          <TaskSection title="Para hoy" count={data?.todayTasks?.length || 0} tasks={data?.todayTasks || []} empty="No hay tareas previstas para hoy." />
          <TaskSection title="Vencidas" count={data?.overdueTasks?.length || 0} tasks={data?.overdueTasks || []} empty="No hay tareas vencidas." overdue />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-700">Proyectos</p>
                <h2 className="mt-0.5 font-display text-base font-extrabold text-slate-900">Actividad por periodo</h2>
              </div>
              <select value={projectPeriod} onChange={event => setProjectPeriod(event.target.value)} className="input w-full py-1.5 text-xs sm:w-auto" aria-label="Periodo de proyectos">
                <option value="month">Mes actual</option>
                <option value="quarter">Trimestre actual</option>
                <option value="year">Año actual</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            {projectPeriod === 'custom' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label><span className="label">Desde</span><input type="date" value={customFrom} onChange={event => setCustomFrom(event.target.value)} className="input py-1.5 text-xs" /></label>
                <label><span className="label">Hasta</span><input type="date" value={customTo} onChange={event => setCustomTo(event.target.value)} className="input py-1.5 text-xs" /></label>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100">
            <div className="bg-white px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Registrados</p><p className="mt-1 text-xl font-extrabold text-slate-900">{data?.periodProjectsTotal ?? 0}</p></div>
            <div className="bg-white px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">En marcha</p><p className="mt-1 text-xl font-extrabold text-teal-700">{data?.projectsByStatus?.[0]?.count ?? 0}</p></div>
          </div>
          <div className="divide-y divide-slate-100">
            {(data?.periodProjects || []).length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400">No hay proyectos creados en este periodo.</p>
            ) : data.periodProjects.slice(0, 5).map(project => (
              <Link key={project.id} to={`/proyectos/${project.id}`} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{project.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{project.pharmacy_name || 'Sin farmacia asignada'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${STATUS_COLOR[project.status] || STATUS_COLOR.pending}`}>{STATUS_LABEL[project.status] || project.status}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
            {(data?.projectsByStatus || []).map(status => (
              <span key={status.label} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${status.color}`} /> {status.label}: {status.count}
              </span>
            ))}
            <Link to="/proyectos" className="ml-auto text-xs font-bold text-teal-700 hover:underline">Ver todos</Link>
          </div>
        </section>
      </div>

      {(data?.tasksOverdue ?? 0) > 0 && (
        <aside className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-900">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-sm"><strong>{data.tasksOverdue} tarea(s) vencida(s).</strong> Conviene revisar su proyecto y actualizar la siguiente acción.</p>
        </aside>
      )}
    </div>
  )
}
