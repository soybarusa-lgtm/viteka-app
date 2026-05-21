import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  HomeIcon, BuildingStorefrontIcon, FolderIcon,
  ExclamationTriangleIcon, ArrowRightOnRectangleIcon,
  ChevronLeftIcon, ChevronRightIcon, Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline'

const NAV = [
  { to: '/',            label: 'Dashboard',   Icon: HomeIcon },
  { to: '/farmacias',   label: 'Farmacias',   Icon: BuildingStorefrontIcon },
  { to: '/proyectos',   label: 'Proyectos',   Icon: FolderIcon },
  { to: '/incidencias', label: 'Incidencias', Icon: ExclamationTriangleIcon },
]

export default function AppLayout({ session }) {
  const navigate = useNavigate()
  const [sideOpen, setSideOpen]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="flex flex-col h-screen bg-gray-50 md:flex-row">

      {/* ── MOBILE TOPBAR ────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 shrink-0 z-20">
        <img
          src="/brand/logo-icon-colr.svg"
          alt="Viteka"
          className="h-8 w-auto"
        />
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {mobileOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
        </button>
      </header>

      {/* ── MOBILE DROPDOWN MENU ─────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-10 px-4 py-3 space-y-1">
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

      {/* ── DESKTOP SIDEBAR ──────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 shrink-0 ${
          sideOpen ? 'w-56' : 'w-14'
        }`}
      >
        {/* Cabecera de la sidebar: logo + botón toggle debajo */}
        <div className={`flex flex-col border-b border-gray-200 py-3 px-2 gap-2 ${
          sideOpen ? 'items-start' : 'items-center'
        }`}>

          {/* Logo */}
          {sideOpen ? (
            <img
              src="/brand/logo-full-color.svg"
              alt="Viteka"
              className="h-12 w-auto max-w-[176px] object-contain pl-1"
            />
          ) : (
            <img
              src="/brand/logo-icon-colr.svg"
              alt="Viteka"
              className="h-8 w-8 object-contain"
            />
          )}

          {/* Botón abrir/cerrar — siempre debajo del logo */}
          <button
            onClick={() => setSideOpen(o => !o)}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors ${
              sideOpen ? 'self-start ml-1' : 'self-center'
            }`}
            title={sideOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sideOpen
              ? <ChevronLeftIcon  className="w-4 h-4" />
              : <ChevronRightIcon className="w-4 h-4" />
            }
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!sideOpen ? label : undefined}
              className={navLinkClass}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sideOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-gray-200 space-y-1">
          {sideOpen && (
            <p className="px-2 py-1 text-xs text-gray-400 truncate">{session?.user?.email}</p>
          )}
          <button
            onClick={handleLogout}
            title={!sideOpen ? 'Cerrar sesión' : undefined}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            {sideOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
