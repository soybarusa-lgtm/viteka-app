import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePharmacy } from '../hooks/usePharmacy'
import { usePharmacyPersons } from '../hooks/usePharmacyPersons'
import { usePharmacyDocuments } from '../hooks/usePharmacyDocuments'
import { usePharmacyIT } from '../hooks/usePharmacyIT'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  ArrowLeftIcon, PencilSquareIcon,
  BuildingStorefrontIcon, WrenchScrewdriverIcon,
  UsersIcon, FolderOpenIcon, ExclamationTriangleIcon,
  DocumentTextIcon, ComputerDesktopIcon,
  PlusIcon, TrashIcon, XMarkIcon, ArrowsRightLeftIcon,
  DocumentDuplicateIcon, ChevronDownIcon, MagnifyingGlassIcon,
  CalendarDaysIcon, ShieldCheckIcon, EyeIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/pharmacy/ConfirmDialog'
import EquipmentSummaryTable from '../components/pharmacy/EquipmentSummaryTable'
import {
  PERSON_ROLES, RESPONSIBILITY_AREAS, DOC_CATEGORIES, IT_TYPES,
  CONNECTION_OPTIONS, MONITOR_CONN, DISK_TYPES, CAPA_OPTIONS,
} from '../components/pharmacy/PHARMACY_CONSTANTS'
import { Label, Input, Select, Textarea } from '../components/pharmacy/PharmacyFormAtoms'

// ── Helpers ──────────────────────────────────────────────────────────────────
const PROVINCE_LABEL = {
  almeria:'Almería',cadiz:'Cádiz',cordoba:'Córdoba',granada:'Granada',
  huelva:'Huelva',jaen:'Jaén',malaga:'Málaga',sevilla:'Sevilla',
}
const LEGAL_LABEL = {
  autonomo:'Autónomo',cb:'C.B.',sl:'S.L.',
  autonomo_sl:'Autónomo + S.L.',cb_sl:'C.B. + S.L.',
}

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

function EmptyTab({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
      <Icon className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Pestañas ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'general',   label: 'Datos generales',   icon: BuildingStorefrontIcon },
  { key: 'equipment', label: 'Equipamiento',       icon: WrenchScrewdriverIcon  },
  { key: 'it',        label: 'Equip. Informático', icon: ComputerDesktopIcon    },
  { key: 'people',    label: 'Personas',           icon: UsersIcon              },
  { key: 'incidents', label: 'Incidencias',        icon: ExclamationTriangleIcon},
  { key: 'projects',  label: 'Proyectos',          icon: FolderOpenIcon         },
  { key: 'documents', label: 'Documentos',         icon: DocumentTextIcon       },
]

// ── Tab: Datos generales ──────────────────────────────────────────────────────
function TabGeneral({ pharmacy }) {
  const lType = pharmacy.legal_type || ''
  const hasAuto = lType.includes('autonomo')
  const hasCb   = lType.includes('cb')
  const hasSl   = lType.includes('sl')
  const sl = pharmacy.sl_data || {}
  const cbOwners = Array.isArray(pharmacy.cb_owners) ? pharmacy.cb_owners : []

  const boolField = (label, val, wide) => (
    <Field label={label} value={val === true ? 'Sí' : val === false ? 'No' : null} wide={wide} />
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
            <div className="col-span-2 md:col-span-3"><p className="text-xs text-gray-300 italic">Sin titulares registrados</p></div>
          )}
          {cbOwners.map((o, i) => (
            <div key={i} className="col-span-2 md:col-span-3 grid grid-cols-3 gap-3 bg-white rounded-lg p-3 border border-gray-200">
              <div><dt className="text-xs text-gray-400">Titular {i + 1}</dt><dd className={`text-sm font-medium ${o.name ? 'text-gray-800' : 'text-gray-300 italic'}`}>{o.name || 'Sin informar'}</dd></div>
              <div><dt className="text-xs text-gray-400">NIF</dt><dd className={`text-sm font-medium ${o.nif ? 'text-gray-800' : 'text-gray-300 italic'}`}>{o.nif || 'Sin informar'}</dd></div>
              <div><dt className="text-xs text-gray-400">Colegiado</dt><dd className={`text-sm font-medium ${o.collegiate ? 'text-gray-800' : 'text-gray-300 italic'}`}>{o.collegiate || 'Sin informar'}</dd></div>
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
function TabEquipment({ equipment }) {
  if (!equipment) return <EmptyTab icon={WrenchScrewdriverIcon} message="Sin equipamiento registrado" />
  return <EquipmentSummaryTable equipment={equipment} />
}

// ── Tab: Equipamiento Informático ─────────────────────────────────────────────
const IT_LABEL = Object.fromEntries(IT_TYPES.map(t => [t.value, t.label]))

function resolveBrand(device) {
  const specs = device.specs || {}
  return {
    marca:  specs.marca  || device.brand  || '',
    modelo: specs.modelo || device.model  || '',
  }
}

function buildChips(device) {
  const s = device.specs || {}
  const isComputer = ['servidor', 'estacion'].includes(device.device_type)

  if (!isComputer) {
    const chips = []
    if (s.provider) chips.push(s.provider)
    if (s.ports)    chips.push(`${s.ports} puertos`)
    if (s.capacity) chips.push(s.capacity)
    if (s.conn)     chips.push(s.conn)
    return chips
  }

  const ip = Array.isArray(s.ip) && s.ip.filter(Boolean).length > 0
    ? `IP · ${s.ip.filter(Boolean)[0]}`
    : null
  const disk = Array.isArray(s.disks) && s.disks.length > 0 && s.disks[0].capacity
    ? `${s.disks[0].type} ${s.disks[0].capacity}`
    : null

  return [
    ip,
    s.so   || null,
    s.cpu  || null,
    s.ram  ? `${s.ram}` : null,
    disk,
  ].filter(Boolean)
}

function fmtDate(raw) {
  if (!raw) return null
  return new Date(raw).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
      {children}
    </span>
  )
}

// ── Modal base con guard de cambios sin guardar ───────────────────────────────
function DeviceModal({
  isOpen,
  isDirty,
  title,
  onRequestClose,
  onSaveBeforeClose,
  canSaveBeforeClose = false,
  saving = false,
  headerActions = null,
  children,
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const backdropRef = useRef(null)

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleClose() {
    if (isDirty) setShowConfirm(true)
    else onRequestClose()
  }

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isDirty])

  async function handleSaveAndClose() {
    if (!onSaveBeforeClose || !canSaveBeforeClose || saving) return
    await onSaveBeforeClose()
    setShowConfirm(false)
  }

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={e => {
        if (e.target === backdropRef.current) handleClose()
      }}
    >
      {/* Panel */}
      <div
        className="relative w-full sm:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-modal-title"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 min-w-0">
            {isDirty && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Sin guardar
              </span>
            )}
            <h2 id="device-modal-title" className="text-sm font-semibold text-gray-900 truncate">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>
      </div>

      {/* Confirmación cambios sin guardar */}
      {showConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">Hay cambios pendientes</h3>
            <p className="text-sm text-gray-500 mb-6">
              ¿Quieres guardar antes de cerrar esta ventana?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Seguir editando
              </button>

              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={!canSaveBeforeClose || saving}
                className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Guardando...' : 'Guardar y cerrar'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false)
                  onRequestClose()
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Fila de dispositivo (clicable) ────────────────────────────────────────────
function ITDeviceRow({ device, onOpen, onDelete, onDuplicate }) {
  const { marca, modelo } = resolveBrand(device)
  const chips    = buildChips(device)
  const fInst    = fmtDate(device.install_date)
  const fGar     = fmtDate(device.warranty_end)
  const now      = new Date()
  const warExpired = device.warranty_end && new Date(device.warranty_end) < now
  const warOk     = device.warranty_end && !warExpired

  return (
    <div
      className="group relative flex items-start gap-3 px-4 py-3.5 hover:bg-teal-50/40 active:bg-teal-50/70 transition-colors cursor-pointer border-l-2 border-transparent hover:border-teal-400"
      onClick={() => onOpen(device)}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen(device)}
    >
      {/* Indicador Viteka */}
      <span className={`mt-[7px] shrink-0 w-2 h-2 rounded-full transition-all ${
        device.is_viteka ? 'bg-teal-400' : 'bg-gray-300'
      }`} />

      {/* Contenido */}
      <div className="flex-1 min-w-0 pr-14">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-teal-700 transition-colors">
              {device.label || IT_LABEL[device.device_type] || 'Equipo'}
            </span>
            {device.is_viteka && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-100 text-teal-700">Viteka</span>
            )}
            {warOk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-600">
                <ShieldCheckIcon className="w-3 h-3" /> Garantía
              </span>
            )}
            {warExpired && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-500">
                <ShieldCheckIcon className="w-3 h-3" /> Expirada
              </span>
            )}
          </div>
          {(fInst || fGar) && (
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {fInst && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <CalendarDaysIcon className="w-3 h-3" /> {fInst}
                </span>
              )}
              {fGar && (
                <span className={`flex items-center gap-1 text-[11px] ${warExpired ? 'text-red-400' : 'text-gray-400'}`}>
                  <ShieldCheckIcon className="w-3 h-3" /> {fGar}
                </span>
              )}
            </div>
          )}
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {chips.map((c, i) => <Chip key={i}>{c}</Chip>)}
          </div>
        )}

        {(marca || modelo) && (
          <p className="text-xs text-gray-400 mt-1 truncate">{[marca, modelo].filter(Boolean).join(' · ')}</p>
        )}
      </div>

      {/* Acciones flotantes (aparecen en hover) */}
      <div
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onDuplicate(device)}
          title="Duplicar"
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 bg-white shadow-sm border border-gray-100"
        >
          <DocumentDuplicateIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(device)}
          title="Eliminar"
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 bg-white shadow-sm border border-gray-100"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Bloque colapsable por tipo ────────────────────────────────────────────────
function ITTypeBlock({ typeKey, devices, isOpen, onToggle, onOpen, onDelete, onDuplicate, onAddSameType }) {
  const total = devices.length
  const vitekaCount = devices.filter(d => d.is_viteka).length
  const buttonId = `it-trigger-${typeKey}`
  const panelId  = `it-panel-${typeKey}`

  return (
    <section className="mb-4 break-inside-avoid-column rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <button
            id={buttonId}
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={panelId}
            className="flex-1 text-left"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
                {IT_LABEL[typeKey] || typeKey}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {total} {total === 1 ? 'equipo' : 'equipos'}
              </span>
              {vitekaCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                  {vitekaCount} Viteka
                </span>
              )}
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onAddSameType(typeKey)}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-teal-300 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Añadir
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-label={isOpen ? 'Cerrar grupo' : 'Abrir grupo'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
            >
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="divide-y divide-slate-100">
          {devices.map(d => (
            <ITDeviceRow
              key={d.id}
              device={d}
              onOpen={onOpen}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Hook: persistencia localStorage ──────────────────────────────────────────
function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(state)) } catch {}
  }, [key, state])

  return [state, setState]
}

function createEmptyITDevice(deviceType = 'servidor') {
  return {
    device_type: deviceType, label: '', is_viteka: false,
    serial_number: '', install_date: '', warranty_end: '', observations: '',
    specs: {},
  }
}

// ── Formulario de equipo (dentro del modal) ───────────────────────────────────
function ITDeviceFormInner({ form, setForm }) {
  const set     = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const setSpec = (k, v) => setForm(p => ({ ...p, specs: { ...p.specs, [k]: v } }))

  const isComputer = ['servidor', 'estacion'].includes(form.device_type)
  const isPrinter  = ['impresora_documentos', 'impresora_tickets', 'impresora_etiquetas'].includes(form.device_type)

  function addIp()         { setSpec('ip', [...(form.specs.ip || ['']), '']) }
  function setIp(i, v)     { const arr = [...(form.specs.ip || [''])]; arr[i] = v; setSpec('ip', arr) }
  function removeIp(i)     { setSpec('ip', (form.specs.ip || []).filter((_, idx) => idx !== i)) }

  function addDisk()        { setSpec('disks', [...(form.specs.disks || []), { type: 'SSD', capacity: '' }]) }
  function setDisk(i, k, v) { const arr = [...(form.specs.disks || [])]; arr[i] = { ...arr[i], [k]: v }; setSpec('disks', arr) }
  function removeDisk(i)    { setSpec('disks', (form.specs.disks || []).filter((_, idx) => idx !== i)) }

  const conexiones = form.specs.conexiones || [{ numero: '', pass: '' }]
  function addConexion()        { setSpec('conexiones', [...conexiones, { numero: '', pass: '' }]) }
  function setConexion(i, k, v) { const arr = conexiones.map((c, idx) => idx === i ? { ...c, [k]: v } : c); setSpec('conexiones', arr) }
  function removeConexion(i)    { setSpec('conexiones', conexiones.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-5">
      {/* Tipo y etiqueta */}
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

      {/* Bloque Viteka */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_viteka} onChange={e => set('is_viteka', e.target.checked)} className="w-4 h-4 accent-teal-600" />
          <span className="text-sm font-medium text-teal-800">Equipo provisto / soportado por Viteka</span>
        </label>
        {form.is_viteka && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Nº de serie</Label><Input value={form.serial_number || ''} onChange={e => set('serial_number', e.target.value)} /></div>
            <div><Label>Fecha instalación</Label><Input type="date" value={form.install_date || ''} onChange={e => set('install_date', e.target.value)} /></div>
            <div><Label>Fin garantía</Label><Input type="date" value={form.warranty_end || ''} onChange={e => set('warranty_end', e.target.value)} /></div>
          </div>
        )}
      </div>

      {/* Especificaciones: ordenadores */}
      {isComputer && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5">Hardware</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label>Sistema operativo</Label><Input value={form.specs.so || ''} onChange={e => setSpec('so', e.target.value)} /></div>
            <div><Label>Antivirus</Label><Input value={form.specs.antivirus || ''} onChange={e => setSpec('antivirus', e.target.value)} /></div>
            <div><Label>Procesador</Label><Input value={form.specs.cpu || ''} onChange={e => setSpec('cpu', e.target.value)} /></div>
            <div><Label>RAM</Label><Input value={form.specs.ram || ''} onChange={e => setSpec('ram', e.target.value)} placeholder="p.ej. 16 GB" /></div>
            <div><Label>Gráfica</Label><Input value={form.specs.gpu || ''} onChange={e => setSpec('gpu', e.target.value)} /></div>
            <div><Label>Fuente alimentación</Label><Input value={form.specs.psu || ''} onChange={e => setSpec('psu', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* IPs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Dirección(es) IP</Label>
                <button type="button" onClick={addIp} className="text-xs font-medium text-teal-600 hover:text-teal-800">+ Añadir</button>
              </div>
              {(form.specs.ip || ['']).map((ip, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <Input value={ip} onChange={e => setIp(i, e.target.value)} placeholder="192.168.x.x" />
                  {i > 0 && (
                    <button type="button" onClick={() => removeIp(i)} className="shrink-0 p-2 text-red-400 hover:text-red-600">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Conexiones */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Nº conexión / contraseña</Label>
                <button type="button" onClick={addConexion} className="text-xs font-medium text-teal-600 hover:text-teal-800">+ Añadir</button>
              </div>
              {conexiones.map((c, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <Input value={c.numero} onChange={e => setConexion(i, 'numero', e.target.value)} placeholder="Número" />
                  <Input value={c.pass} onChange={e => setConexion(i, 'pass', e.target.value)} placeholder="Contraseña" type="password" autoComplete="new-password" />
                  {conexiones.length > 1 && (
                    <button type="button" onClick={() => removeConexion(i)} className="shrink-0 p-2 text-red-400 hover:text-red-600">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Discos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Disco(s) duro(s)</Label>
              <button type="button" onClick={addDisk} className="text-xs font-medium text-teal-600 hover:text-teal-800">+ Añadir disco</button>
            </div>
            {(form.specs.disks || []).map((d, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <Select value={d.type} onChange={e => setDisk(i, 'type', e.target.value)} className="w-28">
                  {DISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input value={d.capacity} onChange={e => setDisk(i, 'capacity', e.target.value)} placeholder="p.ej. 512 GB" />
                <button type="button" onClick={() => removeDisk(i)} className="shrink-0 p-2 text-red-400 hover:text-red-600">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Monitor */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5">Monitor y periféricos</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.specs.monitor}
                onChange={e => setSpec('monitor', e.target.checked ? { size: '', color: '', conn: 'HDMI', tactil: false } : null)}
                className="accent-teal-600" />
              <span className="text-sm font-medium text-gray-700">Tiene monitor</span>
            </label>
            {form.specs.monitor && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.specs.monitor.tactil}
                  onChange={e => setSpec('monitor', { ...form.specs.monitor, tactil: e.target.checked })}
                  className="accent-teal-600" />
                <span className="text-sm font-medium text-gray-700">Táctil</span>
              </label>
            )}
          </div>
          {form.specs.monitor && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 rounded-xl p-3">
              <div><Label>Tamaño</Label><Input value={form.specs.monitor.size || ''} onChange={e => setSpec('monitor', { ...form.specs.monitor, size: e.target.value })} placeholder='"' /></div>
              <div><Label>Color</Label><Input value={form.specs.monitor.color || ''} onChange={e => setSpec('monitor', { ...form.specs.monitor, color: e.target.value })} /></div>
              <div>
                <Label>Conexión</Label>
                <Select value={form.specs.monitor.conn || ''} onChange={e => setSpec('monitor', { ...form.specs.monitor, conn: e.target.value })}>
                  {MONITOR_CONN.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </div>
          )}

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
                <Input className="mt-1" value={form.specs.card_reader.modelo || ''} onChange={e => setSpec('card_reader', { ...form.specs.card_reader, modelo: e.target.value })} placeholder="Modelo" />
              )}
            </div>
            <div className="space-y-1">
              <Label>Lector QR 2D</Label>
              <Select value={form.specs.qr_reader || 'NO'} onChange={e => setSpec('qr_reader', e.target.value === 'NO' ? 'NO' : { tipo: 'Cable', modelo: '' })}>
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </Select>
              {form.specs.qr_reader && form.specs.qr_reader !== 'NO' && (
                <div className="flex gap-2 mt-1">
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

      {/* Impresoras */}
      {isPrinter && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Conexión</Label>
            <Select value={form.specs.conn || ''} onChange={e => setSpec('conn', e.target.value)}>
              <option value="">Seleccionar</option>
              {CONNECTION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div><Label>Equipo vinculado</Label><Input value={form.specs.linked || ''} onChange={e => setSpec('linked', e.target.value)} placeholder="Nombre o IP" /></div>
        </div>
      )}

      {/* SAI */}
      {form.device_type === 'sai' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><Label>Capacidad</Label><Input value={form.specs.capacity || ''} onChange={e => setSpec('capacity', e.target.value)} placeholder="600 VA" /></div>
          <div><Label>Año</Label><Input type="number" value={form.specs.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
          <div className="col-span-2"><Label>Equipo vinculado</Label><Input value={form.specs.linked || ''} onChange={e => setSpec('linked', e.target.value)} /></div>
        </div>
      )}

      {/* Router */}
      {form.device_type === 'router' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><Label>Proveedor</Label><Input value={form.specs.provider || ''} onChange={e => setSpec('provider', e.target.value)} /></div>
            <div><Label>Año</Label><Input type="number" value={form.specs.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
            <div><Label>Prioridad (1=principal)</Label><Input type="number" min="1" value={form.specs.priority || ''} onChange={e => setSpec('priority', e.target.value)} /></div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1.5">Contacto del proveedor</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><Label>Nombre</Label><Input value={form.specs.contact_name || ''} onChange={e => setSpec('contact_name', e.target.value)} /></div>
            <div><Label>Cargo</Label><Input value={form.specs.contact_role || ''} onChange={e => setSpec('contact_role', e.target.value)} /></div>
            <div><Label>Teléfono</Label><Input value={form.specs.contact_phone || ''} onChange={e => setSpec('contact_phone', e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={form.specs.contact_email || ''} onChange={e => setSpec('contact_email', e.target.value)} /></div>
          </div>
        </div>
      )}

      {/* Switch */}
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
          <div className="col-span-full border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={!!form.specs.poe} onChange={e => setSpec('poe', e.target.checked ? { ports: '' } : false)} className="accent-teal-600" />
              <span className="text-sm text-gray-700">Soporta PoE</span>
            </div>
            {form.specs.poe && (
              <div className="w-40"><Label>Puertos PoE</Label><Input type="number" value={form.specs.poe.ports || ''} onChange={e => setSpec('poe', { ports: e.target.value })} /></div>
            )}
          </div>
        </div>
      )}

      {/* Observaciones */}
      <div>
        <Label>Observaciones</Label>
        <Textarea rows={3} value={form.observations || ''} onChange={e => set('observations', e.target.value)} placeholder="Notas adicionales..." />
      </div>
    </div>
  )
}

// ── Vistas de solo lectura ────────────────────────────────────────────────────
function ReadOnlyField({ label, value, wide = false }) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-sm ${isEmpty ? 'text-gray-300 italic' : 'text-gray-800'}`}>
        {isEmpty ? 'Sin informar' : value}
      </p>
    </div>
  )
}

function ReadOnlySection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-teal-700">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  )
}

function ITDeviceReadView({ device }) {
  const s = device?.specs || {}
  const ips = Array.isArray(s.ip) ? s.ip.filter(Boolean) : []
  const disks = Array.isArray(s.disks) ? s.disks.filter(d => d?.type || d?.capacity) : []
  const conexiones = Array.isArray(s.conexiones) ? s.conexiones.filter(c => c?.numero || c?.pass) : []
  const monitor = s.monitor
  const { marca, modelo } = resolveBrand(device)

  return (
    <div className="space-y-4">
      <ReadOnlySection title="Resumen">
        <ReadOnlyField label="Tipo" value={IT_LABEL[device.device_type] || device.device_type} />
        <ReadOnlyField label="Etiqueta / Nombre" value={device.label} />
        <ReadOnlyField label="Marca" value={marca} />
        <ReadOnlyField label="Modelo" value={modelo} />
        <ReadOnlyField label="Viteka" value={device.is_viteka ? 'Sí' : 'No'} />
        <ReadOnlyField label="Nº serie" value={device.serial_number} />
        <ReadOnlyField label="Fecha instalación" value={fmtDate(device.install_date)} />
        <ReadOnlyField label="Fin garantía" value={fmtDate(device.warranty_end)} />
      </ReadOnlySection>

      {['servidor', 'estacion'].includes(device.device_type) && (
        <>
          <ReadOnlySection title="Hardware">
            <ReadOnlyField label="Sistema operativo" value={s.so} />
            <ReadOnlyField label="Antivirus" value={s.antivirus} />
            <ReadOnlyField label="Procesador" value={s.cpu} />
            <ReadOnlyField label="RAM" value={s.ram} />
            <ReadOnlyField label="Gráfica" value={s.gpu} />
            <ReadOnlyField label="Fuente de alimentación" value={s.psu} />
            <ReadOnlyField label="Direcciones IP" value={ips.join(' · ')} wide />
            <ReadOnlyField
              label="Discos duros"
              value={disks.map(d => `${d.type || ''} ${d.capacity || ''}`.trim()).join(' · ')}
              wide
            />
          </ReadOnlySection>

          <ReadOnlySection title="Monitor y Periféricos">
            <ReadOnlyField label="Tiene monitor" value={monitor ? 'Sí' : 'No'} />
            <ReadOnlyField
              label="Detalle monitor"
              value={
                monitor
                  ? [
                      monitor.size && `${monitor.size}"`,
                      monitor.color,
                      monitor.conn,
                      monitor.tactil ? 'Táctil' : null,
                    ].filter(Boolean).join(' · ')
                  : ''
              }
            />
            <ReadOnlyField label="Teclado" value={s.teclado} />
            <ReadOnlyField label="Ratón" value={s.raton} />
            <ReadOnlyField
              label="Lector tarjetas"
              value={
                s.card_reader && s.card_reader !== 'NO'
                  ? [s.card_reader.modelo, s.card_reader.año].filter(Boolean).join(' · ')
                  : s.card_reader === 'NO' ? 'No' : ''
              }
            />
            <ReadOnlyField
              label="Lector QR 2D"
              value={
                s.qr_reader && s.qr_reader !== 'NO'
                  ? [s.qr_reader.tipo, s.qr_reader.modelo].filter(Boolean).join(' · ')
                  : s.qr_reader === 'NO' ? 'No' : ''
              }
            />
          </ReadOnlySection>

          {conexiones.length > 0 && (
            <ReadOnlySection title="Conexiones Remotas">
              <ReadOnlyField
                label="Nº Conexión"
                value={conexiones.map(c => c.numero).filter(Boolean).join(' · ')}
                wide
              />
            </ReadOnlySection>
          )}
        </>
      )}

      {['impresora_documentos', 'impresora_tickets', 'impresora_etiquetas'].includes(device.device_type) && (
        <ReadOnlySection title="Configuración de Impresión">
          <ReadOnlyField label="Conexión" value={s.conn} />
          <ReadOnlyField label="Equipo vinculado" value={s.linked} />
        </ReadOnlySection>
      )}

      {device.device_type === 'router' && (
        <ReadOnlySection title="Configuración de Router">
          <ReadOnlyField label="Proveedor" value={s.provider} />
          <ReadOnlyField label="Año" value={s.year} />
          <ReadOnlyField label="Prioridad" value={s.priority} />
          <ReadOnlyField
            label="Contacto del proveedor"
            value={[s.contact_name, s.contact_role, s.contact_phone, s.contact_email].filter(Boolean).join(' · ')}
            wide
          />
        </ReadOnlySection>
      )}

      {device.device_type === 'switch' && (
        <ReadOnlySection title="Configuración de Switch">
          <ReadOnlyField label="Nº de salidas" value={s.ports} />
          <ReadOnlyField label="Año" value={s.year} />
          <ReadOnlyField label="Capa" value={s.layer} />
          <ReadOnlyField label="Gestionable" value={s.managed ? 'Sí' : 'No'} />
          <ReadOnlyField label="Soporta PoE" value={s.poe ? `Sí · ${s.poe.ports || 'Sin indicar'} puertos` : 'No'} />
        </ReadOnlySection>
      )}

      {device.device_type === 'sai' && (
        <ReadOnlySection title="Configuración de SAI">
          <ReadOnlyField label="Capacidad" value={s.capacity} />
          <ReadOnlyField label="Año" value={s.year} />
          <ReadOnlyField label="Equipo vinculado" value={s.linked} wide />
        </ReadOnlySection>
      )}

      <ReadOnlySection title="Observaciones">
        <ReadOnlyField label="Notas adicionales" value={device.observations} wide />
      </ReadOnlySection>
    </div>
  )
}

// ── Modal unificado: ver / editar equipo ──────────────────────────────────────
function ITDeviceModal({ device, pharmacyId, companyId, onSave, onClose }) {
  const isNew = !device?.id
  const [form, setForm] = useState(device || createEmptyITDevice())
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState(isNew ? 'edit' : 'view')

  const baseSnapshot = useMemo(
    () => JSON.stringify(device || createEmptyITDevice()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [device?.id]
  )

  // Sincronizar cuando cambia el device (al abrir otro equipo)
  useEffect(() => {
    setForm(device || createEmptyITDevice())
    setMode(device?.id ? 'view' : 'edit')
  }, [device])

  const isDirty = JSON.stringify(form) !== baseSnapshot

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const title = isNew
    ? `Nuevo equipo — ${IT_LABEL[form.device_type] || ''}`
    : (form.label || IT_LABEL[form.device_type] || 'Equipo')

  const isReadMode = !isNew && mode === 'view'

  return (
    <DeviceModal
      isOpen={!!device || isNew}
      isDirty={isDirty}
      title={title}
      onRequestClose={onClose}
      onSaveBeforeClose={handleSave}
      canSaveBeforeClose={isDirty}
      saving={saving}
      headerActions={
        isReadMode ? (
          <button
            type="button"
            onClick={() => setMode('edit')}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4" />
            Editar
          </button>
        ) : null
      }
    >
      {isReadMode ? (
        <ITDeviceReadView device={form} />
      ) : (
        <ITDeviceFormInner form={form} setForm={setForm} />
      )}

      {/* Barra de acciones dentro del modal (sticky bottom) */}
      <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 px-5 py-4 bg-white border-t border-gray-100 flex items-center justify-between gap-3">
        <span className={`text-xs font-medium transition-colors ${
          isDirty ? 'text-amber-600' : 'text-gray-400'
        }`}>
          {isDirty ? '● Cambios sin guardar' : isReadMode ? 'Modo lectura' : isNew ? 'Nuevo equipo' : 'Sin cambios'}
        </span>

        <div className="flex gap-2">
          {isReadMode ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                Editar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  if (isNew) onClose()
                  else if (isDirty) onClose()
                  else setMode('view')
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                {isNew ? 'Cancelar' : isDirty ? 'Cerrar' : 'Volver a lectura'}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Guardando...' : isNew ? 'Crear equipo' : 'Guardar cambios'}
              </button>
            </>
          )}
        </div>
      </div>
    </DeviceModal>
  )
}

// ── Modal: Copiar equipos de otra farmacia ─────────────────────────────────────
function CopyFromPharmacyModal({ currentPharmacyId, companyId, onCopy, onClose }) {
  const [pharmacies, setPharmacies] = useState([])
  const [sourceId, setSourceId]     = useState('')
  const [sourceDevices, setSourceDevices] = useState([])
  const [selected, setSelected]     = useState([])
  const [loadingPharm, setLoadingPharm] = useState(true)
  const [loadingDev, setLoadingDev]     = useState(false)
  const [copying, setCopying]           = useState(false)

  useEffect(() => {
    async function fetchPharmacies() {
      const { data } = await supabase
        .from('pharmacies')
        .select('id, pharmacy_name, city')
        .eq('company_id', companyId)
        .neq('id', currentPharmacyId)
        .order('pharmacy_name')
      setPharmacies(data ?? [])
      setLoadingPharm(false)
    }
    fetchPharmacies()
  }, [companyId, currentPharmacyId])

  useEffect(() => {
    if (!sourceId) { setSourceDevices([]); return }
    setLoadingDev(true)
    supabase
      .from('pharmacy_it_devices')
      .select('id, device_type, label, brand, model, specs, observations')
      .eq('pharmacy_id', sourceId)
      .order('created_at')
      .then(({ data }) => { setSourceDevices(data ?? []); setSelected([]); setLoadingDev(false) })
  }, [sourceId])

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll() {
    setSelected(selected.length === sourceDevices.length ? [] : sourceDevices.map(d => d.id))
  }

  async function handleCopy() {
    const toCopy = sourceDevices.filter(d => selected.includes(d.id))
    setCopying(true)
    await onCopy(toCopy)
    setCopying(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Copiar equipos de otra farmacia</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <Label required>Farmacia origen</Label>
            {loadingPharm ? (
              <p className="text-sm text-gray-400">Cargando farmacias...</p>
            ) : (
              <Select value={sourceId} onChange={e => setSourceId(e.target.value)}>
                <option value="">Selecciona una farmacia</option>
                {pharmacies.map(p => (
                  <option key={p.id} value={p.id}>{p.pharmacy_name}{p.city ? ` — ${p.city}` : ''}</option>
                ))}
              </Select>
            )}
          </div>
          {sourceId && (
            <div className="space-y-2">
              {loadingDev ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : sourceDevices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Esta farmacia no tiene equipos informáticos</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{sourceDevices.length} equipo{sourceDevices.length !== 1 ? 's' : ''}</p>
                    <button type="button" onClick={toggleAll} className="text-xs text-teal-600 hover:text-teal-800">
                      {selected.length === sourceDevices.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  </div>
                  {sourceDevices.map(d => {
                    const { marca, modelo } = resolveBrand(d)
                    return (
                      <label key={d.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selected.includes(d.id) ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleSelect(d.id)} className="mt-0.5 w-4 h-4 accent-teal-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">{IT_LABEL[d.device_type] || d.device_type}</p>
                          {d.label && <p className="text-sm text-gray-800">{d.label}</p>}
                          {(marca || modelo) && <p className="text-xs text-gray-400">{marca}{modelo ? ` — ${modelo}` : ''}</p>}
                        </div>
                      </label>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-gray-200">
          <span className="text-xs text-gray-400">
            {selected.length > 0 ? `${selected.length} equipo${selected.length !== 1 ? 's' : ''} seleccionado${selected.length !== 1 ? 's' : ''}` : 'Ninguno seleccionado'}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="button" onClick={handleCopy} disabled={selected.length === 0 || copying}
              className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed">
              {copying ? 'Copiando...' : 'Copiar seleccionados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TabIT principal ────────────────────────────────────────────────────────────
function TabIT({ pharmacyId, companyId }) {
  const { devices, loading, createDevice, updateDevice, deleteDevice } = usePharmacyIT(pharmacyId)
  const toast = useToast()

  const [modalDevice, setModalDevice] = useState(null)
  const [confirmDel, setConfirmDel]   = useState(null)
  const [showCopy, setShowCopy]       = useState(false)
  const [search, setSearch]           = useState('')
  const [draftType, setDraftType]     = useState('servidor')
  const [openGroups, setOpenGroups]   = useLocalStorageState(`pharmacy-it-open-${pharmacyId}`, {})

  function openDevice(device) {
    setModalDevice({ ...device, specs: { ...device.specs, ...resolveBrand(device) } })
  }

  function openNewForm(type = 'servidor') {
    setDraftType(type)
    setModalDevice(createEmptyITDevice(type))
  }

  function closeModal() {
    setModalDevice(null)
  }

  async function handleSave(form) {
    const { brand: _b, model: _m, ...rest } = form
    const payload = { ...rest, pharmacy_id: pharmacyId, company_id: companyId }
    if (form.id) {
      await updateDevice(form.id, payload)
      toast('Equipo actualizado', 'success')
    } else {
      await createDevice(payload)
      toas