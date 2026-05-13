import { useState } from 'react'

export default function CreateChecklistModal({
  isOpen,
  onClose,
  onCreate,
  projects = [],
  templates = [],
}) {
  const [projectId, setProjectId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()

    if (!projectId) {
      alert('Selecciona un proyecto.')
      return
    }

    if (!templateId) {
      alert('Selecciona una plantilla.')
      return
    }

    const selectedTemplate = templates.find(template => template.id === templateId)

    setLoading(true)

    await onCreate({
      project_id: projectId,
      template_id: templateId,
      title: title || selectedTemplate?.name || 'Checklist técnico',
    })

    setLoading(false)
    setProjectId('')
    setTemplateId('')
    setTitle('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE7E1] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DCE7E1] px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold">Nuevo checklist</h2>
            <p className="mt-1 text-sm text-[#8AAA96] font-medium">
              Crea una ejecución real desde una plantilla.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 font-bold text-[#4A6B58] hover:bg-[#F5FAF6]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Proyecto
            </label>

            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
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
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Plantilla
            </label>

            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
            >
              <option value="">Seleccionar plantilla</option>

              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Título opcional
            </label>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="Si lo dejas vacío se usará el nombre de la plantilla"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DCE7E1] px-5 py-3 font-bold hover:bg-[#F5FAF6]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#005643] px-5 py-3 text-white font-bold hover:bg-[#0E7A60] disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}