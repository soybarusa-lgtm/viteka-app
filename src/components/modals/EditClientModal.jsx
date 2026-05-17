import { useEffect, useState } from 'react'

export default function EditClientModal({ isOpen, client, onClose, onSave }) {
  const [form, setForm] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (client) setForm({ ...client })
  }, [client])

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
    try { await onSave(client.id, form) }
    catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-2xl rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-[#0F172A]">Editar farmacia</h2>
          <button type="button" onClick={onClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre fiscal" value={form.name} onChange={v => update('name', v)} />
            <Field label="Farmacia" value={form.pharmacy_name} onChange={v => update('pharmacy_name', v)} />
            <Field label="Titular" value={form.pharmacist_owner} onChange={v => update('pharmacist_owner', v)} />
            <Field label="NIF/CIF" value={form.nif_cif} onChange={v => update('nif_cif', v)} />
            <Field label="SOE" value={form.soe_number} onChange={v => update('soe_number', v)} />
            <Field label="Teléfono" value={form.contact_phone} onChange={v => update('contact_phone', v)} />
            <Field label="Email" type="email" value={form.contact_email} onChange={v => update('contact_email', v)} />
            <Field label="Ciudad" value={form.city} onChange={v => update('city', v)} />
            <Field label="Provincia" value={form.province} onChange={v => update('province', v)} />
            <Field label="Código postal" value={form.postal_code} onChange={v => update('postal_code', v)} />
            <div className="sm:col-span-2">
              <Field label="Dirección" value={form.address} onChange={v => update('address', v)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#334155]">Observaciones</span>
                <textarea value={form.observations || ''} onChange={e => update('observations', e.target.value)} rows={3}
                  className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]" />
              </label>
            </div>
          </div>

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
