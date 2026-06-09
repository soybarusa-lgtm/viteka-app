import { useMemo, useState } from 'react'
import {
  AdjustmentsHorizontalIcon,
  ArrowRightIcon,
  BellIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChartPieIcon,
  ChevronDownIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TicketIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useOperationalDashboard } from '../hooks/useOperationalDashboard'
import { usePharmacies } from '../hooks/usePharmacies'
import { formatShortDate, normalizeKey } from '../lib/operationalDashboardStatus'

function formatTodayLabel() {
  return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function displayName(profile, session) {
  const meta = session?.user?.user_metadata || {}
  const value = profile?.full_name || profile?.name || meta.full_name || meta.name || meta.display_name || session?.user?.email || 'usuario'
  return String(value).trim().split(/\s+/)[0] || 'usuario'
}

function relativeTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  const diffHours = Math.round((Date.now() - date.getTime()) / 36e5)
  if (diffHours < 24) return `hace ${Math.max(1, diffHours)} h`
  const diffDays = Math.round(diffHours / 24)
  return `hace ${diffDays} d${diffDays === 1 ? 'ía' : 'ías'}`
}

function sameDay(a, b) {
  return a.toDateString() === b.toDateString()
}

function titleCase(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

function statusLabel(status) {
  const key = normalizeKey(status)
  if (['en_progreso', 'in_progress'].includes(key)) return 'En curso'
  if (['esperando_cliente', 'esperando_proveedor'].includes(key)) return 'En espera'
  if (['blocked', 'bloqueado'].includes(key)) return 'Bloqueado'
  if (['completed', 'closed', 'cerrado'].includes(key)) return 'Cerrado'
  if (['pending', 'nuevo', 'abierto'].includes(key)) return 'Pendiente'
  return status || 'Sin estado'
}

function toneClass(tone) {
  return ({
    indigo: 'bg-teal-50 text-teal-600 ring-teal-100',
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    violet: 'bg-teal-50 text-teal-600 ring-teal-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  }[tone] || 'bg-slate-50 text-slate-700 ring-slate-200')
}

function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-[18px] border border-slate-200 bg-white shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

function Kpi({ label, value, hint, Icon, tone = 'indigo', to }) {
  const body = (
    <div className="flex h-full flex-col justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-[34px] font-black leading-none tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className={`inline-flex rounded-2xl p-2.5 ring-1 ${toneClass(tone)}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function DataTable({ columns, rows, emptyText }) {
  if (!rows.length) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">{emptyText}</div>
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500">
          <tr>{columns.map(column => <th key={column.key} className="px-3 py-3 font-bold">{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={row.id || index} className="transition hover:bg-slate-50/70">
              {columns.map(column => <td key={column.key} className="px-3 py-3 align-middle">{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Donut({ title, items }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1
  const colors = ['#4f7cff', '#8b9ac5', '#f59e0b', '#f97316', '#ef4444', '#22c55e', '#7c3aed']
  let acc = 0
  const stops = items.map((item, index) => {
    const start = acc
    acc += (item.count / total) * 100
    return `${colors[index % colors.length]} ${start}% ${acc}%`
  }).join(', ')

  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[120px_minmax(0,1fr)]">
        <div className="flex items-center justify-center">
          <div
            className="h-28 w-28 rounded-full"
            style={{
              background: `conic-gradient(${stops})`,
              WebkitMask: 'radial-gradient(circle, transparent 0 46%, #000 47% 100%)',
              mask: 'radial-gradient(circle, transparent 0 46%, #000 47% 100%)',
            }}
          />
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="font-medium text-slate-600">{item.label}</span>
              </span>
              <span className="font-semibold text-slate-900">{item.count} <span className="text-slate-400">({Math.round((item.count / total) * 100)}%)</span></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Bars({ title, items }) {
  const max = Math.max(...items.map(item => item.value), 1)
  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map(item => (
          <div key={item.label} className="grid grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-3 text-xs">
            <span className="truncate text-slate-600">{item.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.max(8, Math.round((item.value / max) * 100))}%` }} />
            </div>
            <span className="text-right font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Line({ title, created, closed }) {
  const width = 320
  const height = 140
  const max = Math.max(...created, ...closed, 1)
  const padX = 16
  const padY = 14
  const innerWidth = width - padX * 2
  const innerHeight = height - padY * 2
  const points = series => series.map((value, index) => {
    const x = padX + (innerWidth / Math.max(series.length - 1, 1)) * index
    const y = padY + innerHeight - ((value / max) * innerHeight)
    return `${x},${y}`
  }).join(' ')

  return (
    <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Creados</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Cerrados</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-36 w-full">
        <polyline fill="none" stroke="#4f7cff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points(created)} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={points(closed)} />
      </svg>
      <div className="mt-1 grid grid-cols-7 text-center text-[11px] text-slate-400">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <span key={day}>{day}</span>)}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const { profile, session } = useAuth()
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard(profile?.company_id)
  const { pharmacies = [] } = usePharmacies(profile?.company_id)
  const { loading, warning, lastUpdated, myPendingTasks, generalPendingTasks, myPendingSupport, generalPendingSupport, reload } = useOperationalDashboard()

  const [selectedPharmacy, setSelectedPharmacy] = useState('all')
  const [selectedModule, setSelectedModule] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedResponsible, setSelectedResponsible] = useState('all')
  const [selectedRange, setSelectedRange] = useState('7d')

  const dashboardUserName = useMemo(() => displayName(profile, session), [profile, session])
  const todayLabel = useMemo(() => formatTodayLabel(), [])

  const allTasks = useMemo(() => [...myPendingTasks, ...generalPendingTasks], [generalPendingTasks, myPendingTasks])
  const allSupport = useMemo(() => [...myPendingSupport, ...generalPendingSupport], [generalPendingSupport, myPendingSupport])
  const allProjects = useMemo(() => dashboardData?.periodProjects || [], [dashboardData?.periodProjects])
  const pharmacyNameById = useMemo(() => Object.fromEntries(pharmacies.map(pharmacy => [String(pharmacy.id), pharmacy.pharmacy_name])), [pharmacies])

  const pharmacyOptions = useMemo(() => [{ value: 'all', label: 'Todas las farmacias' }, ...pharmacies.map(pharmacy => ({ value: String(pharmacy.id), label: pharmacy.pharmacy_name }))], [pharmacies])
  const responsibleOptions = useMemo(() => {
    const names = [...new Set([...allTasks.map(item => item.assignedTo).filter(Boolean), ...allSupport.map(item => item.assignedTo).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'es'))
    return [{ value: 'all', label: 'Todos' }, ...names.map(name => ({ value: name, label: name }))]
  }, [allSupport, allTasks])

  const moduleOptions = [
    { value: 'all', label: 'Todos los módulos' },
    { value: 'tickets', label: 'Tickets' },
    { value: 'projects', label: 'Proyectos' },
    { value: 'tasks', label: 'Tareas' },
  ]

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'abierto', label: 'Abierto' },
    { value: 'en_progreso', label: 'En progreso' },
    { value: 'esperando_cliente', label: 'Esperando cliente' },
    { value: 'esperando_proveedor', label: 'Esperando proveedor' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'in_progress', label: 'En curso' },
    { value: 'blocked', label: 'Bloqueado' },
    { value: 'completed', label: 'Finalizado' },
  ]

  const rangeDays = selectedRange === '30d' ? 30 : selectedRange === '90d' ? 90 : 7
  const selectedPharmacyName = selectedPharmacy === 'all' ? 'Todas' : (pharmacyNameById[selectedPharmacy] || 'Todas')

  const filteredTasks = useMemo(() => allTasks.filter(item => {
    const pharmacyOk = selectedPharmacy === 'all' || String(item.raw?.pharmacy_id || '') === selectedPharmacy || item.pharmacyName === selectedPharmacyName
    const responsibleOk = selectedResponsible === 'all' || item.assignedTo === selectedResponsible
    const statusOk = selectedStatus === 'all' || normalizeKey(item.status) === normalizeKey(selectedStatus)
    const moduleOk = selectedModule === 'all' || selectedModule === 'tasks'
    return pharmacyOk && responsibleOk && statusOk && moduleOk
  }), [allTasks, selectedModule, selectedPharmacy, selectedPharmacyName, selectedResponsible, selectedStatus])

  const filteredSupport = useMemo(() => allSupport.filter(item => {
    const pharmacyOk = selectedPharmacy === 'all' || String(item.raw?.pharmacy_id || '') === selectedPharmacy || item.pharmacyName === selectedPharmacyName
    const responsibleOk = selectedResponsible === 'all' || item.assignedTo === selectedResponsible
    const statusOk = selectedStatus === 'all' || normalizeKey(item.status) === normalizeKey(selectedStatus)
    const moduleOk = selectedModule === 'all' || selectedModule === 'tickets'
    return pharmacyOk && responsibleOk && statusOk && moduleOk
  }), [allSupport, selectedModule, selectedPharmacy, selectedPharmacyName, selectedResponsible, selectedStatus])

  const filteredProjects = useMemo(() => allProjects.filter(project => {
    const projectPharmacyId = String(project.pharmacy_id || project.pharmacyId || project.pharmacy?.id || '')
    const projectPharmacyName = project.pharmacy_name || project.pharmacy?.pharmacy_name || ''
    const pharmacyOk = selectedPharmacy === 'all' || projectPharmacyId === selectedPharmacy || projectPharmacyName === selectedPharmacyName
    const moduleOk = selectedModule === 'all' || selectedModule === 'projects'
    const statusOk = selectedStatus === 'all' || normalizeKey(project.status) === normalizeKey(selectedStatus)
    return pharmacyOk && moduleOk && statusOk
  }), [allProjects, selectedModule, selectedPharmacy, selectedPharmacyName, selectedStatus])

  const activityRows = useMemo(() => {
    const rows = [
      ...filteredSupport.map(item => ({ id: item.id, type: 'Ticket', title: item.title, meta: item.pharmacyName || item.product, date: item.updatedAt || item.createdAt, to: `/soporte/tickets/${item.id}` })),
      ...filteredTasks.map(item => ({ id: item.id, type: 'Tarea', title: item.title, meta: item.pharmacyName || item.assignedTo, date: item.updatedAt || item.createdAt || item.dueDate, to: item.projectId ? `/proyectos/${item.projectId}` : '/proyectos' })),
      ...filteredProjects.map(project => ({ id: project.id, type: 'Proyecto', title: project.name, meta: project.pharmacy_name, date: project.created_at, to: `/proyectos/${project.id}` })),
    ]
    return rows.filter(row => row.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
  }, [filteredProjects, filteredSupport, filteredTasks])

  const priorityRows = useMemo(() => [...filteredSupport, ...filteredTasks].sort((a, b) => {
    const score = value => ({ urgent: 4, urgente: 4, critical: 4, alta: 3, high: 3, medium: 2, medio: 2, media: 2, low: 1, baja: 1, bajo: 1 }[normalizeKey(value)] || 2)
    const diff = score(b.priority) - score(a.priority)
    if (diff) return diff
    return new Date(b.updatedAt || b.createdAt || b.dueDate || 0).getTime() - new Date(a.updatedAt || a.createdAt || a.dueDate || 0).getTime()
  }).slice(0, 5), [filteredSupport, filteredTasks])

  const unassignedRows = useMemo(() => [...filteredSupport, ...filteredTasks].filter(item => !item.assignedTo).slice(0, 5), [filteredSupport, filteredTasks])

  const teamRows = useMemo(() => {
    const map = new Map()
    const touch = (name, item) => {
      if (!name) return
      const current = map.get(name) || { name, assigned: 0, progress: 0, overdue: 0, fresh: 0 }
      current.assigned += 1
      if (['in_progress', 'en_progreso'].includes(normalizeKey(item.status))) current.progress += 1
      const due = item.dueDate || item.raw?.due_date
      if (due && new Date(due).getTime() < Date.now()) current.overdue += 1
      const stamp = item.updatedAt || item.createdAt || item.raw?.updated_at || item.raw?.created_at
      if (stamp && Date.now() - new Date(stamp).getTime() < 1000 * 60 * 60 * 24 * 3) current.fresh += 1
      map.set(name, current)
    }
    filteredTasks.forEach(item => touch(item.assignedTo, item))
    filteredSupport.forEach(item => touch(item.assignedTo, item))
    return [...map.values()].sort((a, b) => b.assigned - a.assigned).slice(0, 5)
  }, [filteredSupport, filteredTasks])

  const riskyProjects = useMemo(() => filteredProjects.filter(project => ['blocked', 'pending', 'in_progress'].includes(normalizeKey(project.status))).slice(0, 5), [filteredProjects])

  const pharmacyActivity = useMemo(() => {
    const counts = new Map()
    const add = name => { if (name) counts.set(name, (counts.get(name) || 0) + 1) }
    filteredTasks.forEach(item => add(item.pharmacyName || pharmacyNameById[String(item.raw?.pharmacy_id || '')] || 'Sin farmacia'))
    filteredSupport.forEach(item => add(item.pharmacyName || pharmacyNameById[String(item.raw?.pharmacy_id || '')] || 'Sin farmacia'))
    filteredProjects.forEach(project => add(project.pharmacy_name || pharmacyNameById[String(project.pharmacy_id || project.pharmacyId || '')] || 'Sin farmacia'))
    return [...counts.entries()].map(([pharmacy, count]) => ({ pharmacy, count })).sort((a, b) => b.count - a.count).slice(0, 5)
  }, [filteredProjects, filteredSupport, filteredTasks, pharmacyNameById])

  const ticketStatusItems = useMemo(() => {
    const rows = [...filteredSupport, ...filteredTasks]
    return ['En curso', 'Pendiente', 'En espera', 'Bloqueado', 'Cerrado'].map(label => ({ label, count: rows.filter(item => statusLabel(item.status) === label).length })).filter(item => item.count > 0)
  }, [filteredSupport, filteredTasks])

  const ticketPriorityItems = useMemo(() => {
    const rows = [...filteredSupport, ...filteredTasks]
    return [
      { label: 'Alta', count: rows.filter(item => ['urgent', 'urgente', 'critical', 'alta', 'high'].includes(normalizeKey(item.priority))).length },
      { label: 'Media', count: rows.filter(item => ['medium', 'medio', 'media'].includes(normalizeKey(item.priority))).length },
      { label: 'Baja', count: rows.filter(item => ['low', 'baja', 'bajo'].includes(normalizeKey(item.priority))).length },
    ]
  }, [filteredSupport, filteredTasks])

  const ticketServiceItems = useMemo(() => {
    const counts = new Map()
    filteredSupport.forEach(item => counts.set(item.product || 'Otros', (counts.get(item.product || 'Otros') || 0) + 1))
    return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [filteredSupport])

  const weeklyCreated = useMemo(() => {
    const series = Array.from({ length: rangeDays }, () => 0)
    const items = [...filteredSupport, ...filteredTasks, ...filteredProjects]
    items.forEach(item => {
      const stamp = item.createdAt || item.created_at || item.updatedAt || item.updated_at
      if (!stamp) return
      const diffDays = Math.floor((Date.now() - new Date(stamp).getTime()) / 86400000)
      const index = rangeDays - 1 - diffDays
      if (index >= 0 && index < series.length) series[index] += 1
    })
    return series
  }, [filteredProjects, filteredSupport, filteredTasks, rangeDays])

  const weeklyClosed = useMemo(() => {
    const series = Array.from({ length: rangeDays }, () => 0)
    filteredProjects.forEach(project => {
      if (!['completed', 'closed', 'cerrado'].includes(normalizeKey(project.status))) return
      const stamp = project.updated_at || project.created_at || project.createdAt
      if (!stamp) return
      const diffDays = Math.floor((Date.now() - new Date(stamp).getTime()) / 86400000)
      const index = rangeDays - 1 - diffDays
      if (index >= 0 && index < series.length) series[index] += 1
    })
    return series
  }, [filteredProjects, rangeDays])

  const metrics = {
    assignedMine: myPendingTasks.length + myPendingSupport.length,
    unassigned: [...filteredSupport, ...filteredTasks].filter(item => !item.assignedTo).length,
    inProgress: [...filteredSupport, ...filteredTasks].filter(item => ['in_progress', 'en_progreso'].includes(normalizeKey(item.status))).length,
    waiting: [...filteredSupport, ...filteredTasks].filter(item => ['esperando_cliente', 'esperando_proveedor'].includes(normalizeKey(item.status))).length,
    pending: filteredTasks.length + filteredSupport.length,
    overdue: filteredTasks.filter(item => item.dueDate && new Date(item.dueDate).getTime() < Date.now()).length,
    highPriority: [...filteredSupport, ...filteredTasks].filter(item => ['urgent', 'urgente', 'critical', 'alta', 'high'].includes(normalizeKey(item.priority))).length,
    closedWeek: filteredProjects.filter(project => ['completed', 'closed', 'cerrado'].includes(normalizeKey(project.status))).length,
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" /></div>
  }

  return (
    <div className="page-wrapper space-y-4 px-3 py-4 sm:px-5 lg:px-6">
      <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400"><Squares2X2Icon className="h-4 w-4" /> Panel de información</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Bienvenido, {dashboardUserName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-full border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"><MagnifyingGlassIcon className="h-5 w-5" /></button>
            <button type="button" className="relative rounded-full border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"><BellIcon className="h-5 w-5" /><span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">3</span></button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserCircleIcon className="h-7 w-7" /></div>
              <div className="text-left"><p className="text-sm font-semibold text-slate-800">{dashboardUserName}</p><p className="text-xs text-slate-500">{profile?.role || 'Técnico'}</p></div>
              <ChevronDownIcon className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1.1fr_0.85fr_0.85fr_0.85fr_0.85fr_auto]">
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-bold text-slate-500">Farmacia</span><select value={selectedPharmacy} onChange={event => setSelectedPharmacy(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">{pharmacyOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-bold text-slate-500">Módulo</span><select value={selectedModule} onChange={event => setSelectedModule(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"><option value="all">Todos los módulos</option><option value="tickets">Tickets</option><option value="projects">Proyectos</option><option value="tasks">Tareas</option></select></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-bold text-slate-500">Estado</span><select value={selectedStatus} onChange={event => setSelectedStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">{statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-bold text-slate-500">Responsable</span><select value={selectedResponsible} onChange={event => setSelectedResponsible(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">{responsibleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className="text-[11px] font-bold text-slate-500">Periodo</span><select value={selectedRange} onChange={event => setSelectedRange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"><option value="7d">Últimos 7 días</option><option value="30d">Últimos 30 días</option><option value="90d">Últimos 90 días</option></select></label>
          <div className="flex items-end"><button type="button" onClick={reload} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50"><AdjustmentsHorizontalIcon className="h-4 w-4" /> Personalizar</button></div>
        </div>
      </section>

      {warning || dashboardError ? <div className="flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"><ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" /><div className="space-y-1">{warning ? <p>Algunos datos operativos no se pudieron cargar del todo. Se muestra la mejor información disponible.</p> : null}{dashboardError ? <p>Proyectos: {dashboardError}</p> : null}</div></div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <Kpi label="Asignados a mí" value={metrics.assignedMine} hint="Activos" Icon={UserGroupIcon} tone="indigo" to="/soporte/tickets" />
        <Kpi label="Sin asignar" value={metrics.unassigned} hint="Tickets" Icon={ClipboardDocumentListIcon} tone="amber" to="/soporte/tickets?status=nuevo" />
        <Kpi label="En curso" value={metrics.inProgress} hint="Trabajo activo" Icon={ClockIcon} tone="sky" to="/soporte/tickets?status=en_progreso" />
        <Kpi label="En espera" value={metrics.waiting} hint="Bloqueados" Icon={ExclamationTriangleIcon} tone="rose" to="/soporte/tickets?status=esperando_cliente" />
        <Kpi label="Pendientes" value={metrics.pending} hint="Tickets" Icon={TicketIcon} tone="slate" to="/soporte/tickets" />
        <Kpi label="Vencidos" value={metrics.overdue} hint="Tareas" Icon={CalendarDaysIcon} tone="rose" to="/proyectos" />
        <Kpi label="Alta prioridad" value={metrics.highPriority} hint="Urgentes" Icon={ExclamationTriangleIcon} tone="amber" to="/soporte/tickets" />
        <Kpi label="Cerrados esta semana" value={metrics.closedWeek} hint="Proyectos" Icon={ChartBarIcon} tone="emerald" to="/proyectos" />
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Card title="Mis prioridades" subtitle="Lo que deberíamos atacar primero" action={<Link to="/soporte/tickets" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-900">Ver todas <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}>
          <DataTable
            emptyText="No hay elementos prioritarios con estos filtros."
            columns={[
              { key: 'title', label: 'Título', render: row => (<div><p className="font-semibold text-slate-900">{row.title}</p><p className="mt-1 text-[11px] text-slate-500">{row.product || row.type || 'Sin tipo'}</p></div>) },
              { key: 'pharmacy', label: 'Farmacia', render: row => <span className="text-slate-600">{row.pharmacyName || pharmacyNameById[String(row.raw?.pharmacy_id || '')] || 'Sin farmacia'}</span> },
              { key: 'type', label: 'Tipo', render: row => <span className="text-slate-600">{row.product || row.type || 'Tarea'}</span> },
              { key: 'status', label: 'Estado', render: row => <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">{statusLabel(row.status)}</span> },
              { key: 'priority', label: 'Prioridad', render: row => <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">{row.priority || 'Media'}</span> },
              { key: 'due', label: 'Vence', render: row => <span className="text-slate-600">{formatShortDate(row.dueDate || row.raw?.due_date || row.updatedAt || row.createdAt)}</span> },
            ]}
            rows={priorityRows}
          />
        </Card>

        <Card title="Sin asignar" subtitle="Pendientes que todavía no tienen responsable" action={<Link to="/soporte/tickets" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-900">Ver todas <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}>
          <DataTable
            emptyText="No hay elementos sin asignar."
            columns={[
              { key: 'title', label: 'Título', render: row => (<div><p className="font-semibold text-slate-900">{row.title}</p><p className="mt-1 text-[11px] text-slate-500">{row.product || row.type || 'Sin tipo'}</p></div>) },
              { key: 'pharmacy', label: 'Farmacia', render: row => <span className="text-slate-600">{row.pharmacyName || pharmacyNameById[String(row.raw?.pharmacy_id || '')] || 'Sin farmacia'}</span> },
              { key: 'module', label: 'Módulo', render: row => <span className="text-slate-600">{row.product || row.type || 'Tarea'}</span> },
              { key: 'date', label: 'Creado hace', render: row => <span className="text-slate-600">{relativeTime(row.createdAt || row.raw?.created_at || row.updatedAt || row.raw?.updated_at)}</span> },
              { key: 'action', label: 'Acción', render: row => <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">Asignar</span> },
            ]}
            rows={unassignedRows}
          />
        </Card>

        <Card title="Carga del equipo" subtitle="Resumen de los responsables más activos" action={<Link to="/personas" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-900">Ver recursos <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}>
          <DataTable
            emptyText="Todavía no hay datos suficientes para la carga del equipo."
            columns={[
              { key: 'name', label: 'Técnico', render: row => <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{row.name.charAt(0)}</div><span className="font-semibold text-slate-900">{row.name}</span></div> },
              { key: 'assigned', label: 'Asignados', render: row => <span className="font-semibold text-slate-900">{row.assigned}</span> },
              { key: 'progress', label: 'En curso', render: row => <span className="font-semibold text-slate-900">{row.progress}</span> },
              { key: 'overdue', label: 'Vencidos', render: row => <span className="font-semibold text-rose-600">{row.overdue}</span> },
              { key: 'fresh', label: 'Sin actualizar', render: row => <span className="font-semibold text-slate-900">{row.fresh}</span> },
            ]}
            rows={teamRows}
          />
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-3">
        <Card title="Proyectos en riesgo" subtitle="Cartera con más atención" action={<Link to="/proyectos" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-900">Ver todas <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}>
          <DataTable
            emptyText="No hay proyectos en riesgo con el filtro actual."
            columns={[
              { key: 'name', label: 'Proyecto', render: row => <span className="font-semibold text-slate-900">{row.name}</span> },
              { key: 'pharmacy', label: 'Farmacia', render: row => <span className="text-slate-600">{row.pharmacy_name || 'Sin farmacia'}</span> },
              { key: 'status', label: 'Progreso', render: row => <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">{statusLabel(row.status)}</span> },
              { key: 'risk', label: 'Riesgo', render: row => <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">Alto</span> },
              { key: 'due', label: 'Fin previsto', render: row => <span className="text-slate-600">{formatShortDate(row.expected_close_date || row.created_at)}</span> },
            ]}
            rows={riskyProjects}
          />
        </Card>

        <Card title="Farmacias con más actividad" subtitle="Dónde estamos moviendo más trabajo" action={<Link to="/farmacias" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-900">Ver todas <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}>
          <DataTable
            emptyText="No hay actividad suficiente para ordenar farmacias."
            columns={[
              { key: 'pharmacy', label: 'Farmacia', render: row => <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700"><BuildingOffice2Icon className="h-4 w-4" /></div><span className="font-semibold text-slate-900">{row.pharmacy}</span></div> },
              { key: 'count', label: 'Actividad', render: row => <span className="font-semibold text-slate-900">{row.count}</span> },
            ]}
            rows={pharmacyActivity}
          />
        </Card>

        <Card title="Últimas actualizaciones" subtitle="Lo más reciente del panel" action={<Link to="/proyectos" className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-900">Ver todas <ArrowRightIcon className="h-3.5 w-3.5" /></Link>}>
          <div className="space-y-3">
            {activityRows.length ? activityRows.map(item => (
              <Link key={`${item.type}-${item.id}`} to={item.to} className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:bg-slate-50">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${item.type === 'Ticket' ? 'bg-teal-50 text-teal-700 ring-teal-100' : item.type === 'Proyecto' ? 'bg-sky-50 text-sky-700 ring-sky-100' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>{item.type.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-700"><b>{item.type}</b> · {item.title}</span>
                  <span className="block truncate text-xs text-slate-400">{item.meta || 'Sin contexto'} · {relativeTime(item.date)}</span>
                </span>
              </Link>
            )) : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">Sin actividad reciente.</div>}
          </div>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <Donut title="Tickets por estado" items={ticketStatusItems} />
        <Donut title="Tickets por prioridad" items={ticketPriorityItems} />
        <Bars title="Tickets por servicio" items={ticketServiceItems} />
        <Line title="Evolución semanal" created={weeklyCreated} closed={weeklyClosed} />
      </section>
    </div>
  )
}





