import { useState } from 'react'

export default function AppLayout({
  children,
  onLogout,
  currentPage,
  setCurrentPage,
}) {
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { id: 'clients', label: 'Clientes', icon: '👥' },
    { id: 'projects', label: 'Proyectos', icon: '▦' },
    { id: 'checklists', label: 'Checklists', icon: '✓' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <aside
        className={
          collapsed
            ? 'fixed left-0 top-0 z-40 hidden h-screen w-24 border-r border-[#E2E8F0] bg-white transition-all duration-300 xl:block'
            : 'fixed left-0 top-0 z-40 hidden h-screen w-80 border-r border-[#E2E8F0] bg-white transition-all duration-300 xl:block'
        }
      >
        <div className="flex h-full flex-col">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00684F] to-[#00A77A] text-3xl font-black text-white shadow-sm">
                  ✓
                </div>

                {!collapsed && (
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#005643]">
                      VITEKA
                    </h1>
                    <p className="text-sm font-semibold text-[#64748B]">
                      Plataforma técnica
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-lg font-black text-[#334155] shadow-sm hover:bg-[#F8FAFC]"
              >
                {collapsed ? '›' : '‹'}
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-3 px-5">
            {navItems.map(item => {
              const active = currentPage === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentPage(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={
                    active
                      ? collapsed
                        ? 'flex w-full items-center justify-center rounded-2xl bg-[#E6F7F0] px-4 py-4 text-xl font-black text-[#005643]'
                        : 'flex w-full items-center gap-5 rounded-2xl bg-[#E6F7F0] px-5 py-4 text-left font-black text-[#005643]'
                      : collapsed
                        ? 'flex w-full items-center justify-center rounded-2xl px-4 py-4 text-xl font-bold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#005643]'
                        : 'flex w-full items-center gap-5 rounded-2xl px-5 py-4 text-left font-bold text-[#334155] hover:bg-[#F8FAFC] hover:text-[#005643]'
                  }
                >
                  <span className="flex h-7 w-7 items-center justify-center text-xl">
                    {item.icon}
                  </span>

                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>

          <div className="p-5">
            {collapsed ? (
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4 font-black text-[#005643] shadow-sm hover:bg-[#F8FAFC]"
                title="Cerrar sesión"
              >
                ⎋
              </button>
            ) : (
              <div className="rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#005643] text-sm font-black text-white">
                    VT
                  </div>

                  <div>
                    <p className="font-black text-[#0F172A]">
                      Usuario técnico
                    </p>
                    <p className="text-sm font-semibold text-[#64748B]">
                      Sesión activa
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-black text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  ⎋ Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div
        className={
          collapsed
            ? 'transition-all duration-300 xl:pl-24'
            : 'transition-all duration-300 xl:pl-80'
        }
      >
        <header className="sticky top-0 z-30 bg-[#F8FAFC]/90 backdrop-blur">
          <div className="flex h-24 items-center justify-end gap-4 px-5 lg:px-10">
            <button
              type="button"
              className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-xl font-black text-[#334155] shadow-sm hover:bg-[#F8FAFC] md:flex"
            >
              ⌕
            </button>

            <button
              type="button"
              className="relative hidden h-14 w-14 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-xl font-black text-[#334155] shadow-sm hover:bg-[#F8FAFC] md:flex"
            >
              ♧
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#005643] text-xs font-black text-white">
                3
              </span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 text-sm font-black text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]"
            >
              ⎋ Cerrar sesión
            </button>
          </div>
        </header>

        <main className="px-5 pb-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}