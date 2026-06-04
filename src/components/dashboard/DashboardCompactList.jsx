import DashboardPriorityBadge from './DashboardPriorityBadge'
import DashboardStatusBadge from './DashboardStatusBadge'
import { formatShortDate } from '../../lib/operationalDashboardStatus'

function secondaryText(item, type) {
  if (type === 'task') return item.dueDate ? formatShortDate(item.dueDate) : 'Sin vencimiento'
  return item.pharmacyName || item.product || 'Sin farmacia/producto'
}

function CompactItem({ item, type }) {
  return (
    <article className="px-3 py-2 transition hover:bg-slate-50">
      <p className="truncate text-sm font-bold text-slate-900" title={item.title}>{item.title}</p>
      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
        <DashboardStatusBadge status={item.status} label={item.statusLabel} />
        <span className="text-slate-300">·</span>
        <DashboardPriorityBadge priority={item.priority} label={item.priorityLabel} />
        <span className="text-slate-300">·</span>
        <span className="truncate font-medium text-slate-500">{secondaryText(item, type)}</span>
      </div>
    </article>
  )
}

export default function DashboardCompactList({ title, items, type = 'task', emptyText }) {
  const visible = items.slice(0, 6)
  const hasMore = items.length > 6

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
        <h2 className="truncate font-display text-sm font-extrabold text-slate-950">{title}</h2>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-extrabold text-teal-700">{items.length}</span>
      </header>

      <div className="divide-y divide-slate-100">
        {visible.length ? visible.map(item => <CompactItem key={`${type}-${item.id}`} item={item} type={type} />) : (
          <p className="px-3 py-5 text-center text-sm text-slate-400">{emptyText || 'No hay pendientes.'}</p>
        )}
      </div>

      {hasMore && (
        <footer className="border-t border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-400">
          Mostrando 6 de {items.length}
        </footer>
      )}
    </section>
  )
}
