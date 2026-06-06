import { useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  SparklesIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import DashboardCompactList from '../components/dashboard/DashboardCompactList'
import { useOperationalDashboard } from '../hooks/useOperationalDashboard'
import { formatShortDate, normalizeKey, statusToneClasses } from '../lib/operationalDashboardStatus'

const CHART_BAR_TONE = {
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  blue: 'bg-sky-500',
  red: 'bg-rose-500',
  gray: 'bg-slate-400',
}

function formatUpdateTime(value) {
  if (!value) return '--:--'
  return value.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function filterByStatus(items, status) {
  if (!status) return items
  return items.filter(item => normalizeKey(item.status) === status)
}

function filterLabel(items, status) {
  return items.find(item => item.key === status)?.label || status
}

function totalCount(items) {
  return items.reduce((sum, item) => sum + item.count, 0)
}

function isUrgentItem(item) {
  const priority = normalizeKey(item.priority)
  const status = normalizeKey(item.status)
  return ['urgent', 'urgente', 'critical', 'critica', 'critica'].includes(priority)
    || status === 'blocked'
    || status === 'esperando_proveedor'
}

function boardPriority(item) {
  const priority = normalizeKey(item.priority)
  const status = normalizeKey(item.status)
  if (status === 'blocked') return 120
  if (status === 'esperando_proveedor') return 110
  if (['urgent', 'urgente', 'critical', 'critica', 'critica'].includes(priority)) return 100
  if (['high', 'alto', 'alta'].includes(priority)) return 80
  if (['in_progress', 'en_progreso'].includes(status)) return 60
  if (status === 'pending') return 40
  return 20
}

function compactMeta(item, type) {
  if (type === 'task') {
    const dueLabel = item.dueDate ? `Vence ${formatShortDate(item.dueDate)}` : 'Sin vencimiento'
    return item.pharmacyName ? `${item.pharmacyName} · ${dueLabel}` : dueLabel
  }

  if (item.pharmacyName && item.product) return `${item.pharmacyName} · ${item.product}`
  return item.pharmacyName || item.product || 'Sin contexto adicional'
}

function buildInsight({ urgentCount, totalMine, totalTeam, blockedCount, waitingCount }) {
  if (urgentCount > 0) {
    return `Hoy conviene priorizar ${urgentCount} frente${urgentCount === 1 ? '' : 's'} caliente${urgentCount === 1 ? '' : 's'} entre tareas y soporte.`
  }

  if (blockedCount > 0 || waitingCount > 0) {
    return `La carga está controlada, pero hay ${blockedCount + waitingCount} elemento${blockedCount + waitingCount === 1 ? '' : 's'} en bloqueo o espera que merece${blockedCount + waitingCount === 1 ? '' : 'n'} seguimiento.`
  }

  if (totalMine > 0) {
    return `Tienes ${totalMine} pendiente${totalMine === 1 ? '' : 's'} en foco y ${totalTeam} más repartidos en la cola general del equipo.`
  }

  return 'La operativa está al día. Este panel queda listo para coordinar prioridades, soporte y seguimiento del equipo.'
}

function MetricCard({ title, value, detail, Icon, accent = 'teal' }) {
  const accentClasses = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  }[accent] || 'bg-slate-100 text-slate-700 ring-slate-200'

  return (
    <article className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-teal-950/5 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex rounded-2xl p-2 ring-1 ${accentClasses}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </article>
  )
}

function StatusChartCard({ title, subtitle, items, activeStatus, onStatusClick, onClear }) {
  const total = totalCount(items)

  return (
    <section className="card overflow-hidden rounded-[26px] border border-slate-200 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Lectura rápida</p>
          <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{total} activos</span>
          {activeStatus && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </header>

      <div className="space-y-3 px-4 py-4">
        {items.length ? items.map(item => {
          const percent = total ? Math.max(8, Math.round((item.count / total) * 100)) : 0
          const isActive = activeStatus === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onStatusClick(item.key)}
              className={`w-full rounded-2xl border px-3 py-3 text-left transition ${isActive ? 'border-teal-200 bg-teal-50/70 shadow-sm' : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ring-1 ${statusToneClasses(item.tone)}`}>{item.label}</span>
                <span className="text-sm font-bold text-slate-700">{item.count}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full ${CHART_BAR_TONE[item.tone] || CHART_BAR_TONE.gray}`} style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{percent}% de la carga activa</p>
            </button>
          )
        }) : (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            Sin elementos activos en este bloque.
          </p>
        )}
      </div>
    </section>
  )
}

function WorkboardCard({ eyebrow, title, description, items, emptyText }) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-2 font-display text-lg font-extrabold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-4 space-y-3">
        {items.length ? items.map(item => (
          <article key={`${item.type}-${item.id}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                {item.type === 'task' ? 'Tarea' : 'Soporte'}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusToneClasses(item.tone)}`}>
                {item.statusLabel}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{item.priorityLabel}</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">{compactMeta(item, item.type)}</p>
            {item.assignedTo ? <p className="mt-2 text-[11px] font-medium text-slate-400">Responsable: {item.assignedTo}</p> : null}
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const {
    loading,
    warning,
    lastUpdated,
    taskStatusSummary,
    supportStatusSummary,
    myPendingTasks,
    generalPendingTasks,
    myPendingSupport,
    generalPendingSupport,
    reload,
  } = useOperationalDashboard()

  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [supportStatusFilter, setSupportStatusFilter] = useState('')

  const filteredTasks = useMemo(() => ({
    mine: filterByStatus(myPendingTasks, taskStatusFilter),
    general: filterByStatus(generalPendingTasks, taskStatusFilter),
  }), [generalPendingTasks, myPendingTasks, taskStatusFilter])

  const filteredSupport = useMemo(() => ({
    mine: filterByStatus(myPendingSupport, supportStatusFilter),
    general: filterByStatus(generalPendingSupport, supportStatusFilter),
  }), [generalPendingSupport, myPendingSupport, supportStatusFilter])

  const metrics = useMemo(() => {
    const taskTotal = myPendingTasks.length + generalPendingTasks.length
    const supportTotal = myPendingSupport.length + generalPendingSupport.length
    const totalMine = myPendingTasks.length + myPendingSupport.length
    const totalTeam = generalPendingTasks.length + generalPendingSupport.length
    const blockedCount = [...myPendingTasks, ...generalPendingTasks, ...myPendingSupport, ...generalPendingSupport]
      .filter(item => normalizeKey(item.status) === 'blocked').length
    const waitingCount = [...myPendingSupport, ...generalPendingSupport]
      .filter(item => ['esperando_cliente', 'esperando_proveedor'].includes(normalizeKey(item.status))).length
    const urgentCount = [...myPendingTasks, ...generalPendingTasks, ...myPendingSupport, ...generalPendingSupport]
      .filter(isUrgentItem).length

    return {
      taskTotal,
      supportTotal,
      totalMine,
      totalTeam,
      blockedCount,
      waitingCount,
      urgentCount,
      insight: buildInsight({ urgentCount, totalMine, totalTeam, blockedCount, waitingCount }),
    }
  }, [generalPendingSupport, generalPendingTasks, myPendingSupport, myPendingTasks])

  const workboard = useMemo(() => {
    const mine = [
      ...filteredTasks.mine.map(item => ({ ...item, type: 'task', tone: item.status ? undefined : undefined })),
      ...filteredSupport.mine.map(item => ({ ...item, type: 'support', tone: undefined })),
    ].map(item => ({ ...item, tone: taskStatusSummary.concat(supportStatusSummary).find(summary => summary.key === normalizeKey(item.status))?.tone || 'gray' }))
      .sort((a, b) => boardPriority(b) - boardPriority(a))

    const team = [
      ...filteredTasks.general.map(item => ({ ...item, type: 'task', tone: undefined })),
      ...filteredSupport.general.map(item => ({ ...item, type: 'support', tone: undefined })),
    ].map(item => ({ ...item, tone: taskStatusSummary.concat(supportStatusSummary).find(summary => summary.key === normalizeKey(item.status))?.tone || 'gray' }))
      .sort((a, b) => boardPriority(b) - boardPriority(a))

    const urgent = [...mine, ...team].filter(isUrgentItem).sort((a, b) => boardPriority(b) - boardPriority(a))

    return {
      urgent: urgent.slice(0, 4),
      mine: mine.slice(0, 4),
      team: team.slice(0, 4),
    }
  }, [filteredSupport.general, filteredSupport.mine, filteredTasks.general, filteredTasks.mine, supportStatusSummary, taskStatusSummary])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-wrapper space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-[#CFE3DD] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),linear-gradient(135deg,#f7fffc_0%,#eef7f4_52%,#ffffff_100%)] shadow-sm">
        <div className="flex flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal-700 ring-1 ring-teal-100">
                <SparklesIcon className="h-3.5 w-3.5" /> Coordinación diaria
              </p>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Un tablero más claro para mover tareas, soporte y prioridades sin saltos entre pantallas.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {metrics.insight}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-right shadow-sm">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Actualizado</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{formatUpdateTime(lastUpdated)}</p>
              </div>
              <button type="button" onClick={reload} className="btn-primary !px-3 !py-2 !text-xs">
                <ArrowPathIcon className="h-3.5 w-3.5" /> Actualizar
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Pendientes del equipo"
              value={metrics.taskTotal + metrics.supportTotal}
              detail={`${metrics.totalMine} son tuyos y ${metrics.totalTeam} siguen en la cola general.`}
              Icon={UsersIcon}
              accent="teal"
            />
            <MetricCard
              title="Tareas activas"
              value={metrics.taskTotal}
              detail="Incluye seguimiento comercial, implantaciones y acciones internas en curso."
              Icon={ClipboardDocumentListIcon}
              accent="blue"
            />
            <MetricCard
              title="Soporte abierto"
              value={metrics.supportTotal}
              detail="Tickets vivos con seguimiento pendiente para clientes o para el equipo."
              Icon={LifebuoyIcon}
              accent="amber"
            />
            <MetricCard
              title="Atención inmediata"
              value={metrics.urgentCount}
              detail={metrics.urgentCount ? 'Hay incidencias urgentes, bloqueos o esperas de proveedor a revisar hoy.' : 'No hay urgencias críticas detectadas en este momento.'}
              Icon={BoltIcon}
              accent="rose"
            />
          </div>
        </div>
      </section>

      {warning && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Algunos datos no se pudieron cargar del todo. El panel sigue mostrando la mejor información disponible.</p>
        </div>
      )}

      {(taskStatusFilter || supportStatusFilter) && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
          {taskStatusFilter && <span>Filtro tareas: <strong className="text-slate-800">{filterLabel(taskStatusSummary, taskStatusFilter)}</strong></span>}
          {supportStatusFilter && <span>Filtro soporte: <strong className="text-slate-800">{filterLabel(supportStatusSummary, supportStatusFilter)}</strong></span>}
          <button type="button" onClick={() => { setTaskStatusFilter(''); setSupportStatusFilter('') }} className="font-bold text-teal-700 hover:underline">Limpiar</button>
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <StatusChartCard
          title="Carga de tareas"
          subtitle="Vista rápida por estado para identificar avance, pausas y bloqueos."
          items={taskStatusSummary}
          activeStatus={taskStatusFilter}
          onStatusClick={status => setTaskStatusFilter(current => current === status ? '' : status)}
          onClear={() => setTaskStatusFilter('')}
        />
        <StatusChartCard
          title="Carga de soporte"
          subtitle="Seguimiento de tickets activos para repartir mejor la atención del equipo."
          items={supportStatusSummary}
          activeStatus={supportStatusFilter}
          onStatusClick={status => setSupportStatusFilter(current => current === status ? '' : status)}
          onClear={() => setSupportStatusFilter('')}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <WorkboardCard
          eyebrow="Prioridad inmediata"
          title="Frentes calientes"
          description="Bloqueos, urgencias y esperas que conviene mover antes de que frenen al resto del equipo."
          items={workboard.urgent}
          emptyText="Ahora mismo no hay bloqueos ni urgencias críticas en primera línea."
        />
        <WorkboardCard
          eyebrow="Mi foco"
          title="Lo que tengo encima"
          description="Tus tareas y tickets más sensibles, ya ordenados para entrar por lo importante."
          items={workboard.mine}
          emptyText="No tienes pendientes asignados en este momento."
        />
        <WorkboardCard
          eyebrow="Cola del equipo"
          title="Visión compartida"
          description="Carga general para coordinar reparto, seguimiento y próximos pasos internos."
          items={workboard.team}
          emptyText="La bandeja general está limpia por ahora."
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardCompactList
          title="Mis tareas pendientes"
          items={filteredTasks.mine}
          type="task"
          emptyText="No tienes tareas pendientes."
        />
        <DashboardCompactList
          title="Mi soporte pendiente"
          items={filteredSupport.mine}
          type="support"
          emptyText="No tienes soporte pendiente."
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardCompactList
          title="Tareas pendientes generales"
          items={filteredTasks.general}
          type="task"
          emptyText="No hay tareas generales pendientes."
        />
        <DashboardCompactList
          title="Soporte pendiente general"
          items={filteredSupport.general}
          type="support"
          emptyText="No hay soporte general pendiente."
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <ChartBarIcon className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-base font-extrabold">Lectura del día</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {metrics.urgentCount > 0
              ? `La prioridad más clara hoy está en ${metrics.urgentCount} incidencia${metrics.urgentCount === 1 ? '' : 's'} de alta presión. Conviene resolverlas antes de ampliar cola.`
              : 'La carga está equilibrada. Este espacio puede usarse como tablero de coordinación y seguimiento, no solo como listado de pendientes.'}
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <ClockIcon className="h-5 w-5 text-sky-600" />
            <h2 className="font-display text-base font-extrabold">Esperas activas</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Hay {metrics.blockedCount} bloqueo{metrics.blockedCount === 1 ? '' : 's'} directo{metrics.blockedCount === 1 ? '' : 's'} y {metrics.waitingCount} ticket{metrics.waitingCount === 1 ? '' : 's'} en espera de cliente o proveedor.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <UsersIcon className="h-5 w-5 text-amber-600" />
            <h2 className="font-display text-base font-extrabold">Carga compartida</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            La cola general mantiene {metrics.totalTeam} pendiente{metrics.totalTeam === 1 ? '' : 's'}. Sirve como caja de reparto para coordinar al equipo interno sin perder contexto.
          </p>
        </div>
      </section>
    </div>
  )
}
