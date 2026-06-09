import { useCallback, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QuickLauncher from '../components/ui/QuickLauncher'
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  SquaresPlusIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  LifebuoyIcon,
  TicketIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { canAccessConfig } from '../lib/permissions'

const BASE_NAV = [
  { to: '/', label: 'Dashboard', Icon: HomeIcon },
  { to: '/farmacias', label: 'Farmacias', Icon: BuildingStorefrontIcon },
  { to: '/personas', label: 'Personas', Icon: UsersIcon },
  { to: '/proyectos', label: 'Proyectos', Icon: FolderOpenIcon },
  { to: '/soporte/dashboard', label: 'Soporte', Icon: LifebuoyIcon },
  { to: '/soporte/tickets', label: 'Tickets', Icon: TicketIcon },
  { to: '/soporte/estadisticas', label: 'Estadísticas soporte', Icon: ChartBarIcon },
  { to: '/documentos', label: 'Documentación', Icon: DocumentTextIcon },
]

export default function AppLayout({ session, profile }) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [launcherOpen, setLauncherOpen] = useState(false)

  const navItems = canAccessConfig(profile)
    ? [...BASE_NAV, { to: '/configuracion/general', label: 'Configuracion', Icon: Cog6ToothIcon }]
    : BASE_NAV

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const closeLauncher = useCallback(() => setLauncherOpen(false), [])

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
    }`

  return (
    <div className="brand-app-shell flex flex-col h-screen md:flex-row">
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white/95 border-b border-teal-900/10 shadow-sm shrink-0 z-20">
        <img src="/brand/logo-full-color.svg" alt="Viteka" className="h-9 w-auto max-w-[132px] object-contain" />
        <button
          onClick={() => setMobileOpen(o => !o)}
          type="button"
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileOpen}
          className="p-2 rounded-lg text-gray-500 hover:bg-teal-50 hover:text-teal-800 transition-colors"
        >
          {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 top-14 z-40 flex md:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]" />
          <div className="relative flex h-full w-[min(88vw,320px)] flex-col border-r border-teal-900/10 bg-white px-3 py-4 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                setLauncherOpen(true)
              }}
              className="mb-3 flex items-center gap-3 rounded-xl bg-teal-700 px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
            >
              <SquaresPlusIcon className="h-5 w-5" />
              Acceso rápido
            </button>
            <nav className="flex-1 space-y-1">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={navLinkClass}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
              <p className="px-3 py-1 text-xs text-gray-400 truncate">{session?.user?.email}</p>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <aside
        className="hidden md:flex w-[250px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white/95 shadow-[8px_0_26px_rgba(15,23,42,0.04)]"
      >
        <div className="relative flex items-center gap-3 border-b border-slate-100 px-4 py-4">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
          <img
            src="/brand/logo-full-color.svg"
            alt="Viteka"
            className="h-11 w-auto max-w-[150px] object-contain"
          />
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          <button
            type="button"
            onClick={() => setLauncherOpen(true)}
            className="mb-3 flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
          >
            <SquaresPlusIcon className="w-5 h-5 shrink-0" />
            Acceso rápido
          </button>
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={navLinkClass}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          <p className="px-2 text-xs text-slate-400 truncate">{session?.user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="brand-main min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <QuickLauncher open={launcherOpen} onClose={closeLauncher} />
    </div>
  )
}
