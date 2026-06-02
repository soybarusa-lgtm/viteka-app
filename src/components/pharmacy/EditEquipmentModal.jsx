import { useState, useCallback, useEffect } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { logActivity } from '../../lib/activityLogs'
import { useToast } from '../../context/ToastContext'
import {
  Label, Input, Select, ChipBtn,
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

const SECTION_KEYS = [
  'erp', 'caja', 'esl', 'bascula', 'antihurto', 'consultoria',
  'robot', 'cruz', 'gestor_turnos', 'spd', 'pantallas', 'frigorifico',
]

function buildSectionState(initialSection) {
  return Object.fromEntries(SECTION_KEYS.map(key => [key, key === initialSection]))
}

function eqToForm(eq) {
  const pantDetail = eq?.pantallas_detail || {}
  const locations = pantDetail.ubicaciones || []

  return {
    erp: eq?.erp || 'Nixfarma',
    erp_viteka: eq?.erp_viteka || false,
    erp_satisfaction: eq?.erp_satisfaction || '',
    erp_detail: mkDetail(eq?.erp_detail || {}),
    erp_otro: eq?.erp === 'Otro' ? (eq?.erp_detail?.otro || '') : '',
    erp_license: eq?.erp_detail?.licencia || '',
    erp_seats: eq?.erp_detail?.puestos || '',
    erp_start_year: eq?.erp_detail?.year || '',

    caja: eq?.caja || 'NO',
    caja_modelo: eq?.caja_modelo || '',
    caja_year: eq?.caja_year || '',
    caja_viteka: eq?.caja_viteka || false,
    caja_satisfaction: eq?.caja_satisfaction || '',
    cash_detail: mkDetail(eq?.cash_detail || {}),
    caja_otro: eq?.caja === 'Otro' ? (eq?.cash_detail?.otro || '') : '',

    esl: eq?.esl || 'NO',
    esl_year: eq?.esl_year || '',
    esl_viteka: eq?.esl_viteka || false,
    esl_satisfaction: eq?.esl_satisfaction || '',
    esl_detail: mkDetail(eq?.esl_detail || {}),
    esl_otro: eq?.esl === 'Otro' ? (eq?.esl_detail?.otro || '') : '',

    bascula: eq?.bascula || 'NO',
    bascula_year: eq?.bascula_year || '',
    bascula_viteka: eq?.bascula_viteka || false,
    scale_detail: mkDetail(eq?.scale_detail || {}),
    bascula_otro: eq?.bascula === 'Otro' ? (eq?.scale_detail?.otro || '') : '',

    antihurto: eq?.antihurto || 'NO',
    antihurto_year: eq?.antihurto_year || '',
    antihurto_otro: eq?.antihurto === 'Otro' ? (eq?.antitheft_detail?.otro || '') : '',
    antitheft_detail: mkDetail(eq?.antitheft_detail || {}),

    consultoria: eq?.consultoria || 'NO',
    consultoria_month: eq?.consultoria_detail?.month || '',
    consultoria_year: eq?.consultoria_detail?.year || '',
    consultoria_otro: eq?.consultoria_detail?.otro || '',
    consultoria_viteka: eq?.consultoria_viteka || false,
    consulting_detail: mkDetail(eq?.consulting_detail || {}),

    robot: eq?.robot || 'NO',
    robot_year: eq?.robot_year || '',
    robot_otro: eq?.robot === 'Otro' ? (eq?.robot_detail?.otro || '') : '',
    robot_detail: mkDetail(eq?.robot_detail || {}),

    cruz: eq?.cruz || 'NO',
    cruz_cantidad: eq?.cruz_cantidad || '',
    cruz_ampliacion: eq?.cruz_ampliacion || '',

    gestor_turnos: eq?.gestor_turnos || 'NO',
    gestor_turnos_marca: eq?.gestor_turnos_marca || '',
    gestor_turnos_year: eq?.gestor_turnos_year || '',
    queue_detail: mkDetail(eq?.queue_detail || {}),

    spd: eq?.spd || 'NO',
    spd_marca: eq?.spd_marca || '',
    spd_year: eq?.spd_year || '',
    spd_detail: mkDetail(eq?.spd_detail || {}),

    pantallas: eq?.pantallas || 'NO',
    pantallas_marca: pantDetail.marca || '',
    pantallas_year: pantDetail.year || '',
    pantallas_interior: locations.includes('Interior'),
    pantallas_escaparate: locations.includes('Escaparate'),
    pantallas_exterior: locations.includes('Exterior'),
    screens_detail: mkDetail(eq?.screens_detail || {}),

    frigorifico_marca: eq?.frigorifico_marca || '',
    frigorifico_year: eq?.frigorifico_year || '',
    frigorifico_viteka: eq?.frigorifico_viteka || false,
    frigorifico_satisfaction: eq?.frigorifico_satisfaction || '',
    fridge_detail: mkDetail(eq?.fridge_detail || {}),
  }
}

function resolveDetail(detail, isViteka) {
  if (!isViteka) return detail
  return { ...detail, distribuidor: 'Viteka', soporte: 'Viteka' }
}

function hasMeaningfulDetail(detail = {}) {
  return Object.values(detail).some(value => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim() !== ''
    return Boolean(value)
  })
}

function getSectionSummary(sectionKey, form) {
  switch (sectionKey) {
    case 'erp':
      return form.erp === 'Otro' ? form.erp_otro || 'Otro' : form.erp || ''
    case 'caja':
      return form.caja === 'NO' ? '' : form.caja === 'Otro' ? form.caja_otro || 'Otro' : form.caja
    case 'esl':
      return form.esl === 'NO' ? '' : form.esl === 'Otro' ? form.esl_otro || 'Otro' : form.esl
    case 'bascula':
      return form.bascula === 'NO' ? '' : form.bascula === 'Otro' ? form.bascula_otro || 'Otro' : form.bascula
    case 'antihurto':
      return form.antihurto === 'NO' ? '' : form.antihurto === 'Otro' ? form.antihurto_otro || 'Otro' : form.antihurto
    case 'consultoria':
      return form.consultoria === 'NO' ? '' : form.consultoria === 'Otro' ? form.consultoria_otro || 'Otro' : form.consultoria
    case 'robot':
      return form.robot === 'NO' ? '' : form.robot === 'Otro' ? form.robot_otro || 'Otro' : form.robot
    case 'cruz':
      return form.cruz === 'NO' ? '' : 'Cruz luminosa'
    case 'gestor_turnos':
      return form.gestor_turnos === 'SI' ? form.gestor_turnos_marca || 'Gestor de turnos' : ''
    case 'spd':
      return form.spd === 'SI' ? form.spd_marca || 'SPD' : ''
    case 'pantallas':
      return form.pantallas === 'SI' ? form.pantallas_marca || 'Pantallas' : ''
    case 'frigorifico':
      return form.frigorifico_marca ||
        form.frigorifico_year ||
        form.frigorifico_viteka ||
        form.frigorifico_satisfaction ||
        hasMeaningfulDetail(form.fridge_detail)
        ? form.frigorifico_marca || 'Frigorifico'
        : ''
    default:
      return ''
  }
}

function CollapsibleSection({ title, summary, isOpen, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {!isOpen && summary && (
            <p className="mt-1 truncate text-sm font-medium text-teal-700">{summary}</p>
          )}
        </div>
        {isOpen ? (
          <ChevronDownIcon className="h-5 w-5 shrink-0 text-gray-400" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 px-6 py-5">
          {children}
        </div>
      )}
    </div>
  )
}

export default function EditEquipmentModal({ pharmacy, equipment, onClose, onSaved, initialSection = null }) {
  const toast = useToast()
  const [form, setForm] = useState(() => eqToForm(equipment))
  const [saving, setSaving] = useState(false)
  const [openSections, setOpenSections] = useState(() => buildSectionState(initialSection))

  /* eslint-disable react-hooks/set-state-in-effect -- The drawer mirrors the selected equipment record and section. */
  useEffect(() => {
    setForm(eqToForm(equipment))
  }, [equipment, initialSection])

  useEffect(() => {
    setOpenSections(buildSectionState(initialSection))
  }, [initialSection])
  /* eslint-enable react-hooks/set-state-in-effect */

  const set = useCallback((key, value) => setForm(prev => ({ ...prev, [key]: value })), [])
  const setDetail = useCallback((section, key, value) => {
    setForm(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
  }, [])
  const toggleSection = useCallback(section => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const cajaOpt = CAJA_OPTIONS.find(option => option.value === form.caja)

  async function handleSave() {
    setSaving(true)
    try {
      const eqPayload = {
        pharmacy_id: pharmacy.id,
        erp: form.erp,
        erp_viteka: form.erp_viteka,
        erp_satisfaction: form.erp_satisfaction ? Number(form.erp_satisfaction) : null,
        erp_detail: resolveDetail({
          ...form.erp_detail,
          otro: form.erp === 'Otro' ? form.erp_otro : '',
          licencia: form.erp_license,
          puestos: form.erp_seats,
          year: form.erp_start_year,
        }, form.erp_viteka),

        caja: form.caja,
        caja_marca: form.caja,
        caja_modelo: form.caja_modelo || null,
        caja_year: form.caja_year ? Number(form.caja_year) : null,
        caja_viteka: form.caja_viteka,
        caja_satisfaction: form.caja_satisfaction ? Number(form.caja_satisfaction) : null,
        cash_detail: resolveDetail({
          ...form.cash_detail,
          otro: form.caja === 'Otro' ? form.caja_otro : '',
        }, form.caja_viteka),

        esl: form.esl,
        esl_year: form.esl_year ? Number(form.esl_year) : null,
        esl_viteka: form.esl_viteka,
        esl_satisfaction: form.esl_satisfaction ? Number(form.esl_satisfaction) : null,
        esl_detail: resolveDetail({
          ...form.esl_detail,
          otro: form.esl === 'Otro' ? form.esl_otro : '',
        }, form.esl_viteka),

        bascula: form.bascula,
        bascula_year: form.bascula_year ? Number(form.bascula_year) : null,
        bascula_viteka: form.bascula_viteka,
        scale_detail: resolveDetail({
          ...form.scale_detail,
          otro: form.bascula === 'Otro' ? form.bascula_otro : '',
        }, form.bascula_viteka),

        antihurto: form.antihurto,
        antihurto_year: form.antihurto_year ? Number(form.antihurto_year) : null,
        antitheft_detail: {
          ...form.antitheft_detail,
          otro: form.antihurto === 'Otro' ? form.antihurto_otro : '',
        },

        consultoria: form.consultoria,
        consultoria_viteka: form.consultoria_viteka,
        consultoria_detail: {
          month: form.consultoria_month,
          year: form.consultoria_year,
          otro: form.consultoria_otro,
        },
        consulting_detail: resolveDetail(form.consulting_detail, form.consultoria_viteka),

        robot: form.robot,
        robot_year: form.robot_year ? Number(form.robot_year) : null,
        robot_detail: {
          ...form.robot_detail,
          otro: form.robot === 'Otro' ? form.robot_otro : '',
        },

        cruz: form.cruz,
        cruz_cantidad: form.cruz_cantidad ? Number(form.cruz_cantidad) : null,
        cruz_ampliacion: form.cruz_ampliacion ? Number(form.cruz_ampliacion) : null,

        gestor_turnos: form.gestor_turnos,
        gestor_turnos_marca: form.gestor_turnos_marca || null,
        gestor_turnos_year: form.gestor_turnos_year ? Number(form.gestor_turnos_year) : null,
        queue_detail: form.queue_detail,

        spd: form.spd,
        spd_marca: form.spd_marca || null,
        spd_year: form.spd_year ? Number(form.spd_year) : null,
        spd_detail: form.spd_detail,

        pantallas: form.pantallas,
        pantallas_detail: {
          marca: form.pantallas_marca,
          year: form.pantallas_year,
          ubicaciones: ['Interior', 'Escaparate', 'Exterior'].filter(
            (_, index) => [form.pantallas_interior, form.pantallas_escaparate, form.pantallas_exterior][index]
          ),
        },
        screens_detail: form.screens_detail,

        frigorifico_marca: form.frigorifico_marca || null,
        frigorifico_year: form.frigorifico_year ? Number(form.frigorifico_year) : null,
        frigorifico_viteka: form.frigorifico_viteka,
        frigorifico_satisfaction: form.frigorifico_satisfaction ? Number(form.frigorifico_satisfaction) : null,
        fridge_detail: resolveDetail(form.fridge_detail, form.frigorifico_viteka),
      }

      if (equipment?.id) {
        const { error } = await supabase.from('pharmacy_equipment').update(eqPayload).eq('id', equipment.id)
        if (error) throw error
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        const { error } = await supabase.from('pharmacy_equipment').insert({ ...eqPayload, company_id: profile.company_id })
        if (error) throw error
      }
      await logActivity({
        entity_type: 'client',
        entity_id: pharmacy.id,
        entity_name: `${pharmacy.pharmacy_name} · equipamiento`,
        action: equipment?.id ? 'update' : 'create',
        old_value: equipment || null,
        new_value: eqPayload,
      })

      toast('Equipamiento actualizado', 'success')
      onSaved()
    } catch (error) {
      toast(error.message || 'Error al guardar', 'error', 5500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
        <CollapsibleSection
          title="ERP"
          summary={getSectionSummary('erp', form)}
          isOpen={openSections.erp}
          onToggle={() => toggleSection('erp')}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ERP_OPTIONS.map(option => (
              <ChipBtn key={option} active={form.erp === option} onClick={() => set('erp', option)}>
                {option}
              </ChipBtn>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {form.erp === 'Otro' && (
              <div>
                <Label>Indicar ERP</Label>
                <Input value={form.erp_otro} onChange={event => set('erp_otro', event.target.value)} />
              </div>
            )}
            {form.erp === 'Nixfarma' && (
              <div>
                <Label>Licencia</Label>
                <Input value={form.erp_license} onChange={event => set('erp_license', event.target.value)} />
              </div>
            )}
            <div>
              <Label>Nº puestos</Label>
              <Input type="number" min="1" value={form.erp_seats} onChange={event => set('erp_seats', event.target.value)} />
            </div>
            <div>
              <Label>Año inicio</Label>
              <YearSelect value={form.erp_start_year} onChange={event => set('erp_start_year', event.target.value)} />
            </div>
          </div>

          <VitekaCheck value={form.erp_viteka} onChange={value => set('erp_viteka', value)} />

          {!form.erp_viteka && (
            <div>
              <Label>Satisfacción</Label>
              <SatisfactionSelect value={form.erp_satisfaction} onChange={event => set('erp_satisfaction', event.target.value)} />
            </div>
          )}

          <DistribuidorBlock viteka={form.erp_viteka} detail={form.erp_detail} onChange={(key, value) => setDetail('erp_detail', key, value)} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Caja de cobro"
          summary={getSectionSummary('caja', form)}
          isOpen={openSections.caja}
          onToggle={() => toggleSection('caja')}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CAJA_OPTIONS.map(option => (
              <ChipBtn
                key={option.value}
                active={form.caja === option.value}
                onClick={() => {
                  set('caja', option.value)
                  set('caja_modelo', '')
                }}
              >
                {option.label}
              </ChipBtn>
            ))}
          </div>

          {form.caja !== 'NO' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cajaOpt?.modelos?.length > 0 && (
                <div>
                  <Label>Modelo</Label>
                  <Select value={form.caja_modelo} onChange={event => set('caja_modelo', event.target.value)}>
                    <option value="">Seleccionar modelo</option>
                    {cajaOpt.modelos.map(modelo => (
                      <option key={modelo} value={modelo}>
                        {modelo}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {form.caja === 'Otro' && (
                <div>
                  <Label>Indicar marca</Label>
                  <Input value={form.caja_otro} onChange={event => set('caja_otro', event.target.value)} />
                </div>
              )}

              <div>
                <Label>Año instalación</Label>
                <YearSelect value={form.caja_year} onChange={event => set('caja_year', event.target.value)} />
              </div>
            </div>
          )}

          {form.caja !== 'NO' && (
            <>
              <VitekaCheck value={form.caja_viteka} onChange={value => set('caja_viteka', value)} />
              {!form.caja_viteka && (
                <div>
                  <Label>Satisfacción</Label>
                  <SatisfactionSelect value={form.caja_satisfaction} onChange={event => set('caja_satisfaction', event.target.value)} />
                </div>
              )}
              <DistribuidorBlock viteka={form.caja_viteka} detail={form.cash_detail} onChange={(key, value) => setDetail('cash_detail', key, value)} />
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Etiquetas electrónicas (ESL)"
          summary={getSectionSummary('esl', form)}
          isOpen={openSections.esl}
          onToggle={() => toggleSection('esl')}
        >
          <div className="flex flex-wrap gap-2">
            {ESL_OPTIONS.map(option => (
              <ChipBtn key={option.value} active={form.esl === option.value} onClick={() => set('esl', option.value)}>
                {option.label}
              </ChipBtn>
            ))}
          </div>

          {form.esl !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {form.esl === 'Otro' && (
                  <div className="sm:col-span-2">
                    <Label>Indicar sistema ESL</Label>
                    <Input value={form.esl_otro} onChange={event => set('esl_otro', event.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Año instalación</Label>
                  <YearSelect value={form.esl_year} onChange={event => set('esl_year', event.target.value)} />
                </div>
                <VitekaCheck value={form.esl_viteka} onChange={value => set('esl_viteka', value)} />
                {!form.esl_viteka && (
                  <div className="sm:col-span-2">
                    <Label>Satisfacción</Label>
                    <SatisfactionSelect value={form.esl_satisfaction} onChange={event => set('esl_satisfaction', event.target.value)} />
                  </div>
                )}
              </div>

              <DistribuidorBlock viteka={form.esl_viteka} detail={form.esl_detail} onChange={(key, value) => setDetail('esl_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Básculas"
          summary={getSectionSummary('bascula', form)}
          isOpen={openSections.bascula}
          onToggle={() => toggleSection('bascula')}
        >
          <div className="flex flex-wrap gap-2">
            {BASCULA_OPTIONS.map(option => (
              <ChipBtn key={option} active={form.bascula === option} onClick={() => set('bascula', option)}>
                {option === 'NO' ? 'No tiene' : option}
              </ChipBtn>
            ))}
          </div>

          {form.bascula !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.bascula === 'Otro' && (
                  <div>
                    <Label>Indicar marca</Label>
                    <Input value={form.bascula_otro} onChange={event => set('bascula_otro', event.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Año instalación</Label>
                  <YearSelect value={form.bascula_year} onChange={event => set('bascula_year', event.target.value)} />
                </div>
                <VitekaCheck value={form.bascula_viteka} onChange={value => set('bascula_viteka', value)} />
              </div>

              <DistribuidorBlock viteka={form.bascula_viteka} detail={form.scale_detail} onChange={(key, value) => setDetail('scale_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Arcos antihurto"
          summary={getSectionSummary('antihurto', form)}
          isOpen={openSections.antihurto}
          onToggle={() => toggleSection('antihurto')}
        >
          <div className="flex flex-wrap gap-2">
            {ANTIHURTO_OPTIONS.map(option => (
              <ChipBtn key={option} active={form.antihurto === option} onClick={() => set('antihurto', option)}>
                {option === 'NO' ? 'No tiene' : option}
              </ChipBtn>
            ))}
          </div>

          {form.antihurto !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.antihurto === 'Otro' && (
                  <div>
                    <Label>Indicar marca</Label>
                    <Input value={form.antihurto_otro} onChange={event => set('antihurto_otro', event.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Año instalación</Label>
                  <YearSelect value={form.antihurto_year} onChange={event => set('antihurto_year', event.target.value)} />
                </div>
              </div>

              <DistribuidorBlock viteka={false} detail={form.antitheft_detail} onChange={(key, value) => setDetail('antitheft_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Consultoría"
          summary={getSectionSummary('consultoria', form)}
          isOpen={openSections.consultoria}
          onToggle={() => toggleSection('consultoria')}
        >
          <div className="flex flex-wrap gap-2">
            {CONSULTORIA_OPTIONS.map(option => (
              <ChipBtn key={option} active={form.consultoria === option} onClick={() => set('consultoria', option)}>
                {option === 'NO' ? 'No tiene' : option}
              </ChipBtn>
            ))}
          </div>

          {form.consultoria !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.consultoria === 'Otro' && (
                  <div className="sm:col-span-3">
                    <Label>Indicar servicio</Label>
                    <Input value={form.consultoria_otro} onChange={event => set('consultoria_otro', event.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Mes inicio</Label>
                  <Select value={form.consultoria_month} onChange={event => set('consultoria_month', event.target.value)}>
                    <option value="">Mes</option>
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Año inicio</Label>
                  <YearSelect value={form.consultoria_year} onChange={event => set('consultoria_year', event.target.value)} />
                </div>
                <VitekaCheck value={form.consultoria_viteka} onChange={value => set('consultoria_viteka', value)} />
              </div>

              <DistribuidorBlock viteka={form.consultoria_viteka} detail={form.consulting_detail} onChange={(key, value) => setDetail('consulting_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Robot dispensador"
          summary={getSectionSummary('robot', form)}
          isOpen={openSections.robot}
          onToggle={() => toggleSection('robot')}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {['NO', 'BD Rowa', 'Gollmann', 'Meditech', 'Willach', 'Fablox', 'Luse', 'KLS', 'Tecnyfarma', 'Otro'].map(option => (
              <ChipBtn key={option} active={form.robot === option} onClick={() => set('robot', option)}>
                {option === 'NO' ? 'No tiene' : option}
              </ChipBtn>
            ))}
          </div>

          {form.robot !== 'NO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {form.robot === 'Otro' && (
                  <div>
                    <Label>Indicar marca</Label>
                    <Input value={form.robot_otro} onChange={event => set('robot_otro', event.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Año instalación</Label>
                  <YearSelect value={form.robot_year} onChange={event => set('robot_year', event.target.value)} />
                </div>
              </div>

              <DistribuidorBlock viteka={false} detail={form.robot_detail} onChange={(key, value) => setDetail('robot_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Cruz luminosa"
          summary={getSectionSummary('cruz', form)}
          isOpen={openSections.cruz}
          onToggle={() => toggleSection('cruz')}
        >
          <div className="flex gap-2">
            {['NO', 'SI', 'Puede ampliar'].map(option => (
              <ChipBtn key={option} active={form.cruz === option} onClick={() => set('cruz', option)}>
                {option === 'NO' ? 'No tiene' : option}
              </ChipBtn>
            ))}
          </div>

          {form.cruz !== 'NO' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nº cruces</Label>
                <Input type="number" min="1" value={form.cruz_cantidad} onChange={event => set('cruz_cantidad', event.target.value)} />
              </div>
              {form.cruz === 'Puede ampliar' && (
                <div>
                  <Label>Nº ampliación prevista</Label>
                  <Input type="number" min="1" value={form.cruz_ampliacion} onChange={event => set('cruz_ampliacion', event.target.value)} />
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Gestor de turnos"
          summary={getSectionSummary('gestor_turnos', form)}
          isOpen={openSections.gestor_turnos}
          onToggle={() => toggleSection('gestor_turnos')}
        >
          <div className="flex gap-2">
            {['NO', 'SI'].map(option => (
              <ChipBtn key={option} active={form.gestor_turnos === option} onClick={() => set('gestor_turnos', option)}>
                {option === 'NO' ? 'No tiene' : 'Sí tiene'}
              </ChipBtn>
            ))}
          </div>

          {form.gestor_turnos === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Marca</Label>
                  <Input value={form.gestor_turnos_marca} onChange={event => set('gestor_turnos_marca', event.target.value)} />
                </div>
                <div>
                  <Label>Año</Label>
                  <YearSelect value={form.gestor_turnos_year} onChange={event => set('gestor_turnos_year', event.target.value)} />
                </div>
              </div>

              <DistribuidorBlock viteka={false} detail={form.queue_detail} onChange={(key, value) => setDetail('queue_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="SPD"
          summary={getSectionSummary('spd', form)}
          isOpen={openSections.spd}
          onToggle={() => toggleSection('spd')}
        >
          <div className="flex gap-2">
            {['NO', 'SI'].map(option => (
              <ChipBtn key={option} active={form.spd === option} onClick={() => set('spd', option)}>
                {option === 'NO' ? 'No tiene' : 'Sí tiene'}
              </ChipBtn>
            ))}
          </div>

          {form.spd === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Marca</Label>
                  <Input value={form.spd_marca} onChange={event => set('spd_marca', event.target.value)} />
                </div>
                <div>
                  <Label>Año</Label>
                  <YearSelect value={form.spd_year} onChange={event => set('spd_year', event.target.value)} />
                </div>
              </div>

              <DistribuidorBlock viteka={false} detail={form.spd_detail} onChange={(key, value) => setDetail('spd_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Pantallas"
          summary={getSectionSummary('pantallas', form)}
          isOpen={openSections.pantallas}
          onToggle={() => toggleSection('pantallas')}
        >
          <div className="flex gap-2">
            {['NO', 'SI'].map(option => (
              <ChipBtn key={option} active={form.pantallas === option} onClick={() => set('pantallas', option)}>
                {option === 'NO' ? 'No tiene' : 'Sí tiene'}
              </ChipBtn>
            ))}
          </div>

          {form.pantallas === 'SI' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Marca</Label>
                  <Input value={form.pantallas_marca} onChange={event => set('pantallas_marca', event.target.value)} />
                </div>
                <div>
                  <Label>Año</Label>
                  <YearSelect value={form.pantallas_year} onChange={event => set('pantallas_year', event.target.value)} />
                </div>
              </div>

              <div>
                <Label>Ubicación</Label>
                <div className="mt-1 flex gap-5">
                  {[
                    ['pantallas_interior', 'Interior'],
                    ['pantallas_escaparate', 'Escaparate'],
                    ['pantallas_exterior', 'Exterior'],
                  ].map(([field, label]) => (
                    <label key={field} className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form[field]}
                        onChange={event => set(field, event.target.checked)}
                        className="h-4 w-4 accent-teal-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <DistribuidorBlock viteka={false} detail={form.screens_detail} onChange={(key, value) => setDetail('screens_detail', key, value)} />
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Frigorífico"
          summary={getSectionSummary('frigorifico', form)}
          isOpen={openSections.frigorifico}
          onToggle={() => toggleSection('frigorifico')}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca</Label>
              <Input value={form.frigorifico_marca} onChange={event => set('frigorifico_marca', event.target.value)} />
            </div>
            <div>
              <Label>Año</Label>
              <YearSelect value={form.frigorifico_year} onChange={event => set('frigorifico_year', event.target.value)} />
            </div>
          </div>

          <VitekaCheck value={form.frigorifico_viteka} onChange={value => set('frigorifico_viteka', value)} />

          {!form.frigorifico_viteka && (
            <div>
              <Label>Satisfacción</Label>
              <SatisfactionSelect value={form.frigorifico_satisfaction} onChange={event => set('frigorifico_satisfaction', event.target.value)} />
            </div>
          )}

          <DistribuidorBlock viteka={form.frigorifico_viteka} detail={form.fridge_detail} onChange={(key, value) => setDetail('fridge_detail', key, value)} />
        </CollapsibleSection>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
