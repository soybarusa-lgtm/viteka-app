import { NavLink } from 'react-router-dom'
import { ClipboardDocumentListIcon, Cog6ToothIcon, KeyIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline'

const TABS = [
  { to: '/configuracion/general', label: 'General', Icon: Cog6ToothIcon },
  { to: '/configuracion/equipo-viteka', label: 'Equipo Viteka', Icon: UsersIcon },
  { to: '/configuracion/roles-permisos', label: 'Roles y permisos', Icon: ShieldCheckIcon },
  { to: '/configuracion/contrasenas', label: 'Contraseñas', Icon: KeyIcon },
  { to: '/configuracion/portal-cliente', label: 'Portal cliente', Icon: ClipboardDocumentListIcon },
  { to: '/configuracion/auditoria', label: 'Auditoria', Icon: ClipboardDocumentListIcon },
]

export default function ConfigTabs() {
  return (
    <nav className="tabs-scroll border-b border-slate-200">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-bold transition-colors ${
            isActive ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
