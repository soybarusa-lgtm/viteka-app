import { useState } from 'react'

export default function AppLayout({
  children,
  onLogout,
  currentPage,
  setCurrentPage,
}) {
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '⌂',
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: '👥',
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
  ]

  return (
    <div className="min-h-screen bg-[#EEF4F0] text-[#052E26]">
      <aside
        className={
          collapsed
            ? 'fixed left-0 top-0 z-40 hidden h-screen w-24 border-r border-[#DCE7E1] bg-white transition-all duration-300 xl:block'
            : 'fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-[#DCE7E1] bg-white transition-all duration-300 xl:block'
        }
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[#DCE7E1] px-4 py-6">
            <div
              className={
                collapsed
                  ? 'flex flex-col items-center gap-4'
                  : 'flex items-center gap-3'
              }
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#005643] text-xl font-extrabold text-white">
                ✓
              </div>

              {!collapsed && (
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#005643]">
                    VITEKA
                  </h1>

                  <p className="text-sm font-medium text-[#6E8B7B]">
                    Plataforma técnica
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="rounded-xl border border-[#DCE7E1] bg-white px-3 py-2 text-sm font-extrabold text-[#005643] hover:bg-[#E5F3EC]"
                title={collapsed ? 'Expandir menú' : 'Replegar menú'}
              >
                {collapsed ? '→' : '←'}
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-6">
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
                        ? 'flex w-full items-center justify-center rounded-2xl bg-[#005643] px-3 py-4 text-xl font-extrabold text-white shadow-sm'
                        : 'flex w-full items-center gap-4 rounded-2xl bg-[#005643] px-5 py-4 text-left font-extrabold text-white shadow-sm'
                      : collapsed
                        ? 'flex w-full items-center justify-center rounded-2xl px-3 py-4 text-xl font-bold text-[#052E26] hover:bg-[#E5F3EC]'
                        : 'flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left font-bold text-[#052E26] hover:bg-[#E5F3EC]'
                  }
                >
                  <span className="flex h-7 w-7 items-center justify-center text-lg">
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span>
                      {item.label}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="border-t border-[#DCE7E1] p-4">
            {collapsed ? (
              <button
                type="button"
                onClick={onLogout}
                title="Cerrar sesión"
                className="flex w-full items-center justify-center rounded-2xl border border-[#DCE7E1] bg-white px-3 py-4 font-extrabold text-[#005643] hover:bg-[#E5F3EC]"
              >
                ⎋
              </button>
            ) : (
              <div className="rounded-2xl bg-[#F7FAF8] p-4">
                <p className="font-extrabold">
                  Usuario técnico
                </p>

                <p className="mt-1 text-sm text-[#6E8B7B]">
                  Sesión activa
                </p>

                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-4 w-full rounded-xl border border-[#DCE7E1] bg-white px-4 py-3 text-sm font-extrabold text-[#005643] hover:bg-[#E5F3EC]"
                >
                  Cerrar sesión
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
            : 'transition-all duration-300 xl:pl-72'
        }
      >
        <header className="sticky top-0 z-30 border-b border-[#DCE7E1] bg-white/90 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-5 lg:px-8">
            <div>
              <p className="text-sm font-bold text-[#6E8B7B]">
                Plataforma técnica
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-[#DCE7E1] bg-white px-5 py-3 text-sm font-extrabold text-[#052E26] hover:bg-[#F7FAF8]"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="px-5 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}