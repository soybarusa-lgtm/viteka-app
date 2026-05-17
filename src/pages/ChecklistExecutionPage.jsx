import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createActivityLog } from '../lib/activityLogs'
import { createNotification } from '../lib/notifications'

// ── Icons ─────────────────────────────────────────────────────────────────
function IconArrow()  { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>) }
function IconReport() { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>) }
function IconCheck()  { return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>) }
function IconUpload() { return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>) }
function IconTrash()  { return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>) }

// ── Config ────────────────────────────────────────────────────────────────
const TASK_STATUSES = [
  { value: 'pending',        label: 'Pendiente',  pill: 'bg-slate-100 text-slate-600 ring-slate-200' },
  { value: 'in_progress',   label: 'En curso',    pill: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { value: 'blocked',       label: 'Bloqueada',   pill: 'bg-red-50 text-red-600 ring-red-200' },
  { value: 'completed',     label: 'Completada',  pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'not_applicable',label: 'No aplica',   pill: 'bg-gray-100 text-gray-500 ring-gray-200' },
]
function getStatus(v) { return TASK_STATUSES.find(s => s.value === v) || TASK_STATUSES[0] }

// ── Main ──────────────────────────────────────────────────────────────────
export default function ChecklistExecutionPage({ checklistId, currentUserId, onBack, onOpenReport }) {
  const [checklist, setChecklist] = useState(null)
  const [sections,  setSections]  = useState([])
  const [tasks,     setTasks]     = useState([])
  const [evidence,  setEvidence]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)

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
    const ext = file.name.split('.').pop()
    const filePath = `checklists/${checklistId}/${taskId}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('task-evidence').upload(filePath, file)
    if (upErr) { alert(upErr.message); return }
    const { data: urlData } = supabase.storage.from('task-evidence').getPublicUrl(filePath)
    const { data, error } = await supabase.from('task_evidence').insert({
      task_id: taskId, file_name: file.name, file_path: filePath, file_url: urlData.publicUrl, file_type: file.type,
    }).select().single()
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
    if (unresolved.length > 0) { alert(`Hay ${unresolved.length} tareas pendientes o en curso.`); return }
    const blockedNoComment = tasks.filter(t => t.status === 'blocked' && !t.comments?.trim())
    if (blockedNoComment.length > 0) { alert(`${blockedNoComment.length} tarea(s) bloqueada(s) sin comentario técnico.`); return }
    setSaving(true)
    const prev = checklist
    const { data, error } = await supabase.from('checklists').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', checklistId).select().single()
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
    pending:   tasks.filter(t => ['pending','in_progress'].includes(t.status)).length,
  }), [tasks])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" />
    </div>
  )
  if (!checklist) return (
    <div className="rounded-2xl border border-[#E8EDF2] bg-white p-8 text-[#94A3B8]">Checklist no encontrado.</div>
  )

  const isCompleted = checklist.status === 'completed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button type="button" onClick={onBack}
            className="mb-3 flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#0F172A] transition">
            <IconArrow /> Volver
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">{checklist.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
              isCompleted ? 'bg-blue-50 text-blue-700 ring-blue-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            }`}>{isCompleted ? 'Finalizado' : 'En curso'}</span>
            <span className="text-[12px] text-[#94A3B8]">{taskCounts.total} tareas</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={onOpenReport}
            className="flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] bg-white px-4 py-2.5 text-[13px] font-medium text-[#334155] shadow-sm hover:bg-[#F8FAFC]">
            <IconReport /> Ver informe
          </button>
          {!isCompleted && (
            <button type="button" onClick={finalizeChecklist} disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-[#005643] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#00442f] disabled:opacity-60">
              {saving ? 'Finalizando...' : <><IconCheck /> Finalizar checklist</>}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5">
        <div className="mb-2 flex items-center justify-between text-[12px]">
          <span className="text-[#64748B] font-medium">Progreso general</span>
          <span className={`font-semibold ${
            taskCounts.blocked > 0 ? 'text-red-600' : progress === 100 ? 'text-emerald-600' : 'text-[#005643]'
          }`}>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
          <div className={`h-full rounded-full transition-all ${
            taskCounts.blocked > 0 ? 'bg-red-400' : 'bg-[#005643]'
          }`} style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
          {[
            { l: 'Completadas', v: taskCounts.completed, c: 'text-emerald-600' },
            { l: 'Pendientes',  v: taskCounts.pending,   c: 'text-amber-600' },
            { l: 'Bloqueadas',  v: taskCounts.blocked,   c: 'text-red-600' },
          ].map(s => (
            <span key={s.l} className={`font-medium ${s.c}`}>{s.v} {s.l}</span>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(section => {
          const sectionTasks = tasks.filter(t => t.section_id === section.id)
          const secDone = sectionTasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length
          return (
            <div key={section.id} className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
              {/* Section header */}
              <div className="flex items-center justify-between border-b border-[#F1F5F9] px-6 py-4">
                <div>
                  <p className="text-[14px] font-semibold text-[#0F172A]">{section.title}</p>
                  <p className="text-[11px] text-[#94A3B8]">{secDone}/{sectionTasks.length} tareas</p>
                </div>
                <div className="h-8 w-8">
                  <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#F1F5F9" strokeWidth="4"/>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#005643" strokeWidth="4"
                      strokeDasharray={`${sectionTasks.length > 0 ? (secDone/sectionTasks.length)*94.2 : 0} 94.2`}
                      strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Tasks */}
              <div className="divide-y divide-[#F8FAFC]">
                {sectionTasks.map(task => {
                  const st  = getStatus(task.status)
                  const evs = evidence.filter(e => e.task_id === task.id)
                  return (
                    <div key={task.id} className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        {/* Left */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="text-[14px] font-medium text-[#0F172A]">{task.title}</p>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${st.pill}`}>{st.label}</span>
                            {task.required && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500 ring-1 ring-red-200">Requerida</span>}
                          </div>
                          {task.description && <p className="mb-3 text-[13px] text-[#94A3B8]">{task.description}</p>}

                          <textarea
                            value={task.comments || ''}
                            onChange={e => updateTaskComment(task.id, e.target.value)}
                            rows={task.status === 'blocked' ? 3 : 2}
                            placeholder={task.status === 'blocked' ? 'Motivo del bloqueo (obligatorio)...' : 'Comentarios técnicos...'}
                            className={`w-full resize-none rounded-xl border px-4 py-3 text-[13px] outline-none focus:ring-1 ${
                              task.status === 'blocked'
                                ? 'border-red-200 bg-red-50 focus:border-red-400 focus:ring-red-200'
                                : 'border-[#E8EDF2] bg-[#F8FAFC] focus:border-[#005643] focus:ring-[#005643]/20'
                            }`}
                          />

                          {/* Evidence */}
                          <div className="mt-3">
                            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E8EDF2] bg-white px-3 py-1.5 text-[12px] font-medium text-[#64748B] hover:bg-[#F8FAFC]">
                              <IconUpload /> Subir evidencia
                              <input type="file" className="hidden" accept="image/*,.pdf"
                                onChange={e => uploadEvidence(task.id, e.target.files[0])} />
                            </label>

                            {evs.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {evs.map(ev => (
                                  <div key={ev.id} className="overflow-hidden rounded-xl border border-[#E8EDF2] bg-white">
                                    {ev.file_type?.startsWith('image/') ? (
                                      <a href={ev.file_url} target="_blank" rel="noreferrer">
                                        <img src={ev.file_url} className="h-20 w-20 object-cover" />
                                      </a>
                                    ) : (
                                      <a href={ev.file_url} target="_blank" rel="noreferrer"
                                        className="flex h-20 w-20 items-center justify-center text-[11px] text-[#64748B] hover:bg-[#F8FAFC]">
                                        PDF
                                      </a>
                                    )}
                                    <div className="border-t border-[#F1F5F9] p-1.5">
                                      <button type="button" onClick={() => deleteEvidence(ev.id, ev.file_path)}
                                        className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[10px] text-red-500 hover:bg-red-50">
                                        <IconTrash /> Eliminar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status selector */}
                        <div className="shrink-0 lg:w-52">
                          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Estado</p>
                          <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}
                            className="w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#005643]">
                            {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
