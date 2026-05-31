import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
} from '@heroicons/react/24/outline'

const EMPTY_VALUE = '—'

const COLUMN_WIDTHS = {
  name: '18%',
  pharmacyName: '18%',
  role: '14%',
  phone: '14%',
  email: '20%',
  responsible: '8%',
  grade: '8%',
}

const DEFAULT_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'pharmacyName', label: 'Farmacia' },
  { key: 'role', label: 'Rol' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'responsible', label: 'Responsable' },
  { key: 'grade', label: 'Grado' },
]

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

function normalizePerson(person) {
  const parsed = parsePersonObservations(person.observations)
  const pharmacy = Array.isArray(person.pharmacy) ? person.pharmacy[0] : person.pharmacy
  return {
    ...person,
    pharmacyName: pharmacy?.pharmacy_name || 'Sin farmacia',
    pharmacyId: pharmacy?.id || person.pharmacy_id,
    responsiblePriority: parsed.responsiblePriority,
  }
}

function getSortableValue(person, columnKey) {
  if (columnKey === 'responsible') return person.is_responsible ? '1' : '0'
  if (columnKey === 'grade') return person.responsiblePriority || ''
  return person[columnKey] || ''
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
          <PhoneIcon className="h-4 w-4 text-slate-400" />
          <span>{person.phone || 'Sin teléfono'}</span>
        </div>
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="h-4 w-4 text-slate-400" />
          <span className="truncate">{person.email || 'Sin email'}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
          <span>{person.is_responsible ? `Sí${person.responsiblePriority ? ` · grado ${person.responsiblePriority}` : ''}` : 'No'}</span>
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
          observations,
          pharmacy:pharmacies (
            id,
            pharmacy_name
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

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    if (!term) return people

    return people.filter(person => (
      [
        person.name,
        person.role,
        person.phone,
        person.email,
        person.pharmacyName,
        person.is_responsible ? 'responsable' : '',
        person.responsiblePriority,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es')
        .includes(term)
    ))
  }, [people, search])

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <div className="flex flex-col gap-5">
          <header className="flex flex-col gap-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Personas</h1>
              <p className="mt-1 text-sm text-slate-500">
                Listado global de personas registradas en todas las farmacias.
              </p>
            </div>
          </header>

          <section className="grid gap-3 md:grid-cols-3">
            <StatCard label="Total personas" value={stats.total} Icon={UsersIcon} tone="slate" />
            <StatCard label="Responsables" value={stats.responsible} Icon={ShieldCheckIcon} tone="teal" />
            <StatCard label="Farmacias con personas" value={stats.pharmacies} Icon={BuildingStorefrontIcon} tone="sky" />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="relative max-w-2xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar por nombre, farmacia, rol, teléfono o email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </section>

          {loading ? (
            <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>
          ) : sortedPeople.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
              <UserCircleIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-semibold text-slate-900">No hay personas para mostrar</p>
              <p className="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o registra personas desde una farmacia.</p>
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
                                  person.is_responsible ? (
                                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                                      Sí
                                    </span>
                                  ) : 'No'
                                ) : column.key === 'grade' ? (
                                  <span>{person.is_responsible ? (person.responsiblePriority || EMPTY_VALUE) : EMPTY_VALUE}</span>
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
      </div>
    </div>
  )
}
