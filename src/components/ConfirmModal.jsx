import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

/**
 * ConfirmModal — modal de confirmación reutilizable
 * Props:
 *   open      boolean
 *   title     string
 *   message   string
 *   confirmLabel  string  (default: 'Eliminar')
 *   danger    boolean  (default: true)  — botón rojo vs teal
 *   onConfirm () => void
 *   onCancel  () => void
 */
export default function ConfirmModal({
  open,
  title = '¿Estás seguro?',
  message,
  confirmLabel = 'Eliminar',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Tarjeta */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? 'bg-red-100' : 'bg-teal-50'
          }`}>
            <ExclamationTriangleIcon className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-teal-600'}`} />
          </div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        {message && <p className="text-sm text-gray-500">{message}</p>}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
