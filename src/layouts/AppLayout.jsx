import { useState } from 'react'
import { supabase } from '../lib/supabase'
import NotificationBell from '../components/NotificationBell'

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IcDashboard()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function IcPharmacy()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IcProjects()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> }
function IcTasks()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> }
function IcChecklist()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg> }
function IcIncidents()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IcPeople()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IcDocuments()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function IcTimeline()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> }
function IcAudit()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IcUsers()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function IcSettings()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IcMenu()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function IcClose()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IcLogout()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }

// ── Logo Viteka ──────────────────────────────────────────────────────────────
function VitekaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <span className="text-sm font-semibold tracking-wide text-white">Viteka</span>
    </div>
  )
}

// ── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: IcDashboard,  roles: ['owner','admin','technician','commercial'] },
  { id: 'pharmacies',    label: 'Farmacias',     icon: IcPharmacy,   roles: ['owner','admin','technician','commercial'] },
  { id: 'projects',      label: 'Proyectos',     icon: IcProjects,   roles: ['owner','admin','technician','commercial'] },
  { id: 'tasks',         label: 'Tareas',        icon: IcTasks,      roles: ['owner','admin','technician','commercial'] },
  { id: 'checklists',    label: 'Checklists',    icon: IcChecklist,  roles: ['owner','admin','technician','commercial'] },
  { id: 'incidents',     label: 'Incidencias',   icon: IcIncidents,  roles: ['owner','admin','technician','commercial'] },
  { id: 'people',        label: 'Personas',      icon: IcPeople,     roles: ['owner','admin','commercial'] },
  { id: 'documents',     label: 'Documentos',    icon: IcDocuments,  roles: ['owner','admin','technician','commercial'] },
  { id: 'timeline',      label: 'Timeline',      icon: IcTimeline,   roles: ['owner','admin'] },
  { id: 'activity-logs', label: 'Auditoría',     icon: IcAudit,      roles: ['owner','admin'] },
  { id: 'users',         label: 'Equipo',        icon: IcUsers,      roles: ['owner','admin'] },
  { id: 'settings',      label: 'Configuración', icon: IcSettings,   roles: ['owner','admin'] },
]

// ── Sidebar link ─────────────────────────────────────────────────────────────
function SidebarLink({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
        active
          ? 'bg-white/12 text-white font-medium'
          : 'text-white/60 hover:bg-white/8 hover:text-white/90 font-normal'
      }`}
    >
      <span className={`shrink-0 transition-colors ${
        active ? 'text-white' : 'text-white/50 group-hover:text-white/80'
      }`}>
        <Icon />
      </span>
      <span className="truncate">{item.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />}
    </button>
  )
}

// ── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ visibleNav, currentPage, navigate, profile, onLogout, onClose }) {
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: '#1c473c' }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <VitekaLogo />
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white transition">
            <IcClose />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleNav.map(item => (
          <SidebarLink
            key={item.id}
            item={item}
            active={currentPage === item.id}
            onClick={() => { navigate(item.id); onClose?.() }}
          />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{profile?.full_name}</p>
            <p className="text-[11px] text-white/50 capitalize">{profile?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-red-300 transition"
        >
          <IcLogout /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ── Main layout ──────────────────────────────────────────────────────────────
export default function AppLayout({ children, profile, currentPage, navigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role       = profile?.role || 'technician'
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role))
  const bottomNav  = visibleNav.slice(0, 5)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f6f5f0' }}>

      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col" style={{ backgroundColor: '#1c473c' }}>
        <SidebarContent
          visibleNav={visibleNav}
          currentPage={currentPage}
          navigate={navigate}
          profile={profile}
          onLogout={onLogout}
        />
      </aside>

      {/* ── Sidebar móvil overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 h-full w-64 shadow-2xl">
            <SidebarContent
              visibleNav={visibleNav}
              currentPage={currentPage}
              navigate={navigate}
              profile={profile}
              onLogout={onLogout}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-2 text-gray-400 hover:text-gray-700 transition md:hidden"
          >
            <IcMenu />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell profile={profile} />
            <div className="hidden md:flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: '#1c473c' }}
              >
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-700">{profile?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Bottom nav móvil ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-gray-200 bg-white md:hidden">
        {bottomNav.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-1 flex-col items-center py-2.5 transition ${
                currentPage === item.id ? 'text-[#1c473c]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon />
              <span className="mt-0.5 text-[10px] truncate font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
