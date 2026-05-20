import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePharmacies } from '../hooks/usePharmacies'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

// ─── Opciones ──────────────────────────────────────────────────────────────
const PROVINCES = [
  { value: 'almeria', label: 'Almería' }, { value: 'cadiz', label: 'Cádiz' },
  { value: 'cordoba', label: 'Córdoba' }, { value: 'granada', label: 'Granada' },
  { value: 'huelva',  label: 'Huelva' },  { value: 'jaen',    label: 'Jaén' },
  { value: 'malaga',  label: 'Málaga' },  { value: 'sevilla', label: 'Sevilla' },
]

const ERP_OPTIONS = ['Nixfarma','Farmatic','Unycop Next','Farmanager','Unicop Win','vGaleno','Compufarma','Otro']

const CAJA_OPTIONS = [
  { value: 'NO', label: 'No tiene' },
  { value: 'Cashlogy',     label: 'Cashlogy',     modelos: ['1000','1500','2023','Maximate','Safe','MaxiSafe','Otro'] },
  { value: 'Cashinfinity', label: 'Cashinfinity', modelos: ['CI-5','CI-10X','CI-100X','Otro'] },
  { value: 'Cashkeeper',   label: 'Cashkeeper',   modelos: ['Compacto','Modular','Otro'] },
  { value: 'CashDro',      label: 'CashDro',      modelos: ['CashDro S','CashDro 4+','CashDro 5','CashDro 7','Otro'] },
  { value: 'CashProtect',  label: 'CashProtect',  modelos: ['CashProtect 400 AS','CashProtect Pro AS','CashProtect PJ','CashProtect POS','CashProtect 1000','Otro'] },
  { value: 'Otro', label: 'Otro', modelos: [] },
]

const ESL_OPTIONS = [
  { value: 'NO', label: 'No tiene' },
  { value: 'Hanshow',     label: 'Hanshow' },
  { value: 'Pricer',      label: 'Pricer' },
  { value: 'Expofarm',    label: 'Expofarm' },
  { value: 'Farmaconnet', label: 'Farmaconnet' },
  { value: 'Otro',        label: 'Otro' },
]

const BASCULA_OPTIONS  = ['NO','Pondus','Keito','Otro']
const ANTIHURTO_OPTIONS = ['NO','Checkpoint','Otro']
const CONSULTORIA_OPTIONS = ['NO','Viteka Pro Gestión','Avantia Plus Gestión','Otro']
const ROBOT_OPTIONS = ['NO','BD Rowa','Gollmann','Meditech','Willach','Fablox','Luse','KLS','Tecnyfarma','Otro']
const CRUZ_OPTIONS = ['NO','SI','Puede ampliar']
const YEARS = Array.from({ length: 30 }, (_, i) => 2026 - i)

// ─── Helpers ───────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
    >
      {children}
    </select>
  )
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
    />
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">{title}</h2>
      {children}
    </div>
  )
}

function SatisfactionSelect({ value, onChange }) {
  return (
    <Select value={value} onChange={onChange}>
      <option value="">Grado de satisfacción</option>
      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {['Muy malo','Malo','Regular','Bueno','Excelente'][n-1]}</option>)}
    </Select>
  )
}

function VitekaDistributor({ value, onChange, label = 'Viteka es distribuidor/soporte' }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
      <input type="checkbox" id={label} checked={value} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-teal-600" />
      <label htmlFor={label} className="text-sm text-teal-800">{label}</label>
    </div>
  )
}

// ─── Socios CB ─────────────────────────────────────────────────────────────
function CbOwners({ owners, onChange }) {
  function update(i, field, val) {
    const next = owners.map((o, idx) => idx === i ? { ...o, [field]: val } : o)
    onChange(next)
  }
  function add() { onChange([...owners, { name: '', nif: '', collegiate: '' }]) }
  function remove(i) { onChange(owners.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-3">
      {owners.map((o, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg relative">
          <div>
            <Label>Nombre titular {i + 1}{i < 2 && <span className="text-red-500">*</span>}</Label>
            <Input value={o.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <Label>NIF</Label>
            <Input value={o.nif} onChange={e => update(i, 'nif', e.target.value)} placeholder="00000000X" />
          </div>
          <div>
            <Label>Nº Colegiado</Label>
            <Input value={o.collegiate} onChange={e => update(i, 'collegiate', e.target.value)} />
          </div>
          {i >= 2 && (
            <button onClick={() => remove(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800">
        <PlusIcon className="w-3.5 h-3.5" /> Añadir titular
      </button>
    </div>
  )
}

// ─── Estado inicial ────────────────────────────────────────────────────────
const INIT = {
  // Legal
  legal_type: 'autonomo',
  pharmacy_name: '',
  // Autónomo
  owner_name: '', nif: '', collegiate_number: '', soe_number: '',
  // CB
  cb_razon_social: '', cb_cif: '',
  cb_owners: [{ name: '', nif: '', collegiate: '' }, { name: '', nif: '', collegiate: '' }],
  // SL
  sl_razon_social: '', sl_cif: '', sl_phone: '', sl_email: '',
  sl_address: '', sl_province: '', sl_city: '', sl_postal_code: '', sl_observations: '',
  // Contacto farmacia
  contact_phone: '', contact_email: '', address: '', province: '', city: '', postal_code: '',
  schedule: '', has_guards: false, observations: '',
  // ERP
  erp: 'Nixfarma', erp_viteka: false, erp_satisfaction: '',
  erp_detail: { licencia: '', puestos: '', year: '' },
  // Caja
  caja: 'NO', caja_modelo: '', caja_year: '', caja_viteka: false, caja_satisfaction: '', caja_otro: '',
  // ESL
  esl: 'NO', esl_year: '', esl_viteka: false, esl_satisfaction: '',
  // Básculas
  bascula: 'NO', bascula_year: '', bascula_viteka: false, bascula_otro: '',
  // Antihurto
  antihurto: 'NO', antihurto_year: '', antihurto_otro: '',
  // Consultoría
  consultoria: 'NO', consultoria_month: '', consultoria_year: '', consultoria_otro: '',
  // Robot
  robot: 'NO', robot_year: '', robot_otro: '',
  // Cruz
  cruz: 'NO', cruz_cantidad: '', cruz_ampliacion: '',
  // Gestor turnos
  gestor_turnos: 'NO', gestor_turnos_marca: '', gestor_turnos_year: '',
  // SPD
  spd: 'NO', spd_marca: '', spd_year: '',
  // Pantallas
  pantallas: 'NO', pantallas_marca: '', pantallas_year: '',
  pantallas_interior: false, pantallas_escaparate: false, pantallas_exterior: false,
  // Frigorífico
  frigorifico_marca: '', frigorifico_year: '',
}

export default function NewPharmacyPage() {
  const navigate   = useNavigate()
  const { profile } = useAuth()
  const { createPharmacy } = usePharmacies(profile?.company_id)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }
  function setNested(field, subfield, value) {
    setForm(prev => ({ ...prev, [field]: { ...prev[field], [subfield]: value } }))
  }

  const cajaOpt = CAJA_OPTIONS.find(o => o.value === form.caja)
  const showSlSection = form.legal_type === 'sl' || form.legal_type === 'autonomo_sl' || form.legal_type === 'cb_sl'
  const showAutoSection = form.legal_type === 'autonomo' || form.legal_type === 'autonomo_sl'
  const showCbSection   = form.legal_type === 'cb' || form.legal_type === 'cb_sl'

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        pharmacy_name:      form.pharmacy_name,
        legal_type:         form.legal_type,
        is_active:          true,
        owner_name:         showAutoSection ? form.owner_name : null,
        nif:                showAutoSection ? form.nif : null,
        collegiate_number:  showAutoSection ? form.collegiate_number : null,
        soe_number:         form.soe_number,
        razon_social:       (showCbSection ? form.cb_razon_social : null) || (showSlSection ? form.sl_razon_social : null),
        cif:                (showCbSection ? form.cb_cif : null) || (showSlSection ? form.sl_cif : null),
        cb_owners:          showCbSection ? form.cb_owners : [],
        contact_phone:      form.contact_phone,
        contact_email:      form.contact_email,
        address:            form.address,
        city:               form.city,
        province:           form.province,
        postal_code:        form.postal_code,
        schedule:           form.schedule,
        has_guards:         form.has_guards,
        observations:       form.observations,
      }
      const pharmacy = await createPharmacy(payload)

      // Guardar equipamiento
      const { supabase } = await import('../lib/supabase')
      await supabase.from('pharmacy_equipment').insert({
        pharmacy_id: pharmacy.id,
        company_id:  profile.company_id,
        erp:          form.erp,
        erp_viteka:   form.erp_viteka,
        erp_satisfaction: form.erp_satisfaction || null,
        erp_detail:   form.erp_detail,
        caja:         form.caja,
        caja_marca:   form.caja,
        caja_modelo:  form.caja_modelo,
        caja_year:    form.caja_year || null,
        caja_viteka:  form.caja_viteka,
        caja_satisfaction: form.caja_satisfaction || null,
        esl:          form.esl,
        esl_year:     form.esl_year || null,
        esl_viteka:   form.esl_viteka,
        esl_satisfaction: form.esl_satisfaction || null,
        bascula:      form.bascula,
        bascula_year: form.bascula_year || null,
        bascula_viteka: form.bascula_viteka,
        antihurto:    form.antihurto,
        antihurto_year: form.antihurto_year || null,
        consultoria:  form.consultoria,
        consultoria_detail: { month: form.consultoria_month, year: form.consultoria_year, otro: form.consultoria_otro },
        robot:        form.robot,
        robot_year:   form.robot_year || null,
        cruz:         form.cruz,
        cruz_cantidad: form.cruz_cantidad || null,
        cruz_ampliacion: form.cruz_ampliacion || null,
        gestor_turnos: form.gestor_turnos,
        gestor_turnos_marca: form.gestor_turnos_marca,
        gestor_turnos_year: form.gestor_turnos_year || null,
        spd:          form.spd,
        spd_marca:    form.spd_marca,
        spd_year:     form.spd_year || null,
        pantallas:    form.pantallas,
        pantallas_detail: {
          marca: form.pantallas_marca, year: form.pantallas_year,
          ubicaciones: [
            form.pantallas_interior   && 'Interior',
            form.pantallas_escaparate && 'Escaparate',
            form.pantallas_exterior   && 'Exterior',
          ].filter(Boolean)
        },
        frigorifico_marca: form.frigorifico_marca,
        frigorifico_year:  form.frigorifico_year || null,
      })

      navigate(`/farmacias/${pharmacy.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-20">
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva farmacia</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Tipo jurídico ── */}
        <Section title="Tipo jurídico">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { value: 'autonomo',    label: 'Autónomo' },
              { value: 'cb',         label: 'C.B.' },
              { value: 'sl',         label: 'S.L.' },
              { value: 'autonomo_sl',label: 'Autónomo + S.L.' },
              { value: 'cb_sl',      label: 'C.B. + S.L.' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('legal_type', opt.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  form.legal_type === opt.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <Label required>Nombre de la farmacia</Label>
            <Input
              required
              value={form.pharmacy_name}
              onChange={e => set('pharmacy_name', e.target.value)}
              placeholder="Farmacia ..."
            />
          </div>
        </Section>

        {/* ── Autónomo ── */}
        {showAutoSection && (
          <Section title="Datos del titular (Autónomo)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label required>Nombre del titular</Label>
                <Input value={form.owner_name} onChange={e => set('owner_name', e.target.value)} required={showAutoSection} />
              </div>
              <div>
                <Label>NIF</Label>
                <Input value={form.nif} onChange={e => set('nif', e.target.value)} placeholder="00000000X" />
              </div>
              <div>
                <Label>Nº Colegiado</Label>
                <Input value={form.collegiate_number} onChange={e => set('collegiate_number', e.target.value)} />
              </div>
              <div>
                <Label>SOE</Label>
                <Input value={form.soe_number} onChange={e => set('soe_number', e.target.value)} />
              </div>
            </div>
          </Section>
        )}

        {/* ── C.B. ── */}
        {showCbSection && (
          <Section title="Datos de la C.B.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Razón social</Label>
                <Input value={form.cb_razon_social} onChange={e => set('cb_razon_social', e.target.value)} />
              </div>
              <div>
                <Label>CIF</Label>
                <Input value={form.cb_cif} onChange={e => set('cb_cif', e.target.value)} />
              </div>
            </div>
            <Label>Titulares</Label>
            <CbOwners owners={form.cb_owners} onChange={val => set('cb_owners', val)} />
          </Section>
        )}

        {/* ── S.L. ── */}
        {showSlSection && (
          <Section title="Datos de la S.L.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Razón social</Label>
                <Input value={form.sl_razon_social} onChange={e => set('sl_razon_social', e.target.value)} />
              </div>
              <div>
                <Label>CIF</Label>
                <Input value={form.sl_cif} onChange={e => set('sl_cif', e.target.value)} />
              </div>
              <div>
                <Label>Teléfono S.L.</Label>
                <Input value={form.sl_phone} onChange={e => set('sl_phone', e.target.value)} />
              </div>
              <div>
                <Label>Email S.L.</Label>
                <Input type="email" value={form.sl_email} onChange={e => set('sl_email', e.target.value)} />
              </div>
            </div>
          </Section>
        )}

        {/* ── Contacto farmacia ── */}
        <Section title="Contacto y ubicación">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div>
              <Label>Provincia</Label>
              <Select value={form.province} onChange={e => set('province', e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Población</Label>
              <Input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <Label>C.P.</Label>
              <Input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} />
            </div>
            <div>
              <Label>Horario</Label>
              <Input value={form.schedule} onChange={e => set('schedule', e.target.value)} placeholder="L-V 9:30-14:00 / 17:00-21:00" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="guards" checked={form.has_guards} onChange={e => set('has_guards', e.target.checked)} className="w-4 h-4 accent-teal-600" />
              <label htmlFor="guards" className="text-sm text-gray-700">Hace guardias</label>
            </div>
            <div className="sm:col-span-2">
              <Label>Observaciones</Label>
              <Textarea value={form.observations} onChange={e => set('observations', e.target.value)} />
            </div>
          </div>
        </Section>

        {/* ── ERP ── */}
        <Section title="ERP">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ERP_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => set('erp', opt)}
                className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                  form.erp === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt}</button>
            ))}
          </div>
          {form.erp === 'Nixfarma' && (
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div><Label>Licencia</Label><Input value={form.erp_detail.licencia} onChange={e => setNested('erp_detail','licencia',e.target.value)} /></div>
              <div><Label>Nº puestos</Label><Input type="number" value={form.erp_detail.puestos} onChange={e => setNested('erp_detail','puestos',e.target.value)} /></div>
              <div><Label>Año inicio</Label>
                <Select value={form.erp_detail.year} onChange={e => setNested('erp_detail','year',e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          )}
          <VitekaDistributor value={form.erp_viteka} onChange={v => set('erp_viteka', v)} />
          {!form.erp_viteka && (
            <div><Label>Grado de satisfacción con el ERP actual</Label>
              <SatisfactionSelect value={form.erp_satisfaction} onChange={e => set('erp_satisfaction', e.target.value)} />
            </div>
          )}
        </Section>

        {/* ── Caja de cobro ── */}
        <Section title="Caja de cobro">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CAJA_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => { set('caja', opt.value); set('caja_modelo','') }}
                className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                  form.caja === opt.value ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt.label}</button>
            ))}
          </div>
          {form.caja !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {cajaOpt?.modelos?.length > 0 && (
                <div><Label>Modelo</Label>
                  <Select value={form.caja_modelo} onChange={e => set('caja_modelo', e.target.value)}>
                    <option value="">Seleccionar modelo</option>
                    {cajaOpt.modelos.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
              )}
              {form.caja === 'Otro' && (
                <div><Label>Indicar marca</Label><Input value={form.caja_otro} onChange={e => set('caja_otro', e.target.value)} /></div>
              )}
              <div><Label>Año instalación</Label>
                <Select value={form.caja_year} onChange={e => set('caja_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          )}
          {form.caja !== 'NO' && (
            <>
              <VitekaDistributor value={form.caja_viteka} onChange={v => set('caja_viteka', v)} />
              {!form.caja_viteka && (
                <div><Label>Grado de satisfacción</Label>
                  <SatisfactionSelect value={form.caja_satisfaction} onChange={e => set('caja_satisfaction', e.target.value)} />
                </div>
              )}
            </>
          )}
        </Section>

        {/* ── ESL ── */}
        <Section title="Etiquetas electrónicas (ESL)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ESL_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => set('esl', opt.value)}
                className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                  form.esl === opt.value ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt.label}</button>
            ))}
          </div>
          {form.esl !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><Label>Año instalación</Label>
                <Select value={form.esl_year} onChange={e => set('esl_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <VitekaDistributor value={form.esl_viteka} onChange={v => set('esl_viteka', v)} />
              </div>
              {!form.esl_viteka && (
                <div><Label>Grado de satisfacción</Label>
                  <SatisfactionSelect value={form.esl_satisfaction} onChange={e => set('esl_satisfaction', e.target.value)} />
                </div>
              )}
            </div>
          )}
        </Section>

        {/* ── Básculas ── */}
        <Section title="Básculas">
          <div className="flex gap-2 flex-wrap">
            {BASCULA_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => set('bascula', opt)}
                className={`py-1.5 px-4 rounded-lg text-sm border transition-colors ${
                  form.bascula === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt === 'NO' ? 'No tiene' : opt}</button>
            ))}
          </div>
          {form.bascula !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {form.bascula === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.bascula_otro} onChange={e => set('bascula_otro', e.target.value)} /></div>}
              <div><Label>Año instalación</Label>
                <Select value={form.bascula_year} onChange={e => set('bascula_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
              <VitekaDistributor value={form.bascula_viteka} onChange={v => set('bascula_viteka', v)} />
            </div>
          )}
        </Section>

        {/* ── Antihurto ── */}
        <Section title="Arcos antihurto">
          <div className="flex gap-2 flex-wrap">
            {ANTIHURTO_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => set('antihurto', opt)}
                className={`py-1.5 px-4 rounded-lg text-sm border transition-colors ${
                  form.antihurto === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt === 'NO' ? 'No tiene' : opt}</button>
            ))}
          </div>
          {form.antihurto !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {form.antihurto === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.antihurto_otro} onChange={e => set('antihurto_otro', e.target.value)} /></div>}
              <div><Label>Año instalación</Label>
                <Select value={form.antihurto_year} onChange={e => set('antihurto_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          )}
        </Section>

        {/* ── Consultoría ── */}
        <Section title="Consultoría">
          <div className="flex gap-2 flex-wrap">
            {CONSULTORIA_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => set('consultoria', opt)}
                className={`py-1.5 px-4 rounded-lg text-sm border transition-colors ${
                  form.consultoria === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt === 'NO' ? 'No tiene' : opt}</button>
            ))}
          </div>
          {form.consultoria !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {form.consultoria === 'Otro' && <div><Label>Indicar servicio</Label><Input value={form.consultoria_otro} onChange={e => set('consultoria_otro', e.target.value)} /></div>}
              <div><Label>Mes inicio</Label>
                <Select value={form.consultoria_month} onChange={e => set('consultoria_month', e.target.value)}>
                  <option value="">Mes</option>
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </Select>
              </div>
              <div><Label>Año inicio</Label>
                <Select value={form.consultoria_year} onChange={e => set('consultoria_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          )}
        </Section>

        {/* ── Robot dispensador ── */}
        <Section title="Robot dispensador">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ROBOT_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => set('robot', opt)}
                className={`py-1.5 px-3 rounded-lg text-sm border transition-colors ${
                  form.robot === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt === 'NO' ? 'No tiene' : opt}</button>
            ))}
          </div>
          {form.robot !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {form.robot === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.robot_otro} onChange={e => set('robot_otro', e.target.value)} /></div>}
              <div><Label>Año instalación</Label>
                <Select value={form.robot_year} onChange={e => set('robot_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          )}
        </Section>

        {/* ── Cruz ── */}
        <Section title="Cruz luminosa">
          <div className="flex gap-2">
            {CRUZ_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => set('cruz', opt)}
                className={`py-1.5 px-4 rounded-lg text-sm border transition-colors ${
                  form.cruz === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt}</button>
            ))}
          </div>
          {form.cruz !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><Label>Nº cruces</Label><Input type="number" min="1" value={form.cruz_cantidad} onChange={e => set('cruz_cantidad', e.target.value)} /></div>
              {form.cruz === 'Puede ampliar' && <div><Label>Nº ampliación prevista</Label><Input type="number" min="1" value={form.cruz_ampliacion} onChange={e => set('cruz_ampliacion', e.target.value)} /></div>}
            </div>
          )}
        </Section>

        {/* ── Gestor de turnos ── */}
        <Section title="Gestor de turnos">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => (
              <button key={opt} type="button" onClick={() => set('gestor_turnos', opt)}
                className={`py-1.5 px-6 rounded-lg text-sm border transition-colors ${
                  form.gestor_turnos === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt === 'NO' ? 'No tiene' : 'Sí tiene'}</button>
            ))}
          </div>
          {form.gestor_turnos === 'SI' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><Label>Marca</Label><Input value={form.gestor_turnos_marca} onChange={e => set('gestor_turnos_marca', e.target.value)} /></div>
              <div><Label>Año</Label>
                <Select value={form.gestor_turnos_year} onChange={e => set('gestor_turnos_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          )}
        </Section>

        {/* ── SPD ── */}
        <Section title="SPD (Sistema Personalizado de Dosificación)">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => (
              <button key={opt} type="button" onClick={() => set('spd', opt)}
                className={`py-1.5 px-6 rounded-lg text-sm border transition-colors ${
                  form.spd === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt === 'NO' ? 'No tiene' : 'Sí tiene'}</button>
            ))}
          </div>
          {form.spd === 'SI' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><Label>Marca</Label><Input value={form.spd_marca} onChange={e => set('spd_marca', e.target.value)} /></div>
              <div><Label>Año</Label>
                <Select value={form.spd_year} onChange={e => set('spd_year', e.target.value)}>
                  <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </Select>
              </div>
            </div>
          )}
        </Section>

        {/* ── Pantallas ── */}
        <Section title="Pantallas">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => (
              <button key={opt} type="button" onClick={() => set('pantallas', opt)}
                className={`py-1.5 px-6 rounded-lg text-sm border transition-colors ${
                  form.pantallas === opt ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}>{opt === 'NO' ? 'No tiene' : 'Sí tiene'}</button>
            ))}
          </div>
          {form.pantallas === 'SI' && (
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.pantallas_marca} onChange={e => set('pantallas_marca', e.target.value)} /></div>
                <div><Label>Año</Label>
                  <Select value={form.pantallas_year} onChange={e => set('pantallas_year', e.target.value)}>
                    <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label>Ubicación (puede seleccionar varias)</Label>
                <div className="flex gap-4 mt-1">
                  {[['pantallas_interior','Interior'],['pantallas_escaparate','Escaparate'],['pantallas_exterior','Exterior']].map(([field, label]) => (
                    <label key={field} className="flex items-center gap-1.5 text-sm text-gray-700">
                      <input type="checkbox" checked={form[field]} onChange={e => set(field, e.target.checked)} className="w-4 h-4 accent-teal-600" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ── Frigorífico ── */}
        <Section title="Frigorífico">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Marca</Label><Input value={form.frigorifico_marca} onChange={e => set('frigorifico_marca', e.target.value)} /></div>
            <div><Label>Año</Label>
              <Select value={form.frigorifico_year} onChange={e => set('frigorifico_year', e.target.value)}>
                <option value="">Año</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
          </div>
        </Section>

        {/* ── Submit ── */}
        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : 'Crear farmacia'}
          </button>
        </div>

      </form>
    </div>
  )
}
