import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AcademicCapIcon,
  BanknotesIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LifebuoyIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import CreateProjectModal from '../components/modals/CreateProjectModal'
import PharmacyMetricCard from '../components/pharmacies/PharmacyMetricCard'
import { useToast } from '../context/ToastContext'
import { useProjects } from '../hooks/useProjects'
import {
  PRIORITIES,
  PROJECT_DIVISIONS,
  PROJECT_STATUSES,
  fmtCurrency,
  fmtDate,
  getDivision,
  getPipeline,
  getPriority,
  getStage,
  getStatus,
  isOverdue,
  normalizeText,
} from '../lib/projectManagement'

const DIVISION_ICONS = {
  commercial: BriefcaseIcon,
  support: LifebuoyIcon,
  training: AcademicCapIcon,
  installation: WrenchScrewdriverIcon,
}

function isWonProject(project, division) {
  return division.id === 'commercial' && (
    project.pipeline_stage === 'cerrado'
    || project.status === 'completed'
  )
}

function ProjectList({ projects, onOpen }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Farmacia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map(project => (
              <tr key={project.id} onClick={() => onOpen(project)} className="cursor-pointer hover:bg-slate-50/70">
                <td className="px-4 py-3 font-semibold text-[#071A1D]">{project.name || 'Proyecto sin nombre'}</td>
                <td className="px-4 py-3 text-slate-600">{project.pharmacy?.pharmacy_name || 'Sin farmacia'}</td>
                <td className="px-4 py-3"><span className={getStatus(project.status).badge}>{getStatus(project.status).label}</span></td>
                <td className="px-4 py-3 text-slate-600">{getStage(project).label}</td>
                <td className={`px-4 py-3 ${isOverdue(project) ? 'font-semibold text-orange-700' : 'text-slate-600'}`}>{fmtDate(project.expected_close_date)}</td>
                <td className="px-4 py-3 text-slate-600">{project.amount ? fmtCurrency(project.amount) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 lg:hidden">
        {projects.map(project => (
          <button key={project.id} type="button" onClick={() => onOpen(project)} className="rounded-2xl border border-[#DDEAE7] bg-white p-4 text-left shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#071A1D]">{project.name || 'Proyecto sin nombre'}</p>
                <p className="mt-1 text-xs text-slate-500">{project.pharmacy?.pharmacy_name || 'Sin farmacia'}</p>
              </div>
              <span className={getStatus(project.status).badge}>{getStatus(project.status).label}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{getStage(project).label}</span>
              <span>{fmtDate(project.expected_close_date)}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function ProjectBoard({ projects, division, onOpen, onMove }) {
  const [dragging, setDragging] = useState(null)
  const pipeline = getPipeline(division)

  function projectsForStage(stageId) {
    return projects.filter(project => {
      const stageExists = pipeline.some(stage => stage.id === project.pipeline_stage)
      return project.pipeline_stage === stageId || (!stageExists && stageId === pipeline[0].id)
    })
  }

  async function handleDrop(event, stageId) {
    event.preventDefault()
    if (!dragging || dragging.pipeline_stage === stageId) return
    await onMove(dragging.id, stageId)
    setDragging(null)
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {pipeline.map(stage => {
          const items = projectsForStage(stage.id)
          return (
            <section key={stage.id} onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, stage.id)} className="w-72 shrink-0 rounded-2xl border border-[#DDEAE7] bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{stage.label}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{items.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {items.length > 0 ? items.map(project => <button key={project.id} type="button" draggable onDragStart={() => setDragging(project)} onClick={() => onOpen(project)} className="w-full rounded-xl border border-[#DDEAE7] bg-slate-50/70 p-3 text-left"><p className="text-sm font-semibold text-[#071A1D]">{project.name}</p><p className="mt-1 text-xs text-slate-500">{project.pharmacy?.pharmacy_name || 'Sin farmacia'}</p></button>) : <div className="rounded-xl border border-dashed border-[#DDEAE7] bg-slate-50 px-3 py-6 text-center text-xs text-slate-400">Sin proyectos</div>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ProjectCalendar({ projects, month, setMonth, onOpen }) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const leadingDays = (firstDay.getDay() + 6) % 7
  const cells = Array.from({ length: Math.ceil((leadingDays + lastDay.getDate()) / 7) * 7 }, (_, index) => {
    const day = index - leadingDays + 1
    return day >= 1 && day <= lastDay.getDate() ? day : null
  })
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`

  function itemsForDay(day) {
    const dayKey = `${monthKey}-${String(day).padStart(2, '0')}`
    return projects.filter(project => project.expected_close_date === dayKey || project.start_date === dayKey)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ChevronLeftIcon className="h-4 w-4" /></button>
        <h3 className="text-sm font-bold capitalize text-[#071A1D]">{month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
        <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ChevronRightIcon className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <div key={day} className="px-2 py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          const items = day ? itemsForDay(day) : []
          return <div key={`${day}-${index}`} className="min-h-24 border-b border-r border-slate-100 p-2">{day ? <p className="text-[11px] font-semibold text-slate-500">{day}</p> : null}<div className="mt-1 space-y-1">{items.slice(0, 3).map(project => <button key={project.id} type="button" onClick={() => onOpen(project)} className="block w-full truncate rounded bg-teal-50 px-1.5 py-1 text-left text-[10px] font-semibold text-teal-700">{project.name}</button>)}</div></div>
        })}
      </div>
    </section>
  )
}

export default function ProjectsPage() {
  const { projects, loading, error, createProject, moveStage } = useProjects()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [division, setDivision] = useState('commercial')
  const [view, setView] = useState('list')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [createDivision, setCreateDivision] = useState(null)
  const [defaultPharmacyId, setDefaultPharmacyId] = useState('')
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const autoOpened = useRef(false)

  useEffect(() => {
    if (searchParams.get('create') !== '1' || autoOpened.current) return
    const requestedType = PROJECT_DIVISIONS.some(item => item.id === searchParams.get('type')) ? searchParams.get('type') : 'commercial'
    setDivision(requestedType)
    setCreateDivision(requestedType)
    setDefaultPharmacyId(searchParams.get('pharmacy_id') || '')
    setSearchParams({}, { replace: true })
    autoOpened.current = true
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const requestedStatus = searchParams.get('status')
    if (!requestedStatus) return
    const allowed = ['all', 'active', 'in_progress', 'pending', 'blocked', 'completed']
    if (!allowed.includes(requestedStatus) || status === requestedStatus) return
    setStatus(requestedStatus)
  }, [searchParams, status])

  const counts = useMemo(() => ({
    total: projects.length,
    active: projects.filter(project => ['active', 'in_progress'].includes(project.status)).length,
    overdue: projects.filter(isOverdue).length,
    amount: projects.filter(project => getDivision(project).id === 'commercial').reduce((sum, project) => sum + Number(project.amount || 0), 0),
  }), [projects])

  const filtered = useMemo(() => projects.filter(project => {
    const divisionData = getDivision(project)
    const responsible = project.commercial?.full_name || project.technician?.full_name || ''
    const haystack = normalizeText([
      project.name,
      project.pharmacy?.pharmacy_name,
      project.pharmacy?.city,
      project.pharmacy?.province,
      getStage(project).label,
      getStatus(project.status).label,
      responsible,
    ].join(' '))

    const matchesStatus = (() => {
      if (status === 'all') return true
      if (status === 'active') return ['active', 'in_progress'].includes(project.status)
      return project.status === status
    })()

    return divisionData.id === division
      && (!search || haystack.includes(normalizeText(search)))
      && matchesStatus
      && (priority === 'all' || (project.priority || 'medium') === priority)
  }), [division, priority, projects, search, status])

  async function handleCreate(payload) {
    const created = await createProject(payload)
    toast('Proyecto creado correctamente.', 'success')
    navigate(`/proyectos/${created.id}`)
  }

  async function handleMove(projectId, stageId) {
    try {
      await moveStage(projectId, stageId)
      toast('Etapa actualizada.', 'success', 1800)
    } catch (moveError) {
      toast(moveError.message, 'error')
    }
  }

  return (
    <div className="space-y-4 px-3 py-4 sm:px-5 lg:px-6">
      <section className="space-y-4 rounded-[28px] border border-[#DDEAE7] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Centro operativo</p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#071A1D]">Proyectos</h1>
            <p className="mt-2 text-sm text-slate-500">Cartera compacta con lista por defecto, tablero disponible y calendario cuando haga falta.</p>
          </div>
          <button type="button" onClick={() => setCreateDivision(division)} className="btn-primary self-start sm:self-auto"><PlusIcon className="h-4 w-4" /> Nuevo proyecto</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PharmacyMetricCard label="Cartera total" value={counts.total} hint="proyectos" icon={BriefcaseIcon} />
          <PharmacyMetricCard label="En marcha" value={counts.active} hint="activos" icon={ClockIcon} tone="success" />
          <PharmacyMetricCard label="Vencidos" value={counts.overdue} hint="requieren atención" icon={ExclamationTriangleIcon} tone={counts.overdue > 0 ? 'warning' : 'default'} />
          <PharmacyMetricCard label="Pipeline comercial" value={fmtCurrency(counts.amount)} hint="importe estimado" icon={BanknotesIcon} tone="info" />
        </div>
      </section>

      <section className="rounded-2xl border border-[#DDEAE7] bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
          {PROJECT_DIVISIONS.map(item => {
            const Icon = DIVISION_ICONS[item.id]
            const count = projects.filter(project => getDivision(project).id === item.id).length
            const active = division === item.id
            return <button key={item.id} type="button" onClick={() => setDivision(item.id)} className={`rounded-xl px-3 py-3 text-left transition-colors ${active ? 'bg-[#00695C] text-white' : 'hover:bg-slate-50'}`}><div className="flex items-center justify-between gap-2"><Icon className={`h-5 w-5 ${active ? 'text-teal-50' : 'text-teal-700'}`} /><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span></div><p className={`mt-2 text-sm font-bold ${active ? 'text-white' : 'text-[#071A1D]'}`}>{item.label}</p></button>
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar proyectos, farmacia o responsable..." className="w-full rounded-xl border border-[#DDEAE7] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100" />
            </label>
            <select value={status} onChange={event => setStatus(event.target.value)} className="rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"><option value="all">Todos los estados</option>{PROJECT_STATUSES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            <select value={priority} onChange={event => setPriority(event.target.value)} className="rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"><option value="all">Toda prioridad</option>{PRIORITIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
          </div>
          <div className="flex rounded-xl border border-[#DDEAE7] bg-slate-50 p-1">
            {[{ id: 'list', label: 'Lista', icon: ListBulletIcon }, { id: 'board', label: 'Tablero', icon: Squares2X2Icon }, { id: 'calendar', label: 'Calendario', icon: CalendarDaysIcon }].map(option => <button key={option.id} type="button" onClick={() => setView(option.id)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${view === option.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-teal-700'}`}><option.icon className="h-4 w-4" />{option.label}</button>)}
          </div>
        </div>
      </section>

      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{filtered.length} proyectos visibles</p>
      {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <div className="flex justify-center py-24"><div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-[#DDEAE7] bg-white px-5 py-14 text-center"><BriefcaseIcon className="mx-auto h-8 w-8 text-teal-500" /><p className="mt-3 text-sm font-bold text-slate-700">No hay proyectos en esta vista</p><p className="mt-1 text-xs text-slate-400">Crea uno nuevo o ajusta los filtros.</p></div> : view === 'board' ? <ProjectBoard projects={filtered} division={division} onOpen={project => navigate(`/proyectos/${project.id}`)} onMove={handleMove} /> : view === 'calendar' ? <ProjectCalendar projects={filtered} month={month} setMonth={setMonth} onOpen={project => navigate(`/proyectos/${project.id}`)} /> : <ProjectList projects={filtered} onOpen={project => navigate(`/proyectos/${project.id}`)} />}

      {createDivision ? <CreateProjectModal defaultType={createDivision} defaultPharmacyId={defaultPharmacyId} onClose={() => setCreateDivision(null)} onCreate={handleCreate} /> : null}
    </div>
  )
}
