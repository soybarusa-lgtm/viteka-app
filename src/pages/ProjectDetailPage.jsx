import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  FlagIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import { useProjectDetail } from '../hooks/useProjectDetail'
import { useProjects } from '../hooks/useProjects'
import {
  MESSAGE_CHANNELS,
  MILESTONE_TYPES,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  fmtCurrency,
  fmtDate,
  fmtDateTime,
  getDivision,
  getPipeline,
  getPriority,
  getStage,
  getStatus,
  isOverdue,
} from '../lib/projectManagement'

const TABS = [
  { id: 'overview', label: 'Resumen', Icon: DocumentCheckIcon },
  { id: 'tasks', label: 'Tareas', Icon: CheckCircleIcon },
  { id: 'calendar', label: 'Calendario', Icon: CalendarDaysIcon },
  { id: 'messages', label: 'Comunicaciones', Icon: ChatBubbleLeftRightIcon },
]

const EMPTY_TASK = { title: '', description: '', status: 'pending', priority: 'medium', due_date: '' }
const EMPTY_MILESTONE = { title: '', milestone_type: 'milestone', status: 'pending', start_at: '', notes: '' }
const EMPTY_MESSAGE = { audience: 'internal', channel: 'note', subject: '', message: '' }

function ProjectStat({ label, value, detail, Icon, alert = false }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${alert ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${alert ? 'text-rose-500' : 'text-slate-400'}`}>{label}</p>
        <Icon className={`h-4 w-4 ${alert ? 'text-rose-500' : 'text-teal-700'}`} />
      </div>
      <p className={`mt-2 truncate text-lg font-extrabold ${alert ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
      {detail && <p className="mt-0.5 truncate text-[11px] text-slate-400">{detail}</p>}
    </div>
  )
}

function EmptyState({ title, text, Icon }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-10 text-center">
      <Icon className="mx-auto h-7 w-7 text-teal-600" />
      <p className="mt-3 text-sm font-bold text-slate-700">{title}</p>
      {text && <p className="mt-1 text-xs text-slate-400">{text}</p>}
    </div>
  )
}

function Drawer({ title, subtitle, onClose, children }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">{subtitle}</p>
            <h2 className="font-display text-xl font-extrabold text-slate-900">{title}</h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ProjectEditDrawer({ project, onClose, onSave }) {
  const division = getDivision(project)
  const pipeline = getPipeline(project)
  const [form, setForm] = useState({
    name: project.name || '',
    status: project.status || 'active',
    priority: project.priority || 'medium',
    pipeline_stage: project.pipeline_stage || pipeline[0].id,
    start_date: project.start_date || '',
    expected_close_date: project.expected_close_date || '',
    amount: project.amount || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer title="Editar proyecto" subtitle={division.label} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={event => set('name', event.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.status} onChange={event => set('status', event.target.value)}>
              {PROJECT_STATUSES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Prioridad</label>
            <select className="input" value={form.priority} onChange={event => set('priority', event.target.value)}>
              {PRIORITIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Etapa del proceso</label>
          <select className="input" value={form.pipeline_stage} onChange={event => set('pipeline_stage', event.target.value)}>
            {pipeline.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Inicio</label><input type="date" className="input" value={form.start_date} onChange={event => set('start_date', event.target.value)} /></div>
          <div><label className="label">Fecha objetivo</label><input type="date" className="input" value={form.expected_close_date} onChange={event => set('expected_close_date', event.target.value)} /></div>
        </div>
        {division.id === 'commercial' && <div><label className="label">Importe estimado</label><input type="number" min="0" step="0.01" className="input" value={form.amount} onChange={event => set('amount', event.target.value)} /></div>}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Drawer>
  )
}

function OverviewTab({ project, tasks, milestones, onTab }) {
  const division = getDivision(project)
  const stage = getStage(project)
  const priority = getPriority(project.priority)
  const pendingTasks = tasks.filter(task => task.status !== 'completed' && !task.title?.startsWith('[Hito] ')).slice(0, 4)
  const upcomingMilestones = milestones.filter(item => item.status !== 'completed').slice(0, 4)

  return (
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-extrabold text-slate-900">Ficha operativa</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold ${priority.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} /> Prioridad {priority.label}
            </span>
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <InfoRow label="División" value={division.label} />
            <InfoRow label="Etapa actual" value={stage.label} />
            <InfoRow label="Estado" value={getStatus(project.status).label} />
            <InfoRow label="Farmacia" value={project.pharmacy?.pharmacy_name || 'Sin asignar'} />
            <InfoRow label="Responsable" value={project.commercial?.full_name || project.technician?.full_name || 'Sin asignar'} />
            <InfoRow label="Inicio" value={fmtDate(project.start_date)} />
            <InfoRow label="Fecha objetivo" value={fmtDate(project.expected_close_date)} />
            {division.id === 'commercial' && <InfoRow label="Importe estimado" value={fmtCurrency(project.amount)} />}
          </dl>
        </section>

        <OverviewList
          title="Próximos hitos"
          Icon={CalendarDaysIcon}
          empty="Todavía no hay hitos planificados."
          items={upcomingMilestones}
          onOpen={() => onTab('calendar')}
          render={item => <><span className="font-bold text-slate-700">{item.title}</span><span className="text-xs text-slate-400">{fmtDate(item.start_at)}</span></>}
        />
      </div>

      <div className="space-y-4">
        <OverviewList
          title="Trabajo pendiente"
          Icon={CheckCircleIcon}
          empty="No hay tareas pendientes."
          items={pendingTasks}
          onOpen={() => onTab('tasks')}
          render={item => <><span className="truncate font-bold text-slate-700">{item.title}</span><span className="text-xs text-slate-400">{fmtDate(item.due_date)}</span></>}
        />
        <aside className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-4 text-sky-900">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-sky-600">Próxima fase</p>
          <p className="mt-2 text-sm font-extrabold">Portal de incidencias conectado</p>
          <p className="mt-1 text-xs leading-relaxed text-sky-700">Se incorporará después como flujo enlazado a este proyecto y a su farmacia.</p>
        </aside>
      </div>
    </div>
  )
}

function OverviewList({ title, Icon, empty, items, onOpen, render }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onOpen} className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50">
        <span className="flex items-center gap-2 font-display text-sm font-extrabold text-slate-900"><Icon className="h-4 w-4 text-teal-700" />{title}</span>
        <span className="text-[11px] font-bold text-teal-700">Ver todo</span>
      </button>
      <div className="divide-y divide-slate-100">
        {items.length ? items.map(item => <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">{render(item)}</div>) : <p className="px-4 py-5 text-xs text-slate-400">{empty}</p>}
      </div>
    </section>
  )
}

function TasksTab({ tasks, onCreate, onUpdate, onDelete }) {
  const visibleTasks = tasks.filter(task => !task.title?.startsWith('[Hito] '))
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_TASK)
  const [saving, setSaving] = useState(false)

  function startCreate() {
    setEditing(null)
    setForm(EMPTY_TASK)
    setOpen(true)
  }

  function startEdit(task) {
    setEditing(task.id)
    setForm({ ...EMPTY_TASK, ...task })
    setOpen(true)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    try {
      if (editing) await onUpdate(editing, form)
      else await onCreate(form)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Tareas del proyecto" text={`${visibleTasks.filter(task => task.status === 'completed').length} de ${visibleTasks.length} completadas`}>
        <button type="button" className="btn-primary" onClick={startCreate}><PlusIcon className="h-4 w-4" /> Nueva tarea</button>
      </SectionHeader>
      {open && (
        <form onSubmit={save} className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_150px_auto]">
            <div><label className="label">Tarea *</label><input className="input" value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} required /></div>
            <div><label className="label">Estado</label><select className="input" value={form.status} onChange={event => setForm(prev => ({ ...prev, status: event.target.value }))}>{TASK_STATUSES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
            <div><label className="label">Prioridad</label><select className="input" value={form.priority} onChange={event => setForm(prev => ({ ...prev, priority: event.target.value }))}>{PRIORITIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
            <div><label className="label">Vencimiento</label><input type="date" className="input" value={form.due_date || ''} onChange={event => setForm(prev => ({ ...prev, due_date: event.target.value }))} /></div>
            <div className="flex items-end gap-1"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? '...' : 'Guardar'}</button></div>
          </div>
          <div className="mt-3"><label className="label">Descripción</label><textarea className="input" rows={2} value={form.description || ''} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} /></div>
        </form>
      )}
      {!visibleTasks.length ? <EmptyState Icon={CheckCircleIcon} title="No hay tareas todavía" text="Añade el siguiente paso para convertir el proyecto en trabajo ejecutable." /> : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {visibleTasks.map(task => {
              const taskStatus = TASK_STATUSES.find(item => item.id === task.status) || TASK_STATUSES[0]
              const taskPriority = getPriority(task.priority)
              return (
                <div key={task.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
                  <input type="checkbox" className="mt-1 rounded border-slate-300 text-teal-700" checked={task.status === 'completed'} onChange={() => onUpdate(task.id, { ...task, status: task.status === 'completed' ? 'pending' : 'completed' })} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                    {task.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{task.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className={taskStatus.badge}>{taskStatus.label}</span>
                      <span className="inline-flex items-center gap-1"><span className={`h-1.5 w-1.5 rounded-full ${taskPriority.dot}`} />{taskPriority.label}</span>
                      <span>{fmtDate(task.due_date)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => startEdit(task)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-700"><PencilSquareIcon className="h-4 w-4" /></button>
                    <button type="button" aria-label={`Eliminar tarea ${task.title}`} onClick={() => window.confirm('¿Eliminar esta tarea?') && onDelete(task.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarTab({ milestones, tasks, onCreate }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_MILESTONE)
  const [saving, setSaving] = useState(false)
  const datedTasks = tasks.filter(task => task.due_date && !task.title?.startsWith('[Hito] '))

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await onCreate(form)
      setForm(EMPTY_MILESTONE)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <SectionHeader title="Agenda del proyecto" text="Hitos, entregas, sesiones y tareas con fecha">
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}><PlusIcon className="h-4 w-4" /> Nuevo hito</button>
        </SectionHeader>
        {!milestones.length && !datedTasks.length ? <EmptyState Icon={CalendarDaysIcon} title="Agenda vacía" text="Planifica el primer hito para que el equipo comparta una referencia temporal." /> : (
          <div className="space-y-3">
            {[...milestones.map(item => ({ ...item, kind: 'milestone' })), ...datedTasks.map(item => ({ ...item, kind: 'task', start_at: item.due_date }))].sort((a, b) => String(a.start_at).localeCompare(String(b.start_at))).map(item => (
              <div key={`${item.kind}:${item.id}`} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.kind === 'milestone' ? 'bg-teal-50 text-teal-700' : 'bg-sky-50 text-sky-700'}`}>
                  {item.kind === 'milestone' ? <FlagIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{fmtDate(item.start_at)}</p>
                  {item.notes && <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-display text-sm font-extrabold text-slate-900">Cómo usar la agenda</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">Registra reuniones, entregas, formaciones e instalaciones. Las tareas con vencimiento se incorporan automáticamente para que el calendario sea una única fuente de verdad.</p>
      </aside>

      {open && (
        <Drawer title="Nuevo hito" subtitle="Calendario" onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-4 p-5">
            <div><label className="label">Título *</label><input className="input" value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Tipo</label><select className="input" value={form.milestone_type} onChange={event => setForm(prev => ({ ...prev, milestone_type: event.target.value }))}>{MILESTONE_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
              <div><label className="label">Fecha</label><input type="date" className="input" value={form.start_at} onChange={event => setForm(prev => ({ ...prev, start_at: event.target.value }))} /></div>
            </div>
            <div><label className="label">Notas</label><textarea className="input" rows={3} value={form.notes} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} /></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear hito'}</button></div>
          </form>
        </Drawer>
      )}
    </div>
  )
}

function MessagesTab({ messages, onCreate }) {
  const [audience, setAudience] = useState('all')
  const [form, setForm] = useState(EMPTY_MESSAGE)
  const [saving, setSaving] = useState(false)
  const filtered = audience === 'all' ? messages : messages.filter(message => message.audience === audience)

  async function save(event) {
    event.preventDefault()
    if (!form.message.trim()) return
    setSaving(true)
    try {
      await onCreate(form)
      setForm(prev => ({ ...EMPTY_MESSAGE, audience: prev.audience }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-display text-sm font-extrabold text-slate-900">Registrar comunicación</h2>
        <p className="mt-1 text-xs text-slate-400">Separa notas internas de contactos visibles para el cliente.</p>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setForm(prev => ({ ...prev, audience: 'internal' }))} className={`rounded-lg border px-3 py-2 text-xs font-bold ${form.audience === 'internal' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500'}`}>Interna</button>
            <button type="button" onClick={() => setForm(prev => ({ ...prev, audience: 'external' }))} className={`rounded-lg border px-3 py-2 text-xs font-bold ${form.audience === 'external' ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500'}`}>Externa</button>
          </div>
          <div><label className="label">Canal</label><select className="input" value={form.channel} onChange={event => setForm(prev => ({ ...prev, channel: event.target.value }))}>{MESSAGE_CHANNELS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
          <div><label className="label">Asunto</label><input className="input" value={form.subject} onChange={event => setForm(prev => ({ ...prev, subject: event.target.value }))} placeholder="Opcional" /></div>
          <div><label className="label">Mensaje *</label><textarea rows={5} className="input" value={form.message} onChange={event => setForm(prev => ({ ...prev, message: event.target.value }))} required /></div>
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Registrando...' : 'Registrar comunicación'}</button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-extrabold text-slate-900">Historial de comunicaciones</h2>
          <select className="input w-40" value={audience} onChange={event => setAudience(event.target.value)}>
            <option value="all">Todas</option><option value="internal">Internas</option><option value="external">Externas</option>
          </select>
        </div>
        {!filtered.length ? <EmptyState Icon={ChatBubbleLeftRightIcon} title="Sin comunicaciones" text="Registra la primera nota o contacto con cliente." /> : filtered.map(message => (
          <article key={message.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-teal-700" />
                <span className="text-sm font-extrabold text-slate-800">{message.author_name || 'Equipo Viteka'}</span>
                <span className={message.audience === 'external' ? 'badge-blue' : 'badge-gray'}>{message.audience === 'external' ? 'Externa' : 'Interna'}</span>
              </div>
              <span className="text-[11px] text-slate-400">{fmtDateTime(message.created_at)}</span>
            </div>
            {message.subject && <p className="mt-3 text-sm font-bold text-slate-700">{message.subject}</p>}
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{message.message}</p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{MESSAGE_CHANNELS.find(item => item.id === message.channel)?.label || message.channel}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ title, text, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-display text-lg font-extrabold text-slate-900">{title}</h2><p className="mt-0.5 text-xs text-slate-400">{text}</p></div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return <div><dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</dt><dd className="mt-1 font-bold text-slate-700">{value}</dd></div>
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const detail = useProjectDetail(id)
  const { updateProject } = useProjects()
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(false)

  const {
    project, tasks, milestones, messages, loading, error, refetch,
    createTask, updateTask, deleteTask,
    createMilestone, createMessage,
  } = detail

  const counts = useMemo(() => {
    const actualTasks = tasks.filter(task => !task.title?.startsWith('[Hito] '))
    return {
      completed: actualTasks.filter(task => task.status === 'completed').length,
      tasks: actualTasks.length,
      milestones: milestones.filter(item => item.status !== 'completed').length,
    }
  }, [milestones, tasks])

  if (loading) return <div className="flex justify-center py-32"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" /></div>
  if (error || !project) return <div className="p-6"><p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || 'Proyecto no encontrado.'}</p></div>

  const division = getDivision(project)
  const stage = getStage(project)
  const status = getStatus(project.status)
  const overdue = isOverdue(project)

  async function saveProject(payload) {
    await updateProject(project.id, payload)
    await refetch()
    toast('Proyecto actualizado.', 'success')
  }

  async function perform(action, message) {
    try {
      await action()
      if (message) toast(message, 'success', 1800)
    } catch (actionError) {
      toast(actionError.message, 'error')
    }
  }

  return (
    <div className="space-y-5 px-3 py-4 sm:px-5 lg:px-6">
      <header className="space-y-4">
        <button type="button" onClick={() => navigate('/proyectos')} className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900">
          <ArrowLeftIcon className="h-4 w-4" /> Volver a proyectos
        </button>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-teal-800">{division.label}</span>
              <span className={status.badge}>{status.label}</span>
              {overdue && <span className="badge-red">Vencido</span>}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-slate-950 sm:text-3xl">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {project.pharmacy ? <Link to={`/farmacias/${project.pharmacy_id}`} className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline"><BuildingStorefrontIcon className="h-4 w-4" />{project.pharmacy.pharmacy_name}</Link> : <span>Sin farmacia asignada</span>}
              <span className="inline-flex items-center gap-1"><FlagIcon className="h-4 w-4" />{stage.label}</span>
              <span className="inline-flex items-center gap-1"><ClockIcon className="h-4 w-4" />Objetivo: {fmtDate(project.expected_close_date)}</span>
            </div>
          </div>
          <button type="button" className="btn-primary self-start" onClick={() => setEditing(true)}><PencilSquareIcon className="h-4 w-4" /> Editar proyecto</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <ProjectStat label="Tareas" value={`${counts.completed}/${counts.tasks}`} detail="completadas" Icon={CheckCircleIcon} />
        <ProjectStat label="Próximos hitos" value={counts.milestones} detail="planificados" Icon={CalendarDaysIcon} />
        <ProjectStat label="Comunicaciones" value={messages.length} detail="registradas" Icon={ChatBubbleLeftRightIcon} />
        <ProjectStat label={division.id === 'commercial' ? 'Importe estimado' : 'Fecha objetivo'} value={division.id === 'commercial' ? fmtCurrency(project.amount) : fmtDate(project.expected_close_date)} detail={division.id === 'commercial' ? 'pipeline comercial' : stage.label} Icon={division.id === 'commercial' ? DocumentCheckIcon : ClockIcon} alert={overdue} />
      </div>

      <div className="-mx-3 overflow-x-auto border-b border-slate-200 px-3 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
        <nav className="flex min-w-max gap-1">
          {TABS.map(item => {
            const Icon = item.Icon
            const count = item.id === 'tasks' ? counts.tasks : item.id === 'calendar' ? milestones.length : item.id === 'messages' ? messages.length : null
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition ${tab === item.id ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                <Icon className="h-4 w-4" />{item.label}{count !== null && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{count}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {tab === 'overview' && <OverviewTab project={project} tasks={tasks} milestones={milestones} onTab={setTab} />}
      {tab === 'tasks' && <TasksTab tasks={tasks} onCreate={payload => perform(() => createTask(payload), 'Tarea creada.')} onUpdate={(taskId, payload) => perform(() => updateTask(taskId, payload), 'Tarea actualizada.')} onDelete={taskId => perform(() => deleteTask(taskId), 'Tarea eliminada.')} />}
      {tab === 'calendar' && <CalendarTab milestones={milestones} tasks={tasks} onCreate={payload => perform(() => createMilestone(payload), 'Hito creado.')} />}
      {tab === 'messages' && <MessagesTab messages={messages} onCreate={payload => perform(() => createMessage(payload), 'Comunicación registrada.')} />}
      {editing && <ProjectEditDrawer project={project} onClose={() => setEditing(false)} onSave={saveProject} />}
    </div>
  )
}
