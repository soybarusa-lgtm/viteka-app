import { useEffect, useState } from 'react'

export default function CreateTemplateModal({ isOpen, onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleClose() {
    setForm({ name: '', description: '' })
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { alert('El nombre es obligatorio.'); return }
    setSubmitting(true)
    try { await onCreate(form) }
    catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-[#0F172A]">Nueva plantilla</h2>
          <button type="button" onClick={handleClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#334155]">Nombre *</span>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#334155]">Descripción</span>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
              className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]" />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose}
              className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-[#005643] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Creando...' : 'Crear plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
