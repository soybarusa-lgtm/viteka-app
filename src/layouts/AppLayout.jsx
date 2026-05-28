import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  HomeIcon,
  BuildingStorefrontIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const NAV = [
  { to: '/', label: 'Dashboard', Icon: HomeIcon },
  { to: '/farmacias', label: 'Farmacias', Icon: BuildingStorefrontIcon },
]

export default function AppLayout({ session }) {
  const navigate = useNavigate()
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isOpen = pinned || hovered

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-200'
        : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
    }`

  return (
    <div className="brand-app-shell flex flex-col h-screen md:flex-row">
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white/95 border-b border-teal-900/10 shadow-sm shrink-0 z-20">
        <img src="/brand/logo-full-color.svg" alt="Viteka" className="h-9 w-auto max-w-[132px] object-contain" />
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="p-2 rounded-lg text-gray-500 hover:bg-teal-50 hover:text-teal-800 transition-colors"
        >
          {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white/95 border-b border-teal-900/10 shadow-lg z-10 px-4 py-3 space-y-1">
          {NAV.map(({ to, label, Icon }) => (
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
          <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
            <p className="px-3 py-1 text-xs text-gray-400 truncate">{session?.user?.email}</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden md:flex flex-col bg-white/95 border-r border-teal-900/10 shadow-[8px_0_26px_rgba(7,26,29,0.04)] shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'w-56' : 'w-14'
        }`}
      >
        <div className="relative flex items-center px-3 py-3 border-b border-teal-900/10 min-h-[4rem]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-700 via-green-400 to-cyan-400" />
          <div className={`flex items-center ${isOpen ? 'flex-1' : 'w-full justify-center'}`}>
            {isOpen ? (
              <img
                src="/brand/logo-full-color.svg"
                alt="Viteka"
                className="h-12 w-auto max-w-[148px] object-contain transition-opacity duration-200 opacity-100"
              />
            ) : (
              <img
                src="/brand/logo-icon-colr.svg"
                alt="Viteka"
                className="h-8 w-8 object-contain"
              />
            )}
          </div>

          {isOpen && (
            <button
              onClick={() => setPinned(p => !p)}
              title={pinned ? 'Desanclar menú' : 'Anclar menú abierto'}
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
            >
              {pinned
                ? <ChevronLeftIcon className="w-4 h-4" />
                : <ChevronRightIcon className="w-4 h-4 text-teal-500" />
              }
            </button>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!isOpen ? label : undefined}
              className={navLinkClass}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`truncate transition-all duration-200 ${
                isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-teal-900/10 space-y-1">
          <div className={`overflow-hidden transition-all duration-200 ${
            isOpen ? 'max-h-8 opacity-100 mb-1' : 'max-h-0 opacity-0'
          }`}>
            <p className="px-2 py-1 text-xs text-gray-400 truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title={!isOpen ? 'Cerrar sesión' : undefined}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            <span className={`transition-all duration-200 ${
              isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
            }`}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <main className="brand-main flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
