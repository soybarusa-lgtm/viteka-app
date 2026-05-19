import { useState } from 'react'
import { supabase } from '../lib/supabase'

const PROVINCES = [
  { value: 'almeria',  label: 'Almería'  },
  { value: 'cadiz',    label: 'Cádiz'    },
  { value: 'cordoba',  label: 'Córdoba'  },
  { value: 'granada',  label: 'Granada'  },
  { value: 'huelva',   label: 'Huelva'   },
  { value: 'jaen',     label: 'Jaén'     },
  { value: 'malaga',   label: 'Málaga'   },
  { value: 'sevilla',  label: 'Sevilla'  },
]

const LEGAL_TYPES = [
  { value: 'autonomo',    label: 'Autónomo'        },
  { value: 'cb',          label: 'C.B.'             },
  { value: 'sl',          label: 'S.L.'             },
  { value: 'autonomo_sl', label: 'Autónomo + S.L.'  },
  { value: 'cb_sl',       label: 'C.B. + S.L.'      },
]

const EMPTY = {
  pharmacy_name: '',
  owner_name: '',
  nif: '',
  collegiate_number: '',
  soe_number: '',
  razon_social: '',
  cif: '',
  legal_type: '',
  province: '',
  city: '',
  address: '',
  postal_code: '',
  contact_phone: '',
  contact_email: '',
  schedule: '',
  has_guards: false,
  is_viteka_client: false,
  is_active: true,
  observations: '',
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked ? 'bg-[#1c473c]' : 'bg-gray-200'
        }`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

export default function PharmacyCreatePage({ navigate, profile }) {
  const [form,    setForm]    = useState(EMPTY)
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [apiError,setApiError] = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.pharmacy_name.trim()) e.pharmacy_name = 'El nombre de la farmacia es obligatorio'
    if (!form.province)             e.province      = 'Selecciona una provincia'
    if (!form.legal_type)           e.legal_type    = 'Selecciona el tipo jurídico'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setApiError(null)

    try {
      const payload = {
        ...form,
        pharmacy_name:     form.pharmacy_name.trim(),
        owner_name:        form.owner_name.trim()        || null,
        nif:               form.nif.trim()               || null,
        collegiate_number: form.collegiate_number.trim() || null,
        soe_number:        form.soe_number.trim()        || null,
        razon_social:      form.razon_social.trim()      || null,
        cif:               form.cif.trim()               || null,
        city:              form.city.trim()              || null,
        address:           form.address.trim()           || null,
        postal_code:       form.postal_code.trim()       || null,
        contact_phone:     form.contact_phone.trim()     || null,
        contact_email:     form.contact_email.trim()     || null,
        schedule:          form.schedule.trim()          || null,
        observations:      form.observations.trim()      || null,
        company_id:        profile?.company_id           || null,
      }

      const { data, error } = await supabase
        .from('pharmacies')
        .insert(payload)
        .select('id')
        .single()

      if (error) throw error

      navigate('pharmacy-detail', { pharmacyId: data.id })
    } catch (err) {
      console.error(err)
      setApiError(err.message || 'Error al guardar la farmacia')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">

      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('pharmacies')}
          className="text-sm text-teal-600 hover:underline inline-flex items-center gap-1 mb-3"
        >
          ← Farmacias
        </button>
        <h1 className="page-title">Nueva farmacia</h1>
        <p className="page-subtitle">Rellena los datos básicos para crear la ficha</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">

          {/* Identificación */}
          <Section title="Identificación">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre de la farmacia" required error={errors.pharmacy_name}>
                <input
                  value={form.pharmacy_name}
                  onChange={e => set('pharmacy_name', e.target.value)}
                  placeholder="Farmacia Ejemplo"
                  className={`input ${errors.pharmacy_name ? 'border-red-300 focus:ring-red-200' : ''}`}
                />
              </Field>
              <Field label="Titular / Farmacéutico" error={errors.owner_name}>
                <input
                  value={form.owner_name}
                  onChange={e => set('owner_name', e.target.value)}
                  placeholder="Nombre del titular"
                  className="input"
                />
              </Field>
              <Field label="NIF titular" error={errors.nif}>
                <input
                  value={form.nif}
                  onChange={e => set('nif', e.target.value)}
                  placeholder="12345678A"
                  className="input"
                />
              </Field>
              <Field label="Nº Colegiado" error={errors.collegiate_number}>
                <input
                  value={form.collegiate_number}
                  onChange={e => set('collegiate_number', e.target.value)}
                  placeholder="MA-0000"
                  className="input"
                />
              </Field>
              <Field label="Nº SOE" error={errors.soe_number}>
                <input
                  value={form.soe_number}
                  onChange={e => set('soe_number', e.target.value)}
                  placeholder="Nº SOE"
                  className="input"
                />
              </Field>
            </div>
          </Section>

          {/* Datos jurídicos */}
          <Section title="Datos jurídicos">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tipo jurídico" required error={errors.legal_type}>
                <select
                  value={form.legal_type}
                  onChange={e => set('legal_type', e.target.value)}
                  className={`input ${errors.legal_type ? 'border-red-300 focus:ring-red-200' : ''}`}
                >
                  <option value="">Seleccionar...</option>
                  {LEGAL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Razón social" error={errors.razon_social}>
                <input
                  value={form.razon_social}
                  onChange={e => set('razon_social', e.target.value)}
                  placeholder="Razón social S.L."
                  className="input"
                />
              </Field>
              <Field label="CIF" error={errors.cif}>
                <input
                  value={form.cif}
                  onChange={e => set('cif', e.target.value)}
                  placeholder="B12345678"
                  className="input"
                />
              </Field>
            </div>
          </Section>

          {/* Ubicación */}
          <Section title="Ubicación">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Provincia" required error={errors.province}>
                <select
                  value={form.province}
                  onChange={e => set('province', e.target.value)}
                  className={`input ${errors.province ? 'border-red-300 focus:ring-red-200' : ''}`}
                >
                  <option value="">Seleccionar...</option>
                  {PROVINCES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Municipio" error={errors.city}>
                <input
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Vélez-Málaga"
                  className="input"
                />
              </Field>
              <Field label="Dirección" error={errors.address}>
                <input
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Calle, número, piso"
                  className="input"
                />
              </Field>
              <Field label="Código postal" error={errors.postal_code}>
                <input
                  value={form.postal_code}
                  onChange={e => set('postal_code', e.target.value)}
                  placeholder="29700"
                  maxLength={5}
                  className="input"
                />
              </Field>
            </div>
          </Section>

          {/* Contacto */}
          <Section title="Contacto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Teléfono" error={errors.contact_phone}>
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={e => set('contact_phone', e.target.value)}
                  placeholder="600 000 000"
                  className="input"
                />
              </Field>
              <Field label="Email" error={errors.contact_email}>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={e => set('contact_email', e.target.value)}
                  placeholder="farmacia@ejemplo.com"
                  className="input"
                />
              </Field>
              <Field label="Horario" error={errors.schedule}>
                <input
                  value={form.schedule}
                  onChange={e => set('schedule', e.target.value)}
                  placeholder="L-V 9:00-14:00 / 17:00-20:00"
                  className="input"
                />
              </Field>
            </div>
          </Section>

          {/* Opciones */}
          <Section title="Opciones">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Toggle
                label="Farmacia Viteka"
                checked={form.is_viteka_client}
                onChange={v => set('is_viteka_client', v)}
              />
              <Toggle
                label="Realiza guardias"
                checked={form.has_guards}
                onChange={v => set('has_guards', v)}
              />
              <Toggle
                label="Activa"
                checked={form.is_active}
                onChange={v => set('is_active', v)}
              />
            </div>
          </Section>

          {/* Observaciones */}
          <Section title="Observaciones">
            <textarea
              value={form.observations}
              onChange={e => set('observations', e.target.value)}
              placeholder="Notas internas, avisos, información relevante..."
              rows={4}
              className="input resize-none"
            />
          </Section>

          {/* Error API */}
          {apiError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <button
              type="button"
              onClick={() => navigate('pharmacies')}
              className="btn-secondary"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary min-w-[120px]"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Guardando...
                </span>
              ) : 'Crear farmacia'}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}
