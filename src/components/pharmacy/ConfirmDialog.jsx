import { useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function ConfirmDialog({
  open = true,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  disabled = false,
}) {
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    if (pending || disabled) return
    setPending(true)
    try {
      await onConfirm?.()
    } finally {
      setPending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-red-500">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending || disabled}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
