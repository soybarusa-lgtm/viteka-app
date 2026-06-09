import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EllipsisVerticalIcon,
  ListBulletIcon,
  PlusIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import PharmacyEmptyState from '../PharmacyEmptyState'
import PharmacyModuleHeader from '../PharmacyModuleHeader'
import PharmacyModuleToolbar from '../PharmacyModuleToolbar'
import PharmacyPersonCard from '../people/PharmacyPersonCard'

function parsePersonObservations(observations = '') {
  const raw = String(observations || '')
  const prefix = '__VITEKA_PERSON_META__:'
  if (!raw.startsWith(prefix)) {
    return {
      notes: raw,
      responsiblePriority: '',
      nixfarmaOperator: '',
      seniorityMonth: '',
      seniorityYear: '',
    }
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

function normalizeRole(role) {
  return String(role || '').toLocaleLowerCase('es')
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

function formatSince(meta) {
  const parts = [meta.seniorityMonth, meta.seniorityYear].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : ''
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

function PersonActionsMenu({
  person,
  meta,
  toast,
  onEdit,
  onTicket,
  onProject,
  onTask,
  onPortalAccess,
}) {
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

      setPosition({
        top: Math.max(padding, top),
        left,
        ready: true,
      })
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
    { label: 'Editar', onClick: onEdit },
    { label: 'Crear ticket', onClick: onTicket },
    { label: 'Crear proyecto', onClick: onProject },
    { label: 'Crear tarea', onClick: onTask },
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
    { label: 'Acceso portal', onClick: onPortalAccess },
  ]

  return (
    <div className="flex justify-end">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDEAE7] bg-white text-slate-400 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        aria-label={`Acciones de ${person.name || 'persona'}`}
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
              {person.is_responsible ? ` · Responsable${meta.responsiblePriority ? ` #${meta.responsiblePriority}` : ''}` : ''}
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
                  await action.onClick?.()
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

export default function PharmacyPeopleTab({
  persons = [],
  loading,
  onCreate,
  onEdit,
  onCreateTicket,
  onCreateProject,
  onCreateTask,
  onPortalAccess,
  toast,
}) {
  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list')

  const metrics = useMemo(() => {
    const responsibleCount = persons.filter(person => person.is_responsible).length
    const responsibleWithPriority = persons.filter(person => {
      if (!person.is_responsible) return false
      const meta = parsePersonObservations(person.observations)
      return Boolean(meta.responsiblePriority)
    }).length
    return [
      { label: 'Personas', value: persons.length, hint: 'registradas en esta farmacia', icon: UserGroupIcon },
      { label: 'Responsables', value: responsibleCount, hint: 'contactos operativos clave', icon: ShieldCheckIcon, tone: 'success' },
      { label: 'Grado definido', value: responsibleWithPriority, hint: 'prioridades de responsable informadas', icon: ShieldCheckIcon, tone: 'info' },
    ]
  }, [persons])

  const visiblePeople = useMemo(() => {
    const normalizedQuery = normalizeText(query)
    return persons.filter(person => {
      const meta = parsePersonObservations(person.observations)
      const haystack = normalizeText([
        person.name,
        person.role,
        person.phone,
        person.email,
        meta.nixfarmaOperator,
        meta.notes,
        meta.responsiblePriority,
        ...(Array.isArray(person.areas) ? person.areas : []),
      ].filter(Boolean).join(' '))

      const passesSearch = !normalizedQuery || haystack.includes(normalizedQuery)
      const role = normalizeRole(person.role)

      let passesFilter = true
      if (quickFilter === 'titulares') passesFilter = role.includes('titular')
      if (quickFilter === 'responsables') passesFilter = Boolean(person.is_responsible)
      if (quickFilter === 'adjuntos') passesFilter = role.includes('adjunto')

      return passesSearch && passesFilter
    })
  }, [persons, query, quickFilter])

  const headerActions = (
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
  )

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Personas operativas"
        subtitle="Responsables, roles y contacto útil de la farmacia. Puedes trabajar en lista o en tarjetas y lanzar acciones rápidas desde cada persona."
        metrics={metrics}
        actionLabel="+ Añadir persona"
        actionIcon={PlusIcon}
        onAction={onCreate}
        extraActions={headerActions}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar persona, rol, teléfono, email o área..."
        filters={[
          { value: 'all', label: 'Todos' },
          { value: 'titulares', label: 'Titulares' },
          { value: 'responsables', label: 'Responsables' },
          { value: 'adjuntos', label: 'Adjuntos' },
        ]}
        activeFilter={quickFilter}
        onFilterChange={setQuickFilter}
      />

      {visiblePeople.length === 0 ? (
        <PharmacyEmptyState
          icon={UserGroupIcon}
          title={persons.length === 0 ? 'No hay personas asociadas.' : 'No hay personas con esos filtros.'}
          message={persons.length === 0 ? 'Puedes dar de alta la primera persona desde esta misma ficha.' : 'Prueba otra búsqueda o cambia el filtro activo.'}
          actionLabel="Añadir persona"
          onAction={onCreate}
        />
      ) : viewMode === 'cards' ? (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {visiblePeople.map(person => {
            const meta = parsePersonObservations(person.observations)
            const responsibleLabel = person.is_responsible
              ? `Responsable${meta.responsiblePriority ? ` #${meta.responsiblePriority}` : ''}`
              : ''

            return (
              <PharmacyPersonCard
                key={person.id}
                name={person.name || 'Sin nombre'}
                role={person.role || 'Sin rol'}
                responsibleLabel={responsibleLabel}
                phone={person.phone}
                email={person.email}
                nixfarmaOperator={meta.nixfarmaOperator}
                since={formatSince(meta)}
                areas={Array.isArray(person.areas) ? person.areas : []}
                notes={meta.notes}
                isResponsible={Boolean(person.is_responsible)}
                isIncomplete={isIncomplete(person)}
                onEdit={() => onEdit(person)}
                onTicket={() => onCreateTicket(person)}
                onProject={() => onCreateProject?.(person)}
                onTask={() => onCreateTask?.(person)}
                onCopyEmail={async () => {
                  const ok = await copyText(person.email)
                  toast(ok ? 'Email copiado' : 'No se pudo copiar el email', ok ? 'success' : 'error')
                }}
                onCopyPhone={async () => {
                  const ok = await copyText(person.phone)
                  toast(ok ? 'Teléfono copiado' : 'No se pudo copiar el teléfono', ok ? 'success' : 'error')
                }}
                onPortalAccess={() => onPortalAccess(person)}
              />
            )
          })}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-3 py-3">Rol</th>
                  <th className="px-3 py-3">Responsable</th>
                  <th className="px-3 py-3">Operador</th>
                  <th className="px-3 py-3">Teléfono</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Áreas</th>
                  <th className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePeople.map(person => {
                  const meta = parsePersonObservations(person.observations)
                  return (
                    <tr key={person.id} className="align-top text-slate-600 hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{person.name || 'Sin nombre'}</p>
                        {meta.notes ? <p className="mt-1 max-w-[280px] text-xs text-slate-400">{meta.notes}</p> : null}
                      </td>
                      <td className="px-3 py-3">{person.role || 'Sin rol'}</td>
                      <td className="px-3 py-3">
                        {person.is_responsible ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Sí{meta.responsiblePriority ? ` #${meta.responsiblePriority}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-3 py-3">{meta.nixfarmaOperator || '—'}</td>
                      <td className="px-3 py-3">{person.phone || '—'}</td>
                      <td className="px-3 py-3">{person.email || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex max-w-[200px] flex-wrap gap-1.5">
                          {(Array.isArray(person.areas) ? person.areas : []).length > 0
                            ? person.areas.map(area => (
                              <span key={`${person.id}-${area}`} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                {area}
                              </span>
                            ))
                            : <span className="text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <PersonActionsMenu
                          person={person}
                          meta={meta}
                          toast={toast}
                          onEdit={() => onEdit(person)}
                          onTicket={() => onCreateTicket(person)}
                          onProject={() => onCreateProject?.(person)}
                          onTask={() => onCreateTask?.(person)}
                          onPortalAccess={() => onPortalAccess(person)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
