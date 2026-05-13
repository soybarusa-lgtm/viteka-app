import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import CreateTemplateSectionModal from '../components/modals/CreateTemplateSectionModal'
import CreateTemplateTaskModal from '../components/modals/CreateTemplateTaskModal'

export default function TemplateEditorPage({
  templateId,
  onBack,
}) {
  const [template, setTemplate] = useState(null)
  const [sections, setSections] = useState([])
  const [tasks, setTasks] = useState([])

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  useEffect(() => {
    if (templateId) loadTemplate()
  }, [templateId])

  async function loadTemplate() {
    const { data: templateData, error: templateError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError) {
      alert(templateError.message)
      return
    }

    setTemplate(templateData)

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('checklist_template_sections')
      .select('*')
      .eq('template_id', templateId)
      .order('position', { ascending: true })

    if (sectionsError) {
      alert(sectionsError.message)
      return
    }

    setSections(sectionsData || [])

    const sectionIds = (sectionsData || []).map(section => section.id)

    if (sectionIds.length > 0) {
      const { data: tasksData, error: tasksError } = await supabase
        .from('checklist_template_tasks')
        .select('*')
        .in('section_id', sectionIds)
        .order('position', { ascending: true })

      if (tasksError) {
        alert(tasksError.message)
        return
      }

      setTasks(tasksData || [])
    } else {
      setTasks([])
    }
  }

  async function updateTemplateField(field, value) {
    setTemplate(prev => ({
      ...prev,
      [field]: value,
    }))

    await supabase
      .from('checklist_templates')
      .update({ [field]: value })
      .eq('id', templateId)
  }

  async function createSection(sectionData) {
    const { error } = await supabase
      .from('checklist_template_sections')
      .insert({
        template_id: templateId,
        title: sectionData.title,
        position: sections.length + 1,
      })

    if (error) {
      alert(error.message)
      return
    }

    setIsSectionModalOpen(false)
    await loadTemplate()
  }

  async function updateSection(sectionId, field, value) {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, [field]: value }
          : section
      )
    )

    await supabase
      .from('checklist_template_sections')
      .update({ [field]: value })
      .eq('id', sectionId)
  }

  async function deleteSection(sectionId) {
    const confirmed = window.confirm(
      '¿Eliminar esta sección y sus tareas?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('checklist_template_sections')
      .delete()
      .eq('id', sectionId)

    if (error) {
      alert(error.message)
      return
    }

    await loadTemplate()
  }

  function openTaskModal(sectionId) {
    setSelectedSectionId(sectionId)
    setIsTaskModalOpen(true)
  }

  async function createTask(taskData) {
    if (!selectedSectionId) return

    const sectionTasks = tasks.filter(
      task => task.section_id === selectedSectionId
    )

    const { error } = await supabase
      .from('checklist_template_tasks')
      .insert({
        section_id: selectedSectionId,
        title: taskData.title,
        description: taskData.description,
        required: taskData.required,
        position: sectionTasks.length + 1,
      })

    if (error) {
      alert(error.message)
      return
    }

    setIsTaskModalOpen(false)
    setSelectedSectionId(null)
    await loadTemplate()
  }

  async function updateTask(taskId, field, value) {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, [field]: value }
          : task
      )
    )

    await supabase
      .from('checklist_template_tasks')
      .update({ [field]: value })
      .eq('id', taskId)
  }

  async function deleteTask(taskId) {
    const confirmed = window.confirm('¿Eliminar esta tarea?')
    if (!confirmed) return

    const { error } = await supabase
      .from('checklist_template_tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      alert(error.message)
      return
    }

    await loadTemplate()
  }

  const selectedSection = sections.find(
    section => section.id === selectedSectionId
  )

  if (!template) {
    return (
      <div className="rounded-2xl bg-white border border-[#DCE7E1] p-8">
        Cargando plantilla...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-4 rounded-xl border border-[#DCE7E1] bg-white px-4 py-2 font-bold text-[#4A6B58] hover:bg-[#F5FAF6]"
          >
            Volver a checklists
          </button>

          <h1 className="text-3xl font-extrabold tracking-tight">
            Editor de plantilla
          </h1>

          <p className="mt-2 text-[#8AAA96] font-medium">
            Edita secciones y tareas reutilizables.
          </p>
        </div>

        <button
          onClick={() => setIsSectionModalOpen(true)}
          className="rounded-xl bg-[#005643] px-5 py-3 text-white font-bold hover:bg-[#0E7A60]"
        >
          Nueva sección
        </button>
      </div>

      <div className="mb-6 rounded-2xl bg-white border border-[#DCE7E1] p-6">
        <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
          Nombre de plantilla
        </label>

        <input
          value={template.name || ''}
          onChange={e => updateTemplateField('name', e.target.value)}
          className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
        />

        <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
          Descripción
        </label>

        <textarea
          value={template.description || ''}
          onChange={e => updateTemplateField('description', e.target.value)}
          className="min-h-24 w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
        />

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-[#DCE7E1] p-4 font-bold text-[#4A6B58]">
          <input
            type="checkbox"
            checked={template.is_active}
            onChange={e => updateTemplateField('is_active', e.target.checked)}
            className="h-5 w-5"
          />

          Plantilla activa
        </label>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#DCE7E1] p-8 text-[#8AAA96]">
          Esta plantilla todavía no tiene secciones.
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map(section => {
            const sectionTasks = tasks.filter(
              task => task.section_id === section.id
            )

            return (
              <div
                key={section.id}
                className="rounded-2xl bg-white border border-[#DCE7E1] overflow-hidden"
              >
                <div className="border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#8AAA96] mb-2">
                        Sección
                      </label>

                      <input
                        value={section.title || ''}
                        onChange={e =>
                          updateSection(section.id, 'title', e.target.value)
                        }
                        className="w-full rounded-xl border border-[#DCE7E1] bg-white px-4 py-3 font-extrabold text-[#005643] outline-none focus:border-[#005643]"
                      />

                      <p className="mt-2 text-sm text-[#8AAA96]">
                        {sectionTasks.length} tareas
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openTaskModal(section.id)}
                        className="rounded-xl bg-[#005643] px-4 py-2 text-sm font-bold text-white hover:bg-[#0E7A60]"
                      >
                        Añadir tarea
                      </button>

                      <button
                        onClick={() => deleteSection(section.id)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        Eliminar sección
                      </button>
                    </div>
                  </div>
                </div>

                {sectionTasks.length === 0 ? (
                  <div className="px-6 py-6 text-[#8AAA96]">
                    Esta sección no tiene tareas.
                  </div>
                ) : (
                  <div className="divide-y divide-[#EEF4F0]">
                    {sectionTasks.map(task => (
                      <div
                        key={task.id}
                        className="px-6 py-5"
                      >
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px]">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wide text-[#8AAA96] mb-2">
                              Tarea
                            </label>

                            <input
                              value={task.title || ''}
                              onChange={e =>
                                updateTask(task.id, 'title', e.target.value)
                              }
                              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 font-bold outline-none focus:border-[#005643]"
                            />

                            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#8AAA96] mb-2">
                              Descripción
                            </label>

                            <textarea
                              value={task.description || ''}
                              onChange={e =>
                                updateTask(task.id, 'description', e.target.value)
                              }
                              className="min-h-20 w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
                            />
                          </div>

                          <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 rounded-xl border border-[#DCE7E1] p-4 font-bold text-[#4A6B58]">
                              <input
                                type="checkbox"
                                checked={task.required}
                                onChange={e =>
                                  updateTask(task.id, 'required', e.target.checked)
                                }
                                className="h-5 w-5"
                              />

                              Obligatoria
                            </label>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                            >
                              Eliminar tarea
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <CreateTemplateSectionModal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        onCreate={createSection}
      />

      <CreateTemplateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedSectionId(null)
        }}
        onCreate={createTask}
        sectionTitle={selectedSection?.title}
      />
    </div>
  )
}