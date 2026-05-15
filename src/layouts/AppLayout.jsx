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

        if (favicon) {
          favicon.href = data.favicon
        }
      }
    }
  }

  const isAdmin =
    profile?.role === 'superadmin' ||
    profile?.role === 'admin'

  const menu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '◫',
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: '◎',
    },
    {
      id: 'projects',
      label: 'Proyectos',
      icon: '▣',
    },
    {
      id: 'checklists',
      label: 'Checklists',
      icon: '✓',
    },
    {
      id: 'documents',
      label: 'Documentación',
      icon: '≣',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: '◌',
    },
    ...(isAdmin
      ? [
          {
            id: 'audit',
            label: 'Auditoría',
            icon: '☷',
          },
        ]
      : []),
  ]

  function navigateFromNotification(notification) {
    const routes = {
      client: 'clients',
      project: 'projects',
      checklist: 'checklists',
      task: 'checklists',
      evidence: 'checklists',
      document: 'documents',
      template: 'checklists',
    }

    setCurrentPage(routes[notification.entity_type] || 'dashboard')
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`relative flex flex-col border-r border-[#E2E8F0] bg-white transition-all duration-300 ${
          expanded ? 'w-[280px]' : 'w-[88px]'
        }`}
      >
        <div className="flex h-[104px] items-center border-b border-[#E2E8F0] px-5">
          {!expanded && (
            <div className="flex w-full justify-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#ECFDF5]">
                <img
                  src={branding.logo_icon}
                  alt={branding.company_name}
                  className="h-9 w-9 object-contain"
                  onError={event => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}

          {expanded && (
            <div className="flex w-full justify-start">
              <img
                src={branding.logo_full_color}
                alt={branding.company_name}
                className="h-auto max-h-16 w-auto max-w-[220px] object-contain"
                onError={event => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {menu.map(item => {
              const active = currentPage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-all ${
                    active
                      ? 'bg-[#ECFDF5]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                  style={
                    active
                      ? {
                          color: branding.primary_color,
                        }
                      : {}
                  }
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg">
                    {item.icon}
                  </div>

                  <span
                    className={`overflow-hidden whitespace-nowrap text-[15px] transition-all duration-300 ${
                      expanded
                        ? 'max-w-[170px] opacity-100'
                        : 'max-w-0 opacity-0'
                    } ${
                      active
                        ? 'font-medium'
                        : 'font-normal'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-[#E2E8F0] p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-[#EF4444] transition hover:bg-[#FEF2F2]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg">
              ↩
            </div>

            <span
              className={`overflow-hidden whitespace-nowrap text-[15px] transition-all duration-300 ${
                expanded
                  ? 'max-w-[170px] opacity-100'
                  : 'max-w-0 opacity-0'
              }`}
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[88px] items-center justify-between border-b border-[#E2E8F0] bg-white/90 px-10 backdrop-blur">
          <div>
            <p className="text-sm text-[#94A3B8]">
              Plataforma operativa
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
              VT
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