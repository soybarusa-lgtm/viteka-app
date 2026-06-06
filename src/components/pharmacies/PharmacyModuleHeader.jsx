import PharmacyMetricCard from './PharmacyMetricCard'

export default function PharmacyModuleHeader({
  title,
  subtitle,
  metrics = [],
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  actionVariant = 'primary',
  extraActions = null,
}) {
  const actionClass = actionVariant === 'secondary'
    ? 'border border-[#DDEAE7] bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
    : 'bg-[#00695C] text-white hover:bg-teal-700'

  return (
    <section className="space-y-4 rounded-[28px] border border-[#DDEAE7] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            Ficha operativa
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-[#071A1D]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          {actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${actionClass}`}
            >
              {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>

      {metrics.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => (
            <PharmacyMetricCard key={metric.label} {...metric} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
