import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { usePharmacy } from '../hooks/usePharmacy'
import { usePharmacyPersons } from '../hooks/usePharmacyPersons'
import { usePharmacyDocuments } from '../hooks/usePharmacyDocuments'
import { usePharmacyIT } from '../hooks/usePharmacyIT'
import { supabase } from '../lib/supabase'
import {
  ArrowLeftIcon, PencilSquareIcon,
  BuildingStorefrontIcon, WrenchScrewdriverIcon,
  UsersIcon, FolderOpenIcon, ExclamationTriangleIcon,
  DocumentTextIcon, ComputerDesktopIcon,
  PlusIcon, TrashIcon, XMarkIcon, ArrowsRightLeftIcon,
  DocumentDuplicateIcon, ChevronDownIcon, MagnifyingGlassIcon,
  CalendarDaysIcon, ShieldCheckIcon, EyeIcon,
  Squares2X2Icon, ListBulletIcon, PhotoIcon,
  ArrowDownTrayIcon, ArrowPathIcon, ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon, MapPinIcon, ClockIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/pharmacy/ConfirmDialog'
import EquipmentSummaryTable from '../components/pharmacy/EquipmentSummaryTable'
import PharmacyEditDrawer from '../components/pharmacy/PharmacyEditDrawer'
import EditGeneralModal from '../components/pharmacy/EditGeneralModal'
import EditEquipmentModal from '../components/pharmacy/EditEquipmentModal'
import { getScheduleDayRows, getScheduleOptionLabels, parseScheduleValue } from '../lib/pharmacySchedule'
import { syncPharmacyOwnersAsPersons } from '../lib/pharmacyPersons'
import {
  PERSON_ROLES, RESPONSIBILITY_AREAS, DOC_CATEGORIES, IT_TYPES,
  CONNECTION_OPTIONS, MONITOR_CONN, DISK_TYPES, CAPA_OPTIONS, MONTHS, YEARS,
} from '../components/pharmacy/PHARMACY_CONSTANTS'
import { Label, Input, Select, Textarea } from '../components/pharmacy/PharmacyFormAtoms'

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PROVINCE_LABEL = {
  almeria:'Almería',cadiz:'Cádiz',cordoba:'Córdoba',granada:'Granada',
  huelva:'Huelva',jaen:'Jaén',malaga:'Málaga',sevilla:'Sevilla',
}
const LEGAL_LABEL = {
  autonomo:'Persona Jurídica.',cb:'C.B.',sl:'S.L.',
  autonomo_sl:'Persona Jurídica. + S.L.',cb_sl:'C.B. + S.L.',
}

const DEVICE_PHOTO_BUCKET = 'task-evidence'

function Field({ label, value, wide, className = '', emptyText = 'Sin informar' }) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div className={`${wide ? 'col-span-full' : ''} ${className}`}>
      <dt className="mb-0.5 text-[11px] font-medium text-slate-400">{label}</dt>
      <dd className={`text-[13px] font-semibold leading-snug ${
        isEmpty ? 'text-gray-300 italic' : 'text-gray-800'
      }`}>
        {isEmpty ? emptyText : value}
      </dd>
    </div>
  )
}

function CollapsibleGroup({ title, count, open, onToggle, children, tone = 'slate' }) {
  return (
    <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 bg-slate-50/80 px-4 py-3 text-left transition-colors hover:bg-slate-100"
      >
        <span className={`text-xs font-bold uppercase tracking-wider ${tone === 'teal' ? 'text-teal-700' : 'text-slate-600'}`}>
          {title}
        </span>
        <span className="flex items-center gap-2">
          {count !== undefined && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm">{count}</span>
          )}
          <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </section>
  )
}

function HoverPanel({
  title,
  subtitle,
  lines = [],
  chips = [],
  placement = 'bottom',
  widthClass = 'w-80',
  children,
}) {
  const placementClass = placement === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2'

  const safeLines = lines.filter(Boolean)
  const safeChips = chips.filter(Boolean)

  return (
    <div className="group/hover relative min-w-0">
      {children}
      <div className={`pointer-events-none absolute left-0 z-40 hidden ${widthClass} max-w-[calc(100vw-2rem)] ${placementClass} rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.16)] group-hover/hover:block group-focus-within/hover:block`}>
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
            {subtitle && <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">{subtitle}</p>}
          </div>
          {safeLines.length > 0 && (
            <div className="space-y-1.5">
              {safeLines.map((line, index) => (
                <div key={`${title}-${index}`} className="flex items-start justify-between gap-3 text-xs text-slate-600">
                  <span className="font-medium text-slate-500">{line.label}</span>
                  <span className="text-right font-semibold text-slate-800">{line.value}</span>
                </div>
              ))}
            </div>
          )}
          {safeChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
              {safeChips.map(chip => (
                <span key={`${title}-${chip}`} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailChip({ label, detail, tone = 'slate', className = '' }) {
  const toneClass = tone === 'teal'
    ? 'border-teal-200 bg-teal-50 text-teal-700'
    : 'border-slate-200 bg-white text-slate-600'

  return (
    <HoverPanel title={label} subtitle={detail} placement="top" widthClass="w-72">
      <div className={`inline-flex min-w-0 items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${toneClass} ${className}`}>
        <span className="truncate">{label}</span>
      </div>
    </HoverPanel>
  )
}

function CompactMetaBox({ label, value, detailTitle, detailSubtitle, detailLines = [], detailChips = [], className = '' }) {
  return (
    <HoverPanel
      title={detailTitle || label}
      subtitle={detailSubtitle || value}
      lines={detailLines}
      chips={detailChips}
      widthClass="w-80"
    >
      <div className={`rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors group-hover/hover:border-teal-200 group-hover/hover:bg-teal-50/50 ${className}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-1 truncate text-[13px] font-semibold text-slate-800">{value || 'Sin informar'}</p>
      </div>
    </HoverPanel>
  )
}

function SectionBlock({ title, open, onToggle, children }) {
  return (
    <CollapsibleGroup title={title} open={open} onToggle={onToggle}>
      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-12">{children}</div>
    </CollapsibleGroup>
  )
}

function InfoGroup({ title, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-100 bg-slate-50/45 px-3 py-2 ${className}`}>
      <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-4">{children}</dl>
    </section>
  )
}

function TabToolbar({
  query,
  onQueryChange,
  placeholder,
  onCollapseAll,
  allCollapsed = false,
  children,
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm transition-colors focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCollapseAll}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${allCollapsed ? '' : 'rotate-180'}`} />
          {allCollapsed ? 'Desplegar todo' : 'Contraer todo'}
        </button>
        {children}
      </div>
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

function formatDateTime(value) {
  if (!value) return 'Sin informar'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin informar'
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getLastActionLabel(log) {
  if (!log) return 'Sin actividad reciente'
  const actionMap = {
    create: 'creación',
    update: 'actualización',
    delete: 'eliminación',
    upload: 'subida',
    complete: 'cierre',
  }
  const action = actionMap[log.action] || log.action || 'actualización'
  const user = log.user_name || 'Sistema'
  const entity = log.entity_name || 'elemento'
  return `${user} realizó ${action} en ${entity}`
}

const ACTIVITY_FIELD_LABELS = {
  pharmacy_name: 'Nombre de la farmacia',
  legal_type: 'Tipo jurídico',
  owner_name: 'Titular',
  nif: 'NIF',
  collegiate_number: 'Nº colegiado',
  razon_social: 'Razón social',
  cif: 'CIF',
  soe_number: 'SOE',
  contact_phone: 'Teléfono',
  contact_email: 'Email',
  address: 'Dirección',
  province: 'Provincia',
  city: 'Población',
  postal_code: 'C.P.',
  schedule: 'Horario',
  has_guards: 'Guardias',
  observations: 'Observaciones',
  sl_data: 'Datos S.L.',
  cb_owners: 'Titulares C.B.',
  erp: 'ERP',
  erp_viteka: 'ERP gestionado por Viteka',
  caja: 'Caja de cobro',
  caja_viteka: 'Caja gestionada por Viteka',
  esl: 'Etiquetas ESL',
  esl_viteka: 'ESL gestionado por Viteka',
  bascula: 'Báscula',
  consultoria: 'Consultoría',
  robot: 'Robot dispensador',
  cruz: 'Cruz luminosa',
  gestor_turnos: 'Gestor de turnos',
  spd: 'SPD',
  pantallas: 'Pantallas',
  frigorifico_marca: 'Frigorífico',
}

function formatActivityValue(value) {
  if (value === true) return 'Sí'
  if (value === false) return 'No'
  if (value === null || value === undefined || value === '') return 'Sin informar'
  if (typeof value === 'object') return 'Datos actualizados'
  return String(value)
}

function getLastChangeDetail(log) {
  if (!log) return 'Sin actividad registrada'
  if (log.action === 'create' && log.new_value) return 'Registro creado'
  if (log.action === 'delete' && log.old_value) return 'Registro eliminado'
  if (!log.old_value || !log.new_value) return 'Sin detalle histórico del cambio'
  const ignoredFields = new Set(['id', 'company_id', 'created_at', 'updated_at'])
  const keys = [...new Set([...Object.keys(log.old_value), ...Object.keys(log.new_value)])]
  const changes = keys.filter(key => (
    !ignoredFields.has(key) &&
    JSON.stringify(log.old_value[key] ?? null) !== JSON.stringify(log.new_value[key] ?? null)
  ))
  if (changes.length === 0) return 'Sin cambios de contenido detectados'

  const key = changes[0]
  const label = ACTIVITY_FIELD_LABELS[key] || key
  const previous = formatActivityValue(log.old_value[key])
  const next = formatActivityValue(log.new_value[key])
  const extra = changes.length > 1 ? ` · +${changes.length - 1} campos` : ''
  return `${label}: ${previous} → ${next}${extra}`
}

function getEquipmentSummaryRows(equipment) {
  if (!equipment) return []

  const isActive = value => Boolean(value && value !== 'NO')
  const row = (producto, value, detailKey, isViteka = false) => ({
    producto,
    estado: isActive(value) ? 'SI' : 'NO',
    is_viteka: isViteka,
    distribuidor: equipment[detailKey]?.distribuidor || '',
    soporte: equipment[detailKey]?.soporte || '',
  })

  return [
    row('ERP', equipment.erp, 'erp_detail', equipment.erp_viteka),
    row('Caja de cobro', equipment.caja, 'cash_detail', equipment.caja_viteka),
    row('Etiquetas ESL', equipment.esl, 'esl_detail', equipment.esl_viteka),
    row('Báscula', equipment.bascula, 'scale_detail', equipment.bascula_viteka),
    row('Arco antihurto', equipment.antihurto, 'antitheft_detail'),
    row('Consultoría', equipment.consultoria, 'consulting_detail', equipment.consultoria_viteka),
    row('Robot dispensador', equipment.robot, 'robot_detail'),
    row('Cruz luminosa', equipment.cruz, 'cross_detail'),
    row('Gestor de turnos', equipment.gestor_turnos, 'queue_detail'),
    row('SPD', equipment.spd, 'spd_detail'),
    row('Pantallas', equipment.pantallas, 'screens_detail'),
    row('Frigorífico', equipment.frigorifico_marca, 'fridge_detail', equipment.frigorifico_viteka),
  ]
}

function SummaryCard({ title, value, detail, meta, items = [], icon: Icon, onClick, accent = 'teal', className = '' }) {
  const accentClass = accent === 'teal'
    ? 'border-teal-200 bg-teal-50/60 hover:border-teal-300 hover:bg-teal-50'
    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full min-h-[102px] w-full flex-col justify-between rounded-xl border px-3 py-2.5 text-left shadow-sm transition-all ${accentClass} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-tight text-slate-900">{value || 'Sin datos'}</p>
          {meta && <p className="mt-0.5 text-[11px] font-semibold text-teal-700">{meta}</p>}
        </div>
        <div className="rounded-lg bg-white/80 p-2 text-teal-700 shadow-sm ring-1 ring-inset ring-teal-100">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2">
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {items.map(item => (
              <DetailChip
                key={`${title}-${item.label}`}
                label={item.label}
                detail={item.detail}
                tone={accent === 'teal' ? 'teal' : 'slate'}
              />
            ))}
          </div>
        ) : detail ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{detail}</p>
        ) : null}
        <span className="mt-1 inline-flex text-[11px] font-semibold text-teal-700 transition-transform group-hover:translate-x-0.5">
          Ver detalle →
        </span>
      </div>
    </button>
  )
}

function MapSummaryCard({ title, value, detail, onClick, className = '' }) {
  const src = value && value !== 'Ubicación no informada'
    ? `https://www.google.com/maps?q=${encodeURIComponent(value)}&z=15&output=embed`
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[118px] w-full flex-col overflow-hidden rounded-xl border border-teal-200 bg-teal-50/60 px-3 py-2.5 text-left shadow-sm transition-all hover:border-teal-300 hover:bg-teal-50 ${className}`}
    >
      {src ? (
        <iframe
          title={title}
          src={src}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(13,148,136,0.12),_transparent_45%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(236,253,245,0.95))]" />
      )}
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{value || 'Sin datos'}</p>
          </div>
          <div className="rounded-lg bg-white/90 p-2 text-teal-700 shadow-sm ring-1 ring-inset ring-teal-100">
            <MapPinIcon className="h-4 w-4" />
          </div>
        </div>
        <p className="relative z-10 mt-3 text-xs font-semibold text-teal-800">{detail}</p>
      </div>
    </button>
  )
}

function getScheduleDetailLines(schedule) {
  const rows = schedule?.detail ? getScheduleDayRows(schedule.detail) : []
  if (rows.length > 0) {
    return rows.map(row => ({ label: row.day, value: row.hours }))
  }
  if (schedule?.summary) {
    return [{ label: 'Horario', value: schedule.summary }]
  }
  return [{ label: 'Estado', value: 'Sin horario configurado' }]
}

function getScheduleMetaItems({ schedule, scheduleOptions, hasGuards, observations }) {
  const detailLines = [
    ...getScheduleDetailLines(schedule),
    { label: 'Guardias', value: hasGuards ? 'Sí' : 'No' },
    ...(schedule?.guardNotes ? [{ label: 'Indicaciones', value: schedule.guardNotes }] : []),
    ...(observations ? [{ label: 'Observaciones', value: observations }] : []),
  ]

  const chipLabels = [
    ...(scheduleOptions || []),
    hasGuards ? 'Hace guardias' : null,
    observations ? 'Tiene observaciones' : null,
  ].filter(Boolean)

  return {
    detailLines,
    chipLabels,
  }
}

// â”€â”€ Pestañas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TABS = [
  { key: 'general',   label: 'Datos generales',   icon: BuildingStorefrontIcon },
  { key: 'equipment', label: 'Equipamiento',       icon: WrenchScrewdriverIcon  },
  { key: 'it',        label: 'Equip. Informático', icon: ComputerDesktopIcon    },
  { key: 'people',    label: 'Personas',           icon: UsersIcon              },
  { key: 'incidents', label: 'Incidencias',        icon: ExclamationTriangleIcon},
  { key: 'projects',  label: 'Proyectos',          icon: FolderOpenIcon         },
  { key: 'documents', label: 'Documentos',         icon: DocumentTextIcon       },
]

// â”€â”€ Tab: Datos generales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabGeneral({ pharmacy, summaries, onNavigateTab }) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const lType = pharmacy.legal_type || ''
  const hasAuto = lType.includes('autonomo')
  const hasCb   = lType.includes('cb')
  const hasSl   = lType.includes('sl')
  const sl = pharmacy.sl_data || {}
  const cbOwners = Array.isArray(pharmacy.cb_owners) ? pharmacy.cb_owners : []
  const mainSchedule = parseScheduleValue(pharmacy.schedule)
  const scheduleOptions = getScheduleOptionLabels({
    days: mainSchedule.detail?.days,
    options: mainSchedule.options,
  })
  const groupKeys = [
    hasAuto && 'autonomo',
    hasCb && 'cb',
    hasSl && 'sl',
  ].filter(Boolean)
  const scheduleMeta = getScheduleMetaItems({
    schedule: mainSchedule,
    scheduleOptions,
    hasGuards: pharmacy.has_guards,
    observations: pharmacy.observations,
  })
  const allCollapsed = groupKeys.length > 0 && groupKeys.every(key => collapsed[key])
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const matchesQuery = (...values) => (
    !normalizedQuery || values.filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalizedQuery)
  )
  const showAuto = hasAuto && matchesQuery(
    'Persona Jurídica.', pharmacy.owner_name, pharmacy.nif, pharmacy.collegiate_number, pharmacy.soe_number,
    pharmacy.contact_phone, pharmacy.contact_email, pharmacy.address, pharmacy.city, pharmacy.province,
    pharmacy.postal_code, mainSchedule.summary, scheduleOptions.join(' '), mainSchedule.guardNotes,
    pharmacy.observations
  )
  const showCb = hasCb && matchesQuery(
    'Comunidad de Bienes C.B.', pharmacy.razon_social, pharmacy.cif,
    ...cbOwners.flatMap(owner => [owner.name, owner.nif, owner.collegiate]),
    pharmacy.contact_phone, pharmacy.contact_email, pharmacy.address, pharmacy.city, pharmacy.province,
    pharmacy.postal_code, pharmacy.soe_number, mainSchedule.summary, scheduleOptions.join(' '),
    mainSchedule.guardNotes, pharmacy.observations
  )
  const showSl = hasSl && matchesQuery(
    'Sociedad Limitada S.L.', (hasAuto || hasCb) ? sl.razon_social : pharmacy.razon_social,
    (hasAuto || hasCb) ? sl.cif : pharmacy.cif, (hasAuto || hasCb) ? sl.phone : pharmacy.contact_phone,
    (hasAuto || hasCb) ? sl.email : pharmacy.contact_email, (hasAuto || hasCb) ? sl.address : pharmacy.address,
    (hasAuto || hasCb) ? sl.city : pharmacy.city, (hasAuto || hasCb) ? sl.province : pharmacy.province,
    (hasAuto || hasCb) ? sl.postal_code : pharmacy.postal_code, (hasAuto || hasCb) ? sl.observations : pharmacy.observations
  )

  function toggleAll() {
    setCollapsed(Object.fromEntries(groupKeys.map(key => [key, !allCollapsed])))
  }

  return (
    <div className="space-y-4">
      <TabToolbar query={query} onQueryChange={setQuery} placeholder="Buscar en datos generales..." onCollapseAll={toggleAll} allCollapsed={allCollapsed} />
      {showAuto && (
        <SectionBlock title="Persona Jurídica." open={!collapsed.autonomo} onToggle={() => setCollapsed(prev => ({ ...prev, autonomo: !prev.autonomo }))}>
          <InfoGroup title="Identificación" className="xl:col-span-3">
            <Field label="Titular"      value={pharmacy.owner_name} className="lg:col-span-2" />
            <Field label="NIF"          value={pharmacy.nif} />
            <Field label="Nº colegiado" value={pharmacy.collegiate_number} />
          </InfoGroup>
          <InfoGroup title="Contacto y ubicación" className="xl:col-span-6">
            <Field label="Teléfono"  value={pharmacy.contact_phone} />
            <Field label="Email"     value={pharmacy.contact_email} />
            <Field label="Dirección" value={pharmacy.address} className="lg:col-span-2" />
            <Field label="Población" value={pharmacy.city} />
            <Field label="Provincia" value={PROVINCE_LABEL[pharmacy.province] || pharmacy.province} />
            <Field label="C.P."      value={pharmacy.postal_code} />
            <Field label="SOE"       value={pharmacy.soe_number} />
          </InfoGroup>
          <InfoGroup title="Horario y notas" className="xl:col-span-3">
            <div className="col-span-full grid grid-cols-1 gap-2">
              <CompactMetaBox
                label="Horario"
                value={mainSchedule.summary || 'Sin horario configurado'}
                detailTitle="Detalle del horario"
                detailSubtitle={mainSchedule.summary || 'Sin horario configurado'}
                detailLines={scheduleMeta.detailLines}
                detailChips={scheduleMeta.chipLabels}
              />
              <div className="flex flex-wrap gap-1.5">
                <DetailChip
                  label={pharmacy.has_guards ? 'Guardias: Sí' : 'Guardias: No'}
                  detail={mainSchedule.guardNotes || 'Sin indicaciones adicionales'}
                  tone="teal"
                />
                {scheduleOptions.length > 0 && (
                  <DetailChip
                    label={`${scheduleOptions.length} aperturas`}
                    detail={scheduleOptions.join(' · ')}
                    tone="teal"
                  />
                )}
                {pharmacy.observations && (
                  <DetailChip
                    label="Observaciones"
                    detail={pharmacy.observations}
                  />
                )}
              </div>
            </div>
          </InfoGroup>
        </SectionBlock>
      )}
      {showCb && (
        <SectionBlock title="Comunidad de Bienes (C.B.)" open={!collapsed.cb} onToggle={() => setCollapsed(prev => ({ ...prev, cb: !prev.cb }))}>
          <InfoGroup title="Identificación" className="xl:col-span-3">
            <Field label="Razón social" value={pharmacy.razon_social} className="lg:col-span-2" />
            <Field label="CIF" value={pharmacy.cif} />
          </InfoGroup>
          <InfoGroup title="Titulares" className="xl:col-span-5">
            {cbOwners.length === 0 && <p className="col-span-full text-xs italic text-gray-300">Sin titulares registrados</p>}
            {cbOwners.map((owner, index) => (
              <div key={index} className="col-span-full grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 sm:grid-cols-3">
                <Field label={`Titular ${index + 1}`} value={owner.name} />
                <Field label="NIF" value={owner.nif} />
                <Field label="Colegiado" value={owner.collegiate} />
              </div>
            ))}
          </InfoGroup>
          <InfoGroup title="Contacto y ubicación" className="xl:col-span-8">
            <Field label="Teléfono"  value={pharmacy.contact_phone} />
            <Field label="Email"     value={pharmacy.contact_email} />
            <Field label="Dirección" value={pharmacy.address} className="lg:col-span-2" />
            <Field label="Población" value={pharmacy.city} />
            <Field label="Provincia" value={PROVINCE_LABEL[pharmacy.province] || pharmacy.province} />
            <Field label="C.P."      value={pharmacy.postal_code} />
            <Field label="SOE"       value={pharmacy.soe_number} />
          </InfoGroup>
          <InfoGroup title="Horario y notas" className="xl:col-span-4">
            <div className="col-span-full grid grid-cols-1 gap-2">
              <CompactMetaBox
                label="Horario"
                value={mainSchedule.summary || 'Sin horario configurado'}
                detailTitle="Detalle del horario"
                detailSubtitle={mainSchedule.summary || 'Sin horario configurado'}
                detailLines={scheduleMeta.detailLines}
                detailChips={scheduleMeta.chipLabels}
              />
              <div className="flex flex-wrap gap-1.5">
                <DetailChip
                  label={pharmacy.has_guards ? 'Guardias: Sí' : 'Guardias: No'}
                  detail={mainSchedule.guardNotes || 'Sin indicaciones adicionales'}
                  tone="teal"
                />
                {scheduleOptions.length > 0 && (
                  <DetailChip
                    label={`${scheduleOptions.length} aperturas`}
                    detail={scheduleOptions.join(' · ')}
                    tone="teal"
                  />
                )}
                {pharmacy.observations && (
                  <DetailChip
                    label="Observaciones"
                    detail={pharmacy.observations}
                  />
                )}
              </div>
            </div>
          </InfoGroup>
        </SectionBlock>
      )}
      {showSl && (
        <SectionBlock title="Sociedad Limitada (S.L.)" open={!collapsed.sl} onToggle={() => setCollapsed(prev => ({ ...prev, sl: !prev.sl }))}>
          <InfoGroup title="Identificación" className="xl:col-span-3">
            <Field label="Razón social" value={(hasAuto || hasCb) ? sl.razon_social : pharmacy.razon_social} className="lg:col-span-2" />
            <Field label="CIF" value={(hasAuto || hasCb) ? sl.cif : pharmacy.cif} />
          </InfoGroup>
          <InfoGroup title="Contacto y ubicación" className="xl:col-span-6">
            <Field label="Teléfono S.L." value={(hasAuto || hasCb) ? sl.phone : pharmacy.contact_phone} />
            <Field label="Email S.L." value={(hasAuto || hasCb) ? sl.email : pharmacy.contact_email} />
            <Field label="Dirección" value={(hasAuto || hasCb) ? sl.address : pharmacy.address} className="lg:col-span-2" />
            <Field label="Población" value={(hasAuto || hasCb) ? sl.city : pharmacy.city} />
            <Field label="Provincia" value={PROVINCE_LABEL[(hasAuto || hasCb) ? sl.province : pharmacy.province]} />
            <Field label="C.P." value={(hasAuto || hasCb) ? sl.postal_code : pharmacy.postal_code} />
          </InfoGroup>
          <InfoGroup title="Horario y notas" className="xl:col-span-3">
            <div className="col-span-full grid grid-cols-1 gap-2">
              {!hasAuto && !hasCb ? (
                <>
                  <CompactMetaBox
                    label="Horario"
                    value={mainSchedule.summary || 'Sin horario configurado'}
                    detailTitle="Detalle del horario"
                    detailSubtitle={mainSchedule.summary || 'Sin horario configurado'}
                    detailLines={scheduleMeta.detailLines}
                    detailChips={scheduleMeta.chipLabels}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <DetailChip
                      label={pharmacy.has_guards ? 'Guardias: Sí' : 'Guardias: No'}
                      detail={mainSchedule.guardNotes || 'Sin indicaciones adicionales'}
                      tone="teal"
                    />
                    {scheduleOptions.length > 0 && (
                      <DetailChip
                        label={`${scheduleOptions.length} aperturas`}
                        detail={scheduleOptions.join(' · ')}
                        tone="teal"
                      />
                    )}
                    {(hasAuto || hasCb ? sl.observations : pharmacy.observations) && (
                      <DetailChip
                        label="Observaciones"
                        detail={(hasAuto || hasCb) ? sl.observations : pharmacy.observations}
                      />
                    )}
                  </div>
                </>
              ) : (
                <CompactMetaBox
                  label="Observaciones"
                  value={(hasAuto || hasCb) ? sl.observations : pharmacy.observations}
                  detailTitle="Observaciones"
                  detailSubtitle={(hasAuto || hasCb) ? sl.observations : pharmacy.observations}
                />
              )}
            </div>
          </InfoGroup>
        </SectionBlock>
      )}
      {!showAuto && !showCb && !showSl && <EmptyTab icon={BuildingStorefrontIcon} message="Sin resultados en datos generales" />}
      <div className="flex items-end justify-between gap-3 pt-1">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Resumen operativo</h2>
          <p className="mt-0.5 text-xs text-slate-400">Accesos directos a la información relacionada con la farmacia.</p>
        </div>
      </div>
      <div className="grid auto-rows-fr gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MapSummaryCard
          title="Mapa"
          value={summaries.map}
          detail="Abrir ubicación →"
          onClick={() => {
            if (!summaries.hasMapLocation) return
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(summaries.map)}`, '_blank', 'noopener,noreferrer')
          }}
          className="sm:col-span-2 xl:col-span-2"
        />
        <SummaryCard
          title="Personas"
          value={`${summaries.people.count} personas`}
          meta={`${summaries.people.responsibleCount} responsables`}
          detail={summaries.people.preview}
          items={summaries.people.items}
          icon={UsersIcon}
          onClick={() => onNavigateTab('people')}
        />
        <SummaryCard
          title="Equipamiento"
          value={`${summaries.equipment.count} productos activos`}
          meta={`${summaries.equipment.vitekaCount} gestionados por Viteka`}
          detail={summaries.equipment.detail}
          items={summaries.equipment.items}
          icon={WrenchScrewdriverIcon}
          onClick={() => onNavigateTab('equipment')}
        />
        <SummaryCard
          title="Equipos informáticos"
          value={`${summaries.it.count} equipos`}
          meta={`${summaries.it.typeCount} tipos registrados`}
          detail={summaries.it.detail}
          items={summaries.it.items}
          icon={ComputerDesktopIcon}
          onClick={() => onNavigateTab('it')}
        />
        <SummaryCard
          title="Proyectos"
          value="Sin registros"
          detail="No hay proyectos asociados"
          icon={FolderOpenIcon}
          onClick={() => onNavigateTab('projects')}
          accent="slate"
        />
        <SummaryCard
          title="Incidencias"
          value="Sin registros"
          detail="No hay incidencias asociadas"
          icon={ExclamationTriangleIcon}
          onClick={() => onNavigateTab('incidents')}
          accent="slate"
        />
        <SummaryCard
          title="Documentos"
          value={`${summaries.documents.count} documentos`}
          meta={`${summaries.documents.categoryCount} categorías`}
          detail={summaries.documents.detail}
          items={summaries.documents.items}
          icon={DocumentTextIcon}
          onClick={() => onNavigateTab('documents')}
        />
        <ActivitySummaryCard pharmacy={pharmacy} summary={summaries} />
      </div>
    </div>
  )
}

// â”€â”€ Tab: Equipamiento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabEquipment({ equipment }) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  if (!equipment) return <EmptyTab icon={WrenchScrewdriverIcon} message="Sin equipamiento registrado" />
  return (
    <div className="space-y-4">
      <TabToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar en equipamiento..."
        onCollapseAll={() => setCollapsed(prev => !prev)}
        allCollapsed={collapsed}
      />
      <CollapsibleGroup title="Equipamiento registrado" open={!collapsed} onToggle={() => setCollapsed(prev => !prev)}>
        <EquipmentSummaryTable equipment={equipment} searchQuery={query} />
      </CollapsibleGroup>
    </div>
  )
}

function ActivitySummaryCard({ pharmacy, summary }) {
  return (
    <div
      title={summary.lastActionTooltip}
      className="flex min-h-[96px] flex-col justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:col-span-2 xl:col-span-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Actividad</p>
          <p className="mt-0.5 text-[13px] font-semibold leading-snug text-slate-900">{summary.lastChangeDetail}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-teal-700 ring-1 ring-inset ring-slate-100">
          <ClockIcon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>Creación: <strong className="font-semibold text-slate-700">{formatDateTime(pharmacy.created_at)}</strong></span>
        <span>Modificación: <strong className="font-semibold text-slate-700">{formatDateTime(pharmacy.updated_at)}</strong></span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{summary.lastActionText}</p>
    </div>
  )
}

function PlaceholderTab({ icon, message, placeholder, title }) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="space-y-4">
      <TabToolbar query={query} onQueryChange={setQuery} placeholder={placeholder} onCollapseAll={() => setCollapsed(prev => !prev)} allCollapsed={collapsed} />
      <CollapsibleGroup title={title} open={!collapsed} onToggle={() => setCollapsed(prev => !prev)}>
        <EmptyTab icon={icon} message={message} />
      </CollapsibleGroup>
    </div>
  )
}

// â”€â”€ Tab: Equipamiento Informático â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    <span className="inline-flex max-w-full items-center overflow-hidden px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
      <span className="truncate">{children}</span>
    </span>
  )
}

function getDevicePhotos(device) {
  return Array.isArray(device?.specs?.photos) ? device.specs.photos.filter(Boolean) : []
}

async function getPrivateDevicePhotoUrl(photo) {
  if (!photo?.storage_path) throw new Error('Imagen sin ruta de almacenamiento')

  const { data, error } = await supabase.storage
    .from(DEVICE_PHOTO_BUCKET)
    .download(photo.storage_path)

  if (error) throw error
  return URL.createObjectURL(data)
}

function stripDevicePhotos(device) {
  const specs = { ...(device?.specs || {}) }
  delete specs.photos
  return { ...device, specs }
}

function removeITDeviceRuntimeFields(device) {
  const payload = { ...(device || {}) }
  delete payload.id
  delete payload.created_at
  delete payload.updated_at
  delete payload.brand
  delete payload.model
  delete payload._deleted_photo_paths
  return payload
}

function safeStorageName(name = 'imagen.jpg') {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'imagen.jpg'
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// â”€â”€ Modal base con guard de cambios sin guardar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleClose() {
    if (isDirty) setShowConfirm(true)
    else onRequestClose()
  }

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
      <div
        className="relative w-full sm:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-modal-title"
      >
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

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>
      </div>

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

// â”€â”€ Card Grid (vista âŠž) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ITDeviceCard({ device, onOpen, onDelete, onDuplicate }) {
  const { marca, modelo } = resolveBrand(device)
  const chips    = buildChips(device)
  const fInst    = fmtDate(device.install_date)
  const fGar     = fmtDate(device.warranty_end)
  const now      = new Date()
  const warExpired = device.warranty_end && new Date(device.warranty_end) < now
  const warOk     = device.warranty_end && !warExpired

  return (
    <div
      className="group relative flex h-full flex-col gap-3 overflow-hidden p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer"
      onClick={() => onOpen(device)}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen(device)}
    >
      {/* Banda superior de color */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${device.is_viteka ? 'bg-teal-400' : 'bg-slate-200'}`} />

      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest truncate">
            {IT_LABEL[device.device_type] || 'Equipo'}
          </span>
          <span className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-teal-700 transition-colors truncate">
            {device.label || IT_LABEL[device.device_type] || 'Equipo'}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {device.is_viteka && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-100 text-teal-700">Viteka</span>
          )}
          {warOk && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">
              <ShieldCheckIcon className="w-3 h-3" />
            </span>
          )}
          {warExpired && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-500">
              <ShieldCheckIcon className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Chips de specs */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.slice(0, 4).map((c, i) => <Chip key={i}>{c}</Chip>)}
        </div>
      )}

      {/* Marca / modelo */}
      {(marca || modelo) && (
        <p className="text-xs text-gray-400 truncate">{[marca, modelo].filter(Boolean).join(' · ')}</p>
      )}

      {/* Pie: fechas + acciones */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
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
          {!fInst && !fGar && (
            <span className="text-[11px] text-gray-300">Sin fechas</span>
          )}
        </div>

        <div
          className="flex items-center gap-1 shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onDuplicate(device)}
            title="Duplicar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors"
          >
            <DocumentDuplicateIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(device)}
            title="Eliminar"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Fila de dispositivo (vista â‰¡) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      <span className={`mt-[7px] shrink-0 w-2 h-2 rounded-full transition-all ${
        device.is_viteka ? 'bg-teal-400' : 'bg-gray-300'
      }`} />

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

      <div
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
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

// â”€â”€ Bloque colapsable por tipo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ITTypeBlock({ typeKey, devices, isOpen, onToggle, onOpen, onDelete, onDuplicate, onAddSameType, viewMode }) {
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
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {devices.map(d => (
              <ITDeviceCard
                key={d.id}
                device={d}
                onOpen={onOpen}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </section>
  )
}

// â”€â”€ Hook: persistencia localStorage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // localStorage may be unavailable in private or restricted browser contexts.
    }
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

// â”€â”€ Formulario de equipo (dentro del modal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DevicePhotoModal({ photo, onClose }) {
  const [photoUrl, setPhotoUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''

    getPrivateDevicePhotoUrl(photo)
      .then(url => {
        objectUrl = url
        if (active) setPhotoUrl(url)
      })
      .catch(err => {
        if (active) setError(err.message || 'No se pudo cargar la imagen')
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photo])

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{photo.caption || photo.file_name || 'Imagen del equipo'}</p>
            <p className="mt-0.5 text-xs text-slate-400">Visualización protegida para usuarios autenticados</p>
          </div>
          <button type="button" onClick={onClose} title="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-[55vh] items-center justify-center overflow-auto bg-slate-100 p-4">
          {!photoUrl && !error && <p className="text-sm text-slate-400">Cargando imagen protegida...</p>}
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {photoUrl && <img src={photoUrl} alt={photo.caption || photo.file_name || 'Imagen del equipo'} className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-sm" />}
        </div>
      </div>
    </div>
  )
}

function DevicePhotosEditor({ form, setForm, pharmacyId, companyId }) {
  const fileRef = useRef(null)
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const photos = getDevicePhotos(form)
  const canUpload = !!form.id

  function setPhotos(nextPhotos) {
    setForm(prev => ({ ...prev, specs: { ...(prev.specs || {}), photos: nextPhotos } }))
  }

  async function handleUpload(file) {
    if (!file || !canUpload || uploading) return
    if (!file.type?.startsWith('image/')) {
      toast('Selecciona una imagen', 'error')
      return
    }

    setUploading(true)
    try {
      const fileName = safeStorageName(file.name)
      const uploadedAt = new Date().toISOString()
      const uniqueStamp = uploadedAt.replace(/\D/g, '')
      const path = `${companyId}/${pharmacyId}/it-devices/${form.id}/${uniqueStamp}_${fileName}`
      const { error: uploadError } = await supabase.storage
        .from(DEVICE_PHOTO_BUCKET)
        .upload(path, file, { upsert: false })
      if (uploadError) throw uploadError

      setPhotos([
        ...photos,
        {
          id: `${uniqueStamp}-${fileName}`,
          file_name: file.name,
          file_type: file.type,
          size_bytes: file.size,
          storage_path: path,
          caption: '',
          created_at: uploadedAt,
        },
      ])
      toast('Imagen añadida. Guarda cambios para vincularla al equipo.', 'success')
    } catch (err) {
      toast(err.message || 'No se pudo subir la imagen', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function updateCaption(photoId, caption) {
    setPhotos(photos.map(photo => photo.id === photoId ? { ...photo, caption } : photo))
  }

  function removePhoto(photo) {
    setForm(prev => {
      const nextPhotos = getDevicePhotos(prev).filter(item => item.id !== photo.id)
      const deletedPaths = photo.storage_path
        ? [...new Set([...(prev._deleted_photo_paths || []), photo.storage_path])]
        : (prev._deleted_photo_paths || [])
      return {
        ...prev,
        _deleted_photo_paths: deletedPaths,
        specs: { ...(prev.specs || {}), photos: nextPhotos },
      }
    })
    toast('Imagen marcada para eliminar. Guarda cambios para actualizar la ficha.', 'success')
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700">Imágenes del equipo y puesto</h3>
          <p className="mt-1 text-xs text-gray-400">Fotos del equipo, número visible, conexiones o ubicación del puesto.</p>
        </div>
        <label className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
          canUpload
            ? 'cursor-pointer bg-teal-600 text-white hover:bg-teal-700'
            : 'cursor-not-allowed bg-gray-100 text-gray-400'
        }`}>
          <PhotoIcon className="w-4 h-4" />
          {uploading ? 'Subiendo...' : 'Añadir imagen'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={!canUpload || uploading}
            onChange={e => handleUpload(e.target.files?.[0])}
          />
        </label>
      </div>

      {!canUpload && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Primero guarda el equipo. Después podrás adjuntar imágenes.
        </p>
      )}

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-gray-400">
          Sin imágenes adjuntas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {photos.map(photo => (
            <div key={photo.id || photo.storage_path} className="rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="flex w-full items-center justify-center gap-2 border-b border-slate-200 bg-white px-3 py-5 text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                <EyeIcon className="h-4 w-4" />
                Ver imagen protegida
              </button>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-700">{photo.file_name || 'Imagen'}</p>
                    <p className="text-[11px] text-gray-400">{formatBytes(photo.size_bytes)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Eliminar imagen"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  value={photo.caption || ''}
                  onChange={e => updateCaption(photo.id, e.target.value)}
                  placeholder="Puesto, características visibles o ubicación"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && <DevicePhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
    </section>
  )
}

function DevicePhotosReadOnly({ photos }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  if (!photos.length) return null
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-teal-700">Imágenes del equipo y puesto</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {photos.map(photo => (
          <button
            type="button"
            key={photo.id || photo.storage_path}
            onClick={() => setSelectedPhoto(photo)}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-center gap-2 bg-slate-50 px-3 py-6 text-sm font-medium text-teal-700">
              <EyeIcon className="h-4 w-4" />
              Ver imagen protegida
            </div>
            <div className="border-t border-slate-100 p-3 text-left">
              <p className="truncate text-xs font-semibold text-gray-700">{photo.caption || photo.file_name || 'Imagen'}</p>
              {photo.caption && <p className="mt-1 truncate text-[11px] text-gray-400">{photo.file_name}</p>}
            </div>
          </button>
        ))}
      </div>
      {selectedPhoto && <DevicePhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />}
    </section>
  )
}

function ITDeviceFormInner({ form, setForm, pharmacyId, companyId }) {
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
              <Select value={form.specs.card_reader || 'NO'} onChange={e => setSpec('card_reader', e.target.value === 'NO' ? 'NO' : { modelo: '', ano: '' })}>
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

      {form.device_type === 'sai' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><Label>Capacidad</Label><Input value={form.specs.capacity || ''} onChange={e => setSpec('capacity', e.target.value)} placeholder="600 VA" /></div>
          <div><Label>Año</Label><Input type="number" value={form.specs.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
          <div className="col-span-2"><Label>Equipo vinculado</Label><Input value={form.specs.linked || ''} onChange={e => setSpec('linked', e.target.value)} /></div>
        </div>
      )}

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

      <DevicePhotosEditor
        form={form}
        setForm={setForm}
        pharmacyId={pharmacyId}
        companyId={companyId}
      />

      <div>
        <Label>Observaciones</Label>
        <Textarea rows={3} value={form.observations || ''} onChange={e => set('observations', e.target.value)} placeholder="Notas adicionales..." />
      </div>
    </div>
  )
}

// â”€â”€ Vistas de solo lectura â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const photos = getDevicePhotos(device)

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
                  ? [s.card_reader.modelo, s.card_reader.ano].filter(Boolean).join(' · ')
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

      <DevicePhotosReadOnly photos={photos} />

      <ReadOnlySection title="Observaciones">
        <ReadOnlyField label="Notas adicionales" value={device.observations} wide />
      </ReadOnlySection>
    </div>
  )
}

// â”€â”€ Modal unificado: ver / editar equipo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    ? `Nuevo equipo - ${IT_LABEL[form.device_type] || ''}`
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
        <ITDeviceFormInner form={form} setForm={setForm} pharmacyId={pharmacyId} companyId={companyId} />
      )}

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

// â”€â”€ Modal: Copiar equipos de otra farmacia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                  <option key={p.id} value={p.id}>{p.pharmacy_name}{p.city ? ` - ${p.city}` : ''}</option>
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
                          {(marca || modelo) && <p className="text-xs text-gray-400">{marca}{modelo ? ` - ${modelo}` : ''}</p>}
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

// â”€â”€ Constante umbral auto-switch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AUTO_LIST_THRESHOLD = 6

// â”€â”€ TabIT principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabIT({ pharmacyId, companyId, initialAction, onActionHandled }) {
  const { devices, loading, createDevice, updateDevice, deleteDevice } = usePharmacyIT(pharmacyId)
  const toast = useToast()

  const [modalDevice, setModalDevice] = useState(null)
  const [confirmDel, setConfirmDel]   = useState(null)
  const [deletingId, setDeletingId]   = useState(null)
  const [showCopy, setShowCopy]       = useState(false)
  const [search, setSearch]           = useState('')
  const [draftType, setDraftType]     = useState('servidor')
  const [openGroups, setOpenGroups]   = useLocalStorageState(`pharmacy-it-open-${pharmacyId}`, {})
  // null = automático (grid si <=6, lista si >6); 'grid' | 'list' = forzado por usuario
  const [viewOverride, setViewOverride] = useLocalStorageState(`pharmacy-it-view-${pharmacyId}`, null)

  const totalDevices = (devices || []).length

  // Vista efectiva: si el usuario forzó, se respeta; si no, auto
  const effectiveView = viewOverride ?? (totalDevices > AUTO_LIST_THRESHOLD ? 'list' : 'grid')

  function openDevice(device) {
    setModalDevice({ ...device, specs: { ...device.specs, ...resolveBrand(device) } })
  }

  function openNewForm(type = 'servidor') {
    setDraftType(type)
    setModalDevice(createEmptyITDevice(type))
  }

  useEffect(() => {
    if (initialAction !== 'new-it') return
    openNewForm(draftType)
    onActionHandled?.()
  }, [initialAction])

  function closeModal() {
    setModalDevice(null)
  }

  async function handleSave(form) {
    const deletedPhotoPaths = Array.isArray(form._deleted_photo_paths)
      ? [...new Set(form._deleted_photo_paths.filter(Boolean))]
      : []
    const rest = removeITDeviceRuntimeFields(form)
    const payload = { ...rest, pharmacy_id: pharmacyId, company_id: companyId }
    if (form.id) {
      await updateDevice(form.id, payload)
      toast('Equipo actualizado', 'success')
    } else {
      await createDevice(payload)
      toast('Equipo creado', 'success')
    }
    if (deletedPhotoPaths.length > 0) {
      const { error } = await supabase.storage.from(DEVICE_PHOTO_BUCKET).remove(deletedPhotoPaths)
      if (error) toast('Ficha guardada, pero no se pudieron retirar algunas imágenes del almacenamiento', 'error')
    }
    closeModal()
  }

  async function handleDuplicate(device) {
    const rest = removeITDeviceRuntimeFields(device)
    const cleanDevice = stripDevicePhotos(rest)
    const payload = {
      ...cleanDevice,
      label: cleanDevice.label ? `${cleanDevice.label} (copia)` : 'Copia',
      pharmacy_id: pharmacyId,
      company_id: companyId,
    }
    await createDevice(payload)
    toast('Equipo duplicado', 'success')
  }

  async function handleCopyDevices(toCopy) {
    for (const d of toCopy) {
      const rest = removeITDeviceRuntimeFields(d)
      await createDevice({ ...stripDevicePhotos(rest), pharmacy_id: pharmacyId, company_id: companyId })
    }
    toast(`${toCopy.length} equipo${toCopy.length !== 1 ? 's' : ''} copiado${toCopy.length !== 1 ? 's' : ''}`, 'success')
  }

  async function handleDelete(device) {
    setDeletingId(device.id)
    try {
      const photoPaths = getDevicePhotos(device)
        .map(photo => photo.storage_path)
        .filter(Boolean)

      await deleteDevice(device.id)
      let storageWarning = false
      if (photoPaths.length > 0) {
        const { error } = await supabase.storage.from(DEVICE_PHOTO_BUCKET).remove(photoPaths)
        storageWarning = Boolean(error)
      }
      toast(
        storageWarning
          ? 'Equipo eliminado, pero no se pudieron retirar algunas imágenes del almacenamiento'
          : 'Equipo eliminado',
        storageWarning ? 'error' : 'success'
      )
      setConfirmDel(null)
    } catch {
      toast('Error al eliminar el equipo', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  function toggleGroup(key) {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const filtered = (devices || []).filter(d => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const { marca, modelo } = resolveBrand(d)
    return (
      (d.label || '').toLowerCase().includes(q) ||
      (IT_LABEL[d.device_type] || '').toLowerCase().includes(q) ||
      marca.toLowerCase().includes(q) ||
      modelo.toLowerCase().includes(q) ||
      (d.serial_number || '').toLowerCase().includes(q)
    )
  })

  const grouped = IT_TYPES.reduce((acc, t) => {
    const list = filtered.filter(d => d.device_type === t.value)
    if (list.length > 0) acc[t.value] = list
    return acc
  }, {})
  const visibleGroupKeys = Object.keys(grouped)
  const allGroupsCollapsed = visibleGroupKeys.length > 0 && visibleGroupKeys.every(key => openGroups[key] === false)

  function toggleAllGroups() {
    setOpenGroups(prev => ({
      ...prev,
      ...Object.fromEntries(visibleGroupKeys.map(key => [key, allGroupsCollapsed])),
    }))
  }

  const vitekaDevices = (devices || []).filter(d => d.is_viteka).length

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cabecera con stats y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {totalDevices > 0 && (
            <>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {totalDevices} equipo{totalDevices !== 1 ? 's' : ''}
              </span>
              {vitekaDevices > 0 && (
                <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                  {vitekaDevices} Viteka
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* Toggle de vista âŠž / â‰¡ */}
          {totalDevices > 0 && (
            <div className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white overflow-hidden sm:w-auto">
              <button
                type="button"
                onClick={() => setViewOverride('grid')}
                title="Vista tarjetas"
                className={`p-2 transition-colors ${
                  effectiveView === 'grid'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewOverride('list')}
                title="Vista lista"
                className={`p-2 transition-colors ${
                  effectiveView === 'list'
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCopy(true)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors sm:w-auto"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            <span className="sm:hidden">Copiar</span>
            <span className="hidden sm:inline">Copiar de otra farmacia</span>
          </button>
          <button
            type="button"
            onClick={() => openNewForm(draftType)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors sm:w-auto"
          >
            <PlusIcon className="w-4 h-4" />
            Añadir equipo
          </button>
        </div>
      </div>

      <TabToolbar
        query={search}
        onQueryChange={setSearch}
        placeholder="Buscar equipo informático..."
        onCollapseAll={toggleAllGroups}
        allCollapsed={allGroupsCollapsed}
      />

      {/* Lista agrupada */}
      {Object.keys(grouped).length === 0 ? (
        <EmptyTab icon={ComputerDesktopIcon} message={search ? 'Sin resultados para esa búsqueda' : 'Sin equipos informáticos registrados'} />
      ) : (
        <div>
          {IT_TYPES.filter(t => grouped[t.value]).map(t => (
            <ITTypeBlock
              key={t.value}
              typeKey={t.value}
              devices={grouped[t.value]}
              isOpen={openGroups[t.value] !== false}
              onToggle={() => toggleGroup(t.value)}
              onOpen={openDevice}
              onDelete={d => setConfirmDel(d)}
              onDuplicate={handleDuplicate}
              onAddSameType={openNewForm}
              viewMode={effectiveView}
            />
          ))}
        </div>
      )}

      {/* Modal equipo */}
      {modalDevice !== null && (
        <ITDeviceModal
          device={modalDevice}
          pharmacyId={pharmacyId}
          companyId={companyId}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* Modal copiar */}
      {showCopy && (
        <CopyFromPharmacyModal
          currentPharmacyId={pharmacyId}
          companyId={companyId}
          onCopy={handleCopyDevices}
          onClose={() => setShowCopy(false)}
        />
      )}

      {/* Confirmar borrado */}
      {confirmDel && (
        <ConfirmDialog
          title="Eliminar equipo"
          message={`¿Seguro que quieres eliminar "${confirmDel.label || IT_LABEL[confirmDel.device_type] || 'este equipo'}"? Esta acción no se puede deshacer.`}
          confirmLabel={deletingId === confirmDel.id ? 'Eliminando...' : 'Eliminar'}
          variant="danger"
          disabled={deletingId === confirmDel.id}
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

// â”€â”€ Tab: Personas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabPeople({ pharmacyId, companyId, pharmacy, initialAction, initialPersonId, onActionHandled }) {
  const { persons, loading, createPerson, updatePerson, deletePerson, reload } = usePharmacyPersons(pharmacyId)
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewMode, setViewMode] = useLocalStorageState(`pharmacy-people-view-${pharmacyId}`, 'cards')
  const [query, setQuery] = useState('')
  const [openGroups, setOpenGroups] = useLocalStorageState(`pharmacy-people-open-${pharmacyId}`, {})

  const empty = {
    name: '',
    role: '',
    phone: '',
    email: '',
    nixfarma_operator: '',
    seniority_month: '',
    seniority_year: '',
    is_responsible: false,
    responsible_priority: '1',
    areas: [],
    custom_area: '',
    observations: '',
  }

  function parsePersonObservations(observations = '') {
    const raw = String(observations || '')
    const prefix = '__VITEKA_PERSON_META__:'
    if (raw.startsWith('__VITEKA_AUTO_OWNER__:')) return {
      notes: '',
      responsiblePriority: '',
      nixfarmaOperator: '',
      seniorityMonth: '',
      seniorityYear: '',
    }
    if (!raw.startsWith(prefix)) return {
      notes: raw,
      responsiblePriority: '',
      nixfarmaOperator: '',
      seniorityMonth: '',
      seniorityYear: '',
    }

    const newlineIndex = raw.indexOf('\n')
    const metaRaw = newlineIndex === -1 ? raw.slice(prefix.length) : raw.slice(prefix.length, newlineIndex)
    const notes = newlineIndex === -1 ? '' : raw.slice(newlineIndex + 1)

    try {
      const meta = JSON.parse(metaRaw)
      return {
        notes,
        responsiblePriority: String(meta?.responsiblePriority || ''),
        nixfarmaOperator: String(meta?.nixfarmaOperator || ''),
        seniorityMonth: String(meta?.seniorityMonth || ''),
        seniorityYear: String(meta?.seniorityYear || ''),
      }
    } catch {
      return {
        notes: raw,
        responsiblePriority: '',
        nixfarmaOperator: '',
        seniorityMonth: '',
        seniorityYear: '',
      }
    }
  }

  function serializePersonObservations(notes = '', personMeta = {}) {
    const cleanNotes = String(notes || '').trim()
    const meta = {
      responsiblePriority: String(personMeta.responsiblePriority || '').trim(),
      nixfarmaOperator: String(personMeta.nixfarmaOperator || '').trim(),
      seniorityMonth: String(personMeta.seniorityMonth || '').trim(),
      seniorityYear: String(personMeta.seniorityYear || '').trim(),
    }

    if (!Object.values(meta).some(Boolean)) return cleanNotes

    const serializedMeta = '__VITEKA_PERSON_META__:' + JSON.stringify(meta)
    return cleanNotes ? `${serializedMeta}\n${cleanNotes}` : serializedMeta
  }

  function normalizePersonForm(personLike) {
    const parsed = parsePersonObservations(personLike?.observations)
    return {
      ...empty,
      ...personLike,
      is_responsible: Boolean(personLike?.is_responsible),
      responsible_priority: parsed.responsiblePriority || personLike?.responsible_priority || '1',
      nixfarma_operator: parsed.nixfarmaOperator || personLike?.nixfarma_operator || '',
      seniority_month: parsed.seniorityMonth || personLike?.seniority_month || '',
      seniority_year: parsed.seniorityYear || personLike?.seniority_year || '',
      areas: Array.isArray(personLike?.areas) ? personLike.areas : [],
      custom_area: personLike?.custom_area || '',
      observations: parsed.notes,
    }
  }

  async function handleSave(form) {
    const payload = {
      name: form.name?.trim(),
      role: form.role || 'Titular',
      phone: form.phone || '',
      email: form.email || '',
      is_responsible: Boolean(form.is_responsible),
      areas: Array.isArray(form.areas) ? form.areas : [],
      custom_area: form.areas?.includes('Categoría') ? (form.custom_area || '').trim() : '',
      observations: serializePersonObservations(form.observations, {
        responsiblePriority: form.is_responsible ? form.responsible_priority : '',
        nixfarmaOperator: form.nixfarma_operator,
        seniorityMonth: form.seniority_month,
        seniorityYear: form.seniority_year,
      }),
    }

    if (form.id) {
      await updatePerson(form.id, payload)
      toast('Persona actualizada', 'success')
    } else {
      await createPerson({ ...payload, pharmacy_id: pharmacyId, company_id: companyId })
      toast('Persona añadida', 'success')
    }
    setEditing(null)
  }

  async function handleDelete(person) {
    setDeletingId(person.id)
    try {
      await deletePerson(person.id)
      toast('Persona eliminada', 'success')
      setConfirmDel(null)
    } catch {
      toast('Error al eliminar la persona', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (initialAction !== 'new-person') return
    setEditing(normalizePersonForm(empty))
    onActionHandled?.()
  }, [initialAction])

  useEffect(() => {
    if (initialAction !== 'edit-person') return
    if (!initialPersonId) return
    if (!persons || persons.length === 0) return

    const targetPerson = persons.find(person => person.id === initialPersonId)
    if (!targetPerson) return

    setEditing(normalizePersonForm(targetPerson))
    onActionHandled?.()
  }, [initialAction, initialPersonId, persons])

  useEffect(() => {
    let cancelled = false
    syncPharmacyOwnersAsPersons({
      pharmacyId,
      companyId,
      ownerName: pharmacy?.owner_name,
      cbOwners: pharmacy?.cb_owners,
      phone: pharmacy?.contact_phone,
      email: pharmacy?.contact_email,
    })
      .then(() => {
        if (!cancelled) reload()
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [
    pharmacyId, companyId, pharmacy?.owner_name, pharmacy?.cb_owners,
    pharmacy?.contact_phone, pharmacy?.contact_email, reload,
  ])

  const filteredPersons = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    if (!normalizedQuery) return persons || []
    return (persons || []).filter(person => {
      const parsed = parsePersonObservations(person.observations)
      return [
        person.name, person.role, person.phone, person.email, person.custom_area,
        ...(Array.isArray(person.areas) ? person.areas : []),
        parsed.notes, parsed.nixfarmaOperator, parsed.seniorityMonth, parsed.seniorityYear,
      ].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalizedQuery)
    })
  }, [persons, query])

  const groupedPersons = useMemo(() => {
    return filteredPersons.reduce((groups, person) => {
      const role = person.role || 'Sin rol'
      if (!groups[role]) groups[role] = []
      groups[role].push(person)
      return groups
    }, {})
  }, [filteredPersons])

  const roleOrder = useMemo(() => {
    const existingRoles = Object.keys(groupedPersons)
    return [
      ...PERSON_ROLES.filter(role => existingRoles.includes(role)),
      ...existingRoles.filter(role => !PERSON_ROLES.includes(role)).sort((a, b) => a.localeCompare(b, 'es')),
    ]
  }, [groupedPersons])
  const allGroupsCollapsed = roleOrder.length > 0 && roleOrder.every(role => openGroups[role] === false)

  function toggleAllGroups() {
    setOpenGroups(prev => ({
      ...prev,
      ...Object.fromEntries(roleOrder.map(role => [role, allGroupsCollapsed])),
    }))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <TabToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar persona, rol, teléfono o email..."
        onCollapseAll={toggleAllGroups}
        allCollapsed={allGroupsCollapsed}
      >
        <div className="flex items-center rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Vista tarjetas"
            className={`rounded-l-lg p-2 ${viewMode === 'cards' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-teal-700'}`}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Vista lista"
            className={`rounded-r-lg p-2 ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-teal-700'}`}
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setEditing(normalizePersonForm(empty))}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" /> Añadir persona
        </button>
      </TabToolbar>

      {(!persons || persons.length === 0) ? (
        <EmptyTab icon={UsersIcon} message="Sin personas registradas" />
      ) : filteredPersons.length === 0 ? (
        <EmptyTab icon={UsersIcon} message="Sin personas con esos filtros" />
      ) : (
        <div className="space-y-5">
          {roleOrder.map(role => (
            <CollapsibleGroup
              key={role}
              title={role}
              count={groupedPersons[role].length}
              open={openGroups[role] !== false}
              onToggle={() => setOpenGroups(prev => ({ ...prev, [role]: prev[role] === false }))}
            >
              <div className={viewMode === 'cards' ? 'grid grid-cols-1 gap-2 lg:grid-cols-2' : 'space-y-2'}>
                {groupedPersons[role].map(p => {
                  const parsed = parsePersonObservations(p.observations)
                  const seniority = [parsed.seniorityMonth, parsed.seniorityYear].filter(Boolean).join(' / ')
                  return (
                    <div key={p.id} className={`flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors sm:flex-row ${viewMode === 'cards' ? 'items-start p-4' : 'items-start px-4 py-3 sm:items-center'}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                          {p.is_responsible && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700">
                              Responsable{parsed.responsiblePriority ? ` #${parsed.responsiblePriority}` : ''}
                            </span>
                          )}
                        </div>
                        {parsed.nixfarmaOperator && <p className="mt-1 text-xs font-medium text-sky-700">Operador Nixfarma: {parsed.nixfarmaOperator}</p>}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {p.phone && <span className="text-xs text-gray-500">{p.phone}</span>}
                          {p.email && <span className="text-xs text-gray-500">{p.email}</span>}
                          {seniority && <span className="text-xs text-gray-400">Desde {seniority}</span>}
                        </div>
                        {viewMode === 'cards' && Array.isArray(p.areas) && p.areas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.areas.map(a => (
                              <span key={a} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600">{a}</span>
                            ))}
                          </div>
                        )}
                        {viewMode === 'cards' && parsed.notes && <p className="text-xs text-gray-400 mt-1">{parsed.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" title="Editar persona" onClick={() => setEditing(normalizePersonForm(p))} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button type="button" title="Eliminar persona" onClick={() => setConfirmDel(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CollapsibleGroup>
          ))}
        </div>
      )}

      {editing !== null && (
        <PersonModal person={editing} pharmacy={pharmacy} onSave={handleSave} onClose={() => setEditing(null)} />
      )}

      {confirmDel && (
        <ConfirmDialog
          title="Eliminar persona"
          message={`¿Seguro que quieres eliminar a \"${confirmDel.name}\"?`}
          confirmLabel={deletingId === confirmDel.id ? 'Eliminando...' : 'Eliminar'}
          variant="danger"
          disabled={deletingId === confirmDel.id}
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

function PersonModal({ person, pharmacy, onSave, onClose }) {
  const [form, setForm] = useState(person)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function toggleArea(area) {
    const current = form.areas || []
    set('areas', current.includes(area) ? current.filter(a => a !== area) : [...current, area])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{person.id ? 'Editar persona' : 'Nueva persona'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-132px)] overflow-y-auto p-5 space-y-3">
          <div><Label required>Nombre</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
          <div><Label>Operador Nixfarma</Label><Input value={form.nixfarma_operator || ''} onChange={e => set('nixfarma_operator', e.target.value)} placeholder="Nombre del operador" /></div>
          <div>
            <Label>Rol</Label>
            <Select value={form.role || ''} onChange={e => set('role', e.target.value)}>
              <option value="">Sin rol</option>
              {PERSON_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label>Teléfono</Label>
                {pharmacy?.contact_phone && (
                  <button type="button" onClick={() => set('phone', pharmacy.contact_phone)} className="mb-1 text-[11px] font-medium text-teal-700 hover:text-teal-900">
                    Usar farmacia
                  </button>
                )}
              </div>
              <Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label>Email</Label>
                {pharmacy?.contact_email && (
                  <button type="button" onClick={() => set('email', pharmacy.contact_email)} className="mb-1 text-[11px] font-medium text-teal-700 hover:text-teal-900">
                    Usar farmacia
                  </button>
                )}
              </div>
              <Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Antigüedad</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.seniority_month || ''} onChange={e => set('seniority_month', e.target.value)}>
                <option value="">Mes de inicio</option>
                {MONTHS.map((month, index) => <option key={month} value={String(index + 1)}>{month}</option>)}
              </Select>
              <Select value={form.seniority_year || ''} onChange={e => set('seniority_year', e.target.value)}>
                <option value="">Año de inicio</option>
                {YEARS.map(year => <option key={year} value={String(year)}>{year}</option>)}
              </Select>
            </div>
          </div>
          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form.is_responsible)}
                onChange={e => set('is_responsible', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              Es responsable de la farmacia
            </label>

            {form.is_responsible && (
              <div>
                <Label>Prioridad de responsable</Label>
                <Select value={form.responsible_priority || '1'} onChange={e => set('responsible_priority', e.target.value)}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={String(n)}>
                      {n} - {n === 1 ? '1er responsable' : n === 2 ? '2º responsable' : n === 3 ? '3er responsable' : n === 4 ? '4º responsable' : '5º responsable'}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label>Áreas de responsabilidad</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {RESPONSIBILITY_AREAS.map(a => (
                <button
                  key={a} type="button"
                  onClick={() => toggleArea(a)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    (form.areas || []).includes(a)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Observaciones</Label><Textarea rows={2} value={form.observations || ''} onChange={e => set('observations', e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="button" onClick={() => onSave(form)} disabled={!form.name?.trim()}
            className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-40">
            {person.id ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getDocumentName(doc) {
  return doc?.name || doc?.file_name || 'Documento'
}

function getDocumentExt(doc) {
  const nameExt = getDocumentName(doc).split('.').pop()
  return String(doc?.file_ext || nameExt || '').replace(/^\./, '').toUpperCase()
}

function canPreviewInline(doc) {
  const ext = getDocumentExt(doc).toLowerCase()
  return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'txt', 'csv', 'md', 'json'].includes(ext)
}

// â”€â”€ Tab: Documentos// â”€â”€ Tab: Documentos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function TabDocuments({ pharmacyId, companyId }) {
  const {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    reload,
  } = usePharmacyDocuments(pharmacyId)
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewLoadingId, setPreviewLoadingId] = useState(null)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [viewMode, setViewMode] = useLocalStorageState(`pharmacy-documents-view-${pharmacyId}`, 'list')
  const [openGroups, setOpenGroups] = useLocalStorageState(`pharmacy-documents-open-${pharmacyId}`, {})
  const [selectedFile, setSelectedFile] = useState(null)
  const fileRef = useRef(null)
  const [meta, setMeta] = useState({ name: '', category: '' })

  const categories = useMemo(() => {
    return Array.from(new Set([
      ...DOC_CATEGORIES,
      ...(documents || []).map(d => d.category).filter(Boolean),
    ]))
  }, [documents])

  const filteredDocuments = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (documents || []).filter(doc => {
      const matchesCategory = !categoryFilter || doc.category === categoryFilter
      if (!matchesCategory) return false
      if (!q) return true
      return [
        getDocumentName(doc),
        doc.category,
        doc.file_ext,
      ].filter(Boolean).some(value => String(value).toLowerCase().includes(q))
    })
  }, [documents, query, categoryFilter])

  const groupedDocuments = useMemo(() => {
    return filteredDocuments.reduce((groups, doc) => {
      const category = doc.category || 'Otros'
      if (!groups[category]) groups[category] = []
      groups[category].push(doc)
      return groups
    }, {})
  }, [filteredDocuments])

  const categoryOrder = useMemo(() => {
    const existingCategories = Object.keys(groupedDocuments)
    return [
      ...DOC_CATEGORIES.filter(category => existingCategories.includes(category)),
      ...existingCategories.filter(category => !DOC_CATEGORIES.includes(category)).sort((a, b) => a.localeCompare(b, 'es')),
    ]
  }, [groupedDocuments])

  async function handleUpload() {
    const file = selectedFile
    if (!file) return
    setUploading(true)
    try {
      await uploadDocument(file, {
        name: meta.name || file.name,
        category: meta.category,
        pharmacy_id: pharmacyId,
        company_id: companyId,
      })
      toast('Documento subido', 'success')
      setMeta({ name: '', category: '' })
      setSelectedFile(null)
    } catch {
      toast('Error al subir el documento', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleFileSelection(event) {
    setSelectedFile(event.target.files?.[0] || null)
  }

  async function resolveUrl(doc) {
    const url = await getDocumentUrl(doc)
    if (!url) throw new Error('Documento sin URL')
    return url
  }

  async function handlePreview(doc) {
    setPreviewLoadingId(doc.id)
    try {
      const url = await resolveUrl(doc)
      setPreview({ doc, url })
    } catch {
      toast('No se pudo abrir el documento', 'error')
    } finally {
      setPreviewLoadingId(null)
    }
  }

  async function handleOpen(doc) {
    try {
      const url = await resolveUrl(doc)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast('No se pudo abrir el documento', 'error')
    }
  }

  async function handleDownload(doc) {
    try {
      const url = await resolveUrl(doc)
      const link = window.document.createElement('a')
      link.href = url
      link.download = getDocumentName(doc)
      link.target = '_blank'
      window.document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast('No se pudo descargar el documento', 'error')
    }
  }

  async function handleCopyLink(doc) {
    try {
      const url = await resolveUrl(doc)
      await navigator.clipboard.writeText(url)
      toast('Enlace copiado', 'success')
    } catch {
      toast('No se pudo copiar el enlace', 'error')
    }
  }

  async function handleDelete(doc) {
    setDeletingId(doc.id)
    try {
      const result = await deleteDocument(doc)
      toast(
        result?.storageError
          ? 'Documento eliminado. El archivo no se pudo retirar del almacenamiento.'
          : 'Documento eliminado',
        result?.storageError ? 'error' : 'success'
      )
      setConfirmDel(null)
      if (preview?.doc?.id === doc.id) setPreview(null)
    } catch {
      toast('Error al eliminar el documento', 'error')
    } finally {
      setDeletingId(null)
    }
  }
  const allGroupsCollapsed = categoryOrder.length > 0 && categoryOrder.every(category => openGroups[category] === false)

  function toggleAllGroups() {
    setOpenGroups(prev => ({
      ...prev,
      ...Object.fromEntries(categoryOrder.map(category => [category, allGroupsCollapsed])),
    }))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Subir documento</p>
          <span className="text-[11px] text-teal-700/70">{documents.length} documento{documents.length === 1 ? '' : 's'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label>Nombre del documento</Label><Input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} placeholder="Opcional" /></div>
          <div>
            <Label>Categoría</Label>
            <Select value={meta.category} onChange={e => setMeta(m => ({ ...m, category: e.target.value }))}>
              <option value="">Sin categoría</option>
              {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input ref={fileRef} type="file" onChange={handleFileSelection} disabled={uploading} className="block min-w-0 flex-1 text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white file:text-teal-700 hover:file:bg-teal-100 cursor-pointer" />
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Subir
          </button>
        </div>
        {uploading && <p className="text-xs text-teal-600 animate-pulse">Subiendo...</p>}
      </div>

      <TabToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar documentos..."
        onCollapseAll={toggleAllGroups}
        allCollapsed={allGroupsCollapsed}
      >
        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="sm:w-48">
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div className="flex items-center rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Vista tarjetas"
            className={`rounded-l-lg p-2 ${viewMode === 'cards' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-teal-700'}`}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Vista lista"
            className={`rounded-r-lg p-2 ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-teal-700'}`}
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <ArrowPathIcon className="w-4 h-4" /> Actualizar
        </button>
      </TabToolbar>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {(!documents || documents.length === 0) ? (
        <EmptyTab icon={DocumentTextIcon} message="Sin documentos adjuntos" />
      ) : filteredDocuments.length === 0 ? (
        <EmptyTab icon={DocumentTextIcon} message="Sin documentos con esos filtros" />
      ) : (
        <div className="space-y-5">
          {categoryOrder.map(category => (
            <CollapsibleGroup
              key={category}
              title={category}
              count={groupedDocuments[category].length}
              open={openGroups[category] !== false}
              onToggle={() => setOpenGroups(prev => ({ ...prev, [category]: prev[category] === false }))}
            >
              <div className={viewMode === 'cards' ? 'grid grid-cols-1 gap-2 lg:grid-cols-2' : 'space-y-2'}>
                {groupedDocuments[category].map(doc => {
                  const name = getDocumentName(doc)
                  const ext = getDocumentExt(doc)
                  const urlAvailable = Boolean(doc.storage_path || doc.public_url || doc.file_url)
                  return (
                    <div key={doc.id} className={`flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors sm:flex-row ${viewMode === 'cards' ? 'items-start p-4' : 'items-start p-3 sm:items-center'}`}>
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                          {ext || <DocumentTextIcon className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-400">{new Date(doc.created_at).toLocaleDateString('es-ES')}</span>
                            {doc.size_bytes ? <span className="text-[11px] text-gray-300">{formatBytes(doc.size_bytes)}</span> : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {urlAvailable && (
                          <button type="button" onClick={() => handlePreview(doc)} disabled={previewLoadingId === doc.id} title="Visualizar" className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-40">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        )}
                        {urlAvailable && (
                          <button type="button" onClick={() => handleDownload(doc)} title="Descargar" className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        )}
                        {urlAvailable && (
                          <button type="button" onClick={() => handleCopyLink(doc)} title="Copiar enlace temporal" className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors">
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button type="button" onClick={() => setConfirmDel(doc)} disabled={deletingId === doc.id} title="Eliminar documento" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CollapsibleGroup>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setPreview(null)}>
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{getDocumentName(preview.doc)}</p>
                <p className="text-xs text-gray-400">{[preview.doc.category, getDocumentExt(preview.doc), formatBytes(preview.doc.size_bytes)].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => handleOpen(preview.doc)} title="Abrir en pestaña" className="rounded-lg p-2 text-gray-400 hover:bg-teal-50 hover:text-teal-700">
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => handleDownload(preview.doc)} title="Descargar" className="rounded-lg p-2 text-gray-400 hover:bg-teal-50 hover:text-teal-700">
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setPreview(null)} title="Cerrar" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="min-h-[55vh] overflow-auto bg-slate-50">
              {canPreviewInline(preview.doc) ? (
                getDocumentExt(preview.doc).toLowerCase().match(/png|jpg|jpeg|webp|gif|svg/) ? (
                  <div className="flex min-h-[55vh] items-center justify-center p-4">
                    <img src={preview.url} alt={getDocumentName(preview.doc)} className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-sm" />
                  </div>
                ) : (
                  <iframe title={getDocumentName(preview.doc)} src={preview.url} className="h-[70vh] w-full bg-white" />
                )
              ) : (
                <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
                  <DocumentTextIcon className="mb-3 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-700">Vista previa no disponible para este tipo de archivo.</p>
                  <p className="mt-1 text-xs text-gray-400">Puedes abrirlo en una pestaña nueva o descargarlo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmDialog
          title="Eliminar documento"
          message={`¿Seguro que quieres eliminar "${getDocumentName(confirmDel)}"?`}
          confirmLabel={deletingId === confirmDel.id ? 'Eliminando...' : 'Eliminar'}
          variant="danger"
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

// â”€â”€ Página principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PharmacyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { pharmacy, equipment, loading, error, refetch } = usePharmacy(id)
  const { persons } = usePharmacyPersons(id)
  const { documents } = usePharmacyDocuments(id)
  const { devices } = usePharmacyIT(id)
  const [activeTab, setActiveTab] = useState('general')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [lastActivity, setLastActivity] = useState(null)
  const [activityVersion, setActivityVersion] = useState(0)
  const requestedTab = searchParams.get('tab')
  const requestedAction = searchParams.get('action')
  const requestedPersonId = searchParams.get('person')
  const isEditableTab = activeTab === 'general' || activeTab === 'equipment'
  const editTitle = activeTab === 'general'
    ? 'Editar datos generales'
    : activeTab === 'equipment'
      ? 'Editar equipamiento'
      : 'Editar farmacia'
  const editLabel = activeTab === 'general'
    ? 'Editar datos generales'
    : activeTab === 'equipment'
      ? 'Editar equipamiento'
      : 'Editar'

  function handleEditClick() {
    if (!isEditableTab) return
    setIsEditOpen(true)
  }

  function setTabInUrl(tabKey) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tabKey)
    nextParams.delete('action')
    nextParams.delete('person')
    setSearchParams(nextParams, { replace: true })
  }

  function clearRequestedAction() {
    if (!requestedAction) return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('action')
    nextParams.delete('person')
    setSearchParams(nextParams, { replace: true })
  }

  async function handleSaved() {
    await refetch()
    setActivityVersion(version => version + 1)
    setIsEditOpen(false)
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function loadActivity() {
      const { data } = await supabase
        .from('activity_logs')
        .select('action, entity_name, user_name, created_at, old_value, new_value')
        .eq('entity_type', 'client')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) setLastActivity(data || null)
    }
    loadActivity().catch(() => {})
    return () => { cancelled = true }
  }, [id, activityVersion])

  const summaryData = useMemo(() => {
    const safePersons = Array.isArray(persons) ? persons : []
    const safeDocuments = Array.isArray(documents) ? documents : []
    const safeDevices = Array.isArray(devices) ? devices : []
    const equipmentRows = getEquipmentSummaryRows(equipment).filter(row => row.estado === 'SI')
    const vitekaRows = equipmentRows.filter(row => row.is_viteka)
    const responsibleCount = safePersons.filter(person => person.is_responsible).length

    const peoplePreview = safePersons.slice(0, 2).map(person => {
      const responsible = person.is_responsible ? ` · Sí #${person.responsibility_grade || ''}`.trim() : ''
      return [person.name, person.role].filter(Boolean).join(' · ') + responsible
    }).filter(Boolean).join(' | ')
    const peopleItems = safePersons.slice(0, 4).map(person => ({
      label: person.name || 'Sin nombre',
      detail: [
        person.role || 'Sin rol',
        person.is_responsible ? `Responsable${person.responsibility_grade ? ` #${person.responsibility_grade}` : ''}` : 'No responsable',
        person.phone || pharmacy?.contact_phone || '',
        person.email || pharmacy?.contact_email || '',
      ].filter(Boolean).join(' · '),
    }))

    const itGroups = safeDevices.reduce((acc, device) => {
      const label = IT_LABEL[device.device_type] || device.device_type || 'Otro'
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})
    const itItems = Object.entries(itGroups).map(([label, count]) => {
      const matchingDevices = safeDevices
        .filter(device => (IT_LABEL[device.device_type] || device.device_type || 'Otro') === label)
        .slice(0, 3)
        .map(device => {
          const parts = [device.name, resolveBrand(device).marca, resolveBrand(device).modelo].filter(Boolean)
          return parts.join(' · ')
        })
        .filter(Boolean)

      return {
        label: `${label} · ${count}`,
        detail: matchingDevices.length > 0 ? matchingDevices.join(' | ') : `${count} equipo(s)`,
      }
    })
    const itDetail = safeDevices.length > 0
      ? `${safeDevices.length} equipos · ${Object.entries(itGroups).map(([label, count]) => `${label}: ${count}`).join(' | ')}`
      : 'Sin equipos informáticos'

    const docGroups = safeDocuments.reduce((acc, doc) => {
      const label = doc.category || 'Otros'
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})
    const documentItems = Object.entries(docGroups).map(([label, count]) => {
      const names = safeDocuments
        .filter(doc => (doc.category || 'Otros') === label)
        .slice(0, 3)
        .map(doc => doc.name || doc.file_name || 'Documento')
        .filter(Boolean)

      return {
        label: `${label} · ${count}`,
        detail: names.length > 0 ? names.join(' | ') : `${count} documento(s)`,
      }
    })
    const docDetail = safeDocuments.length > 0
      ? `${Object.entries(docGroups).slice(0, 3).map(([label, count]) => `${label}: ${count}`).join(' · ')}`
      : 'Sin documentos cargados'
    const equipmentItems = equipmentRows.slice(0, 4).map(row => {
      const detail = [
        row.is_viteka ? 'Distribución o soporte Viteka' : null,
        row.distribuidor ? `Distribuidor: ${row.distribuidor}` : null,
        row.soporte ? `Soporte: ${row.soporte}` : null,
      ].filter(Boolean).join(' · ')

      return {
        label: row.producto,
        detail: detail || 'Activo sin detalle adicional',
      }
    })

    const mapText = [
      pharmacy?.address,
      pharmacy?.city,
      PROVINCE_LABEL[pharmacy?.province] || pharmacy?.province,
    ].filter(Boolean).join(', ')
    const lastActionText = getLastActionLabel(lastActivity)
    const lastChangeDetail = getLastChangeDetail(lastActivity)
    const lastActionTooltip = lastActivity
      ? `${lastChangeDetail} · ${lastActionText} · ${formatDateTime(lastActivity.created_at)}`
      : 'Sin actividad registrada todavía'

    return {
      map: mapText || 'Ubicación no informada',
      hasMapLocation: Boolean(mapText),
      people: {
        count: safePersons.length,
        responsibleCount,
        preview: peoplePreview || 'Sin personas registradas',
        items: peopleItems,
      },
      equipment: {
        count: equipmentRows.length,
        vitekaCount: vitekaRows.length,
        detail: equipmentRows.length > 0
          ? equipmentRows.slice(0, 3).map(row => {
              const source = row.is_viteka
                ? 'Viteka'
                : [row.distribuidor, row.soporte].filter(Boolean).join(' / ')
              return source ? `${row.producto} · ${source}` : row.producto
            }).join(' · ')
          : 'Sin equipamiento registrado',
        items: equipmentItems,
      },
      it: {
        count: safeDevices.length,
        typeCount: Object.keys(itGroups).length,
        detail: safeDevices.length > 0
          ? Object.entries(itGroups).map(([label, count]) => `${label}: ${count}`).join(' · ')
          : itDetail,
        items: itItems,
      },
      projects: 'Vacío',
      incidents: 'Vacío',
      documents: {
        count: safeDocuments.length,
        categoryCount: Object.keys(docGroups).length,
        detail: docDetail,
        items: documentItems,
      },
      lastActionText,
      lastChangeDetail,
      lastActionTooltip,
    }
  }, [documents, equipment, lastActivity, persons, pharmacy, devices])

  useEffect(() => {
    if (!requestedTab) return
    const isValidTab = TABS.some(tab => tab.key === requestedTab)
    if (isValidTab && requestedTab !== activeTab) {
      setActiveTab(requestedTab)
    }
  }, [requestedTab, activeTab])

  useEffect(() => {
    if (requestedAction !== 'edit') return
    if (requestedTab !== 'general' && requestedTab !== 'equipment') return
    setActiveTab(requestedTab)
    setIsEditOpen(true)
    clearRequestedAction()
  }, [requestedAction, requestedTab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !pharmacy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
        <p className="text-lg font-medium">Farmacia no encontrada</p>
        <button onClick={() => navigate(-1)} className="text-sm text-teal-600 hover:underline">Volver</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabecera */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">{pharmacy.pharmacy_name}</h1>
                <p className="text-xs text-gray-400 truncate">
                  {[pharmacy.city, PROVINCE_LABEL[pharmacy.province] || pharmacy.province].filter(Boolean).join(', ')}
                  {pharmacy.legal_type && ` · ${LEGAL_LABEL[pharmacy.legal_type] || pharmacy.legal_type}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEditClick}
              disabled={!isEditableTab}
              title={isEditableTab ? editLabel : 'Edición disponible en Datos generales y Equipamiento'}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors shrink-0 ${
                isEditableTab
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PencilSquareIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{editLabel}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-0 -mb-px scrollbar-none md:-mx-6 md:px-6">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key)
                    setTabInUrl(tab.key)
                  }}
                  className={`inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 px-3 py-2 text-[11px] leading-tight text-center font-medium whitespace-nowrap border-b-2 transition-colors sm:min-h-0 sm:justify-start sm:py-2.5 sm:text-xs ${
                    activeTab === tab.key
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-4 md:px-6 py-6">
        {activeTab === 'general'   && (
          <TabGeneral
            pharmacy={pharmacy}
            summaries={summaryData}
            onNavigateTab={(tabKey) => {
              setActiveTab(tabKey)
              setTabInUrl(tabKey)
            }}
          />
        )}
        {activeTab === 'equipment' && <TabEquipment equipment={equipment} />}
        {activeTab === 'it'        && (
          <TabIT
            pharmacyId={id}
            companyId={pharmacy.company_id}
            initialAction={requestedAction}
            onActionHandled={clearRequestedAction}
          />
        )}
        {activeTab === 'people'    && (
          <TabPeople
            pharmacyId={id}
            companyId={pharmacy.company_id}
            pharmacy={pharmacy}
            initialAction={requestedAction}
            initialPersonId={requestedPersonId}
            onActionHandled={clearRequestedAction}
          />
        )}
        {activeTab === 'incidents' && <PlaceholderTab icon={ExclamationTriangleIcon} title="Incidencias" message="Módulo de incidencias próximamente" placeholder="Buscar incidencias..." />}
        {activeTab === 'projects'  && <PlaceholderTab icon={FolderOpenIcon} title="Proyectos" message="Módulo de proyectos próximamente" placeholder="Buscar proyectos..." />}
        {activeTab === 'documents' && <TabDocuments pharmacyId={id} companyId={pharmacy.company_id} />}
      </div>

      <PharmacyEditDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={editTitle}
        subtitle={pharmacy.pharmacy_name}
      >
        {activeTab === 'general' && (
          <EditGeneralModal
            pharmacy={pharmacy}
            onClose={() => setIsEditOpen(false)}
            onSaved={handleSaved}
          />
        )}
        {activeTab === 'equipment' && (
          <EditEquipmentModal
            pharmacy={pharmacy}
            equipment={equipment}
            onClose={() => setIsEditOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </PharmacyEditDrawer>
    </div>
  )
}

