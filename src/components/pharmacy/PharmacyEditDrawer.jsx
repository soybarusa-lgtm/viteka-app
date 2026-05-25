import { useEffect, useRef } from 'react'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

/**
 * Drawer lateral deslizante desde la derecha.
 * Props:
 *  - isOpen    : boolean
 *  - onClose   : () => void
 *  - title     : string
 *  - subtitle? : string
 *  - children  : ReactNode
 */
export default function PharmacyEditDrawer({ isOpen, onClose, title, subtitle, children }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          fixed inset-y-0 right-0 z-50 flex flex-col
          w-full sm:w-[600px] max-w-full
          bg-white shadow-2xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar panel"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Scrollable body — los hijos gestionan su propio scroll interno */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </>
  )
}
