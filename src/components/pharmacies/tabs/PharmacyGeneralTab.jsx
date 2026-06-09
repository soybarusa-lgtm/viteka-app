import { useEffect, useMemo, useState } from 'react'
import {
  BuildingStorefrontIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import EditGeneralModal from '../../pharmacy/EditGeneralModal'
import PharmacyEditDrawer from '../../pharmacy/PharmacyEditDrawer'
import PharmacyModuleHeader from '../PharmacyModuleHeader'
import PharmacyModuleToolbar from '../PharmacyModuleToolbar'
import PharmacySectionCard from '../PharmacySectionCard'
import { getScheduleDayRows, getScheduleOptionLabels, parseScheduleValue } from '../../../lib/pharmacySchedule'

const PROVINCE_LABEL = {
  almeria: 'Almeria',
  cadiz: 'Cadiz',
  cordoba: 'Cordoba',
  granada: 'Granada',
  huelva: 'Huelva',
  jaen: 'Jaen',
  malaga: 'Malaga',
  sevilla: 'Sevilla',
}

const LEGAL_LABEL = {
  autonomo: 'Persona Juridica',
  cb: 'C.B.',
  sl: 'S.L.',
  autonomo_sl: 'Persona Juridica + S.L.',
  cb_sl: 'C.B. + S.L.',
}

function InfoRow({ label, value, emptyText = 'Sin informar' }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className={`text-sm ${value ? 'font-semibold text-slate-800' : 'italic text-slate-400'}`}>{value || emptyText}</span>
    </div>
  )
}

function matchesQuery(query, values) {
  if (!query) return true
  const needle = query.trim().toLowerCase()
  return values.filter(Boolean).join(' ').toLowerCase().includes(needle)
}

export default function PharmacyGeneralTab({ pharmacy, onSaved, startEditing = false }) {
  const [query, setQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openSections, setOpenSections] = useState({
    identity: true,
    contact: true,
    location: true,
    schedule: true,
  })

  const schedule = useMemo(() => parseScheduleValue(pharmacy?.schedule || ''), [pharmacy?.schedule])
  const scheduleRows = useMemo(() => getScheduleDayRows(schedule.detail), [schedule.detail])
  const scheduleOptions = useMemo(() => getScheduleOptionLabels(schedule.detail), [schedule.detail])
  const locationLine = [pharmacy?.city, PROVINCE_LABEL[pharmacy?.province] || pharmacy?.province, pharmacy?.postal_code].filter(Boolean).join(' · ')
  const legalTypeLabel = LEGAL_LABEL[pharmacy?.legal_type] || pharmacy?.legal_type || 'Sin definir'
  const ownerSummary = pharmacy?.owner_name || pharmacy?.razon_social || pharmacy?.pharmacy_name || 'Sin titular'

  const metrics = [
    { label: 'Titular', value: ownerSummary, hint: 'identidad principal', icon: BuildingStorefrontIcon },
    { label: 'Contacto', value: pharmacy?.contact_phone || '—', hint: pharmacy?.contact_email || 'sin email', icon: PhoneIcon, tone: 'info' },
    { label: 'Ubicacion', value: pharmacy?.city || '—', hint: pharmacy?.province || 'sin provincia', icon: MapPinIcon, tone: 'default' },
    { label: 'Horario', value: schedule.summary || 'Sin horario', hint: pharmacy?.has_guards ? 'con guardias' : 'sin guardias', icon: ClockIcon, tone: 'success' },
  ]

  const sectionVisibility = {
    identity: matchesQuery(query, [pharmacy?.pharmacy_name, legalTypeLabel, pharmacy?.owner_name, pharmacy?.razon_social, pharmacy?.nif, pharmacy?.cif, pharmacy?.soe_number]),
    contact: matchesQuery(query, [pharmacy?.contact_phone, pharmacy?.contact_email, pharmacy?.observations]),
    location: matchesQuery(query, [pharmacy?.address, pharmacy?.city, pharmacy?.province, pharmacy?.postal_code]),
    schedule: matchesQuery(query, [schedule.summary, schedule.guardNotes, ...scheduleOptions, ...scheduleRows.map(row => `${row.day} ${row.hours}`)]),
  }

  const visibleSectionCount = Object.values(sectionVisibility).filter(Boolean).length

  useEffect(() => {
    if (!startEditing) return undefined
    const frameId = window.requestAnimationFrame(() => setDrawerOpen(true))
    return () => window.cancelAnimationFrame(frameId)
  }, [startEditing])

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Datos generales"
        subtitle="Identidad, contacto, ubicacion y horario de la farmacia en una vista unica y editable sin salir de la ficha."
        metrics={metrics}
        actionLabel="Editar datos"
        actionIcon={PencilSquareIcon}
        onAction={() => setDrawerOpen(true)}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar en datos generales..."
        rightSlot={visibleSectionCount < 4 ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="rounded-xl border border-[#DDEAE7] bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          >
            Limpiar busqueda
          </button>
        ) : null}
      />

      <div className="space-y-4">
        {sectionVisibility.identity ? (
          <PharmacySectionCard
            title="Identidad legal"
            subtitle="Datos societarios y registrales de la farmacia."
            isOpen={openSections.identity}
            onToggle={() => setOpenSections(current => ({ ...current, identity: !current.identity }))}
            actionLabel="Editar"
            actionIcon={PencilSquareIcon}
            onAction={() => setDrawerOpen(true)}
          >
            <div className="space-y-3">
              <InfoRow label="Nombre" value={pharmacy?.pharmacy_name} />
              <InfoRow label="Tipo" value={legalTypeLabel} />
              <InfoRow label="Titular" value={pharmacy?.owner_name} />
              <InfoRow label="Razon social" value={pharmacy?.razon_social} />
              <InfoRow label="NIF / CIF" value={[pharmacy?.nif, pharmacy?.cif].filter(Boolean).join(' · ')} />
              <InfoRow label="Colegiado" value={pharmacy?.collegiate_number} />
              <InfoRow label="SOE" value={pharmacy?.soe_number} />
            </div>
          </PharmacySectionCard>
        ) : null}

        {sectionVisibility.contact ? (
          <PharmacySectionCard
            title="Contacto"
            subtitle="Canales principales para relacion operativa con la farmacia."
            isOpen={openSections.contact}
            onToggle={() => setOpenSections(current => ({ ...current, contact: !current.contact }))}
          >
            <div className="space-y-3">
              <InfoRow label="Telefono" value={pharmacy?.contact_phone} />
              <InfoRow label="Email" value={pharmacy?.contact_email} />
              <InfoRow label="Observaciones" value={pharmacy?.observations} />
            </div>
          </PharmacySectionCard>
        ) : null}

        {sectionVisibility.location ? (
          <PharmacySectionCard
            title="Ubicacion"
            subtitle="Direccion y contexto geogra fico de la farmacia."
            isOpen={openSections.location}
            onToggle={() => setOpenSections(current => ({ ...current, location: !current.location }))}
          >
            <div className="space-y-3">
              <InfoRow label="Direccion" value={pharmacy?.address} />
              <InfoRow label="Localizacion" value={locationLine} />
              <InfoRow label="Provincia" value={PROVINCE_LABEL[pharmacy?.province] || pharmacy?.province} />
            </div>
          </PharmacySectionCard>
        ) : null}

        {sectionVisibility.schedule ? (
          <PharmacySectionCard
            title="Horario y guardias"
            subtitle="Resumen horario con detalle por dias y aperturas especiales."
            isOpen={openSections.schedule}
            onToggle={() => setOpenSections(current => ({ ...current, schedule: !current.schedule }))}
          >
            <div className="space-y-3">
              <InfoRow label="Resumen" value={schedule.summary} />
              <InfoRow label="Guardias" value={pharmacy?.has_guards ? 'Si' : 'No'} />
              {scheduleRows.length > 0 ? (
                <div className="rounded-xl border border-[#DDEAE7] bg-slate-50/80 p-3">
                  <div className="space-y-2">
                    {scheduleRows.map(row => (
                      <div key={row.day} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-700">{row.day}</span>
                        <span className="text-slate-500">{row.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {scheduleOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {scheduleOptions.map(option => (
                    <span key={option} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      {option}
                    </span>
                  ))}
                </div>
              ) : null}
              {schedule.guardNotes ? <InfoRow label="Notas guardia" value={schedule.guardNotes} /> : null}
            </div>
          </PharmacySectionCard>
        ) : null}
      </div>

      <PharmacyEditDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Editar datos generales"
        subtitle={pharmacy?.pharmacy_name || ''}
      >
        <EditGeneralModal
          pharmacy={pharmacy}
          onClose={() => setDrawerOpen(false)}
          onSaved={() => {
            setDrawerOpen(false)
            onSaved?.()
          }}
        />
      </PharmacyEditDrawer>
    </div>
  )
}
