import { useEffect } from 'react'

export default function Modal({ open, title, onClose, children, footer }) {
  // Bloquea el scroll del body mientras el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4">
      {/* Backdrop clickeable */}
      <button
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Cerrar modal"
        tabIndex={-1}
      />

      {/*
        Contenedor principal del modal:
        - flex flex-col para que header + body + footer se distribuyan correctamente
        - max-h calculado para no salir del viewport en móvil ni desktop
        - El body (children) es el único que hace scroll
      */}
      <div className="relative z-10 flex w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl"
        style={{ maxHeight: 'min(92dvh, 800px)' }}
      >
        {/* Header — fijo, nunca hace scroll */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>

        {/* Body — este es el único que hace scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {children}
        </div>

        {/* Footer — fijo al fondo, nunca hace scroll */}
        {footer && (
          <div className="shrink-0 border-t border-slate-200 px-4 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
