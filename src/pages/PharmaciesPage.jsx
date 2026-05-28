import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePharmacies } from '../hooks/usePharmacies'
import {
  MagnifyingGlassIcon, PlusIcon, BuildingStorefrontIcon, MapPinIcon,
  Bars3Icon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline'

const PROVINCE_LABEL = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}
const LEGAL_LABEL = {
  autonomo: 'Autónomo', cb: 'C.B.', sl: 'S.L.',
  autonomo_sl: 'Autónomo + S.L.', cb_sl: 'C.B. + S.L.',
}

const DEFAULT_COLUMNS = [
  { key: 'pharmacy_name', label: 'Nombre de la farmacia' },
  { key: 'owners', label: 'Nombre del titular/es' },
  { key: 'province', label: 'Provincia' },
  { key: 'city', label: 'Población' },
  { key: 'postal_code', label: 'Código postal' },
  { key: 'workstations', label: 'Nº puestos' },
  { key: 'schedule', label: 'Horario' },
  { key: 'contact_phone', label: 'Teléfono' },
  { key: 'contact_email', label: 'Email' },
]

const EMPTY_VALUE = '—'

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

function getWorkstations(pharmacy) {
  const value = pharmacy.equipment?.erp_detail?.puestos
  if (value === null || value === undefined || value === '') return ''
  return String(value)
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

function SortIcon({ active, direction }) {
  if (!active) return <ChevronUpDownIcon className="w-3.5 h-3.5 text-gray-300" />
  return direction === 'asc'
    ? <ChevronUpIcon className="w-3.5 h-3.5 text-teal-600" />
    : <ChevronDownIcon className="w-3.5 h-3.5 text-teal-600" />
}

// ── Skeleton row ────────────────────────────────────────────
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
      {[...Array(DEFAULT_COLUMNS.length)].map((_, i) => (
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
  const [filterProvince, setFilterProvince] = useState('')
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [draggedColumnKey, setDraggedColumnKey] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'pharmacy_name', direction: 'asc' })

  const filtered = useMemo(() => pharmacies.filter(p => {
    const searchValue = [
      p.pharmacy_name,
      getOwners(p),
      PROVINCE_LABEL[p.province] || p.province,
      p.city,
      p.postal_code,
      p.schedule,
      p.contact_phone,
      p.contact_email,
    ].filter(Boolean).join(' ').toLowerCase()

    const matchSearch = searchValue.includes(search.toLowerCase())
    const matchProv   = !filterProvince || p.province === filterProvince
    return matchSearch && matchProv
  }), [pharmacies, search, filterProvince])

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

      {/* Cabecera */}
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

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterProvince}
          onChange={e => setFilterProvince(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[140px]"
        >
          <option value="">Todas</option>
          {provinces.map(p => (
            <option key={p} value={p}>{PROVINCE_LABEL[p] || p}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      {loading ? (
        <>
          {/* Skeleton móvil */}
          <div className="md:hidden space-y-2">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {/* Skeleton desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {DEFAULT_COLUMNS.map(column => (
                    <th key={column.key} className="text-left px-4 py-3 font-medium text-gray-600">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </>
      ) : sorted.length === 0 ? (
        /* Empty state accionable */
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto">
            <BuildingStorefrontIcon className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {search || filterProvince ? 'No hay resultados para tu búsqueda' : 'Aún no hay farmacias'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search || filterProvince
                ? 'Prueba con otros términos o limpia los filtros'
                : 'Empieza añadiendo la primera farmacia'}
            </p>
          </div>
          {!search && !filterProvince && (
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
          {/* MÓVIL — cards */}
          <div className="md:hidden space-y-2">
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
                  <p className="text-xs text-gray-400 mt-0.5">{getOwners(ph) || 'Sin titular informado'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ph.contact_phone || EMPTY_VALUE} · {ph.contact_email || EMPTY_VALUE}</p>
                </div>
                <span className={`mt-1 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  ph.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {ph.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </Link>
            ))}
          </div>

          {/* DESKTOP — tabla */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map(column => {
                    const isActiveSort = sortConfig.key === column.key
                    return (
                      <th
                        key={column.key}
                        draggable
                        onDragStart={() => setDraggedColumnKey(column.key)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => moveColumn(draggedColumnKey, column.key)}
                        onDragEnd={() => setDraggedColumnKey(null)}
                        className={`group select-none whitespace-nowrap px-4 py-3 text-left font-medium text-gray-600 ${
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(ph => (
                  <tr key={ph.id} className="hover:bg-gray-50 transition-colors">
                    {columns.map(column => {
                      const value = getColumnValue(ph, column.key)
                      return (
                        <td key={column.key} className="px-4 py-3 text-gray-500 align-top">
                          {column.key === 'pharmacy_name' ? (
                            <Link to={`/farmacias/${ph.id}`} className="font-medium text-teal-700 hover:underline">
                              {value || EMPTY_VALUE}
                            </Link>
                          ) : column.key === 'contact_email' && value ? (
                            <a href={`mailto:${value}`} className="text-teal-700 hover:underline">{value}</a>
                          ) : column.key === 'contact_phone' && value ? (
                            <a href={`tel:${value}`} className="text-teal-700 hover:underline">{value}</a>
                          ) : (
                            value || EMPTY_VALUE
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
