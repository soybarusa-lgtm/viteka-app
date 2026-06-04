import { XMarkIcon } from '@heroicons/react/24/outline'
import { statusToneClasses } from '../../lib/operationalDashboardStatus'

export default function DashboardStatusChart({ title, items, activeStatus, onStatusClick, onClear }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">{total} pendiente{total === 1 ? '' : 's'} en total</p>
        </div>
        {activeStatus && (
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
            <XMarkIcon className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {items.length ? items.map(item => {
          const percent = total ? Math.round((item.count / total) * 100) : 0
          const isActive = activeStatus === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onStatusClick(item.key)}
              className={`w-full rounded-xl border px-3 py-2 text-left transition ${isActive ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className={`rounded-full px-2 py-1 font-bold ring-1 ${statusToneClasses(item.tone)}`}>{item.label}</span>
                <span className="font-extrabold text-slate-900">{item.count}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">{percent}% del total</p>
            </button>
          )
        }) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-400">
            Sin pendientes en esta categoria.
          </div>
        )}
      </div>
    </section>
  )
}
