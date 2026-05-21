import { useState, useEffect, useRef, useCallback } from 'react'
import { useEquipamiento } from '../hooks/useEquipamiento'
import { supabase } from '../lib/supabase'

// ── Constantes ──────────────────────────────────────────────────────────────────
const ERP_OPTIONS = [
  'Nixfarma','Farmatic','Unycop Next','Farmanager','Unicop Win','vGaleno','Compufarma','Otro'
]
const CAJA_OPTIONS = [
  { value: 'no', label: 'NO' },
  { value: 'cashlogy', label: 'Cashlogy' },
  { value: 'cashinfinity', label: 'Cashinfinity' },
  { value: 'cashkeeper', label: 'Cashkeeper' },
  { value: 'cashdro', label: 'CashDro' },
  { value: 'cashprotect', label: 'CashProtect' },
  { value: 'otro', label: 'Otro' },
]
const CAJA_MODELS = {
  cashlogy:    ['1000','1500','2023','Maximate','Safe','MaxiSafe','Otro'],
  cashinfinity:['CI-5','CI-10X','CI-100X','Otro'],
  cashkeeper:  ['Compacto','Modular','Otro'],
  cashdro:     ['CashDro S','CashDro 4+','CashDro 5','CashDro 7','Otro'],
  cashprotect: ['CashProtect 400 AS','CashProtect Pro AS','CashProtect PJ','CashProtect POS','CashProtect 1000','Otro'],
}
const ESL_OPTIONS = [
  { value: 'no', label: 'NO' },
  { value: 'hanshow', label: 'Hanshow' },
  { value: 'pricer', label: 'Pricer' },
  { value: 'expofarm', label: 'Expofarm' },
  { value: 'farmaconnet', label: 'Farmaconnet' },
  { value: 'otro', label: 'Otro (indicar)' },
]
const BASCULA_OPTIONS = ['no','Pondus','Keito','Otro (indicar)']
const ANTIHURTO_OPTIONS = ['no','Checkpoint','Otro (indicar)']
const CONSULTORIA_OPTIONS = ['no','Viteka Pro Gestión','Avantia Plus Gestión','Otro (indicar)']
const ROBOT_OPTIONS = ['NO','BD Rowa','Gollmann','Meditech','Willach','Fablox','Luse','KLS','Tecnyfarma','Otro']
const IT_TYPES = [
  'Servidor','Estación','Impresora documentos','Impresora tickets',
  'Impresora etiquetas adhesivas','SAI','Router','Switch',
]
const IT_ICONS = {
  'Servidor': '🖥️',
  'Estación': '💻',
  'Impresora documentos': '🖨️',
  'Impresora tickets': '🧾',
  'Impresora etiquetas adhesivas': '🏷️',
  'SAI': '🔋',
  'Router': '🌐',
  'Switch': '🔀',
}
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DISK_TYPES = ['SSD','HDD','NVMe']
const CONN_TYPES = ['Ethernet','USB','Serie','Bluetooth','WiFi','Otro']
const MONITOR_CONN = ['HDMI','VGA','DVI','DisplayPort','Otro']
const CAPA_OPTIONS = ['1ª','2ª','3ª','4ª','5ª']

// ── Utils ────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
function isExpired(d) { return d && new Date(d) < new Date() }

// ── Sub-componentes atómicos ─────────────────────────────────────────────────────────
function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function RadioPills({ options, value, onChange, name }) {
  return (
    <div className="flex flex-wrap gap-2 mb-1">
      {options.map(opt => {
        const val = typeof opt === 'object' ? opt.value : opt
        const lbl = typeof opt === 'object' ? opt.label : opt
        const active = value === val || (!value && val === 'no') || (!value && val === 'NO')
        return (
          <label key={val} className={`radio-pill${active ? ' active' : ''}`}>
            <input type="radio" name={name} value={val} checked={value === val} onChange={() => onChange(val)} className="sr-only" />
            {lbl}
          </label>
        )
      })}
    </div>
  )
}

function Conditional({ show, title, children }) {
  if (!show) return null
  return (
    <div className="conditional mt-2">
      {title && <p className="conditional-title">{title}</p>}
      {children}
    </div>
  )
}

function YearInput({ value, onChange, label = 'Año instalación' }) {
  return (
    <Field label={label}>
      <input className="input w-28" type="number" min="1990" max="2099" placeholder="Ej: 2022" value={value || ''} onChange={e => onChange(e.target.value)} />
    </Field>
  )
}

function SatisfactionStars({ value, onChange, label = 'Grado de satisfacción' }) {
  return (
    <div className="mt-2">
      <label className="label">{label} (1–5)</label>
      <div className="flex gap-1 items-center">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`text-2xl leading-none transition-colors ${
              n <= (value || 0) ? 'text-yellow-400' : 'text-gray-300'
            }`}>★</button>
        ))}
        {value > 0 && <span className="text-sm text-gray-500 ml-2">{value}/5</span>}
      </div>
    </div>
  )
}

function VitekaDistrib({ data, onChange }) {
  return (
    <div className="space-y-2 mt-2">
      <div>
        <label className="label">¿Es <strong>VITEKA</strong> su distribuidor?</label>
        <div className="flex gap-2">
          {['SI','NO'].map(v => (
            <label key={v} className={`radio-pill${ data.viteka_distrib === v ? ' active' : ''}`}>
              <input type="radio" className="sr-only" checked={data.viteka_distrib === v} onChange={() => onChange({ ...data, viteka_distrib: v })} />
              {v}
            </label>
          ))}
        </div>
      </div>
      {data.viteka_distrib === 'NO' && (
        <SatisfactionStars value={data.satisfaction} onChange={v => onChange({ ...data, satisfaction: v })} label="Grado de satisfacción con su distribuidor actual" />
      )}
      <Field label="Observaciones sobre soporte">
        <input className="input" placeholder="Notas…" value={data.soporte_obs || ''} onChange={e => onChange({ ...data, soporte_obs: e.target.value })} />
      </Field>
    </div>
  )
}

// ── Secciones ──────────────────────────────────────────────────────────────────
function SeccionERP({ data, onChange }) {
  const erp = data.erp || ''
  const nixData = data.nixfarma_detail || {}
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="card">
      <h2><span className="section-icon">💾</span> ERP</h2>
      <RadioPills name="erp" options={ERP_OPTIONS} value={erp} onChange={v => set('erp', v)} />
      <Conditional show={erp === 'Nixfarma'} title="🔧 Detalle Nixfarma">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Licencia"><input className="input" value={nixData.licencia || ''} onChange={e => set('nixfarma_detail', { ...nixData, licencia: e.target.value })} /></Field>
          <Field label="Nº puestos"><input className="input" type="number" min="1" value={nixData.puestos || ''} onChange={e => set('nixfarma_detail', { ...nixData, puestos: e.target.value })} /></Field>
          <Field label="Año inicio"><input className="input" type="number" min="1990" max="2099" value={nixData.anio || ''} onChange={e => set('nixfarma_detail', { ...nixData, anio: e.target.value })} /></Field>
          <Field label="Productos asociados"><input className="input" placeholder="Farmaclick…" value={nixData.productos || ''} onChange={e => set('nixfarma_detail', { ...nixData, productos: e.target.value })} /></Field>
        </div>
      </Conditional>
      <Conditional show={erp !== '' && erp !== 'Nixfarma'}>
        <SatisfactionStars value={data.erp_satisfaction} onChange={v => set('erp_satisfaction', v)} />
      </Conditional>
    </div>
  )
}

function SeccionCaja({ data, onChange }) {
  const caja = data.caja || 'no'
  const set = (k, v) => onChange({ ...data, [k]: v })
  const cajaData = data.caja_detail || {}
  const needsSatisfaction = caja !== 'no' && caja !== 'cashlogy'
  const models = CAJA_MODELS[caja] || null
  return (
    <div className="card">
      <h2><span className="section-icon">🏧</span> Caja de cobro</h2>
      <RadioPills name="caja" options={CAJA_OPTIONS} value={caja} onChange={v => { set('caja', v); set('caja_detail', {}) }} />
      <Conditional show={caja !== 'no' && models}>
        <div className="flex flex-wrap gap-3">
          <Field label="Modelo">
            <select className="input w-48" value={cajaData.modelo || ''} onChange={e => set('caja_detail', { ...cajaData, modelo: e.target.value })}>
              <option value="">Selecciona…</option>
              {(models || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <YearInput value={cajaData.anio} onChange={v => set('caja_detail', { ...cajaData, anio: v })} />
        </div>
      </Conditional>
      <Conditional show={caja === 'otro'}>
        <Field label="Modelo (texto libre)"><input className="input" value={cajaData.modelo_otro || ''} onChange={e => set('caja_detail', { ...cajaData, modelo_otro: e.target.value })} /></Field>
      </Conditional>
      <Conditional show={caja === 'cashlogy'}>
        <VitekaDistrib data={cajaData} onChange={v => set('caja_detail', v)} />
      </Conditional>
      {needsSatisfaction && (
        <SatisfactionStars value={data.caja_satisfaction} onChange={v => set('caja_satisfaction', v)} />
      )}
    </div>
  )
}

function SeccionESL({ data, onChange }) {
  const esl = data.esl || 'no'
  const set = (k, v) => onChange({ ...data, [k]: v })
  const eslData = data.esl_detail || {}
  const hasViteka = ['hanshow','pricer'].includes(esl)
  const needsYear = esl !== 'no'
  const needsSatisfaction = esl !== 'no' && esl !== 'hanshow'
  return (
    <div className="card">
      <h2><span className="section-icon">🏷️</span> Etiquetas electrónicas</h2>
      <RadioPills name="esl" options={ESL_OPTIONS} value={esl} onChange={v => { set('esl', v); set('esl_detail', {}) }} />
      <Conditional show={esl === 'otro'}>
        <Field label="Indicar marca/modelo"><input className="input" value={eslData.otro_nombre || ''} onChange={e => set('esl_detail', { ...eslData, otro_nombre: e.target.value })} /></Field>
      </Conditional>
      <Conditional show={needsYear}>
        <YearInput value={eslData.anio} onChange={v => set('esl_detail', { ...eslData, anio: v })} />
      </Conditional>
      <Conditional show={hasViteka}>
        <VitekaDistrib data={eslData} onChange={v => set('esl_detail', v)} />
      </Conditional>
      {needsSatisfaction && (
        <SatisfactionStars value={data.esl_satisfaction} onChange={v => set('esl_satisfaction', v)} />
      )}
    </div>
  )
}

function SeccionBascula({ data, onChange }) {
  const val = data.bascula || 'no'
  const det = data.bascula_detail || {}
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="card">
      <h2><span className="section-icon">⚖️</span> Básculas</h2>
      <RadioPills name="bascula" options={BASCULA_OPTIONS} value={val} onChange={v => { set('bascula', v); set('bascula_detail', {}) }} />
      <Conditional show={val !== 'no'}>
        <div className="space-y-2">
          <YearInput value={det.anio} onChange={v => set('bascula_detail', { ...det, anio: v })} />
          {val === 'Otro (indicar)' && <Field label="Indicar marca/modelo"><input className="input" value={det.otro || ''} onChange={e => set('bascula_detail', { ...det, otro: e.target.value })} /></Field>}
          {val === 'Pondus' && <VitekaDistrib data={det} onChange={v => set('bascula_detail', v)} />}
        </div>
      </Conditional>
    </div>
  )
}

function SeccionAntihurto({ data, onChange }) {
  const val = data.antihurto || 'no'
  const det = data.antihurto_detail || {}
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="card">
      <h2><span className="section-icon">🔒</span> Antihurto</h2>
      <RadioPills name="antihurto" options={ANTIHURTO_OPTIONS} value={val} onChange={v => { set('antihurto', v); set('antihurto_detail', {}) }} />
      <Conditional show={val !== 'no'}>
        <div className="flex flex-wrap gap-3">
          <YearInput value={det.anio} onChange={v => set('antihurto_detail', { ...det, anio: v })} />
          {val === 'Otro (indicar)' && <Field label="Indicar"><input className="input" value={det.otro || ''} onChange={e => set('antihurto_detail', { ...det, otro: e.target.value })} /></Field>}
        </div>
      </Conditional>
    </div>
  )
}

function SeccionConsultoria({ data, onChange }) {
  const val = data.consultoria || 'no'
  const det = data.consultoria_detail || {}
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="card">
      <h2><span className="section-icon">📊</span> Consultoría</h2>
      <RadioPills name="consultoria" options={CONSULTORIA_OPTIONS} value={val} onChange={v => { set('consultoria', v); set('consultoria_detail', {}) }} />
      <Conditional show={val !== 'no'}>
        <div className="flex flex-wrap gap-3">
          {val === 'Otro (indicar)' && <Field label="Indicar servicio"><input className="input" value={det.otro || ''} onChange={e => set('consultoria_detail', { ...det, otro: e.target.value })} /></Field>}
          <Field label="Mes inicio">
            <select className="input w-36" value={det.mes || ''} onChange={e => set('consultoria_detail', { ...det, mes: e.target.value })}>
              <option value="">Selecciona…</option>
              {MESES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Año inicio"><input className="input w-28" type="number" min="1990" max="2099" placeholder="2022" value={det.anio || ''} onChange={e => set('consultoria_detail', { ...det, anio: e.target.value })} /></Field>
        </div>
      </Conditional>
    </div>
  )
}

function SeccionRobot({ data, onChange }) {
  const val = data.robot || 'NO'
  const det = data.robot_detail || {}
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="card">
      <h2><span className="section-icon">🤖</span> Robot dispensador</h2>
      <RadioPills name="robot" options={ROBOT_OPTIONS} value={val} onChange={v => { set('robot', v); set('robot_detail', {}) }} />
      <Conditional show={val !== 'NO'}>
        <div className="flex flex-wrap gap-3">
          <YearInput value={det.anio} onChange={v => set('robot_detail', { ...det, anio: v })} />
          {val === 'Otro' && <Field label="Indicar marca/modelo"><input className="input" value={det.otro || ''} onChange={e => set('robot_detail', { ...det, otro: e.target.value })} /></Field>}
        </div>
      </Conditional>
    </div>
  )
}

function SeccionCruz({ data, onChange }) {
  const val = data.cruz || 'NO'
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="card">
      <h2><span className="section-icon">➕</span> Cruz</h2>
      <RadioPills name="cruz" options={['SI','NO','Puede ampliar']} value={val} onChange={v => set('cruz', v)} />
      <Conditional show={val !== 'NO'}>
        <div className="flex flex-wrap gap-3">
          {(val === 'SI' || val === 'Puede ampliar') && <Field label="Nº cruces actuales"><input className="input w-28" type="number" min="0" value={data.cruz_actual || ''} onChange={e => set('cruz_actual', e.target.value)} /></Field>}
          {val === 'Puede ampliar' && <Field label="Nº ampliación posible"><input className="input w-28" type="number" min="0" value={data.cruz_ampliacion || ''} onChange={e => set('cruz_ampliacion', e.target.value)} /></Field>}
        </div>
      </Conditional>
    </div>
  )
}

function SeccionSiNo({ field, label, icon, data, onChange }) {
  const val = data[field] || 'NO'
  const det = data[`${field}_detail`] || {}
  const set = (k, v) => onChange({ ...data, [k]: v })
  return (
    <div className="card">
      <h2><span className="section-icon">{icon}</span> {label}</h2>
      <RadioPills name={field} options={['SI','NO']} value={val} onChange={v => set(field, v)} />
      <Conditional show={val === 'SI'}>
        <div className="flex flex-wrap gap-3">
          <Field label="Marca"><input className="input w-40" placeholder="Marca…" value={det.marca || ''} onChange={e => set(`${field}_detail`, { ...det, marca: e.target.value })} /></Field>
          <Field label="Año"><input className="input w-28" type="number" min="1990" max="2099" placeholder="2022" value={det.anio || ''} onChange={e => set(`${field}_detail`, { ...det, anio: e.target.value })} /></Field>
        </div>
      </Conditional>
    </div>
  )
}

function SeccionPantallas({ data, onChange }) {
  const val = data.pantallas || 'NO'
  const det = data.pantallas_detail || {}
  const set = (k, v) => onChange({ ...data, [k]: v })
  const ubicaciones = det.ubicaciones || []
  function toggleUbic(u) {
    const next = ubicaciones.includes(u) ? ubicaciones.filter(x => x !== u) : [...ubicaciones, u]
    set('pantallas_detail', { ...det, ubicaciones: next })
  }
  return (
    <div className="card">
      <h2><span className="section-icon">🖥️</span> Pantallas</h2>
      <RadioPills name="pantallas" options={['SI','NO']} value={val} onChange={v => set('pantallas', v)} />
      <Conditional show={val === 'SI'}>
        <div className="flex flex-wrap gap-3 mb-3">
          <Field label="Marca"><input className="input w-40" placeholder="Marca…" value={det.marca || ''} onChange={e => set('pantallas_detail', { ...det, marca: e.target.value })} /></Field>
          <Field label="Año"><input className="input w-28" type="number" placeholder="2023" value={det.anio || ''} onChange={e => set('pantallas_detail', { ...det, anio: e.target.value })} /></Field>
        </div>
        <label className="label">Ubicación (puede seleccionar varias)</label>
        <div className="flex flex-wrap gap-2">
          {['Interior','Escaparate','Exterior'].map(u => (
            <label key={u} className={`radio-pill${ubicaciones.includes(u) ? ' active' : ''}`}>
              <input type="checkbox" className="sr-only" checked={ubicaciones.includes(u)} onChange={() => toggleUbic(u)} />
              {u}
            </label>
          ))}
        </div>
      </Conditional>
    </div>
  )
}

function SeccionFrigorifico({ data, onChange }) {
  const det = data.frigorifico || {}
  const set = v => onChange({ ...data, frigorifico: v })
  return (
    <div className="card">
      <h2><span className="section-icon">❄️</span> Frigorífico</h2>
      <div className="flex flex-wrap gap-3">
        <Field label="Marca"><input className="input w-40" placeholder="Marca…" value={det.marca || ''} onChange={e => set({ ...det, marca: e.target.value })} /></Field>
        <Field label="Año"><input className="input w-28" type="number" min="1990" max="2099" placeholder="2020" value={det.anio || ''} onChange={e => set({ ...det, anio: e.target.value })} /></Field>
      </div>
    </div>
  )
}

// ── Campos detallados equipos IT ──────────────────────────────────────────────────
function DiskList({ disks = [], onChange }) {
  function addDisk() { onChange([...disks, { tipo: 'SSD', capacidad: '' }]) }
  function removeDisk(i) { onChange(disks.filter((_, idx) => idx !== i)) }
  function setDisk(i, field, v) { onChange(disks.map((d, idx) => idx === i ? { ...d, [field]: v } : d)) }
  return (
    <div>
      <label className="label mt-2">Discos duros</label>
      {disks.map((d, i) => (
        <div key={i} className="flex flex-wrap gap-2 items-end bg-white rounded-lg p-2 border border-gray-200 mb-2">
          <Field label="Tipo">
            <select className="input w-24" value={d.tipo} onChange={e => setDisk(i, 'tipo', e.target.value)}>
              {DISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Capacidad"><input className="input w-28" placeholder="512 GB" value={d.capacidad} onChange={e => setDisk(i, 'capacidad', e.target.value)} /></Field>
          <button type="button" onClick={() => removeDisk(i)} className="text-red-400 hover:text-red-600 pb-1 text-lg">×</button>
        </div>
      ))}
      <button type="button" onClick={addDisk} className="btn-add text-xs">+ Añadir disco</button>
    </div>
  )
}

function IpList({ ips = [], onChange }) {
  function addIp() { onChange([...ips, '']) }
  function removeIp(i) { onChange(ips.filter((_, idx) => idx !== i)) }
  function setIp(i, v) { onChange(ips.map((ip, idx) => idx === i ? v : ip)) }
  return (
    <div>
      <label className="label mt-2">Dirección(es) IP</label>
      <div className="flex flex-wrap gap-2">
        {ips.map((ip, i) => (
          <div key={i} className="flex items-center gap-1">
            <input className="input w-40" placeholder="192.168.1.10" value={ip} onChange={e => setIp(i, e.target.value)} />
            <button type="button" onClick={() => removeIp(i)} className="text-red-400 hover:text-red-600 text-lg">×</button>
          </div>
        ))}
        <button type="button" onClick={addIp} className="btn-add text-xs self-end">+ IP</button>
      </div>
    </div>
  )
}

function ComputerFields({ device, onChange }) {
  const s = (f, v) => onChange({ ...device, [f]: v })
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Sistema operativo"><input className="input" value={device.so || ''} onChange={e => s('so', e.target.value)} /></Field>
        <Field label="Procesador"><input className="input" value={device.procesador || ''} onChange={e => s('procesador', e.target.value)} /></Field>
        <Field label="RAM"><input className="input" placeholder="16 GB" value={device.ram || ''} onChange={e => s('ram', e.target.value)} /></Field>
        <Field label="Antivirus"><input className="input" value={device.antivirus || ''} onChange={e => s('antivirus', e.target.value)} /></Field>
        <Field label="Gráfica"><input className="input" value={device.grafica || ''} onChange={e => s('grafica', e.target.value)} /></Field>
        <Field label="Fuente alimentación"><input className="input" placeholder="500W Bronze" value={device.fuente || ''} onChange={e => s('fuente', e.target.value)} /></Field>
      </div>
      <IpList ips={device.ips || []} onChange={v => s('ips', v)} />
      <DiskList disks={device.disks || []} onChange={v => s('disks', v)} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Monitor">
          <select className="input" value={device.monitor || 'NO'} onChange={e => s('monitor', e.target.value)}>
            <option>SI</option><option>NO</option>
          </select>
        </Field>
        {device.monitor === 'SI' && <>
          <Field label="Tamaño"><input className="input" placeholder='24"' value={device.monitor_tam || ''} onChange={e => s('monitor_tam', e.target.value)} /></Field>
          <Field label="Color"><input className="input" placeholder="Negro" value={device.monitor_color || ''} onChange={e => s('monitor_color', e.target.value)} /></Field>
          <Field label="Conexión">
            <select className="input" value={device.monitor_conn || ''} onChange={e => s('monitor_conn', e.target.value)}>
              <option value="">…</option>
              {MONITOR_CONN.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Teclado">
          <select className="input" value={device.teclado || 'NO'} onChange={e => s('teclado', e.target.value)}>
            <option>NO</option><option>Cable</option><option>Inalámbrico</option>
          </select>
        </Field>
        <Field label="Ratón">
          <select className="input" value={device.raton || 'NO'} onChange={e => s('raton', e.target.value)}>
            <option>NO</option><option>Cable</option><option>Inalámbrico</option>
          </select>
        </Field>
        <Field label="Lector tarjetas">
          <select className="input" value={device.lector_tarjetas || 'NO'} onChange={e => s('lector_tarjetas', e.target.value)}>
            <option>NO</option><option>SI</option>
          </select>
        </Field>
        {device.lector_tarjetas === 'SI' && <>
          <Field label="Modelo lector tarjetas"><input className="input" value={device.lector_tarjetas_modelo || ''} onChange={e => s('lector_tarjetas_modelo', e.target.value)} /></Field>
          <Field label="Año lector tarjetas"><input className="input w-24" type="number" value={device.lector_tarjetas_anio || ''} onChange={e => s('lector_tarjetas_anio', e.target.value)} /></Field>
        </>}
        <Field label="Lector QR 2D">
          <select className="input" value={device.qr || 'NO'} onChange={e => s('qr', e.target.value)}>
            <option>NO</option><option>Cable</option><option>Inalámbrico</option>
          </select>
        </Field>
        {device.qr !== 'NO' && <>
          <Field label="Modelo QR"><input className="input" value={device.qr_modelo || ''} onChange={e => s('qr_modelo', e.target.value)} /></Field>
          <Field label="Año QR"><input className="input w-24" type="number" value={device.qr_anio || ''} onChange={e => s('qr_anio', e.target.value)} /></Field>
        </>}
      </div>
    </div>
  )
}

function PrinterFields({ device, onChange, allDevices }) {
  const s = (f, v) => onChange({ ...device, [f]: v })
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="Marca"><input className="input" value={device.marca || ''} onChange={e => s('marca', e.target.value)} /></Field>
      <Field label="Modelo"><input className="input" value={device.modelo || ''} onChange={e => s('modelo', e.target.value)} /></Field>
      <Field label="Conexión">
        <select className="input" value={device.conexion || ''} onChange={e => s('conexion', e.target.value)}>
          <option value="">…</option>
          {CONN_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Equipo vinculado">
        <select className="input" value={device.vinculado || ''} onChange={e => s('vinculado', e.target.value)}>
          <option value="">Selecciona…</option>
          {allDevices.filter(d => d.tipo === 'Servidor' || d.tipo === 'Estación').map((d, i) => (
            <option key={i} value={d.nombre || `${d.tipo} ${i + 1}`}>{d.nombre || `${d.tipo} ${i + 1}`}</option>
          ))}
        </select>
      </Field>
    </div>
  )
}

function SaiList({ items = [], onChange }) {
  function add() { onChange([...items, { marca: '', modelo: '', capacidad: '', anio: '', vinculado: '' }]) }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)) }
  function setItem(i, f, v) { onChange(items.map((x, idx) => idx === i ? { ...x, [f]: v } : x)) }
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">SAI #{i+1}</span>
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-sm">Eliminar</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Field label="Marca"><input className="input" value={item.marca} onChange={e => setItem(i,'marca',e.target.value)} /></Field>
            <Field label="Modelo"><input className="input" value={item.modelo} onChange={e => setItem(i,'modelo',e.target.value)} /></Field>
            <Field label="Capacidad"><input className="input" placeholder="1500 VA" value={item.capacidad} onChange={e => setItem(i,'capacidad',e.target.value)} /></Field>
            <Field label="Año"><input className="input" type="number" value={item.anio} onChange={e => setItem(i,'anio',e.target.value)} /></Field>
            <Field label="Equipo vinculado"><input className="input" value={item.vinculado} onChange={e => setItem(i,'vinculado',e.target.value)} /></Field>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="btn-add text-xs">+ Añadir SAI</button>
    </div>
  )
}

function RouterList({ items = [], onChange }) {
  function add() { onChange([...items, { marca:'',modelo:'',proveedor:'',anio:'',prioridad:'Principal',contacto:{nombre:'',cargo:'',telefono:'',email:''} }]) }
  function remove(i) { onChange(items.filter((_,idx)=>idx!==i)) }
  function setItem(i,f,v) { onChange(items.map((x,idx)=>idx===i?{...x,[f]:v}:x)) }
  function setContact(i,f,v) { onChange(items.map((x,idx)=>idx===i?{...x,contacto:{...x.contacto,[f]:v}}:x)) }
  return (
    <div className="space-y-2">
      {items.map((item,i)=>(
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Router #{i+1}</span>
            <button type="button" onClick={()=>remove(i)} className="text-red-400 hover:text-red-600 text-sm">Eliminar</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
            <Field label="Marca"><input className="input" value={item.marca} onChange={e=>setItem(i,'marca',e.target.value)}/></Field>
            <Field label="Modelo"><input className="input" value={item.modelo} onChange={e=>setItem(i,'modelo',e.target.value)}/></Field>
            <Field label="Proveedor"><input className="input" value={item.proveedor} onChange={e=>setItem(i,'proveedor',e.target.value)}/></Field>
            <Field label="Año"><input className="input" type="number" value={item.anio} onChange={e=>setItem(i,'anio',e.target.value)}/></Field>
            <Field label="Prioridad">
              <select className="input" value={item.prioridad} onChange={e=>setItem(i,'prioridad',e.target.value)}>
                {['Principal','Secundario','Backup'].map(p=><option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contacto proveedor</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Field label="Nombre"><input className="input" value={item.contacto?.nombre||''} onChange={e=>setContact(i,'nombre',e.target.value)}/></Field>
            <Field label="Cargo"><input className="input" value={item.contacto?.cargo||''} onChange={e=>setContact(i,'cargo',e.target.value)}/></Field>
            <Field label="Teléfono"><input className="input" value={item.contacto?.telefono||''} onChange={e=>setContact(i,'telefono',e.target.value)}/></Field>
            <Field label="Email"><input className="input" type="email" value={item.contacto?.email||''} onChange={e=>setContact(i,'email',e.target.value)}/></Field>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="btn-add text-xs">+ Añadir router</button>
    </div>
  )
}

function SwitchList({ items = [], onChange }) {
  function add() { onChange([...items, { marca:'',modelo:'',salidas:'',gestionable:'NO',anio:'',capa:'2ª',poe:'NO',puertos_poe:'' }]) }
  function remove(i) { onChange(items.filter((_,idx)=>idx!==i)) }
  function setItem(i,f,v) { onChange(items.map((x,idx)=>idx===i?{...x,[f]:v}:x)) }
  return (
    <div className="space-y-2">
      {items.map((item,i)=>(
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">Switch #{i+1}</span>
            <button type="button" onClick={()=>remove(i)} className="text-red-400 hover:text-red-600 text-sm">Eliminar</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Field label="Marca"><input className="input" value={item.marca} onChange={e=>setItem(i,'marca',e.target.value)}/></Field>
            <Field label="Modelo"><input className="input" value={item.modelo} onChange={e=>setItem(i,'modelo',e.target.value)}/></Field>
            <Field label="Nº salidas"><input className="input" type="number" value={item.salidas} onChange={e=>setItem(i,'salidas',e.target.value)}/></Field>
            <Field label="Año"><input className="input" type="number" value={item.anio} onChange={e=>setItem(i,'anio',e.target.value)}/></Field>
            <Field label="Gestionable">
              <select className="input" value={item.gestionable} onChange={e=>setItem(i,'gestionable',e.target.value)}>
                <option>NO</option><option>SI</option>
              </select>
            </Field>
            <Field label="Capa">
              <select className="input" value={item.capa} onChange={e=>setItem(i,'capa',e.target.value)}>
                {CAPA_OPTIONS.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="PoE">
              <select className="input" value={item.poe} onChange={e=>setItem(i,'poe',e.target.value)}>
                <option>NO</option><option>SI</option>
              </select>
            </Field>
            {item.poe === 'SI' && <Field label="Puertos PoE"><input className="input" type="number" value={item.puertos_poe} onChange={e=>setItem(i,'puertos_poe',e.target.value)}/></Field>}
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="btn-add text-xs">+ Añadir switch</button>
    </div>
  )
}

// ── DeviceCard (formulario expandido) ─────────────────────────────────────────────
function DeviceCard({ device, allDevices, onChange, onDelete, onDuplicate }) {
  const [expanded, setExpanded] = useState(true)
  const s = (f, v) => onChange({ ...device, [f]: v })
  const isViteka = device.is_viteka || false
  const exp = isExpired(device.fin_garantia)

  function renderTypeFields() {
    if (['Servidor','Estación'].includes(device.tipo)) return <ComputerFields device={device} onChange={onChange} />
    if (['Impresora documentos','Impresora tickets','Impresora etiquetas adhesivas'].includes(device.tipo)) return <PrinterFields device={device} onChange={onChange} allDevices={allDevices} />
    if (device.tipo === 'SAI') return <SaiList items={device.sais || []} onChange={v => s('sais', v)} />
    if (device.tipo === 'Router') return <RouterList items={device.routers || []} onChange={v => s('routers', v)} />
    if (device.tipo === 'Switch') return <SwitchList items={device.switches || []} onChange={v => s('switches', v)} />
    return null
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden mb-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <button type="button" onClick={() => setExpanded(e => !e)} className="text-gray-400 hover:text-gray-600 text-lg w-5 text-center">
          {expanded ? '▾' : '▸'}
        </button>
        <span className="text-lg shrink-0">{IT_ICONS[device.tipo] || '📦'}</span>
        <Field label="" className="flex-1">
          <select className="input font-medium" value={device.tipo || ''} onChange={e => s('tipo', e.target.value)}>
            <option value="">Tipo de equipo…</option>
            {IT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="" className="w-48">
          <input className="input" placeholder="Nombre / identificador" value={device.nombre || ''} onChange={e => s('nombre', e.target.value)} />
        </Field>
        <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
          <input type="checkbox" className="rounded border-gray-300" style={{ accentColor: '#0f766e' }}
            checked={isViteka} onChange={e => s('is_viteka', e.target.checked)} />
          <span className="text-xs font-semibold text-teal-700">VITEKA</span>
        </label>
        {/* Garantía badge en header */}
        {device.fin_garantia && (
          <span className={`text-xs font-medium shrink-0 ${ exp ? 'text-red-500' : 'text-green-600' }`}>
            {exp ? '⚠️ Gtía vencida' : `Gtía: ${fmtDate(device.fin_garantia)}`}
          </span>
        )}
        <button type="button" onClick={onDuplicate} title="Duplicar" className="text-gray-400 hover:text-teal-600 text-base px-1">⧉</button>
        <button type="button" onClick={onDelete} className="text-red-400 hover:text-red-600 text-lg">×</button>
      </div>

      {/* VITEKA extra */}
      {isViteka && expanded && (
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Nº serie"><input className="input" value={device.serie || ''} onChange={e => s('serie', e.target.value)} /></Field>
            <Field label="Fecha instalación"><input className="input" type="date" value={device.fecha_instalacion || ''} onChange={e => s('fecha_instalacion', e.target.value)} /></Field>
            <Field label="Fin garantía"><input className="input" type="date" value={device.fin_garantia || ''} onChange={e => s('fin_garantia', e.target.value)} /></Field>
            <Field label="Observaciones"><input className="input" value={device.obs_viteka || ''} onChange={e => s('obs_viteka', e.target.value)} /></Field>
          </div>
        </div>
      )}

      {expanded && (
        <div className="px-4 py-3">
          {renderTypeFields()}
          <Field label="Observaciones generales" className="mt-3">
            <textarea className="input" rows={2} value={device.observaciones || ''} onChange={e => s('observaciones', e.target.value)} />
          </Field>
        </div>
      )}
    </div>
  )
}

// ── Modal selector de farmacia origen ─────────────────────────────────────────────
function CopyFromPharmacyModal({ currentPharmacyId, onConfirm, onClose }) {
  const [pharmacies, setPharmacies] = useState([])
  const [selected, setSelected]     = useState('')
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')

  useEffect(() => {
    supabase
      .from('pharmacies')
      .select('id, name')
      .neq('id', currentPharmacyId)
      .order('name')
      .then(({ data }) => { setPharmacies(data || []); setLoading(false) })
  }, [currentPharmacyId])

  const filtered = pharmacies.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="modal-backdrop">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="font-bold text-gray-900 mb-1">Copiar equipos de otra farmacia</h3>
        <p className="text-xs text-gray-500 mb-3">Se añadirán todos los equipos IT de la farmacia seleccionada.</p>
        <input
          className="input mb-3"
          placeholder="Buscar farmacia…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Cargando…</p>
        ) : (
          <div className="max-h-52 overflow-y-auto space-y-1 mb-4">
            {filtered.map(p => (
              <label key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                selected === p.id ? 'bg-teal-50 border border-teal-300' : 'hover:bg-gray-50 border border-transparent'
              }`}>
                <input type="radio" className="sr-only" checked={selected === p.id} onChange={() => setSelected(p.id)} />
                <span className="text-sm text-gray-800">{p.name}</span>
              </label>
            ))}
            {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Sin resultados</p>}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            disabled={!selected}
            onClick={() => onConfirm(selected)}
          >Copiar equipos</button>
        </div>
      </div>
    </div>
  )
}

// ── SeccionEquiposIT ────────────────────────────────────────────────────────────────
function SeccionEquiposIT({ devices, onChange, onDuplicate, pharmacyId, copyDevicesFromPharmacy }) {
  const [groupByType,  setGroupByType]  = useState(true)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [copyError,    setCopyError]    = useState('')

  function addDevice() { onChange([...devices, { tipo: '', nombre: '', is_viteka: false }]) }
  function updateDevice(i, v) { onChange(devices.map((d, idx) => idx === i ? v : d)) }
  function deleteDevice(i) { onChange(devices.filter((_, idx) => idx !== i)) }

  async function handleCopyConfirm(sourceId) {
    try {
      setCopyError('')
      await copyDevicesFromPharmacy(sourceId)
      setShowCopyModal(false)
    } catch (err) {
      setCopyError(err.message)
    }
  }

  // — Render lista según modo —
  const renderList = () => {
    if (!groupByType) {
      return devices.map((d, i) => (
        <DeviceCard key={i} device={d} allDevices={devices}
          onChange={v => updateDevice(i, v)}
          onDelete={() => deleteDevice(i)}
          onDuplicate={() => onDuplicate(i)}
        />
      ))
    }

    // Agrupar por tipo según orden de IT_TYPES
    return IT_TYPES.map(tipo => {
      const group = devices
        .map((d, idx) => ({ d, idx }))
        .filter(({ d }) => d.tipo === tipo)
      if (group.length === 0) return null
      return (
        <div key={tipo} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{IT_ICONS[tipo] || '📦'}</span>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{tipo}</h4>
            <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-0.5 font-medium">{group.length}</span>
            <div className="flex-1 border-t border-gray-100" />
          </div>
          {group.map(({ d, idx }) => (
            <DeviceCard key={idx} device={d} allDevices={devices}
              onChange={v => updateDevice(idx, v)}
              onDelete={() => deleteDevice(idx)}
              onDuplicate={() => onDuplicate(idx)}
            />
          ))}
        </div>
      )
    })
  }

  return (
    <div className="card">
      <h2><span className="section-icon">💻</span> Equipos informáticos</h2>
      <p className="text-xs text-gray-500 mb-4">
        Cada equipo VITEKA lleva control de garantías. Los no-VITEKA permiten conocer la infraestructura para sustitución y seguimiento.
      </p>

      {/* Barra de acciones */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <p className="text-sm text-gray-500">{devices.length} equipo{devices.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setCopyError(''); setShowCopyModal(true) }}
            className="btn-secondary text-xs"
          >
            📋 Copiar de farmacia
          </button>
          <button
            type="button"
            onClick={() => setGroupByType(p => !p)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
              groupByType
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            ↕ {groupByType ? 'Agrupado por tipo' : 'Ordenar por tipo'}
          </button>
          <button type="button" onClick={addDevice} className="btn-primary text-xs">+ Añadir equipo</button>
        </div>
      </div>

      {copyError && <p className="text-xs text-red-500 mb-3">{copyError}</p>}

      {devices.length === 0 && (
        <div className="empty-state">
          <span className="text-3xl mb-2">💻</span>
          <p className="text-gray-500 text-sm">Sin equipos registrados</p>
        </div>
      )}

      {renderList()}

      {showCopyModal && (
        <CopyFromPharmacyModal
          currentPharmacyId={pharmacyId}
          onConfirm={handleCopyConfirm}
          onClose={() => setShowCopyModal(false)}
        />
      )}
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────────────────
export default function PharmacyEquipmentPage({ pharmacyId, pharmacyName, navigate }) {
  const {
    equipment, devices, loading, saving, error,
    load, saveEquipment, duplicateDevice, copyDevicesFromPharmacy,
  } = useEquipamiento(pharmacyId)
  const [form, setForm]               = useState({})
  const [localDevices, setLocalDevices] = useState([])
  const [saved, setSaved]             = useState(false)

  useEffect(() => { load() }, [load])
  useEffect(() => { if (equipment) setForm(equipment) }, [equipment])
  useEffect(() => { if (devices.length) setLocalDevices(devices) }, [devices])

  async function handleSave() {
    try {
      await saveEquipment({ ...form, it_devices: localDevices })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
  }

  async function handleDuplicate(idx) {
    const d = localDevices[idx]
    if (d?.id) {
      // Dispositivo ya guardado en BD → duplicar desde hook
      await duplicateDevice(d.id)
    } else {
      // Dispositivo nuevo aún no guardado → duplicar localmente
      const copy = { ...d, nombre: `${d.nombre || d.tipo || 'Equipo'} (copia)` }
      setLocalDevices(prev => [...prev, copy])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '4px solid #1c473c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 80 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('pharmacy-detail', { pharmacyId })} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Equipamiento</h1>
          <p className="text-sm text-gray-500">{pharmacyName || `Farmacia #${pharmacyId}`}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <SeccionERP          data={form} onChange={setForm} />
      <SeccionCaja         data={form} onChange={setForm} />
      <SeccionESL          data={form} onChange={setForm} />
      <SeccionBascula      data={form} onChange={setForm} />
      <SeccionAntihurto    data={form} onChange={setForm} />
      <SeccionConsultoria  data={form} onChange={setForm} />
      <SeccionEquiposIT
        devices={localDevices}
        onChange={setLocalDevices}
        onDuplicate={handleDuplicate}
        pharmacyId={pharmacyId}
        copyDevicesFromPharmacy={copyDevicesFromPharmacy}
      />
      <SeccionRobot        data={form} onChange={setForm} />
      <SeccionCruz         data={form} onChange={setForm} />
      <SeccionSiNo field="gestor_turnos" label="Gestor de turnos"  icon="🔢" data={form} onChange={setForm} />
      <SeccionSiNo field="spd"           label="SPD"               icon="💊" data={form} onChange={setForm} />
      <SeccionPantallas    data={form} onChange={setForm} />
      <SeccionFrigorifico  data={form} onChange={setForm} />

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => navigate('pharmacy-detail', { pharmacyId })}>Cancelar</button>
        <button type="button" className="btn-primary flex items-center gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
          {saved ? '✓ Guardado' : saving ? 'Guardando…' : '💾 Guardar equipamiento'}
        </button>
      </div>
    </div>
  )
}
