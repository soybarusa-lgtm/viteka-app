import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingStorefrontIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import PharmacyMetricCard from '../components/pharmacies/PharmacyMetricCard'

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

function parsePersonObservations(observations = '') {
  const raw = String(observations || '')
  const prefix = '__VITEKA_PERSON_META__:'
  if (!raw.startsWith(prefix)) return { responsiblePriority: '' }
  const newlineIndex = raw.indexOf('\n')
  const metaRaw = newlineIndex === -1 ? raw.slice(prefix.length) : raw.slice(prefix.length, newlineIndex)
  try {
    const meta = JSON.parse(metaRaw)
    return { responsiblePriority: String(meta?.responsiblePriority || '') }
  } catch {
    return { responsiblePriority: '' }
  }
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

function isIncomplete(person) {
  return !person.name || !person.role || !person.phone || !person.email
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
    responsiblePriority: parsed.responsiblePriority,
  }
}

export default function PeoplePage() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [pharmacyFilter, setPharmacyFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('')
  const [onlyResponsible, setOnlyResponsible] = useState(false)
  const [onlyIncomplete, setOnlyIncomplete] = useState(false)

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
            pharmacy_name,
            city,
            province
          )
        `)
        .order('name', { ascending: true })

      if (cancelled) return
      setPeople(error ? [] : (data || []).map(normalizePerson))
      setLoading(false)
    }

    loadPeople()
    return () => {
      cancelled = true
    }
  }, [])

  const pharmacyOptions = useMemo(() => [...new Set(people.map(person => person.pharmacyName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [people])
  const roleOptions = useMemo(() => [...new Set(people.map(person => person.role).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [people])
  const provinceOptions = useMemo(() => [...new Set(people.map(person => person.provinceLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [people])

  const filteredPeople = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return people.filter(person => {
      const matchesSearch = !normalizedQuery || normalizeText([
        person.name,
        person.pharmacyName,
        person.role,
        person.phone,
        person.email,
        person.city,
        person.provinceLabel,
      ].filter(Boolean).join(' ')).includes(normalizedQuery)

      return matchesSearch
        && (!pharmacyFilter || person.pharmacyName === pharmacyFilter)
        && (!roleFilter || person.role === roleFilter)
        && (!provinceFilter || person.provinceLabel === provinceFilter)
        && (!onlyResponsible || person.is_responsible)
        && (!onlyIncomplete || isIncomplete(person))
    })
  }, [people, query, pharmacyFilter, roleFilter, provinceFilter, onlyResponsible, onlyIncomplete])

  const metrics = useMemo(() => [
    { label: 'Total personas', value: people.length, hint: 'registro global', icon: UserGroupIcon },
    { label: 'Responsables', value: people.filter(person => person.is_responsible).length, hint: 'contactos clave', icon: ShieldCheckIcon, tone: 'success' },
    { label: 'Farmacias con personas', value: new Set(people.map(person => person.pharmacyId).filter(Boolean)).size, hint: 'cobertura de ficha', icon: BuildingStorefrontIcon, tone: 'info' },
    { label: 'Datos faltantes', value: people.filter(isIncomplete).length, hint: 'teléfono, email o rol', icon: ExclamationTriangleIcon, tone: people.some(isIncomplete) ? 'warning' : 'default' },
  ], [people])

  return (
    <div className="space-y-4 px-3 py-4 sm:px-5 lg:px-6">
      <section className="space-y-4 rounded-[28px] border border-[#DDEAE7] bg-white p-5 shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Red global</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#071A1D]">Personas</h1>
          <p className="mt-2 text-sm text-slate-500">Búsqueda compacta por nombre, farmacia, rol y datos de contacto útiles.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => <PharmacyMetricCard key={metric.label} {...metric} />)}
        </div>
      </section>

      <section className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nombre, farmacia, rol, teléfono o email..." className="w-full rounded-xl border border-[#DDEAE7] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100" />
            </label>
            <select value={pharmacyFilter} onChange={event => setPharmacyFilter(event.target.value)} className="rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">
              <option value="">Farmacia</option>
              {pharmacyOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">
              <option value="">Rol</option>
              {roleOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <select value={provinceFilter} onChange={event => setProvinceFilter(event.target.value)} className="rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">
              <option value="">Provincia</option>
              {provinceOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOnlyResponsible(prev => !prev)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${onlyResponsible ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-[#DDEAE7] bg-white text-slate-500 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'}`}>
              Responsable
            </button>
            <button type="button" onClick={() => setOnlyIncomplete(prev => !prev)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${onlyIncomplete ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-[#DDEAE7] bg-white text-slate-500 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700'}`}>
              Datos incompletos
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-[#DDEAE7] bg-white py-16 shadow-sm"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDEAE7] bg-white py-16 text-center shadow-sm">
          <UserGroupIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-semibold text-[#071A1D]">No hay personas para mostrar</p>
          <p className="mt-1 text-sm text-slate-500">Prueba otra búsqueda o ajusta los filtros.</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Farmacia</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Población</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPeople.map(person => (
                  <tr key={person.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-[#071A1D]">{person.name || '—'}</td>
                    <td className="px-4 py-3"><Link to={`/farmacias/${person.pharmacyId}?tab=people`} className="text-teal-700 hover:underline">{person.pharmacyName}</Link></td>
                    <td className="px-4 py-3 text-slate-600">{person.role || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{person.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{person.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{person.city || '—'}</td>
                    <td className="px-4 py-3">{person.is_responsible ? <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">Sí{person.responsiblePriority ? ` #${person.responsiblePriority}` : ''}</span> : <span className="text-slate-400">No</span>}</td>
                    <td className="px-4 py-3"><Link to={`/farmacias/${person.pharmacyId}?tab=people&legacy=1&action=edit-person&person=${person.id}`} className="text-xs font-semibold text-teal-700 hover:underline">Editar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {filteredPeople.map(person => (
              <article key={person.id} className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#071A1D]">{person.name || '—'}</h2>
                    <p className="mt-1 text-xs font-medium text-teal-700">{person.role || 'Sin rol'}</p>
                  </div>
                  {person.is_responsible ? <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">Responsable</span> : null}
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2"><BuildingStorefrontIcon className="h-4 w-4 text-slate-400" />{person.pharmacyName}</div>
                  <div className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-slate-400" />{person.phone || '—'}</div>
                  <div className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4 text-slate-400" />{person.email || '—'}</div>
                </div>
                <Link to={`/farmacias/${person.pharmacyId}?tab=people&legacy=1&action=edit-person&person=${person.id}`} className="mt-4 inline-flex text-xs font-semibold text-teal-700 hover:underline">Editar ficha</Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
