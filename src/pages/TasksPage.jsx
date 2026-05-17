import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Icons ──────────────────────────────────────────────────────────────────
function IconSearch() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)
}
function IconCheck() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>)
}
function IconRefresh() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>)
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:        { label: 'Pendiente',      pill: 'bg-slate-100 text-slate-600 ring-slate-200',    dot: 'bg-slate-400' },
  in_progress:    { label: 'En progreso',    pill: 'bg-amber-50 text-amber-700 ring-amber-200',     dot: 'bg-amber-400' },
  completed:      { label: 'Completado',     pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  blocked:        { label: 'Bloqueado',      pill: 'bg-red-50 text-red-600 ring-red-200',           dot: 'bg-red-400' },
  not_applicable: { label: 'No aplica',      pill: 'bg-gray-100 text-gray-500 ring-gray-200',       dot: 'bg-gray-300' },
}

const NEXT_STATUS = {
  pending:     'in_progress',
  in_progress: 'completed',
  completed:   'pending',
  blocked:     'pending',
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [updating, setUpdating] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('checklist_tasks')
      .select(`
        id, title, description, status, required, position,
        checklist_sections (
          id, title,
          checklists (
            id, title,
            projects (
              id, name,
              clients ( id, name, pharmacy_name )
            )
          )
        )
      `)
      .order('position', { ascending: true })
    if (!error) setTasks(data || [])
    setLoading(false)
  }

  async function toggleStatus(task) {
    const next = NEXT_STATUS[task.status] || 'pending'
    setUpdating(task.id)
    const { error } = await supabase
      .from('checklist_tasks')
      .update({ status: next })
      .eq('id', task.id)
    if (!error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    }
    setUpdating(null)
  }

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const text = [
        t.title, t.description,
        t.checklist_sections?.checklists?.title,
        t.checklist_sections?.checklists?.projects?.name,
        t.checklist_sections?.checklists?.projects?.clients?.pharmacy_name,
      ].join(' ').toLowerCase()
      return (
        (!search || text.includes(search.toLowerCase())) &&
        (filter === 'all' || t.status === filter)
      )
    })
  }, [tasks, search, filter])

  const counts = useMemo(() => ({
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'pending').length,
    in_progress:tasks.filter(t => t.status === 'in_progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    blocked:    tasks.filter(t => t.status === 'blocked').length,
  }), [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Tareas</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Todas las tareas de los checklists en ejecución</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total',       value: counts.total,       dot: 'bg-slate-400' },
          { label: 'Pendientes',  value: counts.pending,     dot: 'bg-slate-400' },
          { label: 'En progreso', value: counts.in_progress, dot: 'bg-amber-400' },
          { label: 'Completadas', value: counts.completed,   dot: 'bg-emerald-500' },
          { label: 'Bloqueadas',  value: counts.blocked,     dot: 'bg-red-400' },
        ].map(k => (
          <div key={k.label} className="flex flex-col justify-between rounded-2xl border border-[#E8EDF2] bg-white p-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${k.dot}`} />
              <p className="text-[11px] text-[#94A3B8]">{k.label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por tarea, checklist, proyecto o farmacia..."
            className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-[#E8EDF2] bg-white p-1">
          {['all', 'pending', 'in_progress', 'completed', 'blocked'].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                filter === s ? 'bg-[#005643] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              {s === 'all' ? 'Todas' : STATUS_CFG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-[#94A3B8]">
        {filtered.length === tasks.length ? `${tasks.length} tareas` : `${filtered.length} de ${tasks.length} tareas`}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-12 text-center">
          <p className="text-[14px] font-medium text-[#0F172A]">{tasks.length === 0 ? 'Sin tareas' : 'Sin resultados'}</p>
          <p className="mt-1 text-[13px] text-[#94A3B8]">
            {tasks.length === 0 ? 'Las tareas aparecen cuando se ejecutan checklists' : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white divide-y divide-[#F1F5F9]">
          {filtered.map(task => {
            const cfg = STATUS_CFG[task.status] || STATUS_CFG.pending
            const project = task.checklist_sections?.checklists?.projects
            const checklist = task.checklist_sections?.checklists
            const isUpdating = updating === task.id
            return (
              <div key={task.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[#FAFBFC] transition-colors">
                {/* Toggle button */}
                <button
                  type="button"
                  onClick={() => !isUpdating && toggleStatus(task)}
                  disabled={isUpdating || task.status === 'not_applicable'}
                  title={`Pasar a: ${STATUS_CFG[NEXT_STATUS[task.status]]?.label || '—'}`}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    task.status === 'completed'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : task.status === 'blocked'
                      ? 'border-red-400 bg-red-50 text-red-400'
                      : task.status === 'in_progress'
                      ? 'border-amber-400 bg-amber-50 text-amber-500'
                      : 'border-[#CBD5E1] bg-white hover:border-[#005643]'
                  } ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                >
                  {isUpdating
                    ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    : task.status === 'completed' ? <IconCheck />
                    : task.status === 'in_progress' ? <IconRefresh />
                    : null
                  }
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-[14px] font-medium ${
                      task.status === 'completed' ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'
                    }`}>
                      {task.title}
                    </p>
                    {task.required && (
                      <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-500 ring-1 ring-red-200">Requerida</span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-0.5 text-[12px] text-[#94A3B8] line-clamp-1">{task.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#94A3B8]">
                    {checklist && <span className="truncate max-w-[180px]">{checklist.title}</span>}
                    {project && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[160px]">{project.name}</span>
                      </>
                    )}
                    {project?.clients && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[160px]">{project.clients.pharmacy_name || project.clients.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Badge */}
                <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${cfg.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
