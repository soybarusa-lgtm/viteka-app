import {
  BriefcaseIcon,
  ClipboardDocumentIcon,
  LifebuoyIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'

export default function PharmacyProjectCard({
  name,
  category,
  statusLabel,
  pharmacyName,
  responsible,
  nextDate,
  amount,
  nextStep,
  onOpen,
  onEdit,
  onTask,
  onTicket,
}) {
  return (
    <article className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm transition-colors hover:border-teal-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {category}
            </span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
              {statusLabel}
            </span>
          </div>
          <h3 className="mt-2 truncate text-sm font-bold text-[#071A1D]">{name}</h3>
          <p className="mt-1 text-xs text-slate-500">{pharmacyName}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
          <BriefcaseIcon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div>Responsable: <span className="font-medium">{responsible || '—'}</span></div>
        <div>Fecha próxima: <span className="font-medium">{nextDate || '—'}</span></div>
        <div>Importe estimado: <span className="font-medium">{amount || '—'}</span></div>
        <div>Próximo paso: <span className="font-medium">{nextStep || '—'}</span></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={onOpen} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">
          <BriefcaseIcon className="h-4 w-4" />
          Abrir
        </button>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">
          <PencilSquareIcon className="h-4 w-4" />
          Editar
        </button>
        <button type="button" onClick={onTask} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">
          <ClipboardDocumentIcon className="h-4 w-4" />
          Crear tarea
        </button>
        <button type="button" onClick={onTicket} className="inline-flex items-center gap-1.5 rounded-xl bg-[#00695C] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700">
          <LifebuoyIcon className="h-4 w-4" />
          Crear ticket
        </button>
      </div>
    </article>
  )
}
