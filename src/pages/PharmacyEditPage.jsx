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

// ── Columnas reales de pharmacy_equipment ──────────────────────────────────
// erp_brand | erp_license | erp_seats | erp_start_year | erp_viteka | erp_satisfaction | erp_detail
// cash_brand | cash_model | cash_year | cash_viteka_dist | cash_satisfaction | cash_detail
// esl_brand  | esl_year   | esl_viteka_dist | esl_satisfaction | esl_detail
// scale_brand | scale_year | bascula_viteka | scale_detail
// antitheft_brand | antitheft_year | antitheft_detail
// consulting_brand | consulting_start_month | consulting_start_year | consulting_viteka | consulting_detail
// robot_brand | robot_year | robot_detail
// cross_has | cross_count | cross_expand_count
// queue_has | queue_brand | queue_year | queue_detail
// spd_has | spd_brand | spd_year | spd_detail
// screens_has | screens_brand | screens_year | screens_locations | screens_detail
// fridge_brand | fridge_year | frigorifico_viteka | frigorifico_satisfaction | fridge_detail

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
  const scr = eq?.screens_detail || {}
  const locs = eq?.screens_locations || []

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
    erp_brand:        eq?.erp_brand || 'Nixfarma',
    erp_license:      eq?.erp_license || '',
    erp_seats:        eq?.erp_seats || '',
    erp_start_year:   eq?.erp_start_year || '',
    erp_viteka:       eq?.erp_viteka || false,
    erp_satisfaction: eq?.erp_satisfaction || '',
    erp_detail:       mkDetail(eq?.erp_detail || {}),

    // Caja
    cash_brand:        eq?.cash_brand || 'NO',
    cash_model:        eq?.cash_model || '',
    cash_year:         eq?.cash_year || '',
    cash_viteka_dist:  eq?.cash_viteka_dist || false,
    cash_satisfaction: eq?.cash_satisfaction || '',
    cash_detail:       mkDetail(eq?.cash_detail || {}),
    cash_otro: '',

    // ESL
    esl_brand:        eq?.esl_brand || 'NO',
    esl_year:         eq?.esl_year || '',
    esl_viteka_dist:  eq?.esl_viteka_dist || false,
    esl_satisfaction: eq?.esl_satisfaction || '',
    esl_detail:       mkDetail(eq?.esl_detail || {}),

    // Básculas
    scale_brand:   eq?.scale_brand || 'NO',
    scale_year:    eq?.scale_year || '',
    bascula_viteka: eq?.bascula_viteka || false,
    scale_detail:  mkDetail(eq?.scale_detail || {}),
    scale_otro: '',

    // Antihurto
    antitheft_brand:  eq?.antitheft_brand || 'NO',
    antitheft_year:   eq?.antitheft_year || '',
    antitheft_otro: '',
    antitheft_detail: mkDetail(eq?.antitheft_detail || {}),

    // Consultoría
    consulting_brand:       eq?.consulting_brand || 'NO',
    consulting_start_month: eq?.consulting_start_month || '',
    consulting_start_year:  eq?.consulting_start_year || '',
    consulting_otro:        eq?.consulting_other || '',
    consulting_viteka:      eq?.consulting_viteka || false,
    consulting_detail:      mkDetail(eq?.consulting_detail || {}),

    // Robot
    robot_brand:  eq?.robot_brand || 'NO',
    robot_year:   eq?.robot_year || '',
    robot_otro: '',
    robot_detail: mkDetail(eq?.robot_detail || {}),

    // Cruz
    cross_has:          eq?.cross_has || 'NO',
    cross_count:        eq?.cross_count || '',
    cross_expand_count: eq?.cross_expand_count || '',

    // Gestor turnos
    queue_has:    eq?.queue_has ? 'SI' : 'NO',
    queue_brand:  eq?.queue_brand || '',
    queue_year:   eq?.queue_year || '',
    queue_detail: mkDetail(eq?.queue_detail || {}),

    // SPD
    spd_has:    eq?.spd_has ? 'SI' : 'NO',
    spd_brand:  eq?.spd_brand || '',
    spd_year:   eq?.spd_year || '',
    spd_detail: mkDetail(eq?.spd_detail || {}),

    // Pantallas
    screens_has:       eq?.screens_has ? 'SI' : 'NO',
    screens_brand:     eq?.screens_brand || '',
    screens_year:      eq?.screens_year || '',
    screens_interior:  locs.includes('Interior'),
    screens_escaparate:locs.includes('Escaparate'),
    screens_exterior:  locs.includes('Exterior'),
    screens_detail:    mkDetail(scr),

    // Frigorífico
    fridge_brand:          eq?.fridge_brand || '',
    fridge_year:           eq?.fridge_year || '',
    frigorifico_viteka:    eq?.frigorifico_viteka || false,
    frigorifico_satisfaction: eq?.frigorifico_satisfaction || '',
    fridge_detail:         mkDetail(eq?.fridge_detail || {}),
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
  const cajaOpt = CAJA_OPTIONS.find(o => o.value === form.cash_brand)

  // Si viteka=true fija distribuidor y soporte a "Viteka" en el detail
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
        soe_number: mainContact.soe, schedule: mainContact.schedule,
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

        erp_brand:        form.erp_brand,
        erp_license:      form.erp_license || null,
        erp_seats:        form.erp_seats ? Number(form.erp_seats) : null,
        erp_start_year:   form.erp_start_year ? Number(form.erp_start_year) : null,
        erp_viteka:       form.erp_viteka,
        erp_satisfaction: form.erp_satisfaction ? Number(form.erp_satisfaction) : null,
        erp_detail:       resolveDetail(form.erp_detail, form.erp_viteka),

        cash_brand:        form.cash_brand,
        cash_model:        form.cash_model || null,
        cash_year:         form.cash_year ? Number(form.cash_year) : null,
        cash_viteka_dist:  form.cash_viteka_dist,
        cash_satisfaction: form.cash_satisfaction ? Number(form.cash_satisfaction) : null,
        cash_detail:       resolveDetail(form.cash_detail, form.cash_viteka_dist),

        esl_brand:        form.esl_brand,
        esl_year:         form.esl_year ? Number(form.esl_year) : null,
        esl_viteka_dist:  form.esl_viteka_dist,
        esl_satisfaction: form.esl_satisfaction ? Number(form.esl_satisfaction) : null,
        esl_detail:       resolveDetail(form.esl_detail, form.esl_viteka_dist),

        scale_brand:   form.scale_brand,
        scale_year:    form.scale_year ? Number(form.scale_year) : null,
        bascula_viteka: form.bascula_viteka,
        scale_detail:  resolveDetail(form.scale_detail, form.bascula_viteka),

        antitheft_brand:  form.antitheft_brand,
        antitheft_year:   form.antitheft_year ? Number(form.antitheft_year) : null,
        antitheft_detail: form.antitheft_detail,

        consulting_brand:       form.consulting_brand,
        consulting_other:       form.consulting_otro || null,
        consulting_start_month: form.consulting_start_month ? Number(form.consulting_start_month) : null,
        consulting_start_year:  form.consulting_start_year ? Number(form.consulting_start_year) : null,
        consulting_viteka:      form.consulting_viteka,
        consulting_detail:      resolveDetail(form.consulting_detail, form.consulting_viteka),

        robot_brand:  form.robot_brand,
        robot_year:   form.robot_year ? Number(form.robot_year) : null,
        robot_detail: form.robot_detail,

        cross_has:          form.cross_has,
        cross_count:        form.cross_count ? Number(form.cross_count) : null,
        cross_expand_count: form.cross_expand_count ? Number(form.cross_expand_count) : null,

        queue_has:    form.queue_has === 'SI',
        queue_brand:  form.queue_brand || null,
        queue_year:   form.queue_year ? Number(form.queue_year) : null,
        queue_detail: form.queue_detail,

        spd_has:    form.spd_has === 'SI',
        spd_brand:  form.spd_brand || null,
        spd_year:   form.spd_year ? Number(form.spd_year) : null,
        spd_detail: form.spd_detail,

        screens_has:       form.screens_has === 'SI',
        screens_brand:     form.screens_brand || null,
        screens_year:      form.screens_year ? Number(form.screens_year) : null,
        screens_locations: ['Interior','Escaparate','Exterior'].filter(
          (_, i) => [form.screens_interior, form.screens_escaparate, form.screens_exterior][i]
        ),
        screens_detail: form.screens_detail,

        fridge_brand:            form.fridge_brand || null,
        fridge_year:             form.fridge_year ? Number(form.fridge_year) : null,
        frigorifico_viteka:      form.frigorifico_viteka,
        frigorifico_satisfaction: form.frigorifico_satisfaction ? Number(form.frigorifico_satisfaction) : null,
        fridge_detail:           resolveDetail(form.fridge_detail, form.frigorifico_viteka),
      }

      if (eqId) {
        const { error: eqErr } = await supabase.from('pharmacy_equipment').update(eqPayload).eq('id', eqId)
        if (eqErr) throw eqErr
      } else {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', (await supabase.auth.getUser()).data.user.id).single()
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
            <p className="text-xs font-medium text-gray-500 -mb-2">Contacto de la farmacia</p>
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
            <p className="text-xs font-medium text-gray-500 -mb-2">Contacto de la farmacia</p>
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
            {ERP_OPTIONS.map(opt => <ChipBtn key={opt} active={form.erp_brand===opt} onClick={() => set('erp_brand',opt)}>{opt}</ChipBtn>)}
          </div>
          {form.erp_brand === 'Nixfarma' && (
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
            {CAJA_OPTIONS.map(opt => <ChipBtn key={opt.value} active={form.cash_brand===opt.value} onClick={() => { set('cash_brand',opt.value); set('cash_model','') }}>{opt.label}</ChipBtn>)}
          </div>
          {form.cash_brand !== 'NO' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cajaOpt?.modelos?.length > 0 && (
                <div><Label>Modelo</Label>
                  <Select value={form.cash_model} onChange={e => set('cash_model',e.target.value)}>
                    <option value="">Seleccionar modelo</option>
                    {cajaOpt.modelos.map(m => <option key={m} value={m}>{m}</option>)}
                  </Select>
                </div>
              )}
              {form.cash_brand === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.cash_otro} onChange={e => set('cash_otro',e.target.value)} /></div>}
              <div><Label>Año instalación</Label><YearSelect value={form.cash_year} onChange={e => set('cash_year',e.target.value)} /></div>
            </div>
          )}
          {form.cash_brand !== 'NO' && (
            <>
              <VitekaCheck value={form.cash_viteka_dist} onChange={v => set('cash_viteka_dist',v)} />
              {!form.cash_viteka_dist && <div><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.cash_satisfaction} onChange={e => set('cash_satisfaction',e.target.value)} /></div>}
              <DistribuidorBlock viteka={form.cash_viteka_dist} detail={form.cash_detail} onChange={(k,v) => setDetail('cash_detail',k,v)} />
            </>
          )}
        </Section>

        {/* ── ESL ── */}
        <Section title="Etiquetas electrónicas (ESL)">
          <div className="flex flex-wrap gap-2">
            {ESL_OPTIONS.map(opt => <ChipBtn key={opt.value} active={form.esl_brand===opt.value} onClick={() => set('esl_brand',opt.value)}>{opt.label}</ChipBtn>)}
          </div>
          {form.esl_brand !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Año instalación</Label><YearSelect value={form.esl_year} onChange={e => set('esl_year',e.target.value)} /></div>
                <VitekaCheck value={form.esl_viteka_dist} onChange={v => set('esl_viteka_dist',v)} />
                {!form.esl_viteka_dist && <div className="sm:col-span-2"><Label>Grado de satisfacción</Label><SatisfactionSelect value={form.esl_satisfaction} onChange={e => set('esl_satisfaction',e.target.value)} /></div>}
              </div>
              <DistribuidorBlock viteka={form.esl_viteka_dist} detail={form.esl_detail} onChange={(k,v) => setDetail('esl_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Básculas ── */}
        <Section title="Básculas">
          <div className="flex flex-wrap gap-2">
            {BASCULA_OPTIONS.map(opt => <ChipBtn key={opt} active={form.scale_brand===opt} onClick={() => set('scale_brand',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>)}
          </div>
          {form.scale_brand !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.scale_brand === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.scale_otro} onChange={e => set('scale_otro',e.target.value)} /></div>}
                <div><Label>Año instalación</Label><YearSelect value={form.scale_year} onChange={e => set('scale_year',e.target.value)} /></div>
                <VitekaCheck value={form.bascula_viteka} onChange={v => set('bascula_viteka',v)} />
              </div>
              <DistribuidorBlock viteka={form.bascula_viteka} detail={form.scale_detail} onChange={(k,v) => setDetail('scale_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Antihurto ── */}
        <Section title="Arcos antihurto">
          <div className="flex flex-wrap gap-2">
            {ANTIHURTO_OPTIONS.map(opt => <ChipBtn key={opt} active={form.antitheft_brand===opt} onClick={() => set('antitheft_brand',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>)}
          </div>
          {form.antitheft_brand !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.antitheft_brand === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.antitheft_otro} onChange={e => set('antitheft_otro',e.target.value)} /></div>}
                <div><Label>Año instalación</Label><YearSelect value={form.antitheft_year} onChange={e => set('antitheft_year',e.target.value)} /></div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.antitheft_detail} onChange={(k,v) => setDetail('antitheft_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Consultoría ── */}
        <Section title="Consultoría">
          <div className="flex flex-wrap gap-2">
            {CONSULTORIA_OPTIONS.map(opt => <ChipBtn key={opt} active={form.consulting_brand===opt} onClick={() => set('consulting_brand',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>)}
          </div>
          {form.consulting_brand !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {form.consulting_brand === 'Otro' && <div className="sm:col-span-3"><Label>Indicar servicio</Label><Input value={form.consulting_otro} onChange={e => set('consulting_otro',e.target.value)} /></div>}
                <div><Label>Mes inicio</Label>
                  <Select value={form.consulting_start_month} onChange={e => set('consulting_start_month',e.target.value)}>
                    <option value="">Mes</option>
                    {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                  </Select>
                </div>
                <div><Label>Año inicio</Label><YearSelect value={form.consulting_start_year} onChange={e => set('consulting_start_year',e.target.value)} /></div>
                <VitekaCheck value={form.consulting_viteka} onChange={v => set('consulting_viteka',v)} />
              </div>
              <DistribuidorBlock viteka={form.consulting_viteka} detail={form.consulting_detail} onChange={(k,v) => setDetail('consulting_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Robot ── */}
        <Section title="Robot dispensador">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['NO','BD Rowa','Gollmann','Meditech','Willach','Fablox','Luse','KLS','Tecnyfarma','Otro'].map(opt =>
              <ChipBtn key={opt} active={form.robot_brand===opt} onClick={() => set('robot_brand',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>
            )}
          </div>
          {form.robot_brand !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.robot_brand === 'Otro' && <div><Label>Indicar marca</Label><Input value={form.robot_otro} onChange={e => set('robot_otro',e.target.value)} /></div>}
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
              <ChipBtn key={opt} active={form.cross_has===opt} onClick={() => set('cross_has',opt)}>{opt==='NO'?'No tiene':opt}</ChipBtn>
            )}
          </div>
          {form.cross_has !== 'NO' && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nº cruces</Label><Input type="number" min="1" value={form.cross_count} onChange={e => set('cross_count',e.target.value)} /></div>
              {form.cross_has === 'Puede ampliar' && <div><Label>Nº ampliación prevista</Label><Input type="number" min="1" value={form.cross_expand_count} onChange={e => set('cross_expand_count',e.target.value)} /></div>}
            </div>
          )}
        </Section>

        {/* ── Gestor turnos ── */}
        <Section title="Gestor de turnos">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => <ChipBtn key={opt} active={form.queue_has===opt} onClick={() => set('queue_has',opt)}>{opt==='NO'?'No tiene':'Sí tiene'}</ChipBtn>)}
          </div>
          {form.queue_has === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.queue_brand} onChange={e => set('queue_brand',e.target.value)} /></div>
                <div><Label>Año</Label><YearSelect value={form.queue_year} onChange={e => set('queue_year',e.target.value)} /></div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.queue_detail} onChange={(k,v) => setDetail('queue_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── SPD ── */}
        <Section title="SPD (Sistema Personalizado de Dosificación)">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => <ChipBtn key={opt} active={form.spd_has===opt} onClick={() => set('spd_has',opt)}>{opt==='NO'?'No tiene':'Sí tiene'}</ChipBtn>)}
          </div>
          {form.spd_has === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.spd_brand} onChange={e => set('spd_brand',e.target.value)} /></div>
                <div><Label>Año</Label><YearSelect value={form.spd_year} onChange={e => set('spd_year',e.target.value)} /></div>
              </div>
              <DistribuidorBlock viteka={false} detail={form.spd_detail} onChange={(k,v) => setDetail('spd_detail',k,v)} />
            </div>
          )}
        </Section>

        {/* ── Pantallas ── */}
        <Section title="Pantallas">
          <div className="flex gap-2">
            {['NO','SI'].map(opt => <ChipBtn key={opt} active={form.screens_has===opt} onClick={() => set('screens_has',opt)}>{opt==='NO'?'No tiene':'Sí tiene'}</ChipBtn>)}
          </div>
          {form.screens_has === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.screens_brand} onChange={e => set('screens_brand',e.target.value)} /></div>
                <div><Label>Año</Label><YearSelect value={form.screens_year} onChange={e => set('screens_year',e.target.value)} /></div>
              </div>
              <div>
                <Label>Ubicación</Label>
                <div className="flex gap-5 mt-1">
                  {[['screens_interior','Interior'],['screens_escaparate','Escaparate'],['screens_exterior','Exterior']].map(([field,label]) => (
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
            <div><Label>Marca</Label><Input value={form.fridge_brand} onChange={e => set('fridge_brand',e.target.value)} /></div>
            <div><Label>Año</Label><YearSelect value={form.fridge_year} onChange={e => set('fridge_year',e.target.value)} /></div>
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
