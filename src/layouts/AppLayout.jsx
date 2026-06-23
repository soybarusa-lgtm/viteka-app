import { useCallback, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QuickLauncher from '../components/ui/QuickLauncher'
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  HomeIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  RectangleGroupIcon,
  TicketIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { canAccessConfig } from '../lib/permissions'

const NAV_SECTIONS = [
  {
    title: 'Trabajo',
    items: [
      { to: '/', label: 'Resumen', Icon: HomeIcon, end: true },
      { to: '/planificacion', label: 'Planificación', Icon: RectangleGroupIcon },
      { to: '/proyectos', label: 'Proyectos', Icon: FolderOpenIcon },
      { to: '/soporte/dashboard', label: 'Soporte', Icon: LifebuoyIcon },
      { to: '/soporte/tickets', label: 'Tickets', Icon: TicketIcon },
    ],
  },
  {
    title: 'Operación',
    items: [
      { to: '/farmacias', label: 'Farmacias', Icon: BuildingStorefrontIcon },
      { to: '/personas', label: 'Personas', Icon: UsersIcon },
      { to: '/documentos', label: 'Documentación', Icon: DocumentTextIcon },
    ],
  },
]

const ADMIN_ITEM = { to: '/configuracion/general', label: 'Configuración', Icon: Cog6ToothIcon }

const QUICK_VIEWS = [
  { to: '/soporte/tickets?status=nuevo', label: 'Tickets sin asignar', meta: 'Bandeja' },
  { to: '/proyectos?status=active', label: 'Proyectos activos', meta: 'Vista' },
  { to: '/soporte/estadisticas', label: 'Analítica soporte', meta: 'Métricas' },
]

function displayName(profile, session) {
  const meta = session?.user?.user_metadata || {}
  const value = profile?.full_name || meta.full_name || meta.name || session?.user?.email || 'Viteka'
  return String(value).trim() || 'Viteka'
}

function initials(value) {
  return String(value || 'VT')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

function getPageMeta(pathname) {
  if (pathname === '/') return { title: 'Resumen', area: 'Workspace' }
  if (pathname.startsWith('/planificacion')) return { title: 'Planificación', area: 'Workspace' }
  if (pathname.startsWith('/proyectos')) return { title: 'Proyectos', area: 'Trabajo' }
  if (pathname.startsWith('/soporte/tickets')) return { title: 'Tickets', area: 'Soporte' }
  if (pathname.startsWith('/soporte')) return { title: 'Soporte', area: 'Trabajo' }
  if (pathname.startsWith('/farmacias')) return { title: 'Farmacias', area: 'Operación' }
  if (pathname.startsWith('/personas')) return { title: 'Personas', area: 'Operación' }
  if (pathname.startsWith('/documentos')) return { title: 'Documentación', area: 'Operación' }
  if (pathname.startsWith('/configuracion')) return { title: 'Configuración', area: 'Sistema' }
  return { title: 'Viteka', area: 'Workspace' }
}

function sectionedNav(profile) {
  const sections = NAV_SECTIONS.map(section => ({ ...section, items: [...section.items] }))
  if (canAccessConfig(profile)) {
    sections.push({ title: 'Sistema', items: [ADMIN_ITEM] })
  }
  return sections
}

function NavItem({ item, onNavigate }) {
  const Icon = item.Icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => [
        'group flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
      ].join(' ')}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

function Sidebar({ navSections, session, profile, onLogout, onNavigate, onLauncher }) {
  const name = displayName(profile, session)

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <img src="/brand/logo-icon-colr.svg" alt="Viteka" className="h-8 w-8 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">Viteka</p>
            <p className="truncate text-xs text-slate-500">Professional workspace</p>
          </div>
        </Link>
      </div>

      <div className="border-b border-slate-200 px-3 py-3">
        <button
          type="button"
          onClick={onLauncher}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-slate-300 hover:bg-white"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900">Workspace operativo</span>
            <span className="block truncate text-xs text-slate-500">Farmacias, proyectos y soporte</span>
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <button
          type="button"
          onClick={onLauncher}
          className="mb-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo
        </button>

        <div className="space-y-5">
          {navSections.map(section => (
            <section key={section.title}>
              <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map(item => (
                  <NavItem key={item.to} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-6">
          <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Vistas</p>
          <div className="space-y-1">
            {QUICK_VIEWS.map(view => (
              <Link
                key={view.to}
                to={view.to}
                onClick={onNavigate}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <span className="truncate">{view.label}</span>
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {view.meta}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </nav>

      <div className="border-t border-slate-200 px-3 py-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-extrabold text-white">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
            <p className="truncate text-xs text-slate-400">{session?.user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function AppLayout({ session, profile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [launcherOpen, setLauncherOpen] = useState(false)

  const navSections = useMemo(() => sectionedNav(profile), [profile])
  const pageMeta = useMemo(() => getPageMeta(location.pathname), [location.pathname])
  const userName = displayName(profile, session)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const closeLauncher = useCallback(() => setLauncherOpen(false), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const openLauncher = useCallback(() => {
    setMobileOpen(false)
    setLauncherOpen(true)
  }, [])

  return (
    <div className="brand-app-shell flex h-screen min-h-0 bg-slate-50 text-slate-950">
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar
          navSections={navSections}
          session={session}
          profile={profile}
          onLogout={handleLogout}
          onNavigate={undefined}
          onLauncher={openLauncher}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button type="button" aria-label="Cerrar menú" onClick={closeMobile} className="absolute inset-0 bg-slate-950/35" />
          <aside className="relative h-full w-[min(86vw,320px)] border-r border-slate-200 shadow-2xl">
            <Sidebar
              navSections={navSections}
              session={session}
              profile={profile}
              onLogout={handleLogout}
              onNavigate={closeMobile}
              onLauncher={openLauncher}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:px-5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{pageMeta.area}</p>
            <h1 className="truncate text-base font-extrabold text-slate-950 sm:text-lg">{pageMeta.title}</h1>
          </div>

          <button
            type="button"
            onClick={openLauncher}
            className="hidden h-9 min-w-52 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white md:flex"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Buscar o crear...
          </button>

          <button
            type="button"
            onClick={openLauncher}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 xl:flex">
            <UserCircleIcon className="h-5 w-5 text-slate-400" />
            <span className="max-w-36 truncate text-sm font-semibold text-slate-700">{userName}</span>
          </div>
        </header>

        <main className="brand-main min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <QuickLauncher open={launcherOpen} onClose={closeLauncher} />

      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={closeMobile}
          className="fixed right-3 top-3 z-[60] inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-lg lg:hidden"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
