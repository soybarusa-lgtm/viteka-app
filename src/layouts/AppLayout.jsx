import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  HomeIcon, BuildingStorefrontIcon, FolderIcon,
  ExclamationTriangleIcon, ArrowRightOnRectangleIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline'

const NAV = [
  { to: '/',           label: 'Dashboard',   Icon: HomeIcon },
  { to: '/farmacias',  label: 'Farmacias',   Icon: BuildingStorefrontIcon },
  { to: '/proyectos',  label: 'Proyectos',   Icon: FolderIcon },
  { to: '/incidencias',label: 'Incidencias', Icon: ExclamationTriangleIcon },
]

export default function AppLayout({ session }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <aside
        className={`relative flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${
          open ? 'w-56' : 'w-14'
        }`}
      >
        {/* Logo / toggle */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200 shrink-0">
          {open && (
            <span className="text-lg font-bold text-teal-600 truncate">Viteka</span>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            title={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            {open
              ? <ChevronLeftIcon  className="w-4 h-4" />
              : <ChevronRightIcon className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={!open ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {open && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-gray-200 space-y-1">
          {open && (
            <div className="px-2 py-1 text-xs text-gray-400 truncate">
              {session?.user?.email}
            </div>
          )}
          <button
            onClick={handleLogout}
            title={!open ? 'Cerrar sesión' : undefined}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
            {open && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
