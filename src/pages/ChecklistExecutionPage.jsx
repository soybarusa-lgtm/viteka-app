import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const TASK_STATUSES = [
  {
    value: 'pending',
    label: 'Pendiente',
    color:
      'bg-[#FFF7E6] text-[#92400E] border-[#F59E0B]',
  },
  {
    value: 'in_progress',
    label: 'En curso',
    color:
      'bg-[#EFF6FF] text-[#1D4ED8] border-[#2563EB]',
  },
  {
    value: 'blocked',
    label: 'Bloqueada',
    color:
      'bg-[#FFF1F1] text-[#B91C1C] border-[#EF4444]',
  },
  {
    value: 'completed',
    label: 'Completada',
    color:
      'bg-[#ECFDF5] text-[#166534] border-[#16A34A]',
  },
  {
    value: 'not_applicable',
    label: 'No aplica',
    color:
      'bg-[#F3F4F6] text-[#374151] border-[#9CA3AF]',
  },
]

function getStatus(statusValue) {
  return (
    TASK_STATUSES.find(
      status => status.value === statusValue
    ) || TASK_STATUSES[0]
  )
}

export default function ChecklistExecutionPage({
  checklistId,
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

    const { data: checklistData, error: checklistError } =
      await supabase
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

    const { data: sectionsData, error: sectionsError } =
      await supabase
        .from('checklist_sections')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('position', {
          ascending: true,
        })

    if (sectionsError) {
      alert(sectionsError.message)
      setLoading(false)
      return
    }

    setSections(sectionsData || [])

    const sectionIds = (sectionsData || []).map(
      section => section.id
    )

    if (sectionIds.length === 0) {
      setTasks([])
      setEvidence([])
      setLoading(false)
      return
    }

    const { data: tasksData, error: tasksError } =
      await supabase
        .from('checklist_tasks')
        .select('*')
        .in('section_id', sectionIds)
        .order('position', {
          ascending: true,
        })

    if (tasksError) {
      alert(tasksError.message)
      setLoading(false)
      return
    }

    setTasks(tasksData || [])

    const taskIds = (tasksData || []).map(
      task => task.id
    )

    if (taskIds.length === 0) {
      setEvidence([])
      setLoading(false)
      return
    }

    const {
      data: evidenceData,
      error: evidenceError,
    } = await supabase
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
    const { error } = await supabase
      .from('checklist_tasks')
      .update({
        status,
      })
      .eq('id', taskId)

    if (error) {
      alert(error.message)
      return
    }

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

  async function updateTaskComment(
    taskId,
    comments
  ) {
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

    const { error } = await supabase
      .from('checklist_tasks')
      .update({
        comments,
      })
      .eq('id', taskId)

    if (error) {
      alert(error.message)
    }
  }

  async function uploadEvidence(taskId, file) {
    if (!file) return

    const fileExt = file.name
      .split('.')
      .pop()

    const fileName = `${taskId}-${Date.now()}.${fileExt}`

    const filePath = `checklists/${checklistId}/${fileName}`

    const { error: uploadError } =
      await supabase.storage
        .from('task-evidence')
        .upload(filePath, file)

    if (uploadError) {
      alert(uploadError.message)
      return
    }

    const { data: publicUrlData } =
      supabase.storage
        .from('task-evidence')
        .getPublicUrl(filePath)

    const { error: insertError } =
      await supabase
        .from('task_evidence')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          file_url:
            publicUrlData.publicUrl,
          file_type: file.type,
        })

    if (insertError) {
      alert(insertError.message)
      return
    }

    await loadChecklist()
  }

  async function deleteEvidence(
    evidenceId,
    filePath
  ) {
    const confirmed = window.confirm(
      '¿Eliminar evidencia?'
    )

    if (!confirmed) return

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

    await loadChecklist()
  }

  async function finalizeChecklist() {
    const unresolvedTasks = tasks.filter(task =>
      ['pending', 'in_progress'].includes(
        task.status
      )
    )

    if (unresolvedTasks.length > 0) {
      alert(
        `No puedes finalizar todavía. Hay ${unresolvedTasks.length} tareas pendientes o en curso.`
      )
      return
    }

    const blockedWithoutComment =
      tasks.filter(
        task =>
          task.status === 'blocked' &&
          !task.comments?.trim()
      )

    if (blockedWithoutComment.length > 0) {
      alert(
        `Hay ${blockedWithoutComment.length} tareas bloqueadas sin comentario técnico.`
      )
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('checklists')
      .update({
        status: 'completed',
        completed_at:
          new Date().toISOString(),
      })
      .eq('id', checklistId)

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    await loadChecklist()
  }

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0

    const completed = tasks.filter(
      task =>
        task.status === 'completed' ||
        task.status === 'not_applicable'
    ).length

    return Math.round(
      (completed / tasks.length) * 100
    )
  }, [tasks])

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-[#DCE7E1] p-8">
        Cargando checklist...
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="rounded-2xl bg-white border border-[#DCE7E1] p-8">
        Checklist no encontrado.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-4 rounded-xl border border-[#DCE7E1] px-4 py-2 text-sm font-bold text-[#005643] hover:bg-[#F5FAF6]"
          >
            ← Volver
          </button>

          <h1 className="text-3xl font-extrabold tracking-tight">
            {checklist.title}
          </h1>

          <p className="mt-2 text-[#8AAA96] font-medium">
            Estado:
            {' '}
            {checklist.status}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenReport}
            className="rounded-xl border border-[#DCE7E1] px-5 py-3 font-bold text-[#005643] hover:bg-[#F5FAF6]"
          >
            Ver informe
          </button>

          {checklist.status !==
            'completed' && (
            <button
              onClick={finalizeChecklist}
              disabled={saving}
              className="rounded-xl bg-[#005643] px-5 py-3 font-bold text-white hover:bg-[#0E7A60]"
            >
              {saving
                ? 'Finalizando...'
                : 'Finalizar checklist'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-2xl bg-white border border-[#DCE7E1] p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#4A6B58]">
            Progreso
          </span>

          <span className="text-sm font-bold text-[#005643]">
            {progress}%
          </span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-[#E5EFEA]">
          <div
            className="h-full rounded-full bg-[#005643]"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {sections.map(section => {
          const sectionTasks = tasks.filter(
            task =>
              task.section_id ===
              section.id
          )

          return (
            <div
              key={section.id}
              className="rounded-2xl bg-white border border-[#DCE7E1]"
            >
              <div className="border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4">
                <h2 className="text-xl font-extrabold text-[#005643]">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-5 p-6">
                {sectionTasks.map(task => {
                  const currentStatus =
                    getStatus(task.status)

                  const taskEvidence =
                    evidence.filter(
                      item =>
                        item.task_id ===
                        task.id
                    )

                  return (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-[#DCE7E1] p-5"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-extrabold">
                              {task.title}
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${currentStatus.color}`}
                            >
                              {
                                currentStatus.label
                              }
                            </span>
                          </div>

                          {task.description && (
                            <p className="mt-3 text-[#6E8B7B]">
                              {
                                task.description
                              }
                            </p>
                          )}

                          <textarea
                            value={
                              task.comments ||
                              ''
                            }
                            onChange={e =>
                              updateTaskComment(
                                task.id,
                                e.target.value
                              )
                            }
                            className="mt-4 min-h-28 w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
                            placeholder="Comentarios técnicos..."
                          />

                          <div className="mt-5">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#DCE7E1] px-4 py-3 font-bold text-[#005643] hover:bg-[#F5FAF6]">
                              📷 Subir evidencia

                              <input
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={e =>
                                  uploadEvidence(
                                    task.id,
                                    e.target
                                      .files[0]
                                  )
                                }
                              />
                            </label>

                            {taskEvidence.length >
                              0 && (
                              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {taskEvidence.map(
                                  item => (
                                    <div
                                      key={
                                        item.id
                                      }
                                      className="overflow-hidden rounded-xl border border-[#DCE7E1]"
                                    >
                                      {item.file_type?.startsWith(
                                        'image/'
                                      ) ? (
                                        <img
                                          src={
                                            item.file_url
                                          }
                                          className="h-32 w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-32 items-center justify-center bg-[#F5F7F9] font-bold">
                                          PDF
                                        </div>
                                      )}

                                      <div className="p-3">
                                        <button
                                          onClick={() =>
                                            deleteEvidence(
                                              item.id,
                                              item.file_path
                                            )
                                          }
                                          className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="w-full xl:w-72">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#4A6B58]">
                            Estado
                          </label>

                          <select
                            value={task.status}
                            onChange={e =>
                              updateTaskStatus(
                                task.id,
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 font-semibold outline-none focus:border-[#005643]"
                          >
                            {TASK_STATUSES.map(
                              status => (
                                <option
                                  key={
                                    status.value
                                  }
                                  value={
                                    status.value
                                  }
                                >
                                  {
                                    status.label
                                  }
                                </option>
                              )
                            )}
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