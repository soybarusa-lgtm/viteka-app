import { useState } from 'react'
import { supabase } from '../lib/supabase'
import NotificationBell from '../components/NotificationBell'

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '🏠', roles: ['owner','admin','technician','commercial'] },
  { id: 'pharmacies',   label: 'Farmacias',    icon: '🏪', roles: ['owner','admin','technician','commercial'] },
  { id: 'projects',     label: 'Proyectos',    icon: '📁', roles: ['owner','admin','technician','commercial'] },
  { id: 'tasks',        label: 'Tareas',       icon: '✅', roles: ['owner','admin','technician','commercial'] },
  { id: 'checklists',   label: 'Checklists',   icon: '📋', roles: ['owner','admin','technician','commercial'] },
  { id: 'incidents',    label: 'Incidencias',  icon: '🚨', roles: ['owner','admin','technician','commercial'] },
  { id: 'people',       label: 'Personas',     icon: '👥', roles: ['owner','admin','commercial'] },
  { id: 'documents',    label: 'Documentos',   icon: '📄', roles: ['owner','admin','technician','commercial'] },
  { id: 'timeline',     label: 'Timeline',     icon: '⏱️', roles: ['owner','admin'] },
  { id: 'activity-logs',label: 'Auditoría',    icon: '🔍', roles: ['owner','admin'] },
  { id: 'users',        label: 'Equipo',       icon: '👤', roles: ['owner','admin'] },
  { id: 'settings',     label: 'Configuración',icon: '⚙️', roles: ['owner','admin'] },
]

export default function AppLayout({ children, profile, currentPage, navigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role = profile?.role || 'technician'
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role))
  const bottomNav = visibleNav.slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="font-bold text-gray-900 text-sm">Viteka App</span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={currentPage === item.id ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Usuario */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full text-left text-xs text-gray-400 hover:text-red-500 transition px-1">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── SIDEBAR MÓVIL (overlay) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full shadow-xl z-10">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">V</div>
                <span className="font-bold text-gray-900 text-sm">Viteka App</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
              {visibleNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.id); setSidebarOpen(false) }}
                  className={currentPage === item.id ? 'sidebar-link-active w-full text-left' : 'sidebar-link w-full text-left'}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="px-3 py-3 border-t border-gray-100">
              <button onClick={onLogout} className="text-sm text-red-500">Cerrar sesión</button>
            </div>
          </aside>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700 mr-2"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell profile={profile} />
            <div className="hidden md:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-700">{profile?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV MÓVIL ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex">
        {bottomNav.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition ${
              currentPage === item.id ? 'text-teal-600 font-medium' : 'text-gray-400'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="mt-0.5 truncate text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
