import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createActivityLog } from '../lib/activityLogs'
import { createNotification } from '../lib/notifications'

const TASK_STATUSES = [
  { value: 'pending',        label: 'Pendiente',  pill: 'bg-gray-100 text-gray-600 ring-gray-200',         btn: 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100' },
  { value: 'in_progress',   label: 'En curso',   pill: 'bg-yellow-50 text-yellow-700 ring-yellow-200',     btn: 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  { value: 'blocked',       label: 'Bloqueada',  pill: 'bg-red-50 text-red-600 ring-red-200',              btn: 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' },
  { value: 'completed',     label: 'Completada', pill: 'bg-teal-50 text-teal-700 ring-teal-200',           btn: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100' },
  { value: 'not_applicable',label: 'No aplica',  pill: 'bg-gray-100 text-gray-400 ring-gray-200',          btn: 'border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100' },
]
function getStatus(v) { return TASK_STATUSES.find(s => s.value === v) || TASK_STATUSES[0] }

function IconArrow()  { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> }
function IconReport() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function IconCheck()  { return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IconUpload() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> }
function IconTrash()  { return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> }
function IconChevron({ open }) {
  return <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
}

export default function ChecklistExecutionPage({ checklistId, currentUserId, onBack, onOpenReport }) {
  const [checklist, setChecklist]         = useState(null)
  const [sections,  setSections]          = useState([])
  const [tasks,     setTasks]             = useState([])
  const [evidence,  setEvidence]          = useState([])
  const [loading,   setLoading]           = useState(true)
  const [saving,    setSaving]            = useState(false)
  const [collapsed, setCollapsed]         = useState({})
  const [uploading, setUploading]         = useState(null)

  useEffect(() => { if (checklistId) load() }, [checklistId])

  async function load() {
    setLoading(true)
    const { data: cl, error: e1 } = await supabase.from('checklists').select('*').eq('id', checklistId).single()
    if (e1) { alert(e1.message); setLoading(false); return }
    setChecklist(cl)
    const { data: secs } = await supabase.from('checklist_sections').select('*').eq('checklist_id', checklistId).order('position')
    setSections(secs || [])
    const ids = (secs || []).map(s => s.id)
    if (ids.length === 0) { setTasks([]); setEvidence([]); setLoading(false); return }
    const { data: tks } = await supabase.from('checklist_tasks').select('*').in('section_id', ids).order('position')
    setTasks(tks || [])
    const tIds = (tks || []).map(t => t.id)
    if (tIds.length > 0) {
      const { data: evs } = await supabase.from('task_evidence').select('*').in('task_id', tIds)
      setEvidence(evs || [])
    }
    setLoading(false)
  }

  function toggleSection(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function updateTaskStatus(taskId, status) {
    const prev = tasks.find(t => t.id === taskId)
    const { data, error } = await supabase.from('checklist_tasks').update({ status }).eq('id', taskId).select().single()
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: currentUserId, entityType: 'task', entityId: taskId, action: 'status_update',
      oldValue: { status: prev?.status, title: prev?.title }, newValue: { status, title: data.title } })
    await createNotification({ userId: currentUserId, title: 'Estado actualizado',
      message: `"${prev?.title}" → ${status}`, type: 'info', entityType: 'task', entityId: taskId })
    setTasks(p => p.map(t => t.id === taskId ? { ...t, status } : t))
  }

  async function updateTaskComment(taskId, comments) {
    setTasks(p => p.map(t => t.id === taskId ? { ...t, comments } : t))
    const { data, error } = await supabase.from('checklist_tasks').update({ comments }).eq('id', taskId).select().single()
    if (error) { alert(error.message); return }
    const prev = tasks.find(t => t.id === taskId)
    await createActivityLog({ userId: currentUserId, entityType: 'task', entityId: taskId, action: 'comment_update',
      oldValue: { comments: prev?.comments || '' }, newValue: { comments: data.comments || '' } })
  }

  async function uploadEvidence(taskId, file) {
    if (!file) return
    setUploading(taskId)
    const ext      = file.name.split('.').pop()
    const filePath = `checklists/${checklistId}/${taskId}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('task-evidence').upload(filePath, file)
    if (upErr) { alert(upErr.message); setUploading(null); return }
    const { data: urlData } = supabase.storage.from('task-evidence').getPublicUrl(filePath)
    const { data, error } = await supabase.from('task_evidence').insert({
      task_id: taskId, file_name: file.name, file_path: filePath,
      file_url: urlData.publicUrl, file_type: file.type,
    }).select().single()
    setUploading(null)
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: currentUserId, entityType: 'evidence', entityId: data.id, action: 'upload',
      newValue: { task_id: taskId, file_name: file.name } })
    setEvidence(p => [...p, data])
  }

  async function deleteEvidence(evidenceId, filePath) {
    if (!window.confirm('¿Eliminar evidencia?')) return
    const prev = evidence.find(e => e.id === evidenceId)
    if (filePath) await supabase.storage.from('task-evidence').remove([filePath])
    const { error } = await supabase.from('task_evidence').delete().eq('id', evidenceId)
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: currentUserId, entityType: 'evidence', entityId: evidenceId, action: 'delete', oldValue: prev })
    setEvidence(p => p.filter(e => e.id !== evidenceId))
  }

  async function finalizeChecklist() {
    const unresolved = tasks.filter(t => ['pending', 'in_progress'].includes(t.status))
    if (unresolved.length > 0) { alert(`Hay ${unresolved.length} tarea(s) sin resolver.`); return }
    const blockedNoComment = tasks.filter(t => t.status === 'blocked' && !t.comments?.trim())
    if (blockedNoComment.length > 0) { alert(`${blockedNoComment.length} tarea(s) bloqueada(s) sin comentario técnico.`); return }
    setSaving(true)
    const prev = checklist
    const { data, error } = await supabase.from('checklists')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', checklistId).select().single()
    setSaving(false)
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: currentUserId, entityType: 'checklist', entityId: checklistId, action: 'complete', oldValue: prev, newValue: data })
    setChecklist(data)
  }

  const progress = useMemo(() => {
    if (!tasks.length) return 0
    const done = tasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length
    return Math.round((done / tasks.length) * 100)
  }, [tasks])

  const taskCounts = useMemo(() => ({
    total:     tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked:   tasks.filter(t => t.status === 'blocked').length,
    pending:   tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length,
  }), [tasks])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
    </div>
  )
  if (!checklist) return (
    <div className="card p-8 text-gray-400">Checklist no encontrado.</div>
  )

  const isCompleted = checklist.status === 'completed'

  return (
    <div className="page-container space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={onBack}
            className="mb-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
            <IconArrow /> Volver
          </button>
          <h1 className="page-title leading-snug">{checklist.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {isCompleted
              ? <span className="badge-blue">Finalizado</span>
              : <span className="badge-green">En curso</span>
            }
            <span className="text-xs text-gray-400">{taskCounts.total} tareas</span>
          </div>
        </div>
        <div className="hidden sm:flex gap-2 shrink-0">
          <button onClick={onOpenReport} className="btn-secondary flex items-center gap-2 text-sm">
            <IconReport /> Informe
          </button>
          {!isCompleted && (
            <button onClick={finalizeChecklist} disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
              {saving ? 'Finalizando...' : <><IconCheck /> Finalizar</>}
            </button>
          )}
        </div>
      </div>

      {/* Progress card */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-600">Progreso global</span>
          <span className={`font-semibold ${
            taskCounts.blocked > 0 ? 'text-red-600' : progress === 100 ? 'text-teal-600' : 'text-teal-700'
          }`}>{progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              taskCounts.blocked > 0 ? 'bg-red-400' : 'bg-teal-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { l: 'Completadas', v: taskCounts.completed, cls: 'bg-teal-50 text-teal-700' },
            { l: 'Pendientes',  v: taskCounts.pending,   cls: 'bg-yellow-50 text-yellow-700' },
            { l: 'Bloqueadas',  v: taskCounts.blocked,   cls: 'bg-red-50 text-red-600' },
          ].map(s => (
            <div key={s.l} className={`rounded-xl py-2 px-1 ${s.cls}`}>
              <p className="text-lg font-bold leading-none">{s.v}</p>
              <p className="mt-0.5 text-[10px] font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile actions */}
      <div className="flex gap-2 sm:hidden">
        <button onClick={onOpenReport} className="btn-secondary flex flex-1 items-center justify-center gap-2 text-sm">
          <IconReport /> Informe
        </button>
        {!isCompleted && (
          <button onClick={finalizeChecklist} disabled={saving}
            className="btn-primary flex flex-1 items-center justify-center gap-2 text-sm disabled:opacity-60">
            {saving ? 'Finalizando...' : <><IconCheck /> Finalizar</>}
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map(section => {
          const sectionTasks = tasks.filter(t => t.section_id === section.id)
          const secDone      = sectionTasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length
          const secProgress  = sectionTasks.length > 0 ? Math.round((secDone / sectionTasks.length) * 100) : 0
          const secBlocked   = sectionTasks.filter(t => t.status === 'blocked').length
          const isOpen       = !collapsed[section.id]

          return (
            <div key={section.id} className={`card overflow-hidden ${
              secBlocked > 0 ? 'border-red-200' : ''
            }`}>
              {/* Section header — clickable to collapse */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mini circular progress */}
                  <div className="relative h-9 w-9 shrink-0">
                    <svg viewBox="0 0 36 36" className="-rotate-90 w-full h-full">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                      <circle cx="18" cy="18" r="14" fill="none"
                        stroke={secBlocked > 0 ? '#f87171' : '#0d9488'}
                        strokeWidth="4"
                        strokeDasharray={`${secProgress * 0.879} 87.9`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-600">
                      {secProgress}%
                    </span>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate">{section.title}</p>
                    <p className="text-xs text-gray-400">{secDone}/{sectionTasks.length} completadas
                      {secBlocked > 0 && <span className="ml-1.5 text-red-500">· {secBlocked} bloqueada{secBlocked > 1 ? 's' : ''}</span>}
                    </p>
                  </div>
                </div>
                <IconChevron open={isOpen} />
              </button>

              {/* Section tasks */}
              {isOpen && (
                <div className="divide-y divide-gray-50 border-t border-gray-100">
                  {sectionTasks.map(task => {
                    const st  = getStatus(task.status)
                    const evs = evidence.filter(e => e.task_id === task.id)
                    const isUploading = uploading === task.id

                    return (
                      <div key={task.id} className="p-4 space-y-3">
                        {/* Task title */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-sm font-medium leading-snug ${
                              task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}>{task.title}</p>
                            {task.required && <span className="badge-red text-[10px]">Requerida</span>}
                          </div>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{task.description}</p>
                          )}
                        </div>

                        {/* Status buttons */}
                        <div>
                          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">Estado</p>
                          <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                            {TASK_STATUSES.map(s => (
                              <button
                                key={s.value}
                                onClick={() => updateTaskStatus(task.id, s.value)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-medium transition ${
                                  task.status === s.value
                                    ? `${s.btn} ring-2 ring-offset-1 ring-current`
                                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {task.status === s.value && <IconCheck />}
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <textarea
                          value={task.comments || ''}
                          onChange={e => updateTaskComment(task.id, e.target.value)}
                          rows={task.status === 'blocked' ? 3 : 2}
                          placeholder={task.status === 'blocked' ? 'Motivo del bloqueo (obligatorio)...' : 'Comentarios técnicos...'}
                          className={`input resize-none ${
                            task.status === 'blocked'
                              ? 'border-red-200 bg-red-50 focus:border-red-400 focus:ring-red-100'
                              : ''
                          }`}
                        />

                        {/* Evidence upload */}
                        <div className="space-y-2">
                          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                            isUploading
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-wait'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}>
                            {isUploading
                              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                              : <IconUpload />
                            }
                            {isUploading ? 'Subiendo...' : 'Añadir evidencia'}
                            <input type="file" className="hidden" accept="image/*,.pdf"
                              disabled={isUploading}
                              onChange={e => uploadEvidence(task.id, e.target.files[0])} />
                          </label>

                          {evs.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {evs.map(ev => (
                                <div key={ev.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                  {ev.file_type?.startsWith('image/') ? (
                                    <a href={ev.file_url} target="_blank" rel="noreferrer">
                                      <img src={ev.file_url} alt={ev.file_name} className="h-20 w-20 object-cover" />
                                    </a>
                                  ) : (
                                    <a href={ev.file_url} target="_blank" rel="noreferrer"
                                      className="flex h-20 w-20 items-center justify-center text-xs text-gray-500 hover:bg-gray-50">
                                      PDF
                                    </a>
                                  )}
                                  <div className="border-t border-gray-100 p-1.5">
                                    <button onClick={() => deleteEvidence(ev.id, ev.file_path)}
                                      className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[10px] text-red-400 hover:bg-red-50 transition">
                                      <IconTrash /> Eliminar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
