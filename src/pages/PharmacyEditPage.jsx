import { useCallback, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import {
  Label, Input, Select, Section, ToggleBtn, ChipBtn,
  SatisfactionSelect, VitekaCheck, YearSelect,
} from '../components/pharmacy/PharmacyFormAtoms'
import ContactBlock from '../components/pharmacy/ContactBlock'
import CbOwners from '../components/pharmacy/CbOwners'
import DistribuidorBlock from '../components/pharmacy/DistribuidorBlock'
import {
  ERP_OPTIONS, CAJA_OPTIONS, ESL_OPTIONS, BASCULA_OPTIONS, ANTIHURTO_OPTIONS,
  CONSULTORIA_OPTIONS, MONTHS, mkContact,
} from '../components/pharmacy/PHARMACY_CONSTANTS'
import { serializeScheduleValue } from '../lib/pharmacySchedule'

// Columnas reales confirmadas:
// erp | erp_viteka | erp_satisfaction | erp_detail
// caja | caja_marca | caja_modelo | caja_year | caja_viteka | caja_satisfaction | cash_detail
// esl | esl_year | esl_viteka | esl_satisfaction | esl_detail
// bascula | bascula_year | bascula_viteka | scale_detail
// antihurto | antihurto_year | antitheft_detail
// consultoria | consultoria_detail | consultoria_viteka | consulting_detail
// robot | robot_year | robot_detail
// cruz | cruz_cantidad | cruz_ampliacion
// gestor_turnos | gestor_turnos_marca | gestor_turnos_year | queue_detail
// spd | spd_marca | spd_year | spd_detail
// pantallas | pantallas_detail | screens_detail
// frigorifico_marca | frigorifico_year | frigorifico_viteka | frigorifico_satisfaction | fridge_detail

function mkDetail(base = {}) {
  return { distribuidor: '', val_distribuidor: '', soporte: '', val_soporte: '', anotaciones: '', ...base }
}

function pharmacyToForm(ph, eq) {
  const lType    = ph.legal_type || 'autonomo'
  const types    = lType.split('_')
  const hasAuto  = types.includes('autonomo')
  const hasCb    = types.includes('cb')
  const sl       = ph.sl_data || {}
  const cbOwners = Array.isArray(ph.cb_owners) && ph.cb_owners.length >= 2
    ? ph.cb_owners
    : [{ name: '', nif: '', collegiate: '' }, { name: '', nif: '', collegiate: '' }]
  const mainData = {
    contact_phone: ph.contact_phone, contact_email: ph.contact_email,
    address: ph.address, province: ph.province, city: ph.city,
    postal_code: ph.postal_code, soe_number: ph.soe_number,
    schedule: ph.schedule, has_guards: ph.has_guards, observations: ph.observations,
  }
  const pant_d = eq?.pantallas_detail || {}
  const locs   = pant_d.ubicaciones || []

  return {
    pharmacy_name: ph.pharmacy_name || '',
    types,
    auto: { owner_name: ph.owner_name || '', nif: ph.nif || '', collegiate_number: ph.collegiate_number || '' },
    auto_contact: mkContact('auto', hasAuto ? mainData : {}),
    cb: { razon_social: ph.razon_social || '', cif: ph.cif || '', owners: cbOwners },
    cb_contact: mkContact('cb', hasCb ? mainData : {}),
    sl: { razon_social: sl.razon_social || '', cif: sl.cif || '' },
    sl_contact: mkContact('sl', sl),

    // ERP
    erp:              eq?.erp || 'Nixfarma',
    erp_viteka:       eq?.erp_viteka || false,
    erp_satisfaction: eq?.erp_satisfaction || '',
    erp_detail:       mkDetail(eq?.erp_detail || {}),
    erp_license:      eq?.erp_detail?.licencia || '',
    erp_seats:        eq?.erp_detail?.puestos  || '',
    erp_start_year:   eq?.erp_detail?.year     || '',

    // Caja
    caja:              eq?.caja || 'NO',
    caja_modelo:       eq?.caja_modelo || '',
    caja_year:         eq?.caja_year || '',
    caja_viteka:       eq?.caja_viteka || false,
    caja_satisfaction: eq?.caja_satisfaction || '',
    cash_detail:       mkDetail(eq?.cash_detail || {}),
    caja_otro: '',

    // ESL
    esl:              eq?.esl || 'NO',
    esl_year:         eq?.esl_year || '',
    esl_viteka:       eq?.esl_viteka || false,
    esl_satisfaction: eq?.esl_satisfaction || '',
    esl_detail:       mkDetail(eq?.esl_detail || {}),

    // Básculas
    bascula:        eq?.bascula || 'NO',
    bascula_year:   eq?.bascula_year || '',
    bascula_viteka: eq?.bascula_viteka || false,
    scale_detail:   mkDetail(eq?.scale_detail || {}),
    bascula_otro: '',

    // Antihurto
    antihurto:        eq?.antihurto || 'NO',
    antihurto_year:   eq?.antihurto_year || '',
    antihurto_otro: '',
    antitheft_detail: mkDetail(eq?.antitheft_detail || {}),

    // Consultoría
    consultoria:       eq?.consultoria || 'NO',
    consultoria_month: eq?.consultoria_detail?.month || '',
    consultoria_year:  eq?.consultoria_detail?.year  || '',
    consultoria_otro:  eq?.consultoria_detail?.otro  || '',
    consultoria_viteka: eq?.consultoria_viteka || false,
    consulting_detail: mkDetail(eq?.consulting_detail || {}),

    // Robot
    robot:        eq?.robot || 'NO',
    robot_year:   eq?.robot_year || '',
    robot_otro: '',
    robot_detail: mkDetail(eq?.robot_detail || {}),

    // Cruz
    cruz:               eq?.cruz || 'NO',
    cruz_cantidad:      eq?.cruz_cantidad || '',
    cruz_ampliacion:    eq?.cruz_ampliacion || '',

    // Gestor turnos
    gestor_turnos:       eq?.gestor_turnos || 'NO',
    gestor_turnos_marca: eq?.gestor_turnos_marca || '',
    gestor_turnos_year:  eq?.gestor_turnos_year || '',
    queue_detail:        mkDetail(eq?.queue_detail || {}),

    // SPD
    spd:        eq?.spd || 'NO',
    spd_marca:  eq?.spd_marca || '',
    spd_year:   eq?.spd_year || '',
    spd_detail: mkDetail(eq?.spd_detail || {}),

    // Pantallas
    pantallas:           eq?.pantallas || 'NO',
    pantallas_marca:     pant_d.marca || '',
    pantallas_year:      pant_d.year  || '',
    pantallas_interior:  locs.includes('Interior'),
    pantallas_escaparate:locs.includes('Escaparate'),
    pantallas_exterior:  locs.includes('Exterior'),
    screens_detail:      mkDetail(eq?.screens_detail || {}),

    // Frigorífico
    frigorifico_marca:         eq?.frigorifico_marca || '',
    frigorifico_year:          eq?.frigorifico_year || '',
    frigorifico_viteka:        eq?.frigorifico_viteka || false,
    frigorifico_satisfaction:  eq?.frigorifico_satisfaction || '',
    fridge_detail:             mkDetail(eq?.fridge_detail || {}),
  }
}

export default function PharmacyEditPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const [form,    setForm]    = useState(null)
  const [eqId,    setEqId]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const set       = useCallback((k, v)    => setForm(p => ({ ...p, [k]: v })), [])
  const setNested = useCallback((s, k, v) => setForm(p => ({ ...p, [s]: { ...p[s], [k]: v } })), [])
  const setContact= useCallback((s, k, v) => setForm(p => ({ ...p, [s]: { ...p[s], [k]: v } })), [])
  const setDetail = useCallback((section, key, val) =>
    setForm(p => ({ ...p, [section]: { ...p[section], [key]: val } })), [])

  const toggleType = useCallback(type => {
    setForm(p => {
      const has = p.types.includes(type)
      if (has) {
        if (p.types.length === 1) return p
        return { ...p, types: p.types.filter(t => t !== type) }
      }
      if (type === 'autonomo') return { ...p, types: [...p.types.filter(t => t !== 'cb'), 'autonomo'] }
      if (type === 'cb')       return { ...p, types: [...p.types.filter(t => t !== 'autonomo'), 'cb'] }
      return { ...p, types: [...p.types, type] }
    })
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      const { data: ph, error: phErr } = await supabase
        .from('pharmacies').select('*').eq('id', id).single()
      if (phErr) { toast(phErr.message, 'error', 5500); setLoading(false); return }
      const { data: eq } = await supabase
        .from('pharmacy_equipment').select('*').eq('pharmacy_id', id).maybeSingle()
      if (!cancelled) {
        setForm(pharmacyToForm(ph, eq))
        setEqId(eq?.id || null)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, toast])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!form) return <div className="p-6 text-gray-500">Farmacia no encontrada.</div>

  const hasAuto = form.types.includes('autonomo')
  const hasCb   = form.types.includes('cb')
  const hasSl   = form.types.includes('sl')
  const cajaOpt = CAJA_OPTIONS.find(o => o.value === form.caja)

  function resolveDetail(detail, isViteka) {
    if (!isViteka) return detail
    return { ...detail, distribuidor: 'Viteka', soporte: 'Viteka' }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const legalType   = [...form.types].sort().join('_')
      const mainContact = hasAuto ? form.auto_contact : hasCb ? form.cb_contact : form.sl_contact

      const pharmacyPayload = {
        pharmacy_name: form.pharmacy_name, legal_type: legalType,
        owner_name: hasAuto ? form.auto.owner_name : null,
        nif: hasAuto ? form.auto.nif : null,
        collegiate_number: hasAuto ? form.auto.collegiate_number : null,
        razon_social: hasCb ? form.cb.razon_social : (hasSl && !hasAuto && !hasCb ? form.sl.razon_social : null),
        cif: hasCb ? form.cb.cif : (hasSl && !hasAuto && !hasCb ? form.sl.cif : null),
        cb_owners: hasCb ? form.cb.owners : [],
        soe_number: mainContact.soe,
        schedule: serializeScheduleValue({
          detail: mainContact.schedule_detail,
          summary: mainContact.schedule,
          rawValue: mainContact.schedule_raw,
          guardNotes: mainContact.has_guards ? mainContact.guard_notes : '',
        }),
        has_guards: mainContact.has_guards, contact_phone: mainContact.phone,
        contact_email: mainContact.email, address: mainContact.address,
        province: mainContact.province, city: mainContact.city,
        postal_code: mainContact.postal_code, observations: mainContact.observations,
        sl_data: hasSl ? {
          razon_social: form.sl.razon_social, cif: form.sl.cif,
          phone: form.sl_contact.phone, email: form.sl_contact.email,
          address: form.sl_contact.address, province: form.sl_contact.province,
          city: form.sl_contact.city, postal_code: form.sl_contact.postal_code,
          observations: form.sl_contact.observations,
        } : null,
      }

      const { error: phErr } = await supabase.from('pharmacies').update(pharmacyPayload).eq('id', id)
      if (phErr) throw phErr

      const eqPayload = {
        pharmacy_id: id,

        erp:              form.erp,
        erp_viteka:       form.erp_viteka,
        erp_satisfaction: form.erp_satisfaction ? Number(form.erp_satisfaction) : null,
        erp_detail: resolveDetail({
          ...form.erp_detail,
          licencia: form.erp_license,
          puestos:  form.erp_seats,
          year:     form.erp_start_year,
        }, form.erp_viteka),

        caja:              form.caja,
        caja_marca:        form.caja,
        caja_modelo:       form.caja_modelo || null,
        caja_year:         form.caja_year ? Number(form.caja_year) : null,
        caja_viteka:       form.caja_viteka,
        caja_satisfaction: form.caja_satisfaction ? Number(form.caja_satisfaction) : null,
        cash_detail:       resolveDetail(form.cash_detail, form.caja_viteka),

        esl:              form.esl,
        esl_year:         form.esl_year ? Number(form.esl_year) : null,
        esl_viteka:       form.esl_viteka,
        esl_satisfaction: form.esl_satisfaction ? Number(form.esl_satisfaction) : null,
        esl_detail:       resolveDetail(form.esl_detail, form.esl_viteka),

        bascula:        form.bascula,
        bascula_year:   form.bascula_year ? Number(form.bascula_year) : null,
        bascula_viteka: form.bascula_viteka,
        scale_detail:   resolveDetail(form.scale_detail, form.bascula_viteka),

        antihurto:        form.antihurto,
        antihurto_year:   form.antihurto_year ? Number(form.antihurto_year) : null,
        antitheft_detail: form.antitheft_detail,

        consultoria:        form.consultoria,
        consultoria_viteka: form.consultoria_viteka,
        consultoria_detail: {
          month: form.consultoria_month,
          year:  form.consultoria_year,
          otro:  form.consultoria_otro,
        },
        consulting_detail: resolveDetail(form.consulting_detail, form.consultoria_viteka),

        robot:        form.robot,
        robot_year:   form.robot_year ? Number(form.robot_year) : null,
        robot_detail: form.robot_detail,

        cruz:            form.cruz,
        cruz_cantidad:   form.cruz_cantidad   ? Number(form.cruz_cantidad)   : null,
        cruz_ampliacion: form.cruz_ampliacion ? Number(form.cruz_ampliacion) : null,

        gestor_turnos:       form.gestor_turnos,
        gestor_turnos_marca: form.gestor_turnos_marca || null,
        gestor_turnos_year:  form.gestor_turnos_year ? Number(form.gestor_turnos_year) : null,
        queue_detail:        form.queue_detail,

        spd:        form.spd,
        spd_marca:  form.spd_marca || null,
        spd_year:   form.spd_year ? Number(form.spd_year) : null,
        spd_detail: form.spd_detail,

        pantallas: form.pantallas,
        pantallas_detail: {
          marca: form.pantallas_marca,
          year:  form.pantallas_year,
          ubicaciones: ['Interior','Escaparate','Exterior'].filter(
            (_,i) => [form.pantallas_interior, form.pantallas_escaparate, form.pantallas_exterior][i]
          ),
        },
        screens_detail: form.screens_detail,

        frigorifico_marca:        form.frigorifico_marca || null,
        frigorifico_year:         form.frigorifico_year ? Number(form.frigorifico_year) : null,
        frigorifico_viteka:       form.frigorifico_viteka,
        frigorifico_satisfaction: form.frigorifico_satisfaction ? Number(form.frigorifico_satisfaction) : null,
        fridge_detail:            resolveDetail(form.fridge_detail, form.frigorifico_viteka),
      }

      if (eqId) {
        const { error: eqErr } = await supabase.from('pharmacy_equipment').update(eqPayload).eq('id', eqId)
        if (eqErr) throw eqErr
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        const { error: eqErr } = await supabase.from('pharmacy_equipment').insert({ ...eqPayload, company_id: profile.company_id })
        if (eqErr) throw eqErr
      }

      toast(`Cambios en "${form.pharmacy_name}" guardados correctamente`, 'success')
      navigate(`/farmacias/${id}`)
    } catch (err) {
      toast(err.message || 'Error al guardar los cambios', 'error', 5500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Editar farmacia</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Datos básicos ── */}
        <Section title="Datos básicos">
          <div>
            <Label required>Nombre de la farmacia</Label>
            <Input required value={form.pharmacy_name} onChange={e => set('pharmacy_name', e.target.value)} />
          </div>
          <div>
            <Label required>Tipo jurídico</Label>
            <p className="text-xs text-gray-400 mb-2">Autónomo y C.B. son excluyentes. La S.L. puede combinarse con cualquiera.</p>
            <div className="flex flex-wrap gap-2">
              <ToggleBtn active={hasAuto} onClick={() => toggleType('autonomo')}>{hasAuto ? '✓ ' : ''}Autónomo</ToggleBtn>
              <ToggleBtn active={hasCb}   onClick={() => toggleType('cb')}>{hasCb ? '✓ ' : ''}C.B.</ToggleBtn>
              <ToggleBtn active={hasSl}   onClick={() => toggleType('sl')}>{hasSl ? '✓ ' : ''}S.L.</ToggleBtn>
            </div>
          </div>
        </Section>

        {hasAuto && (
          <Section title="Autónomo">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2"><Label required>Nombre del titular</Label><Input required value={form.auto.owner_name} onChange={e => setNested('auto','owner_name',e.target.value)} /></div>
              <div><Label>NIF</Label><Input value={form.auto.nif} onChange={e => setNested('auto','nif',e.target.value)} /></div>
              <div><Label>Nº Colegiado</Label><Input value={form.auto.collegiate_number} onChange={e => setNested('auto','collegiate_number',e.target.value)} /></div>
            </div>
            <hr className="border-gray-100" />
            <p className="mb-1 text-sm font-medium text-gray-500">Contacto de la farmacia</p>
            <ContactBlock data={form.auto_contact} onChange={(f,v) => setContact('auto_contact',f,v)} showGuardsAndSchedule showSoe />
          </Section>
        )}

        {hasCb && (
          <Section title="Comunidad de Bienes (C.B.)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Razón social</Label><Input value={form.cb.razon_social} onChange={e => setNested('cb','razon_social',e.target.value)} /></div>
              <div><Label>CIF</Label><Input value={form.cb.cif} onChange={e => setNested('cb','cif',e.target.value)} /></div>
            </div>
            <div><Label>Titulares</Label><CbOwners owners={form.cb.owners} onChange={val => setNested('cb','owners',val)} /></div>
            <hr className="border-gray-100" />
            <p className="mb-1 text-sm font-medium text-gray-500">Contacto de la farmacia</p>
            <ContactBlock data={form.cb_contact} onChange={(f,v) => setContact('cb_contact',f,v)} showGuardsAndSchedule showSoe />
          </Section>
        )}

        {hasSl && (
          <Section title="Sociedad Limitada (S.L.)" subtitle={hasAuto || hasCb ? 'Datos propios de la S.L.' : 'Datos de la sociedad y contacto'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Razón social</Label><Input value={form.sl.razon_social} onChange={e => setNested('sl','razon_social',e.target.value)} /></div>
              <div><Label>CIF</Label><Input value={form.sl.cif} onChange={e => setNested('sl','cif',e.target.value)} /></div>
            </div>
            <hr className="border-gray-100" />
            <ContactBlock data={form.sl_contact} onChange={(f,v) => setContact('sl_contact',f,v)} showGuardsAndSchedule={!hasAuto && !hasCb} showSoe={!hasAuto && !hasCb} />
          </Section>
        )}

        {/* ── ERP ── */}
        <Section title="ERP">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ERP_OPTIONS.map(opt => <ChipBtn key={opt} active={form.erp===opt} onClick={() => set('erp',opt)}>{opt}</ChipBtn>)}
          </div>
          {form.erp === 'Nixfarma' && (
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Licencia</Label><Input value={form.erp_license} onChange={e => set('erp_license',e.target.value)} /></div>
              <div><Label>Nº puestos</Label><Input type="number" min="1" value={form.erp_seats} onChange={e => set('erp_seats',e.target.value)} /></div>
              <div><Label>Año inicio</Label><YearSelect value={form.erp_start_year} onChange={e => set('erp_start_year',e.target.value)} /></div>
            </div>
          )}
          <VitekaCheck value={form.erp_viteka} onChange={v => set('erp_viteka',v)} />
          {!form.erp_viteka && <div><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.erp_satisfaction} onChange={e => set('erp_satisfaction',e.target.value)} /></div>}
          <DistribuidorBlock viteka={form.erp_viteka} detail={form.erp_detail} onChange={(k,v) => setDetail('erp_detail',k,v)} />
        </Section>

        {/* ── Caja de cobro ── */}
        <Section title="Caja de cobro">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CAJA_OPTIONS.map(opt => <ChipBtn key={opt.value} active={form.caja===opt.value} onClick={() => { set('caja',opt.value); set('caja_modelo','') }}>{opt.label}</ChipBtn>)}
          </div>
          {form.caja !== 'NO' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cajaOpt?.modelos?.length > 0 && (
                <div><Label>Modelo</Label>
                  <Select value={form.caja_modelo} onChange={e => set('caja_modelo',e.target.value)}>
                    <option value="">Seleccionar modelo</option>
                    {cajaOpt.modelos.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
              )}
              {form.caja === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.caja_otro} onChange={e => set('caja_otro',e.target.value)} /></div>}
              <div><Label>Año instalación</Label><YearSelect value={form.caja_year} onChange={e => set('caja_year',e.target.value)} /></div>
            </div>
          )}
          {form.caja !== 'NO' && (
            <>
              <VitekaCheck value={form.caja_viteka} onChange={v => set('caja_viteka',v)} />
              {!form.caja_viteka && <div><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.caja_satisfaction} onChange={e => set('caja_satisfaction',e.target.value)} /></div>}
              <DistribuidorBlock viteka={form.caja_viteka} detail={form.cash_detail} onChange={(k,v) => setDetail('cash_detail',k,v)} />
            </>
          )}
        </Section>

        {/* ── ESL ── */}
        <Section title="Etiquetas electrónicas (ESL)">
          <div className="flex flex-wrap gap-2">
            {ESL_OPTIONS.map(opt => <ChipBtn key={opt.value} active={form.esl===opt.value} onClick={() => set('esl',opt.value)}>{opt.label}</ChipBtn>)}
          </div>
          {form.esl !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Año instalación</Label><YearSelect value={form.esl_year} onChange={e => set('esl_year',e.target.value)} /></div>
                <VitekaCheck value={form.esl_viteka} onChange={v => set('esl_viteka',v)} />
                {!form.esl_viteka && <div className="sm:col-span-2"><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.esl_satisfaction} onChange={e => set('esl_satisfaction',e.target.value)} /></div>}
              </div>
              <DistribuidorBlock viteka={form.esl_viteka} detail={form.esl_detail} onChange={(k,v) => setDetail('esl_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Básculas ── */}
        <Section title="Básculas">
          <div className="flex flex-wrap gap-2">
            {BASCULA_OPTIONS.map(opt => <ChipBtn key={opt} active={form.bascula===opt} onClick={() => set('bascula',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>)}
          </div>
          {form.bascula !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.bascula === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.bascula_otro} onChange={e => set('bascula_otro',e.target.value)} /></div>}
                <div><Label>Año instalación</Label><YearSelect value={form.bascula_year} onChange={e => set('bascula_year',e.target.value)} /></div>
                <VitekaCheck value={form.bascula_viteka} onChange={v => set('bascula_viteka',v)} />
              </div>
              <DistribuidorBlock viteka={form.bascula_viteka} detail={form.scale_detail} onChange={(k,v) => setDetail('scale_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Antihurto ── */}
        <Section title="Arcos antihurto">
          <div className="flex flex-wrap gap-2">
            {ANTIHURTO_OPTIONS.map(opt => <ChipBtn key={opt} active={form.antihurto===opt} onClick={() => set('antihurto',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>)}
          </div>
          {form.antihurto !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.antihurto === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.antihurto_otro} onChange={e => set('antihurto_otro',e.target.value)} /></div>}
                <div><Label>Año instalación</Label><YearSelect value={form.antihurto_year} onChange={e => set('antihurto_year',e.target.value)} /></div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.antitheft_detail} onChange={(k,v) => setDetail('antitheft_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Consultoría ── */}
        <Section title="Consultoría">
          <div className="flex flex-wrap gap-2">
            {CONSULTORIA_OPTIONS.map(opt => <ChipBtn key={opt} active={form.consultoria===opt} onClick={() => set('consultoria',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>)}
          </div>
          {form.consultoria !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {form.consultoria === 'Otro' && <div className="sm:col-span-3"><Label>Indicar servicio</Label><Input value={form.consultoria_otro} onChange={e => set('consultoria_otro',e.target.value)} /></div>}
                <div><Label>Mes inicio</Label>
                  <Select value={form.consultoria_month} onChange={e => set('consultoria_month',e.target.value)}>
                    <option value="">Mes</option>
                    {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                  </Select>
                </div>
                <div><Label>Año inicio</Label><YearSelect value={form.consultoria_year} onChange={e => set('consultoria_year',e.target.value)} /></div>
                <VitekaCheck value={form.consultoria_viteka} onChange={v => set('consultoria_viteka',v)} />
              </div>
              <DistribuidorBlock viteka={form.consultoria_viteka} detail={form.consulting_detail} onChange={(k,v) => setDetail('consulting_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Robot ── */}
        <Section title="Robot dispensador">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['NO','BD Rowa','Gollmann','Meditech','Willach','Fablox','Luse','KLS','Tecnyfarma','Otro'].map(opt =>
              <ChipBtn key={opt} active={form.robot===opt} onClick={() => set('robot',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>
            )}
          </div>
          {form.robot !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.robot === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.robot_otro} onChange={e => set('robot_otro',e.target.value)} /></div>}
                <div><Label>Año instalación</Label><YearSelect value={form.robot_year} onChange={e => set('robot_year',e.target.value)} /></div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.robot_detail} onChange={(k,v) => setDetail('robot_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Cruz luminosa ── */}
        <Section title="Cruz luminosa">
          <div className="flex gap-2">
            {['NO','SI','Puede ampliar'].map(opt =>
              <ChipBtn key={opt} active={form.cruz===opt} onClick={() => set('cruz',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>
            )}
          </div>
          {form.cruz !== 'NO' && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nº cruces</Label><Input type="number" min="1" value={form.cruz_cantidad} onChange={e => set('cruz_cantidad',e.target.value)} /></div>
              {form.cruz === 'Puede ampliar' && <div><Label>Nº ampliación prevista</Label><Input type="number" min="1" value={form.cruz_ampliacion} onChange={e => set('cruz_ampliacion',e.target.value)} /></div>}
            </div>
          )}
        </Section>

        {/* ── Gestor turnos ── */}
        <Section title="Gestor de turnos">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => <ChipBtn key={opt} active={form.gestor_turnos===opt} onClick={() => set('gestor_turnos',opt)}>{opt==='NO'?'No tiene':'Sí tiene'}</ChipBtn>)}
          </div>
          {form.gestor_turnos === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.gestor_turnos_marca} onChange={e => set('gestor_turnos_marca',e.target.value)} /></div>
                <div><Label>Año</Label><YearSelect value={form.gestor_turnos_year} onChange={e => set('gestor_turnos_year',e.target.value)} /></div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.queue_detail} onChange={(k,v) => setDetail('queue_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── SPD ── */}
        <Section title="SPD (Sistema Personalizado de Dosificación)">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => <ChipBtn key={opt} active={form.spd===opt} onClick={() => set('spd',opt)}>{opt==='NO'?'No tiene':'Sí tiene'}</ChipBtn>)}
          </div>
          {form.spd === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.spd_marca} onChange={e => set('spd_marca',e.target.value)} /></div>
                <div><Label>Año</Label><YearSelect value={form.spd_year} onChange={e => set('spd_year',e.target.value)} /></div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.spd_detail} onChange={(k,v) => setDetail('spd_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Pantallas ── */}
        <Section title="Pantallas">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => <ChipBtn key={opt} active={form.pantallas===opt} onClick={() => set('pantallas',opt)}>{opt==='NO'?'No tiene':'Sí tiene'}</ChipBtn>)}
          </div>
          {form.pantallas === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.pantallas_marca} onChange={e => set('pantallas_marca',e.target.value)} /></div>
                <div><Label>Año</Label><YearSelect value={form.pantallas_year} onChange={e => set('pantallas_year',e.target.value)} /></div>
              </div>
              <div>
                <Label>Ubicación</Label>
                <div className="flex gap-5 mt-1">
                  {[['pantallas_interior','Interior'],['pantallas_escaparate','Escaparate'],['pantallas_exterior','Exterior']].map(([field,label]) => (
                    <label key={field} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={form[field]} onChange={e => set(field,e.target.checked)} className="w-4 h-4 accent-teal-600" />{label}
                    </label>
                  ))}
                </div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.screens_detail} onChange={(k,v) => setDetail('screens_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Frigorífico ── */}
        <Section title="Frigorífico">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Marca</Label><Input value={form.frigorifico_marca} onChange={e => set('frigorifico_marca',e.target.value)} /></div>
            <div><Label>Año</Label><YearSelect value={form.frigorifico_year} onChange={e => set('frigorifico_year',e.target.value)} /></div>
          </div>
          <VitekaCheck value={form.frigorifico_viteka} onChange={v => set('frigorifico_viteka',v)} />
          {!form.frigorifico_viteka && <div><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.frigorifico_satisfaction} onChange={e => set('frigorifico_satisfaction',e.target.value)} /></div>}
          <DistribuidorBlock viteka={form.frigorifico_viteka} detail={form.fridge_detail} onChange={(k,v) => setDetail('fridge_detail',k,v)} />
        </Section>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </form>
    </div>
  )
}
