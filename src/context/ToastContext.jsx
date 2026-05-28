import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircleIcon className="w-5 h-5 text-teal-600" />,
  error:   <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
  info:    <InformationCircleIcon className="w-5 h-5 text-cyan-400" />,
}

const BORDER = {
  success: 'border-l-4 border-teal-600',
  error:   'border-l-4 border-red-500',
  info:    'border-l-4 border-cyan-400',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const remove = id => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Stack de toasts — esquina inferior derecha */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`flex items-start gap-3 bg-white rounded-xl shadow-lg shadow-teal-900/10 px-4 py-3 ${BORDER[type]} animate-fade-in`}
          >
            <span className="shrink-0 mt-0.5">{ICONS[type]}</span>
            <p className="flex-1 text-sm text-gray-700">{message}</p>
            <button onClick={() => remove(id)} className="shrink-0 text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
