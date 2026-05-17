import { useEffect, useState } from 'react'

export default function EditProjectModal({ isOpen, project, clients = [], onClose, onSave }) {
  const [form, setForm] = useState({ name: '', client_id: '', status: 'active', notes: '', visible_to_client: false })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        client_id: project.client_id || '',
        status: project.status || 'active',
        notes: project.notes || '',
        visible_to_client: project.visible_to_client || false,
      })
    }
  }, [project])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try { await onSave(project.id, form) }
    catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-xl rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-[#0F172A]">Editar proyecto</h2>
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre *" value={form.name} onChange={v => update('name', v)} />

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#334155]">Farmacia</span>
            <select value={form.client_id} onChange={e => update('client_id', e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#059669]">
              <option value="">Selecciona una farmacia</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.pharmacy_name || c.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#334155]">Estado</span>
            <select value={form.status} onChange={e => update('status', e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#059669]">
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#334155]">Notas</span>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3}
              className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]" />
          </label>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#334155]">
            <input type="checkbox" checked={form.visible_to_client}
              onChange={e => update('visible_to_client', e.target.checked)} />
            Visible para el cliente
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-[#005643] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Guardando...' : 'Guardar cambios'}
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
