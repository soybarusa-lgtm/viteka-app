export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4">
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      <div className="relative z-10 w-full rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[75svh] overflow-y-auto px-4 py-4 sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="border-t border-slate-200 px-4 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
