import { useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  Squares2X2Icon,
  TicketIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useOperationalDashboard } from '../hooks/useOperationalDashboard'
import { formatShortDate, getPriorityMeta, getStatusMeta, normalizeKey, statusToneClasses } from '../lib/operationalDashboardStatus'

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
    caption: 'Nuevo trabajo y pendientes por arrancar',
    badge: 'bg-slate-900 text-white',
    panel: 'border-slate-200 bg-white',
  },
  progress: {
    title: 'En marcha',
    caption: 'Tareas y tickets que ya se están moviendo',
    badge: 'bg-sky-600 text-white',
    panel: 'border-sky-100 bg-sky-50/40',
  },
  attention: {
    title: 'Riesgo / espera',
    caption: 'Bloqueos, esperas o prioridades altas',
    badge: 'bg-rose-600 text-white',
    panel: 'border-rose-100 bg-rose-50/40',
  },
}

const TICKET_SORT_COLUMNS = [
  { key: 'urgency', label: 'Urgencia' },
  { key: 'date', label: 'Fecha' },
  { key: 'pharmacy', label: 'Farmacia' },
  { key: 'assignee', label: 'Encargado' },
  { key: 'group', label: 'Grupo' },
]

const PRIORITY_BADGE_CLASSES = {
  redStrong: 'bg-red-100 text-red-800 ring-red-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-100',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
  blue: 'bg-sky-50 text-sky-700 ring-sky-100',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function formatUpdateTime(value) {
  if (!value) return '--:--'
  return value.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function formatTodayLabel() {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function titleCase(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function nameFromEmail(email) {
  const localPart = String(email || '').split('@')[0]
  const firstToken = localPart.split(/[._-]/).find(Boolean)
  return titleCase(firstToken)
}

function profileDisplayName(profile, session) {
  const metadata = session?.user?.user_metadata || {}
  const fullName = profile?.full_name
    || profile?.name
    || metadata.full_name
    || metadata.name
    || metadata.display_name
    || metadata.first_name
    || metadata.given_name
    || nameFromEmail(profile?.email || session?.user?.email)
    || 'usuario'

  return String(fullName).trim().split(/\s+/)[0] || 'usuario'
}

function formatRelativeTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))
  if (diffMinutes < 60) return `hace ${diffMinutes} min`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `hace ${diffHours} h`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 8) return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`

  return formatShortDate(value)
}

function filterByStatus(items, status) {
  if (!status) return items
  return items.filter(item => normalizeKey(item.status) === status)
}

function totalCount(items) {
  return items.reduce((sum, item) => sum + item.count, 0)
}

function countStatuses(summary, keys) {
  const normalizedKeys = keys.map(normalizeKey)
  return summary
    .filter(item => normalizedKeys.includes(normalizeKey(item.key)))
    .reduce((sum, item) => sum + item.count, 0)
}

function ticketDate(item) {
  return item.createdAt || item.raw?.created_at || item.updatedAt || item.raw?.updated_at || ''
}

function ticketDateTime(item) {
  const date = new Date(ticketDate(item)).getTime()
  return Number.isNaN(date) ? null : date
}

function ticketGroup(item) {
  const raw = item.raw || {}
  return raw.group_name
    || raw.support_group
    || raw.group
    || raw.queue
    || raw.team
    || raw.department
    || raw.area
    || item.product
    || item.type
    || 'Sin grupo'
}

function ticketUrgencyScore(item) {
  const priority = getPriorityMeta(item.priority)
  const status = normalizeKey(item.status)
  const statusBoost = {
    blocked: 60,
    esperando_proveedor: 45,
    esperando_cliente: 40,
    in_progress: 15,
    en_progreso: 15,
    nuevo: 10,
    abierto: 10,
    open: 10,
  }[status] || 0

  return (priority.weight * 100) + statusBoost
}

function ticketSortValue(item, key) {
  if (key === 'urgency') return ticketUrgencyScore(item)
  if (key === 'date') {
    return ticketDateTime(item)
  }
  if (key === 'pharmacy') return normalizeKey(item.pharmacyName)
  if (key === 'assignee') return normalizeKey(item.assignedTo || 'Sin asignar')
  if (key === 'group') return normalizeKey(ticketGroup(item))
  return ''
}

function compareTicketSort(a, b, sort) {
  const aValue = ticketSortValue(a, sort.key)
  const bValue = ticketSortValue(b, sort.key)
  const direction = sort.direction === 'asc' ? 1 : -1

  if (sort.key === 'date') {
    if (aValue === null && bValue !== null) return 1
    if (aValue !== null && bValue === null) return -1
  }

  if (typeof aValue === 'number' && typeof bValue === 'number' && aValue !== bValue) {
    return (aValue - bValue) * direction
  }

  if (typeof aValue === 'string' && typeof bValue === 'string') {
    const textCompare = aValue.localeCompare(bValue, 'es')
    if (textCompare) return textCompare * direction
  }

  const urgencyCompare = ticketUrgencyScore(b) - ticketUrgencyScore(a)
  if (urgencyCompare) return urgencyCompare

  const aDate = ticketSortValue(a, 'date')
  const bDate = ticketSortValue(b, 'date')
  if (aDate === null && bDate !== null) return 1
  if (aDate !== null && bDate === null) return -1
  return (aDate || 0) - (bDate || 0)
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

function decorateBoardItems(items, type, scope) {
  return items.map(item => ({
    ...item,
    type,
    scope,
    tone: getStatusMeta(item.status).tone,
    laneKey: isUrgentItem(item) ? 'attention' : laneKeyFromStatus(item.status),
  }))
}

function itemContext(item, type) {
  if (type === 'task') {
    const dueLabel = item.dueDate ? `Vence ${formatShortDate(item.dueDate)}` : 'Sin vencimiento'
    return item.pharmacyName ? `${item.pharmacyName} · ${dueLabel}` : dueLabel
  }

  if (type === 'project') return item.pharmacy_name || 'Sin farmacia vinculada'
  if (item.pharmacyName && item.product) return `${item.pharmacyName} · ${item.product}`
  return item.pharmacyName || item.product || 'Sin contexto adicional'
}

function SmartLink({ to, className = '', children }) {
  if (!to) return <span className={className}>{children}</span>
  if (to.startsWith('#')) return <a href={to} className={className}>{children}</a>
  return <Link to={to} className={className}>{children}</Link>
}

function MetricTile({ label, value, hint, to, Icon, tone = 'slate' }) {
  const toneClasses = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  }[tone] || 'bg-slate-100 text-slate-700 ring-slate-200'

  return (
    <SmartLink
      to={to}
      className="group flex min-h-[112px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <span className={`inline-flex rounded-lg p-2 ring-1 ${toneClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
      </div>
    </SmartLink>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-400">
      {text}
    </div>
  )
}

function WorkItemRow({ item, type }) {
  const statusMeta = getStatusMeta(item.status)
  const to = type === 'support'
    ? `/soporte/tickets/${item.id}`
    : type === 'project'
      ? `/proyectos/${item.id}`
      : item.projectId
        ? `/proyectos/${item.projectId}`
        : '/proyectos'

  return (
    <SmartLink to={to} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50">
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-900">{item.title || item.name || 'Sin título'}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">{itemContext(item, type)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 sm:inline-flex ${statusToneClasses(statusMeta.tone)}`}>
          {item.statusLabel || statusMeta.label}
        </span>
        <ArrowRightIcon className="h-3.5 w-3.5 text-slate-300" />
      </span>
    </SmartLink>
  )
}

function CompactList({ title, caption, items, type, emptyText, to, limit = 5 }) {
  const visibleItems = items.slice(0, limit)

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-950">{title}</h2>
          {caption ? <p className="mt-0.5 text-xs text-slate-500">{caption}</p> : null}
        </div>
        {to ? (
          <SmartLink to={to} className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900">
            Ver todo <ArrowRightIcon className="h-3.5 w-3.5" />
          </SmartLink>
        ) : null}
      </header>

      <div className="divide-y divide-slate-100 p-2">
        {visibleItems.length ? visibleItems.map(item => (
          <WorkItemRow key={`${type}-${item.id}`} item={item} type={type} />
        )) : (
          <div className="p-2"><EmptyState text={emptyText} /></div>
        )}
      </div>
    </section>
  )
}

function StatusPanel({ title, caption, items, activeStatus, onStatusClick, onClear }) {
  const total = totalCount(items)

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{caption}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{total}</span>
          {activeStatus ? (
            <button type="button" onClick={onClear} className="text-xs font-bold text-teal-700 hover:underline">
              Limpiar
            </button>
          ) : null}
        </div>
      </header>

      <div className="space-y-2 p-3">
        {items.length ? items.map(item => {
          const percent = total ? Math.max(6, Math.round((item.count / total) * 100)) : 0
          const isActive = activeStatus === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onStatusClick(item.key)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${isActive ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-slate-50/70 hover:bg-white'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusToneClasses(item.tone)}`}>{item.label}</span>
                <span className="text-sm font-black text-slate-800">{item.count}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full ${CHART_BAR_TONE[item.tone] || CHART_BAR_TONE.gray}`} style={{ width: `${percent}%` }} />
              </div>
            </button>
          )
        }) : (
          <EmptyState text="Sin elementos activos en esta cola." />
        )}
      </div>
    </section>
  )
}

function ProjectStatusPanel({ projects, statuses, loading }) {
  const total = statuses.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-950">Proyectos</h2>
          <p className="mt-0.5 text-xs text-slate-500">Estado de cartera y últimos proyectos abiertos.</p>
        </div>
        <Link to="/proyectos" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900">
          Abrir <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="space-y-3 p-3">
        {loading ? (
          <EmptyState text="Cargando proyectos..." />
        ) : (
          <>
            <div className="space-y-2">
              {statuses.length ? statuses.map(item => {
                const percent = total ? Math.max(6, Math.round((item.count / total) * 100)) : 0
                return (
                  <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{item.label}</span>
                      <span className="font-black text-slate-900">{item.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${item.color || 'bg-slate-400'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              }) : (
                <EmptyState text="Sin datos de estado de proyectos." />
              )}
            </div>

            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {projects.slice(0, 4).length ? projects.slice(0, 4).map(project => (
                <WorkItemRow key={project.id} item={{ ...project, title: project.name }} type="project" />
              )) : (
                <div className="p-3"><EmptyState text="No hay proyectos recientes en esta vista." /></div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function BoardItemCard({ item }) {
  const to = item.type === 'support'
    ? `/soporte/tickets/${item.id}`
    : item.projectId
      ? `/proyectos/${item.projectId}`
      : '/proyectos'

  return (
    <SmartLink to={to} className="block rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/30">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] ${item.type === 'task' ? 'bg-slate-900 text-white' : 'bg-teal-600 text-white'}`}>
          {item.type === 'task' ? 'Tarea' : 'Ticket'}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {item.scope === 'mine' ? 'Mío' : 'Equipo'}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">{item.title}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{itemContext(item, item.type)}</p>
    </SmartLink>
  )
}

function BoardLane({ laneKey, items }) {
  const lane = LANE_META[laneKey]
  const visibleItems = items.slice(0, 4)

  return (
    <section className={`rounded-xl border p-3 shadow-sm ${lane.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${lane.badge}`}>
            {lane.title}
          </span>
          <p className="mt-2 text-xs text-slate-500">{lane.caption}</p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{items.length}</span>
      </div>

      <div className="mt-3 space-y-2">
        {visibleItems.length ? visibleItems.map(item => <BoardItemCard key={`${laneKey}-${item.type}-${item.id}-${item.scope}`} item={item} />) : (
          <EmptyState text="Sin elementos." />
        )}
      </div>
    </section>
  )
}

function RecentActivity({ items }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold text-slate-950">Actividad reciente</h2>
          <p className="mt-0.5 text-xs text-slate-500">Últimos movimientos de tickets, tareas y proyectos.</p>
        </div>
      </header>
      <div className="divide-y divide-slate-100 p-2">
        {items.length ? items.map(item => (
          <SmartLink key={`${item.type}-${item.id}-${item.date}`} to={item.to} className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1 ${
              item.type === 'Ticket' ? 'bg-teal-50 text-teal-700 ring-teal-100' : item.type === 'Proyecto' ? 'bg-sky-50 text-sky-700 ring-sky-100' : 'bg-slate-100 text-slate-700 ring-slate-200'
            }`}>
              {item.type.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-slate-700"><b>{item.type}</b> · {item.title}</span>
              <span className="block truncate text-xs text-slate-400">{item.meta || 'Sin contexto'} · {formatRelativeTime(item.date)}</span>
            </span>
          </SmartLink>
        )) : (
          <div className="p-2"><EmptyState text="Todavía no hay actividad reciente." /></div>
        )}
      </div>
    </section>
  )
}

function SortHeaderButton({ column, sort, onSort }) {
  const isActive = sort.key === column.key
  const defaultDirection = column.key === 'urgency' ? 'desc' : 'asc'
  const nextDirection = isActive ? (sort.direction === 'asc' ? 'desc' : 'asc') : defaultDirection

  return (
    <button
      type="button"
      onClick={() => onSort({ key: column.key, direction: nextDirection })}
      className={`inline-flex items-center gap-1 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] transition ${isActive ? 'text-teal-700' : 'text-slate-400 hover:text-slate-700'}`}
    >
      {column.label}
      <span className="text-[10px]">{isActive ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
    </button>
  )
}

function PendingTicketsTable({ tickets, sort, onSort }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-950">Tickets pendientes de resolver</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Orden inicial por urgencia y después por fecha. Pulsa una cabecera para cambiar el criterio.
          </p>
        </div>
        <Link to="/soporte/tickets" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900">
          Ver soporte <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </header>

      {tickets.length ? (
        <div className="max-h-[460px] overflow-auto">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
              <tr>
                <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Ticket</th>
                {TICKET_SORT_COLUMNS.map(column => (
                  <th key={column.key} className="px-3 py-3">
                    <SortHeaderButton column={column} sort={sort} onSort={onSort} />
                  </th>
                ))}
                <th className="px-3 py-3 text-right text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">Abrir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map(ticket => {
                const priority = getPriorityMeta(ticket.priority)
                const status = getStatusMeta(ticket.status)
                const date = ticketDate(ticket)
                const priorityClasses = PRIORITY_BADGE_CLASSES[priority.tone] || PRIORITY_BADGE_CLASSES.gray

                return (
                  <tr key={ticket.id} className="bg-white transition hover:bg-teal-50/30">
                    <td className="max-w-[280px] px-4 py-3">
                      <Link to={`/soporte/tickets/${ticket.id}`} className="block truncate font-extrabold text-slate-950 hover:text-teal-700">
                        {ticket.publicNumber ? `#${ticket.publicNumber} · ` : ''}{ticket.title}
                      </Link>
                      <p className="mt-1 truncate text-xs text-slate-400">{ticket.product || ticket.type || 'Sin producto indicado'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${priorityClasses}`}>
                          {priority.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusToneClasses(status.tone)}`}>
                          {ticket.statusLabel || status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold text-slate-600">
                      <span className="block">{date ? formatShortDate(date) : 'Sin fecha'}</span>
                      <span className="mt-0.5 block font-normal text-slate-400">{formatRelativeTime(date)}</span>
                    </td>
                    <td className="max-w-[170px] px-3 py-3">
                      <span className="block truncate font-semibold text-slate-700">{ticket.pharmacyName || 'Sin farmacia'}</span>
                    </td>
                    <td className="max-w-[160px] px-3 py-3">
                      <span className={`block truncate font-semibold ${ticket.assignedTo ? 'text-slate-700' : 'text-rose-600'}`}>
                        {ticket.assignedTo || 'Sin asignar'}
                      </span>
                    </td>
                    <td className="max-w-[150px] px-3 py-3">
                      <span className="block truncate text-slate-600">{ticketGroup(ticket)}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link to={`/soporte/tickets/${ticket.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700" aria-label={`Abrir ticket ${ticket.title}`}>
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-3">
          <EmptyState text="No hay tickets pendientes de resolver." />
        </div>
      )}
    </section>
  )
}

export default function DashboardPage() {
  const { profile, session } = useAuth()
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard(profile?.company_id)
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
  const [ticketSort, setTicketSort] = useState({ key: 'urgency', direction: 'desc' })
  const dashboardUserName = useMemo(() => profileDisplayName(profile, session), [profile, session])
  const todayLabel = useMemo(() => formatTodayLabel(), [])

  const allTasks = useMemo(() => [...myPendingTasks, ...generalPendingTasks], [generalPendingTasks, myPendingTasks])
  const allSupport = useMemo(() => [...myPendingSupport, ...generalPendingSupport], [generalPendingSupport, myPendingSupport])
  const sortedPendingTickets = useMemo(
    () => [...allSupport].sort((a, b) => compareTicketSort(a, b, ticketSort)),
    [allSupport, ticketSort],
  )

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

  const rawBoardItems = useMemo(() => ([
    ...decorateBoardItems(myPendingTasks, 'task', 'mine'),
    ...decorateBoardItems(generalPendingTasks, 'task', 'team'),
    ...decorateBoardItems(myPendingSupport, 'support', 'mine'),
    ...decorateBoardItems(generalPendingSupport, 'support', 'team'),
  ]).sort((a, b) => boardPriority(b) - boardPriority(a)), [generalPendingSupport, generalPendingTasks, myPendingSupport, myPendingTasks])

  const metrics = useMemo(() => {
    const supportTotal = allSupport.length
    const taskTotal = allTasks.length
    const supportOpen = countStatuses(supportStatusSummary, ['nuevo', 'abierto', 'open', 'pending', 'active', 'en_progreso', 'in_progress'])
    const supportWaiting = countStatuses(supportStatusSummary, ['esperando_cliente', 'esperando_proveedor'])
    const supportUnassigned = allSupport.filter(item => !item.assignedTo).length
    const attentionCount = rawBoardItems.filter(item => item.laneKey === 'attention').length
    const progressCount = rawBoardItems.filter(item => item.laneKey === 'progress').length
    const mineTotal = myPendingTasks.length + myPendingSupport.length

    return {
      supportTotal,
      taskTotal,
      supportOpen: supportOpen || supportTotal,
      supportWaiting,
      supportUnassigned,
      attentionCount,
      progressCount,
      mineTotal,
    }
  }, [allSupport, allTasks, rawBoardItems, supportStatusSummary, myPendingSupport.length, myPendingTasks.length])

  const boardLanes = useMemo(() => ({
    queue: boardItems.filter(item => item.laneKey === 'queue'),
    progress: boardItems.filter(item => item.laneKey === 'progress'),
    attention: boardItems.filter(item => item.laneKey === 'attention'),
  }), [boardItems])

  const urgentTasks = useMemo(() => {
    const dashboardUrgent = [
      ...(dashboardData?.overdueTasks || []),
      ...(dashboardData?.todayTasks || []),
    ].map(task => ({
      ...task,
      title: task.title,
      dueDate: task.due_date,
      projectId: task.project_id,
      pharmacyName: task.pharmacy_name,
    }))

    return dashboardUrgent.length ? dashboardUrgent : allTasks.slice(0, 8)
  }, [allTasks, dashboardData])

  const recentActivity = useMemo(() => {
    const supportItems = allSupport.map(item => ({
      id: item.id,
      type: 'Ticket',
      title: item.title,
      meta: item.pharmacyName || item.product,
      date: item.updatedAt || item.createdAt,
      to: `/soporte/tickets/${item.id}`,
    }))
    const taskItems = allTasks.map(item => ({
      id: item.id,
      type: 'Tarea',
      title: item.title,
      meta: item.pharmacyName || item.assignedTo,
      date: item.updatedAt || item.createdAt || item.dueDate,
      to: item.projectId ? `/proyectos/${item.projectId}` : '/proyectos',
    }))
    const projectItems = (dashboardData?.periodProjects || []).map(project => ({
      id: project.id,
      type: 'Proyecto',
      title: project.name,
      meta: project.pharmacy_name,
      date: project.created_at,
      to: `/proyectos/${project.id}`,
    }))

    return [...supportItems, ...taskItems, ...projectItems]
      .filter(item => item.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [allSupport, allTasks, dashboardData])

  const activeProjects = dashboardLoading ? '—' : (dashboardData?.projectsActive ?? 0)
  const pendingTasks = dashboardLoading ? (metrics.taskTotal || '—') : (dashboardData?.tasksPending ?? metrics.taskTotal)
  const dashboardWarnings = [
    warning ? 'Algunos datos operativos no se pudieron cargar del todo. Se muestra la mejor información disponible.' : '',
    dashboardError ? `Proyectos: ${dashboardError}` : '',
  ].filter(Boolean)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-wrapper space-y-3 pb-8">
      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-teal-700">
              <Squares2X2Icon className="h-4 w-4" /> Panel de información
            </p>
            <h1 className="mt-1 flex flex-wrap items-baseline gap-x-2 font-display text-2xl tracking-tight text-slate-950">
              <span className="font-black">Hola {dashboardUserName}</span>
              <span className="text-[1.25em] font-black leading-none text-slate-900">|</span>
              <span className="font-light text-slate-600">{todayLabel}</span>
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Tickets, proyectos y tareas en una sola pantalla para decidir qué atender primero.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
              Actualizado: {formatUpdateTime(lastUpdated)}
            </span>
            <button type="button" onClick={reload} className="btn-primary !px-3 !py-2 !text-xs">
              <ArrowPathIcon className="h-3.5 w-3.5" /> Actualizar
            </button>
          </div>
        </div>
      </section>

      {dashboardWarnings.length ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            {dashboardWarnings.map(message => <p key={message}>{message}</p>)}
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricTile
          label="Tickets sin resolver"
          value={metrics.supportTotal}
          hint="Incidencias vivas que requieren seguimiento."
          to="/soporte/tickets"
          Icon={TicketIcon}
          tone="teal"
        />
        <MetricTile
          label="Tickets abiertos"
          value={metrics.supportOpen}
          hint="Entrada activa y tickets en progreso."
          to="/soporte/tickets"
          Icon={LifebuoyIcon}
          tone="blue"
        />
        <MetricTile
          label="En espera"
          value={metrics.supportWaiting}
          hint="Cliente o proveedor bloqueando avance."
          to="#dashboard-board"
          Icon={ClockIcon}
          tone="amber"
        />
        <MetricTile
          label="No asignados"
          value={metrics.supportUnassigned}
          hint="Tickets pendientes de responsable."
          to="/soporte/tickets"
          Icon={UserGroupIcon}
          tone="rose"
        />
        <MetricTile
          label="Proyectos activos"
          value={activeProjects}
          hint="Cartera en curso de comercial, soporte, formación e instalaciones."
          to="/proyectos"
          Icon={Squares2X2Icon}
          tone="slate"
        />
        <MetricTile
          label="Tareas pendientes"
          value={pendingTasks}
          hint="Trabajo previsto, vencido o en ejecución."
          to="#dashboard-board"
          Icon={ClipboardDocumentListIcon}
          tone="slate"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
        <div className="space-y-3">
          <section className="grid gap-3 lg:grid-cols-2">
            <CompactList
              title="Tareas de hoy y vencidas"
              caption="Lo que debería quedar resuelto o revisado antes."
              items={urgentTasks}
              type="task"
              emptyText="No hay tareas urgentes para hoy."
              to="/proyectos"
              limit={6}
            />
            <CompactList
              title="Tickets prioritarios"
              caption="Tickets ordenados por riesgo, espera y prioridad."
              items={rawBoardItems.filter(item => item.type === 'support').slice(0, 8)}
              type="support"
              emptyText="No hay tickets pendientes."
              to="/soporte/tickets"
              limit={6}
            />
          </section>

          <section id="dashboard-board" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm scroll-mt-24">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Flujo operativo</p>
                <h2 className="mt-1 text-base font-black text-slate-950">Tickets y tareas por estado de trabajo</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">{metrics.progressCount} en marcha</span>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{metrics.attentionCount} en riesgo</span>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">{metrics.mineTotal} míos</span>
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <BoardLane laneKey="queue" items={boardLanes.queue} />
              <BoardLane laneKey="progress" items={boardLanes.progress} />
              <BoardLane laneKey="attention" items={boardLanes.attention} />
            </div>
          </section>

          <PendingTicketsTable
            tickets={sortedPendingTickets}
            sort={ticketSort}
            onSort={setTicketSort}
          />
        </div>

        <aside className="space-y-3">
          <StatusPanel
            title="Tickets por estado"
            caption="Pulsa un estado para enfocar el flujo operativo."
            items={supportStatusSummary}
            activeStatus={supportStatusFilter}
            onStatusClick={status => setSupportStatusFilter(current => current === status ? '' : status)}
            onClear={() => setSupportStatusFilter('')}
          />

          <StatusPanel
            title="Tareas por estado"
            caption="Filtro rápido sobre las tareas del panel."
            items={taskStatusSummary}
            activeStatus={taskStatusFilter}
            onStatusClick={status => setTaskStatusFilter(current => current === status ? '' : status)}
            onClear={() => setTaskStatusFilter('')}
          />

          <ProjectStatusPanel
            projects={dashboardData?.periodProjects || []}
            statuses={dashboardData?.projectsByStatus || []}
            loading={dashboardLoading}
          />

          <RecentActivity items={recentActivity} />
        </aside>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Link to="/soporte/tickets?create=1" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40">
          <LifebuoyIcon className="h-5 w-5 text-teal-700" />
          <p className="mt-2 text-sm font-black text-slate-950">Crear ticket</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Registrar una incidencia o solicitud de soporte.</p>
        </Link>
        <Link to="/proyectos?create=1" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40">
          <CalendarDaysIcon className="h-5 w-5 text-teal-700" />
          <p className="mt-2 text-sm font-black text-slate-950">Crear proyecto</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Abrir un nuevo trabajo de comercial, soporte, formación o instalaciones.</p>
        </Link>
        <Link to="/proyectos" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40">
          <ChartBarIcon className="h-5 w-5 text-teal-700" />
          <p className="mt-2 text-sm font-black text-slate-950">Plan de trabajo</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Ver cartera, calendario y tareas abiertas.</p>
        </Link>
      </section>
    </div>
  )
}
