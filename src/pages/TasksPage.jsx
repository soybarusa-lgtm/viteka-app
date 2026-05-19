import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_CFG = {
  pending:        { label: 'Pendiente',   cls: 'badge-yellow', dot: 'bg-yellow-400' },
  in_progress:    { label: 'En progreso', cls: 'badge-blue',   dot: 'bg-blue-400'   },
  completed:      { label: 'Completado',  cls: 'badge-green',  dot: 'bg-teal-500'   },
  blocked:        { label: 'Bloqueado',   cls: 'badge-red',    dot: 'bg-red-400'    },
  not_applicable: { label: 'No aplica',   cls: 'badge-gray',   dot: 'bg-gray-300'   },
}
const NEXT_STATUS = {
  pending: 'in_progress', in_progress: 'completed', completed: 'pending', blocked: 'pending',
}
const PRIORITY_DOT = {
  urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-gray-300',
}
const FILTER_OPTS = [
  { value: 'all',         label: 'Todas'      },
  { value: 'pending',     label: 'Pendientes' },
  { value: 'in_progress', label: 'En curso'   },
  { value: 'completed',   label: 'Listas'     },
  { value: 'blocked',     label: 'Bloqueadas' },
]

function IconSearch() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
}
function IconCheck() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function IconRefresh() {
  return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
}

export default function TasksPage({ profile }) {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState('all')
  const [updating, setUpdating] = useState(null)

  useEffect(() => { if (profile?.company_id) load() }, [profile?.company_id])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id, title, description, status, priority, due_date,
        projects ( id, name,
          pharmacies ( id, name )
        )
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
    if (!error) setTasks(data || [])
    setLoading(false)
  }

  async function toggleStatus(task) {
    const next = NEXT_STATUS[task.status] || 'pending'
    setUpdating(task.id)
    const { error } = await supabase
      .from('tasks')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', task.id)
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    setUpdating(null)
  }

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const text = [t.title, t.description, t.projects?.name, t.projects?.pharmacies?.name].join(' ').toLowerCase()
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

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="page-container space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tareas</h1>
          <p className="text-sm text-gray-500">Todas las tareas de proyectos activos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Total',      value: counts.total,       dot: 'bg-gray-400',   alert: false },
          { label: 'Pendientes', value: counts.pending,     dot: 'bg-yellow-400', alert: false },
          { label: 'En curso',   value: counts.in_progress, dot: 'bg-blue-400',   alert: false },
          { label: 'Listas',     value: counts.completed,   dot: 'bg-teal-500',   alert: false },
          { label: 'Bloqueadas', value: counts.blocked,     dot: 'bg-red-400',    alert: counts.blocked > 0 },
        ].map(k => (
          <div key={k.label} className={`card p-4 flex flex-col gap-3 ${
            k.alert ? 'border-red-200 bg-red-50' : ''
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${k.dot}`} />
              <p className={`text-xs truncate ${k.alert ? 'text-red-500' : 'text-gray-500'}`}>{k.label}</p>
            </div>
            <p className={`text-2xl font-semibold tracking-tight ${k.alert ? 'text-red-600' : 'text-gray-900'}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar tarea, proyecto o farmacia..."
          className="input pl-9"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              filter === opt.value
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
            }`}
          >
            {opt.label}{opt.value !== 'all' && counts[opt.value] !== undefined ? ` (${counts[opt.value]})` : ''}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        {filtered.length === tasks.length ? `${tasks.length} tareas` : `${filtered.length} de ${tasks.length}`}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm font-medium text-gray-700">
            {tasks.length === 0 ? 'Sin tareas' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {tasks.length === 0 ? 'Las tareas aparecen cuando hay proyectos activos' : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 overflow-hidden">
          {filtered.map(task => {
            const cfg = STATUS_CFG[task.status] || STATUS_CFG.pending
            const isUpdating = updating === task.id
            const isCompleted  = task.status === 'completed'
            const isBlocked    = task.status === 'blocked'
            const isInProgress = task.status === 'in_progress'

            return (
              <div key={task.id} className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition">
                <button
                  type="button"
                  onClick={() => !isUpdating && toggleStatus(task)}
                  disabled={isUpdating || task.status === 'not_applicable'}
                  title={`→ ${STATUS_CFG[NEXT_STATUS[task.status]]?.label || '—'}`}
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    isCompleted   ? 'border-teal-500 bg-teal-500 text-white'
                    : isBlocked   ? 'border-red-400 bg-red-50 text-red-500'
                    : isInProgress ? 'border-blue-400 bg-blue-50 text-blue-500'
                    : 'border-gray-300 bg-white'
                  }`}
                  style={{ opacity: isUpdating ? 0.5 : 1, cursor: isUpdating ? 'wait' : 'pointer' }}
                >
                  {isUpdating
                    ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    : isCompleted   ? <IconCheck />
                    : isInProgress  ? <IconRefresh />
                    : null
                  }
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2">
                    <p className={`flex-1 text-sm font-medium leading-snug ${
                      isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </p>
                    <span className={cfg.cls}>{cfg.label}</span>
                  </div>

                  {task.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">{task.description}</p>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                    {task.priority && (
                      <span className={`inline-block h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority] || 'bg-gray-300'}`} title={task.priority} />
                    )}
                    {task.projects?.name && <span className="truncate max-w-[140px]">{task.projects.name}</span>}
                    {task.projects?.pharmacies?.name && (
                      <><span>·</span><span className="truncate max-w-[120px]">{task.projects.pharmacies.name}</span></>
                    )}
                    {task.due_date && (
                      <><span>·</span>
                      <span className={new Date(task.due_date) < new Date() && !isCompleted ? 'text-red-500 font-medium' : ''}>
                        {new Date(task.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span></>
                    )}
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
