import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import jsPDF from 'jspdf'
import { useAuth } from '../hooks/useAuth'
import { usePharmacies } from '../hooks/usePharmacies'
import { getScheduleDayRows, getScheduleOptionLabels } from '../lib/pharmacySchedule'
import {
  MagnifyingGlassIcon, PlusIcon, BuildingStorefrontIcon, MapPinIcon,
  Bars3Icon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon,
  EllipsisVerticalIcon, PencilSquareIcon, WrenchScrewdriverIcon, ComputerDesktopIcon,
  UsersIcon, ExclamationTriangleIcon, FolderOpenIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline'

const PROVINCE_LABEL = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}
const LEGAL_LABEL = {
  autonomo: 'Persona Jurídica.', cb: 'C.B.', sl: 'S.L.',
  autonomo_sl: 'Persona Jurídica. + S.L.', cb_sl: 'C.B. + S.L.',
}

const DEFAULT_COLUMNS = [
  { key: 'pharmacy_name', label: 'Nombre de la farmacia' },
  { key: 'owners', label: 'Nombre del titular/es' },
  { key: 'province', label: 'Provincia' },
  { key: 'city', label: 'Población' },
  { key: 'postal_code', label: 'C.P.' },
  { key: 'workstations', label: 'Nº puestos' },
  { key: 'schedule', label: 'Horario' },
  { key: 'contact_phone', label: 'Teléfono' },
  { key: 'contact_email', label: 'Email' },
]
const COLUMN_WIDTHS = {
  pharmacy_name: '14%',
  owners: '18%',
  province: '8%',
  city: '9%',
  postal_code: '6%',
  workstations: '8%',
  schedule: '12%',
  contact_phone: '9%',
  contact_email: '13%',
}

const EMPTY_VALUE = '—'
const ADVANCED_SCHEDULE_OPTIONS = [
  { key: 'open_365', label: '365 días' },
  { key: 'open_24h', label: '24H' },
  { key: 'local_holidays', label: 'Abre festivos locales' },
  { key: 'regional_holidays', label: 'Abre festivos autonómicos' },
  { key: 'national_holidays', label: 'Abre festivos nacionales' },
]
const LEGAL_TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'autonomo', label: 'Persona Jurídica.' },
  { value: 'cb', label: 'C.B.' },
  { value: 'sl', label: 'S.L.' },
  { value: 'autonomo_sl', label: 'Persona Jurídica. + S.L.' },
  { value: 'cb_sl', label: 'C.B. + S.L.' },
]
const DEFAULT_ADVANCED_FILTERS = {
  status: '',
  legalType: '',
  city: '',
  postalCode: '',
  owner: '',
  phone: '',
  email: '',
  workstations: '',
  erp: '',
  caja: '',
  esl: '',
  bascula: '',
  consultoria: '',
  frigorifico: '',
  hasGuards: '',
  scheduleOptions: [],
}

function getOwners(pharmacy) {
  const owners = []

  if (pharmacy.owner_name) owners.push(pharmacy.owner_name)

  if (Array.isArray(pharmacy.cb_owners)) {
    pharmacy.cb_owners.forEach(owner => {
      if (owner?.name) owners.push(owner.name)
    })
  }

  if (pharmacy.razon_social) owners.push(pharmacy.razon_social)

  return [...new Set(owners.filter(Boolean))].join(', ')
}

function getOwnerSummary(pharmacy) {
  const personalOwners = []

  if (pharmacy.owner_name) personalOwners.push(pharmacy.owner_name)

  if (Array.isArray(pharmacy.cb_owners)) {
    pharmacy.cb_owners.forEach(owner => {
      if (owner?.name) personalOwners.push(owner.name)
    })
  }

  const uniquePersonalOwners = [...new Set(personalOwners.filter(Boolean))]
  const legalNames = [...new Set([pharmacy.razon_social].filter(Boolean))]
  const primaryOwner = uniquePersonalOwners[0] || legalNames[0] || ''
  const extraOwners = uniquePersonalOwners.slice(primaryOwner === uniquePersonalOwners[0] ? 1 : 0)
  const extraLegalNames = primaryOwner === legalNames[0] ? legalNames.slice(1) : legalNames
  const hiddenCount = extraOwners.length + extraLegalNames.length

  return {
    primaryOwner,
    extraOwners,
    extraLegalNames,
    hiddenCount,
  }
}

function getWorkstations(pharmacy) {
  const value = pharmacy.equipment?.erp_detail?.puestos
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

function getErpLabel(pharmacy) {
  const value = pharmacy.equipment?.erp
  if (!value || value === 'NO') return ''
  return String(value)
}

function getVitekaEquipmentProducts(pharmacy) {
  const eq = pharmacy?.equipment || {}
  const products = []

  if (eq.erp_viteka && eq.erp && eq.erp !== 'NO') products.push(eq.erp)
  if (eq.caja_viteka && eq.caja && eq.caja !== 'NO') products.push(eq.caja)
  if (eq.esl_viteka && eq.esl && eq.esl !== 'NO') products.push(eq.esl)
  if (eq.bascula_viteka && eq.bascula && eq.bascula !== 'NO') products.push(eq.bascula)
  if (eq.consultoria_viteka && eq.consultoria && eq.consultoria !== 'NO') products.push(eq.consultoria)
  if (eq.frigorifico_viteka && eq.frigorifico_marca) products.push(eq.frigorifico_marca)

  return [...new Set(products.filter(Boolean))]
}

const VITEKA_PRODUCT_PRIORITY = ['Nixfarma', 'Cashlogy', 'Hanshow']

function sortVitekaProducts(a, b) {
  const aIndex = VITEKA_PRODUCT_PRIORITY.indexOf(a)
  const bIndex = VITEKA_PRODUCT_PRIORITY.indexOf(b)

  if (aIndex !== -1 || bIndex !== -1) {
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  }

  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}

function getEquipmentValue(pharmacy, key) {
  const eq = pharmacy?.equipment || {}

  switch (key) {
    case 'erp':
      return eq.erp || ''
    case 'caja':
      return eq.caja || ''
    case 'esl':
      return eq.esl || ''
    case 'bascula':
      return eq.bascula || ''
    case 'consultoria':
      return eq.consultoria || ''
    case 'frigorifico':
      return eq.frigorifico_marca || ''
    default:
      return ''
  }
}

function buildUniqueOptions(pharmacies, getter) {
  return [...new Set(pharmacies.map(getter).filter(value => value && value !== 'NO'))]
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
}

function matchesSelectValue(value, filterValue) {
  if (!filterValue) return true
  if (filterValue === '__empty__') return !value || value === 'NO'
  return String(value || '') === filterValue
}

function matchesTextValue(value, filterValue) {
  if (!filterValue) return true
  return String(value || '').toLowerCase().includes(filterValue.toLowerCase())
}

function countActiveAdvancedFilters(filters, selectedProvinces, selectedVitekaProducts) {
  let count = 0

  if (selectedProvinces.length > 0) count += 1
  if (selectedVitekaProducts.length > 0) count += 1

  if (filters.status) count += 1
  if (filters.legalType) count += 1
  if (filters.city) count += 1
  if (filters.postalCode) count += 1
  if (filters.owner) count += 1
  if (filters.phone) count += 1
  if (filters.email) count += 1
  if (filters.workstations) count += 1
  if (filters.erp) count += 1
  if (filters.caja) count += 1
  if (filters.esl) count += 1
  if (filters.bascula) count += 1
  if (filters.consultoria) count += 1
  if (filters.frigorifico) count += 1
  if (filters.hasGuards) count += 1
  count += filters.scheduleOptions.length

  return count
}

function ProvinceFilterMenu({
  options,
  selectedProvinces,
  onToggleProvince,
  onToggleAll,
  onClear,
}) {
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })

  useEffect(() => {
    function handlePointerDown(event) {
      if (anchorRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !menuRef.current) return undefined
    function updatePosition() {
      const anchorRect = anchorRef.current.getBoundingClientRect()
      const menuRect = menuRef.current.getBoundingClientRect()
      const padding = 16
      const left = Math.max(padding, Math.min(anchorRect.left, window.innerWidth - menuRect.width - padding))
      const preferredTop = anchorRect.bottom + 8
      const top = preferredTop + menuRect.height <= window.innerHeight - padding
        ? preferredTop
        : Math.max(padding, anchorRect.top - menuRect.height - 8)
      setPosition({ top, left, ready: true })
    }
    const rafId = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, options.length, selectedProvinces.length])

  return (
    <div ref={anchorRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          selectedProvinces.length > 0
            ? 'border-teal-300 bg-teal-50 text-teal-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Provincias
        {selectedProvinces.length > 0 && <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] font-semibold">{selectedProvinces.length}</span>}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[120] w-[min(280px,calc(100vw-32px))] rounded-xl border border-gray-200 bg-white shadow-2xl"
          style={{ top: `${position.top}px`, left: `${position.left}px`, opacity: position.ready ? 1 : 0 }}
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-800">Filtrar por provincias</p>
            <p className="mt-0.5 text-xs text-gray-500">Puedes seleccionar una, varias o todas.</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
              <input type="checkbox" checked={options.length > 0 && options.every(option => selectedProvinces.includes(option))} onChange={onToggleAll} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span>Seleccionar todas</span>
            </label>
            <div className="my-1 border-t border-gray-100" />
            {options.map(option => (
              <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <input type="checkbox" checked={selectedProvinces.includes(option)} onChange={() => onToggleProvince(option)} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <span>{PROVINCE_LABEL[option] || option}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button type="button" onClick={onClear} className="text-sm text-gray-500 hover:text-gray-700">Limpiar</button>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">Aplicar</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function getColumnValue(pharmacy, key) {
  switch (key) {
    case 'pharmacy_name':
      return pharmacy.pharmacy_name || ''
    case 'owners':
      return getOwners(pharmacy)
    case 'province':
      return PROVINCE_LABEL[pharmacy.province] || pharmacy.province || ''
    case 'city':
      return pharmacy.city || ''
    case 'postal_code':
      return pharmacy.postal_code || ''
    case 'workstations':
      return getWorkstations(pharmacy)
    case 'schedule':
      return pharmacy.schedule || ''
    case 'contact_phone':
      return pharmacy.contact_phone || ''
    case 'contact_email':
      return pharmacy.contact_email || ''
    default:
      return ''
  }
}

function ScheduleTooltip({ pharmacy }) {
  const anchorRef = useRef(null)
  const tooltipRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })
  const scheduleRows = getScheduleDayRows(pharmacy.schedule_detail)
  const optionLabels = getScheduleOptionLabels({
    days: pharmacy.schedule_detail?.days,
    options: pharmacy.schedule_options,
  })
  const hasExtraInfo = scheduleRows.length > 0 || optionLabels.length > 0 || pharmacy.has_guards || pharmacy.schedule_guard_notes

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !tooltipRef.current) return undefined

    function updatePosition() {
      if (!anchorRef.current || !tooltipRef.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportPadding = 16
      const gap = 8

      let left = anchorRect.left
      if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - tooltipRect.width - viewportPadding
      }
      left = Math.max(viewportPadding, left)

      let top = anchorRect.bottom + gap
      if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
        top = anchorRect.top - tooltipRect.height - gap
      }
      top = Math.max(viewportPadding, top)

      setPosition({ top, left, ready: true })
    }

    const rafId = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, pharmacy])

  return (
    <div
      ref={anchorRef}
      className="w-full min-w-0"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="block truncate text-gray-500">
        {pharmacy.schedule || EMPTY_VALUE}
      </span>

      {hasExtraInfo && isOpen && createPortal(
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-[80] w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            opacity: position.ready ? 1 : 0,
          }}
        >
          <div className="space-y-3">
            {scheduleRows.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Detalle</p>
                <div className="mt-2 space-y-1.5">
                  {scheduleRows.map(row => (
                    <div key={row.day} className="grid grid-cols-[88px_1fr] gap-3 text-sm">
                      <span className="font-medium text-slate-600">{row.day}</span>
                      <span className="text-slate-700">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Apertura especial</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {optionLabels.length > 0 ? optionLabels.map(label => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {label}
                  </span>
                )) : (
                  <span className="text-sm text-slate-500">Sin aperturas especiales</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[88px_1fr] gap-3 text-sm">
              <span className="font-medium text-slate-600">Guardias</span>
              <span className={pharmacy.has_guards ? 'text-slate-700' : 'text-slate-500'}>
                {pharmacy.has_guards ? 'Sí' : 'No'}
              </span>
            </div>

            {pharmacy.schedule_guard_notes && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Indicaciones</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{pharmacy.schedule_guard_notes}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function RowActionsMenu({ pharmacy }) {
  const navigate = useNavigate()
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })

  const actions = [
    { label: 'Editar datos', icon: PencilSquareIcon, to: `/farmacias/${pharmacy.id}?tab=general&action=edit` },
    { label: 'Editar equipamiento', icon: WrenchScrewdriverIcon, to: `/farmacias/${pharmacy.id}?tab=equipment&action=edit` },
    { label: 'Crear equipo informático', icon: ComputerDesktopIcon, to: `/farmacias/${pharmacy.id}?tab=it&action=new-it` },
    { label: 'Crear persona', icon: UsersIcon, to: `/farmacias/${pharmacy.id}?tab=people&action=new-person` },
    { label: 'Crear ticket', icon: ExclamationTriangleIcon, to: `/incidencias?pharmacy_id=${pharmacy.id}&open=1` },
    { label: 'Crear proyecto', icon: FolderOpenIcon, to: `/proyectos?pharmacy_id=${pharmacy.id}&create=1&type=commercial` },
    { label: 'Subir documentos', icon: DocumentTextIcon, to: `/documentos?open=1` },
  ]

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !menuRef.current) return undefined

    function updatePosition() {
      if (!anchorRef.current || !menuRef.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const menuRect = menuRef.current.getBoundingClientRect()
      const viewportPadding = 16
      const gap = 8

      let left = anchorRect.right - menuRect.width
      if (left < viewportPadding) left = viewportPadding
      if (left + menuRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - menuRect.width - viewportPadding
      }

      let top = anchorRect.bottom + gap
      if (top + menuRect.height > window.innerHeight - viewportPadding) {
        top = anchorRect.top - menuRect.height - gap
      }
      top = Math.max(viewportPadding, top)

      setPosition({ top, left, ready: true })
    }

    function handlePointerDown(event) {
      if (
        anchorRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const rafId = window.requestAnimationFrame(updatePosition)
    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.cancelAnimationFrame(rafId)
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  function handleNavigate(to) {
    setIsOpen(false)
    navigate(to)
  }

  return (
    <div className="flex justify-end">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-teal-300 hover:text-teal-700"
        aria-label={`Acciones rápidas para ${pharmacy.pharmacy_name}`}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[90] w-[240px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            opacity: position.ready ? 1 : 0,
          }}
        >
          <div className="space-y-1">
            {actions.map(action => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleNavigate(action.to)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function OwnerTooltip({ pharmacy }) {
  const anchorRef = useRef(null)
  const tooltipRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })
  const ownerSummary = getOwnerSummary(pharmacy)
  const hasExtraInfo = ownerSummary.hiddenCount > 0

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !tooltipRef.current) return undefined

    function updatePosition() {
      if (!anchorRef.current || !tooltipRef.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportPadding = 16
      const gap = 8

      let left = anchorRect.left
      if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - tooltipRect.width - viewportPadding
      }
      left = Math.max(viewportPadding, left)

      let top = anchorRect.bottom + gap
      if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
        top = anchorRect.top - tooltipRect.height - gap
      }
      top = Math.max(viewportPadding, top)

      setPosition({ top, left, ready: true })
    }

    const rafId = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, pharmacy])

  if (!ownerSummary.primaryOwner) {
    return <span>{EMPTY_VALUE}</span>
  }

  return (
    <div
      ref={anchorRef}
      className="flex max-w-[320px] items-start gap-2"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="min-w-0 flex-1 truncate text-slate-700">{ownerSummary.primaryOwner}</span>

      {hasExtraInfo && (
        <>
          <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            +{ownerSummary.hiddenCount}
          </span>

          {isOpen && createPortal(
            <div
              ref={tooltipRef}
              className="pointer-events-none fixed z-[80] w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                opacity: position.ready ? 1 : 0,
              }}
            >
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Titular principal</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{ownerSummary.primaryOwner}</p>
                </div>

                {ownerSummary.extraOwners.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Otros titulares</p>
                    <div className="mt-2 space-y-1.5">
                      {ownerSummary.extraOwners.map(owner => (
                        <p key={owner} className="text-sm text-slate-700">{owner}</p>
                      ))}
                    </div>
                  </div>
                )}

                {ownerSummary.extraLegalNames.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sociedad / C.B. / S.L.</p>
                    <div className="mt-2 space-y-1.5">
                      {ownerSummary.extraLegalNames.map(name => (
                        <p key={name} className="text-sm text-slate-700">{name}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  )
}

function VitekaFilterMenu({
  options,
  selectedProducts,
  onToggleProduct,
  onToggleAll,
  onClear,
}) {
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })

  useEffect(() => {
    function handlePointerDown(event) {
      if (anchorRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !menuRef.current) return undefined

    function updatePosition() {
      if (!anchorRef.current || !menuRef.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const menuRect = menuRef.current.getBoundingClientRect()
      const viewportPadding = 16
      const gap = 8

      let left = anchorRect.left
      if (left + menuRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - menuRect.width - viewportPadding
      }
      left = Math.max(viewportPadding, left)

      let top = anchorRect.bottom + gap
      if (top + menuRect.height > window.innerHeight - viewportPadding) {
        top = anchorRect.top - menuRect.height - gap
      }
      top = Math.max(viewportPadding, top)

      setPosition({ top, left, ready: true })
    }

    const rafId = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, options.length, selectedProducts.length])

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          selectedProducts.length > 0
            ? 'border-teal-300 bg-teal-50 text-teal-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        Viteka
        {selectedProducts.length > 0 && (
          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] font-semibold">
            {selectedProducts.length}
          </span>
        )}
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[120] w-[min(320px,calc(100vw-32px))] rounded-xl border border-gray-200 bg-white shadow-2xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            opacity: position.ready ? 1 : 0,
          }}
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-800">Equipos soportados por Viteka</p>
            <p className="mt-0.5 text-xs text-gray-500">Marca una o varias opciones para mostrar solo farmacias con ese producto activo.</p>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {options.length === 0 ? (
              <p className="px-2 py-3 text-sm text-gray-400">Todavía no hay productos Viteka detectados.</p>
            ) : (
              <>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">
                  <input
                    type="checkbox"
                    checked={options.every(product => selectedProducts.includes(product))}
                    onChange={onToggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="min-w-0 flex-1 truncate">Seleccionar todo</span>
                </label>
                <div className="my-1 border-t border-gray-100" />
                {options.map(product => (
                  <label
                    key={product}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product)}
                      onChange={() => onToggleProduct(product)}
                      className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="min-w-0 flex-1 truncate">{product}</span>
                  </label>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              Aplicar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onChange,
  onClear,
  provinces,
  equipmentOptions,
}) {
  if (!isOpen) return null

  function updateField(key, value) {
    onChange(prev => ({ ...prev, [key]: value }))
  }

  function toggleScheduleOption(optionKey) {
    onChange(prev => ({
      ...prev,
      scheduleOptions: prev.scheduleOptions.includes(optionKey)
        ? prev.scheduleOptions.filter(item => item !== optionKey)
        : [...prev.scheduleOptions, optionKey],
    }))
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filtros avanzados</h2>
              <p className="mt-1 text-sm text-slate-500">Ajusta datos generales, horario y equipamiento para reducir la lista de farmacias.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datos generales</p>
                <p className="mt-1 text-xs text-slate-400">Filtros rápidos sobre la ficha básica de la farmacia.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Provincia</span>
                  <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-300 p-2">
                    <label className="flex items-center gap-2 rounded-md px-1 py-1 text-xs font-medium text-teal-700">
                      <input
                        type="checkbox"
                        checked={provinces.options.length > 0 && provinces.options.every(option => provinces.value.includes(option))}
                        onChange={provinces.onToggleAll}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      Seleccionar todas
                    </label>
                    {provinces.options.map(option => (
                      <label key={option} className="flex items-center gap-2 rounded-md px-1 py-1 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={provinces.value.includes(option)}
                          onChange={() => provinces.onToggle(option)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        {PROVINCE_LABEL[option] || option}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</span>
                  <select
                    value={filters.status}
                    onChange={event => updateField('status', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Todas</option>
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tipo legal</span>
                  <select
                    value={filters.legalType}
                    onChange={event => updateField('legalType', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {LEGAL_TYPE_OPTIONS.map(option => (
                      <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Población</span>
                  <input
                    value={filters.city}
                    onChange={event => updateField('city', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ej. Granada"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">C.P.</span>
                  <input
                    value={filters.postalCode}
                    onChange={event => updateField('postalCode', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="04765"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Titular</span>
                  <input
                    value={filters.owner}
                    onChange={event => updateField('owner', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Nombre del titular"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Teléfono</span>
                  <input
                    value={filters.phone}
                    onChange={event => updateField('phone', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Número"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</span>
                  <input
                    value={filters.email}
                    onChange={event => updateField('email', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="correo@..."
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Nº puestos</span>
                  <input
                    value={filters.workstations}
                    onChange={event => updateField('workstations', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="8"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Guardias</span>
                  <select
                    value={filters.hasGuards}
                    onChange={event => updateField('hasGuards', event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Todas</option>
                    <option value="yes">Sí</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Aperturas especiales</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ADVANCED_SCHEDULE_OPTIONS.map(option => (
                    <label
                      key={option.key}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={filters.scheduleOptions.includes(option.key)}
                        onChange={() => toggleScheduleOption(option.key)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Equipamiento</p>
                <p className="mt-1 text-xs text-slate-400">Filtra por marca o proveedor de cada bloque de equipamiento.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['erp', 'ERP'],
                  ['caja', 'Caja de cobro'],
                  ['esl', 'Etiquetas ESL'],
                  ['bascula', 'Báscula'],
                  ['consultoria', 'Consultoría'],
                  ['frigorifico', 'Frigorífico'],
                ].map(([key, label]) => {
                  const options = equipmentOptions[key] || []
                  return (
                    <label key={key} className="space-y-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
                      <select
                        value={filters[key]}
                        onChange={event => updateField(key, event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">Todas</option>
                        <option value="__empty__">Sin valor</option>
                        {options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  )
                })}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-700">Consejo</p>
                <p className="mt-1">Si quieres localizar solo farmacias operadas por Viteka, usa también el filtro superior de <span className="font-medium">Viteka</span>.</p>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function compareValues(a, b, direction) {
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''

  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1

  const aNumber = Number(a)
  const bNumber = Number(b)
  const bothNumeric = !Number.isNaN(aNumber) && !Number.isNaN(bNumber)
  const result = bothNumeric
    ? aNumber - bNumber
    : String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true })

  return direction === 'asc' ? result : -result
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function downloadBlob(content, mimeType, fileName) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function SortIcon({ active, direction }) {
  if (!active) return <ChevronUpDownIcon className="w-3.5 h-3.5 text-gray-300" />
  return direction === 'asc'
    ? <ChevronUpIcon className="w-3.5 h-3.5 text-teal-600" />
    : <ChevronDownIcon className="w-3.5 h-3.5 text-teal-600" />
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-3/5" />
        <div className="h-3 bg-gray-100 rounded w-2/5" />
      </div>
      <div className="h-5 w-14 bg-gray-100 rounded-full" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(DEFAULT_COLUMNS.length + 1)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-gray-100 rounded w-4/5" />
        </td>
      ))}
    </tr>
  )
}

export default function PharmaciesPage() {
  const { profile } = useAuth()
  const { pharmacies, loading } = usePharmacies(profile?.company_id)
  const [search, setSearch] = useState('')
  const [selectedProvinces, setSelectedProvinces] = useState([])
  const [selectedVitekaProducts, setSelectedVitekaProducts] = useState([])
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState(DEFAULT_ADVANCED_FILTERS)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isExportFieldsOpen, setIsExportFieldsOpen] = useState(false)
  const [pendingExportType, setPendingExportType] = useState(null)
  const [selectedExportColumnKeys, setSelectedExportColumnKeys] = useState(DEFAULT_COLUMNS.map(column => column.key))
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [draggedColumnKey, setDraggedColumnKey] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'pharmacy_name', direction: 'asc' })

  const vitekaProductOptions = useMemo(() => (
    [...new Set(pharmacies.flatMap(pharmacy => getVitekaEquipmentProducts(pharmacy)))]
      .sort(sortVitekaProducts)
  ), [pharmacies])
  const equipmentOptions = useMemo(() => ({
    erp: buildUniqueOptions(pharmacies, pharmacy => getEquipmentValue(pharmacy, 'erp')),
    caja: buildUniqueOptions(pharmacies, pharmacy => getEquipmentValue(pharmacy, 'caja')),
    esl: buildUniqueOptions(pharmacies, pharmacy => getEquipmentValue(pharmacy, 'esl')),
    bascula: buildUniqueOptions(pharmacies, pharmacy => getEquipmentValue(pharmacy, 'bascula')),
    consultoria: buildUniqueOptions(pharmacies, pharmacy => getEquipmentValue(pharmacy, 'consultoria')),
    frigorifico: buildUniqueOptions(pharmacies, pharmacy => getEquipmentValue(pharmacy, 'frigorifico')),
  }), [pharmacies])

  const filtered = useMemo(() => pharmacies.filter(p => {
    const searchValue = [
      p.pharmacy_name,
      getOwners(p),
      PROVINCE_LABEL[p.province] || p.province,
      p.city,
      p.postal_code,
      getErpLabel(p),
      getWorkstations(p),
      p.schedule,
      p.contact_phone,
      p.contact_email,
    ].filter(Boolean).join(' ').toLowerCase()

    const matchSearch = searchValue.includes(search.toLowerCase())
    const matchProv = selectedProvinces.length === 0 || selectedProvinces.includes(p.province)
    const vitekaProducts = getVitekaEquipmentProducts(p)
    const matchViteka = selectedVitekaProducts.length === 0 || selectedVitekaProducts.some(product => vitekaProducts.includes(product))
    const scheduleOptions = p.schedule_options || p.schedule_detail?.options || {}
    const matchStatus = !advancedFilters.status
      || (advancedFilters.status === 'active' && p.is_active)
      || (advancedFilters.status === 'inactive' && !p.is_active)
    const matchLegalType = !advancedFilters.legalType || p.legal_type === advancedFilters.legalType
    const matchCity = matchesTextValue(p.city, advancedFilters.city)
    const matchPostalCode = matchesTextValue(p.postal_code, advancedFilters.postalCode)
    const matchOwner = matchesTextValue(getOwners(p), advancedFilters.owner)
    const matchPhone = matchesTextValue(p.contact_phone, advancedFilters.phone)
    const matchEmail = matchesTextValue(p.contact_email, advancedFilters.email)
    const matchWorkstations = matchesTextValue(getWorkstations(p), advancedFilters.workstations)
    const matchGuards = !advancedFilters.hasGuards
      || (advancedFilters.hasGuards === 'yes' && p.has_guards)
      || (advancedFilters.hasGuards === 'no' && !p.has_guards)
    const matchScheduleOptions = advancedFilters.scheduleOptions.length === 0
      || advancedFilters.scheduleOptions.some(optionKey => Boolean(scheduleOptions[optionKey]))
    const matchErp = matchesSelectValue(getEquipmentValue(p, 'erp'), advancedFilters.erp)
    const matchCaja = matchesSelectValue(getEquipmentValue(p, 'caja'), advancedFilters.caja)
    const matchEsl = matchesSelectValue(getEquipmentValue(p, 'esl'), advancedFilters.esl)
    const matchBascula = matchesSelectValue(getEquipmentValue(p, 'bascula'), advancedFilters.bascula)
    const matchConsultoria = matchesSelectValue(getEquipmentValue(p, 'consultoria'), advancedFilters.consultoria)
    const matchFrigorifico = matchesSelectValue(getEquipmentValue(p, 'frigorifico'), advancedFilters.frigorifico)

    return matchSearch
      && matchProv
      && matchViteka
      && matchStatus
      && matchLegalType
      && matchCity
      && matchPostalCode
      && matchOwner
      && matchPhone
      && matchEmail
      && matchWorkstations
      && matchGuards
      && matchScheduleOptions
      && matchErp
      && matchCaja
      && matchEsl
      && matchBascula
      && matchConsultoria
      && matchFrigorifico
  }), [pharmacies, search, selectedProvinces, selectedVitekaProducts, advancedFilters])

  const sorted = useMemo(() => {
    const rows = [...filtered]
    if (!sortConfig.key) return rows

    rows.sort((a, b) => compareValues(
      getColumnValue(a, sortConfig.key),
      getColumnValue(b, sortConfig.key),
      sortConfig.direction,
    ))
    return rows
  }, [filtered, sortConfig])

  const provinces = useMemo(() => [...new Set(pharmacies.map(p => p.province).filter(Boolean))].sort(), [pharmacies])
  const advancedFilterCount = useMemo(
    () => countActiveAdvancedFilters(advancedFilters, selectedProvinces, selectedVitekaProducts),
    [advancedFilters, selectedProvinces, selectedVitekaProducts]
  )

  function toggleVitekaProduct(product) {
    setSelectedVitekaProducts(prev => (
      prev.includes(product)
        ? prev.filter(item => item !== product)
        : [...prev, product]
    ))
  }

  function toggleProvince(province) {
    setSelectedProvinces(prev => (
      prev.includes(province)
        ? prev.filter(item => item !== province)
        : [...prev, province]
    ))
  }

  function toggleAllProvinces() {
    setSelectedProvinces(prev => (
      provinces.every(province => prev.includes(province))
        ? []
        : [...provinces]
    ))
  }

  function clearVitekaProducts() {
    setSelectedVitekaProducts([])
  }

  function toggleAllVitekaProducts() {
    setSelectedVitekaProducts(prev => (
      vitekaProductOptions.every(product => prev.includes(product))
        ? []
        : [...vitekaProductOptions]
    ))
  }

  function clearAdvancedFilters() {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS)
    setSelectedProvinces([])
  }

  function resetAllFilters() {
    setSearch('')
    setSelectedProvinces([])
    setSelectedVitekaProducts([])
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS)
    setIsAdvancedFiltersOpen(false)
    setIsExportMenuOpen(false)
  }

  function buildFileName(ext) {
    const parts = ['farmacias']
    if (search.trim()) parts.push(search.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-'))
    if (selectedProvinces.length > 0) parts.push(selectedProvinces.join('-'))
    return `${parts.filter(Boolean).join('-')}.${ext}`
  }

  function getSelectedExportColumns(columnKeys = columns.map(column => column.key)) {
    const keySet = new Set(columnKeys)
    return columns.filter(column => keySet.has(column.key))
  }

  function buildExportDataset(columnKeys = columns.map(column => column.key)) {
    const selectedColumns = getSelectedExportColumns(columnKeys)
    const exportHeaders = selectedColumns.map(column => column.label)
    const exportRows = sorted.map(pharmacy => (
      Object.fromEntries(selectedColumns.map(column => [column.label, getColumnValue(pharmacy, column.key) || EMPTY_VALUE]))
    ))

    return { selectedColumns, exportHeaders, exportRows }
  }

  function serializeDelimitedRow(headers, row, delimiter) {
    return headers
      .map(header => `"${String(row[header]).replaceAll('"', '""')}"`)
      .join(delimiter)
  }

  function openExportFieldSelector(format) {
    setIsExportMenuOpen(false)
    setPendingExportType(format)
    setSelectedExportColumnKeys(columns.map(column => column.key))
    setIsExportFieldsOpen(true)
  }

  function closeExportFieldSelector() {
    setIsExportFieldsOpen(false)
    setPendingExportType(null)
  }

  function toggleExportColumn(columnKey) {
    setSelectedExportColumnKeys(prev => (
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    ))
  }

  function exportCsv(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const lines = [
      serializeDelimitedRow(exportHeaders, Object.fromEntries(exportHeaders.map(header => [header, header])), ','),
      ...exportRows.map(row => serializeDelimitedRow(exportHeaders, row, ',')),
    ]
    downloadBlob(lines.join('\n'), 'text/csv;charset=utf-8;', buildFileName('csv'))
  }

  function exportTxt(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const lines = [
      serializeDelimitedRow(exportHeaders, Object.fromEntries(exportHeaders.map(header => [header, header])), ';'),
      ...exportRows.map(row => serializeDelimitedRow(exportHeaders, row, ';')),
    ]
    downloadBlob(lines.join('\n'), 'text/plain;charset=utf-8;', buildFileName('txt'))
  }

  function exportExcel(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const table = `
      <table>
        <thead>
          <tr>${exportHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${exportRows.map(row => `<tr>${exportHeaders.map(header => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `
    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>${table}</body>
      </html>
    `
    downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8;', buildFileName('xls'))
  }

  function exportPdf(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const left = 10
    const top = 12
    const bottom = 10
    const cellPadding = 1.6
    const lineHeight = 3.8
    const usableWidth = pageWidth - (left * 2)
    const colWidth = usableWidth / Math.max(exportHeaders.length, 1)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text('Listado de farmacias', left, top)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(`Registros exportados: ${exportRows.length}`, pageWidth - 60, top)

    let currentY = top + 8

    function getRowMetrics(values, fontStyle) {
      pdf.setFont('helvetica', fontStyle)
      const linesByCell = values.map(value => pdf.splitTextToSize(String(value), colWidth - (cellPadding * 2)))
      const lineCount = Math.max(...linesByCell.map(lines => Math.max(lines.length, 1)))
      const height = Math.max((lineCount * lineHeight) + (cellPadding * 2), 8)
      return { linesByCell, height }
    }

    function drawTableRow(values, { fill = false, fontStyle = 'normal' } = {}) {
      const { linesByCell, height } = getRowMetrics(values, fontStyle)
      let currentX = left

      if (currentY + height > pageHeight - bottom) {
        pdf.addPage()
        currentY = 12
        drawHeader()
      }

      pdf.setFont('helvetica', fontStyle)
      values.forEach((_, index) => {
        if (fill) {
          pdf.setFillColor(243, 244, 246)
          pdf.rect(currentX, currentY, colWidth, height, 'F')
        }

        pdf.setDrawColor(209, 213, 219)
        pdf.rect(currentX, currentY, colWidth, height)
        pdf.text(linesByCell[index], currentX + cellPadding, currentY + cellPadding + lineHeight - 0.6)
        currentX += colWidth
      })

      currentY += height
    }

    function drawHeader() {
      let currentX = left
      pdf.setTextColor(55, 65, 81)
      currentX = left
      drawTableRow(exportHeaders, { fill: true, fontStyle: 'bold' })
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(75, 85, 99)
    }

    drawHeader()

    exportRows.forEach(row => {
      drawTableRow(exportHeaders.map(header => row[header]))
    })

    pdf.save(buildFileName('pdf'))
  }

  function confirmExport() {
    if (!pendingExportType || selectedExportColumnKeys.length === 0) return

    const actions = {
      excel: exportExcel,
      csv: exportCsv,
      txt: exportTxt,
      pdf: exportPdf,
    }

    const exportAction = actions[pendingExportType]
    closeExportFieldSelector()
    exportAction(selectedExportColumnKeys)
  }

  function handleSort(columnKey) {
    setSortConfig(prev => {
      if (prev.key !== columnKey) return { key: columnKey, direction: 'asc' }
      return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  function moveColumn(sourceKey, targetKey) {
    if (!sourceKey || sourceKey === targetKey) return

    setColumns(prev => {
      const sourceIndex = prev.findIndex(column => column.key === sourceKey)
      const targetIndex = prev.findIndex(column => column.key === targetKey)
      if (sourceIndex === -1 || targetIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Farmacias</h1>
          <p className="text-xs md:text-sm text-gray-500">
            {loading ? '…' : `${pharmacies.length} registradas`}
          </p>
        </div>
        <Link
          to="/farmacias/nueva"
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva farmacia</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <div className="relative w-full lg:w-1/2">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <ProvinceFilterMenu
            options={provinces}
            selectedProvinces={selectedProvinces}
            onToggleProvince={toggleProvince}
            onToggleAll={toggleAllProvinces}
            onClear={() => setSelectedProvinces([])}
          />
          <VitekaFilterMenu
            options={vitekaProductOptions}
            selectedProducts={selectedVitekaProducts}
            onToggleProduct={toggleVitekaProduct}
            onToggleAll={toggleAllVitekaProducts}
            onClear={clearVitekaProducts}
          />
          <button
            type="button"
            onClick={() => setIsAdvancedFiltersOpen(prev => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              advancedFilterCount > 0
                ? 'border-teal-300 bg-teal-50 text-teal-700'
                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Filtros
            {advancedFilterCount > 0 && (
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] font-semibold">
                {advancedFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Limpiar todo
          </button>
          <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(prev => !prev)}
            disabled={loading || sorted.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Extraer
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isExportMenuOpen && !loading && sorted.length > 0 && (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => openExportFieldSelector('excel')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Excel
              </button>
              <button
                type="button"
                onClick={() => openExportFieldSelector('csv')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => openExportFieldSelector('txt')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                TXT (;)
              </button>
              <button
                type="button"
                onClick={() => openExportFieldSelector('pdf')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                PDF
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      <AdvancedFiltersModal
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        onChange={setAdvancedFilters}
        onClear={clearAdvancedFilters}
        provinces={{
          value: selectedProvinces,
          onToggle: toggleProvince,
          onToggleAll: toggleAllProvinces,
          options: provinces,
        }}
        equipmentOptions={equipmentOptions}
      />

      {isExportFieldsOpen && !loading && sorted.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 px-4" onClick={closeExportFieldSelector}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Extraer farmacias</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona si quieres exportar todas las columnas o solo algunas en formato <span className="font-medium text-gray-700">{pendingExportType?.toUpperCase()}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={closeExportFieldSelector}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedExportColumnKeys(columns.map(column => column.key))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
              >
                Todas las columnas
              </button>
              <button
                type="button"
                onClick={() => setSelectedExportColumnKeys([])}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
              >
                Limpiar selección
              </button>
            </div>

            <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3">
              {columns.map(column => (
                <label key={column.key} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedExportColumnKeys.includes(column.key)}
                    onChange={() => toggleExportColumn(column.key)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {selectedExportColumnKeys.length} campo(s) seleccionado(s)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeExportFieldSelector}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmExport}
                  disabled={selectedExportColumnKeys.length === 0}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Extraer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <>
          <div className="lg:hidden space-y-2">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="hidden lg:block overflow-visible rounded-xl border border-gray-200 bg-white">
            <div className="overflow-visible rounded-xl">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {DEFAULT_COLUMNS.map(column => (
                      <th key={column.key} style={{ width: COLUMN_WIDTHS[column.key] }} className="text-left px-3 py-3 font-medium text-gray-600">{column.label}</th>
                    ))}
                    <th className="w-14 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto">
            <BuildingStorefrontIcon className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {search || selectedProvinces.length > 0 ? 'No hay resultados para tu búsqueda' : 'Aún no hay farmacias'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search || selectedProvinces.length > 0
                ? 'Prueba con otros términos o limpia los filtros'
                : 'Empieza añadiendo la primera farmacia'}
            </p>
          </div>
          {!search && selectedProvinces.length === 0 && (
            <Link
              to="/farmacias/nueva"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Nueva farmacia
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-2">
            {sorted.map(ph => (
              <Link
                key={ph.id}
                to={`/farmacias/${ph.id}`}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                  <BuildingStorefrontIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ph.pharmacy_name}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPinIcon className="w-3 h-3 shrink-0" />
                    <span>{[ph.city, PROVINCE_LABEL[ph.province] || ph.province].filter(Boolean).join(', ') || EMPTY_VALUE}</span>
                  </div>
                  <p className="truncate text-xs text-gray-400 mt-0.5">{getOwners(ph) || 'Sin titular informado'}</p>
                  <p className="truncate text-xs text-gray-400 mt-0.5">{ph.contact_phone || EMPTY_VALUE} · {ph.contact_email || EMPTY_VALUE}</p>
                </div>
                <span className={`mt-1 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  ph.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {ph.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden lg:block overflow-visible rounded-xl border border-gray-200 bg-white">
            <div className="overflow-visible rounded-xl">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {columns.map(column => {
                      const isActiveSort = sortConfig.key === column.key
                      return (
                        <th
                           key={column.key}
                           style={{ width: COLUMN_WIDTHS[column.key] }}
                          draggable
                          onDragStart={() => setDraggedColumnKey(column.key)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => moveColumn(draggedColumnKey, column.key)}
                          onDragEnd={() => setDraggedColumnKey(null)}
                           className={`group select-none whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 ${
                            draggedColumnKey === column.key ? 'bg-teal-50' : ''
                          }`}
                          title="Pulsa para ordenar. Arrastra el encabezado para mover la columna."
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSort(column.key)}
                              className="inline-flex items-center gap-1.5 hover:text-teal-700 focus:outline-none"
                            >
                              <span>{column.label}</span>
                              <SortIcon active={isActiveSort} direction={sortConfig.direction} />
                            </button>
                            <Bars3Icon className="w-3.5 h-3.5 cursor-grab text-gray-300 group-hover:text-gray-500" />
                          </div>
                        </th>
                      )
                    })}
                    <th className="w-14 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(ph => (
                    <tr key={ph.id} className="hover:bg-gray-50 transition-colors">
                      {columns.map(column => {
                        const value = getColumnValue(ph, column.key)
                        return (
                          <td key={column.key} className="overflow-hidden px-3 py-3 text-gray-500 align-top">
                            {column.key === 'pharmacy_name' ? (
                              <Link to={`/farmacias/${ph.id}`} className="font-medium text-teal-700 hover:underline">
                                {value || EMPTY_VALUE}
                              </Link>
                            ) : column.key === 'contact_email' && value ? (
                              <a href={`mailto:${value}`} className="block truncate text-teal-700 hover:underline" title={value}>{value}</a>
                            ) : column.key === 'contact_phone' && value ? (
                              <a href={`tel:${value}`} className="block truncate text-teal-700 hover:underline" title={value}>{value}</a>
                            ) : column.key === 'schedule' ? (
                              <ScheduleTooltip pharmacy={ph} />
                            ) : column.key === 'workstations' ? (
                              <div className="min-w-[96px]">
                                <p className="font-medium text-slate-700">{value || EMPTY_VALUE}</p>
                                <p className="truncate text-xs text-slate-400">{getErpLabel(ph) || 'Sin ERP'}</p>
                              </div>
                            ) : column.key === 'owners' ? (
                              <OwnerTooltip pharmacy={ph} />
                            ) : (
                              <span className="block truncate" title={value || EMPTY_VALUE}>{value || EMPTY_VALUE}</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 align-top">
                        <RowActionsMenu pharmacy={ph} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
