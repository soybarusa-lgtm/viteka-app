import { useState } from 'react'
import { ArrowRightIcon, CalendarDaysIcon, ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import DashboardPriorityBadge from './DashboardPriorityBadge'
import DashboardStatusBadge from './DashboardStatusBadge'
import { formatShortDate, formatShortDateTime, isOverdueDate } from '../../lib/operationalDashboardStatus'

function PendingItem({ item, type, showAssignee }) {
  const overdue = type === 'task' && isOverdueDate(item.dueDate)

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-teal-200 hover:bg-slate-50/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.publicNumber && <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-500">#{item.publicNumber}</span>}
            <DashboardStatusBadge status={item.status} label={item.statusLabel} />
            <DashboardPriorityBadge priority={item.priority} label={item.priorityLabel} />
            {overdue && <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-extrabold text-rose-700">Vencida</span>}
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-slate-950">{item.title}</h3>
          {item.description && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.description}</p>}
        </div>
        <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500">
        {item.pharmacyName && <span className="font-semibold text-slate-700">{item.pharmacyName}</span>}
        {type === 'task' && <span><CalendarDaysIcon className="mr-1 inline h-3.5 w-3.5" />{formatShortDate(item.dueDate)}</span>}
        {type === 'support' && <span>{formatShortDateTime(item.updatedAt || item.createdAt)}</span>}
        {item.product && <span>{item.product}</span>}
        {item.type && <span>{item.type}</span>}
        {showAssignee && item.assignedTo && <span><UserCircleIcon className="mr-1 inline h-3.5 w-3.5" />{item.assignedTo}</span>}
      </div>
    </article>
  )
}

export default function DashboardPendingList({ title, items, type = 'task', showAssignee = false, emptyText }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, 8)
  const hasMore = items.length > 8

  return (
    <section className="card overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="font-display text-base font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">{items.length} pendiente{items.length === 1 ? '' : 's'}</p>
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-extrabold text-teal-700">{items.length}</span>
      </header>

      <div className="space-y-2 bg-slate-50/50 p-3">
        {visible.length ? visible.map(item => <PendingItem key={`${type}-${item.id}`} item={item} type={type} showAssignee={showAssignee} />) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
            {emptyText || 'No hay pendientes en esta lista.'}
          </div>
        )}
      </div>

      {hasMore && (
        <footer className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Mostrando {visible.length} de {items.length} pendientes</span>
          <button type="button" onClick={() => setExpanded(value => !value)} className="inline-flex items-center justify-center gap-1 font-bold text-teal-700 hover:underline">
            {expanded ? 'Ver menos' : 'Ver todos'} <ChevronDownIcon className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </footer>
      )}
    </section>
  )
}
