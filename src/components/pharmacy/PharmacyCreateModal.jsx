import { useState } from 'react'
import { usePharmacies } from '../../hooks/usePharmacies'

const PROVINCES = [
  { value: 'almeria', label: 'Almería' },
  { value: 'cadiz',   label: 'Cádiz'   },
  { value: 'cordoba', label: 'Córdoba' },
  { value: 'granada', label: 'Granada' },
  { value: 'huelva',  label: 'Huelva'  },
  { value: 'jaen',    label: 'Jaén'    },
  { value: 'malaga',  label: 'Málaga'  },
  { value: 'sevilla', label: 'Sevilla' },
]

const BASE_OPTIONS = [
  { value: 'autonomo', label: 'Autónomo' },
  { value: 'cb',       label: 'C.B.'     },
]

function buildLegalType(base, withSl) {
  if (!base) return null
  return withSl ? `${base}_sl` : base
}

const EMPTY = {
  pharmacy_name:     '',
  owner_name:        '',
  nif:               '',
  collegiate_number: '',
  soe_number:        '',
  razon_social:      '',
  cif:               '',
  province:          '',
  city:              '',
  address:           '',
  postal_code:       '',
  contact_phone:     '',
  contact_email:     '',
  schedule:          '',
  has_guards:        false,
  is_active:         true,
  observations:      '',
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

/* Toggle sin herencia de estilos .btn — usa <span> como track */
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && onChange(!checked)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: '36px',
          height: '20px',
          borderRadius: '9999px',
          flexShrink: 0,
          padding: '2px',
          transition: 'background-color 150ms',
          backgroundColor: checked ? '#1c473c' : '#d1d5db',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{
          display: 'block',
          width: '16px',
          height: '16px',
          borderRadius: '9999px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform 150ms',
          flexShrink: 0,
        }} />
      </span>
      <span className="text-sm text-gray-700 leading-none">{label}</span>
    </label>
  )
}

function LegalTypeSelector({ base, withSl, onBase, onSl, error }) {
  return (
    <div>
      {/* Paso 1: Autónomo vs C.B. — excluyentes */}
      <div className="flex gap-2 mb-3">
        {BASE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onBase(base === opt.value ? '' : opt.value)}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
              base === opt.value
                ? 'bg-[#1c473c] text-white border-[#1c473c]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Paso 2: S.L. adicional opcional */}
      <button
        type="button"
        disabled={!base}
        onClick={() => base && onSl(!withSl)}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
          !base
            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
            : withSl
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }`}
      >
        {withSl && base
          ? `✓  ${base === 'autonomo' ? 'Autónomo' : 'C.B.'} + S.L.`
          : '+ Añadir S.L.'}
      </button>

      {base && (
        <p className="mt-2 text-xs text-gray-400">
          Figura: <span className="font-medium text-gray-600">
            {base === 'autonomo' ? 'Autónomo' : 'C.B.'}{withSl ? ' + S.L.' : ''}
          </span>
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function PharmacyCreateModal({ open, onClose, onCreated }) {
  const { createPharmacy } = usePharmacies()

  const [form,     setForm]     = useState(EMPTY)
  const [legalBase,setLegalBase] = useState('')
  const [withSl,   setWithSl]   = useState(false)
  const [errors,   setErrors]   = useState({})
  const [saving,   setSaving]   = useState(false)
  const [apiError, setApiError] = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  function handleClose() {
    setForm(EMPTY); setLegalBase(''); setWithSl(false)
    setErrors({}); setApiError(null)
    onClose()
  }

  function validate() {
    const e = {}
    if (!form.pharmacy_name.trim()) e.pharmacy_name = 'Nombre obligatorio'
    if (!form.province)             e.province      = 'Provincia obligatoria'
    if (!legalBase)                 e.legal_type    = 'Selecciona la figura jurídica'
    return e
  }

  async function handleSubmit(ev) {
    ev?.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true); setApiError(null)
    try {
      const payload = {
        pharmacy_name:     form.pharmacy_name.trim(),
        owner_name:        form.owner_name.trim()        || null,
        nif:               form.nif.trim()               || null,
        collegiate_number: form.collegiate_number.trim() || null,
        soe_number:        form.soe_number.trim()        || null,
        razon_social:      form.razon_social.trim()      || null,
        cif:               form.cif.trim()               || null,
        province:          form.province,
        city:              form.city.trim()              || null,
        address:           form.address.trim()           || null,
        postal_code:       form.postal_code.trim()       || null,
        contact_phone:     form.contact_phone.trim()     || null,
        contact_email:     form.contact_email.trim()     || null,
        schedule:          form.schedule.trim()          || null,
        observations:      form.observations.trim()      || null,
        has_guards:        form.has_guards,
        is_active:         form.is_active,
        legal_type:        buildLegalType(legalBase, withSl),
      }

      const data = await createPharmacy(payload)
      handleClose()
      onCreated?.(data.id)
    } catch (err) {
      console.error(err)
      setApiError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Nueva farmacia</h2>
            <p className="text-xs text-gray-400 mt-0.5">Los campos con * son obligatorios</p>
          </div>
          <button
            type="button" onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 space-y-6">

            {/* Identificación */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Identificación</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre de la farmacia" required error={errors.pharmacy_name}>
                  <input value={form.pharmacy_name} onChange={e => set('pharmacy_name', e.target.value)}
                    placeholder="Farmacia Ejemplo"
                    className={`input ${errors.pharmacy_name ? 'border-red-300 focus:ring-red-200' : ''}`} />
                </Field>
                <Field label="Titular / Farmacéutico">
                  <input value={form.owner_name} onChange={e => set('owner_name', e.target.value)}
                    placeholder="Nombre del titular" className="input" />
                </Field>
                <Field label="NIF titular">
                  <input value={form.nif} onChange={e => set('nif', e.target.value)}
                    placeholder="12345678A" className="input" />
                </Field>
                <Field label="Nº Colegiado">
                  <input value={form.collegiate_number} onChange={e => set('collegiate_number', e.target.value)}
                    placeholder="MA-0000" className="input" />
                </Field>
                <Field label="Nº SOE">
                  <input value={form.soe_number} onChange={e => set('soe_number', e.target.value)}
                    placeholder="Nº SOE" className="input" />
                </Field>
              </div>
            </section>

            {/* Figura jurídica */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Figura jurídica</p>
              <LegalTypeSelector
                base={legalBase} withSl={withSl}
                onBase={v => { setLegalBase(v); if (errors.legal_type) setErrors(e => ({ ...e, legal_type: null })) }}
                onSl={setWithSl}
                error={errors.legal_type}
              />
              {withSl && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Razón social S.L.">
                    <input value={form.razon_social} onChange={e => set('razon_social', e.target.value)}
                      placeholder="Razón social" className="input" />
                  </Field>
                  <Field label="CIF S.L.">
                    <input value={form.cif} onChange={e => set('cif', e.target.value)}
                      placeholder="B12345678" className="input" />
                  </Field>
                </div>
              )}
            </section>

            {/* Ubicación */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Ubicación</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Provincia" required error={errors.province}>
                  <select value={form.province} onChange={e => set('province', e.target.value)}
                    className={`input ${errors.province ? 'border-red-300 focus:ring-red-200' : ''}`}>
                    <option value="">Seleccionar...</option>
                    {PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Field>
                <Field label="Municipio">
                  <input value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="Vélez-Málaga" className="input" />
                </Field>
                <Field label="Dirección">
                  <input value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Calle, número, piso" className="input" />
                </Field>
                <Field label="Código postal">
                  <input value={form.postal_code} onChange={e => set('postal_code', e.target.value)}
                    placeholder="29700" maxLength={5} className="input" />
                </Field>
              </div>
            </section>

            {/* Contacto */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contacto</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Teléfono">
                  <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                    placeholder="600 000 000" className="input" />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                    placeholder="farmacia@ejemplo.com" className="input" />
                </Field>
                <Field label="Horario">
                  <input value={form.schedule} onChange={e => set('schedule', e.target.value)}
                    placeholder="L-V 9:00-14:00 / 17:00-20:00" className="input" />
                </Field>
              </div>
            </section>

            {/* Opciones */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Opciones</p>
              <div className="flex flex-col gap-3">
                <Toggle label="Realiza guardias" checked={form.has_guards}  onChange={v => set('has_guards', v)} />
                <Toggle label="Activa"           checked={form.is_active}   onChange={v => set('is_active', v)} />
              </div>
            </section>

            {/* Observaciones */}
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Observaciones</p>
              <textarea value={form.observations} onChange={e => set('observations', e.target.value)}
                placeholder="Notas internas, avisos..." rows={3} className="input resize-none" />
            </section>

            {apiError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {apiError}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button type="button" onClick={handleClose} className="btn-secondary" disabled={saving}>
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} className="btn-primary min-w-[130px]" disabled={saving}>
            {saving
              ? <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Guardando...
                </span>
              : 'Crear farmacia'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
