import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AcademicCapIcon,
  BanknotesIcon,
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
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import CreateProjectModal from '../components/modals/CreateProjectModal'
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

const DIVISION_STYLE = {
  commercial: 'border-teal-200 bg-teal-50 text-teal-800',
  support: 'border-sky-200 bg-sky-50 text-sky-800',
  training: 'border-amber-200 bg-amber-50 text-amber-800',
  installation: 'border-violet-200 bg-violet-50 text-violet-800',
}

const VIEW_OPTIONS = [
  { id: 'board', label: 'Tablero', Icon: Squares2X2Icon },
  { id: 'list', label: 'Lista', Icon: ListBulletIcon },
  { id: 'calendar', label: 'Calendario', Icon: CalendarDaysIcon },
]

function MetricCard({ label, value, detail, Icon, alert = false }) {
  return (
    <div className={`rounded-xl border bg-white px-3 py-3 shadow-sm ${alert ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${alert ? 'text-rose-600' : 'text-slate-400'}`}>{label}</p>
        <Icon className={`h-4 w-4 ${alert ? 'text-rose-500' : 'text-teal-700'}`} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`font-display text-2xl font-extrabold ${alert ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
        {detail && <p className="truncate text-xs text-slate-400">{detail}</p>}
      </div>
    </div>
  )
}

function ProjectCard({ project, onOpen, onDragStart }) {
  const division = getDivision(project)
  const priority = getPriority(project.priority)
  const stage = getStage(project)
  return (
    <button
      type="button"
      draggable
      onDragStart={event => onDragStart(event, project)}
      onClick={() => onOpen(project)}
      className="w-full cursor-grab rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold leading-snug text-slate-900">{project.name}</p>
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priority.dot}`} title={`Prioridad ${priority.label}`} />
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">{project.pharmacy?.pharmacy_name || 'Sin farmacia asignada'}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${DIVISION_STYLE[division.id]}`}>{stage.label}</span>
        <span className={`text-[11px] ${isOverdue(project) ? 'font-bold text-rose-600' : 'text-slate-400'}`}>
          {project.expected_close_date ? fmtDate(project.expected_close_date, { year: false }) : 'Sin fecha'}
        </span>
      </div>
    </button>
  )
}

function BoardView({ projects, division, onOpen, onMove }) {
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
    <div className="-mx-3 overflow-x-auto px-3 pb-4 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
      <div className="flex min-w-max gap-3">
        {pipeline.map(stage => {
          const stageProjects = projectsForStage(stage.id)
          return (
            <section
              key={stage.id}
              onDragOver={event => event.preventDefault()}
              onDrop={event => handleDrop(event, stage.id)}
              className="w-64 shrink-0"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600">{stage.label}</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{stageProjects.length}</span>
              </div>
              <div className={`min-h-28 space-y-2 rounded-2xl border border-dashed p-2 transition ${dragging ? 'border-teal-300 bg-teal-50/50' : 'border-slate-200 bg-slate-100/60'}`}>
                {stageProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={onOpen}
                    onDragStart={(event, item) => {
                      event.dataTransfer.effectAllowed = 'move'
                      setDragging(item)
                    }}
                  />
                ))}
                {stageProjects.length === 0 && <p className="px-2 py-5 text-center text-[11px] text-slate-400">Suelta aquí</p>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function ListView({ projects, onOpen }) {
  if (!projects.length) return <EmptyProjects />
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Farmacia</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha objetivo</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map(project => {
                const priority = getPriority(project.priority)
                const status = getStatus(project.status)
                return (
                  <tr key={project.id} onClick={() => onOpen(project)} className="cursor-pointer transition hover:bg-teal-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">{project.name}</td>
                    <td className="px-4 py-3 text-slate-600">{project.pharmacy?.pharmacy_name || 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-slate-600">{getStage(project).label}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600"><span className={`h-2 w-2 rounded-full ${priority.dot}`} />{priority.label}</span>
                    </td>
                    <td className="px-4 py-3"><span className={status.badge}>{status.label}</span></td>
                    <td className={`px-4 py-3 ${isOverdue(project) ? 'font-bold text-rose-600' : 'text-slate-600'}`}>{fmtDate(project.expected_close_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{project.commercial?.full_name || project.technician?.full_name || 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-slate-400"><ChevronRightIcon className="h-4 w-4" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {projects.map(project => {
          const priority = getPriority(project.priority)
          return (
            <button key={project.id} type="button" onClick={() => onOpen(project)} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{project.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{project.pharmacy?.pharmacy_name || 'Sin farmacia asignada'}</p>
                </div>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priority.dot}`} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
                <span className="text-slate-500">{getStage(project).label}</span>
                <span className={isOverdue(project) ? 'font-bold text-rose-600' : 'text-slate-400'}>{fmtDate(project.expected_close_date)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

function CalendarView({ projects, month, setMonth, onOpen }) {
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <button type="button" aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h3 className="font-display text-sm font-extrabold capitalize text-slate-900">{month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
        <button type="button" aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => <div key={day} className="px-2 py-2 text-center text-[10px] font-bold text-slate-400">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          const items = day ? itemsForDay(day) : []
          return (
            <div key={`${day}-${index}`} className="min-h-20 border-b border-r border-slate-100 p-1 sm:min-h-28 sm:p-2">
              {day && <p className="text-[11px] font-bold text-slate-500">{day}</p>}
              <div className="mt-1 space-y-1">
                {items.slice(0, 3).map(project => (
                  <button key={project.id} type="button" onClick={() => onOpen(project)} className="block w-full truncate rounded bg-teal-50 px-1.5 py-1 text-left text-[10px] font-bold text-teal-800 hover:bg-teal-100">
                    {project.name}
                  </button>
                ))}
                {items.length > 3 && <p className="text-[10px] font-bold text-slate-400">+{items.length - 3} más</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyProjects() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-14 text-center">
      <BriefcaseIcon className="mx-auto h-8 w-8 text-teal-500" />
      <p className="mt-3 text-sm font-bold text-slate-700">No hay proyectos en esta vista</p>
      <p className="mt-1 text-xs text-slate-400">Crea uno nuevo o ajusta los filtros.</p>
    </div>
  )
}

export default function ProjectsPage() {
  const { projects, loading, error, createProject, moveStage } = useProjects()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [division, setDivision] = useState('commercial')
  const [view, setView] = useState('board')
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

  const counts = useMemo(() => ({
    total: projects.length,
    active: projects.filter(project => ['active', 'in_progress'].includes(project.status)).length,
    overdue: projects.filter(isOverdue).length,
    amount: projects.filter(project => getDivision(project).id === 'commercial').reduce((sum, project) => sum + Number(project.amount || 0), 0),
  }), [projects])

  const divisionCounts = useMemo(() => Object.fromEntries(
    PROJECT_DIVISIONS.map(item => [item.id, projects.filter(project => getDivision(project).id === item.id).length]),
  ), [projects])

  const filtered = useMemo(() => projects.filter(project => {
    const haystack = normalizeText([
      project.name,
      project.pharmacy?.pharmacy_name,
      project.pharmacy?.city,
      project.pharmacy?.province,
      project.commercial?.full_name,
      project.technician?.full_name,
      getStage(project).label,
    ].join(' '))
    return getDivision(project).id === division
      && (!search || haystack.includes(normalizeText(search)))
      && (status === 'all' || project.status === status)
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
    <div className="space-y-5 px-3 py-4 sm:px-5 lg:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Centro operativo</p>
          <h1 className="font-display text-2xl font-extrabold text-slate-950 sm:text-3xl">Proyectos</h1>
          <p className="mt-1 text-sm text-slate-500">Planifica, coordina y conecta cada trabajo con su farmacia.</p>
        </div>
        <button type="button" onClick={() => setCreateDivision(division)} className="btn-primary self-start sm:self-auto">
          <PlusIcon className="h-4 w-4" /> Nuevo proyecto
        </button>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MetricCard label="Cartera total" value={counts.total} detail="proyectos" Icon={BriefcaseIcon} />
        <MetricCard label="En marcha" value={counts.active} detail="activos" Icon={ClockIcon} />
        <MetricCard label="Vencidos" value={counts.overdue} detail="requieren atención" Icon={ExclamationTriangleIcon} alert={counts.overdue > 0} />
        <MetricCard label="Pipeline comercial" value={fmtCurrency(counts.amount)} detail="estimado" Icon={BanknotesIcon} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
          {PROJECT_DIVISIONS.map(item => {
            const Icon = DIVISION_ICONS[item.id]
            return (
              <button key={item.id} type="button" onClick={() => setDivision(item.id)} className={`rounded-xl px-3 py-3 text-left transition ${division === item.id ? 'bg-teal-700 text-white shadow-md' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-2">
                  <Icon className={`h-5 w-5 ${division === item.id ? 'text-teal-100' : 'text-teal-700'}`} />
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${division === item.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'}`}>{divisionCounts[item.id]}</span>
                </div>
                <p className={`mt-2 text-sm font-extrabold ${division === item.id ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                <p className={`mt-0.5 hidden text-[11px] lg:block ${division === item.id ? 'text-teal-100' : 'text-slate-400'}`}>{item.description}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar proyecto, farmacia o responsable..." />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select className="input min-w-0 sm:w-36" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="all">Todos los estados</option>
            {PROJECT_STATUSES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <select className="input min-w-0 sm:w-36" value={priority} onChange={event => setPriority(event.target.value)}>
            <option value="all">Toda prioridad</option>
            {PRIORITIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {VIEW_OPTIONS.map(option => (
            <button key={option.id} type="button" onClick={() => setView(option.id)} title={option.label} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold transition sm:flex-none ${view === option.id ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}>
              <option.Icon className="h-4 w-4" /><span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{filtered.length} proyectos visibles</p>
        <p className="hidden text-xs text-slate-400 sm:block">Arrastra tarjetas para actualizar el pipeline</p>
      </div>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-24"><div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /></div>
      ) : view === 'board' ? (
        filtered.length ? <BoardView projects={filtered} division={division} onOpen={project => navigate(`/proyectos/${project.id}`)} onMove={handleMove} /> : <EmptyProjects />
      ) : view === 'list' ? (
        <ListView projects={filtered} onOpen={project => navigate(`/proyectos/${project.id}`)} />
      ) : (
        <CalendarView projects={filtered} month={month} setMonth={setMonth} onOpen={project => navigate(`/proyectos/${project.id}`)} />
      )}

      {createDivision && (
        <CreateProjectModal
          defaultType={createDivision}
          defaultPharmacyId={defaultPharmacyId}
          onClose={() => setCreateDivision(null)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
