import { useEffect } from 'react'

/**
 * Modal base reutilizable.
 * Uso:
 *   <Modal isOpen={bool} onClose={fn} title="T\u00edtulo" maxWidth="max-w-lg">
 *     {children}
 *   </Modal>
 *
 * El scroll lo gestiona el overlay (fixed inset-0 overflow-y-auto).
 * El body queda bloqueado mientras el modal est\u00e1 abierto.
 */
export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className={`mx-auto my-8 w-full ${maxWidth} rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl`}>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            {title && <h2 className="text-xl font-semibold text-[#0F172A]">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition">
            \u2715
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
