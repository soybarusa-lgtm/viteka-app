import { useState } from 'react'
import { useProjectDetail } from '../hooks/useProjectDetail'
import { useProjects } from '../hooks/useProjects'

const STAGES = [
  { id: 'leads', label: 'Leads' },
  { id: 'contactado', label: 'Contactado' },
  { id: 'visita', label: 'Visita' },
  { id: 'propuesta', label: 'Propuesta' },
  { id: 'negociacion', label: 'Negociación' },
  { id: 'cerrado', label: 'Cerrado' },
  { id: 'perdido', label: 'Perdido' },
]

const TASK_STATUS = [
  { id: 'pending', label: 'Pendiente', badge: 'badge-gray' },
  { id: 'in_progress', label: 'En curso', badge: 'badge-blue' },
  { id: 'completed', label: 'Completado', badge: 'badge-green' },
  { id: 'blocked', label: 'Bloqueado', badge: 'badge-red' },
]

const INCIDENT_PRIORITY = {
  low: { label: 'Baja', badge: 'badge-gray' },
  medium: { label: 'Media', badge: 'badge-yellow' },
  high: { label: 'Alta', badge: 'badge-orange' },
  critical: { label: 'Crítica', badge: 'badge-red' },
}

const TABS = [
  { id: 'info', label: '📋 Info' },
  { id: 'tasks', label: '✅ Tareas' },
  { id: 'incidents', label: '🚨 Incidencias' },
]

const TASK_EMPTY = { title: '', description: '', status: 'pending', due_date: '', required: false }
const INC_EMPTY = { title: '', description: '', priority: 'medium', status: 'open' }

export default function ProjectDetailPage({ projectId, navigate }) {
  const detail = useProjectDetail(projectId)
  const { updateProject } = useProjects()
  const { project, tasks, incidents, loading, error, createTask, updateTask, deleteTask, createIncident, updateIncident } = detail
  const [tab, setTab] = useState('info')

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState(TASK_EMPTY)
  const [savingTask, setSavingTask] = useState(false)

  // Incident form
  const [showIncForm, setShowIncForm] = useState(false)
  const [editingInc, setEditingInc] = useState(null)
  const [incForm, setIncForm] = useState(INC_EMPTY)
  const [savingInc, setSavingInc] = useState(false)

  const [formError, setFormError] = useState('')

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !project) return (
    <div className="page-container">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error || 'Proyecto no encontrado'}</div>
    </div>
  )

  const p = project
  const isCommercial = p.project_type === 'commercial'

  // Task handlers
  function openTaskCreate() { setTaskForm(TASK_EMPTY); setEditingTask(null); setShowTaskForm(true); setFormError('') }
  function openTaskEdit(t) { setTaskForm(t); setEditingTask(t.id); setShowTaskForm(true); setFormError('') }

  async function handleTaskSubmit(e) {
    e.preventDefault()
    if (!taskForm.title?.trim()) { setFormError('El título es obligatorio'); return }
    setSavingTask(true); setFormError('')
    try {
      if (editingTask) {
        const { id, project_id, company_id, created_at, updated_at, assignee, ...payload } = taskForm
        await updateTask(editingTask, payload)
      } else {
        await createTask(taskForm)
      }
      setShowTaskForm(false)
    } catch (err) { setFormError(err.message) }
    finally { setSavingTask(false) }
  }

  // Incident handlers
  function openIncCreate() { setIncForm(INC_EMPTY); setEditingInc(null); setShowIncForm(true); setFormError('') }
  function openIncEdit(i) { setIncForm(i); setEditingInc(i.id); setShowIncForm(true); setFormError('') }

  async function handleIncSubmit(e) {
    e.preventDefault()
    if (!incForm.title?.trim()) { setFormError('El título es obligatorio'); return }
    setSavingInc(true); setFormError('')
    try {
      if (editingInc) {
        const { id, project_id, pharmacy_id, company_id, created_at, updated_at, assignee, ...payload } = incForm
        await updateIncident(editingInc, payload)
      } else {
        await createIncident(incForm)
      }
      setShowIncForm(false)
    } catch (err) { setFormError(err.message) }
    finally { setSavingInc(false) }
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed').length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const openIncidents = incidents.filter(i => i.status === 'open').length

  return (
    <div className="page-container pb-24 md:pb-6">

      {/* Breadcrumb */}
      <div className="mb-4">
        <button onClick={() => navigate('projects')} className="text-sm text-teal-600 hover:underline mb-2 inline-flex items-center gap-1">
          ← Proyectos
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{p.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="badge-gray">{isCommercial ? '💼 Comercial' : '🔧 Soporte'}</span>
              {isCommercial
                ? <span className="badge-blue text-xs">{STAGES.find(s => s.id === p.pipeline_stage)?.label || p.pipeline_stage}</span>
                : <span className="badge-green text-xs">{p.status}</span>
              }
              {p.pharmacy && (
                <button onClick={() => navigate('pharmacy-detail', { pharmacyId: p.pharmacy_id })} className="text-sm text-teal-600 hover:underline">
                  🏪 {p.pharmacy.pharmacy_name}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPIs rápidos */}
        <div className="flex flex-wrap gap-3 mt-3">
          {p.amount && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5">
              <p className="text-xs text-teal-600">Importe</p>
              <p className="text-sm font-bold text-teal-800">{Number(p.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
            </div>
          )}
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <p className="text-xs text-gray-500">Tareas</p>
            <p className="text-sm font-bold text-gray-800">{completedTasks}/{tasks.length}</p>
          </div>
          {openIncidents > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <p className="text-xs text-red-500">Incidencias abiertas</p>
              <p className="text-sm font-bold text-red-700">{openIncidents}</p>
            </div>
          )}
          {p.expected_close_date && (
            <div className={`border rounded-lg px-3 py-1.5 ${
              new Date(p.expected_close_date) < new Date() ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-xs text-gray-500">Cierre previsto</p>
              <p className={`text-sm font-bold ${
                new Date(p.expected_close_date) < new Date() ? 'text-red-700' : 'text-gray-800'
              }`}>{new Date(p.expected_close_date).toLocaleDateString('es-ES')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.id === 'tasks' && tasks.length > 0 && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5">{tasks.length}</span>}
            {t.id === 'incidents' && incidents.length > 0 && <span className="ml-1.5 text-xs bg-red-100 text-red-600 rounded-full px-1.5">{incidents.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Info */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Detalles del proyecto</h3>
            <dl className="space-y-2 text-sm">
              {p.technician && <Row label="Técnico" value={p.technician.full_name} />}
              {p.commercial && <Row label="Comercial" value={p.commercial.full_name} />}
              {p.start_date && <Row label="Inicio" value={new Date(p.start_date).toLocaleDateString('es-ES')} />}
              {p.expected_close_date && <Row label="Cierre previsto" value={new Date(p.expected_close_date).toLocaleDateString('es-ES')} />}
              {isCommercial && <Row label="Etapa pipeline" value={STAGES.find(s => s.id === p.pipeline_stage)?.label || p.pipeline_stage} />}
              {!isCommercial && <Row label="Estado" value={p.status} />}
              <Row label="Visible cliente" value={p.visible_to_client ? 'Sí' : 'No'} />
            </dl>
          </div>
          {p.notes && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 mb-2">Notas</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{p.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Tareas */}
      {tab === 'tasks' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{completedTasks} de {tasks.length} completadas</p>
            <button onClick={openTaskCreate} className="btn-primary text-sm">+ Nueva tarea</button>
          </div>

          {tasks.length === 0 && !showTaskForm && (
            <div className="empty-state"><span className="text-3xl mb-2">✅</span><p className="text-gray-500 text-sm">Sin tareas</p></div>
          )}

          <div className="space-y-2 mb-4">
            {tasks.map(t => {
              const st = TASK_STATUS.find(s => s.id === t.status)
              return (
                <div key={t.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <input type="checkbox"
                        checked={t.status === 'completed'}
                        onChange={() => updateTask(t.id, { status: t.status === 'completed' ? 'pending' : 'completed' })}
                        className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</p>
                        {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                          {t.due_date && <span>📅 {new Date(t.due_date).toLocaleDateString('es-ES')}</span>}
                          {t.required && <span className="text-orange-500 font-medium">⚠️ Requerida</span>}
                          {t.assignee && <span>👤 {t.assignee.full_name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`${st?.badge || 'badge-gray'} text-xs`}>{st?.label || t.status}</span>
                      <button onClick={() => openTaskEdit(t)} className="btn-ghost text-xs px-2 py-1">Editar</button>
                      <button onClick={() => deleteTask(t.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">🗑️</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {showTaskForm && (
            <div className="card p-5 border-teal-200 border-2">
              <h4 className="font-semibold text-gray-800 mb-4">{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h4>
              <form onSubmit={handleTaskSubmit} className="space-y-3">
                <div><label className="label">Título *</label><input className="input" value={taskForm.title || ''} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required /></div>
                <div><label className="label">Descripción</label><textarea className="input" rows={2} value={taskForm.description || ''} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Estado</label>
                    <select className="input" value={taskForm.status || 'pending'} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}>
                      {TASK_STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Fecha límite</label><input className="input" type="date" value={taskForm.due_date || ''} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={taskForm.required || false} onChange={e => setTaskForm(f => ({ ...f, required: e.target.checked }))} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <span className="text-sm text-gray-700">Tarea requerida</span>
                </label>
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn-secondary" onClick={() => setShowTaskForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={savingTask}>{savingTask ? 'Guardando...' : editingTask ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab Incidencias */}
      {tab === 'incidents' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{openIncidents} abiertas · {incidents.length} total</p>
            <button onClick={openIncCreate} className="btn-primary text-sm">+ Nueva incidencia</button>
          </div>

          {incidents.length === 0 && !showIncForm && (
            <div className="empty-state"><span className="text-3xl mb-2">🚨</span><p className="text-gray-500 text-sm">Sin incidencias</p></div>
          )}

          <div className="space-y-2 mb-4">
            {incidents.map(i => {
              const pr = INCIDENT_PRIORITY[i.priority] || { label: i.priority, badge: 'badge-gray' }
              return (
                <div key={i.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800 text-sm">{i.title}</p>
                        <span className={`${pr.badge} text-xs`}>{pr.label}</span>
                        <span className={i.status === 'open' ? 'badge-red text-xs' : 'badge-green text-xs'}>
                          {i.status === 'open' ? 'Abierta' : i.status === 'resolved' ? 'Resuelta' : i.status}
                        </span>
                      </div>
                      {i.description && <p className="text-xs text-gray-500 mt-1">{i.description}</p>}
                      {i.resolution && <p className="text-xs text-teal-600 mt-1">✅ {i.resolution}</p>}
                    </div>
                    <div className="flex gap-1">
                      {i.status === 'open' && (
                        <button onClick={() => updateIncident(i.id, { status: 'resolved', resolved_at: new Date().toISOString().split('T')[0] })}
                          className="btn-ghost text-xs px-2 py-1">✅ Resolver</button>
                      )}
                      <button onClick={() => openIncEdit(i)} className="btn-ghost text-xs px-2 py-1">Editar</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {showIncForm && (
            <div className="card p-5 border-teal-200 border-2">
              <h4 className="font-semibold text-gray-800 mb-4">{editingInc ? 'Editar incidencia' : 'Nueva incidencia'}</h4>
              <form onSubmit={handleIncSubmit} className="space-y-3">
                <div><label className="label">Título *</label><input className="input" value={incForm.title || ''} onChange={e => setIncForm(f => ({ ...f, title: e.target.value }))} required /></div>
                <div><label className="label">Descripción</label><textarea className="input" rows={2} value={incForm.description || ''} onChange={e => setIncForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Prioridad</label>
                    <select className="input" value={incForm.priority || 'medium'} onChange={e => setIncForm(f => ({ ...f, priority: e.target.value }))}>
                      {Object.entries(INCIDENT_PRIORITY).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <select className="input" value={incForm.status || 'open'} onChange={e => setIncForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="open">Abierta</option>
                      <option value="in_progress">En progreso</option>
                      <option value="resolved">Resuelta</option>
                      <option value="closed">Cerrada</option>
                    </select>
                  </div>
                </div>
                {(incForm.status === 'resolved' || incForm.status === 'closed') && (
                  <div><label className="label">Resolución</label><textarea className="input" rows={2} value={incForm.resolution || ''} onChange={e => setIncForm(f => ({ ...f, resolution: e.target.value }))} /></div>
                )}
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn-secondary" onClick={() => setShowIncForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={savingInc}>{savingInc ? 'Guardando...' : editingInc ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="text-gray-400 w-36 shrink-0">{label}</dt>
      <dd className="text-gray-700 font-medium">{value}</dd>
    </div>
  )
}
