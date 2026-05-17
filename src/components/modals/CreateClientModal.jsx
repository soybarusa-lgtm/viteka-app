import { useEffect, useMemo, useState } from 'react'
import { PROVINCES_AND_CITIES } from '../../lib/locations'

const INITIAL_FORM = {
  pharmacy_name: '',
  province: '',
  city: '',
  contact_phone: '',
  contact_email: '',
  nif_cif: '',
  soe_number: '',
  address: '',
  postal_code: '',
  observations: '',
  legal_type: '',
  cb_holder_1_name: '',
  cb_holder_1_nif: '',
  cb_holder_2_name: '',
  cb_holder_2_nif: '',
  cb_cif: '',
  sl_company_name: '',
  sl_cif: '',
}

const PROVINCES = Object.keys(PROVINCES_AND_CITIES).sort()

export default function CreateClientModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Bloquea scroll del body mientras está abierto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const availableCities = useMemo(() => {
    if (!formData.province) return []
    return PROVINCES_AND_CITIES[formData.province] || []
  }, [formData.province])

  const selectedCity = useMemo(() => {
    return availableCities.find(item => item.name === formData.city)
  }, [availableCities, formData.city])

  const availablePostalCodes = selectedCity?.postalCodes || []
  const isValid = useMemo(() => validateForm(formData), [formData])

  function updateField(field, value) {
    setFormData(current => ({ ...current, [field]: value }))
  }

  function handleProvinceChange(value) {
    setFormData(current => ({ ...current, province: value, city: '', postal_code: '' }))
  }

  function handleCityChange(value) {
    const cityData = availableCities.find(item => item.name === value)
    setFormData(current => ({
      ...current,
      city: value,
      postal_code: cityData?.postalCodes?.length === 1 ? cityData.postalCodes[0] : '',
    }))
  }

  function handleLegalTypeChange(type) {
    setFormData(current => ({
      ...current,
      legal_type: current.legal_type === type ? '' : type,
      ...(type === 'cb'
        ? { sl_company_name: '', sl_cif: '' }
        : { cb_holder_1_name: '', cb_holder_1_nif: '', cb_holder_2_name: '', cb_holder_2_nif: '', cb_cif: '' }),
    }))
  }

  function resetForm() {
    setFormData(INITIAL_FORM)
    setSubmitting(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validation = validateForm(formData)
    if (!validation.valid) { alert(validation.message); return }
    try {
      setSubmitting(true)
      const payload = {
        name: formData.legal_type === 'sl' ? formData.sl_company_name || formData.pharmacy_name : formData.pharmacy_name,
        pharmacy_name: formData.pharmacy_name,
        province: formData.province,
        city: formData.city,
        postal_code: formData.postal_code,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        nif_cif: formData.nif_cif,
        soe_number: formData.soe_number,
        address: formData.address,
        observations: formData.observations,
        notes: formData.observations,
        phone: formData.contact_phone,
        email: formData.contact_email,
        legal_type: formData.legal_type,
        cb_holder_1_name: formData.cb_holder_1_name,
        cb_holder_1_nif: formData.cb_holder_1_nif,
        cb_holder_2_name: formData.cb_holder_2_name,
        cb_holder_2_nif: formData.cb_holder_2_nif,
        cb_cif: formData.cb_cif,
        sl_company_name: formData.sl_company_name,
        sl_cif: formData.sl_cif,
      }
      await onCreate(payload)
      resetForm()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    /*
      FIX: overflow-y-auto en el OVERLAY (no en el hijo).
      El overlay ocupa toda la pantalla y hace scroll.
      El hijo (tarjeta) no tiene max-h ni overflow propio.
    */
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-5xl rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#0F172A]">Nueva farmacia</h2>
            <p className="mt-1 text-sm text-[#64748B]">Completa los campos obligatorios (*)</p>
          </div>
          <button type="button" onClick={handleClose}
            className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC]">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nombre comercial *" value={formData.pharmacy_name} onChange={v => updateField('pharmacy_name', v)} />
            <SelectField label="Provincia *" value={formData.province} onChange={handleProvinceChange} options={PROVINCES} placeholder="Selecciona provincia" />
            <SelectField label="Localidad *" value={formData.city} onChange={handleCityChange}
              options={availableCities.map(item => item.name)}
              placeholder={formData.province ? 'Selecciona localidad' : 'Elige primero provincia'}
              disabled={!formData.province} />
            {availablePostalCodes.length > 0 ? (
              <SelectField label="Código postal *" value={formData.postal_code} onChange={v => updateField('postal_code', v)}
                options={availablePostalCodes}
                placeholder={formData.city ? 'Selecciona código postal' : 'Elige primero localidad'}
                disabled={!formData.city} />
            ) : (
              <Field label="Código postal *" value={formData.postal_code} onChange={v => updateField('postal_code', v)} />
            )}
            <Field label="Teléfono de contacto *" value={formData.contact_phone} onChange={v => updateField('contact_phone', v)} />
            <Field label="Email de contacto *" type="email" value={formData.contact_email} onChange={v => updateField('contact_email', v)} />
            <Field label="NIF o CIF *" value={formData.nif_cif} onChange={v => updateField('nif_cif', v)} />
            <Field label="SOE *" value={formData.soe_number} onChange={v => updateField('soe_number', v)} />
            <div className="md:col-span-2">
              <Field label="Dirección *" value={formData.address} onChange={v => updateField('address', v)} />
            </div>
            <div className="md:col-span-2">
              <TextArea label="Observaciones" value={formData.observations} onChange={v => updateField('observations', v)} />
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] p-4">
            <p className="mb-3 text-sm font-medium text-[#334155]">Tipo jurídico</p>
            <div className="flex flex-wrap gap-6">
              <CheckLike label="CB (Comunidad de Bienes)" checked={formData.legal_type === 'cb'} onChange={() => handleLegalTypeChange('cb')} />
              <CheckLike label="SL" checked={formData.legal_type === 'sl'} onChange={() => handleLegalTypeChange('sl')} />
            </div>
          </div>

          {formData.legal_type === 'cb' && (
            <div className="rounded-2xl border border-[#E2E8F0] p-4">
              <h3 className="mb-4 text-base font-semibold text-[#0F172A]">Datos Comunidad de Bienes (CB)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Titular farmacéutico 1 *" value={formData.cb_holder_1_name} onChange={v => updateField('cb_holder_1_name', v)} />
                <Field label="NIF/CIF titular 1 *" value={formData.cb_holder_1_nif} onChange={v => updateField('cb_holder_1_nif', v)} />
                <Field label="Titular farmacéutico 2 *" value={formData.cb_holder_2_name} onChange={v => updateField('cb_holder_2_name', v)} />
                <Field label="NIF/CIF titular 2 *" value={formData.cb_holder_2_nif} onChange={v => updateField('cb_holder_2_nif', v)} />
                <div className="md:col-span-2">
                  <Field label="CIF comunidad de bienes *" value={formData.cb_cif} onChange={v => updateField('cb_cif', v)} />
                </div>
              </div>
            </div>
          )}

          {formData.legal_type === 'sl' && (
            <div className="rounded-2xl border border-[#E2E8F0] p-4">
              <h3 className="mb-4 text-base font-semibold text-[#0F172A]">Datos Sociedad Limitada (SL)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Razón social *" value={formData.sl_company_name} onChange={v => updateField('sl_company_name', v)} />
                <Field label="CIF *" value={formData.sl_cif} onChange={v => updateField('sl_cif', v)} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#64748B]">* Campos obligatorios</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleClose}
                className="rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]">
                Cancelar
              </button>
              <button type="submit" disabled={!isValid.valid || submitting}
                className="rounded-xl bg-[#005643] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Guardando...' : 'Guardar farmacia'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function validateForm(data) {
  const requiredBase = ['pharmacy_name','province','city','contact_phone','contact_email','nif_cif','soe_number','address','postal_code']
  for (const field of requiredBase) {
    if (!data[field] || String(data[field]).trim() === '') return { valid: false, message: 'Faltan campos obligatorios de la farmacia.' }
  }
  if (!/\S+@\S+\.\S+/.test(data.contact_email || '')) return { valid: false, message: 'El email de contacto no tiene formato válido.' }
  if (!/^\d{5}$/.test((data.postal_code || '').trim())) return { valid: false, message: 'El código postal debe tener 5 dígitos.' }
  if (data.legal_type === 'cb') {
    for (const field of ['cb_holder_1_name','cb_holder_1_nif','cb_holder_2_name','cb_holder_2_nif','cb_cif']) {
      if (!data[field] || String(data[field]).trim() === '') return { valid: false, message: 'Faltan datos obligatorios de Comunidad de Bienes (CB).' }
    }
  }
  if (data.legal_type === 'sl') {
    for (const field of ['sl_company_name','sl_cif']) {
      if (!data[field] || String(data[field]).trim() === '') return { valid: false, message: 'Faltan datos obligatorios de Sociedad Limitada (SL).' }
    }
  }
  return { valid: true, message: '' }
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

function SelectField({ label, value, onChange, options, placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#334155]">{label}</span>
      <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-[#059669] disabled:opacity-60">
        <option value="">{placeholder}</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#334155]">{label}</span>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={4}
        className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]" />
    </label>
  )
}

function CheckLike({ label, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#334155]">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}
