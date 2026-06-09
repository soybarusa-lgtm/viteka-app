import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BuildingStorefrontIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
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
  if (!raw.startsWith(prefix)) {
    return {
      responsiblePriority: '',
      nixfarmaOperator: '',
    }
  }

  const newlineIndex = raw.indexOf('\n')
  const metaRaw = newlineIndex === -1 ? raw.slice(prefix.length) : raw.slice(prefix.length, newlineIndex)
  try {
    const meta = JSON.parse(metaRaw)
    return {
      responsiblePriority: String(meta?.responsiblePriority || ''),
      nixfarmaOperator: String(meta?.nixfarmaOperator || ''),
    }
  } catch {
    return {
      responsiblePriority: '',
      nixfarmaOperator: '',
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
    responsiblePriority: parsed.responsiblePriority,
    nixfarmaOperator: parsed.nixfarmaOperator,
  }
}

async function copyText(value) {
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

function buildSupportTicketUrl(person) {
  const params = new URLSearchParams({
    create: '1',
    pharmacy_id: person.pharmacyId || '',
    pharmacy_name: person.pharmacyName || '',
    requester_name: person.name || '',
    requester_email: person.email || '',
    subject: `Seguimiento con ${person.name || 'contacto'} · ${person.pharmacyName || 'farmacia'}`,
    type: 'Consulta',
    priority: 'medio',
    product: 'Soporte Técnico - Viteka',
  })
  return `/soporte/tickets?${params.toString()}`
}

function buildProjectUrl(person) {
  const params = new URLSearchParams({
    pharmacy_id: person.pharmacyId || '',
    create: '1',
    type: 'commercial',
    person_name: person.name || '',
  })
  return `/proyectos?${params.toString()}`
}

function buildTaskUrl(person) {
  const params = new URLSearchParams({
    pharmacy_id: person.pharmacyId || '',
    create: '1',
    type: 'support',
    mode: 'task',
    person_name: person.name || '',
  })
  return `/proyectos?${params.toString()}`
}

function PersonRowActions({ person, toast }) {
  const navigate = useNavigate()
  const anchorRef = useRef(null)
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !menuRef.current) return undefined

    function updatePosition() {
      if (!anchorRef.current || !menuRef.current) return
      const anchorRect = anchorRef.current.getBoundingClientRect()
      const menuRect = menuRef.current.getBoundingClientRect()
      const padding = 16
      const gap = 8

      let left = anchorRect.right - menuRect.width
      if (left < padding) left = padding
      if (left + menuRect.width > window.innerWidth - padding) {
        left = window.innerWidth - menuRect.width - padding
      }

      let top = anchorRect.bottom + gap
      if (top + menuRect.height > window.innerHeight - padding) {
        top = anchorRect.top - menuRect.height - gap
      }

      setPosition({ top: Math.max(padding, top), left, ready: true })
    }

    function handlePointerDown(event) {
      if (anchorRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return
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

  const actions = [
    {
      label: 'Editar persona',
      onClick: () => navigate(`/farmacias/${person.pharmacyId}?tab=people&legacy=1&action=edit-person&person=${person.id}`),
    },
    {
      label: 'Abrir farmacia',
      onClick: () => navigate(`/farmacias/${person.pharmacyId}`),
    },
    {
      label: 'Crear ticket',
      onClick: () => navigate(buildSupportTicketUrl(person)),
    },
    {
      label: 'Crear proyecto',
      onClick: () => navigate(buildProjectUrl(person)),
    },
    {
      label: 'Crear tarea',
      onClick: () => navigate(buildTaskUrl(person)),
    },
    {
      label: 'Copiar email',
      disabled: !person.email,
      onClick: async () => {
        const ok = await copyText(person.email)
        toast(ok ? 'Email copiado' : 'No se pudo copiar el email', ok ? 'success' : 'error')
      },
    },
    {
      label: 'Copiar teléfono',
      disabled: !person.phone,
      onClick: async () => {
        const ok = await copyText(person.phone)
        toast(ok ? 'Teléfono copiado' : 'No se pudo copiar el teléfono', ok ? 'success' : 'error')
      },
    },
  ]

  return (
    <div className="flex justify-end">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDEAE7] bg-white text-slate-400 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[120] min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          style={{ top: `${position.top}px`, left: `${position.left}px`, opacity: position.ready ? 1 : 0 }}
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{person.name || 'Sin nombre'}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {person.role || 'Sin rol'}
              {person.is_responsible ? ` · Sí${person.responsiblePriority ? ` #${person.responsiblePriority}` : ''}` : ''}
            </p>
          </div>
          <div className="py-1">
            {actions.map(action => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={async () => {
                  setIsOpen(false)
                  await action.onClick()
                }}
                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default function PeoplePage() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [pharmacyFilter, setPharmacyFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('')
  const [onlyResponsible, setOnlyResponsible] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const navigate = useNavigate()
  const toast = useToast()

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

  const pharmacyOptions = useMemo(
    () => [...new Set(people.map(person => person.pharmacyName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [people],
  )
  const roleOptions = useMemo(
    () => [...new Set(people.map(person => person.role).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [people],
  )
  const provinceOptions = useMemo(
    () => [...new Set(people.map(person => person.provinceLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [people],
  )

  const filteredPeople = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return people.filter(person => {
      const haystack = normalizeText([
        person.name,
        person.pharmacyName,
        person.role,
        person.phone,
        person.email,
        person.city,
        person.provinceLabel,
        person.nixfarmaOperator,
        person.responsiblePriority,
      ].filter(Boolean).join(' '))

      return (!normalizedQuery || haystack.includes(normalizedQuery))
        && (!pharmacyFilter || person.pharmacyName === pharmacyFilter)
        && (!roleFilter || person.role === roleFilter)
        && (!provinceFilter || person.provinceLabel === provinceFilter)
        && (!onlyResponsible || person.is_responsible)
    })
  }, [people, pharmacyFilter, provinceFilter, query, roleFilter, onlyResponsible])

  const metrics = useMemo(() => [
    { label: 'Total personas', value: people.length, hint: 'registro global', icon: UserGroupIcon },
    { label: 'Responsables', value: people.filter(person => person.is_responsible).length, hint: 'contactos clave', icon: ShieldCheckIcon, tone: 'success' },
    { label: 'Grado definido', value: people.filter(person => person.is_responsible && person.responsiblePriority).length, hint: 'responsables con prioridad informada', icon: ShieldCheckIcon, tone: 'info' },
    { label: 'Farmacias cubiertas', value: new Set(people.map(person => person.pharmacyId).filter(Boolean)).size, hint: 'farmacias con personas vinculadas', icon: BuildingStorefrontIcon, tone: 'default' },
  ], [people])

  return (
    <div className="page-wrapper space-y-4">
      <section className="space-y-4 rounded-[28px] border border-[#DDEAE7] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Red global</p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#071A1D]">Personas</h1>
            <p className="mt-2 text-sm text-slate-500">Vista compacta de todos los contactos, responsables y acciones operativas del portal.</p>
          </div>
          <div className="inline-flex rounded-xl border border-[#DDEAE7] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                viewMode === 'cards' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              Tarjetas
            </button>
          </div>
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
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar por nombre, farmacia, rol, teléfono o email..."
                className="w-full rounded-xl border border-[#DDEAE7] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
              />
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
            <button
              type="button"
              onClick={() => setOnlyResponsible(prev => !prev)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                onlyResponsible
                  ? 'border-teal-200 bg-teal-50 text-teal-700'
                  : 'border-[#DDEAE7] bg-white text-slate-500 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              Solo responsables
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-[#DDEAE7] bg-white py-16 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDEAE7] bg-white py-16 text-center shadow-sm">
          <UserGroupIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-semibold text-[#071A1D]">No hay personas para mostrar</p>
          <p className="mt-1 text-sm text-slate-500">Prueba otra búsqueda o ajusta los filtros.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredPeople.map(person => (
            <article key={person.id} className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-[#071A1D]">{person.name || '—'}</h2>
                  <p className="mt-1 text-xs font-medium text-teal-700">{person.role || 'Sin rol'}</p>
                </div>
                <PersonRowActions person={person} toast={toast} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {person.is_responsible ? (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                    Sí{person.responsiblePriority ? ` #${person.responsiblePriority}` : ''}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">No responsable</span>
                )}
                {person.nixfarmaOperator ? (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                    Operador: {person.nixfarmaOperator}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <button type="button" onClick={() => navigate(`/farmacias/${person.pharmacyId}`)} className="flex items-center gap-2 text-left text-teal-700 hover:underline">
                  <BuildingStorefrontIcon className="h-4 w-4 text-slate-400" />
                  {person.pharmacyName}
                </button>
                <div className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-slate-400" />{person.phone || '—'}</div>
                <div className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4 text-slate-400" />{person.email || '—'}</div>
                <div className="text-slate-500">{person.city || '—'}{person.provinceLabel ? ` · ${person.provinceLabel}` : ''}</div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Farmacia</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Operador</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Ciudad</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPeople.map(person => (
                  <tr key={person.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-[#071A1D]">{person.name || '—'}</td>
                    <td className="px-4 py-3">
                      <Link to={`/farmacias/${person.pharmacyId}`} className="text-teal-700 hover:underline">{person.pharmacyName}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{person.role || '—'}</td>
                    <td className="px-4 py-3">
                      {person.is_responsible ? (
                        <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
                          Sí{person.responsiblePriority ? ` #${person.responsiblePriority}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{person.nixfarmaOperator || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{person.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{person.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{person.city || '—'}</td>
                    <td className="px-4 py-3">
                      <PersonRowActions person={person} toast={toast} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
