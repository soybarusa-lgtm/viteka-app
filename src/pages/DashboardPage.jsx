import { useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  QueueListIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import DashboardCompactList from '../components/dashboard/DashboardCompactList'
import { useOperationalDashboard } from '../hooks/useOperationalDashboard'
import { formatShortDate, getStatusMeta, normalizeKey, statusToneClasses } from '../lib/operationalDashboardStatus'

const CHART_BAR_TONE = {
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  blue: 'bg-sky-500',
  red: 'bg-rose-500',
  gray: 'bg-slate-400',
}

const LANE_META = {
  queue: {
    title: 'Entrada',
    caption: 'Nuevo trabajo y pendientes por arrancar.',
    panel: 'border-slate-200 bg-slate-50/80',
    badge: 'bg-slate-900 text-white',
  },
  progress: {
    title: 'En marcha',
    caption: 'Trabajo activo que ya está moviéndose.',
    panel: 'border-sky-200 bg-sky-50/80',
    badge: 'bg-sky-600 text-white',
  },
  attention: {
    title: 'Atascado o en espera',
    caption: 'Bloqueos, urgencias o puntos que requieren reacción.',
    panel: 'border-rose-200 bg-rose-50/80',
    badge: 'bg-rose-600 text-white',
  },
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
  return ['urgent', 'urgente', 'critical', 'critica'].includes(priority)
    || status === 'blocked'
    || status === 'esperando_cliente'
    || status === 'esperando_proveedor'
}

function laneKeyFromStatus(status) {
  const key = normalizeKey(status)
  if (['blocked', 'esperando_cliente', 'esperando_proveedor'].includes(key)) return 'attention'
  if (['in_progress', 'en_progreso'].includes(key)) return 'progress'
  return 'queue'
}

function boardPriority(item) {
  const priority = normalizeKey(item.priority)
  const status = normalizeKey(item.status)
  if (status === 'blocked') return 120
  if (status === 'esperando_proveedor') return 115
  if (status === 'esperando_cliente') return 105
  if (['urgent', 'urgente', 'critical', 'critica'].includes(priority)) return 100
  if (['high', 'alto', 'alta'].includes(priority)) return 80
  if (['in_progress', 'en_progreso'].includes(status)) return 60
  if (status === 'pending' || status === 'nuevo') return 50
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

function buildInsight({ attentionCount, totalMine, totalTeam, progressCount, supportTotal }) {
  if (attentionCount > 0) {
    return `La prioridad ahora está en ${attentionCount} elemento${attentionCount === 1 ? '' : 's'} en riesgo o espera. Conviene resolverlos antes de ampliar cola.`
  }

  if (supportTotal > totalMine) {
    return `El soporte tiene más peso que la ejecución interna. Merece revisar reparto y tiempos de respuesta antes de cerrar el día.`
  }

  if (progressCount > 0) {
    return `Hay ${progressCount} frente${progressCount === 1 ? '' : 's'} ya en marcha. El panel queda orientado a vigilar avance y evitar cuellos de botella.`
  }

  return `La carga está estable: ${totalMine} elemento${totalMine === 1 ? '' : 's'} en tu bandeja y ${totalTeam} más en la cola general.`
}

function decorateBoardItems(items, type, scope) {
  return items.map(item => ({
    ...item,
    type,
    scope,
    tone: getStatusMeta(item.status).tone,
    laneKey: isUrgentItem(item) ? 'attention' : laneKeyFromStatus(item.status),
  }))
}

function MetricCard({ title, value, detail, Icon, accent = 'teal' }) {
  const accentClasses = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[accent] || 'bg-slate-100 text-slate-700 ring-slate-200'

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

function QueueHealthCard({ eyebrow, title, items, activeStatus, onStatusClick, onClear }) {
  const total = totalCount(items)

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{total} activos</span>
          {activeStatus ? (
            <button type="button" onClick={onClear} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100">
              Limpiar
            </button>
          ) : null}
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
              <p className="mt-2 text-xs text-slate-500">{percent}% de esta cola</p>
            </button>
          )
        }) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
            Sin elementos activos en esta cola.
          </div>
        )}
      </div>
    </section>
  )
}

function DeskCommandCard({ metrics, taskStatusFilter, supportStatusFilter, taskStatusSummary, supportStatusSummary, onClearFilters }) {
  const focusLabel = taskStatusFilter
    ? `Tareas: ${filterLabel(taskStatusSummary, taskStatusFilter)}`
    : supportStatusFilter
      ? `Soporte: ${filterLabel(supportStatusSummary, supportStatusFilter)}`
      : 'Sin filtros activos'

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-4 py-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Mesa de control</p>
        <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">Lectura operativa</h2>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm leading-6 text-slate-600">{metrics.insight}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Bandeja</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-950">{metrics.totalMine}</p>
            <p className="mt-1 text-xs text-slate-500">Trabajo asignado directamente a tu foco.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">En marcha</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-950">{metrics.progressCount}</p>
            <p className="mt-1 text-xs text-slate-500">Elementos activos que ya están siendo trabajados.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Atención</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-950">{metrics.attentionCount}</p>
            <p className="mt-1 text-xs text-slate-500">Bloqueos, esperas o prioridades altas que pueden escalar.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Filtro actual</p>
            <p className="mt-2 text-sm font-bold text-slate-950">{focusLabel}</p>
            {(taskStatusFilter || supportStatusFilter) ? (
              <button type="button" onClick={onClearFilters} className="mt-2 text-xs font-bold text-teal-700 hover:underline">
                Quitar filtros
              </button>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Pulsa una cola para centrarte en un estado concreto.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function BoardItemCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${item.type === 'task' ? 'bg-slate-900 text-white' : 'bg-teal-600 text-white'}`}>
          {item.type === 'task' ? 'Tarea' : 'Ticket'}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {item.scope === 'mine' ? 'Mío' : 'Equipo'}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusToneClasses(item.tone)}`}>
          {item.statusLabel}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold text-slate-900">{item.title}</p>
      <p className="mt-1 text-xs text-slate-500">{compactMeta(item, item.type)}</p>
      {item.assignedTo ? <p className="mt-2 text-[11px] font-medium text-slate-400">Responsable: {item.assignedTo}</p> : null}
    </article>
  )
}

function BoardLane({ laneKey, items }) {
  const lane = LANE_META[laneKey]
  const visibleItems = items.slice(0, 5)

  return (
    <section className={`rounded-[26px] border p-4 shadow-sm ${lane.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] ${lane.badge}`}>
            {lane.title}
          </span>
          <p className="mt-3 text-sm text-slate-600">{lane.caption}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{items.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {visibleItems.length ? visibleItems.map(item => <BoardItemCard key={`${laneKey}-${item.type}-${item.id}-${item.scope}`} item={item} />) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm text-slate-400">
            Sin elementos en esta columna.
          </div>
        )}
      </div>

      {items.length > visibleItems.length ? (
        <p className="mt-3 text-xs font-medium text-slate-500">Mostrando {visibleItems.length} de {items.length}</p>
      ) : null}
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

  const boardItems = useMemo(() => ([
    ...decorateBoardItems(filteredTasks.mine, 'task', 'mine'),
    ...decorateBoardItems(filteredTasks.general, 'task', 'team'),
    ...decorateBoardItems(filteredSupport.mine, 'support', 'mine'),
    ...decorateBoardItems(filteredSupport.general, 'support', 'team'),
  ]).sort((a, b) => boardPriority(b) - boardPriority(a)), [filteredSupport.general, filteredSupport.mine, filteredTasks.general, filteredTasks.mine])

  const metrics = useMemo(() => {
    const supportTotal = myPendingSupport.length + generalPendingSupport.length
    const totalMine = myPendingTasks.length + myPendingSupport.length
    const totalTeam = generalPendingTasks.length + generalPendingSupport.length
    const progressCount = boardItems.filter(item => item.laneKey === 'progress').length
    const attentionCount = boardItems.filter(item => item.laneKey === 'attention').length
    const waitingCount = boardItems.filter(item => ['esperando_cliente', 'esperando_proveedor'].includes(normalizeKey(item.status))).length

    return {
      supportTotal,
      totalMine,
      totalTeam,
      progressCount,
      attentionCount,
      waitingCount,
      insight: buildInsight({ attentionCount, totalMine, totalTeam, progressCount, supportTotal }),
    }
  }, [boardItems, generalPendingSupport.length, generalPendingTasks.length, myPendingSupport.length, myPendingTasks.length])

  const boardLanes = useMemo(() => ({
    queue: boardItems.filter(item => item.laneKey === 'queue'),
    progress: boardItems.filter(item => item.laneKey === 'progress'),
    attention: boardItems.filter(item => item.laneKey === 'attention'),
  }), [boardItems])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-wrapper space-y-4">
      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-5 md:px-6 md:py-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700">
              <Squares2X2Icon className="h-3.5 w-3.5" /> Dashboard operativo
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Colas, ejecución y seguimiento en una sola vista.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              El panel combina lectura de colas al estilo helpdesk con una vista de ejecución por columnas para que soporte y tareas respiren como un mismo flujo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Actualizado</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{formatUpdateTime(lastUpdated)}</p>
            </div>
            <button type="button" onClick={reload} className="btn-primary !px-3 !py-2 !text-xs">
              <ArrowPathIcon className="h-3.5 w-3.5" /> Actualizar
            </button>
          </div>
        </div>
      </section>

      {warning ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Algunos datos no se pudieron cargar del todo. El panel sigue mostrando la mejor información disponible.</p>
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Mi bandeja"
          value={metrics.totalMine}
          detail="Trabajo asignado directamente a tu foco operativo actual."
          Icon={UserCircleIcon}
          accent="teal"
        />
        <MetricCard
          title="Cola general"
          value={metrics.totalTeam}
          detail="Pendientes del equipo que pueden necesitar reparto o seguimiento."
          Icon={UsersIcon}
          accent="slate"
        />
        <MetricCard
          title="Soporte activo"
          value={metrics.supportTotal}
          detail="Tickets vivos que siguen requiriendo respuesta o resolución."
          Icon={LifebuoyIcon}
          accent="amber"
        />
        <MetricCard
          title="Atención inmediata"
          value={metrics.attentionCount}
          detail="Bloqueos, esperas y prioridades altas que merecen revisión primero."
          Icon={BoltIcon}
          accent="rose"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.95fr]">
        <QueueHealthCard
          eyebrow="Salud de soporte"
          title="Cola de tickets"
          items={supportStatusSummary}
          activeStatus={supportStatusFilter}
          onStatusClick={status => setSupportStatusFilter(current => current === status ? '' : status)}
          onClear={() => setSupportStatusFilter('')}
        />
        <QueueHealthCard
          eyebrow="Salud de ejecución"
          title="Cola de tareas"
          items={taskStatusSummary}
          activeStatus={taskStatusFilter}
          onStatusClick={status => setTaskStatusFilter(current => current === status ? '' : status)}
          onClear={() => setTaskStatusFilter('')}
        />
        <DeskCommandCard
          metrics={metrics}
          taskStatusFilter={taskStatusFilter}
          supportStatusFilter={supportStatusFilter}
          taskStatusSummary={taskStatusSummary}
          supportStatusSummary={supportStatusSummary}
          onClearFilters={() => {
            setTaskStatusFilter('')
            setSupportStatusFilter('')
          }}
        />
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Board de ejecución</p>
            <h2 className="mt-1 font-display text-xl font-extrabold text-slate-950">Vista operativa por columnas</h2>
            <p className="mt-1 text-sm text-slate-500">Inspirada en boards de trabajo: entrada, trabajo en marcha y elementos que se están frenando.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">{metrics.progressCount} en marcha</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">{metrics.attentionCount} en riesgo</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{metrics.waitingCount} en espera</span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <BoardLane laneKey="queue" items={boardLanes.queue} />
          <BoardLane laneKey="progress" items={boardLanes.progress} />
          <BoardLane laneKey="attention" items={boardLanes.attention} />
        </div>
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
            <QueueListIcon className="h-5 w-5 text-slate-700" />
            <h2 className="font-display text-base font-extrabold">Lectura de colas</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            El bloque superior sirve para detectar concentración de estados y entrar rápido en cuellos de botella sin abrir varias páginas.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <ClipboardDocumentListIcon className="h-5 w-5 text-sky-600" />
            <h2 className="font-display text-base font-extrabold">Ejecución visible</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            El board central ordena tareas y tickets como un flujo de trabajo, no como un simple listado. Eso mejora la lectura compartida del equipo.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <ChartBarIcon className="h-5 w-5 text-teal-600" />
            <h2 className="font-display text-base font-extrabold">Decisión rápida</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            La idea es que en pocos segundos se vea qué hay que responder, qué está avanzando y qué se está quedando atascado.
          </p>
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900">
          <ClockIcon className="h-5 w-5 text-amber-600" />
          <h2 className="font-display text-base font-extrabold">Contexto actual</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {metrics.insight}
        </p>
      </section>
    </div>
  )
}
