import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CreateTemplateSectionModal from '../components/modals/CreateTemplateSectionModal'
import CreateTemplateTaskModal from '../components/modals/CreateTemplateTaskModal'

// ── Icons ─────────────────────────────────────────────────────────────────
function IconArrow()  { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>) }
function IconPlus()   { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>) }
function IconTrash()  { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>) }

export default function TemplateEditorPage({ templateId, onBack }) {
  const [template, setTemplate] = useState(null)
  const [sections, setSections] = useState([])
  const [tasks,    setTasks]    = useState([])
  const [loading,  setLoading]  = useState(true)

  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [taskModalOpen,    setTaskModalOpen]    = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState(null)

  useEffect(() => { if (templateId) load() }, [templateId])

  async function load() {
    setLoading(true)
    const { data: tpl } = await supabase.from('checklist_templates').select('*').eq('id', templateId).single()
    setTemplate(tpl || null)

    const { data: secs } = await supabase.from('checklist_template_sections').select('*').eq('template_id', templateId).order('position')
    setSections(secs || [])

    const ids = (secs || []).map(s => s.id)
    if (ids.length > 0) {
      const { data: tks } = await supabase.from('checklist_template_tasks').select('*').in('section_id', ids).order('position')
      setTasks(tks || [])
    } else { setTasks([]) }
    setLoading(false)
  }

  async function updateTemplateField(field, value) {
    setTemplate(p => ({ ...p, [field]: value }))
    await supabase.from('checklist_templates').update({ [field]: value }).eq('id', templateId)
  }

  async function createSection(data) {
    const { error } = await supabase.from('checklist_template_sections').insert({
      template_id: templateId, title: data.title, position: sections.length + 1,
    })
    if (error) { alert(error.message); return }
    setSectionModalOpen(false)
    await load()
  }

  async function updateSection(sectionId, field, value) {
    setSections(p => p.map(s => s.id === sectionId ? { ...s, [field]: value } : s))
    await supabase.from('checklist_template_sections').update({ [field]: value }).eq('id', sectionId)
  }

  async function deleteSection(sectionId) {
    if (!window.confirm('¿Eliminar esta sección y sus tareas?')) return
    const { error } = await supabase.from('checklist_template_sections').delete().eq('id', sectionId)
    if (error) { alert(error.message); return }
    await load()
  }

  function openTaskModal(sectionId) { setSelectedSectionId(sectionId); setTaskModalOpen(true) }

  async function createTask(data) {
    if (!selectedSectionId) return
    const sectionTasks = tasks.filter(t => t.section_id === selectedSectionId)
    const { error } = await supabase.from('checklist_template_tasks').insert({
      section_id: selectedSectionId, title: data.title, description: data.description,
      required: data.required, position: sectionTasks.length + 1,
    })
    if (error) { alert(error.message); return }
    setTaskModalOpen(false); setSelectedSectionId(null)
    await load()
  }

  async function updateTask(taskId, field, value) {
    setTasks(p => p.map(t => t.id === taskId ? { ...t, [field]: value } : t))
    await supabase.from('checklist_template_tasks').update({ [field]: value }).eq('id', taskId)
  }

  async function deleteTask(taskId) {
    if (!window.confirm('¿Eliminar esta tarea?')) return
    const { error } = await supabase.from('checklist_template_tasks').delete().eq('id', taskId)
    if (error) { alert(error.message); return }
    setTasks(p => p.filter(t => t.id !== taskId))
  }

  const selectedSection = sections.find(s => s.id === selectedSectionId)

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" />
    </div>
  )
  if (!template) return (
    <div className="rounded-2xl border border-[#E8EDF2] bg-white p-8 text-[#94A3B8]">Plantilla no encontrada.</div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={onBack}
            className="mb-3 flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#0F172A] transition">
            <IconArrow /> Volver a checklists
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Editor de plantilla</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Edita secciones y tareas reutilizables</p>
        </div>
        <button type="button" onClick={() => setSectionModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#005643] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#00442f]">
          <IconPlus /> Nueva sección
        </button>
      </div>

      {/* Template meta */}
      <div className="rounded-2xl border border-[#E8EDF2] bg-white p-6 space-y-4">
        <p className="text-[13px] font-medium text-[#0F172A]">Datos de la plantilla</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nombre de plantilla">
            <input value={template.name || ''} onChange={e => updateTemplateField('name', e.target.value)}
              className="field" placeholder="Inspección mensual..." />
          </FormField>
          <FormField label="Estado">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-2.5">
              <input type="checkbox" checked={template.is_active}
                onChange={e => updateTemplateField('is_active', e.target.checked)} className="rounded" />
              <span className="text-[13px] text-[#334155]">{template.is_active ? 'Activa' : 'Inactiva'}</span>
            </label>
          </FormField>
        </div>
        <FormField label="Descripción">
          <textarea value={template.description || ''} onChange={e => updateTemplateField('description', e.target.value)}
            rows={2} className="field resize-none" />
        </FormField>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-12 text-center">
          <p className="text-[14px] font-medium text-[#0F172A]">Sin secciones</p>
          <p className="mt-1 text-[13px] text-[#94A3B8]">Crea la primera sección para añadir tareas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map(sec => {
            const secTasks = tasks.filter(t => t.section_id === sec.id)
            return (
              <div key={sec.id} className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
                {/* Section header */}
                <div className="flex flex-col gap-3 border-b border-[#F1F5F9] bg-[#FAFBFC] px-6 py-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Sección</p>
                    <input value={sec.title || ''} onChange={e => updateSection(sec.id, 'title', e.target.value)}
                      className="w-full rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-[14px] font-medium text-[#0F172A] outline-none focus:border-[#005643]" />
                    <p className="mt-1.5 text-[11px] text-[#94A3B8]">{secTasks.length} tarea{secTasks.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => openTaskModal(sec.id)}
                      className="flex items-center gap-1 rounded-xl bg-[#005643] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#00442f]">
                      <IconPlus /> Añadir tarea
                    </button>
                    <button type="button" onClick={() => deleteSection(sec.id)}
                      className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
                      <IconTrash /> Eliminar
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                {secTasks.length === 0 ? (
                  <div className="px-6 py-4 text-[13px] text-[#94A3B8]">Sin tareas en esta sección.</div>
                ) : (
                  <div className="divide-y divide-[#F8FAFC]">
                    {secTasks.map(task => (
                      <div key={task.id} className="px-6 py-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_200px]">
                          <div className="space-y-3">
                            <FormField label="Nombre de tarea">
                              <input value={task.title || ''} onChange={e => updateTask(task.id, 'title', e.target.value)}
                                className="field" />
                            </FormField>
                            <FormField label="Descripción">
                              <textarea value={task.description || ''} onChange={e => updateTask(task.id, 'description', e.target.value)}
                                rows={2} className="field resize-none" />
                            </FormField>
                          </div>
                          <div className="flex flex-col gap-3">
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-3 text-[13px] text-[#334155]">
                              <input type="checkbox" checked={task.required}
                                onChange={e => updateTask(task.id, 'required', e.target.checked)} className="rounded" />
                              Obligatoria
                            </label>
                            <button type="button" onClick={() => deleteTask(task.id)}
                              className="flex items-center justify-center gap-1 rounded-xl border border-red-200 py-2.5 text-[12px] font-medium text-red-600 hover:bg-red-50">
                              <IconTrash /> Eliminar tarea
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
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        onCreate={createSection}
      />
      <CreateTemplateTaskModal
        isOpen={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setSelectedSectionId(null) }}
        onCreate={createTask}
        sectionTitle={selectedSection?.title}
      />
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">{label}</span>
      {children}
    </label>
  )
}
