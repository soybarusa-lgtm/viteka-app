import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { RESPONSIBILITY_AREAS } from '../components/pharmacy/PHARMACY_CONSTANTS'
import {
  MagnifyingGlassIcon,
  UsersIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const EMPTY_VALUE = '—'

const PROVINCE_LABEL = {
  almeria: 'Almería',
  cadiz: 'Cádiz',
  cordoba: 'Córdoba',
  granada: 'Granada',
  huelva: 'Huelva',
  jaen: 'Jaén',
  malaga: 'Málaga',
  sevilla: 'Sevilla',
}

const DEFAULT_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'pharmacyName', label: 'Farmacia' },
  { key: 'role', label: 'Rol' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'Población' },
  { key: 'responsible', label: 'Responsable' },
]

const COLUMN_WIDTHS = {
  name: '17%',
  pharmacyName: '17%',
  role: '14%',
  phone: '12%',
  email: '16%',
  city: '14%',
  responsible: '10%',
}

const DEFAULT_ADVANCED_FILTERS = {
  name: '',
  pharmacy: '',
  role: '',
  province: '',
  city: '',
  phone: '',
  email: '',
  responsible: '',
  responsibleGrades: [],
  areas: [],
}

function parsePersonObservations(observations = '') {
  const raw = String(observations || '')
  const prefix = '__VITEKA_PERSON_META__:'
  if (!raw.startsWith(prefix)) {
    return {
      responsiblePriority: '',
    }
  }

  const newlineIndex = raw.indexOf('\n')
  const metaRaw = newlineIndex === -1 ? raw.slice(prefix.length) : raw.slice(prefix.length, newlineIndex)

  try {
    const meta = JSON.parse(metaRaw)
    return {
      responsiblePriority: String(meta?.responsiblePriority || ''),
    }
  } catch {
    return {
      responsiblePriority: '',
    }
  }
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

function normalizePerson(person) {
  const parsed = parsePersonObservations(person.observations)
  const pharmacy = Array.isArray(person.pharmacy) ? person.pharmacy[0] : person.pharmacy
  return {
    ...person,
    pharmacyName: pharmacy?.pharmacy_name || 'Sin farmacia',
    pharmacyId: pharmacy?.id || person.pharmacy_id,
    city: pharmacy?.city || '',
    province: pharmacy?.province || '',
    provinceLabel: PROVINCE_LABEL[pharmacy?.province] || pharmacy?.province || '',
    areas: Array.isArray(person.areas) ? person.areas : [],
    responsiblePriority: parsed.responsiblePriority,
  }
}

function getSortableValue(person, columnKey) {
  if (columnKey === 'responsible') {
    return person.is_responsible ? `1 ${person.responsiblePriority || ''}` : '0'
  }
  return String(person[columnKey] || '')
}

function SortIcon({ active, direction }) {
  return (
    <span className={`inline-flex text-[11px] ${active ? 'text-teal-600' : 'text-gray-300'}`}>
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )
}

function StatCard({ label, value, Icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className={`inline-flex rounded-lg p-1.5 ring-1 ${tones[tone] || tones.slate}`}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function QuickFilterMenu({
  label,
  options,
  selectedValues,
  onToggleValue,
  onToggleAll,
  onClear,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredOptions = useMemo(() => {
    const term = normalizeText(search)
    if (!term) return options
    return options.filter(option => normalizeText(option).includes(term))
  }, [options, search])

  const allSelected = options.length > 0 && options.every(option => selectedValues.includes(option))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          selectedValues.length > 0
            ? 'border-teal-300 bg-teal-50 text-teal-700'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        {label}
        {selectedValues.length > 0 && (
          <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] font-semibold">
            {selectedValues.length}
          </span>
        )}
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-2 w-[300px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={`Buscar ${label.toLowerCase()}...`}
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              Seleccionar todas
            </label>
            <button type="button" onClick={onClear} className="font-medium text-teal-600 hover:text-teal-700">
              Limpiar
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-sm text-gray-400">Sin resultados</p>
            ) : (
              filteredOptions.map(option => (
                <label key={option} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => onToggleValue(option)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="truncate">{option}</span>
                </label>
              ))
            )}
          </div>
        </div>
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
  pharmacyOptions,
  roleOptions,
  provinceOptions,
  cityOptions,
}) {
  if (!isOpen) return null

  function updateField(key, value) {
    onChange(prev => ({ ...prev, [key]: value }))
  }

  function toggleGrade(grade) {
    onChange(prev => ({
      ...prev,
      responsibleGrades: prev.responsibleGrades.includes(grade)
        ? prev.responsibleGrades.filter(item => item !== grade)
        : [...prev.responsibleGrades, grade],
    }))
  }

  function toggleArea(area) {
    onChange(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(item => item !== area)
        : [...prev.areas, area],
    }))
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 px-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Filtros de personas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Afina la búsqueda por persona, farmacia, rol, ubicación y responsabilidad.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
            <input
              value={filters.name}
              onChange={event => updateField('name', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Farmacia</label>
            <select
              value={filters.pharmacy}
              onChange={event => updateField('pharmacy', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Todas</option>
              {pharmacyOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
            <select
              value={filters.role}
              onChange={event => updateField('role', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Todos</option>
              {roleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Provincia</label>
            <select
              value={filters.province}
              onChange={event => updateField('province', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Todas</option>
              {provinceOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Población</label>
            <select
              value={filters.city}
              onChange={event => updateField('city', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Todas</option>
              {cityOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              value={filters.phone}
              onChange={event => updateField('phone', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              value={filters.email}
              onChange={event => updateField('email', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Responsable</label>
            <select
              value={filters.responsible}
              onChange={event => updateField('responsible', event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Todos</option>
              <option value="yes">Solo responsables</option>
              <option value="no">No responsables</option>
            </select>
            <div className="mt-3 flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5'].map(grade => (
                <label key={grade} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  filters.responsibleGrades.includes(grade)
                    ? 'border-teal-300 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={filters.responsibleGrades.includes(grade)}
                    onChange={() => toggleGrade(grade)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  #{grade}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Áreas de responsabilidad</label>
            <div className="flex flex-wrap gap-2">
              {RESPONSIBILITY_AREAS.map(area => (
                <label key={area} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  filters.areas.includes(area)
                    ? 'border-teal-300 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={filters.areas.includes(area)}
                    onChange={() => toggleArea(area)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Limpiar filtros
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
  )
}

function RowActionsMenu({ person }) {
  const [open, setOpen] = useState(false)
  const editUrl = `/farmacias/${person.pharmacyId}?tab=people&action=edit-person&person=${person.id}`
  const pharmacyUrl = `/farmacias/${person.pharmacyId}?tab=people`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="rounded-xl border border-slate-200 p-2 text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
        title="Acciones rápidas"
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <Link
            to={editUrl}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <PencilSquareIcon className="h-4 w-4 text-teal-600" />
            Editar persona
          </Link>
          <Link
            to={pharmacyUrl}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <BuildingStorefrontIcon className="h-4 w-4 text-teal-600" />
            Ver ficha de la farmacia
          </Link>
          {person.phone && (
            <a
              href={`tel:${person.phone}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <PhoneIcon className="h-4 w-4 text-teal-600" />
              Llamar
            </a>
          )}
          {person.email && (
            <a
              href={`mailto:${person.email}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <EnvelopeIcon className="h-4 w-4 text-teal-600" />
              Enviar email
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function PersonCard({ person }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900">{person.name || 'Sin nombre'}</h2>
          <p className="mt-1 text-xs font-medium text-teal-700">{person.role || 'Sin rol'}</p>
        </div>
        <RowActionsMenu person={person} />
      </div>

      <div className="mt-4 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <BuildingStorefrontIcon className="h-4 w-4 text-slate-400" />
          <Link to={`/farmacias/${person.pharmacyId}?tab=people`} className="truncate text-teal-700 hover:underline">
            {person.pharmacyName}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="h-4 w-4 text-slate-400" />
          <span className="truncate">{person.email || 'Sin email'}</span>
        </div>
        <div className="flex items-center gap-2">
          <BuildingStorefrontIcon className="h-4 w-4 text-slate-400" />
          <span>{person.city || 'Sin población'}</span>
        </div>
        <div className="flex items-center gap-2">
          <BuildingStorefrontIcon className="h-4 w-4 text-slate-400" />
          <span>{person.provinceLabel || 'Sin provincia'}</span>
        </div>
        <div className="flex items-center gap-2">
          <PhoneIcon className="h-4 w-4 text-slate-400" />
          <span>{person.phone || 'Sin teléfono'}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
          <span>{person.is_responsible ? `Sí${person.responsiblePriority ? ` #${person.responsiblePriority}` : ''}` : 'No'}</span>
        </div>
      </div>
    </article>
  )
}

export default function PeoplePage() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [draggedColumnKey, setDraggedColumnKey] = useState(null)
  const [selectedPharmacies, setSelectedPharmacies] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])
  const [selectedProvinces, setSelectedProvinces] = useState([])
  const [advancedFilters, setAdvancedFilters] = useState(DEFAULT_ADVANCED_FILTERS)
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPeople() {
      setLoading(true)
      const { data, error } = await supabase
        .from('pharmacy_persons')
        .select(`
          id,
          pharmacy_id,
          name,
          phone,
          email,
          role,
          is_responsible,
          areas,
          observations,
          pharmacy:pharmacies (
            id,
            pharmacy_name,
            city,
            province
          )
        `)
        .order('name', { ascending: true })

      if (!cancelled) {
        if (error) {
          setPeople([])
        } else {
          setPeople((data || []).map(normalizePerson))
        }
        setLoading(false)
      }
    }

    loadPeople()
    return () => {
      cancelled = true
    }
  }, [])

  const pharmacyOptions = useMemo(
    () => [...new Set(people.map(person => person.pharmacyName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [people]
  )
  const roleOptions = useMemo(
    () => [...new Set(people.map(person => person.role).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [people]
  )
  const cityOptions = useMemo(
    () => [...new Set(people.map(person => person.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [people]
  )
  const provinceOptions = useMemo(
    () => [...new Set(people.map(person => person.provinceLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [people]
  )

  const advancedFilterCount = useMemo(() => {
    let count = 0
    if (selectedPharmacies.length > 0) count += 1
    if (selectedRoles.length > 0) count += 1
    if (selectedProvinces.length > 0) count += 1
    if (advancedFilters.name) count += 1
    if (advancedFilters.pharmacy) count += 1
    if (advancedFilters.role) count += 1
    if (advancedFilters.province) count += 1
    if (advancedFilters.city) count += 1
    if (advancedFilters.phone) count += 1
    if (advancedFilters.email) count += 1
    if (advancedFilters.responsible) count += 1
    if (advancedFilters.responsibleGrades.length > 0) count += 1
    if (advancedFilters.areas.length > 0) count += 1
    return count
  }, [advancedFilters, selectedPharmacies, selectedRoles, selectedProvinces])

  const filteredPeople = useMemo(() => {
    const term = normalizeText(search)

    return people.filter(person => {
      const matchSearch = !term || normalizeText([
        person.name,
        person.role,
        person.phone,
        person.email,
        person.pharmacyName,
        person.city,
        person.provinceLabel || person.province,
        person.is_responsible ? 'responsable' : '',
        person.responsiblePriority,
      ].filter(Boolean).join(' ')).includes(term)

      const matchPharmacy = selectedPharmacies.length === 0 || selectedPharmacies.includes(person.pharmacyName)
      const matchRole = selectedRoles.length === 0 || selectedRoles.includes(person.role)
      const matchProvince = selectedProvinces.length === 0 || selectedProvinces.includes(person.provinceLabel)
      const matchName = !advancedFilters.name || normalizeText(person.name).includes(normalizeText(advancedFilters.name))
      const matchPharmacyText = !advancedFilters.pharmacy || String(person.pharmacyName || '') === advancedFilters.pharmacy
      const matchRoleText = !advancedFilters.role || String(person.role || '') === advancedFilters.role
      const matchProvinceText =
        !advancedFilters.province ||
        String(person.provinceLabel || person.province || '') === advancedFilters.province
      const matchCity = !advancedFilters.city || String(person.city || '') === advancedFilters.city
      const matchPhone = !advancedFilters.phone || normalizeText(person.phone).includes(normalizeText(advancedFilters.phone))
      const matchEmail = !advancedFilters.email || normalizeText(person.email).includes(normalizeText(advancedFilters.email))
      const matchResponsible =
        !advancedFilters.responsible ||
        (advancedFilters.responsible === 'yes' && person.is_responsible) ||
        (advancedFilters.responsible === 'no' && !person.is_responsible)
      const matchResponsibleGrade =
        advancedFilters.responsibleGrades.length === 0 ||
        (person.is_responsible && advancedFilters.responsibleGrades.includes(person.responsiblePriority || ''))
      const matchAreas =
        advancedFilters.areas.length === 0 ||
        advancedFilters.areas.some(area => (person.areas || []).some(personArea => normalizeText(personArea) === normalizeText(area)))

      return matchSearch && matchPharmacy && matchRole && matchProvince && matchName && matchPharmacyText && matchRoleText && matchProvinceText && matchCity && matchPhone && matchEmail && matchResponsible && matchResponsibleGrade && matchAreas
    })
  }, [people, search, selectedPharmacies, selectedRoles, selectedProvinces, advancedFilters])

  const sortedPeople = useMemo(() => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1
    return [...filteredPeople].sort((a, b) => {
      const left = getSortableValue(a, sortConfig.key)
      const right = getSortableValue(b, sortConfig.key)
      return left.localeCompare(right, 'es', { numeric: true, sensitivity: 'base' }) * direction
    })
  }, [filteredPeople, sortConfig])

  const stats = useMemo(() => ({
    total: people.length,
    responsible: people.filter(person => person.is_responsible).length,
    pharmacies: new Set(people.map(person => person.pharmacyId).filter(Boolean)).size,
  }), [people])

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

  function toggleSelectedValue(setter, value) {
    setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value])
  }

  function toggleAll(setter, options) {
    setter(prev => prev.length === options.length ? [] : options)
  }

  function clearAllFilters() {
    setSelectedPharmacies([])
    setSelectedRoles([])
    setSelectedProvinces([])
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS)
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Personas</h1>
        <p className="text-xs md:text-sm text-gray-500">
          {loading ? '…' : `${people.length} registradas`}
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total personas" value={stats.total} Icon={UsersIcon} tone="slate" />
        <StatCard label="Responsables" value={stats.responsible} Icon={ShieldCheckIcon} tone="teal" />
        <StatCard label="Farmacias con personas" value={stats.pharmacies} Icon={BuildingStorefrontIcon} tone="sky" />
      </section>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <div className="relative w-full lg:w-1/2">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar por nombre, farmacia, rol, teléfono o email..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <QuickFilterMenu
            label="Farmacia"
            options={pharmacyOptions}
            selectedValues={selectedPharmacies}
            onToggleValue={value => toggleSelectedValue(setSelectedPharmacies, value)}
            onToggleAll={() => toggleAll(setSelectedPharmacies, pharmacyOptions)}
            onClear={() => setSelectedPharmacies([])}
          />
          <QuickFilterMenu
            label="Rol"
            options={roleOptions}
            selectedValues={selectedRoles}
            onToggleValue={value => toggleSelectedValue(setSelectedRoles, value)}
            onToggleAll={() => toggleAll(setSelectedRoles, roleOptions)}
            onClear={() => setSelectedRoles([])}
          />
          <QuickFilterMenu
            label="Provincias"
            options={provinceOptions}
            selectedValues={selectedProvinces}
            onToggleValue={value => toggleSelectedValue(setSelectedProvinces, value)}
            onToggleAll={() => toggleAll(setSelectedProvinces, provinceOptions)}
            onClear={() => setSelectedProvinces([])}
          />
          <button
            type="button"
            onClick={() => setIsAdvancedFiltersOpen(true)}
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
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Limpiar todo
          </button>
        </div>
      </div>

      <AdvancedFiltersModal
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        onChange={setAdvancedFilters}
        onClear={() => setAdvancedFilters(DEFAULT_ADVANCED_FILTERS)}
        pharmacyOptions={pharmacyOptions}
        roleOptions={roleOptions}
        provinceOptions={provinceOptions}
        cityOptions={cityOptions}
      />

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : sortedPeople.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <UserCircleIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-semibold text-slate-900">No hay personas para mostrar</p>
          <p className="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o ajusta los filtros.</p>
        </div>
      ) : (
        <>
          <section className="grid gap-3 lg:hidden">
            {sortedPeople.map(person => (
              <PersonCard key={person.id} person={person} />
            ))}
          </section>

          <section className="hidden overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-visible rounded-2xl">
              <table className="w-full table-fixed text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {columns.map(column => {
                      const isActiveSort = sortConfig.key === column.key
                      return (
                        <th
                          key={column.key}
                          style={{ width: COLUMN_WIDTHS[column.key] }}
                          draggable
                          onDragStart={() => setDraggedColumnKey(column.key)}
                          onDragOver={event => event.preventDefault()}
                          onDrop={() => moveColumn(draggedColumnKey, column.key)}
                          onDragEnd={() => setDraggedColumnKey(null)}
                          className={`group select-none whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-slate-500 ${
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
                            <Bars3Icon className="h-3.5 w-3.5 cursor-grab text-slate-300 group-hover:text-slate-500" />
                          </div>
                        </th>
                      )
                    })}
                    <th className="w-16 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPeople.map(person => (
                    <tr key={person.id} className="transition-colors hover:bg-slate-50">
                      {columns.map(column => {
                        const value = getSortableValue(person, column.key)
                        return (
                          <td key={column.key} className="overflow-hidden px-4 py-3 align-top text-slate-600">
                            {column.key === 'name' ? (
                              <span className="block truncate font-medium text-slate-900" title={person.name || EMPTY_VALUE}>
                                {person.name || EMPTY_VALUE}
                              </span>
                            ) : column.key === 'pharmacyName' ? (
                              <Link to={`/farmacias/${person.pharmacyId}?tab=people`} className="block truncate text-teal-700 hover:underline" title={person.pharmacyName}>
                                {person.pharmacyName || EMPTY_VALUE}
                              </Link>
                            ) : column.key === 'phone' && person.phone ? (
                              <a href={`tel:${person.phone}`} className="block truncate text-teal-700 hover:underline" title={person.phone}>
                                {person.phone}
                              </a>
                            ) : column.key === 'email' && person.email ? (
                              <a href={`mailto:${person.email}`} className="block truncate text-teal-700 hover:underline" title={person.email}>
                                {person.email}
                              </a>
                            ) : column.key === 'responsible' ? (
                              <span className={person.is_responsible ? 'inline-flex items-center rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700' : ''}>
                                {person.is_responsible ? `Sí${person.responsiblePriority ? ` #${person.responsiblePriority}` : ''}` : 'No'}
                              </span>
                            ) : (
                              <span className="block truncate" title={value || EMPTY_VALUE}>
                                {value || EMPTY_VALUE}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 align-top">
                        <RowActionsMenu person={person} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
