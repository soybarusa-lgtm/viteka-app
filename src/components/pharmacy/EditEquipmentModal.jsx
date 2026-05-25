import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  Label, Input, Select, Section, ChipBtn,
  VitekaCheck, SatisfactionSelect, YearSelect,
} from './PharmacyFormAtoms'
import DistribuidorBlock from './DistribuidorBlock'
import {
  ERP_OPTIONS, CAJA_OPTIONS, ESL_OPTIONS, BASCULA_OPTIONS,
  ANTIHURTO_OPTIONS, CONSULTORIA_OPTIONS, MONTHS,
} from './PHARMACY_CONSTANTS'

function mkDetail(base = {}) {
  return { distribuidor: '', val_distribuidor: '', soporte: '', val_soporte: '', anotaciones: '', ...base }
}

function eqToForm(eq) {
  const pant_d = eq?.pantallas_detail || {}
  const locs   = pant_d.ubicaciones || []
  return {
    erp:              eq?.erp || 'Nixfarma',
    erp_viteka:       eq?.erp_viteka || false,
    erp_satisfaction: eq?.erp_satisfaction || '',
    erp_detail:       mkDetail(eq?.erp_detail || {}),
    erp_license:      eq?.erp_detail?.licencia || '',
    erp_seats:        eq?.erp_detail?.puestos  || '',
    erp_start_year:   eq?.erp_detail?.year     || '',

    caja:              eq?.caja || 'NO',
    caja_modelo:       eq?.caja_modelo || '',
    caja_year:         eq?.caja_year || '',
    caja_viteka:       eq?.caja_viteka || false,
    caja_satisfaction: eq?.caja_satisfaction || '',
    cash_detail:       mkDetail(eq?.cash_detail || {}),
    caja_otro: '',

    esl:              eq?.esl || 'NO',
    esl_year:         eq?.esl_year || '',
    esl_viteka:       eq?.esl_viteka || false,
    esl_satisfaction: eq?.esl_satisfaction || '',
    esl_detail:       mkDetail(eq?.esl_detail || {}),

    bascula:        eq?.bascula || 'NO',
    bascula_year:   eq?.bascula_year || '',
    bascula_viteka: eq?.bascula_viteka || false,
    scale_detail:   mkDetail(eq?.scale_detail || {}),
    bascula_otro: '',

    antihurto:        eq?.antihurto || 'NO',
    antihurto_year:   eq?.antihurto_year || '',
    antihurto_otro: '',
    antitheft_detail: mkDetail(eq?.antitheft_detail || {}),

    consultoria:        eq?.consultoria || 'NO',
    consultoria_month:  eq?.consultoria_detail?.month || '',
    consultoria_year:   eq?.consultoria_detail?.year  || '',
    consultoria_otro:   eq?.consultoria_detail?.otro  || '',
    consultoria_viteka: eq?.consultoria_viteka || false,
    consulting_detail:  mkDetail(eq?.consulting_detail || {}),

    robot:        eq?.robot || 'NO',
    robot_year:   eq?.robot_year || '',
    robot_otro: '',
    robot_detail: mkDetail(eq?.robot_detail || {}),

    cruz:            eq?.cruz || 'NO',
    cruz_cantidad:   eq?.cruz_cantidad || '',
    cruz_ampliacion: eq?.cruz_ampliacion || '',

    gestor_turnos:       eq?.gestor_turnos || 'NO',
    gestor_turnos_marca: eq?.gestor_turnos_marca || '',
    gestor_turnos_year:  eq?.gestor_turnos_year || '',
    queue_detail:        mkDetail(eq?.queue_detail || {}),

    spd:        eq?.spd || 'NO',
    spd_marca:  eq?.spd_marca || '',
    spd_year:   eq?.spd_year || '',
    spd_detail: mkDetail(eq?.spd_detail || {}),

    pantallas:            eq?.pantallas || 'NO',
    pantallas_marca:      pant_d.marca || '',
    pantallas_year:       pant_d.year  || '',
    pantallas_interior:   locs.includes('Interior'),
    pantallas_escaparate: locs.includes('Escaparate'),
    pantallas_exterior:   locs.includes('Exterior'),
    screens_detail:       mkDetail(eq?.screens_detail || {}),

    frigorifico_marca:        eq?.frigorifico_marca || '',
    frigorifico_year:         eq?.frigorifico_year || '',
    frigorifico_viteka:       eq?.frigorifico_viteka || false,
    frigorifico_satisfaction: eq?.frigorifico_satisfaction || '',
    fridge_detail:            mkDetail(eq?.fridge_detail || {}),
  }
}

function resolveDetail(detail, isViteka) {
  if (!isViteka) return detail
  return { ...detail, distribuidor: 'Viteka', soporte: 'Viteka' }
}

export default function EditEquipmentModal({ pharmacy, equipment, onClose, onSaved }) {
  const toast   = useToast()
  const [form, setForm]   = useState(() => eqToForm(equipment))
  const [saving, setSaving] = useState(false)

  const set       = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), [])
  const setDetail = useCallback((section, key, val) =>
    setForm(p => ({ ...p, [section]: { ...p[section], [key]: val } })), [])

  const cajaOpt = CAJA_OPTIONS.find(o => o.value === form.caja)

  async function handleSave() {
    setSaving(true)
    try {
      const eqPayload = {
        pharmacy_id: pharmacy.id,
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
            (_, i) => [form.pantallas_interior, form.pantallas_escaparate, form.pantallas_exterior][i]
          ),
        },
        screens_detail: form.screens_detail,

        frigorifico_marca:        form.frigorifico_marca || null,
        frigorifico_year:         form.frigorifico_year ? Number(form.frigorifico_year) : null,
        frigorifico_viteka:       form.frigorifico_viteka,
        frigorifico_satisfaction: form.frigorifico_satisfaction ? Number(form.frigorifico_satisfaction) : null,
        fridge_detail:            resolveDetail(form.fridge_detail, form.frigorifico_viteka),
      }

      if (equipment?.id) {
        const { error } = await supabase.from('pharmacy_equipment').update(eqPayload).eq('id', equipment.id)
        if (error) throw error
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile }  = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        const { error } = await supabase.from('pharmacy_equipment').insert({ ...eqPayload, company_id: profile.company_id })
        if (error) throw error
      }

      toast('Equipamiento actualizado', 'success')
      onSaved()
    } catch (err) {
      toast(err.message || 'Error al guardar', 'error', 5500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">Editar equipamiento</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6">

          {/* ERP */}
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
            {!form.erp_viteka && <div><Label>Satisfacción</Label><SatisfactionSelect value={form.erp_satisfaction} onChange={e => set('erp_satisfaction',e.target.value)} /></div>}
            <DistribuidorBlock viteka={form.erp_viteka} detail={form.erp_detail} onChange={(k,v) => setDetail('erp_detail',k,v)} />
          </Section>

          {/* Caja */}
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
                {!form.caja_viteka && <div><Label>Satisfacción</Label><SatisfactionSelect value={form.caja_satisfaction} onChange={e => set('caja_satisfaction',e.target.value)} /></div>}
                <DistribuidorBlock viteka={form.caja_viteka} detail={form.cash_detail} onChange={(k,v) => setDetail('cash_detail',k,v)} />
              </>
            )}
          </Section>

          {/* ESL */}
          <Section title="Etiquetas electrónicas (ESL)">
            <div className="flex flex-wrap gap-2">
              {ESL_OPTIONS.map(opt => <ChipBtn key={opt.value} active={form.esl===opt.value} onClick={() => set('esl',opt.value)}>{opt.label}</ChipBtn>)}
            </div>
            {form.esl !== 'NO' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Año instalación</Label><YearSelect value={form.esl_year} onChange={e => set('esl_year',e.target.value)} /></div>
                  <VitekaCheck value={form.esl_viteka} onChange={v => set('esl_viteka',v)} />
                  {!form.esl_viteka && <div className="sm:col-span-2"><Label>Satisfacción</Label><SatisfactionSelect value={form.esl_satisfaction} onChange={e => set('esl_satisfaction',e.target.value)} /></div>}
                </div>
                <DistribuidorBlock viteka={form.esl_viteka} detail={form.esl_detail} onChange={(k,v) => setDetail('esl_detail',k,v)} />
              </div>
            )}
          </Section>

          {/* Básculas */}
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

          {/* Antihurto */}
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

          {/* Consultoría */}
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

          {/* Robot */}
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

          {/* Cruz */}
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

          {/* Gestor turnos */}
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

          {/* SPD */}
          <Section title="SPD">
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

          {/* Pantallas */}
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

          {/* Frigorífico */}
          <Section title="Frigorífico">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marca</Label><Input value={form.frigorifico_marca} onChange={e => set('frigorifico_marca',e.target.value)} /></div>
              <div><Label>Año</Label><YearSelect value={form.frigorifico_year} onChange={e => set('frigorifico_year',e.target.value)} /></div>
            </div>
            <VitekaCheck value={form.frigorifico_viteka} onChange={v => set('frigorifico_viteka',v)} />
            {!form.frigorifico_viteka && <div><Label>Satisfacción</Label><SatisfactionSelect value={form.frigorifico_satisfaction} onChange={e => set('frigorifico_satisfaction',e.target.value)} /></div>}
            <DistribuidorBlock viteka={form.frigorifico_viteka} detail={form.fridge_detail} onChange={(k,v) => setDetail('fridge_detail',k,v)} />
          </Section>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}
