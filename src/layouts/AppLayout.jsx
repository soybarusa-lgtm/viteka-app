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
  const [pinned,     setPinned]     = useState(false)  // anclada manualmente
  const [hovered,    setHovered]    = useState(false)  // hover del ratón
  const [mobileOpen, setMobileOpen] = useState(false)

  // La barra está "abierta" si está anclada O si el ratón está encima
  const isOpen = pinned || hovered

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
        <img src="/brand/logo-icon-colr.svg" alt="Viteka" className="h-8 w-auto" />
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
            <NavLink key={to} to={to} end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </NavLink>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
            <p className="px-3 py-1 text-xs text-gray-400 truncate">{session?.user?.email}</p>
            <button onClick={handleLogout}
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 shrink-0
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'w-56' : 'w-14'}`}
      >
        {/* ─ Cabecera logo + pin ─ */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 min-h-[4rem]">

          {/* Icono siempre visible — logo full solo cuando está abierta */}
          <div className="flex items-center gap-2 overflow-hidden">
            {isOpen ? (
              <img
                src="/brand/logo-full-color.svg"
                alt="Viteka"
                className="h-12 w-auto max-w-[148px] object-contain
                  transition-opacity duration-200 opacity-100"
              />
            ) : (
              <img
                src="/brand/logo-icon-colr.svg"
                alt="Viteka"
                className="h-8 w-8 object-contain"
              />
            )}
          </div>

          {/* Chevron solo visible cuando está abierta — ancla/desancla */}
          {isOpen && (
            <button
              onClick={() => setPinned(p => !p)}
              title={pinned ? 'Desanclar menú' : 'Anclar menú abierto'}
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              {pinned
                ? <ChevronLeftIcon  className="w-4 h-4" />
                : <ChevronRightIcon className="w-4 h-4 text-teal-500" />
              }
            </button>
          )}
        </div>

        {/* ─ Nav ─ */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
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

        {/* ─ Footer usuario ─ */}
        <div className="px-2 py-3 border-t border-gray-200 space-y-1">
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

      {/* ── MAIN ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
