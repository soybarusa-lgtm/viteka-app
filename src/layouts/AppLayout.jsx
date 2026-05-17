import { useEffect, useRef, useState } from 'react'
import { getCompanyBranding, getDefaultBranding } from '../lib/branding'
import NotificationBell from '../components/NotificationBell'

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
function Icon({ d, viewBox = '0 0 24 24', size = 18, children, ...p }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      {children}
    </svg>
  )
}
function IconDashboard({ size = 18 }) {
  return (<Icon size={size}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon>)
}
function IconPharmacy({ size = 18 }) {
  return (<Icon size={size}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>)
}
function IconPeople({ size = 18 }) {
  return (<Icon size={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>)
}
function IconProjects({ size = 18 }) {
  return (<Icon size={size}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></Icon>)
}
function IconTasks({ size = 18 }) {
  return (<Icon size={size}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Icon>)
}
function IconChecklists({ size = 18 }) {
  return (<Icon size={size}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Icon>)
}
function IconIncidents({ size = 18 }) {
  return (<Icon size={size}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>)
}
function IconDocuments({ size = 18 }) {
  return (<Icon size={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Icon>)
}
function IconUsers({ size = 18 }) {
  return (<Icon size={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>)
}
function IconAudit({ size = 18 }) {
  return (<Icon size={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>)
}
function IconSettings({ size = 18 }) {
  return (<Icon size={size}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>)
}
function IconLogout({ size = 18 }) {
  return (<Icon size={size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>)
}
function IconMenu({ size = 20 }) {
  return (<Icon size={size}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Icon>)
}
function IconClose({ size = 20 }) {
  return (<Icon size={size}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>)
}
function IconMore({ size = 20 }) {
  return (<Icon size={size}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></Icon>)
}

// ---------------------------------------------------------------------------
// Page label map
// ---------------------------------------------------------------------------
const PAGE_LABELS = {
  dashboard: 'Dashboard',
  clients: 'Farmacias',
  people: 'Personas',
  projects: 'Proyectos',
  tasks: 'Tareas',
  checklists: 'Checklists',
  incidents: 'Incidencias',
  documents: 'Documentación',
  timeline: 'Timeline',
  users: 'Usuarios',
  audit: 'Auditoría',
  settings: 'Configuración',
  'client-detail': 'Detalle farmacia',
  'checklist-execution': 'Ejecución checklist',
  'checklist-report': 'Informe checklist',
  'template-editor': 'Editor de plantilla',
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ---------------------------------------------------------------------------
// Sidebar NavItem (desktop)
// ---------------------------------------------------------------------------
function NavItem({ item, active, expanded, onClick }) {
  return (
    <button type="button" onClick={() => onClick(item.id)}
      title={!expanded ? item.label : undefined}
      className={`group relative flex h-10 w-full items-center rounded-xl transition-all duration-150 ${
        expanded ? 'gap-3 px-3' : 'justify-center px-0'
      } ${
        active ? 'bg-white/10 text-white' : 'text-[#8aab9e] hover:bg-white/5 hover:text-white'
      }`}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
      {expanded && (
        <span className={`truncate text-[14px] ${active ? 'font-medium text-white' : 'font-normal'}`}>
          {item.label}
        </span>
      )}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#34d399]" />
      )}
    </button>
  )
}

function NavDivider({ label, expanded }) {
  if (!expanded) return <div className="my-2 mx-3 h-px bg-white/10" />
  return (
    <div className="mx-3 mb-1 mt-4">
      <span className="text-[11px] font-medium uppercase tracking-widest text-[#4d7a6b]">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mobile Drawer
// ---------------------------------------------------------------------------
function MobileDrawer({ open, onClose, mainMenu, adminMenu, currentPage, setCurrentPage, onLogout, profile, branding }) {
  const drawerRef = useRef(null)

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function navigate(id) {
    setCurrentPage(id)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex" onClick={handleBackdrop}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Drawer panel */}
      <div ref={drawerRef}
        className="relative z-10 flex h-full w-[280px] flex-col overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#0a2018' }}>

        {/* Header */}
        <div className="flex h-[64px] items-center justify-between border-b border-white/5 px-4">
          <img src={branding.logo_white} alt={branding.company_name}
            className="h-auto max-h-8 w-auto max-w-[140px] object-contain"
            onError={e => { e.currentTarget.style.display = 'none' }} />
          <button type="button" onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8aab9e] hover:bg-white/10 hover:text-white">
            <IconClose />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#4d7a6b] px-2">Principal</div>
          <div className="flex flex-col gap-0.5">
            {mainMenu.map(item => (
              <button key={item.id} type="button" onClick={() => navigate(item.id)}
                className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[14px] transition ${
                  currentPage === item.id
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-[#8aab9e] hover:bg-white/5 hover:text-white'
                }`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                {item.label}
                {currentPage === item.id && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                )}
              </button>
            ))}
          </div>

          {adminMenu.length > 0 && (
            <>
              <div className="my-3 mx-2 h-px bg-white/10" />
              <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#4d7a6b] px-2">Administración</div>
              <div className="flex flex-col gap-0.5">
                {adminMenu.map(item => (
                  <button key={item.id} type="button" onClick={() => navigate(item.id)}
                    className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[14px] transition ${
                      currentPage === item.id
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-[#8aab9e] hover:bg-white/5 hover:text-white'
                    }`}>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User + Logout */}
        <div className="shrink-0 border-t border-white/5 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
              style={{ backgroundColor: branding.primary_color }}>
              {getInitials(profile?.full_name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">{profile?.full_name || 'Usuario'}</p>
              <p className="truncate text-[11px] text-[#4d7a6b] capitalize">{profile?.role || ''}</p>
            </div>
          </div>
          <button type="button" onClick={onLogout}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] text-[#8aab9e] transition hover:bg-white/5 hover:text-[#f87171]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center"><IconLogout /></span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mobile bottom tab bar (5 main sections)
// ---------------------------------------------------------------------------
const BOTTOM_TABS = [
  { id: 'dashboard',  label: 'Inicio',     icon: <IconDashboard size={20} /> },
  { id: 'checklists', label: 'Checklists', icon: <IconChecklists size={20} /> },
  { id: 'tasks',      label: 'Tareas',     icon: <IconTasks size={20} /> },
  { id: 'incidents',  label: 'Incidencias',icon: <IconIncidents size={20} /> },
  { id: 'more',       label: 'Más',        icon: <IconMore size={20} /> },
]

function BottomTabBar({ currentPage, onNavigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] flex h-[60px] items-center border-t border-[#E8EDF2] bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {BOTTOM_TABS.map(tab => {
        const active = tab.id !== 'more' && currentPage === tab.id
        return (
          <button key={tab.id} type="button" onClick={() => onNavigate(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition ${
              active ? 'text-[#005643]' : 'text-[#94A3B8]'
            }`}>
            <span className={`${ active ? 'text-[#005643]' : 'text-[#94A3B8]' }`}>
              {tab.icon}
            </span>
            <span className={`text-[10px] font-medium ${ active ? 'text-[#005643]' : 'text-[#94A3B8]' }`}>
              {tab.label}
            </span>
            {active && <span className="absolute bottom-0 h-[2px] w-8 rounded-full bg-[#005643]" />}
          </button>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Main AppLayout
// ---------------------------------------------------------------------------
export default function AppLayout({
  children,
  currentPage,
  setCurrentPage,
  onLogout,
  profile,
}) {
  const [expanded,    setExpanded]    = useState(false)
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [branding,    setBranding]    = useState(getDefaultBranding())

  useEffect(() => { loadBranding() }, [profile])

  async function loadBranding() {
    if (!profile?.company_id) return
    const data = await getCompanyBranding(profile.company_id)
    if (data) {
      setBranding({ ...getDefaultBranding(), ...data })
      if (data.favicon) {
        const favicon = document.querySelector("link[rel='icon']")
        if (favicon) favicon.href = data.favicon
      }
    }
  }

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin'

  const mainMenu = [
    { id: 'dashboard',  label: 'Dashboard',      icon: <IconDashboard /> },
    { id: 'clients',    label: 'Farmacias',       icon: <IconPharmacy /> },
    { id: 'people',     label: 'Personas',        icon: <IconPeople /> },
    { id: 'projects',   label: 'Proyectos',       icon: <IconProjects /> },
    { id: 'tasks',      label: 'Tareas',          icon: <IconTasks /> },
    { id: 'checklists', label: 'Checklists',      icon: <IconChecklists /> },
    { id: 'incidents',  label: 'Incidencias',     icon: <IconIncidents /> },
    { id: 'documents',  label: 'Documentación',   icon: <IconDocuments /> },
  ]

  const adminMenu = isAdmin
    ? [
        { id: 'users',    label: 'Usuarios',      icon: <IconUsers /> },
        { id: 'audit',    label: 'Auditoría',     icon: <IconAudit /> },
        { id: 'settings', label: 'Configuración', icon: <IconSettings /> },
      ]
    : []

  function navigateFromNotification(notification) {
    const routes = {
      client: 'clients', pharmacy: 'clients',
      person: 'people',  project: 'projects',
      task: 'tasks',     checklist: 'checklists',
      evidence: 'checklists', document: 'documents',
      template: 'checklists', incident: 'incidents',
    }
    setCurrentPage(routes[notification.entity_type] || 'dashboard')
  }

  // "Más" tab opens the drawer
  function handleBottomNav(id) {
    if (id === 'more') {
      setDrawerOpen(true)
    } else {
      setCurrentPage(id)
    }
  }

  const pageLabel = PAGE_LABELS[currentPage] || ''

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F4F6F8] text-[#0F172A]">

      {/* ====== MOBILE DRAWER ====== */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mainMenu={mainMenu}
        adminMenu={adminMenu}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={onLogout}
        profile={profile}
        branding={branding}
      />

      {/* ====== DESKTOP SIDEBAR ====== */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`hidden md:relative md:flex h-full shrink-0 flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'w-[240px]' : 'w-[64px]'
        }`}
        style={{ backgroundColor: '#0a2018' }}
      >
        {/* Logo */}
        <div className="flex h-[64px] shrink-0 items-center justify-center border-b border-white/5 px-3">
          {expanded ? (
            <img src={branding.logo_white} alt={branding.company_name}
              className="h-auto max-h-9 w-auto max-w-[160px] object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }} />
          ) : (
            <img src={branding.logo_icon} alt={branding.company_name}
              className="h-9 w-9 object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }} />
          )}
        </div>

        {/* Nav */}
        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-3">
          {expanded && <NavDivider label="Principal" expanded={expanded} />}
          <div className="flex flex-col gap-0.5">
            {mainMenu.map(item => (
              <NavItem key={item.id} item={item} active={currentPage === item.id}
                expanded={expanded} onClick={setCurrentPage} />
            ))}
          </div>
          {adminMenu.length > 0 && (
            <>
              <NavDivider label="Administración" expanded={expanded} />
              <div className="flex flex-col gap-0.5">
                {adminMenu.map(item => (
                  <NavItem key={item.id} item={item} active={currentPage === item.id}
                    expanded={expanded} onClick={setCurrentPage} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User + Logout */}
        <div className="shrink-0 border-t border-white/5 p-2">
          <div className={`mb-1 flex items-center rounded-xl p-2 ${ expanded ? 'gap-3' : 'justify-center' }`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: branding.primary_color }}>
              {getInitials(profile?.full_name)}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">{profile?.full_name || 'Usuario'}</p>
                <p className="truncate text-[11px] text-[#4d7a6b] capitalize">{profile?.role || ''}</p>
              </div>
            )}
          </div>
          <button type="button" onClick={onLogout}
            title={!expanded ? 'Cerrar sesión' : undefined}
            className={`flex h-9 w-full items-center rounded-xl text-[#8aab9e] transition hover:bg-white/5 hover:text-[#f87171] ${
              expanded ? 'gap-3 px-3' : 'justify-center'
            }`}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center"><IconLogout /></span>
            {expanded && <span className="text-[14px]">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ====== MAIN AREA ====== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex h-[56px] md:h-[64px] shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-8">
          {/* Mobile: hamburger + page label */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8EDF2] text-[#64748B] md:hidden hover:bg-[#F8FAFC]">
              <IconMenu />
            </button>

            {/* Desktop: breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-[#94A3B8]">Portal interno</span>
              {pageLabel && (
                <>
                  <span className="text-[#CBD5E1]">/</span>
                  <span className="font-medium text-[#0F172A]">{pageLabel}</span>
                </>
              )}
            </div>

            {/* Mobile: page label only */}
            <span className="md:hidden text-[15px] font-semibold text-[#0F172A]">{pageLabel}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <NotificationBell userId={profile?.id} onNavigate={navigateFromNotification} />
            <div className="h-5 w-px bg-[#E2E8F0]" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: branding.primary_color }}>
                {getInitials(profile?.full_name)}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium text-[#0F172A] leading-tight">{profile?.full_name || 'Usuario'}</p>
                <p className="text-[11px] text-[#94A3B8] capitalize leading-tight">{profile?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content — with bottom padding on mobile for the tab bar */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 pb-[76px] md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ====== MOBILE BOTTOM TAB BAR ====== */}
      <BottomTabBar currentPage={currentPage} onNavigate={handleBottomNav} />
    </div>
  )
}
