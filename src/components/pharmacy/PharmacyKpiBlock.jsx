import { usePharmacyKpis } from '../../hooks/usePharmacyKpis'

const BRAND_COLORS = {
  nixfarma: { bar: 'bg-sky-400',    text: 'text-sky-700',    bg: 'bg-sky-50'    },
  cashlogy: { bar: 'bg-violet-400', text: 'text-violet-700', bg: 'bg-violet-50' },
  hanshow:  { bar: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50'  },
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function BrandBadge({ label, value, total, colors }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${colors.bg}`}>
      <span className={`text-[11px] font-medium ${colors.text}`}>{label}</span>
      <span className={`text-[11px] font-semibold ${colors.text}`}>
        {value}
        <span className="font-normal opacity-60">/{total}</span>
      </span>
    </div>
  )
}

export default function PharmacyKpiBlock({ companyId }) {
  const { rows, totals, loading, error } = usePharmacyKpis(companyId)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden animate-pulse">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
        <div className="p-5 space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-5">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-8 text-center">
        <p className="text-sm text-gray-400">Sin datos de farmacias</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-900">Farmacias por provincia</h2>
        <span className="text-xs text-gray-400">{totals.pharmacies} total</span>
      </div>

      <div className="grid grid-cols-3 gap-2 px-5 pt-4 pb-3">
        <BrandBadge label="Nixfarma" value={totals.nixfarma} total={totals.pharmacies} colors={BRAND_COLORS.nixfarma} />
        <BrandBadge label="Cashlogy" value={totals.cashlogy} total={totals.pharmacies} colors={BRAND_COLORS.cashlogy} />
        <BrandBadge label="Hanshow"  value={totals.hanshow}  total={totals.pharmacies} colors={BRAND_COLORS.hanshow}  />
      </div>

      <div className="px-5 pb-5 space-y-3">
        {rows.map(row => (
          <div key={row.province}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium text-gray-700">{row.label}</span>
              <span className="text-[13px] font-semibold text-gray-900">{row.total}</span>
            </div>
            <MiniBar value={row.total} max={totals.pharmacies} color="bg-[#1c473c]" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {row.nixfarma > 0 && (
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${BRAND_COLORS.nixfarma.bg} ${BRAND_COLORS.nixfarma.text}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                  Nixfarma {row.nixfarma}
                </span>
              )}
              {row.cashlogy > 0 && (
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${BRAND_COLORS.cashlogy.bg} ${BRAND_COLORS.cashlogy.text}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  Cashlogy {row.cashlogy}
                </span>
              )}
              {row.hanshow > 0 && (
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${BRAND_COLORS.hanshow.bg} ${BRAND_COLORS.hanshow.text}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Hanshow {row.hanshow}
                </span>
              )}
              {row.nixfarma === 0 && row.cashlogy === 0 && row.hanshow === 0 && (
                <span className="text-[11px] text-gray-300">Sin productos registrados</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
