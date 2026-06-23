import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  LifebuoyIcon,
  ListBulletIcon,
  Squares2X2Icon,
  TicketIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useOperationalDashboard } from '../hooks/useOperationalDashboard'
import { usePharmacies } from '../hooks/usePharmacies'
import { PROJECT_DIVISIONS, fmtDate } from '../lib/projectManagement'
import { formatShortDate, normalizeKey } from '../lib/operationalDashboardStatus'

function displayName(profile, session) {
  const meta = session?.user?.user_metadata || {}
  const value = profile?.full_name || profile?.name || meta.full_name || meta.name || session?.user?.email || 'usuario'
  return String(value).trim().split(/\s+/)[0] || 'usuario'
}

function statusLabel(status) {
  const key = normalizeKey(status)
  if (['en_progreso', 'in_progress', 'active'].includes(key)) return 'En curso'
  if (['esperando_cliente', 'esperando_proveedor', 'paused'].includes(key)) return 'En espera'
  if (['blocked', 'bloqueado'].includes(key)) return 'Bloqueado'
  if (['completed', 'closed', 'cerrado'].includes(key)) return 'Cerrado'
  if (['pending', 'nuevo', 'abierto', 'open'].includes(key)) return 'Pendiente'
  return status || 'Sin estado'
}

function priorityScore(value) {
  return {
    urgent: 4,
    urgente: 4,
    critical: 4,
    critica: 4,
    high: 3,
    alta: 3,
    medium: 2,
    media: 2,
    low: 1,
    baja: 1,
  }[normalizeKey(value)] || 2
}

function relativeTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  const diffHours = Math.max(1, Math.round((Date.now() - date.getTime()) / 36e5))
  if (diffHours < 24) return `hace ${diffHours} h`
  const diffDays = Math.round(diffHours / 24)
  return `hace ${diffDays} d${diffDays === 1 ? 'ía' : 'ías'}`
}

function isOverdue(item) {
  const due = item.dueDate || item.raw?.due_date || item.expected_close_date
  if (!due) return false
  if (['completed', 'closed', 'cerrado', 'cancelled'].includes(normalizeKey(item.status))) return false
  return new Date(due).getTime() < new Date(new Date().toDateString()).getTime()
}

function Metric({ label, value, detail, Icon, tone = 'slate', to }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-50 text-teal-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }
  const body = (
    <article className="h-full rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-950">{value}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-lg p-2 ${tones[tone] || tones.slate}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-extrabold text-slate-950">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function WorkItem({ item }) {
  return (
    <Link to={item.to} className="block rounded-lg border border-slate-200 bg-white px-3 py-3 transition hover:border-slate-300 hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{item.context || item.meta || 'Sin contexto'}</p>
        </div>
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {item.kind}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="rounded-md bg-teal-50 px-2 py-0.5 font-bold text-teal-700">{statusLabel(item.status)}</span>
        <span>{item.assignedTo || 'Sin responsable'}</span>
        <span>{formatShortDate(item.dueDate || item.expected_close_date || item.updatedAt || item.createdAt)}</span>
      </div>
    </Link>
  )
}

function WorkColumn({ title, count, items }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-slate-50">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-2">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{title}</h3>
        <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-500">{count}</span>
      </header>
      <div className="space-y-2 p-2">
        {items.length ? items.slice(0, 4).map(item => <WorkItem key={`${item.kind}-${item.id}`} item={item} />) : (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-8 text-center text-xs text-slate-400">Sin elementos</p>
        )}
      </div>
    </section>
  )
}

function ViewButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-bold transition ${
        active ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
      }`}
    >
      {children}
    </button>
  )
}

export default function DashboardPage() {
  const { profile, session } = useAuth()
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard(profile?.company_id)
  const { pharmacies = [] } = usePharmacies(profile?.company_id)
  const {
    loading,
    warning,
    lastUpdated,
    myPendingTasks,
    generalPendingTasks,
    myPendingSupport,
    generalPendingSupport,
    reload,
  } = useOperationalDashboard()

  const [scope, setScope] = useState('all')
  const [area, setArea] = useState('all')

  const userName = useMemo(() => displayName(profile, session), [profile, session])
  const projects = useMemo(() => dashboardData?.periodProjects || [], [dashboardData?.periodProjects])

  const workItems = useMemo(() => {
    const support = [...myPendingSupport, ...generalPendingSupport].map(item => ({
      ...item,
      kind: 'Ticket',
      area: 'tickets',
      title: item.title,
      context: item.pharmacyName || item.product,
      to: `/soporte/tickets/${item.id}`,
      isMine: myPendingSupport.some(mine => mine.id === item.id),
    }))
    const tasks = [...myPendingTasks, ...generalPendingTasks].map(item => ({
      ...item,
      kind: 'Tarea',
      area: 'tasks',
      title: item.title,
      context: item.pharmacyName || item.assignedTo,
      to: item.projectId ? `/proyectos/${item.projectId}` : '/proyectos',
      isMine: myPendingTasks.some(mine => mine.id === item.id),
    }))
    const projectItems = projects.map(project => ({
      id: project.id,
      kind: 'Proyecto',
      area: 'projects',
      title: project.name,
      context: project.pharmacy_name || 'Sin farmacia',
      status: project.status,
      priority: project.priority,
      expected_close_date: project.expected_close_date,
      createdAt: project.created_at,
      updatedAt: project.updated_at || project.created_at,
      assignedTo: project.assigned_to_name || '',
      to: `/proyectos/${project.id}`,
      isMine: false,
    }))
    return [...support, ...tasks, ...projectItems]
  }, [generalPendingSupport, generalPendingTasks, myPendingSupport, myPendingTasks, projects])

  const filteredItems = useMemo(() => workItems.filter(item => {
    const areaOk = area === 'all' || item.area === area
    const scopeOk = scope === 'all'
      || (scope === 'mine' && item.isMine)
      || (scope === 'unassigned' && !item.assignedTo)
      || (scope === 'high' && priorityScore(item.priority) >= 3)
      || (scope === 'blocked' && (normalizeKey(item.status) === 'blocked' || isOverdue(item)))
    return areaOk && scopeOk
  }), [area, scope, workItems])

  const columns = useMemo(() => {
    const backlog = filteredItems.filter(item => ['pending', 'nuevo', 'abierto', 'open'].includes(normalizeKey(item.status)) || !item.assignedTo)
    const progress = filteredItems.filter(item => ['in_progress', 'en_progreso', 'active'].includes(normalizeKey(item.status)))
    const waiting = filteredItems.filter(item => ['esperando_cliente', 'esperando_proveedor', 'paused'].includes(normalizeKey(item.status)))
    const risk = filteredItems
      .filter(item => priorityScore(item.priority) >= 3 || normalizeKey(item.status) === 'blocked' || isOverdue(item))
      .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
    return [
      { id: 'backlog', title: 'Backlog', items: backlog },
      { id: 'progress', title: 'En curso', items: progress },
      { id: 'waiting', title: 'En espera', items: waiting },
      { id: 'risk', title: 'Riesgo', items: risk },
    ]
  }, [filteredItems])

  const metrics = useMemo(() => ({
    assignedMine: myPendingTasks.length + myPendingSupport.length,
    unassigned: workItems.filter(item => !item.assignedTo && item.area !== 'projects').length,
    inProgress: workItems.filter(item => ['in_progress', 'en_progreso', 'active'].includes(normalizeKey(item.status))).length,
    highPriority: workItems.filter(item => priorityScore(item.priority) >= 3).length,
    activeProjects: projects.filter(project => ['active', 'in_progress'].includes(project.status)).length,
    pharmacies: pharmacies.length,
  }), [myPendingSupport.length, myPendingTasks.length, pharmacies.length, projects, workItems])

  const moduleRows = useMemo(() => PROJECT_DIVISIONS.map(division => {
    const relatedProjects = projects.filter(project => {
      const stagePrefix = String(project.pipeline_stage || '').split(':')[0]
      return project.project_type === division.id || stagePrefix === division.id || (division.id === 'commercial' && !project.project_type && !stagePrefix)
    })
    const active = relatedProjects.filter(project => ['active', 'in_progress'].includes(project.status)).length
    return { ...division, total: relatedProjects.length, active }
  }), [projects])

  const recentActivity = useMemo(() => [...workItems]
    .filter(item => item.updatedAt || item.createdAt)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 6), [workItems])

  const cycleProgress = Math.min(100, Math.round(((metrics.inProgress + metrics.assignedMine) / Math.max(workItems.length, 1)) * 100))

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-3 py-4 sm:px-5 lg:px-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Hola, {userName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filteredItems.length} elementos visibles · {lastUpdated ? `actualizado ${relativeTime(lastUpdated)}` : 'pendiente de actualización'}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {[
              ['all', 'Todo'],
              ['mine', 'Mío'],
              ['unassigned', 'Sin asignar'],
              ['high', 'Prioridad'],
              ['blocked', 'Riesgo'],
            ].map(([id, label]) => (
              <ViewButton key={id} active={scope === id} onClick={() => setScope(id)}>{label}</ViewButton>
            ))}
          </div>
          <select
            value={area}
            onChange={event => setArea(event.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none focus:border-slate-400"
          >
            <option value="all">Todas las áreas</option>
            <option value="tickets">Tickets</option>
            <option value="tasks">Tareas</option>
            <option value="projects">Proyectos</option>
          </select>
          <button type="button" onClick={reload} className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            Actualizar
          </button>
        </div>
      </section>

      {warning || dashboardError ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            {warning ? <p>{warning}</p> : null}
            {dashboardError ? <p>Proyectos: {dashboardError}</p> : null}
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Asignado a mí" value={metrics.assignedMine} detail="tickets y tareas" Icon={UserGroupIcon} tone="teal" to="/soporte/tickets" />
        <Metric label="Sin asignar" value={metrics.unassigned} detail="requiere reparto" Icon={ListBulletIcon} tone="amber" to="/soporte/tickets?status=nuevo" />
        <Metric label="En curso" value={metrics.inProgress} detail="trabajo activo" Icon={ClockIcon} tone="sky" to="/proyectos?status=active" />
        <Metric label="Alta prioridad" value={metrics.highPriority} detail="riesgo operativo" Icon={ExclamationTriangleIcon} tone="rose" to="/soporte/tickets" />
        <Metric label="Proyectos activos" value={metrics.activeProjects} detail="cartera viva" Icon={FolderOpenIcon} tone="emerald" to="/proyectos" />
        <Metric label="Farmacias" value={metrics.pharmacies} detail="red registrada" Icon={BuildingOffice2Icon} tone="slate" to="/farmacias" />
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        {columns.map(column => (
          <WorkColumn key={column.id} title={column.title} count={column.items.length} items={column.items} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Panel
          title="Ciclos y módulos"
          action={<Link to="/planificacion" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950">Abrir <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}
        >
          <div className="grid gap-3 p-3 lg:grid-cols-[0.85fr_1fr]">
            <article className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Ciclo actual</p>
                  <h3 className="mt-2 text-lg font-extrabold">Operación semanal</h3>
                </div>
                <CalendarDaysIcon className="h-6 w-6 text-slate-400" />
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Avance</span>
                  <span>{cycleProgress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-teal-300" style={{ width: `${cycleProgress}%` }} />
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-300">
                {workItems.length} elementos en cola · {metrics.highPriority} en prioridad alta
              </p>
            </article>

            <div className="grid gap-2 sm:grid-cols-2">
              {moduleRows.map(module => (
                <Link key={module.id} to={`/proyectos?type=${module.id}`} className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">{module.label}</p>
                    <Squares2X2Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950">{module.total}</p>
                  <p className="mt-1 text-xs text-slate-500">{module.active} activos</p>
                </Link>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Actividad reciente">
          <div className="divide-y divide-slate-100">
            {recentActivity.length ? recentActivity.map(item => (
              <Link key={`${item.kind}-${item.id}`} to={item.to} className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50">
                <span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500">
                  {item.kind === 'Ticket' ? <TicketIcon className="h-4 w-4" /> : item.kind === 'Proyecto' ? <FolderOpenIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-800">{item.title}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{item.context || item.meta || 'Sin contexto'} · {relativeTime(item.updatedAt || item.createdAt)}</span>
                </span>
              </Link>
            )) : (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Sin actividad reciente</p>
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Proyectos en seguimiento"
          action={<Link to="/proyectos" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950">Ver cartera <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Proyecto</th>
                  <th className="px-4 py-3">Farmacia</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.slice(0, 6).map(project => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Link to={`/proyectos/${project.id}`} className="font-bold text-slate-900 hover:underline">{project.name}</Link></td>
                    <td className="px-4 py-3 text-slate-600">{project.pharmacy_name || 'Sin farmacia'}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">{statusLabel(project.status)}</span></td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(project.expected_close_date || project.created_at)}</td>
                  </tr>
                ))}
                {!projects.length && (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-400">{dashboardLoading ? 'Cargando proyectos...' : 'Sin proyectos visibles'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Pulso de soporte"
          action={<Link to="/soporte/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950">Abrir soporte <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}
        >
          <div className="grid gap-3 p-3 sm:grid-cols-3">
            <Metric label="Tickets" value={workItems.filter(item => item.area === 'tickets').length} detail="abiertos" Icon={LifebuoyIcon} tone="teal" to="/soporte/tickets" />
            <Metric label="Tareas" value={workItems.filter(item => item.area === 'tasks').length} detail="pendientes" Icon={CheckCircleIcon} tone="sky" to="/proyectos" />
            <Metric label="Riesgo" value={columns.find(column => column.id === 'risk')?.items.length || 0} detail="prioridad o bloqueo" Icon={ChartBarIcon} tone="rose" to="/planificacion" />
          </div>
        </Panel>
      </section>
    </div>
  )
}
