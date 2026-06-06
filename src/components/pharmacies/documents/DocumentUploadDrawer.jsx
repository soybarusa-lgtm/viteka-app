import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function DocumentUploadDrawer({
  open,
  onToggle,
  name,
  onNameChange,
  category,
  onCategoryChange,
  categories = [],
  selectedFile,
  onFileChange,
  visibleForClient,
  onVisibleForClientChange,
  notes,
  onNotesChange,
  onUpload,
  uploading,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 border-b border-[#DDEAE7] px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-bold text-[#071A1D]">Subir documento</p>
          <p className="mt-1 text-xs text-slate-500">Carga compacta con metadatos rápidos y sin ocupar media pantalla.</p>
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
          {open ? 'Ocultar' : 'Abrir'}
        </span>
      </button>

      {open ? (
        <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Nombre del documento</span>
              <input
                value={name}
                onChange={event => onNameChange(event.target.value)}
                className="w-full rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-[#071A1D] outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                placeholder="Contrato de mantenimiento"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Categoría</span>
              <select
                value={category}
                onChange={event => onCategoryChange(event.target.value)}
                className="w-full rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-[#071A1D] outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">Sin categoría</option>
                {categories.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Archivo</span>
              <input
                type="file"
                onChange={event => onFileChange(event.target.files?.[0] || null)}
                className="block w-full rounded-xl border border-[#DDEAE7] bg-white px-3 py-2 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-600"
              />
              {selectedFile ? <p className="mt-1 text-[11px] text-slate-400">{selectedFile.name}</p> : null}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={visibleForClient}
                onChange={event => onVisibleForClientChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600"
              />
              Visible para cliente
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Notas</span>
              <textarea
                rows={3}
                value={notes}
                onChange={event => onNotesChange(event.target.value)}
                className="w-full rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-[#071A1D] outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                placeholder="Notas internas o contexto para revisión"
              />
            </label>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-dashed border-[#DDEAE7] bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-[#071A1D]">Carga rápida</p>
              <p className="mt-1 text-xs text-slate-500">El archivo se sube y la ficha queda lista para revisar o compartir.</p>
            </div>
            <button
              type="button"
              onClick={onUpload}
              disabled={!selectedFile || uploading}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00695C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {uploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
