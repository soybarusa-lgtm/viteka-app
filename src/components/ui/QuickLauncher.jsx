import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  PlusIcon,
  RectangleGroupIcon,
  SquaresPlusIcon,
  UsersIcon,
  XMarkIcon,
  LifebuoyIcon,
  TicketIcon,
} from '@heroicons/react/24/outline'

const CREATE_ACTIONS = [
  {
    to: '/farmacias/nueva',
    label: 'Nueva farmacia',
    detail: 'Alta completa y equipamiento inicial',
    Icon: BuildingStorefrontIcon,
    tone: 'bg-teal-50 text-teal-700 ring-teal-100',
  },
  {
    to: '/proyectos?create=1&type=commercial',
    label: 'Nuevo proyecto',
    detail: 'Inicia un flujo comercial u operativo',
    Icon: FolderOpenIcon,
    tone: 'bg-sky-50 text-sky-700 ring-sky-100',
  },
  {
    to: '/cliente/soporte/tickets/nuevo',
    label: 'Nuevo ticket',
    detail: 'Registra una incidencia o consulta',
    Icon: TicketIcon,
    tone: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
]

const NAV_ACTIONS = [
  { to: '/farmacias', label: 'Farmacias', detail: 'Directorio y filtros', Icon: BuildingStorefrontIcon },
  { to: '/personas', label: 'Personas', detail: 'Contactos y responsables', Icon: UsersIcon },
  { to: '/planificacion', label: 'Planificación', detail: 'Ciclos, módulos y vistas', Icon: RectangleGroupIcon },
  { to: '/proyectos', label: 'Proyectos', detail: 'Pipelines, calendario y tareas', Icon: FolderOpenIcon },
  { to: '/soporte/dashboard', label: 'Soporte', detail: 'Incidencias, tickets y seguimiento', Icon: LifebuoyIcon },
  { to: '/documentos', label: 'Documentación', detail: 'Biblioteca corporativa', Icon: DocumentTextIcon },
]

export default function QuickLauncher({ open, onClose }) {
  const dialogRef = useRef(null)
  const firstActionRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusId = window.requestAnimationFrame(() => firstActionRef.current?.focus())

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll('a[href], button:not([disabled])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusId)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-launcher-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal-700">Acceso rápido</p>
            <h2 id="quick-launcher-title" className="mt-1 font-display text-xl font-extrabold text-slate-950 sm:text-2xl">
              ¿Qué quieres hacer?
            </h2>
            <p className="mt-1 text-sm text-slate-500">Crea un registro o salta directamente al área de trabajo.</p>
          </div>
          <button type="button" aria-label="Cerrar accesos rápidos" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {CREATE_ACTIONS.map(({ to, label, detail, Icon, tone }, index) => (
            <Link
              ref={index === 0 ? firstActionRef : undefined}
              key={to}
              to={to}
              onClick={onClose}
              className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-md"
            >
              <span className={`inline-flex rounded-lg p-2.5 ring-1 ${tone}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-display text-sm font-extrabold text-slate-900">
                  <PlusIcon className="h-3.5 w-3.5 text-teal-700" /> {label}
                </span>
                <span className="mt-1 block text-xs text-slate-500">{detail}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Ir a un módulo</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {NAV_ACTIONS.map(({ to, label, detail, Icon }) => (
              <Link key={to} to={to} onClick={onClose} className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50">
                <Icon className="h-5 w-5 shrink-0 text-teal-700" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800">{label}</span>
                  <span className="block truncate text-xs text-slate-400">{detail}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <footer className="mt-5 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2.5 text-xs text-teal-800">
          <SquaresPlusIcon className="h-4 w-4 shrink-0" />
          Incidencias ya dispone de un portal conectado para equipo interno y clientes.
        </footer>
      </section>
    </div>
  )
}
