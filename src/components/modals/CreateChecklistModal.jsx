import { useEffect, useState } from 'react'

export default function CreateChecklistModal({ isOpen, onClose, onCreate, projects = [], templates = [] }) {
  const [form, setForm] = useState({ title: '', project_id: '', template_id: '', visible_to_client: false })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    setForm({ title: '', project_id: '', template_id: '', visible_to_client: false })
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { alert('El título es obligatorio.'); return }
    if (!form.template_id) { alert('Selecciona una plantilla.'); return }
    setSubmitting(true)
    try { await onCreate(form) }
    catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-xl rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-[#0F172A]">Nuevo checklist</h2>
          <button type="button" onClick={handleClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Título *" value={form.title} onChange={v => update('title', v)} />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#334155]">Plantilla *</span>
            <select value={form.template_id} onChange={e => update('template_id', e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#059669]">
              <option value="">Selecciona una plantilla</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#334155]">Proyecto</span>
            <select value={form.project_id} onChange={e => update('project_id', e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#059669]">
              <option value="">Selecciona un proyecto (opcional)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#334155]">
            <input type="checkbox" checked={form.visible_to_client}
              onChange={e => update('visible_to_client', e.target.checked)} />
            Visible para el cliente
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-[#005643] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Creando...' : 'Crear checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#334155]">{label}</span>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]" />
    </label>
  )
}
