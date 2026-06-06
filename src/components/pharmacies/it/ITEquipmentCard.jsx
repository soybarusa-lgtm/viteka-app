import {
  ArrowTopRightOnSquareIcon,
  LifebuoyIcon,
  PencilSquareIcon,
  ServerIcon,
} from '@heroicons/react/24/outline'

function InfoRow({ label, value, accent = false }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`text-right font-medium ${accent ? 'text-blue-700' : 'text-slate-600'}`}>
        {value || '—'}
      </span>
    </div>
  )
}

export default function ITEquipmentCard({
  title,
  typeLabel,
  brandModel,
  location,
  ip,
  reviewDate,
  support,
  status,
  isViteka,
  hasMissingDates,
  onView,
  onEdit,
  onTicket,
}) {
  return (
    <article className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm transition-colors hover:border-teal-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {typeLabel}
            </span>
            {isViteka ? (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                Viteka
              </span>
            ) : null}
            {hasMissingDates ? (
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                Sin fechas
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-sm font-bold text-[#071A1D]">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{brandModel || 'Marca y modelo sin informar'}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
          <ServerIcon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <InfoRow label="Ubicación" value={location} />
        <InfoRow label="IP" value={ip} accent={Boolean(ip && ip !== '—')} />
        <InfoRow label="Revisión" value={reviewDate} />
        <InfoRow label="Soporte" value={support} />
        <InfoRow label="Estado" value={status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          Ver
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <PencilSquareIcon className="h-4 w-4" />
          Editar
        </button>
        <button
          type="button"
          onClick={onTicket}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#00695C] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
        >
          <LifebuoyIcon className="h-4 w-4" />
          Crear ticket
        </button>
      </div>
    </article>
  )
}
