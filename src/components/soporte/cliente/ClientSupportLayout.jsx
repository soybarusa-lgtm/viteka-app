import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ArrowRightOnRectangleIcon, TicketIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../lib/supabase'

export default function ClientSupportLayout({ profile, session }) {
  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navClass = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-bold transition ${isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-teal-900/10 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/brand/logo-full-color.svg" alt="Viteka" className="h-10 w-auto" />
            <div className="hidden border-l border-slate-200 pl-3 sm:block">
              <p className="font-display text-sm font-extrabold text-teal-900">Soporte Técnico</p>
              <p className="text-[11px] text-slate-400">Portal de clientes</p>
            </div>
          </div>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto">
            <NavLink end to="/cliente/soporte" className={navClass}>Inicio</NavLink>
            <NavLink to="/cliente/soporte/tickets" className={navClass}>Tickets</NavLink>
            <NavLink to="/cliente/soporte/tickets/nuevo" className={navClass}>Enviar un ticket</NavLink>
          </nav>
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <span title={session?.user?.email} className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 font-display text-xs font-extrabold text-white">
              {(profile?.full_name || session?.user?.email || 'V').slice(0, 2).toUpperCase()}
            </span>
            <button type="button" aria-label="Cerrar sesión" onClick={logout} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet context={{ profile, session }} />
      </main>

      <footer className="mt-8 bg-teal-900 text-teal-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Contáctenos en el 951 55 27 30 · L-V 09:00-17:00</p>
          <p className="flex items-center gap-2 text-teal-100"><TicketIcon className="h-4 w-4" /> Software de Help Desk de Viteka · Política de cookies</p>
        </div>
      </footer>
    </div>
  )
}
