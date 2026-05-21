import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePharmacy } from '../hooks/usePharmacy'
import { usePharmacyPersons } from '../hooks/usePharmacyPersons'
import { usePharmacyDocuments } from '../hooks/usePharmacyDocuments'
import { usePharmacyIT } from '../hooks/usePharmacyIT'
import { useAuth } from '../hooks/useAuth'
import {
  ArrowLeftIcon, PencilSquareIcon,
  BuildingStorefrontIcon, WrenchScrewdriverIcon,
  UsersIcon, FolderOpenIcon, ExclamationTriangleIcon,
  DocumentTextIcon, ComputerDesktopIcon,
  PlusIcon, TrashIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/pharmacy/ConfirmDialog'
import {
  PERSON_ROLES, RESPONSIBILITY_AREAS, DOC_CATEGORIES, IT_TYPES,
  CONNECTION_OPTIONS, MONITOR_CONN, DISK_TYPES, CAPA_OPTIONS,
} from '../components/pharmacy/PHARMACY_CONSTANTS'
import { Label, Input, Select, Textarea } from '../components/pharmacy/PharmacyFormAtoms'

// ── Helpers ───────────────────────────────────────────────────────────────────
const PROVINCE_LABEL = {
  almeria:'Almería',cadiz:'Cádiz',cordoba:'Córdoba',granada:'Granada',
  huelva:'Huelva',jaen:'Jaén',malaga:'Málaga',sevilla:'Sevilla',
}
const LEGAL_LABEL = {
  autonomo:'Autónomo',cb:'C.B.',sl:'S.L.',
  autonomo_sl:'Autónomo + S.L.',cb_sl:'C.B. + S.L.',
}

// Field SIEMPRE visible: muestra 'Sin informar' si el valor está vacío
function Field({ label, value, wide, emptyText = 'Sin informar' }) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div className={wide ? 'col-span-2 md:col-span-3' : ''}>
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className={`text-sm font-medium ${
        isEmpty ? 'text-gray-300 italic' : 'text-gray-800'
      }`}>
        {isEmpty ? emptyText : value}
      </dd>
    </div>
  )
}

function SectionBlock({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</dl>
    </div>
  )
}
function Badge({ active }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>{active ? 'Activa' : 'Inactiva'}</span>
  )
}
function EmptyTab({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
      <Icon className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
function VitekaBadge({ value }) {
  if (!value) return null
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">Viteka</span>
}
function SatisfactionBadge({ value }) {
  if (!value) return null
  const colors=['','bg-red-100 text-red-600','bg-orange-100 text-orange-600','bg-yellow-100 text-yellow-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700']
  const labels=['','Muy malo','Malo','Regular','Bueno','Excelente']
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[value]}`}>{value}/5 — {labels[value]}</span>
}

// ── Pestañas ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'general',   label: 'Datos generales',  icon: BuildingStorefrontIcon },
  { key: 'equipment', label: 'Equipamiento',      icon: WrenchScrewdriverIcon  },
  { key: 'it',        label: 'Equip. Informático',icon: ComputerDesktopIcon    },
  { key: 'people',    label: 'Personas',          icon: UsersIcon              },
  { key: 'incidents', label: 'Incidencias',       icon: ExclamationTriangleIcon},
  { key: 'projects',  label: 'Proyectos',         icon: FolderOpenIcon         },
  { key: 'documents', label: 'Documentos',        icon: DocumentTextIcon       },
]

// ── Tab: Datos generales ──────────────────────────────────────────────────────
function TabGeneral({ pharmacy }) {
  const lType = pharmacy.legal_type || ''
  const hasAuto = lType.includes('autonomo')
  const hasCb   = lType.includes('cb')
  const hasSl   = lType.includes('sl')
  const sl = pharmacy.sl_data || {}
  const cbOwners = Array.isArray(pharmacy.cb_owners) ? pharmacy.cb_owners : []

  // Helper booleano explícito
  const boolField = (label, val, wide) => (
    <Field
      label={label}
      value={val === true ? 'Sí' : val === false ? 'No' : null}
      wide={wide}
    />
  )

  return (
    <div className="space-y-4">
      {hasAuto && (
        <SectionBlock title="Autónomo">
          <Field label="Titular"        value={pharmacy.owner_name} />
          <Field label="NIF"            value={pharmacy.nif} />
          <Field label="Nº Colegiado"   value={pharmacy.collegiate_number} />
          <Field label="SOE"            value={pharmacy.soe_number} />
          <Field label="Teléfono"       value={pharmacy.contact_phone} />
          <Field label="Email"          value={pharmacy.contact_email} />
          <Field label="Dirección"      value={pharmacy.address} wide />
          <Field label="Población"      value={pharmacy.city} />
          <Field label="Provincia"      value={PROVINCE_LABEL[pharmacy.province] || pharmacy.province} />
          <Field label="C.P."           value={pharmacy.postal_code} />
          <Field label="Horario"        value={pharmacy.schedule} />
          {boolField('Guardias', pharmacy.has_guards)}
          <Field label="Observaciones"  value={pharmacy.observations} wide />
        </SectionBlock>
      )}

      {hasCb && (
        <SectionBlock title="Comunidad de Bienes (C.B.)">
          <Field label="Razón social" value={pharmacy.razon_social} />
          <Field label="CIF"          value={pharmacy.cif} />
          {cbOwners.length === 0 && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs text-gray-300 italic">Sin titulares registrados</p>
            </div>
          )}
          {cbOwners.map((o, i) => (
            <div key={i} className="col-span-2 md:col-span-3 grid grid-cols-3 gap-3 bg-white rounded-lg p-3 border border-gray-200">
              <div>
                <dt className="text-xs text-gray-400">Titular {i + 1}</dt>
                <dd className={`text-sm font-medium ${o.name ? 'text-gray-800' : 'text-gray-300 italic'}`}>{o.name || 'Sin informar'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">NIF</dt>
                <dd className={`text-sm font-medium ${o.nif ? 'text-gray-800' : 'text-gray-300 italic'}`}>{o.nif || 'Sin informar'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Colegiado</dt>
                <dd className={`text-sm font-medium ${o.collegiate ? 'text-gray-800' : 'text-gray-300 italic'}`}>{o.collegiate || 'Sin informar'}</dd>
              </div>
            </div>
          ))}
          <Field label="Teléfono"     value={pharmacy.contact_phone} />
          <Field label="Email"        value={pharmacy.contact_email} />
          <Field label="Dirección"    value={pharmacy.address} wide />
          <Field label="Población"    value={pharmacy.city} />
          <Field label="Provincia"    value={PROVINCE_LABEL[pharmacy.province] || pharmacy.province} />
          <Field label="C.P."         value={pharmacy.postal_code} />
          <Field label="SOE"          value={pharmacy.soe_number} />
          <Field label="Horario"      value={pharmacy.schedule} />
          {boolField('Guardias', pharmacy.has_guards)}
          <Field label="Observaciones" value={pharmacy.observations} wide />
        </SectionBlock>
      )}

      {hasSl && (
        <SectionBlock title="Sociedad Limitada (S.L.)">
          <Field label="Razón social"  value={(hasAuto || hasCb) ? sl.razon_social : pharmacy.razon_social} />
          <Field label="CIF"           value={(hasAuto || hasCb) ? sl.cif : pharmacy.cif} />
          <Field label="Teléfono S.L." value={(hasAuto || hasCb) ? sl.phone : pharmacy.contact_phone} />
          <Field label="Email S.L."    value={(hasAuto || hasCb) ? sl.email : pharmacy.contact_email} />
          <Field label="Dirección"     value={(hasAuto || hasCb) ? sl.address : pharmacy.address} wide />
          <Field label="Población"     value={(hasAuto || hasCb) ? sl.city : pharmacy.city} />
          <Field label="Provincia"     value={PROVINCE_LABEL[(hasAuto || hasCb) ? sl.province : pharmacy.province]} />
          <Field label="C.P."          value={(hasAuto || hasCb) ? sl.postal_code : pharmacy.postal_code} />
          <Field label="Observaciones" value={(hasAuto || hasCb) ? sl.observations : pharmacy.observations} wide />
        </SectionBlock>
      )}
    </div>
  )
}

// ── Tab: Equipamiento ─────────────────────────────────────────────────────────
function EquipRow({ label, marca, modelo, year, viteka, satisfaction }) {
  if (!marca || marca === 'NO') return null
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 px-4 text-sm font-medium text-gray-700 whitespace-nowrap">{label}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{marca}{modelo ? ` — ${modelo}` : ''}</td>
      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{year || '-'}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <VitekaBadge value={viteka} />
          {!viteka && satisfaction && <SatisfactionBadge value={Number(satisfaction)} />}
        </div>
      </td>
    </tr>
  )
}
function TabEquipment({ equipment }) {
  if (!equipment) return <EmptyTab icon={WrenchScrewdriverIcon} message="Sin equipamiento registrado" />
  const eq = equipment
  const pantallas = eq.pantallas_detail || {}
  const ubicaciones = Array.isArray(pantallas.ubicaciones) ? pantallas.ubicaciones.join(', ') : ''
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marca / Modelo</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody>
            <EquipRow label="ERP"           marca={eq.erp}       year={eq.erp_detail?.year}  viteka={eq.erp_viteka}     satisfaction={eq.erp_satisfaction} />
            <EquipRow label="Caja cobro"    marca={eq.caja}      modelo={eq.caja_modelo}     year={eq.caja_year}        viteka={eq.caja_viteka}    satisfaction={eq.caja_satisfaction} />
            <EquipRow label="ESL"           marca={eq.esl}       year={eq.esl_year}          viteka={eq.esl_viteka}     satisfaction={eq.esl_satisfaction} />
            <EquipRow label="Báscula"       marca={eq.bascula}   year={eq.bascula_year}      viteka={eq.bascula_viteka} />
            <EquipRow label="Antihurto"     marca={eq.antihurto} year={eq.antihurto_year} />
            <EquipRow label="Robot"         marca={eq.robot}     year={eq.robot_year} />
            <EquipRow label="Cruz"          marca={eq.cruz && eq.cruz !== 'NO' ? `${eq.cruz}${eq.cruz_cantidad ? ` (${eq.cruz_cantidad})` : ''}` : null} />
            <EquipRow label="Gestor turnos" marca={eq.gestor_turnos !== 'NO' ? (eq.gestor_turnos_marca || 'Sí') : null} year={eq.gestor_turnos_year} />
            <EquipRow label="SPD"           marca={eq.spd !== 'NO' ? (eq.spd_marca || 'Sí') : null} year={eq.spd_year} />
            <EquipRow label="Pantallas"     marca={eq.pantallas !== 'NO' ? `${pantallas.marca || 'Sí'}${ubicaciones ? ` (${ubicaciones})` : ''}` : null} year={pantallas.year} />
            <EquipRow label="Frigorífico"   marca={eq.frigorifico_marca} year={eq.frigorifico_year} viteka={eq.frigorifico_viteka} satisfaction={eq.frigorifico_satisfaction} />
          </tbody>
        </table>
      </div>
      {eq.consultoria && eq.consultoria !== 'NO' && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Consultoría</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-800">
              {eq.consultoria}
              {eq.consultoria_detail?.month && eq.consultoria_detail?.year
                ? ` — desde ${eq.consultoria_detail.month}/${eq.consultoria_detail.year}` : ''}
            </p>
            <VitekaBadge value={eq.consultoria_viteka} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Equipamiento Informático ─────────────────────────────────────────────
const IT_LABEL = Object.fromEntries(IT_TYPES.map(t => [t.value, t.label]))

function ITDeviceCard({ device, onEdit, onDelete }) {
  const specs = device.specs || {}
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">{IT_LABEL[device.device_type] || device.device_type}</span>
          {device.label && <p className="text-sm font-medium text-gray-800 mt-0.5">{device.label}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {device.is_viteka && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">Viteka</span>}
          <button type="button" onClick={() => onEdit(device)} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-gray-50">
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onDelete(device)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {device.is_viteka && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
          {device.serial_number && <span><span className="font-medium">Nº serie:</span> {device.serial_number}</span>}
          {device.install_date  && <span><span className="font-medium">Instalación:</span> {device.install_date}</span>}
          {device.warranty_end  && <span><span className="font-medium">Fin garantía:</span> {device.warranty_end}</span>}
        </div>
      )}
      {specs.marca && <p className="text-xs text-gray-500"><span className="font-medium">Marca:</span> {specs.marca} {specs.modelo || ''}</p>}
      {specs.ip    && <p className="text-xs text-gray-500"><span className="font-medium">IP:</span> {Array.isArray(specs.ip) ? specs.ip.join(', ') : specs.ip}</p>}
      {device.observations && <p className="text-xs text-gray-400 italic">{device.observations}</p>}
    </div>
  )
}

function ITDeviceForm({ initial, pharmacyId, companyId, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    device_type: 'servidor', label: '', is_viteka: false,
    serial_number: '', install_date: '', warranty_end: '', observations: '',
    specs: {}
  })
  const set     = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setSpec = (k, v) => setForm(p => ({ ...p, specs: { ...p.specs, [k]: v } }))

  const isComputer = ['servidor', 'estacion'].includes(form.device_type)
  const isPrinter  = ['impresora_documentos', 'impresora_tickets', 'impresora_etiquetas'].includes(form.device_type)

  function addIp()         { setSpec('ip', [...(form.specs.ip || ['']), '']) }
  function setIp(i, v)     { const arr = [...(form.specs.ip || [''])]; arr[i] = v; setSpec('ip', arr) }
  function removeIp(i)     { setSpec('ip', (form.specs.ip || []).filter((_, idx) => idx !== i)) }
  function addDisk()       { setSpec('disks', [...(form.specs.disks || []), { type: 'SSD', capacity: '' }]) }
  function setDisk(i, k, v){ const arr = [...(form.specs.disks || [])]; arr[i] = { ...arr[i], [k]: v }; setSpec('disks', arr) }
  function removeDisk(i)   { setSpec('disks', (form.specs.disks || []).filter((_, idx) => idx !== i)) }

  return (
    <div className="bg-white rounded-xl border border-teal-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">{initial ? 'Editar equipo' : 'Nuevo equipo'}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label required>Tipo de equipo</Label>
          <Select value={form.device_type} onChange={e => set('device_type', e.target.value)}>
            {IT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>
        <div><Label>Etiqueta / Nombre</Label><Input value={form.label} onChange={e => set('label', e.target.value)} placeholder="p.ej. Servidor principal" /></div>
        <div><Label>Marca</Label><Input value={form.specs.marca || ''} onChange={e => setSpec('marca', e.target.value)} /></div>
        <div><Label>Modelo</Label><Input value={form.specs.modelo || ''} onChange={e => setSpec('modelo', e.target.value)} /></div>
      </div>

      <label className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg cursor-pointer">
        <input type="checkbox" checked={form.is_viteka} onChange={e => set('is_viteka', e.target.checked)} className="w-4 h-4 accent-teal-600" />
        <span className="text-sm text-teal-800">Equipo de Viteka</span>
      </label>
      {form.is_viteka && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Nº de serie</Label><Input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} /></div>
          <div><Label>Fecha instalación</Label><Input type="date" value={form.install_date} onChange={e => set('install_date', e.target.value)} /></div>
          <div><Label>Fin garantía</Label><Input type="date" value={form.warranty_end} onChange={e => set('warranty_end', e.target.value)} /></div>
        </div>
      )}

      {isComputer && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Especificaciones hardware</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label>Sistema operativo</Label><Input value={form.specs.so || ''} onChange={e => setSpec('so', e.target.value)} /></div>
            <div><Label>Antivirus</Label><Input value={form.specs.antivirus || ''} onChange={e => setSpec('antivirus', e.target.value)} /></div>
            <div><Label>Procesador</Label><Input value={form.specs.cpu || ''} onChange={e => setSpec('cpu', e.target.value)} /></div>
            <div><Label>RAM</Label><Input value={form.specs.ram || ''} onChange={e => setSpec('ram', e.target.value)} placeholder="p.ej. 16 GB" /></div>
            <div><Label>Gráfica</Label><Input value={form.specs.gpu || ''} onChange={e => setSpec('gpu', e.target.value)} /></div>
            <div><Label>Fuente alimentación</Label><Input value={form.specs.psu || ''} onChange={e => setSpec('psu', e.target.value)} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Dirección(es) IP</Label>
              <button type="button" onClick={addIp} className="text-xs text-teal-600 hover:text-teal-800">+ Añadir IP</button>
            </div>
            {(form.specs.ip || ['']).map((ip, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={ip} onChange={e => setIp(i, e.target.value)} placeholder="192.168.1.x" />
                {i > 0 && <button type="button" onClick={() => removeIp(i)} className="text-red-400 hover:text-red-600"><XMarkIcon className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Disco(s) duro(s)</Label>
              <button type="button" onClick={addDisk} className="text-xs text-teal-600 hover:text-teal-800">+ Añadir disco</button>
            </div>
            {(form.specs.disks || []).map((d, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Select value={d.type} onChange={e => setDisk(i, 'type', e.target.value)} className="w-28">
                  {DISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input value={d.capacity} onChange={e => setDisk(i, 'capacity', e.target.value)} placeholder="p.ej. 512 GB" />
                <button type="button" onClick={() => removeDisk(i)} className="text-red-400 hover:text-red-600"><XMarkIcon className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monitor</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.specs.monitor} onChange={e => setSpec('monitor', e.target.checked ? { size: '', color: '', conn: 'HDMI' } : null)} className="accent-teal-600" />
              <span className="text-sm text-gray-700">Tiene monitor</span>
            </div>
            {form.specs.monitor && (<>
              <div><Label>Tamaño</Label><Input value={form.specs.monitor.size || ''} onChange={e => setSpec('monitor', { ...form.specs.monitor, size: e.target.value })} placeholder='"' /></div>
              <div><Label>Color</Label><Input value={form.specs.monitor.color || ''} onChange={e => setSpec('monitor', { ...form.specs.monitor, color: e.target.value })} /></div>
              <div><Label>Conexión</Label>
                <Select value={form.specs.monitor.conn || ''} onChange={e => setSpec('monitor', { ...form.specs.monitor, conn: e.target.value })}>
                  {MONITOR_CONN.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </>)}
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Periféricos</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['teclado', 'Teclado'], ['raton', 'Ratón']].map(([key, lbl]) => (
              <div key={key} className="space-y-1">
                <Label>{lbl}</Label>
                <Select value={form.specs[key] || 'NO'} onChange={e => setSpec(key, e.target.value)}>
                  <option value="NO">No</option>
                  <option value="Cable">Cable</option>
                  <option value="Inalámbrico">Inalámbrico</option>
                </Select>
              </div>
            ))}
            <div className="space-y-1">
              <Label>Lector tarjetas</Label>
              <Select value={form.specs.card_reader || 'NO'} onChange={e => setSpec('card_reader', e.target.value === 'NO' ? 'NO' : { modelo: '', año: '' })}>
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </Select>
              {form.specs.card_reader && form.specs.card_reader !== 'NO' && (
                <Input value={form.specs.card_reader.modelo || ''} onChange={e => setSpec('card_reader', { ...form.specs.card_reader, modelo: e.target.value })} placeholder="Modelo" />
              )}
            </div>
            <div className="space-y-1">
              <Label>Lector QR 2D</Label>
              <Select value={form.specs.qr_reader || 'NO'} onChange={e => setSpec('qr_reader', e.target.value === 'NO' ? 'NO' : { tipo: 'Cable', modelo: '' })}>
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </Select>
              {form.specs.qr_reader && form.specs.qr_reader !== 'NO' && (
                <div className="flex gap-2">
                  <Select value={form.specs.qr_reader.tipo || 'Cable'} onChange={e => setSpec('qr_reader', { ...form.specs.qr_reader, tipo: e.target.value })}>
                    <option>Cable</option><option>Inalámbrico</option>
                  </Select>
                  <Input value={form.specs.qr_reader.modelo || ''} onChange={e => setSpec('qr_reader', { ...form.specs.qr_reader, modelo: e.target.value })} placeholder="Modelo" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isPrinter && (
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Conexión</Label>
            <Select value={form.specs.conn || ''} onChange={e => setSpec('conn', e.target.value)}>
              <option value="">Seleccionar</option>
              {CONNECTION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div><Label>Equipo vinculado</Label><Input value={form.specs.linked || ''} onChange={e => setSpec('linked', e.target.value)} placeholder="Nombre o IP del equipo" /></div>
        </div>
      )}

      {form.device_type === 'sai' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><Label>Capacidad</Label><Input value={form.specs.capacity || ''} onChange={e => setSpec('capacity', e.target.value)} placeholder="p.ej. 600 VA" /></div>
          <div><Label>Año</Label><Input type="number" value={form.specs.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
          <div><Label>Equipo vinculado</Label><Input value={form.specs.linked || ''} onChange={e => setSpec('linked', e.target.value)} /></div>
        </div>
      )}

      {form.device_type === 'router' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label>Proveedor</Label><Input value={form.specs.provider || ''} onChange={e => setSpec('provider', e.target.value)} /></div>
            <div><Label>Año</Label><Input type="number" value={form.specs.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
            <div><Label>Prioridad (1=principal)</Label><Input type="number" min="1" value={form.specs.priority || ''} onChange={e => setSpec('priority', e.target.value)} /></div>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto del proveedor</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><Label>Nombre</Label><Input value={form.specs.contact_name || ''} onChange={e => setSpec('contact_name', e.target.value)} /></div>
            <div><Label>Cargo</Label><Input value={form.specs.contact_role || ''} onChange={e => setSpec('contact_role', e.target.value)} /></div>
            <div><Label>Teléfono</Label><Input value={form.specs.contact_phone || ''} onChange={e => setSpec('contact_phone', e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={form.specs.contact_email || ''} onChange={e => setSpec('contact_email', e.target.value)} /></div>
          </div>
        </div>
      )}

      {form.device_type === 'switch' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><Label>Nº salidas</Label><Input type="number" value={form.specs.ports || ''} onChange={e => setSpec('ports', e.target.value)} /></div>
          <div><Label>Año</Label><Input type="number" value={form.specs.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
          <div>
            <Label>Capa</Label>
            <Select value={form.specs.layer || ''} onChange={e => setSpec('layer', e.target.value)}>
              <option value="">Seleccionar</option>
              {CAPA_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" checked={!!form.specs.managed} onChange={e => setSpec('managed', e.target.checked)} className="accent-teal-600" />
            <span className="text-sm text-gray-700">Gestionable</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.specs.poe} onChange={e => setSpec('poe', e.target.checked ? { ports: '' } : false)} className="accent-teal-600" />
            <span className="text-sm text-gray-700">PoE</span>
          </div>
          {form.specs.poe && (
            <div><Label>Puertos PoE</Label><Input type="number" value={form.specs.poe.ports || ''} onChange={e => setSpec('poe', { ports: e.target.value })} /></div>
          )}
        </div>
      )}

      <div><Label>Observaciones</Label><Textarea value={form.observations || ''} onChange={e => set('observations', e.target.value)} /></div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
        <button type="button" onClick={() => onSave(form)} className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">Guardar equipo</button>
      </div>
    </div>
  )
}

function TabIT({ pharmacyId, companyId }) {
  const { devices, loading, createDevice, updateDevice, deleteDevice } = usePharmacyIT(pharmacyId)
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  async function handleSave(form) {
    try {
      const payload = { ...form, pharmacy_id: pharmacyId, company_id: companyId }
      if (editing) { await updateDevice(editing.id, payload); toast('Equipo actualizado', 'success') }
      else { await createDevice(payload); toast('Equipo añadido', 'success') }
      setAdding(false); setEditing(null)
    } catch (err) { toast(err.message, 'error', 5500) }
  }
  async function handleDelete() {
    try { await deleteDevice(confirmDel.id); toast('Equipo eliminado', 'success') }
    catch (err) { toast(err.message, 'error', 5500) }
    finally { setConfirmDel(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => { setAdding(true); setEditing(null) }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
          <PlusIcon className="w-4 h-4" /> Añadir equipo
        </button>
      </div>
      {(adding && !editing) && (
        <ITDeviceForm pharmacyId={pharmacyId} companyId={companyId} onSave={handleSave} onCancel={() => setAdding(false)} />
      )}
      {devices.length === 0 && !adding && <EmptyTab icon={ComputerDesktopIcon} message="Sin equipos registrados" />}
      {devices.map(d => (
        editing?.id === d.id
          ? <ITDeviceForm key={d.id} initial={editing} pharmacyId={pharmacyId} companyId={companyId} onSave={handleSave} onCancel={() => setEditing(null)} />
          : <ITDeviceCard key={d.id} device={d} onEdit={setEditing} onDelete={setConfirmDel} />
      ))}
      <ConfirmDialog
        open={!!confirmDel}
        title="Eliminar equipo"
        message={`¿Eliminar "${confirmDel?.label || IT_LABEL[confirmDel?.device_type] || 'este equipo'}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}

// ── Tab: Personas ─────────────────────────────────────────────────────────────
const PERSON_ROLE_COLORS = {
  Titular: 'bg-purple-100 text-purple-700', Adjunto: 'bg-blue-100 text-blue-700',
  Gestor: 'bg-indigo-100 text-indigo-700', Técnico: 'bg-orange-100 text-orange-700',
  Auxiliar: 'bg-gray-100 text-gray-600', Otro: 'bg-gray-100 text-gray-500',
}

function PersonCard({ person, onEdit, onDelete }) {
  const areas = Array.isArray(person.areas) ? person.areas : []
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{person.name}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PERSON_ROLE_COLORS[person.role] || 'bg-gray-100 text-gray-500'}`}>{person.role}</span>
            {person.is_responsible && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Responsable</span>}
          </div>
          {areas.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">Áreas: {areas.join(', ')}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onEdit(person)} className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-gray-50"><PencilSquareIcon className="w-4 h-4" /></button>
          <button type="button" onClick={() => onDelete(person)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50"><TrashIcon className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        {person.phone && <span>📞 {person.phone}</span>}
        {person.email && <span>✉️ {person.email}</span>}
      </div>
      {person.observations && <p className="text-xs text-gray-400 italic">{person.observations}</p>}
    </div>
  )
}

function PersonForm({ initial, pharmacyId, companyId, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', phone: '', email: '', role: 'Titular',
    is_responsible: false, areas: [], custom_area: '', observations: ''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleArea = area => setForm(p => ({
    ...p,
    areas: p.areas.includes(area) ? p.areas.filter(a => a !== area) : [...p.areas, area]
  }))

  return (
    <div className="bg-white rounded-xl border border-teal-200 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">{initial ? 'Editar persona' : 'Nueva persona'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Label required>Nombre completo</Label><Input required value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div>
          <Label required>Rol</Label>
          <Select value={form.role} onChange={e => set('role', e.target.value)}>
            {PERSON_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
        <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Áreas de responsabilidad</p>
        <div className="flex flex-wrap gap-2">
          {RESPONSIBILITY_AREAS.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`py-1.5 px-3 rounded-lg text-xs border transition-colors ${
                form.areas.includes(area)
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
              }`}
            >{area}</button>
          ))}
        </div>
        {form.areas.includes('Categoría') && (
          <div className="mt-2">
            <Label>Indicar categoría(s)</Label>
            <Input value={form.custom_area} onChange={e => set('custom_area', e.target.value)} placeholder="Descripción de la categoría" />
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.is_responsible} onChange={e => set('is_responsible', e.target.checked)} className="w-4 h-4 accent-teal-600" />
        <span className="text-sm text-gray-700">Marcar como responsable principal</span>
      </label>
      <div><Label>Observaciones</Label><Textarea value={form.observations} onChange={e => set('observations', e.target.value)} /></div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
        <button type="button" onClick={() => onSave(form)} className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">Guardar</button>
      </div>
    </div>
  )
}

function TabPeople({ pharmacyId, companyId }) {
  const { persons, loading, createPerson, updatePerson, deletePerson } = usePharmacyPersons(pharmacyId)
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  async function handleSave(form) {
    try {
      const payload = { ...form, pharmacy_id: pharmacyId, company_id: companyId }
      if (editing) { await updatePerson(editing.id, payload); toast('Persona actualizada', 'success') }
      else { await createPerson(payload); toast('Persona añadida', 'success') }
      setAdding(false); setEditing(null)
    } catch (err) { toast(err.message, 'error', 5500) }
  }
  async function handleDelete() {
    try { await deletePerson(confirmDel.id); toast('Persona eliminada', 'success') }
    catch (err) { toast(err.message, 'error', 5500) }
    finally { setConfirmDel(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => { setAdding(true); setEditing(null) }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
          <PlusIcon className="w-4 h-4" /> Añadir persona
        </button>
      </div>
      {(adding && !editing) && <PersonForm pharmacyId={pharmacyId} companyId={companyId} onSave={handleSave} onCancel={() => setAdding(false)} />}
      {persons.length === 0 && !adding && <EmptyTab icon={UsersIcon} message="Sin personas registradas" />}
      {persons.map(p => (
        editing?.id === p.id
          ? <PersonForm key={p.id} initial={editing} pharmacyId={pharmacyId} companyId={companyId} onSave={handleSave} onCancel={() => setEditing(null)} />
          : <PersonCard key={p.id} person={p} onEdit={setEditing} onDelete={setConfirmDel} />
      ))}
      <ConfirmDialog
        open={!!confirmDel}
        title="Eliminar persona"
        message={`¿Eliminar a "${confirmDel?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}

// ── Tab: Documentos ───────────────────────────────────────────────────────────
const DOC_EXT_ICON = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', default: '📎' }

function TabDocuments({ pharmacyId, companyId }) {
  const { documents, loading, uploadDocument, deleteDocument } = usePharmacyDocuments(pharmacyId)
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ category: DOC_CATEGORIES[0], name: '', file: null })
  const [showUpload, setShowUpload] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  const categories = ['Todos', ...DOC_CATEGORIES]
  const filtered = activeCategory === 'Todos' ? documents : documents.filter(d => d.category === activeCategory)

  async function handleUpload() {
    if (!uploadForm.file) { toast('Selecciona un archivo', 'error'); return }
    setUploading(true)
    try {
      await uploadDocument({ file: uploadForm.file, category: uploadForm.category, name: uploadForm.name || uploadForm.file.name, pharmacyId, companyId })
      toast('Documento subido correctamente', 'success')
      setShowUpload(false); setUploadForm({ category: DOC_CATEGORIES[0], name: '', file: null })
    } catch (err) { toast(err.message, 'error', 5500) }
    finally { setUploading(false) }
  }

  async function handleDelete() {
    try { await deleteDocument(confirmDel); toast('Documento eliminado', 'success') }
    catch (err) { toast(err.message, 'error', 5500) }
    finally { setConfirmDel(null) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeCategory === cat ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
              }`}>{cat}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowUpload(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700">
          <PlusIcon className="w-4 h-4" /> Subir documento
        </button>
      </div>

      {showUpload && (
        <div className="bg-white rounded-xl border border-teal-200 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Subir nuevo documento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label required>Categoría</Label>
              <Select value={uploadForm.category} onChange={e => setUploadForm(p => ({ ...p, category: e.target.value }))}>
                {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Nombre del documento</Label><Input value={uploadForm.name} onChange={e => setUploadForm(p => ({ ...p, name: e.target.value }))} placeholder="Opcional — si no, usa el nombre del archivo" /></div>
            <div>
              <Label required>Archivo</Label>
              <input type="file" onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] || null }))}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:text-xs file:font-medium hover:file:bg-teal-100 cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="button" onClick={handleUpload} disabled={uploading} className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
              {uploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && <EmptyTab icon={DocumentTextIcon} message={activeCategory === 'Todos' ? 'Sin documentos adjuntos' : `Sin documentos en "${activeCategory}"`} />}

      <div className="space-y-2">
        {filtered.map(doc => {
          const icon = DOC_EXT_ICON[doc.file_ext?.toLowerCase()] || DOC_EXT_ICON.default
          return (
            <div key={doc.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
              <span className="text-2xl">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.category} · {doc.size_bytes ? `${(doc.size_bytes / 1024).toFixed(0)} KB` : ''} · {new Date(doc.created_at).toLocaleDateString('es-ES')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={doc.public_url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-gray-50 text-xs">Ver</a>
                <button type="button" onClick={() => setConfirmDel(doc)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        title="Eliminar documento"
        message={`¿Eliminar "${confirmDel?.name}"? Se borrará también del almacenamiento.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PharmacyDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { profile } = useAuth()
  const { pharmacy, equipment, loading } = usePharmacy(id)
  const [activeTab, setActiveTab] = useState('general')

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!pharmacy) return <div className="p-6 text-gray-500">Farmacia no encontrada.</div>

  const companyId = profile?.company_id

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => navigate(-1)} className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{pharmacy.pharmacy_name}</h1>
            <Badge active={pharmacy.is_active} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {LEGAL_LABEL[pharmacy.legal_type] || pharmacy.legal_type}
            {pharmacy.city     ? ` · ${pharmacy.city}` : ''}
            {pharmacy.province ? `, ${PROVINCE_LABEL[pharmacy.province] || pharmacy.province}` : ''}
          </p>
        </div>
        <Link to={`/farmacias/${id}/editar`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 border border-gray-200 hover:border-teal-300 px-3 py-1.5 rounded-lg transition-colors">
          <PencilSquareIcon className="w-4 h-4" /> Editar
        </Link>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon, active = activeTab === tab.key
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div>
        {activeTab === 'general'   && <TabGeneral pharmacy={pharmacy} />}
        {activeTab === 'equipment' && <TabEquipment equipment={equipment} />}
        {activeTab === 'it'        && <TabIT pharmacyId={id} companyId={companyId} />}
        {activeTab === 'people'    && <TabPeople pharmacyId={id} companyId={companyId} />}
        {activeTab === 'incidents' && <EmptyTab icon={ExclamationTriangleIcon} message="Sin incidencias registradas" />}
        {activeTab === 'projects'  && <EmptyTab icon={FolderOpenIcon} message="Sin proyectos registrados" />}
        {activeTab === 'documents' && <TabDocuments pharmacyId={id} companyId={companyId} />}
      </div>
    </div>
  )
}
