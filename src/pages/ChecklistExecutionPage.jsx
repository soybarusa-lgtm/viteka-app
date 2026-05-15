import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createActivityLog } from '../lib/activityLogs'
import { createNotification } from '../lib/notifications'

const TASK_STATUSES = [
  {
    value: 'pending',
    label: 'Pendiente',
    color: 'bg-[#FEF3C7] text-[#92400E]',
  },
  {
    value: 'in_progress',
    label: 'En curso',
    color: 'bg-[#DBEAFE] text-[#1D4ED8]',
  },
  {
    value: 'blocked',
    label: 'Bloqueada',
    color: 'bg-[#FEE2E2] text-[#B91C1C]',
  },
  {
    value: 'completed',
    label: 'Completada',
    color: 'bg-[#DCFCE7] text-[#166534]',
  },
  {
    value: 'not_applicable',
    label: 'No aplica',
    color: 'bg-[#F1F5F9] text-[#475569]',
  },
]

function getStatus(statusValue) {
  return TASK_STATUSES.find(status => status.value === statusValue) || TASK_STATUSES[0]
}

export default function ChecklistExecutionPage({
  checklistId,
  currentUserId,
  onBack,
  onOpenReport,
}) {
  const [checklist, setChecklist] = useState(null)
  const [sections, setSections] = useState([])
  const [tasks, setTasks] = useState([])
  const [evidence, setEvidence] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (checklistId) {
      loadChecklist()
    }
  }, [checklistId])

  async function loadChecklist() {
    setLoading(true)

    const { data: checklistData, error: checklistError } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', checklistId)
      .single()

    if (checklistError) {
      alert(checklistError.message)
      setLoading(false)
      return
    }

    setChecklist(checklistData)

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('checklist_sections')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('position', { ascending: true })

    if (sectionsError) {
      alert(sectionsError.message)
      setLoading(false)
      return
    }

    setSections(sectionsData || [])

    const sectionIds = (sectionsData || []).map(section => section.id)

    if (sectionIds.length === 0) {
      setTasks([])
      setEvidence([])
      setLoading(false)
      return
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from('checklist_tasks')
      .select('*')
      .in('section_id', sectionIds)
      .order('position', { ascending: true })

    if (tasksError) {
      alert(tasksError.message)
      setLoading(false)
      return
    }

    setTasks(tasksData || [])

    const taskIds = (tasksData || []).map(task => task.id)

    if (taskIds.length === 0) {
      setEvidence([])
      setLoading(false)
      return
    }

    const { data: evidenceData, error: evidenceError } = await supabase
      .from('task_evidence')
      .select('*')
      .in('task_id', taskIds)

    if (evidenceError) {
      alert(evidenceError.message)
      setLoading(false)
      return
    }

    setEvidence(evidenceData || [])
    setLoading(false)
  }

  async function updateTaskStatus(taskId, status) {
  const previous = tasks.find(task => task.id === taskId)

  const { data, error } = await supabase
    .from('checklist_tasks')
    .update({ status })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    alert(error.message)
    return
  }

  await createActivityLog({
    userId: currentUserId,
    entityType: 'task',
    entityId: taskId,
    action: 'status_update',
    oldValue: {
      status: previous?.status,
      title: previous?.title,
      checklist_id: checklistId,
    },
    newValue: {
      status: data.status,
      title: data.title,
      checklist_id: checklistId,
    },
  })

  await createNotification({
    userId: currentUserId,
    title: 'Estado de tarea actualizado',
    message: `La tarea "${previous?.title || data.title}" cambió de "${previous?.status}" a "${status}".`,
    type: 'info',
    entityType: 'task',
    entityId: taskId,
  })

  setTasks(prev =>
    prev.map(task =>
      task.id === taskId
        ? {
            ...task,
            status,
          }
        : task
    )
  )
}

  async function updateTaskComment(taskId, comments) {
    const previous = tasks.find(task => task.id === taskId)

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              comments,
            }
          : task
      )
    )

    const { data, error } = await supabase
      .from('checklist_tasks')
      .update({ comments })
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: currentUserId,
      entityType: 'task',
      entityId: taskId,
      action: 'comment_update',
      oldValue: {
        comments: previous?.comments || '',
        title: previous?.title,
        checklist_id: checklistId,
      },
      newValue: {
        comments: data.comments || '',
        title: data.title,
        checklist_id: checklistId,
      },
    })
  }

  async function uploadEvidence(taskId, file) {
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${taskId}-${Date.now()}.${fileExt}`
    const filePath = `checklists/${checklistId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('task-evidence')
      .upload(filePath, file)

    if (uploadError) {
      alert(uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('task-evidence')
      .getPublicUrl(filePath)

    const { data, error: insertError } = await supabase
      .from('task_evidence')
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_path: filePath,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
      })
      .select()
      .single()

    if (insertError) {
      alert(insertError.message)
      return
    }

    await createActivityLog({
      userId: currentUserId,
      entityType: 'evidence',
      entityId: data.id,
      action: 'upload',
      newValue: {
        task_id: taskId,
        checklist_id: checklistId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
      },
    })

    await loadChecklist()
  }

  async function deleteEvidence(evidenceId, filePath) {
    const confirmed = window.confirm('¿Eliminar evidencia?')
    if (!confirmed) return

    const previous = evidence.find(item => item.id === evidenceId)

    if (filePath) {
      await supabase.storage
        .from('task-evidence')
        .remove([filePath])
    }

    const { error } = await supabase
      .from('task_evidence')
      .delete()
      .eq('id', evidenceId)

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: currentUserId,
      entityType: 'evidence',
      entityId: evidenceId,
      action: 'delete',
      oldValue: previous,
    })

    await loadChecklist()
  }

  async function finalizeChecklist() {
    const unresolvedTasks = tasks.filter(task =>
      ['pending', 'in_progress'].includes(task.status)
    )

    if (unresolvedTasks.length > 0) {
      alert(
        `No puedes finalizar todavía. Hay ${unresolvedTasks.length} tareas pendientes o en curso.`
      )
      return
    }

    const blockedWithoutComment = tasks.filter(
      task => task.status === 'blocked' && !task.comments?.trim()
    )

    if (blockedWithoutComment.length > 0) {
      alert(
        `Hay ${blockedWithoutComment.length} tareas bloqueadas sin comentario técnico. Añade el motivo antes de finalizar.`
      )
      return
    }

    setSaving(true)

    const previous = checklist

    const { data, error } = await supabase
      .from('checklists')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', checklistId)
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: currentUserId,
      entityType: 'checklist',
      entityId: checklistId,
      action: 'complete',
      oldValue: previous,
      newValue: data,
    })

    await loadChecklist()
  }

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0

    const completed = tasks.filter(
      task =>
        task.status === 'completed' ||
        task.status === 'not_applicable'
    ).length

    return Math.round((completed / tasks.length) * 100)
  }, [tasks])

  if (loading) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 text-[#64748B]">
        Cargando checklist...
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 text-[#64748B]">
        Checklist no encontrado.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-5 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm text-[#334155] shadow-sm hover:bg-[#F8FAFC]"
          >
            ← Volver
          </button>

          <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
            {checklist.title}
          </h1>

          <p className="mt-3 text-base text-[#64748B] font-normal">
            Estado: {checklist.status}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenReport}
            className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm text-[#334155] shadow-sm hover:bg-[#F8FAFC]"
          >
            Ver informe
          </button>

          {checklist.status !== 'completed' && (
            <button
              type="button"
              onClick={finalizeChecklist}
              disabled={saving}
              className="rounded-2xl bg-[#ECFDF5] px-5 py-3 text-sm font-medium text-[#047857] shadow-sm hover:bg-[#D1FAE5] disabled:opacity-60"
            >
              {saving ? 'Finalizando...' : 'Finalizar checklist'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-[32px] border border-[#E2E8F0] bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-[#64748B] font-normal">
            Progreso
          </span>

          <span className="text-sm text-[#047857] font-medium">
            {progress}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#E2E8F0]">
          <div
            className="h-full rounded-full bg-[#059669]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-7">
        {sections.map(section => {
          const sectionTasks = tasks.filter(task => task.section_id === section.id)

          return (
            <section
              key={section.id}
              className="overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]"
            >
              <div className="border-b border-[#E2E8F0] px-7 py-6">
                <h2 className="text-2xl tracking-[-0.025em] text-[#0F172A] font-medium">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-5 p-7">
                {sectionTasks.map(task => {
                  const currentStatus = getStatus(task.status)

                  const taskEvidence = evidence.filter(
                    item => item.task_id === task.id
                  )

                  return (
                    <div
                      key={task.id}
                      className="rounded-[28px] border border-[#E2E8F0] bg-[#F8FAFC] p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl text-[#0F172A] font-medium">
                              {task.title}
                            </h3>

                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${currentStatus.color}`}>
                              {currentStatus.label}
                            </span>
                          </div>

                          {task.description && (
                            <p className="mt-3 text-sm text-[#64748B] font-normal">
                              {task.description}
                            </p>
                          )}

                          <textarea
                            value={task.comments || ''}
                            onChange={e =>
                              updateTaskComment(task.id, e.target.value)
                            }
                            className="mt-5 min-h-28 w-full rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm font-normal outline-none focus:border-[#059669]"
                            placeholder="Comentarios técnicos..."
                          />

                          <div className="mt-5">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-medium text-[#047857] shadow-sm hover:bg-[#F8FAFC]">
                              Subir evidencia

                              <input
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={e =>
                                  uploadEvidence(task.id, e.target.files[0])
                                }
                              />
                            </label>

                            {taskEvidence.length > 0 && (
                              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                                {taskEvidence.map(item => (
                                  <div
                                    key={item.id}
                                    className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
                                  >
                                    {item.file_type?.startsWith('image/') ? (
                                      <img
                                        src={item.file_url}
                                        className="h-32 w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-32 items-center justify-center bg-[#F1F5F9] text-sm text-[#64748B]">
                                        PDF
                                      </div>
                                    )}

                                    <div className="p-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteEvidence(item.id, item.file_path)
                                        }
                                        className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="w-full xl:w-72">
                          <label className="mb-2 block text-xs uppercase tracking-wide text-[#64748B] font-medium">
                            Estado
                          </label>

                          <select
                            value={task.status}
                            onChange={e =>
                              updateTaskStatus(task.id, e.target.value)
                            }
                            className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm font-normal outline-none focus:border-[#059669]"
                          >
                            {TASK_STATUSES.map(status => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}