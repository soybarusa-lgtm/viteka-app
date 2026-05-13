export default function AppLayout({ children, onLogout, currentPage, setCurrentPage }) {
  return (
    <div className="min-h-screen bg-[#EEF4F0] text-[#0F1F17]">
      <div className="grid min-h-screen grid-cols-[250px_1fr]">
        <aside className="bg-white border-r border-[#DCE7E1]">
          <div className="h-20 bg-[#005643] flex items-center justify-center">
            <div className="text-white font-bold text-2xl tracking-tight">
              Viteka
            </div>
          </div>

         <nav className="p-4 space-y-2">
        {[
            ['dashboard', 'Dashboard'],
            ['clients', 'Clientes'],
            ['projects', 'Proyectos'],
            ['checklists', 'Checklists'],
        ].map(([key, label]) => (
            <button
            key={key}
            onClick={() => setCurrentPage(key)}
            className={
                currentPage === key
                ? 'w-full text-left px-4 py-3 rounded-xl bg-[#E5F3EC] text-[#005643] font-bold'
                : 'w-full text-left px-4 py-3 rounded-xl text-[#4A6B58] hover:bg-[#F5FAF6] font-semibold'
            }
            >
            {label}
            </button>
        ))}
        </nav>
        </aside>

        <main>
          <header className="h-16 bg-white border-b border-[#DCE7E1] flex items-center justify-between px-8">
            <p className="text-sm text-[#8AAA96] font-semibold">
              Plataforma técnica
            </p>

            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg border border-[#DCE7E1] font-bold hover:bg-[#F5FAF6]"
            >
              Cerrar sesión
            </button>
          </header>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  )
} 