import { useState, useEffect } from 'react'
import { usePharmacies } from '../../hooks/usePharmacies'
import { useSpanishLocations } from '../../hooks/useSpanishLocations'

const LEGAL_TYPES = [
  { value: 'autonomo',    label: 'Autónomo' },
  { value: 'cb',          label: 'Comunidad de Bienes (CB)' },
  { value: 'sl',          label: 'Sociedad Limitada (SL)' },
  { value: 'autonomo_sl', label: 'Autónomo + SL' },
  { value: 'cb_sl',       label: 'CB + SL' },
]

const EMPTY = {
  pharmacy_name: '', legal_type: 'autonomo',
  owner_name: '', nif: '', collegiate_number: '', soe_number: '',
  razon_social: '', cif: '', cb_owners: [],
  contact_phone: '', contact_email: '',
  address: '', province: '', city: '', postal_code: '',
  schedule: '', has_guards: false, observations: '',
  is_active: true,
}

/**
 * PharmacyModal — crea o edita una farmacia.
 *
 * Props:
 *   pharmacy  {object|null}  — si se pasa, modo edición; si no, modo creación
 *   onClose   {function}     — callback al cerrar/guardar
 */
export default function PharmacyModal({ pharmacy = null, onClose }) {
  const isEdit = Boolean(pharmacy)
  const { createPharmacy, updatePharmacy } = usePharmacies()
  const { provinces, cities, setSelectedProvince } = useSpanishLocations()

  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...pharmacy } : EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cbOwner, setCbOwner] = useState({ name: '', nif: '', collegiate_number: '' })

  // En modo edición, carga las ciudades de la provincia existente
  useEffect(() => {
    if (isEdit && pharmacy.province) setSelectedProvince(pharmacy.province)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function handleProvinceChange(val) {
    set('province', val)
    set('city', '')
    setSelectedProvince(val)
  }

  function addCbOwner() {
    if (!cbOwner.name) return
    set('cb_owners', [...(form.cb_owners || []), cbOwner])
    setCbOwner({ name: '', nif: '', collegiate_number: '' })
  }

  function removeCbOwner(i) {
    set('cb_owners', (form.cb_owners || []).filter((_, idx) => idx !== i))
  }

  const isAutonomo   = ['autonomo', 'autonomo_sl'].includes(form.legal_type)
  const isCB         = ['cb', 'cb_sl'].includes(form.legal_type)
  const hasSL        = ['sl', 'autonomo_sl', 'cb_sl'].includes(form.legal_type)
  const showOperativa = ['autonomo', 'cb'].includes(form.legal_type)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.pharmacy_name?.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        const { id, company_id, created_at, updated_at, ...payload } = form
        await updatePharmacy(pharmacy.id, payload)
      } else {
        await createPharmacy(form)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const v = field => form[field] ?? ''

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="font-bold text-gray-900">
            {isEdit ? 'Editar farmacia' : 'Nueva farmacia'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-5">

          {/* Datos básicos */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos básicos</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre de la farmacia *</label>
                <input className="input" value={v('pharmacy_name')} onChange={e => set('pharmacy_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Tipo jurídico *</label>
                <select className="input" value={v('legal_type') || 'autonomo'} onChange={e => set('legal_type', e.target.value)}>
                  {LEGAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Autónomo */}
          {isAutonomo && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos autónomo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Nombre titular</label><input className="input" value={v('owner_name')} onChange={e => set('owner_name', e.target.value)} /></div>
                <div><label className="label">NIF</label><input className="input" value={v('nif')} onChange={e => set('nif', e.target.value)} /></div>
                <div><label className="label">Nº Colegiado</label><input className="input" value={v('collegiate_number')} onChange={e => set('collegiate_number', e.target.value)} /></div>
                <div><label className="label">Nº SOE</label><input className="input" value={v('soe_number')} onChange={e => set('soe_number', e.target.value)} /></div>
              </div>
            </section>
          )}

          {/* CB */}
          {isCB && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos CB</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div><label className="label">Razón social</label><input className="input" value={v('razon_social')} onChange={e => set('razon_social', e.target.value)} /></div>
                <div><label className="label">CIF</label><input className="input" value={v('cif')} onChange={e => set('cif', e.target.value)} /></div>
              </div>
              <label className="label">Socios</label>
              {(form.cb_owners || []).map((o, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg mb-1">
                  <span className="flex-1">{o.name} — {o.nif}</span>
                  <button type="button" onClick={() => removeCbOwner(i)} className="text-red-400 hover:text-red-600">×</button>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input className="input" placeholder="Nombre" value={cbOwner.name} onChange={e => setCbOwner(o => ({ ...o, name: e.target.value }))} />
                <input className="input" placeholder="NIF" value={cbOwner.nif} onChange={e => setCbOwner(o => ({ ...o, nif: e.target.value }))} />
                <input className="input" placeholder="Nº Colegiado" value={cbOwner.collegiate_number} onChange={e => setCbOwner(o => ({ ...o, collegiate_number: e.target.value }))} />
              </div>
              <button type="button" onClick={addCbOwner} className="btn-secondary text-xs mt-2">+ Añadir socio</button>
            </section>
          )}

          {/* SL */}
          {hasSL && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos SL</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label">Razón social SL</label><input className="input" value={v('razon_social')} onChange={e => set('razon_social', e.target.value)} /></div>
                <div><label className="label">CIF</label><input className="input" value={v('cif')} onChange={e => set('cif', e.target.value)} /></div>
              </div>
            </section>
          )}

          {/* Contacto */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Teléfono</label><input className="input" type="tel" value={v('contact_phone')} onChange={e => set('contact_phone', e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={v('contact_email')} onChange={e => set('contact_email', e.target.value)} /></div>
            </div>
          </section>

          {/* Ubicación */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ubicación</h3>
            <div className="space-y-3">
              <div><label className="label">Dirección</label><input className="input" value={v('address')} onChange={e => set('address', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Provincia</label>
                  <select className="input" value={v('province')} onChange={e => handleProvinceChange(e.target.value)}>
                    <option value="">Selecciona...</option>
                    {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Municipio</label>
                  <select className="input" value={v('city')} onChange={e => set('city', e.target.value)} disabled={!form.province}>
                    <option value="">Selecciona...</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="w-32">
                <label className="label">Código postal</label>
                <input className="input" value={v('postal_code')} onChange={e => set('postal_code', e.target.value)} maxLength={5} />
              </div>
            </div>
          </section>

          {/* Operativa */}
          {showOperativa && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Operativa</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Horario</label>
                  <input className="input" placeholder="Ej: L-V 9:30-14:00 y 17:00-21:00" value={v('schedule')} onChange={e => set('schedule', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.has_guards ?? false} onChange={e => set('has_guards', e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <span className="text-sm text-gray-700">Realiza guardias</span>
                </label>
                <div>
                  <label className="label">Observaciones</label>
                  <textarea className="input" rows={2} value={v('observations')} onChange={e => set('observations', e.target.value)} />
                </div>
              </div>
            </section>
          )}

          {/* Activa */}
          <section>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active ?? true} onChange={e => set('is_active', e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm text-gray-700 font-medium">Farmacia activa</span>
            </label>
          </section>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </form>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear farmacia'}
          </button>
        </div>
      </div>
    </div>
  )
}
