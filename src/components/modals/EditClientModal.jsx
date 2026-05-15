import { useEffect, useMemo, useState } from 'react'

const EMPTY_FORM = {
  name: '',
  pharmacy_name: '',
  pharmacist_owner: '',
  province: '',
  city: '',
  contact_phone: '',
  contact_email: '',
  nif_cif: '',
  soe_number: '',
  business_email: '',
  business_phone: '',
  address: '',
  collegiate_data: '',
  company_data: '',
  operators: '',
  cip: '',
  observations: '',
  email: '',
  phone: '',
  notes: '',
}

export default function EditClientModal({
  isOpen,
  client,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!client) return

    setFormData({
      name: client.name || '',
      pharmacy_name: client.pharmacy_name || client.name || '',
      pharmacist_owner: client.pharmacist_owner || '',
      province: client.province || '',
      city: client.city || '',
      contact_phone: client.contact_phone || client.phone || '',
      contact_email: client.contact_email || client.email || '',
      nif_cif: client.nif_cif || '',
      soe_number: client.soe_number || '',
      business_email: client.business_email || '',
      business_phone: client.business_phone || '',
      address: client.address || '',
      collegiate_data: client.collegiate_data || '',
      company_data: client.company_data || '',
      operators: client.operators || '',
      cip: client.cip || '',
      observations: client.observations || client.notes || '',
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || '',
    })
  }, [client])

  const isValid = useMemo(() => validateForm(formData), [formData])

  function updateField(field, value) {
    setFormData(current => ({ ...current, [field]: value }))
  }

  function handleClose() {
    setSubmitting(false)
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!client?.id) return

    if (!isValid) {
      alert('Completa todos los campos obligatorios y revisa el email de contacto.')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        ...formData,
        email: formData.contact_email,
        phone: formData.contact_phone,
        notes: formData.observations,
      }

      await onSave(client.id, payload)
      setSubmitting(false)
    } catch (error) {
      setSubmitting(false)
      throw error
    }
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#0F172A]">Editar farmacia</h2>
            <p className="mt-1 text-sm text-[#64748B]">Actualiza los datos obligatorios marcados con *</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Razón social *" value={formData.name} onChange={value => updateField('name', value)} />
            <Field label="Nombre comercial *" value={formData.pharmacy_name} onChange={value => updateField('pharmacy_name', value)} />
            <Field label="Provincia *" value={formData.province} onChange={value => updateField('province', value)} />
            <Field label="Localidad *" value={formData.city} onChange={value => updateField('city', value)} />
            <Field label="Teléfono contacto *" value={formData.contact_phone} onChange={value => updateField('contact_phone', value)} />
            <Field label="Email contacto *" type="email" value={formData.contact_email} onChange={value => updateField('contact_email', value)} />
            <Field label="Titular farmacéutico" value={formData.pharmacist_owner} onChange={value => updateField('pharmacist_owner', value)} />
            <Field label="NIF/CIF" value={formData.nif_cif} onChange={value => updateField('nif_cif', value)} />
            <Field label="SOE" value={formData.soe_number} onChange={value => updateField('soe_number', value)} />
            <Field label="Email empresa" type="email" value={formData.business_email} onChange={value => updateField('business_email', value)} />
            <Field label="Teléfono empresa" value={formData.business_phone} onChange={value => updateField('business_phone', value)} />
            <Field label="CIP" value={formData.cip} onChange={value => updateField('cip', value)} />
            <Field label="Datos colegiales" value={formData.collegiate_data} onChange={value => updateField('collegiate_data', value)} />
            <Field label="Datos empresa" value={formData.company_data} onChange={value => updateField('company_data', value)} />
            <Field label="Operadores" value={formData.operators} onChange={value => updateField('operators', value)} />

            <div className="md:col-span-2">
              <Field label="Dirección" value={formData.address} onChange={value => updateField('address', value)} />
            </div>

            <div className="md:col-span-2">
              <TextArea label="Observaciones" value={formData.observations} onChange={value => updateField('observations', value)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#64748B]">* Campos obligatorios</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="rounded-xl bg-[#005643] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function validateForm(data) {
  const required = [
    'name',
    'pharmacy_name',
    'province',
    'city',
    'contact_phone',
    'contact_email',
  ]

  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return false
    }
  }

  const emailOk = /\S+@\S+\.\S+/.test(data.contact_email || '')
  return emailOk
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#334155]">{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]"
      />
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#334155]">{label}</span>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]"
      />
    </label>
  )
}