import { useState } from 'react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROVINCES_AN = ['Almería','Cádiz','Córdoba','Granada','Huelva','Jaén','Málaga','Sevilla']

const ERP_BRANDS = ['Nixfarma','Farmatic','Unycop Next','Farmanager','Unycop Win','vGaleno','Compufarma','Otros']
const CASH_BRANDS = ['NO','Cashlogy','Cashinfinity','Cashkeeper','CashDro','CashProtect','Otro']
const CASH_MODELS = {
  Cashlogy:    ['1000','1500','2023','Maximate','Safe','MaxiSafe','Otro'],
  Cashinfinity:['CI-5','CI-10X','CI-100X','Otro'],
  Cashkeeper:  ['Compacto','Modular','Otro'],
  CashDro:     ['CashDro S','CashDro 4+','CashDro 5','CashDro 7','Otro'],
  CashProtect: ['400 AS','Pro AS','PJ','POS','1000','Otro'],
}
const ESL_BRANDS   = ['NO','Hanshow','Pricer','Expofarm','Farmaconnet','Otro']
const SCALE_BRANDS = ['NO','Pondus','Keito','Otro']
const ROBOT_BRANDS = ['NO','BD Rowa','Gollmann','Meditech','Willach','Fablox','Luse','KLS','Tecnyfarma']
const CONSULT_OPTIONS = ['NO','Viteka Pro Gestión','Avantia Plus Gestión','Otro']

const EQUIPO_ITEMS = [
  'Ordenadores sobremesa','Portátiles','Servidores',
  'Impresoras tickets','Impresoras etiquetas','Impresoras laser/tinta',
  'Monitores extra','Terminales TPV','SAI/UPS',
  'Switch/Router','NAS/Almacenamiento','Otro',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-soft)' }}>
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
function Input(p) { return <input className="input w-full" {...p} /> }
function Sel({ children, ...p }) { return <select className="input w-full" {...p}>{children}</select> }
function Textarea(p) { return <textarea className="input w-full" rows={3} {...p} /> }

function SatisfactionField({ value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-soft)' }}>Satisfacción con proveedor actual</label>
      <div className="flex gap-2">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold transition"
            style={value === n ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>{n}</button>
        ))}
      </div>
    </div>
  )
}

function VitekaToggle({ value, notes, onChangeValue, onChangeNotes }) {
  return (
    <div className="space-y-2">
      <label className="mb-1 block text-[12px] font-medium" style={{ color: 'var(--text-soft)' }}>¿Viteka es distribuidor y/o soporte?</label>
      <div className="flex gap-2">
        {['SI','NO'].map(opt => (
          <button key={opt} type="button" onClick={() => onChangeValue(opt)}
            className="flex-1 rounded-lg py-2 text-[13px] font-medium transition"
            style={value === opt ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>{opt}</button>
        ))}
      </div>
      {value === 'SI' && <Input placeholder="Notas sobre el contrato/soporte (opcional)" value={notes} onChange={e => onChangeNotes(e.target.value)} />}
    </div>
  )
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {[1, 2].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold transition"
            style={step >= n ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--surface-soft)', color: 'var(--muted)' }}>{n}</div>
          <span className="text-[12px]" style={{ color: step >= n ? 'var(--text)' : 'var(--muted)' }}>
            {n === 1 ? 'Tipo jurídico' : 'Productos'}
          </span>
          {n < 2 && <div className="h-px w-8" style={{ background: 'var(--border)' }} />}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// STEP 1
// ---------------------------------------------------------------------------
function Step1({ data, onChange }) {
  const types = data.legal_type || []

  function toggleType(t) {
    let next
    if (types.includes(t)) { next = types.filter(x => x !== t) }
    else if (t === 'autonomo') next = [...types.filter(x => x !== 'cb'), 'autonomo']
    else if (t === 'cb')      next = [...types.filter(x => x !== 'autonomo'), 'cb']
    else next = [...types, t]
    onChange({ ...data, legal_type: next })
  }

  function set(field, val) { onChange({ ...data, [field]: val }) }
  function setOwner(i, field, val) {
    const owners = [...(data.cb_owners || [{ name:'', nif:'', collegiate_number:'' }, { name:'', nif:'', collegiate_number:'' }])]
    owners[i] = { ...owners[i], [field]: val }
    onChange({ ...data, cb_owners: owners })
  }
  function addOwner() { onChange({ ...data, cb_owners: [...(data.cb_owners||[]), { name:'', nif:'', collegiate_number:'' }] }) }
  function removeOwner(i) {
    const owners = [...(data.cb_owners||[])]
    if (owners.length <= 2) return
    owners.splice(i, 1)
    onChange({ ...data, cb_owners: owners })
  }

  const cbOwners = data.cb_owners || [{ name:'', nif:'', collegiate_number:'' }, { name:'', nif:'', collegiate_number:'' }]
  const hasAuto = types.includes('autonomo')
  const hasCB   = types.includes('cb')
  const hasSL   = types.includes('sl')

  return (
    <div className="space-y-6">
      {/* Type selector */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Tipo jurídico</label>
        <p className="mb-3 text-[12px]" style={{ color: 'var(--muted)' }}>Autónomo y C.B. son mutuamente excluyentes. S.L. puede complementar a cualquiera.</p>
        <div className="flex flex-wrap gap-2">
          {[['autonomo','Autónomo'],['cb','C.B.'],['sl','S.L.']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => toggleType(val)}
              className="rounded-xl border px-4 py-2 text-[13px] font-medium transition"
              style={types.includes(val)
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : { background: 'var(--surface)', color: 'var(--text-soft)', borderColor: 'var(--border)' }
              }>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Autónomo */}
      {hasAuto && (
        <fieldset className="rounded-xl p-4 space-y-4" style={{ border: '1px solid var(--border)' }}>
          <legend className="px-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Autónomo</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre del titular" required><Input value={data.pharmacist_owner||''} onChange={e=>set('pharmacist_owner',e.target.value)} /></Field>
            <Field label="NIF"><Input value={data.nif_cif||''} onChange={e=>set('nif_cif',e.target.value)} /></Field>
            <Field label="Nº Colegiado"><Input value={data.collegiate_number||''} onChange={e=>set('collegiate_number',e.target.value)} /></Field>
            <Field label="SOE"><Input value={data.soe_number||''} onChange={e=>set('soe_number',e.target.value)} /></Field>
            <Field label="Teléfono farmacia"><Input type="tel" value={data.contact_phone||''} onChange={e=>set('contact_phone',e.target.value)} /></Field>
            <Field label="Email farmacia"><Input type="email" value={data.contact_email||''} onChange={e=>set('contact_email',e.target.value)} /></Field>
            <Field label="Dirección"><Input value={data.address||''} onChange={e=>set('address',e.target.value)} /></Field>
            <Field label="Provincia">
              <Sel value={data.province||''} onChange={e=>set('province',e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROVINCES_AN.map(p=><option key={p} value={p}>{p}</option>)}
              </Sel>
            </Field>
            <Field label="Población"><Input value={data.city||''} onChange={e=>set('city',e.target.value)} /></Field>
            <Field label="C.P."><Input value={data.postal_code||''} onChange={e=>set('postal_code',e.target.value)} /></Field>
            <Field label="Horario"><Input value={data.schedule||''} onChange={e=>set('schedule',e.target.value)} /></Field>
            <Field label="Guardias">
              <Sel value={data.has_guards?'si':'no'} onChange={e=>set('has_guards',e.target.value==='si')}>
                <option value="no">NO</option><option value="si">SI</option>
              </Sel>
            </Field>
          </div>
          <Field label="Observaciones"><Textarea value={data.observations||''} onChange={e=>set('observations',e.target.value)} /></Field>
        </fieldset>
      )}

      {/* C.B. */}
      {hasCB && (
        <fieldset className="rounded-xl p-4 space-y-4" style={{ border: '1px solid var(--border)' }}>
          <legend className="px-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Comunidad de Bienes</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Razón social" required><Input value={data.name||''} onChange={e=>set('name',e.target.value)} /></Field>
            <Field label="CIF"><Input value={data.nif_cif||''} onChange={e=>set('nif_cif',e.target.value)} /></Field>
            <Field label="Teléfono"><Input type="tel" value={data.contact_phone||''} onChange={e=>set('contact_phone',e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={data.contact_email||''} onChange={e=>set('contact_email',e.target.value)} /></Field>
            <Field label="Dirección"><Input value={data.address||''} onChange={e=>set('address',e.target.value)} /></Field>
            <Field label="Provincia">
              <Sel value={data.province||''} onChange={e=>set('province',e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROVINCES_AN.map(p=><option key={p} value={p}>{p}</option>)}
              </Sel>
            </Field>
            <Field label="Población"><Input value={data.city||''} onChange={e=>set('city',e.target.value)} /></Field>
            <Field label="SOE"><Input value={data.soe_number||''} onChange={e=>set('soe_number',e.target.value)} /></Field>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Titulares (mín. 2)</span>
              <button type="button" onClick={addOwner} className="text-[12px] font-medium hover:underline" style={{ color: 'var(--primary)' }}>+ Añadir titular</button>
            </div>
            <div className="space-y-3">
              {cbOwners.map((owner, i) => (
                <div key={i} className="rounded-lg p-3 space-y-2" style={{ background: 'var(--surface-soft)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium" style={{ color: 'var(--muted)' }}>Titular {i+1}</span>
                    {i >= 2 && <button type="button" onClick={() => removeOwner(i)} className="text-[11px]" style={{ color: 'var(--badge-red-text)' }}>Eliminar</button>}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Field label="Nombre"><Input value={owner.name||''} onChange={e=>setOwner(i,'name',e.target.value)} /></Field>
                    <Field label="NIF"><Input value={owner.nif||''} onChange={e=>setOwner(i,'nif',e.target.value)} /></Field>
                    <Field label="Nº Colegiado"><Input value={owner.collegiate_number||''} onChange={e=>setOwner(i,'collegiate_number',e.target.value)} /></Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Field label="Observaciones"><Textarea value={data.observations||''} onChange={e=>set('observations',e.target.value)} /></Field>
        </fieldset>
      )}

      {/* S.L. */}
      {hasSL && (
        <fieldset className="rounded-xl p-4 space-y-4" style={{ border: '1px solid var(--border)' }}>
          <legend className="px-2 text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Sociedad Limitada</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Razón social" required><Input value={data.sl_name||''} onChange={e=>set('sl_name',e.target.value)} /></Field>
            <Field label="CIF"><Input value={data.sl_cif||''} onChange={e=>set('sl_cif',e.target.value)} /></Field>
            <Field label="Teléfono S.L."><Input type="tel" value={data.sl_phone||''} onChange={e=>set('sl_phone',e.target.value)} /></Field>
            <Field label="Email S.L."><Input type="email" value={data.sl_email||''} onChange={e=>set('sl_email',e.target.value)} /></Field>
          </div>
        </fieldset>
      )}

      {/* Nombre farmacia — siempre visible */}
      <Field label="Nombre de la farmacia" required>
        <Input value={data.pharmacy_name||''} onChange={e=>set('pharmacy_name',e.target.value)} placeholder="Farmacia San Juan" />
      </Field>
    </div>
  )
}

// ---------------------------------------------------------------------------
// STEP 2
// ---------------------------------------------------------------------------
function Step2({ products, onChange }) {
  function set(cat, field, val) { onChange({ ...products, [cat]: { ...(products[cat]||{}), [field]: val } }) }
  function get(cat, field, def = '') { return products[cat]?.[field] ?? def }

  return (
    <div className="space-y-6">

      <ProductSection title="ERP">
        <Field label="Sistema ERP">
          <Sel value={get('erp','brand')} onChange={e => set('erp','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {ERP_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('erp','brand') === 'Nixfarma' && (
          <VitekaToggle value={get('erp','viteka_support')} notes={get('erp','viteka_notes')}
            onChangeValue={v=>set('erp','viteka_support',v)} onChangeNotes={v=>set('erp','viteka_notes',v)} />
        )}
        {get('erp','brand') && get('erp','brand') !== 'Nixfarma' && (
          <SatisfactionField value={get('erp','satisfaction',null)} onChange={v=>set('erp','satisfaction',v)} />
        )}
        {get('erp','brand') === 'Nixfarma' && get('erp','viteka_support') === 'NO' && (
          <SatisfactionField value={get('erp','satisfaction',null)} onChange={v=>set('erp','satisfaction',v)} />
        )}
      </ProductSection>

      <ProductSection title="Caja de cobro">
        <Field label="Marca">
          <Sel value={get('caja_cobro','brand')} onChange={e=>{set('caja_cobro','brand',e.target.value);set('caja_cobro','model','')}}>
            <option value="">Seleccionar...</option>
            {CASH_BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('caja_cobro','brand') && get('caja_cobro','brand') !== 'NO' && (
          <>
            {CASH_MODELS[get('caja_cobro','brand')] && (
              <Field label="Modelo">
                <Sel value={get('caja_cobro','model')} onChange={e=>set('caja_cobro','model',e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {CASH_MODELS[get('caja_cobro','brand')].map(m=><option key={m} value={m}>{m}</option>)}
                </Sel>
              </Field>
            )}
            <Field label="Año">
              <Sel value={get('caja_cobro','install_year')} onChange={e=>set('caja_cobro','install_year',e.target.value)}>
                <option value="">Seleccionar...</option>
                {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
              </Sel>
            </Field>
            {get('caja_cobro','brand') === 'Cashlogy' && (
              <VitekaToggle value={get('caja_cobro','viteka_support')} notes={get('caja_cobro','viteka_notes')}
                onChangeValue={v=>set('caja_cobro','viteka_support',v)} onChangeNotes={v=>set('caja_cobro','viteka_notes',v)} />
            )}
            {(get('caja_cobro','brand') !== 'Cashlogy' || get('caja_cobro','viteka_support') === 'NO') && (
              <SatisfactionField value={get('caja_cobro','satisfaction',null)} onChange={v=>set('caja_cobro','satisfaction',v)} />
            )}
          </>
        )}
      </ProductSection>

      <ProductSection title="Etiquetas electrónicas">
        <Field label="Marca">
          <Sel value={get('etiquetas','brand')} onChange={e=>set('etiquetas','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {ESL_BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('etiquetas','brand') && get('etiquetas','brand') !== 'NO' && (
          <>
            <Field label="Año">
              <Sel value={get('etiquetas','install_year')} onChange={e=>set('etiquetas','install_year',e.target.value)}>
                <option value="">Seleccionar...</option>
                {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
              </Sel>
            </Field>
            {['Hanshow','Pricer'].includes(get('etiquetas','brand')) && (
              <VitekaToggle value={get('etiquetas','viteka_support')} notes={get('etiquetas','viteka_notes')}
                onChangeValue={v=>set('etiquetas','viteka_support',v)} onChangeNotes={v=>set('etiquetas','viteka_notes',v)} />
            )}
            {(!['Hanshow','Pricer'].includes(get('etiquetas','brand')) || get('etiquetas','viteka_support') === 'NO') && (
              <SatisfactionField value={get('etiquetas','satisfaction',null)} onChange={v=>set('etiquetas','satisfaction',v)} />
            )}
          </>
        )}
      </ProductSection>

      <ProductSection title="Báscula">
        <Field label="Marca">
          <Sel value={get('basculas','brand')} onChange={e=>set('basculas','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {SCALE_BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('basculas','brand') && get('basculas','brand') !== 'NO' && (
          <>
            <Field label="Año">
              <Sel value={get('basculas','install_year')} onChange={e=>set('basculas','install_year',e.target.value)}>
                <option value="">Seleccionar...</option>
                {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
              </Sel>
            </Field>
            {get('basculas','brand') === 'Pondus' && (
              <VitekaToggle value={get('basculas','viteka_support')} notes={get('basculas','viteka_notes')}
                onChangeValue={v=>set('basculas','viteka_support',v)} onChangeNotes={v=>set('basculas','viteka_notes',v)} />
            )}
          </>
        )}
      </ProductSection>

      <ProductSection title="Arcos antihurto">
        <Field label="Marca">
          <Sel value={get('antihurto','brand')} onChange={e=>set('antihurto','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {['Checkpoint','Otro'].map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('antihurto','brand') && (
          <Field label="Año">
            <Sel value={get('antihurto','install_year')} onChange={e=>set('antihurto','install_year',e.target.value)}>
              <option value="">Seleccionar...</option>
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </Sel>
          </Field>
        )}
      </ProductSection>

      <ProductSection title="Consultoría">
        <Field label="Servicio">
          <Sel value={get('consultoria','brand')} onChange={e=>set('consultoria','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {CONSULT_OPTIONS.map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('consultoria','brand') && get('consultoria','brand') !== 'NO' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mes">
                <Sel value={get('consultoria','install_month')} onChange={e=>set('consultoria','install_month',e.target.value)}>
                  <option value="">Mes...</option>
                  {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
                </Sel>
              </Field>
              <Field label="Año">
                <Sel value={get('consultoria','install_year')} onChange={e=>set('consultoria','install_year',e.target.value)}>
                  <option value="">Año...</option>
                  {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </Sel>
              </Field>
            </div>
            {!get('consultoria','brand').toLowerCase().includes('viteka') && (
              <SatisfactionField value={get('consultoria','satisfaction',null)} onChange={v=>set('consultoria','satisfaction',v)} />
            )}
          </>
        )}
      </ProductSection>

      <ProductSection title="Equipos informáticos">
        <Field label="Proveedor">
          <Sel value={get('equipos','brand')} onChange={e=>set('equipos','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {['Viteka','Otros'].map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('equipos','brand') && (
          <>
            <p className="text-[12px] rounded-lg px-3 py-2" style={{ background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>
              {get('equipos','brand') === 'Viteka'
                ? 'Se podrán gestionar garantías y seguimiento desde la página de la farmacia.'
                : 'Se registrará la infraestructura existente para planificación de sustitución.'}
            </p>
            <Field label="Equipamiento instalado">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 mt-1">
                {EQUIPO_ITEMS.map(item => {
                  const selected = (get('equipos','items')||[]).includes(item)
                  return (
                    <label key={item}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition select-none"
                      style={selected ? { background: 'var(--primary-soft, rgba(0,86,67,0.08))', color: 'var(--primary)' } : { color: 'var(--text-soft)' }}>
                      <input type="checkbox"
                        className="h-3.5 w-3.5 accent-[var(--primary)] shrink-0"
                        checked={selected}
                        onChange={() => {
                          const prev = get('equipos','items') || []
                          set('equipos','items', selected ? prev.filter(i=>i!==item) : [...prev,item])
                        }} />
                      <span className="text-[12px] leading-tight">{item}</span>
                    </label>
                  )
                })}
              </div>
            </Field>
            <Field label="Notas equipos">
              <Input placeholder="Nº unidades, marcas específicas..." value={get('equipos','notes')} onChange={e=>set('equipos','notes',e.target.value)} />
            </Field>
          </>
        )}
      </ProductSection>

      <ProductSection title="Robot dispensador">
        <Field label="Marca">
          <Sel value={get('robot','brand')} onChange={e=>set('robot','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {ROBOT_BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
        {get('robot','brand') && get('robot','brand') !== 'NO' && (
          <Field label="Año">
            <Sel value={get('robot','install_year')} onChange={e=>set('robot','install_year',e.target.value)}>
              <option value="">Seleccionar...</option>
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </Sel>
          </Field>
        )}
      </ProductSection>

      <ProductSection title="Cruz">
        <Field label="Estado">
          <Sel value={get('cruz','brand')} onChange={e=>set('cruz','brand',e.target.value)}>
            <option value="">Seleccionar...</option>
            {['SI','NO','Puede ampliar'].map(b=><option key={b} value={b}>{b}</option>)}
          </Sel>
        </Field>
      </ProductSection>

      <ProductSection title="Gestor de turnos">
        <Field label="¿Tiene gestor?">
          <Sel value={get('turnos','has')} onChange={e=>set('turnos','has',e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="SI">SI</option><option value="NO">NO</option>
          </Sel>
        </Field>
        {get('turnos','has') === 'SI' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca"><Input value={get('turnos','brand')} onChange={e=>set('turnos','brand',e.target.value)} /></Field>
            <Field label="Año">
              <Sel value={get('turnos','install_year')} onChange={e=>set('turnos','install_year',e.target.value)}>
                <option value="">Seleccionar...</option>
                {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
              </Sel>
            </Field>
          </div>
        )}
      </ProductSection>

      <ProductSection title="SPD">
        <Field label="¿Tiene SPD?">
          <Sel value={get('spd','has')} onChange={e=>set('spd','has',e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="SI">SI</option><option value="NO">NO</option>
          </Sel>
        </Field>
        {get('spd','has') === 'SI' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca"><Input value={get('spd','brand')} onChange={e=>set('spd','brand',e.target.value)} /></Field>
            <Field label="Año">
              <Sel value={get('spd','install_year')} onChange={e=>set('spd','install_year',e.target.value)}>
                <option value="">Seleccionar...</option>
                {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
              </Sel>
            </Field>
          </div>
        )}
      </ProductSection>

      <ProductSection title="Pantallas">
        <Field label="¿Tiene pantallas?">
          <Sel value={get('pantallas','has')} onChange={e=>set('pantallas','has',e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="SI">SI</option><option value="NO">NO</option>
          </Sel>
        </Field>
        {get('pantallas','has') === 'SI' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Marca"><Input value={get('pantallas','brand')} onChange={e=>set('pantallas','brand',e.target.value)} /></Field>
              <Field label="Año">
                <Sel value={get('pantallas','install_year')} onChange={e=>set('pantallas','install_year',e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </Sel>
              </Field>
            </div>
            <Field label="Ubicación">
              <div className="flex flex-wrap gap-2">
                {['Interior','Escaparate','Exterior'].map(loc => {
                  const locs = get('pantallas','locations') || []
                  const active = locs.includes(loc)
                  return (
                    <button key={loc} type="button"
                      onClick={() => set('pantallas','locations', active ? locs.filter(l=>l!==loc) : [...locs,loc])}
                      className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
                      style={active ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>{loc}</button>
                  )
                })}
              </div>
            </Field>
          </>
        )}
      </ProductSection>

      <ProductSection title="Frigorífico">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Marca"><Input value={get('frigorifico','brand')} onChange={e=>set('frigorifico','brand',e.target.value)} /></Field>
          <Field label="Año">
            <Sel value={get('frigorifico','install_year')} onChange={e=>set('frigorifico','install_year',e.target.value)}>
              <option value="">Seleccionar...</option>
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </Sel>
          </Field>
        </div>
      </ProductSection>

    </div>
  )
}

// ---------------------------------------------------------------------------
// ProductSection
// ---------------------------------------------------------------------------
function ProductSection({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl" style={{ border: '1px solid var(--border)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--muted)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="space-y-4 border-t px-4 pb-4 pt-4" style={{ borderColor: 'var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CreateClientModal
// ---------------------------------------------------------------------------
export default function CreateClientModal({ isOpen, onClose, onCreate }) {
  const [step, setStep] = useState(1)
  const [clientData, setClientData] = useState({
    legal_type: [],
    cb_owners: [{ name:'', nif:'', collegiate_number:'' }, { name:'', nif:'', collegiate_number:'' }],
  })
  const [products, setProducts] = useState({})
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  function validateStep1() {
    if (!clientData.legal_type?.length) return 'Selecciona al menos un tipo jurídico.'
    if (!clientData.pharmacy_name?.trim()) return 'El nombre de la farmacia es obligatorio.'
    return null
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Enviamos el payload plano: campos del cliente + products como clave separada
      await onCreate({ ...clientData, products })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto p-4 pt-8"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>Nueva farmacia</h2>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
            style={{ background: 'var(--surface-soft)', color: 'var(--muted)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <StepIndicator step={step} />
          {step === 1
            ? <Step1 data={clientData} onChange={setClientData} />
            : <Step2 products={products} onChange={setProducts} />
          }
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4" style={{ borderColor: 'var(--border)' }}>
          <button type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="rounded-xl px-4 py-2 text-[13px] font-medium transition hover:opacity-80"
            style={{ background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>
            {step === 1 ? 'Cancelar' : '← Anterior'}
          </button>
          {step === 1 ? (
            <button type="button"
              onClick={() => { const e = validateStep1(); if (e) { alert(e); return } setStep(2) }}
              className="btn-primary px-5 py-2 text-[13px]">Siguiente →</button>
          ) : (
            <button type="button" onClick={handleSave} disabled={saving}
              className="btn-primary px-5 py-2 text-[13px] disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar farmacia'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
