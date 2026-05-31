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
} from '@heroicons/react/24/outline'

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

function PersonCard({ person }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900">{person.name || 'Sin nombre'}</h2>
          <p className="mt-1 text-xs font-medium text-teal-700">{person.role || 'Sin rol'}</p>
        </div>
        {person.is_responsible && (
          <span className="inline-flex shrink-0 items-center rounded-full bg-teal-50 px-2 py-1 text-[11px] font-medium text-teal-700">
            Resp. {person.responsiblePriority ? `#${person.responsiblePriority}` : ''}
          </span>
        )}
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

  const stats = useMemo(() => ({
    total: people.length,
    responsible: people.filter(person => person.is_responsible).length,
    pharmacies: new Set(people.map(person => person.pharmacyId).filter(Boolean)).size,
  }), [people])

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
          ) : filteredPeople.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
              <UserCircleIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-semibold text-slate-900">No hay personas para mostrar</p>
              <p className="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o registra personas desde una farmacia.</p>
            </div>
          ) : (
            <>
              <section className="grid gap-3 lg:hidden">
                {filteredPeople.map(person => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </section>

              <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-4">Nombre</th>
                        <th className="px-5 py-4">Farmacia</th>
                        <th className="px-5 py-4">Rol</th>
                        <th className="px-5 py-4">Teléfono</th>
                        <th className="px-5 py-4">Email</th>
                        <th className="px-5 py-4">Responsable</th>
                        <th className="px-5 py-4">Grado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPeople.map(person => (
                        <tr key={person.id} className="border-t border-slate-100 text-sm text-slate-700">
                          <td className="px-5 py-4 font-medium text-slate-900">{person.name || 'Sin nombre'}</td>
                          <td className="px-5 py-4">
                            <Link to={`/farmacias/${person.pharmacyId}?tab=people`} className="text-teal-700 hover:underline">
                              {person.pharmacyName}
                            </Link>
                          </td>
                          <td className="px-5 py-4">{person.role || 'Sin rol'}</td>
                          <td className="px-5 py-4">{person.phone || '—'}</td>
                          <td className="px-5 py-4">{person.email || '—'}</td>
                          <td className="px-5 py-4">
                            {person.is_responsible ? (
                              <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                                Sí
                              </span>
                            ) : (
                              'No'
                            )}
                          </td>
                          <td className="px-5 py-4">{person.is_responsible ? (person.responsiblePriority || '—') : '—'}</td>
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
