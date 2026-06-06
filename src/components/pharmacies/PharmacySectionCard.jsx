import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function PharmacySectionCard({
  title,
  count,
  subtitle,
  badges = [],
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  isOpen = true,
  onToggle,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
      <div className="border-b border-[#DDEAE7] bg-slate-50/80 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggle}
                className="inline-flex items-center gap-2 text-left"
              >
                <span className="text-sm font-bold text-[#071A1D]">{title}</span>
                {typeof count === 'number' ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-[#DDEAE7]">
                    {count}
                  </span>
                ) : null}
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {badges.map(badge => (
                <span
                  key={`${title}-${badge.label}`}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
          </div>

          {actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
            >
              {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>

      {isOpen ? <div className="p-4">{children}</div> : null}
    </section>
  )
}
