import { useEffect, useState } from 'react'
import {
  getCompanyBranding,
  getDefaultBranding,
} from '../lib/branding'
import NotificationBell from '../components/NotificationBell'

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

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
  }, [])

  async function loadBranding() {
    const data = await getCompanyBranding(COMPANY_ID)

    if (data) {
      setBranding({
        ...getDefaultBranding(),
        ...data,
      })

      if (data.favicon) {
        const favicon = document.querySelector("link[rel='icon']")
        if (favicon) favicon.href = data.favicon
      }
    }
  }

  const isAdmin =
    profile?.role === 'owner' ||
    profile?.role === 'admin'

  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: '◫' },
    { id: 'clients', label: 'Farmacias', icon: '◎' },
    { id: 'people', label: 'Personas', icon: '👤' },
    { id: 'projects', label: 'Proyectos', icon: '▣' },
    { id: 'tasks', label: 'Tareas', icon: '☑' },
    { id: 'checklists', label: 'Checklists', icon: '✓' },
    { id: 'incidents', label: 'Incidencias', icon: '⚠' },
    { id: 'documents', label: 'Documentación', icon: '≣' },
    { id: 'timeline', label: 'Timeline', icon: '◌' },
    ...(isAdmin
      ? [
          { id: 'users', label: 'Usuarios', icon: '👥' },
          { id: 'audit', label: 'Auditoría', icon: '☷' },
          { id: 'settings', label: 'Configuración', icon: '⚙' },
        ]
      : []),
  ]

  function navigateFromNotification(notification) {
    const routes = {
      client: 'clients',
      pharmacy: 'clients',
      person: 'people',
      project: 'projects',
      task: 'tasks',
      checklist: 'checklists',
      evidence: 'checklists',
      document: 'documents',
      template: 'checklists',
      incident: 'incidents',
    }

    setCurrentPage(routes[notification.entity_type] || 'dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A]">
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-[#E2E8F0] bg-white transition-all duration-300 ${
          expanded ? 'w-[280px]' : 'w-[88px]'
        }`}
      >
        <div className="flex h-[96px] shrink-0 items-center justify-center border-b border-[#E2E8F0] px-4">
          {!expanded && (
            <img
              src={branding.logo_icon}
              alt={branding.company_name}
              className="h-12 w-12 object-contain"
              onError={event => {
                event.currentTarget.style.display = 'none'
              }}
            />
          )}

          {expanded && (
            <img
              src={branding.logo_full_color}
              alt={branding.company_name}
              className="h-auto max-h-16 w-auto max-w-[220px] object-contain"
              onError={event => {
                event.currentTarget.style.display = 'none'
              }}
            />
          )}
        </div>

       <nav className="flex min-h-0 flex-1 px-3 py-4">
  <div className="flex w-full flex-col items-center gap-2">
            {menu.map(item => {
              const active = currentPage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentPage(item.id)}
                  title={!expanded ? item.label : undefined}
                  className={`flex h-12 w-full items-center rounded-2xl transition-all ${
                    expanded
                      ? 'justify-start gap-4 px-4'
                      : 'justify-center px-0'
                  } ${
                    active
                      ? 'bg-[#ECFDF5]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                  style={active ? { color: branding.primary_color } : {}}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[18px] leading-none">
                    {item.icon}
                  </span>

                  <span
                    className={`overflow-hidden whitespace-nowrap text-[15px] transition-all duration-300 ${
                      expanded
                        ? 'max-w-[180px] opacity-100'
                        : 'max-w-0 opacity-0'
                    } ${active ? 'font-medium' : 'font-normal'}`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-[#E2E8F0] p-3">
          <button
            type="button"
            onClick={onLogout}
            title={!expanded ? 'Cerrar sesión' : undefined}
            className={`flex h-12 w-full items-center rounded-2xl text-[#EF4444] transition hover:bg-[#FEF2F2] ${
              expanded
                ? 'justify-start gap-4 px-4'
                : 'justify-center px-0'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[18px] leading-none">
              ↩
            </span>

            <span
              className={`overflow-hidden whitespace-nowrap text-[15px] transition-all duration-300 ${
                expanded
                  ? 'max-w-[180px] opacity-100'
                  : 'max-w-0 opacity-0'
              }`}
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between border-b border-[#E2E8F0] bg-white/90 px-10 backdrop-blur">
          <div>
            <p className="text-sm text-[#94A3B8]">
              Portal interno Viteka
            </p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell
              userId={profile?.id}
              onNavigate={navigateFromNotification}
            />

            <span className="rounded-full bg-[#F1F5F9] px-4 py-2 text-sm text-[#334155]">
              {profile?.role || 'usuario'}
            </span>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm text-white font-medium"
              style={{
                backgroundColor: branding.secondary_color,
              }}
            >
              Rafael Lázaro
            </div>
          </div>
        </header>

        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
