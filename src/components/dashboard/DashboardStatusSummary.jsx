import { XMarkIcon } from '@heroicons/react/24/outline'
import { statusToneClasses } from '../../lib/operationalDashboardStatus'

export default function DashboardStatusSummary({ title, items, activeStatus, onStatusClick, onClear }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="truncate font-display text-sm font-extrabold text-slate-950">{title}</h2>
          <p className="text-[11px] text-slate-400">{total} pendiente{total === 1 ? '' : 's'}</p>
        </div>
        {activeStatus && (
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-3 w-3" /> Limpiar
          </button>
        )}
      </header>

      <div className="divide-y divide-slate-100">
        {items.length ? items.map(item => {
          const percent = total ? Math.round((item.count / total) * 100) : 0
          const isActive = activeStatus === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onStatusClick(item.key)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${isActive ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
            >
              <span className={`truncate rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${statusToneClasses(item.tone)}`}>{item.label}</span>
              <span className="shrink-0 text-xs font-bold text-slate-600">{item.count} · {percent}%</span>
            </button>
          )
        }) : (
          <p className="px-3 py-5 text-center text-sm text-slate-400">Sin pendientes.</p>
        )}
      </div>
    </section>
  )
}
