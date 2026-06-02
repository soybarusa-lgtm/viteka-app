import { NavLink } from 'react-router-dom'
import { BuildingOffice2Icon, ChartBarIcon, LifebuoyIcon, LightBulbIcon, TicketIcon, UsersIcon } from '@heroicons/react/24/outline'

const LINKS = [
  ['/soporte/dashboard', 'Resumen', LifebuoyIcon],
  ['/soporte/tickets', 'Tickets', TicketIcon],
  ['/soporte/contactos', 'Contactos', UsersIcon],
  ['/soporte/companias', 'Farmacias', BuildingOffice2Icon],
  ['/soporte/base-conocimiento', 'Conocimiento', LightBulbIcon],
  ['/soporte/estadisticas', 'Estadísticas', ChartBarIcon],
]

export default function InternalSupportNav() {
  return (
    <nav aria-label="Áreas de soporte" className="tabs-scroll rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {LINKS.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${isActive ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:bg-teal-50 hover:text-teal-800'}`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
