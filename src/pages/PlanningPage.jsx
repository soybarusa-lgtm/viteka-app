import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  LifebuoyIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  TicketIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useOperationalDashboard } from '../hooks/useOperationalDashboard'
import { usePharmacies } from '../hooks/usePharmacies'
import { PROJECT_DIVISIONS } from '../lib/projectManagement'
import { normalizeKey } from '../lib/operationalDashboardStatus'

function statusLabel(status) {
  const key = normalizeKey(status)
  if (['active', 'in_progress', 'en_progreso'].includes(key)) return 'En curso'
  if (['pending', 'nuevo', 'abierto', 'open'].includes(key)) return 'Pendiente'
  if (['blocked', 'bloqueado'].includes(key)) return 'Bloqueado'
  if (['completed', 'closed', 'cerrado'].includes(key)) return 'Finalizado'
  if (['paused', 'esperando_cliente', 'esperando_proveedor'].includes(key)) return 'En espera'
  return status || 'Sin estado'
}

function priorityScore(value) {
  return {
    urgent: 4,
    urgente: 4,
    critical: 4,
    high: 3,
    alta: 3,
    medium: 2,
    media: 2,
    low: 1,
    baja: 1,
  }[normalizeKey(value)] || 2
}

function isOpenStatus(status) {
  return !['completed', 'closed', 'cerrado', 'cancelled', 'archivado'].includes(normalizeKey(status))
}

function ProgressBar({ value, tone = 'bg-slate-950' }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function TabButton({ active, children, onClick, Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition ${
        active ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

function Stat({ label, value, detail }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  )
}

function CycleCard({ cycle }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{cycle.range}</p>
          <h3 className="mt-1 text-base font-extrabold text-slate-950">{cycle.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{cycle.focus}</p>
        </div>
        <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
          <CalendarDaysIcon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{cycle.done} cerrados</span>
          <span>{cycle.progress}%</span>
        </div>
        <ProgressBar value={cycle.progress} tone={cycle.tone} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <span className="rounded-lg bg-slate-50 px-2 py-2"><b className="block text-slate-900">{cycle.scope}</b><span className="text-slate-400">alcance</span></span>
        <span className="rounded-lg bg-slate-50 px-2 py-2"><b className="block text-slate-900">{cycle.risk}</b><span className="text-slate-400">riesgo</span></span>
        <span className="rounded-lg bg-slate-50 px-2 py-2"><b className="block text-slate-900">{cycle.waiting}</b><span className="text-slate-400">espera</span></span>
      </div>
    </article>
  )
}

function ModuleCard({ module }) {
  return (
    <Link to={module.to} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Módulo</p>
          <h3 className="mt-1 text-base font-extrabold text-slate-950">{module.label}</h3>
          <p className="mt-1 text-sm text-slate-500">{module.description}</p>
        </div>
        <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
          <Squares2X2Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
        <span className="rounded-lg bg-slate-50 px-2 py-2"><b className="block text-slate-900">{module.projects}</b><span className="text-slate-400">proyectos</span></span>
        <span className="rounded-lg bg-slate-50 px-2 py-2"><b className="block text-slate-900">{module.open}</b><span className="text-slate-400">abiertos</span></span>
        <span className="rounded-lg bg-slate-50 px-2 py-2"><b className="block text-slate-900">{module.risk}</b><span className="text-slate-400">riesgo</span></span>
      </div>
    </Link>
  )
}

function SavedViewRow({ view }) {
  return (
    <Link to={view.to} className="grid gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 sm:grid-cols-[1fr_120px_110px_auto] sm:items-center">
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-900">{view.name}</span>
        <span className="mt-1 block truncate text-xs text-slate-500">{view.detail}</span>
      </span>
      <span className="text-sm font-bold text-slate-700">{view.count}</span>
      <span className={`w-fit rounded-md px-2 py-1 text-xs font-bold ${view.alert ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{view.badge}</span>
      <ArrowRightIcon className="hidden h-4 w-4 text-slate-400 sm:block" />
    </Link>
  )
}

function PageTile({ page }) {
  return (
    <Link to={page.to} className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
          <page.Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-extrabold text-slate-950">{page.title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-slate-500">{page.detail}</span>
        </span>
      </div>
    </Link>
  )
}

export default function PlanningPage() {
  const { profile } = useAuth()
  const { data: dashboardData } = useDashboard(profile?.company_id)
  const { pharmacies = [] } = usePharmacies(profile?.company_id)
  const {
    loading,
    myPendingTasks,
    generalPendingTasks,
    myPendingSupport,
    generalPendingSupport,
  } = useOperationalDashboard()
  const [tab, setTab] = useState('cycles')

  const projects = useMemo(() => dashboardData?.periodProjects || [], [dashboardData?.periodProjects])
  const tasks = useMemo(() => [...myPendingTasks, ...generalPendingTasks], [generalPendingTasks, myPendingTasks])
  const tickets = useMemo(() => [...myPendingSupport, ...generalPendingSupport], [generalPendingSupport, myPendingSupport])
  const workItems = useMemo(() => [...tasks, ...tickets], [tasks, tickets])

  const stats = useMemo(() => {
    const risk = workItems.filter(item => priorityScore(item.priority) >= 3 || normalizeKey(item.status) === 'blocked').length
    const waiting = workItems.filter(item => ['esperando_cliente', 'esperando_proveedor', 'paused'].includes(normalizeKey(item.status))).length
    const closedProjects = projects.filter(project => !isOpenStatus(project.status)).length
    return {
      scope: workItems.length + projects.filter(project => isOpenStatus(project.status)).length,
      risk,
      waiting,
      closedProjects,
      activeProjects: projects.filter(project => ['active', 'in_progress'].includes(project.status)).length,
      pharmacies: pharmacies.length,
    }
  }, [pharmacies.length, projects, workItems])

  const cycles = useMemo(() => {
    const openProjects = projects.filter(project => isOpenStatus(project.status)).length
    const done = stats.closedProjects
    const total = Math.max(openProjects + done, 1)
    return [
      {
        name: 'Ciclo operativo actual',
        range: 'Esta semana',
        focus: 'Tickets, tareas y proyectos abiertos',
        scope: stats.scope,
        risk: stats.risk,
        waiting: stats.waiting,
        done,
        progress: Math.round((done / total) * 100),
        tone: 'bg-teal-500',
      },
      {
        name: 'Ciclo de implantaciones',
        range: '30 días',
        focus: 'Preparación, agenda, instalación y puesta en marcha',
        scope: projects.filter(project => String(project.pipeline_stage || '').startsWith('installation')).length,
        risk: projects.filter(project => normalizeKey(project.status) === 'blocked').length,
        waiting: projects.filter(project => normalizeKey(project.status) === 'paused').length,
        done: projects.filter(project => !isOpenStatus(project.status) && String(project.pipeline_stage || '').startsWith('installation')).length,
        progress: Math.min(100, Math.round((stats.activeProjects / Math.max(projects.length, 1)) * 100)),
        tone: 'bg-sky-500',
      },
      {
        name: 'Ciclo de soporte',
        range: 'Continuo',
        focus: 'Resolución, seguimiento y validación con farmacias',
        scope: tickets.length,
        risk: tickets.filter(ticket => priorityScore(ticket.priority) >= 3).length,
        waiting: tickets.filter(ticket => ['esperando_cliente', 'esperando_proveedor'].includes(normalizeKey(ticket.status))).length,
        done: tickets.filter(ticket => !isOpenStatus(ticket.status)).length,
        progress: Math.max(8, Math.round(((tickets.length - stats.waiting) / Math.max(tickets.length, 1)) * 100)),
        tone: 'bg-emerald-500',
      },
    ]
  }, [projects, stats, tickets])

  const modules = useMemo(() => PROJECT_DIVISIONS.map(division => {
    const relatedProjects = projects.filter(project => {
      const stagePrefix = String(project.pipeline_stage || '').split(':')[0]
      return project.project_type === division.id || stagePrefix === division.id || (division.id === 'commercial' && !project.project_type && !stagePrefix)
    })
    return {
      ...division,
      projects: relatedProjects.length,
      open: relatedProjects.filter(project => isOpenStatus(project.status)).length,
      risk: relatedProjects.filter(project => priorityScore(project.priority) >= 3 || normalizeKey(project.status) === 'blocked').length,
      to: `/proyectos?type=${division.id}`,
    }
  }), [projects])

  const views = useMemo(() => [
    {
      name: 'Mi trabajo pendiente',
      detail: 'Tickets y tareas asignadas al usuario actual',
      count: myPendingTasks.length + myPendingSupport.length,
      badge: 'Personal',
      to: '/',
    },
    {
      name: 'Sin asignar',
      detail: 'Entrada nueva pendiente de reparto',
      count: workItems.filter(item => !item.assignedTo).length,
      badge: 'Bandeja',
      to: '/soporte/tickets?status=nuevo',
      alert: workItems.some(item => !item.assignedTo),
    },
    {
      name: 'Alta prioridad',
      detail: 'Elementos con impacto alto o crítico',
      count: workItems.filter(item => priorityScore(item.priority) >= 3).length,
      badge: 'Riesgo',
      to: '/soporte/tickets',
      alert: workItems.some(item => priorityScore(item.priority) >= 3),
    },
    {
      name: 'Proyectos en curso',
      detail: 'Cartera activa por etapas',
      count: stats.activeProjects,
      badge: 'Cartera',
      to: '/proyectos?status=active',
    },
    {
      name: 'Farmacias con actividad',
      detail: 'Red operativa con tickets, tareas o proyectos',
      count: stats.pharmacies,
      badge: 'Operación',
      to: '/farmacias',
    },
  ], [myPendingSupport.length, myPendingTasks.length, stats.activeProjects, stats.pharmacies, workItems])

  const pages = [
    { title: 'Documentación corporativa', detail: 'Protocolos, manuales, informes y archivos internos.', to: '/documentos', Icon: DocumentTextIcon },
    { title: 'Base de conocimiento', detail: 'Contenido de soporte reutilizable por el equipo.', to: '/soporte/base-conocimiento', Icon: BookOpenIcon },
    { title: 'Detalle de proyectos', detail: 'Tareas, hitos, calendario y comunicaciones por proyecto.', to: '/proyectos', Icon: FolderOpenIcon },
    { title: 'Portal de soporte', detail: 'Conversaciones, prioridades y estado de tickets.', to: '/soporte/dashboard', Icon: LifebuoyIcon },
  ]

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-3 py-4 sm:px-5 lg:px-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Plane model · Viteka data</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Planificación</h1>
          <p className="mt-1 text-sm text-slate-500">Ciclos, módulos, vistas y páginas conectadas a la operación actual.</p>
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <TabButton Icon={CalendarDaysIcon} active={tab === 'cycles'} onClick={() => setTab('cycles')}>Ciclos</TabButton>
          <TabButton Icon={Squares2X2Icon} active={tab === 'modules'} onClick={() => setTab('modules')}>Módulos</TabButton>
          <TabButton Icon={RectangleGroupIcon} active={tab === 'views'} onClick={() => setTab('views')}>Vistas</TabButton>
          <TabButton Icon={BookOpenIcon} active={tab === 'pages'} onClick={() => setTab('pages')}>Páginas</TabButton>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Alcance abierto" value={stats.scope} detail="trabajo vivo" />
        <Stat label="Riesgo" value={stats.risk} detail="alta prioridad o bloqueo" />
        <Stat label="En espera" value={stats.waiting} detail="dependencias externas" />
        <Stat label="Farmacias" value={stats.pharmacies} detail="red gestionada" />
      </section>

      {tab === 'cycles' && (
        <section className="grid gap-3 xl:grid-cols-3">
          {cycles.map(cycle => <CycleCard key={cycle.name} cycle={cycle} />)}
        </section>
      )}

      {tab === 'modules' && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {modules.map(module => <ModuleCard key={module.id} module={module} />)}
        </section>
      )}

      {tab === 'views' && (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <header className="grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:grid-cols-[1fr_120px_110px_20px]">
            <span>Vista</span>
            <span>Elementos</span>
            <span>Tipo</span>
            <span />
          </header>
          {views.map(view => <SavedViewRow key={view.name} view={view} />)}
        </section>
      )}

      {tab === 'pages' && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pages.map(page => <PageTile key={page.title} page={page} />)}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-extrabold text-slate-950">Trabajo destacado</h2>
            <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-950">Resumen <ArrowRightIcon className="h-3.5 w-3.5" /></Link>
          </header>
          <div className="divide-y divide-slate-100">
            {[...workItems]
              .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
              .slice(0, 6)
              .map(item => (
                <div key={`${item.id}-${item.title}`} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_130px_110px] sm:items-center">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900">{item.title}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{item.pharmacyName || item.product || item.assignedTo || 'Sin contexto'}</span>
                  </span>
                  <span className="text-sm text-slate-600">{item.assignedTo || 'Sin responsable'}</span>
                  <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{statusLabel(item.status)}</span>
                </div>
              ))}
            {!workItems.length && <p className="px-4 py-8 text-center text-sm text-slate-400">Sin trabajo pendiente</p>}
          </div>
        </section>

        <aside className="space-y-3">
          <Link to="/soporte/tickets" className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
            <span className="flex items-center gap-3"><TicketIcon className="h-5 w-5 text-slate-500" /><span className="font-bold text-slate-900">Tickets</span></span>
            <span className="text-sm font-extrabold text-slate-700">{tickets.length}</span>
          </Link>
          <Link to="/proyectos" className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
            <span className="flex items-center gap-3"><FolderOpenIcon className="h-5 w-5 text-slate-500" /><span className="font-bold text-slate-900">Proyectos</span></span>
            <span className="text-sm font-extrabold text-slate-700">{projects.length}</span>
          </Link>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="h-5 w-5 text-slate-500" />
              <h2 className="font-bold text-slate-900">Estados principales</h2>
            </div>
            <div className="mt-4 space-y-3">
              {['Pendiente', 'En curso', 'En espera', 'Bloqueado'].map(label => {
                const count = workItems.filter(item => statusLabel(item.status) === label).length
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500"><span>{label}</span><b>{count}</b></div>
                    <div className="mt-1"><ProgressBar value={Math.round((count / Math.max(workItems.length, 1)) * 100)} tone={label === 'Bloqueado' ? 'bg-rose-500' : 'bg-slate-900'} /></div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
