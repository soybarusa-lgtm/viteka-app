import { useMemo, useState } from 'react'
import {
  ExclamationTriangleIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserIcon,
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

export default function PharmacyPeopleTab({
  persons = [],
  loading,
  onCreate,
  onEdit,
  onCreateTicket,
  onPortalAccess,
  toast,
}) {
  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')

  const metrics = useMemo(() => {
    const responsibleCount = persons.filter(person => person.is_responsible).length
    const adjuntos = persons.filter(person => normalizeRole(person.role).includes('adjunto')).length
    const missingData = persons.filter(isIncomplete).length

    return [
      { label: 'Personas', value: persons.length, hint: 'registradas en la farmacia', icon: UserGroupIcon },
      { label: 'Responsables', value: responsibleCount, hint: responsibleCount > 0 ? 'roles clave operativos' : 'sin responsables marcados', icon: ShieldCheckIcon, tone: 'success' },
      { label: 'Adjuntos', value: adjuntos, hint: adjuntos > 0 ? 'personal farmacéutico' : 'sin adjuntos detectados', icon: UserIcon, tone: 'info' },
      { label: 'Faltantes', value: missingData, hint: missingData > 0 ? 'datos críticos por completar' : 'sin faltantes críticos', icon: ExclamationTriangleIcon, tone: missingData > 0 ? 'warning' : 'default' },
    ]
  }, [persons])

  const visiblePeople = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return persons.filter(person => {
      const meta = parsePersonObservations(person.observations)
      const haystack = [
        person.name,
        person.role,
        person.phone,
        person.email,
        meta.nixfarmaOperator,
        meta.notes,
        ...(Array.isArray(person.areas) ? person.areas : []),
      ].filter(Boolean).join(' ').toLocaleLowerCase('es')

      const passesSearch = !normalizedQuery || haystack.includes(normalizedQuery)
      const role = normalizeRole(person.role)

      let passesFilter = true
      if (quickFilter === 'titulares') passesFilter = role.includes('titular')
      if (quickFilter === 'responsables') passesFilter = Boolean(person.is_responsible)
      if (quickFilter === 'adjuntos') passesFilter = role.includes('adjunto')
      if (quickFilter === 'incomplete') passesFilter = isIncomplete(person)

      return passesSearch && passesFilter
    })
  }, [persons, query, quickFilter])

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Personas operativas"
        subtitle="Responsables, roles y contacto útil de la farmacia. La edición profunda sigue disponible sin perder el foco operativo de esta vista."
        metrics={metrics}
        actionLabel="+ Añadir persona"
        actionIcon={PlusIcon}
        onAction={onCreate}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar persona, rol, teléfono o email..."
        filters={[
          { value: 'all', label: 'Todos' },
          { value: 'titulares', label: 'Titulares' },
          { value: 'responsables', label: 'Responsables' },
          { value: 'adjuntos', label: 'Adjuntos' },
          { value: 'incomplete', label: 'Datos incompletos' },
        ]}
        activeFilter={quickFilter}
        onFilterChange={setQuickFilter}
      />

      {visiblePeople.length === 0 ? (
        <PharmacyEmptyState
          icon={UserGroupIcon}
          title={persons.length === 0 ? 'No hay personas asociadas.' : 'No hay personas con esos filtros.'}
          message={persons.length === 0 ? 'Puedes dar de alta la primera persona o preparar la importación desde otra farmacia cuando ese flujo quede activado.' : 'Prueba otra búsqueda o cambia el filtro activo.'}
          actionLabel="Añadir persona"
          onAction={onCreate}
          secondaryActionLabel="Importar desde otra farmacia"
          secondaryDisabled
        />
      ) : (
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
      )}
    </div>
  )
}
