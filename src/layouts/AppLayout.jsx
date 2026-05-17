import { useEffect, useState } from 'react'
import { getCompanyBranding, getDefaultBranding } from '../lib/branding'
import NotificationBell from '../components/NotificationBell'

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------
function IconDashboard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function IconPharmacy({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function IconPeople({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconProjects({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconTasks({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}
function IconChecklists({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function IconIncidents({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconDocuments({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function IconUsers({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconAudit({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconSettings({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function IconLogout({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconChevron({ size = 16, direction = 'right' }) {
  const rotate = direction === 'right' ? 0 : 180
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rotate}deg)`, transition: 'transform 0.3s' }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
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

// ---------------------------------------------------------------------------
// Initials helper
// ---------------------------------------------------------------------------
function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// NavItem
// ---------------------------------------------------------------------------
function NavItem({ item, active, expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      title={!expanded ? item.label : undefined}
      className={`group relative flex h-10 w-full items-center rounded-xl transition-all duration-150 ${
        expanded ? 'gap-3 px-3' : 'justify-center px-0'
      } ${
        active
          ? 'bg-white/10 text-white'
          : 'text-[#8aab9e] hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {item.icon}
      </span>

      {expanded && (
        <span className={`truncate text-[14px] ${
          active ? 'font-medium text-white' : 'font-normal'
        }`}>
          {item.label}
        </span>
      )}

      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#34d399]" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// NavSection divider
// ---------------------------------------------------------------------------
function NavDivider({ label, expanded }) {
  if (!expanded) {
    return <div className="my-2 mx-3 h-px bg-white/10" />
  }
  return (
    <div className="mx-3 mb-1 mt-4">
      <span className="text-[11px] font-medium uppercase tracking-widest text-[#4d7a6b]">
        {label}
      </span>
    </div>
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
  const [expanded, setExpanded] = useState(false)
  const [branding, setBranding] = useState(getDefaultBranding())

  useEffect(() => {
    loadBranding()
  }, [profile])

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

  const pageLabel = PAGE_LABELS[currentPage] || ''

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F8] text-[#0F172A]">

      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR                                                              */}
      {/* ------------------------------------------------------------------ */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`relative flex h-screen shrink-0 flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'w-[240px]' : 'w-[64px]'
        }`}
        style={{ backgroundColor: '#0a2018' }}
      >
        {/* Logo */}
        <div className="flex h-[64px] shrink-0 items-center justify-center border-b border-white/5 px-3">
          {expanded ? (
            <img
              src={branding.logo_white}
              alt={branding.company_name}
              className="h-auto max-h-9 w-auto max-w-[160px] object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <img
              src={branding.logo_icon}
              alt={branding.company_name}
              className="h-9 w-9 object-contain"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </div>

        {/* Nav */}
        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-3">

          {/* Main items */}
          {expanded && <NavDivider label="Principal" expanded={expanded} />}
          <div className="flex flex-col gap-0.5">
            {mainMenu.map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={currentPage === item.id}
                expanded={expanded}
                onClick={setCurrentPage}
              />
            ))}
          </div>

          {/* Admin items */}
          {adminMenu.length > 0 && (
            <>
              <NavDivider label="Administración" expanded={expanded} />
              <div className="flex flex-col gap-0.5">
                {adminMenu.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={currentPage === item.id}
                    expanded={expanded}
                    onClick={setCurrentPage}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User + Logout */}
        <div className="shrink-0 border-t border-white/5 p-2">
          {/* User info */}
          <div className={`mb-1 flex items-center rounded-xl p-2 ${
            expanded ? 'gap-3' : 'justify-center'
          }`}>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: branding.primary_color }}
            >
              {getInitials(profile?.full_name)}
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">
                  {profile?.full_name || 'Usuario'}
                </p>
                <p className="truncate text-[11px] text-[#4d7a6b] capitalize">
                  {profile?.role || ''}
                </p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            title={!expanded ? 'Cerrar sesión' : undefined}
            className={`flex h-9 w-full items-center rounded-xl text-[#8aab9e] transition hover:bg-white/5 hover:text-[#f87171] ${
              expanded ? 'gap-3 px-3' : 'justify-center'
            }`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <IconLogout />
            </span>
            {expanded && (
              <span className="text-[14px]">Cerrar sesión</span>
            )}
          </button>
        </div>

        {/* Expand toggle hint — bottom right */}
        <div className={`absolute bottom-[120px] transition-all duration-300 ${
          expanded ? 'right-3' : 'right-[10px]'
        }`}>
          <span className="text-[#2a5a45] transition-transform duration-300">
            <IconChevron size={14} direction={expanded ? 'right' : 'right'} />
          </span>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#94A3B8]">Portal interno</span>
            {pageLabel && (
              <>
                <span className="text-[#CBD5E1]">/</span>
                <span className="font-medium text-[#0F172A]">{pageLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell
              userId={profile?.id}
              onNavigate={navigateFromNotification}
            />

            <div className="h-5 w-px bg-[#E2E8F0]" />

            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: branding.primary_color }}
              >
                {getInitials(profile?.full_name)}
              </div>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium text-[#0F172A] leading-tight">
                  {profile?.full_name || 'Usuario'}
                </p>
                <p className="text-[11px] text-[#94A3B8] capitalize leading-tight">
                  {profile?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
