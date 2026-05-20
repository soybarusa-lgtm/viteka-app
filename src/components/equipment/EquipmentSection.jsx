import { useState, useEffect } from 'react'
import { usePharmacyEquipment } from '../../hooks/usePharmacyEquipment'
import EquipmentDevicesTab from './EquipmentDevicesTab'
import StarRating from './StarRating'

// ─── Catálogos ────────────────────────────────────────────────────────────
const ERP_BRANDS = [
  { v:'nixfarma',   l:'Nixfarma' },
  { v:'farmatic',   l:'Farmatic' },
  { v:'unycop',     l:'Unycop Next' },
  { v:'farmanager', l:'Farmanager' },
  { v:'unicop_win', l:'Unicop Win' },
  { v:'vgaleno',    l:'vGaleno' },
  { v:'compufarma', l:'Compufarma' },
  { v:'otro',       l:'Otro' },
]

const CASH_BRANDS = [
  { v:'no',          l:'NO' },
  { v:'cashlogy',    l:'Cashlogy' },
  { v:'cashinfinity',l:'Cashinfinity' },
  { v:'cashkeeper',  l:'Cashkeeper' },
  { v:'cashdro',     l:'CashDro' },
  { v:'cashprotect', l:'CashProtect' },
  { v:'otro',        l:'Otro' },
]
const CASH_MODELS = {
  cashlogy:    ['1000','1500','2023','Maximate','Safe','MaxiSafe','Otro'],
  cashinfinity:['CI-5','CI-10X','CI-100X','Otro'],
  cashkeeper:  ['Compacto','Modular','Otro'],
  cashdro:     ['CashDro S','CashDro 4+','CashDro 5','CashDro 7','Otro'],
  cashprotect: ['CashProtect 400 AS','CashProtect Pro AS','CashProtect PJ','CashProtect POS','CashProtect 1000','Otro'],
}

const ESL_BRANDS = [
  { v:'no',         l:'NO' },
  { v:'hanshow',    l:'Hanshow' },
  { v:'pricer',     l:'Pricer' },
  { v:'expofarm',   l:'Expofarm' },
  { v:'farmaconnet',l:'Farmaconnet' },
  { v:'otro',       l:'Otro (indicar)' },
]

const SCALE_BRANDS = [
  { v:'no',    l:'NO' },
  { v:'pondus',l:'Pondus' },
  { v:'keito', l:'Keito' },
  { v:'otro',  l:'Otro (indicar)' },
]

const ANTITHEFT_BRANDS = [
  { v:'no',         l:'NO' },
  { v:'checkpoint', l:'Checkpoint' },
  { v:'otro',       l:'Otro (indicar)' },
]

const CONSULTING_BRANDS = [
  { v:'no',          l:'NO' },
  { v:'viteka_pro',  l:'Viteka Pro Gestión' },
  { v:'avantia_plus',l:'Avantia Plus Gestión' },
  { v:'otro',        l:'Otro (indicar)' },
]

const ROBOT_BRANDS = [
  { v:'no',        l:'NO' },
  { v:'bd_rowa',   l:'BD Rowa' },
  { v:'gollmann',  l:'Gollmann' },
  { v:'meditech',  l:'Meditech' },
  { v:'willach',   l:'Willach' },
  { v:'fablox',    l:'Fablox' },
  { v:'luse',      l:'Luse' },
  { v:'kls',       l:'KLS' },
  { v:'tecnyfarma',l:'Tecnyfarma' },
  { v:'otro',      l:'Otro' },
]

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

// ─── Sub-componentes auxiliares ───────────────────────────────────────────
function RadioGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <label key={o.v}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition-all select-none ${
            value === o.v
              ? 'bg-teal-50 border-teal-500 text-teal-700'
              : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-teal-300'
          }`}>
          <input type="radio" className="sr-only" checked={value===o.v} onChange={()=>onChange(o.v)} readOnly/>
          {o.l}
        </label>
      ))}
    </div>
  )
}

function VitekaBlock({ dist, onDist, support, onSupport }) {
  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-amber-700">¿Es VITEKA su distribuidor?</span>
        <label className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer ${
          dist===true ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-gray-300 text-gray-500'
        }`}>
          <input type="radio" className="sr-only" checked={dist===true} onChange={()=>onDist(true)}/>SI
        </label>
        <label className={`px-3 py-1 rounded-full border text-xs font-medium cursor-pointer ${
          dist===false ? 'bg-red-50 border-red-400 text-red-600' : 'bg-gray-50 border-gray-300 text-gray-500'
        }`}>
          <input type="radio" className="sr-only" checked={dist===false} onChange={()=>onDist(false)}/>NO
        </label>
      </div>
      <div>
        <label className="label text-xs">Soporte VITEKA — observaciones</label>
        <input className="input text-sm" value={support||''} onChange={e=>onSupport(e.target.value)} placeholder="Describe el soporte actual…"/>
      </div>
    </div>
  )
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
        <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-content-center text-base flex-shrink-0" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ─── EquipmentSection (principal) ────────────────────────────────────────
export default function EquipmentSection({ pharmacyId }) {
  const { equipment, loading, saving, error, save } = usePharmacyEquipment(pharmacyId)
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (equipment) setForm(equipment)
  }, [equipment])

  function f(k) { return form[k] ?? null }
  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }
  function tog(k, val) { set(k, val) }

  async function handleSave() {
    try {
      await save(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch(e) {
      alert('Error al guardar: ' + e.message)
    }
  }

  // Lógica de satisfacción: se muestra si NO es la marca Viteka-preferida o si es Viteka pero no es distribuidor
  const showCashSatisfaction = f('cash_brand') && f('cash_brand') !== 'no' &&
    (f('cash_brand') !== 'cashlogy' || f('cash_viteka_dist') === false)
  const showEslSatisfaction  = f('esl_brand') && f('esl_brand') !== 'no' &&
    (['hanshow','pricer'].includes(f('esl_brand')) ? f('esl_viteka_dist') === false : true)

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">Cargando equipamiento…</div>

  return (
    <div className="space-y-4">

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      {/* ── ERP ── */}
      <SectionCard icon="💾" title="ERP">
        <RadioGroup options={ERP_BRANDS} value={f('erp_brand')||''} onChange={v=>tog('erp_brand',v)}/>
        {f('erp_brand') && f('erp_brand') !== 'no' && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {f('erp_brand') === 'nixfarma' && (
              <><div><label className="label">Licencia</label>
                <input className="input" value={f('erp_license')||''} onChange={e=>set('erp_license',e.target.value)}/></div>
              <div><label className="label">Nº puestos</label>
                <input className="input" type="number" min="1" value={f('erp_seats')||''} onChange={e=>set('erp_seats',e.target.value)}/></div>
              </>
            )}
            <div><label className="label">Año de inicio</label>
              <input className="input" type="number" value={f('erp_start_year')||''} onChange={e=>set('erp_start_year',e.target.value)}/></div>
            {f('erp_brand') === 'nixfarma' && (
              <div><label className="label">Productos asociados</label>
                <input className="input" value={f('erp_products')||''} onChange={e=>set('erp_products',e.target.value)}/></div>
            )}
            {f('erp_brand') === 'otro' && (
              <div className="col-span-2"><label className="label">Nombre del ERP</label>
                <input className="input" value={f('erp_other_name')||''} onChange={e=>set('erp_other_name',e.target.value)}/></div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── CAJA DE COBRO ── */}
      <SectionCard icon="🏧" title="Caja de cobro">
        <RadioGroup options={CASH_BRANDS} value={f('cash_brand')||''} onChange={v=>{ tog('cash_brand',v); set('cash_model',null) }}/>

        {f('cash_brand') && f('cash_brand') !== 'no' && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              {CASH_MODELS[f('cash_brand')] && (
                <div>
                  <label className="label">Modelo</label>
                  <select className="input" value={f('cash_model')||''} onChange={e=>set('cash_model',e.target.value)}>
                    <option value="">Selecciona...</option>
                    {CASH_MODELS[f('cash_brand')].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
              )}
              {f('cash_brand') === 'otro' && (
                <div className="flex-1"><label className="label">Modelo (texto libre)</label>
                  <input className="input" value={f('cash_other_model')||''} onChange={e=>set('cash_other_model',e.target.value)}/></div>
              )}
              <div><label className="label">Año instalación</label>
                <input className="input w-28" type="number" value={f('cash_year')||''} onChange={e=>set('cash_year',e.target.value)}/></div>
            </div>

            {/* VITEKA solo para Cashlogy */}
            {f('cash_brand') === 'cashlogy' && (
              <VitekaBlock
                dist={f('cash_viteka_dist')}
                onDist={v=>set('cash_viteka_dist',v)}
                support={f('cash_viteka_support')}
                onSupport={v=>set('cash_viteka_support',v)}
              />
            )}

            {/* Satisfacción */}
            {showCashSatisfaction && (
              <StarRating
                label="Grado de satisfacción con su actual distribuidor"
                value={f('cash_satisfaction')||0}
                onChange={v=>set('cash_satisfaction',v)}
              />
            )}
          </div>
        )}
      </SectionCard>

      {/* ── ETIQUETAS ELECTRÓNICAS ── */}
      <SectionCard icon="🏷️" title="Etiquetas electrónicas">
        <RadioGroup options={ESL_BRANDS} value={f('esl_brand')||''} onChange={v=>tog('esl_brand',v)}/>

        {f('esl_brand') && f('esl_brand') !== 'no' && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div><label className="label">Año instalación</label>
                <input className="input w-28" type="number" value={f('esl_year')||''} onChange={e=>set('esl_year',e.target.value)}/></div>
              {f('esl_brand') === 'otro' && (
                <div className="flex-1"><label className="label">Nombre</label>
                  <input className="input" value={f('esl_other_name')||''} onChange={e=>set('esl_other_name',e.target.value)}/></div>
              )}
            </div>
            {['hanshow','pricer'].includes(f('esl_brand')) && (
              <VitekaBlock
                dist={f('esl_viteka_dist')}
                onDist={v=>set('esl_viteka_dist',v)}
                support={f('esl_viteka_support')}
                onSupport={v=>set('esl_viteka_support',v)}
              />
            )}
            {showEslSatisfaction && (
              <StarRating
                label="Grado de satisfacción con su actual distribuidor"
                value={f('esl_satisfaction')||0}
                onChange={v=>set('esl_satisfaction',v)}
              />
            )}
          </div>
        )}
      </SectionCard>

      {/* ── BÁSCULAS ── */}
      <SectionCard icon="⚖️" title="Básculas">
        <RadioGroup options={SCALE_BRANDS} value={f('scale_brand')||''} onChange={v=>tog('scale_brand',v)}/>
        {f('scale_brand') && f('scale_brand') !== 'no' && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-3">
              {f('scale_brand') === 'otro' && (
                <div className="flex-1"><label className="label">Nombre</label>
                  <input className="input" value={f('scale_other_name')||''} onChange={e=>set('scale_other_name',e.target.value)}/></div>
              )}
              <div><label className="label">Año instalación</label>
                <input className="input w-28" type="number" value={f('scale_year')||''} onChange={e=>set('scale_year',e.target.value)}/></div>
            </div>
            {f('scale_brand') === 'pondus' && (
              <VitekaBlock
                dist={f('scale_viteka_dist')}
                onDist={v=>set('scale_viteka_dist',v)}
                support={f('scale_viteka_support')}
                onSupport={v=>set('scale_viteka_support',v)}
              />
            )}
          </div>
        )}
      </SectionCard>

      {/* ── ANTIHURTO ── */}
      <SectionCard icon="🔒" title="Antihurto">
        <RadioGroup options={ANTITHEFT_BRANDS} value={f('antitheft_brand')||''} onChange={v=>tog('antitheft_brand',v)}/>
        {f('antitheft_brand') && f('antitheft_brand') !== 'no' && (
          <div className="mt-4 flex gap-3">
            {f('antitheft_brand') === 'otro' && (
              <div className="flex-1"><label className="label">Indicar marca/modelo</label>
                <input className="input" value={f('antitheft_other')||''} onChange={e=>set('antitheft_other',e.target.value)}/></div>
            )}
            <div><label className="label">Año instalación</label>
              <input className="input w-28" type="number" value={f('antitheft_year')||''} onChange={e=>set('antitheft_year',e.target.value)}/></div>
          </div>
        )}
      </SectionCard>

      {/* ── CONSULTORÍA ── */}
      <SectionCard icon="📊" title="Consultoría">
        <RadioGroup options={CONSULTING_BRANDS} value={f('consulting_brand')||''} onChange={v=>tog('consulting_brand',v)}/>
        {f('consulting_brand') && f('consulting_brand') !== 'no' && (
          <div className="mt-4 flex flex-wrap gap-3">
            {f('consulting_brand') === 'otro' && (
              <div className="flex-1"><label className="label">Nombre</label>
                <input className="input" value={f('consulting_other')||''} onChange={e=>set('consulting_other',e.target.value)}/></div>
            )}
            <div><label className="label">Mes de inicio</label>
              <select className="input w-36" value={f('consulting_start_month')||''} onChange={e=>set('consulting_start_month',parseInt(e.target.value))}>
                <option value="">—</option>
                {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </select></div>
            <div><label className="label">Año de inicio</label>
              <input className="input w-28" type="number" value={f('consulting_start_year')||''} onChange={e=>set('consulting_start_year',e.target.value)}/></div>
          </div>
        )}
      </SectionCard>

      {/* ── ROBOT DISPENSADOR ── */}
      <SectionCard icon="🤖" title="Robot dispensador">
        <RadioGroup options={ROBOT_BRANDS} value={f('robot_brand')||''} onChange={v=>tog('robot_brand',v)}/>
        {f('robot_brand') && f('robot_brand') !== 'no' && (
          <div className="mt-4 flex gap-3">
            {f('robot_brand') === 'otro' && (
              <div className="flex-1"><label className="label">Indicar</label>
                <input className="input" value={f('robot_other')||''} onChange={e=>set('robot_other',e.target.value)}/></div>
            )}
            <div><label className="label">Año instalación</label>
              <input className="input w-28" type="number" value={f('robot_year')||''} onChange={e=>set('robot_year',e.target.value)}/></div>
          </div>
        )}
      </SectionCard>

      {/* ── PEQUEÑOS BLOQUES (grid 2 col) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Cruz */}
        <SectionCard icon="➕" title="Cruz">
          <div className="flex flex-wrap gap-2">
            {[{v:'si',l:'SI'},{v:'no',l:'NO'},{v:'puede_ampliar',l:'Puede ampliar'}].map(o=>(
              <label key={o.v} className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium ${
                f('cross_has')===o.v ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-gray-300 text-gray-600'
              }`}>
                <input type="radio" className="sr-only" onChange={()=>set('cross_has',o.v)}/>{o.l}
              </label>
            ))}
          </div>
          {f('cross_has') && f('cross_has') !== 'no' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><label className="label">Nº cruces</label>
                <input className="input" type="number" min="0" value={f('cross_count')||''} onChange={e=>set('cross_count',e.target.value)}/></div>
              {f('cross_has') === 'puede_ampliar' && (
                <div><label className="label">Nº ampliación</label>
                  <input className="input" type="number" min="0" value={f('cross_expand_count')||''} onChange={e=>set('cross_expand_count',e.target.value)}/></div>
              )}
            </div>
          )}
        </SectionCard>

        {/* Gestor de turnos */}
        <SectionCard icon="🔢" title="Gestor de turnos">
          <div className="flex gap-2">
            {[{v:true,l:'SI'},{v:false,l:'NO'}].map(o=>(
              <label key={String(o.v)} className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium ${
                f('queue_has')===o.v ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-gray-300 text-gray-600'
              }`}>
                <input type="radio" className="sr-only" onChange={()=>set('queue_has',o.v)}/>{o.l}
              </label>
            ))}
          </div>
          {f('queue_has') && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><label className="label">Marca</label>
                <input className="input" value={f('queue_brand')||''} onChange={e=>set('queue_brand',e.target.value)}/></div>
              <div><label className="label">Año</label>
                <input className="input" type="number" value={f('queue_year')||''} onChange={e=>set('queue_year',e.target.value)}/></div>
            </div>
          )}
        </SectionCard>

        {/* SPD */}
        <SectionCard icon="💊" title="SPD">
          <div className="flex gap-2">
            {[{v:true,l:'SI'},{v:false,l:'NO'}].map(o=>(
              <label key={String(o.v)} className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium ${
                f('spd_has')===o.v ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-gray-300 text-gray-600'
              }`}>
                <input type="radio" className="sr-only" onChange={()=>set('spd_has',o.v)}/>{o.l}
              </label>
            ))}
          </div>
          {f('spd_has') && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div><label className="label">Marca</label>
                <input className="input" value={f('spd_brand')||''} onChange={e=>set('spd_brand',e.target.value)}/></div>
              <div><label className="label">Año</label>
                <input className="input" type="number" value={f('spd_year')||''} onChange={e=>set('spd_year',e.target.value)}/></div>
            </div>
          )}
        </SectionCard>

        {/* Frigorífico */}
        <SectionCard icon="❄️" title="Frigorífico">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Marca</label>
              <input className="input" value={f('fridge_brand')||''} onChange={e=>set('fridge_brand',e.target.value)}/></div>
            <div><label className="label">Año</label>
              <input className="input" type="number" value={f('fridge_year')||''} onChange={e=>set('fridge_year',e.target.value)}/></div>
          </div>
        </SectionCard>

      </div>

      {/* Pantallas */}
      <SectionCard icon="🖥️" title="Pantallas">
        <div className="flex gap-2">
          {[{v:true,l:'SI'},{v:false,l:'NO'}].map(o=>(
            <label key={String(o.v)} className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium ${
              f('screens_has')===o.v ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-gray-300 text-gray-600'
            }`}>
              <input type="radio" className="sr-only" onChange={()=>set('screens_has',o.v)}/>{o.l}
            </label>
          ))}
        </div>
        {f('screens_has') && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-28"><label className="label">Marca</label>
                <input className="input" value={f('screens_brand')||''} onChange={e=>set('screens_brand',e.target.value)}/></div>
              <div><label className="label">Año</label>
                <input className="input w-28" type="number" value={f('screens_year')||''} onChange={e=>set('screens_year',e.target.value)}/></div>
            </div>
            <div>
              <label className="label mb-1">Ubicación (selección múltiple)</label>
              <div className="flex flex-wrap gap-2">
                {['interior','escaparate','exterior'].map(loc => {
                  const locs = f('screens_locations') || []
                  const active = locs.includes(loc)
                  return (
                    <label key={loc} className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium capitalize ${
                      active ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-gray-300 text-gray-600'
                    }`}>
                      <input type="checkbox" className="sr-only" checked={active}
                        onChange={() => {
                          const next = active ? locs.filter(l=>l!==loc) : [...locs, loc]
                          set('screens_locations', next)
                        }}
                      />
                      {loc.charAt(0).toUpperCase()+loc.slice(1)}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── EQUIPOS INFORMÁTICOS ── */}
      <SectionCard icon="💻" title="Equipos informáticos">
        <div className="flex gap-2 mb-4">
          {[{v:'viteka',l:'VITEKA'},{v:'otros',l:'Otros proveedores'}].map(o=>(
            <label key={o.v} className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium ${
              f('it_provider')===o.v ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-gray-50 border-gray-300 text-gray-600'
            }`}>
              <input type="radio" className="sr-only" onChange={()=>set('it_provider',o.v)}/>{o.l}
            </label>
          ))}
        </div>
        <EquipmentDevicesTab pharmacyId={pharmacyId}/>
      </SectionCard>

      {/* ── FOOTER GUARDAR ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && <span className="text-sm text-teal-600 font-medium">✅ Guardado correctamente</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Guardando…' : '💾 Guardar equipamiento'}
        </button>
      </div>

    </div>
  )
}
