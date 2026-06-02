import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  PlusIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { usePharmacyKpis } from '../hooks/usePharmacyKpis'

const STATUS_LABEL = {
  pending: 'Pendiente',
  active: 'Activo',
  in_progress: 'En progreso',
  blocked: 'Bloqueado',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
}

const STATUS_COLOR = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  active: 'bg-teal-50 text-teal-700 ring-teal-100',
  in_progress: 'bg-sky-50 text-sky-700 ring-sky-100',
  blocked: 'bg-rose-50 text-rose-700 ring-rose-100',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
}

const MODULES = [
  {
    to: '/farmacias',
    label: 'Farmacias',
    detail: 'Consulta fichas, equipamiento y actividad.',
    Icon: BuildingStorefrontIcon,
    tone: 'bg-teal-50 text-teal-700',
  },
  {
    to: '/personas',
    label: 'Personas',
    detail: 'Localiza responsables y contactos.',
    Icon: UsersIcon,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    to: '/proyectos',
    label: 'Proyectos',
    detail: 'Coordina pipelines, hitos y tareas.',
    Icon: FolderOpenIcon,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    to: '/documentos',
    label: 'Documentación',
    detail: 'Accede a la biblioteca corporativa.',
    Icon: DocumentTextIcon,
    tone: 'bg-emerald-50 text-emerald-700',
  },
]

function MetricCard({ label, value, detail, Icon, alert = false }) {
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${alert ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[11px] font-extrabold uppercase tracking-[0.14em] ${alert ? 'text-rose-600' : 'text-slate-400'}`}>{label}</p>
        <Icon className={`h-4 w-4 ${alert ? 'text-rose-500' : 'text-teal-700'}`} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`font-display text-2xl font-extrabold ${alert ? 'text-rose-700' : 'text-slate-950'}`}>{value}</p>
        {detail && <p className="truncate text-xs text-slate-400">{detail}</p>}
      </div>
    </article>
  )
}

function ModuleCard({ to, label, detail, Icon, tone }) {
  return (
    <Link to={to} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <span className={`inline-flex rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-3 font-display text-sm font-extrabold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-teal-700">Abrir <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
    </Link>
  )
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const companyId = profile?.company_id
  const { data, loading, error } = useDashboard(companyId)
  const { rows, totals, loading: kpiLoading } = usePharmacyKpis(companyId)

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-3xl border border-teal-900/10 bg-[linear-gradient(128deg,#00695c_0%,#00584f_58%,#0e91a0_100%)] p-5 text-white shadow-lg shadow-teal-900/10 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-100">Centro operativo Viteka</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">Todo el trabajo, con contexto.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-teal-50/85">Consulta la red de farmacias, encuentra responsables y coordina proyectos sin perder el hilo entre módulos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/farmacias/nueva" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-xs font-extrabold text-teal-800 shadow-sm transition hover:bg-teal-50">
              <PlusIcon className="h-4 w-4" /> Nueva farmacia
            </Link>
            <Link to="/proyectos?create=1&type=commercial" className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-white/20">
              <PlusIcon className="h-4 w-4" /> Nuevo proyecto
            </Link>
          </div>
        </div>
      </header>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MetricCard label="Farmacias activas" value={data?.pharmacies ?? 0} detail="en seguimiento" Icon={BuildingStorefrontIcon} />
        <MetricCard label="Proyectos activos" value={data?.projectsActive ?? 0} detail={`de ${data?.projectsTotal ?? 0}`} Icon={FolderOpenIcon} />
        <MetricCard label="Tareas pendientes" value={data?.tasksPending ?? 0} detail="por completar" Icon={CheckCircleIcon} />
        <MetricCard label="Tareas vencidas" value={data?.tasksOverdue ?? 0} detail="requieren atención" Icon={ClockIcon} alert={(data?.tasksOverdue ?? 0) > 0} />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-teal-700">Navegación principal</p>
            <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">Áreas de trabajo</h2>
          </div>
          <Squares2X2Icon className="h-5 w-5 text-slate-300" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {MODULES.map(module => <ModuleCard key={module.to} {...module} />)}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-900">Cobertura Viteka</h2>
              <p className="mt-1 text-xs text-slate-400">Equipamiento soportado por provincia</p>
            </div>
            <Link to="/farmacias" className="text-xs font-bold text-teal-700 hover:underline">Ver farmacias</Link>
          </div>
          {kpiLoading ? (
            <p className="mt-5 text-sm text-slate-400">Cargando cobertura...</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[420px]">
                <div className="grid grid-cols-4 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <span>Provincia</span><span className="text-center">Nixfarma</span><span className="text-center">Cashlogy</span><span className="text-center">Hanshow</span>
                </div>
                {rows.map(row => (
                  <div key={row.province} className="grid grid-cols-4 border-b border-slate-50 py-2 text-sm">
                    <span className="font-bold text-slate-700">{row.label}</span>
                    <span className="text-center text-teal-700">{row.nixfarma || '-'}</span>
                    <span className="text-center text-sky-700">{row.cashlogy || '-'}</span>
                    <span className="text-center text-amber-700">{row.hanshow || '-'}</span>
                  </div>
                ))}
                <div className="grid grid-cols-4 pt-2 text-sm font-extrabold text-slate-800">
                  <span>Total</span><span className="text-center">{totals.nixfarma}</span><span className="text-center">{totals.cashlogy}</span><span className="text-center">{totals.hanshow}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-900">Proyectos recientes</h2>
              <p className="mt-1 text-xs text-slate-400">Últimos movimientos de la cartera operativa</p>
            </div>
            <Link to="/proyectos" className="text-xs font-bold text-teal-700 hover:underline">Abrir proyectos</Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {(data?.recentProjects || []).length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Todavía no hay proyectos registrados.</p>
            ) : data.recentProjects.map(project => (
              <Link key={project.id} to={`/proyectos/${project.id}`} className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{project.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{project.pharmacy_name || 'Sin farmacia asignada'}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ring-1 ${STATUS_COLOR[project.status] || STATUS_COLOR.pending}`}>{STATUS_LABEL[project.status] || project.status}</span>
              </Link>
            ))}
          </div>
          {data?.projectsByStatus?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {data.projectsByStatus.map(status => (
                <span key={status.label} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600">
                  <span className={`h-2 w-2 rounded-full ${status.color}`} /> {status.label}: {status.count}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-900">
        <CalendarDaysIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
        <div>
          <p className="text-sm font-extrabold">Siguiente evolución: portal de incidencias</p>
          <p className="mt-0.5 text-xs leading-relaxed text-sky-700">Se incorporará después como flujo conectado a farmacias y proyectos, sin mezclarlo todavía con el trabajo operativo disponible.</p>
        </div>
      </aside>
    </div>
  )
}
