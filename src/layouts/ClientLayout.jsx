import { useEffect, useState } from 'react'
import {
  getCompanyBranding,
  getDefaultBranding,
} from '../lib/branding'

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

export default function ClientLayout({
  children,
  currentPage,
  setCurrentPage,
  onLogout,
  profile,
}) {
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

  const menu = [
    {
      id: 'client-home',
      label: 'Inicio',
      icon: '◫',
    },
    {
      id: 'client-categories',
      label: 'Familias y categorías',
      icon: '◎',
    },
    {
      id: 'client-protocols',
      label: 'Protocolos',
      icon: '▣',
    },
    {
      id: 'client-roi',
      label: 'Calculadora ROI',
      icon: '↗',
    },
    {
      id: 'client-categorizer',
      label: 'Categorizador',
      icon: '✦',
    },
    {
      id: 'client-documents',
      label: 'Documentación',
      icon: '≣',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <img
              src={branding.logo_full_color}
              alt={branding.company_name}
              className="h-auto max-h-14 w-auto max-w-[220px] object-contain"
              onError={event => {
                event.currentTarget.style.display = 'none'
              }}
            />

            <div className="hidden h-8 w-px bg-[#E2E8F0] md:block" />

            <p className="hidden text-sm text-[#64748B] md:block">
              Portal cliente
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden rounded-full bg-[#ECFDF5] px-4 py-2 text-sm text-[#047857] md:inline-flex">
              Cliente
            </span>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm text-[#334155] shadow-sm hover:bg-[#F8FAFC]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-6 py-8 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-[32px] border border-[#E2E8F0] bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <nav className="space-y-2">
            {menu.map(item => {
              const active = currentPage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition ${
                    active
                      ? 'bg-[#ECFDF5] text-[#047857]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg">
                    {item.icon}
                  </span>

                  <span className={active ? 'font-medium' : 'font-normal'}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}