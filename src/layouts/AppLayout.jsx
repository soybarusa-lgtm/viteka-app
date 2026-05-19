import { useState, useEffect } from 'react'
import NotificationBell from '../components/NotificationBell'

// ── SVG Icons ────────────────────────────────────────────────────────────────
function IcDashboard()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function IcPharmacy()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IcProjects()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> }
function IcTasks()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> }
function IcChecklist()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg> }
function IcIncidents()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IcPeople()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IcDocuments()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function IcTimeline()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> }
function IcAudit()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IcUsers()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function IcSettings()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IcLogout()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function IcChevronRight(){ return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }
function IcChevronLeft() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
function IcMenu()        { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function IcClose()       { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

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

// ── NavLink ──────────────────────────────────────────────────────────────────
function NavLink({ item, active, expanded, onClick }) {
  const Icon = item.icon
  return (
    <button
      title={!expanded ? item.label : undefined}
      onClick={onClick}
      className={`group relative flex w-full items-center rounded-lg transition-all duration-150
        ${ expanded ? 'gap-3 px-3 py-2' : 'justify-center px-0 py-2.5' }
        ${ active
            ? 'bg-white/12 text-white font-medium'
            : 'text-white/60 hover:bg-white/8 hover:text-white/90 font-normal'
        }`}
    >
      <span className={`shrink-0 ${ active ? 'text-white' : 'text-white/50 group-hover:text-white/80' }`}>
        <Icon />
      </span>
      {expanded && <span className="truncate text-sm">{item.label}</span>}
      {expanded && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />}
    </button>
  )
}

// ── Desktop Sidebar ─────────────────────────────────────────────────────────────
function DesktopSidebar({ visibleNav, currentPage, navigate, profile, onLogout, expanded, onToggle }) {
  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden transition-all duration-200 ease-in-out"
      style={{ width: expanded ? '224px' : '56px', backgroundColor: '#1c473c' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center py-3 gap-1.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: expanded ? '80px' : '84px' }}
      >
        {expanded ? (
          <div className="flex w-full items-center gap-2 px-3">
            <img src="/brand/logo-white.svg" alt="Viteka" className="object-contain flex-1 min-w-0" style={{ height: '56px', maxWidth: '172px' }} draggable={false} />
            <button onClick={onToggle} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white transition">
              <IcChevronLeft />
            </button>
          </div>
        ) : (
          <>
            <img src="/brand/logo-icon.svg" alt="Viteka" className="object-contain" style={{ height: '32px', width: '32px' }} draggable={false} />
            <button onClick={onToggle} className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:bg-white/10 hover:text-white transition">
              <IcChevronRight />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-2 space-y-0.5 ${ expanded ? 'px-2' : 'px-1.5' }`}>
        {visibleNav.map(item => (
          <NavLink key={item.id} item={item} active={currentPage === item.id} expanded={expanded} onClick={() => navigate(item.id)} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className={`px-2 py-1 ${ !expanded && 'flex justify-center' }`}>
          <NotificationBell userId={profile?.id} dark sidebarExpanded={expanded} />
        </div>
        <div className={`mt-1 ${ expanded ? 'px-2' : 'flex flex-col items-center px-1' }`}>
          {expanded ? (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white">{profile?.full_name}</p>
                <p className="text-[11px] text-white/50 capitalize">{profile?.role}</p>
              </div>
              <button onClick={onLogout} title="Cerrar sesión" className="text-white/30 hover:text-red-300 transition"><IcLogout /></button>
            </div>
          ) : (
            <button onClick={onLogout} title={`${profile?.full_name} — Cerrar sesión`}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white hover:ring-2 hover:ring-red-400 transition">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

// ── Mobile Drawer ─────────────────────────────────────────────────────────────
function MobileDrawer({ visibleNav, currentPage, navigate, profile, onLogout, open, onClose }) {
  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    // Portal-level: fixed inset-0 z-[9999] para que nada lo tape
    <div className="fixed inset-0 z-[9999] flex md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className="relative flex h-full w-72 max-w-[85vw] flex-col shadow-2xl"
        style={{ backgroundColor: '#1c473c' }}
      >
        {/* Header del drawer */}
        <div
          className="flex flex-shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: '60px' }}
        >
          <img src="/brand/logo-white.svg" alt="Viteka" className="object-contain" style={{ height: '40px', maxWidth: '140px' }} draggable={false} />
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition">
            <IcClose />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.map(item => (
            <NavLink
              key={item.id}
              item={item}
              active={currentPage === item.id}
              expanded={true}
              onClick={() => { navigate(item.id); onClose() }}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="flex-shrink-0 px-3 pb-6 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="mb-2 px-1">
            <NotificationBell userId={profile?.id} dark sidebarExpanded={true} />
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-1 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile?.full_name}</p>
              <p className="text-[11px] text-white/50 capitalize">{profile?.role}</p>
            </div>
            <button onClick={onLogout} className="text-white/30 hover:text-red-300 transition"><IcLogout /></button>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function AppLayout({ children, profile, currentPage, navigate, onLogout }) {
  const [expanded,   setExpanded]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const role       = profile?.role || 'technician'
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role))
  const bottomNav  = visibleNav.slice(0, 5)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f6f5f0' }}>

      {/* Desktop sidebar */}
      <DesktopSidebar
        visibleNav={visibleNav}
        currentPage={currentPage}
        navigate={navigate}
        profile={profile}
        onLogout={onLogout}
        expanded={expanded}
        onToggle={() => setExpanded(v => !v)}
      />

      {/* Mobile drawer (z-[9999], no tiene problema de contexto) */}
      <MobileDrawer
        visibleNav={visibleNav}
        currentPage={currentPage}
        navigate={navigate}
        profile={profile}
        onLogout={onLogout}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Contenido principal */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ── Top bar móvil — verde corporativo ── */}
        <div
          className="flex items-center justify-between px-4 py-3 md:hidden"
          style={{ backgroundColor: '#1c473c' }}
        >
          {/* Logo icon blanco */}
          <img
            src="/brand/logo-icon.svg"
            alt="Viteka"
            className="h-8 w-8 object-contain"
            draggable={false}
          />
          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
            aria-label="Abrir menú"
          >
            <IcMenu />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Bottom nav móvil */}
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
