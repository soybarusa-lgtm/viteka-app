import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function PharmacyModuleToolbar({
  query,
  onQueryChange,
  placeholder,
  filters = [],
  activeFilter = 'all',
  onFilterChange,
  rightSlot = null,
}) {
  return (
    <section className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={event => onQueryChange(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-[#DDEAE7] bg-white py-2.5 pl-10 pr-4 text-sm text-[#071A1D] transition-colors focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </label>

          {filters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => {
                const active = activeFilter === filter.value
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => onFilterChange(filter.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-teal-200 bg-teal-50 text-teal-700'
                        : 'border-[#DDEAE7] bg-white text-slate-500 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>

        {rightSlot ? <div className="flex flex-wrap items-center gap-2">{rightSlot}</div> : null}
      </div>
    </section>
  )
}
