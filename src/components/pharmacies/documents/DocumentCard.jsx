import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export default function DocumentCard({
  fileType,
  name,
  date,
  size,
  category,
  status,
  visibleForClient,
  onView,
  onDownload,
  onCopyLink,
  onEdit,
  onDelete,
}) {
  return (
    <article className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm transition-colors hover:border-teal-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600">
            {fileType || 'DOC'}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[#071A1D]">{name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span>{date || '—'}</span>
              <span>{size || '—'}</span>
              <span>{category || 'Sin categoría'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status === 'Revisado' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
            {status}
          </span>
          {visibleForClient ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              Visible cliente
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={onView} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          Ver
        </button>
        <button type="button" onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">
          <ArrowDownTrayIcon className="h-4 w-4" />
          Descargar
        </button>
        <button type="button" onClick={onCopyLink} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">
          <ClipboardDocumentIcon className="h-4 w-4" />
          Copiar enlace
        </button>
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700">
          <PencilSquareIcon className="h-4 w-4" />
          Editar
        </button>
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-xl bg-[#00695C] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700">
          <TrashIcon className="h-4 w-4" />
          Eliminar
        </button>
      </div>
    </article>
  )
}
