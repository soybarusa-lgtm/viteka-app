import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePharmacies } from '../hooks/usePharmacies'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

// ── Constantes ────────────────────────────────────────────────────────────────
const PROVINCES = [
  { value: 'almeria', label: 'Almería' }, { value: 'cadiz',   label: 'Cádiz' },
  { value: 'cordoba', label: 'Córdoba' }, { value: 'granada', label: 'Granada' },
  { value: 'huelva',  label: 'Huelva' },  { value: 'jaen',    label: 'Jaén' },
  { value: 'malaga',  label: 'Málaga' },  { value: 'sevilla', label: 'Sevilla' },
]

const ERP_OPTIONS = ['Nixfarma','Farmatic','Unycop Next','Farmanager','Unicop Win','vGaleno','Compufarma','Otro']

const CAJA_OPTIONS = [
  { value: 'NO',           label: 'No tiene',     modelos: [] },
  { value: 'Cashlogy',     label: 'Cashlogy',     modelos: ['1000','1500','2023','Maximate','Safe','MaxiSafe','Otro'] },
  { value: 'Cashinfinity', label: 'Cashinfinity', modelos: ['CI-5','CI-10X','CI-100X','Otro'] },
  { value: 'Cashkeeper',   label: 'Cashkeeper',   modelos: ['Compacto','Modular','Otro'] },
  { value: 'CashDro',      label: 'CashDro',      modelos: ['CashDro S','CashDro 4+','CashDro 5','CashDro 7','Otro'] },
  { value: 'CashProtect',  label: 'CashProtect',  modelos: ['CashProtect 400 AS','CashProtect Pro AS','CashProtect PJ','CashProtect POS','CashProtect 1000','Otro'] },
  { value: 'Otro',         label: 'Otro',         modelos: [] },
]

const ESL_OPTIONS = [
  { value: 'NO', label: 'No tiene' }, { value: 'Hanshow', label: 'Hanshow' },
  { value: 'Pricer', label: 'Pricer' }, { value: 'Expofarm', label: 'Expofarm' },
  { value: 'Farmaconnet', label: 'Farmaconnet' }, { value: 'Otro', label: 'Otro' },
]

const BASCULA_OPTIONS     = ['NO','Pondus','Keito','Otro']
const ANTIHURTO_OPTIONS   = ['NO','Checkpoint','Otro']
const CONSULTORIA_OPTIONS = ['NO','Viteka Pro Gestión','Avantia Plus Gestión','Otro']
const ROBOT_OPTIONS       = ['NO','BD Rowa','Gollmann','Meditech','Willach','Fablox','Luse','KLS','Tecnyfarma','Otro']
const CRUZ_OPTIONS        = ['NO','SI','Puede ampliar']
const YEARS  = Array.from({ length: 31 }, (_, i) => 2026 - i)
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Componentes UI ────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
function Input(props) {
  return <input {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
}
function Select({ children, ...props }) {
  return (
    <select {...props} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
      {children}
    </select>
  )
}
function Textarea(props) {
  return <textarea {...props} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
}
function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
function ToggleBtn({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`py-2 px-5 rounded-lg text-sm font-medium border transition-colors ${
        active   ? 'bg-teal-600 text-white border-teal-600' :
        disabled ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' :
                   'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
      }`}
    >{children}</button>
  )
}
function ChipBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
        active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
      }`}
    >{children}</button>
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
function VitekaCheck({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg cursor-pointer select-none">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-teal-600" />
      <span className="text-sm text-teal-800">Viteka es distribuidor / soporte</span>
    </label>
  )
}
function YearSelect({ value, onChange }) {
  return (
    <Select value={value} onChange={onChange}>
      <option value="">Año</option>
      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
    </Select>
  )
}

// ── Bloque de contacto reutilizable ──────────────────────────────────────────
// showGuardsAndSchedule: solo Autónomo y CB
// showSoe: solo Autónomo y CB
function ContactBlock({ data, onChange, showGuardsAndSchedule = false, showSoe = false }) {
  const f = field => e => onChange(field, e && e.target !== undefined ? e.target.value : e)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label>Teléfono</Label><Input value={data.phone} onChange={f('phone')} /></div>
      <div><Label>Email</Label><Input type="email" value={data.email} onChange={f('email')} /></div>
      <div className="sm:col-span-2"><Label>Dirección</Label><Input value={data.address} onChange={f('address')} /></div>
      <div>
        <Label>Provincia</Label>
        <Select value={data.province} onChange={f('province')}>
          <option value="">Seleccionar...</option>
          {PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
      </div>
      <div><Label>Población</Label><Input value={data.city} onChange={f('city')} /></div>
      <div><Label>C.P.</Label><Input value={data.postal_code} onChange={f('postal_code')} /></div>
      {showSoe && <div><Label>SOE</Label><Input value={data.soe} onChange={f('soe')} /></div>}
      {showGuardsAndSchedule && (
        <>
          <div className={showSoe ? '' : 'sm:col-span-2'}>
            <Label>Horario</Label>
            <Input value={data.schedule} onChange={f('schedule')} placeholder="L-V 9:30-14:00 / 17:00-21:00" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox" id={`guards_${data.__key}`}
              checked={data.has_guards}
              onChange={e => onChange('has_guards', e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <label htmlFor={`guards_${data.__key}`} className="text-sm text-gray-700 cursor-pointer">Hace guardias</label>
          </div>
        </>
      )}
      <div className="sm:col-span-2"><Label>Observaciones</Label><Textarea value={data.observations} onChange={f('observations')} /></div>
    </div>
  )
}

// ── Socios CB ─────────────────────────────────────────────────────────────────
function CbOwners({ owners, onChange }) {
  const update = (i, field, val) => onChange(owners.map((o, idx) => idx === i ? { ...o, [field]: val } : o))
  const add    = () => onChange([...owners, { name: '', nif: '', collegiate: '' }])
  const remove = i  => onChange(owners.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {owners.map((o, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg relative">
          <div>
            <Label>{`Nombre titular ${i + 1}`}{i < 2 && <span className="text-red-500">*</span>}</Label>
            <Input value={o.name} onChange={e => update(i,'name',e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <Label>NIF</Label>
            <Input value={o.nif} onChange={e => update(i,'nif',e.target.value)} placeholder="00000000X" />
          </div>
          <div>
            <Label>Nº Colegiado</Label>
            <Input value={o.collegiate} onChange={e => update(i,'collegiate',e.target.value)} />
          </div>
          {i >= 2 && (
            <button type="button" onClick={() => remove(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium">
        <PlusIcon className="w-3.5 h-3.5" /> Añadir titular
      </button>
    </div>
  )
}

// ── Estado inicial ────────────────────────────────────────────────────────────
const mkContact = key => ({ __key: key, phone:'', email:'', address:'', province:'', city:'', postal_code:'', soe:'', schedule:'', has_guards:false, observations:'' })

const INIT = {
  pharmacy_name: '',
  types: ['autonomo'],   // 'autonomo' | 'cb' | 'sl'  (autonomo y cb son excluyentes)
  // Autónomo
  auto: { owner_name: '', nif: '', collegiate_number: '' },
  auto_contact: mkContact('auto'),
  // CB
  cb: { razon_social: '', cif: '', owners: [{ name:'',nif:'',collegiate:'' },{ name:'',nif:'',collegiate:'' }] },
  cb_contact: mkContact('cb'),
  // SL
  sl: { razon_social: '', cif: '' },
  sl_contact: mkContact('sl'),
  // Equipamiento
  erp: 'Nixfarma', erp_viteka: false, erp_satisfaction: '',
  erp_detail: { licencia:'', puestos:'', year:'' },
  caja: 'NO', caja_modelo:'', caja_year:'', caja_viteka:false, caja_satisfaction:'', caja_otro:'',
  esl: 'NO', esl_year:'', esl_viteka:false, esl_satisfaction:'',
  bascula: 'NO', bascula_year:'', bascula_viteka:false, bascula_otro:'',
  antihurto: 'NO', antihurto_year:'', antihurto_otro:'',
  consultoria: 'NO', consultoria_month:'', consultoria_year:'', consultoria_otro:'',
  robot: 'NO', robot_year:'', robot_otro:'',
  cruz: 'NO', cruz_cantidad:'', cruz_ampliacion:'',
  gestor_turnos: 'NO', gestor_turnos_marca:'', gestor_turnos_year:'',
  spd: 'NO', spd_marca:'', spd_year:'',
  pantallas: 'NO', pantallas_marca:'', pantallas_year:'',
  pantallas_interior:false, pantallas_escaparate:false, pantallas_exterior:false,
  frigorifico_marca:'', frigorifico_year:'',
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function NewPharmacyPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { createPharmacy } = usePharmacies(profile?.company_id)
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const hasAuto = form.types.includes('autonomo')
  const hasCb   = form.types.includes('cb')
  const hasSl   = form.types.includes('sl')

  const set       = (k, v)         => setForm(p => ({ ...p, [k]: v }))
  const setNested = (s, k, v)      => setForm(p => ({ ...p, [s]: { ...p[s], [k]: v } }))
  const setContact= (s, k, v)      => setForm(p => ({ ...p, [s]: { ...p[s], [k]: v } }))

  function toggleType(type) {
    setForm(p => {
      const has = p.types.includes(type)
      if (has) {
        if (p.types.length === 1) return p   // al menos 1 tipo activo
        return { ...p, types: p.types.filter(t => t !== type) }
      }
      // autonomo y cb son excluyentes
      if (type === 'autonomo') return { ...p, types: [...p.types.filter(t => t !== 'cb'), 'autonomo'] }
      if (type === 'cb')       return { ...p, types: [...p.types.filter(t => t !== 'autonomo'), 'cb'] }
      return { ...p, types: [...p.types, type] }
    })
  }

  const cajaOpt = CAJA_OPTIONS.find(o => o.value === form.caja)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const legalType    = [...form.types].sort().join('_')
      const mainContact  = hasAuto ? form.auto_contact : hasCb ? form.cb_contact : form.sl_contact

      const payload = {
        pharmacy_name:     form.pharmacy_name,
        legal_type:        legalType,
        is_active:         true,
        owner_name:        hasAuto ? form.auto.owner_name : null,
        nif:               hasAuto ? form.auto.nif : null,
        collegiate_number: hasAuto ? form.auto.collegiate_number : null,
        razon_social:      hasCb ? form.cb.razon_social : (hasSl ? form.sl.razon_social : null),
        cif:               hasCb ? form.cb.cif : (hasSl ? form.sl.cif : null),
        cb_owners:         hasCb ? form.cb.owners : [],
        soe_number:        mainContact.soe,
        schedule:          mainContact.schedule,
        has_guards:        mainContact.has_guards,
        contact_phone:     mainContact.phone,
        contact_email:     mainContact.email,
        address:           mainContact.address,
        province:          mainContact.province,
        city:              mainContact.city,
        postal_code:       mainContact.postal_code,
        observations:      mainContact.observations,
        // Datos SL por separado (JSONB)
        sl_data: hasSl ? {
          razon_social: form.sl.razon_social, cif: form.sl.cif,
          phone: form.sl_contact.phone, email: form.sl_contact.email,
          address: form.sl_contact.address, province: form.sl_contact.province,
          city: form.sl_contact.city, postal_code: form.sl_contact.postal_code,
          observations: form.sl_contact.observations,
        } : null,
      }

      const pharmacy = await createPharmacy(payload)
      const { supabase } = await import('../lib/supabase')

      await supabase.from('pharmacy_equipment').insert({
        pharmacy_id: pharmacy.id, company_id: profile.company_id,
        erp: form.erp, erp_viteka: form.erp_viteka,
        erp_satisfaction: form.erp_satisfaction || null, erp_detail: form.erp_detail,
        caja: form.caja, caja_marca: form.caja, caja_modelo: form.caja_modelo,
        caja_year: form.caja_year || null, caja_viteka: form.caja_viteka,
        caja_satisfaction: form.caja_satisfaction || null,
        esl: form.esl, esl_year: form.esl_year || null,
        esl_viteka: form.esl_viteka, esl_satisfaction: form.esl_satisfaction || null,
        bascula: form.bascula, bascula_year: form.bascula_year || null, bascula_viteka: form.bascula_viteka,
        antihurto: form.antihurto, antihurto_year: form.antihurto_year || null,
        consultoria: form.consultoria,
        consultoria_detail: { month: form.consultoria_month, year: form.consultoria_year, otro: form.consultoria_otro },
        robot: form.robot, robot_year: form.robot_year || null,
        cruz: form.cruz, cruz_cantidad: form.cruz_cantidad || null, cruz_ampliacion: form.cruz_ampliacion || null,
        gestor_turnos: form.gestor_turnos, gestor_turnos_marca: form.gestor_turnos_marca,
        gestor_turnos_year: form.gestor_turnos_year || null,
        spd: form.spd, spd_marca: form.spd_marca, spd_year: form.spd_year || null,
        pantallas: form.pantallas,
        pantallas_detail: {
          marca: form.pantallas_marca, year: form.pantallas_year,
          ubicaciones: ['Interior','Escaparate','Exterior'].filter((_,i) =>
            [form.pantallas_interior, form.pantallas_escaparate, form.pantallas_exterior][i]
          )
        },
        frigorifico_marca: form.frigorifico_marca, frigorifico_year: form.frigorifico_year || null,
      })

      navigate(`/farmacias/${pharmacy.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva farmacia</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── DATOS BÁSICOS + TIPO JURÍDICO ── */}
        <Section title="Datos básicos">
          <div>
            <Label required>Nombre de la farmacia</Label>
            <Input required value={form.pharmacy_name} onChange={e => set('pharmacy_name', e.target.value)} placeholder="Farmacia ..." />
          </div>
          <div>
            <Label required>Tipo jurídico</Label>
            <p className="text-xs text-gray-400 mb-2">Autónomo y C.B. son excluyentes entre sí. La S.L. puede añadirse a cualquiera.</p>
            <div className="flex flex-wrap gap-2">
              <ToggleBtn active={hasAuto} disabled={false} onClick={() => toggleType('autonomo')}>
                {hasAuto ? '✓ ' : ''}Autónomo
              </ToggleBtn>
              <ToggleBtn active={hasCb} disabled={false} onClick={() => toggleType('cb')}>
                {hasCb ? '✓ ' : ''}C.B.
              </ToggleBtn>
              <ToggleBtn active={hasSl} disabled={false} onClick={() => toggleType('sl')}>
                {hasSl ? '✓ ' : ''}S.L.
              </ToggleBtn>
            </div>
            {hasAuto && hasCb && (
              <p className="text-xs text-red-500 mt-1">⚠ Autónomo y C.B. no pueden coexistir.</p>
            )}
          </div>
        </Section>

        {/* ── AUTÓNOMO ── */}
        {hasAuto && (
          <Section title="Autónomo" subtitle="Datos del titular y contacto de la farmacia">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label required>Nombre del titular</Label>
                <Input required value={form.auto.owner_name} onChange={e => setNested('auto','owner_name',e.target.value)} />
              </div>
              <div>
                <Label>NIF</Label>
                <Input value={form.auto.nif} onChange={e => setNested('auto','nif',e.target.value)} placeholder="00000000X" />
              </div>
              <div>
                <Label>Nº Colegiado</Label>
                <Input value={form.auto.collegiate_number} onChange={e => setNested('auto','collegiate_number',e.target.value)} />
              </div>
            </div>
            <hr className="border-gray-100" />
            <p className="text-xs font-medium text-gray-500 -mb-2">Contacto de la farmacia</p>
            <ContactBlock
              data={form.auto_contact}
              onChange={(f,v) => setContact('auto_contact',f,v)}
              showGuardsAndSchedule
              showSoe
            />
          </Section>
        )}

        {/* ── C.B. ── */}
        {hasCb && (
          <Section title="Comunidad de Bienes (C.B.)" subtitle="Datos de la sociedad, titulares y contacto de la farmacia">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre razón social</Label>
                <Input value={form.cb.razon_social} onChange={e => setNested('cb','razon_social',e.target.value)} />
              </div>
              <div>
                <Label>CIF</Label>
                <Input value={form.cb.cif} onChange={e => setNested('cb','cif',e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Titulares</Label>
              <CbOwners owners={form.cb.owners} onChange={val => setNested('cb','owners',val)} />
            </div>
            <hr className="border-gray-100" />
            <p className="text-xs font-medium text-gray-500 -mb-2">Contacto de la farmacia</p>
            <ContactBlock
              data={form.cb_contact}
              onChange={(f,v) => setContact('cb_contact',f,v)}
              showGuardsAndSchedule
              showSoe
            />
          </Section>
        )}

        {/* ── S.L. ── */}
        {hasSl && (
          <Section
            title="Sociedad Limitada (S.L.)"
            subtitle={hasAuto || hasCb ? 'Datos propios de la S.L. — dirección y contacto independiente' : 'Datos de la sociedad y contacto de la farmacia'}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre razón social</Label>
                <Input value={form.sl.razon_social} onChange={e => setNested('sl','razon_social',e.target.value)} />
              </div>
              <div>
                <Label>CIF</Label>
                <Input value={form.sl.cif} onChange={e => setNested('sl','cif',e.target.value)} />
              </div>
            </div>
            <hr className="border-gray-100" />
            <p className="text-xs font-medium text-gray-500 -mb-2">Contacto de la S.L.</p>
            <ContactBlock
              data={form.sl_contact}
              onChange={(f,v) => setContact('sl_contact',f,v)}
              showGuardsAndSchedule={!hasAuto && !hasCb}
              showSoe={!hasAuto && !hasCb}
            />
          </Section>
        )}

        {/* ── ERP ── */}
        <Section title="ERP">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ERP_OPTIONS.map(opt => (
              <ChipBtn key={opt} active={form.erp === opt} onClick={() => set('erp', opt)}>{opt}</ChipBtn>
            ))}
          </div>
          {form.erp === 'Nixfarma' && (
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Licencia</Label><Input value={form.erp_detail.licencia} onChange={e => setNested('erp_detail','licencia',e.target.value)} /></div>
              <div><Label>Nº puestos</Label><Input type="number" min="1" value={form.erp_detail.puestos} onChange={e => setNested('erp_detail','puestos',e.target.value)} /></div>
              <div><Label>Año inicio</Label><YearSelect value={form.erp_detail.year} onChange={e => setNested('erp_detail','year',e.target.value)} /></div>
            </div>
          )}
          <VitekaCheck value={form.erp_viteka} onChange={v => set('erp_viteka', v)} />
          {!form.erp_viteka && (
            <div><Label>Grado de satisfacción con el ERP actual</Label>
              <SatisfactionSelect value={form.erp_satisfaction} onChange={e => set('erp_satisfaction', e.target.value)} />
            </div>
          )}
        </Section>

        {/* ── CAJA DE COBRO ── */}
        <Section title="Caja de cobro">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CAJA_OPTIONS.map(opt => (
              <ChipBtn key={opt.value} active={form.caja === opt.value}
                onClick={() => { set('caja', opt.value); set('caja_modelo','') }}>
                {opt.label}
              </ChipBtn>
            ))}
          </div>
          {form.caja !== 'NO' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cajaOpt?.modelos?.length > 0 && (
                <div>
                  <Label>Modelo</Label>
                  <Select value={form.caja_modelo} onChange={e => set('caja_modelo', e.target.value)}>
                    <option value="">Seleccionar modelo</option>
                    {cajaOpt.modelos.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
              )}
              {form.caja === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.caja_otro} onChange={e => set('caja_otro', e.target.value)} /></div>}
              <div><Label>Año instalación</Label><YearSelect value={form.caja_year} onChange={e => set('caja_year', e.target.value)} /></div>
            </div>
          )}
          {form.caja !== 'NO' && (
            <>
              <VitekaCheck value={form.caja_viteka} onChange={v => set('caja_viteka', v)} />
              {!form.caja_viteka && <div><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.caja_satisfaction} onChange={e => set('caja_satisfaction', e.target.value)} /></div>}
            </>
          )}
        </Section>

        {/* ── ESL ── */}
        <Section title="Etiquetas electrónicas (ESL)">
          <div className="flex flex-wrap gap-2">
            {ESL_OPTIONS.map(opt => (
              <ChipBtn key={opt.value} active={form.esl === opt.value} onClick={() => set('esl', opt.value)}>{opt.label}</ChipBtn>
            ))}
          </div>
          {form.esl !== 'NO' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Año instalación</Label><YearSelect value={form.esl_year} onChange={e => set('esl_year', e.target.value)} /></div>
              <VitekaCheck value={form.esl_viteka} onChange={v => set('esl_viteka', v)} />
              {!form.esl_viteka && <div className="sm:col-span-2"><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.esl_satisfaction} onChange={e => set('esl_satisfaction', e.target.value)} /></div>}
            </div>
          )}
        </Section>

        {/* ── BÁSCULAS ── */}
        <Section title="Básculas">
          <div className="flex flex-wrap gap-2">
            {BASCULA_OPTIONS.map(opt => (
              <ChipBtn key={opt} active={form.bascula === opt} onClick={() => set('bascula', opt)}>{opt === 'NO' ? 'No tiene' : opt}</ChipBtn>
            ))}
          </div>
          {form.bascula !== 'NO' && (
            <div className="grid grid-cols-2 gap-3">
              {form.bascula === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.bascula_otro} onChange={e => set('bascula_otro', e.target.value)} /></div>}
              <div><Label>Año instalación</Label><YearSelect value={form.bascula_year} onChange={e => set('bascula_year', e.target.value)} /></div>
              <VitekaCheck value={form.bascula_viteka} onChange={v => set('bascula_viteka', v)} />
            </div>
          )}
        </Section>

        {/* ── ANTIHURTO ── */}
        <Section title="Arcos antihurto">
          <div className="flex flex-wrap gap-2">
            {ANTIHURTO_OPTIONS.map(opt => (
              <ChipBtn key={opt} active={form.antihurto === opt} onClick={() => set('antihurto', opt)}>{opt === 'NO' ? 'No tiene' : opt}</ChipBtn>
            ))}
          </div>
          {form.antihurto !== 'NO' && (
            <div className="grid grid-cols-2 gap-3">
              {form.antihurto === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.antihurto_otro} onChange={e => set('antihurto_otro', e.target.value)} /></div>}
              <div><Label>Año instalación</Label><YearSelect value={form.antihurto_year} onChange={e => set('antihurto_year', e.target.value)} /></div>
            </div>
          )}
        </Section>

        {/* ── CONSULTORÍA ── */}
        <Section title="Consultoría">
          <div className="flex flex-wrap gap-2">
            {CONSULTORIA_OPTIONS.map(opt => (
              <ChipBtn key={opt} active={form.consultoria === opt} onClick={() => set('consultoria', opt)}>{opt === 'NO' ? 'No tiene' : opt}</ChipBtn>
            ))}
          </div>
          {form.consultoria !== 'NO' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {form.consultoria === 'Otro' && <div className="sm:col-span-3"><Label>Indicar servicio</Label><Input value={form.consultoria_otro} onChange={e => set('consultoria_otro', e.target.value)} /></div>}
              <div>
                <Label>Mes inicio</Label>
                <Select value={form.consultoria_month} onChange={e => set('consultoria_month', e.target.value)}>
                  <option value="">Mes</option>
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </Select>
              </div>
              <div><Label>Año inicio</Label><YearSelect value={form.consultoria_year} onChange={e => set('consultoria_year', e.target.value)} /></div>
            </div>
          )}
        </Section>

        {/* ── ROBOT ── */}
        <Section title="Robot dispensador">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ROBOT_OPTIONS.map(opt => (
              <ChipBtn key={opt} active={form.robot === opt} onClick={() => set('robot', opt)}>{opt === 'NO' ? 'No tiene' : opt}</ChipBtn>
            ))}
          </div>
          {form.robot !== 'NO' && (
            <div className="grid grid-cols-2 gap-3">
              {form.robot === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.robot_otro} onChange={e => set('robot_otro', e.target.value)} /></div>}
              <div><Label>Año instalación</Label><YearSelect value={form.robot_year} onChange={e => set('robot_year', e.target.value)} /></div>
            </div>
          )}
        </Section>

        {/* ── CRUZ ── */}
        <Section title="Cruz luminosa">
          <div className="flex gap-2">
            {CRUZ_OPTIONS.map(opt => (
              <ChipBtn key={opt} active={form.cruz === opt} onClick={() => set('cruz', opt)}>{opt === 'NO' ? 'No tiene' : opt}</ChipBtn>
            ))}
          </div>
          {form.cruz !== 'NO' && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nº cruces</Label><Input type="number" min="1" value={form.cruz_cantidad} onChange={e => set('cruz_cantidad', e.target.value)} /></div>
              {form.cruz === 'Puede ampliar' && <div><Label>Nº ampliación prevista</Label><Input type="number" min="1" value={form.cruz_ampliacion} onChange={e => set('cruz_ampliacion', e.target.value)} /></div>}
            </div>
          )}
        </Section>

        {/* ── GESTOR TURNOS ── */}
        <Section title="Gestor de turnos">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => (
              <ChipBtn key={opt} active={form.gestor_turnos === opt} onClick={() => set('gestor_turnos', opt)}>
                {opt === 'NO' ? 'No tiene' : 'Sí tiene'}
              </ChipBtn>
            ))}
          </div>
          {form.gestor_turnos === 'SI' && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marca</Label><Input value={form.gestor_turnos_marca} onChange={e => set('gestor_turnos_marca', e.target.value)} /></div>
              <div><Label>Año</Label><YearSelect value={form.gestor_turnos_year} onChange={e => set('gestor_turnos_year', e.target.value)} /></div>
            </div>
          )}
        </Section>

        {/* ── SPD ── */}
        <Section title="SPD (Sistema Personalizado de Dosificación)">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => (
              <ChipBtn key={opt} active={form.spd === opt} onClick={() => set('spd', opt)}>
                {opt === 'NO' ? 'No tiene' : 'Sí tiene'}
              </ChipBtn>
            ))}
          </div>
          {form.spd === 'SI' && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marca</Label><Input value={form.spd_marca} onChange={e => set('spd_marca', e.target.value)} /></div>
              <div><Label>Año</Label><YearSelect value={form.spd_year} onChange={e => set('spd_year', e.target.value)} /></div>
            </div>
          )}
        </Section>

        {/* ── PANTALLAS ── */}
        <Section title="Pantallas">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => (
              <ChipBtn key={opt} active={form.pantallas === opt} onClick={() => set('pantallas', opt)}>
                {opt === 'NO' ? 'No tiene' : 'Sí tiene'}
              </ChipBtn>
            ))}
          </div>
          {form.pantallas === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.pantallas_marca} onChange={e => set('pantallas_marca', e.target.value)} /></div>
                <div><Label>Año</Label><YearSelect value={form.pantallas_year} onChange={e => set('pantallas_year', e.target.value)} /></div>
              </div>
              <div>
                <Label>Ubicación (puede seleccionar varias)</Label>
                <div className="flex gap-5 mt-1">
                  {[['pantallas_interior','Interior'],['pantallas_escaparate','Escaparate'],['pantallas_exterior','Exterior']].map(([field, label]) => (
                    <label key={field} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={form[field]} onChange={e => set(field, e.target.checked)} className="w-4 h-4 accent-teal-600" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ── FRIGORÍFICO ── */}
        <Section title="Frigorífico">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Marca</Label><Input value={form.frigorifico_marca} onChange={e => set('frigorifico_marca', e.target.value)} /></div>
            <div><Label>Año</Label><YearSelect value={form.frigorifico_year} onChange={e => set('frigorifico_year', e.target.value)} /></div>
          </div>
        </Section>

        {/* ── SUBMIT ── */}
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
