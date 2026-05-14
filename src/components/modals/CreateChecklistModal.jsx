import { useState } from 'react'

export default function CreateChecklistModal({
  isOpen,
  onClose,
  onCreate,
  projects = [],
  templates = [],
}) {
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()

    if (!title.trim()) {
      alert('El título es obligatorio.')
      return
    }

    if (!projectId) {
      alert('Selecciona un proyecto.')
      return
    }

    if (!templateId) {
      alert('Selecciona una plantilla.')
      return
    }

    setLoading(true)

    await onCreate({
      title,
      project_id: projectId,
      template_id: templateId,
    })

    setLoading(false)

    setTitle('')
    setProjectId('')
    setTemplateId('')
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-[#E2E8F0] bg-white shadow-xl">
        <div className="border-b border-[#E2E8F0] px-7 py-6">
          <h2 className="text-2xl font-black text-[#0F172A]">
            Nuevo checklist
          </h2>

          <p className="mt-2 text-sm font-semibold text-[#64748B]">
            Crea una nueva ejecución técnica desde una plantilla.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 p-7">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Título
            </label>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
              placeholder="Checklist instalación..."
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Proyecto
            </label>

            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-black outline-none focus:border-[#005643]"
            >
              <option value="">Seleccionar proyecto</option>

              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Plantilla
            </label>

            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-black outline-none focus:border-[#005643]"
            >
              <option value="">Seleccionar plantilla</option>

              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 text-sm font-black text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}