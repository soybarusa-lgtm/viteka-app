import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Icons ──────────────────────────────────────────────────────────────────────
function IconSearch() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)
}
function IconCheck() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>)
}
function IconRefresh() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>)
}

// ── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:        { label: 'Pendiente',   short: 'Pend.',  cls: 'badge-gray',  dot: 'bg-slate-400' },
  in_progress:    { label: 'En progreso', short: 'Curso',  cls: 'badge-amber', dot: 'bg-amber-400' },
  completed:      { label: 'Completado',  short: 'Hecho',  cls: 'badge-green', dot: 'bg-emerald-500' },
  blocked:        { label: 'Bloqueado',   short: 'Bloq.',  cls: 'badge-red',   dot: 'bg-red-400' },
  not_applicable: { label: 'No aplica',   short: 'N/A',    cls: 'badge-gray',  dot: 'bg-gray-300' },
}
const NEXT_STATUS = {
  pending: 'in_progress', in_progress: 'completed', completed: 'pending', blocked: 'pending',
}
const FILTER_OPTS = [
  { value: 'all',         label: 'Todas' },
  { value: 'pending',     label: 'Pendiente' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed',   label: 'Listas' },
  { value: 'blocked',     label: 'Bloq.' },
]

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
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
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
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
    total:       tasks.length,
    pending:     tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed:   tasks.filter(t => t.status === 'completed').length,
    blocked:     tasks.filter(t => t.status === 'blocked').length,
  }), [tasks])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Tareas</h1>
        <p className="page-subtitle">Todas las tareas de los checklists en ejecución</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Total',      value: counts.total,       dot: 'bg-slate-400' },
          { label: 'Pendientes', value: counts.pending,     dot: 'bg-slate-400' },
          { label: 'En curso',   value: counts.in_progress, dot: 'bg-amber-400' },
          { label: 'Listas',     value: counts.completed,   dot: 'bg-emerald-500' },
          { label: 'Bloqueadas', value: counts.blocked,     dot: 'bg-red-400' },
        ].map(k => (
          <div key={k.label} className="card flex flex-col justify-between p-3.5">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${k.dot}`} />
              <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>{k.label}</p>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><IconSearch /></span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar tarea, checklist o farmacia..."
          className="input pl-9 text-[13px]" />
      </div>

      {/* Filter pills */}
      <div className="-mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setFilter(opt.value)}
              className="shrink-0 rounded-full px-4 py-2 text-[12px] font-medium transition"
              style={filter === opt.value
                ? { backgroundColor: 'var(--primary)', color: '#fff' }
                : { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }
              }
            >
              {opt.label}{opt.value !== 'all' && counts[opt.value] !== undefined ? ` (${counts[opt.value]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
        {filtered.length === tasks.length ? `${tasks.length} tareas` : `${filtered.length} de ${tasks.length} tareas`}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state border-dashed">
          <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
            {tasks.length === 0 ? 'Sin tareas' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {tasks.length === 0 ? 'Las tareas aparecen cuando se ejecutan checklists' : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border divide-y"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          {filtered.map(task => {
            const cfg = STATUS_CFG[task.status] || STATUS_CFG.pending
            const project   = task.checklist_sections?.checklists?.projects
            const checklist = task.checklist_sections?.checklists
            const isUpdating = updating === task.id

            const toggleStyle = task.status === 'completed'
              ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', color: '#fff' }
              : task.status === 'blocked'
              ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }
              : task.status === 'in_progress'
              ? { borderColor: 'var(--badge-amber-text)', backgroundColor: 'var(--badge-amber-bg)', color: 'var(--badge-amber-text)' }
              : { borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }

            return (
              <div key={task.id}
                className="flex items-start gap-3 px-4 py-4 transition-colors"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-soft)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>

                <button type="button" onClick={() => !isUpdating && toggleStatus(task)}
                  disabled={isUpdating || task.status === 'not_applicable'}
                  title={`→ ${STATUS_CFG[NEXT_STATUS[task.status]]?.label || '—'}`}
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition"
                  style={{ ...toggleStyle, opacity: isUpdating ? 0.5 : 1, cursor: isUpdating ? 'wait' : 'pointer' }}
                >
                  {isUpdating
                    ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    : task.status === 'completed' ? <IconCheck />
                    : task.status === 'in_progress' ? <IconRefresh />
                    : null
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <p className={`flex-1 text-[14px] font-medium leading-snug ${task.status === 'completed' ? 'line-through' : ''}`}
                      style={{ color: task.status === 'completed' ? 'var(--muted)' : 'var(--text)' }}>
                      {task.title}
                    </p>
                    <span className={`hidden sm:inline-flex ${cfg.cls}`}>{cfg.label}</span>
                  </div>

                  {task.required && <span className="badge-red mt-1 inline-flex">Requerida</span>}
                  {task.description && (
                    <p className="mt-0.5 line-clamp-1 text-[12px]" style={{ color: 'var(--muted)' }}>{task.description}</p>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
                    <span className={`sm:hidden inline-flex ${cfg.cls}`}>{cfg.short}</span>
                    {checklist && <span className="max-w-[140px] truncate">{checklist.title}</span>}
                    {project && <><span>·</span><span className="max-w-[120px] truncate">{project.name}</span></>}
                    {project?.clients && <><span>·</span><span className="max-w-[120px] truncate">{project.clients.pharmacy_name || project.clients.name}</span></>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
