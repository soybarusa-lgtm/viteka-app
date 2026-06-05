import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { BuildingStorefrontIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, EnvelopeIcon, PhoneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { usePharmacy } from '../../hooks/usePharmacy'
import { usePharmacyDocuments } from '../../hooks/usePharmacyDocuments'
import { useClientTickets } from '../../hooks/useClientTickets'
import { usePasswordManagement } from '../../hooks/usePasswordManagement'
import { canViewClientDashboard } from '../../lib/permissions'

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-teal-700" /> {label}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-950">{value}</p>
    </div>
  )
}

export default function ClientDashboardPage() {
  const { profile, pharmacyId } = useOutletContext()
  const clientProfile = useMemo(() => (pharmacyId ? { ...profile, pharmacy_id: pharmacyId } : profile), [pharmacyId, profile])
  const resolvedPharmacyId = pharmacyId || profile?.pharmacy_id
  const { pharmacy, loading: pharmacyLoading } = usePharmacy(resolvedPharmacyId)
  const { documents } = usePharmacyDocuments(resolvedPharmacyId)
  const { tickets } = useClientTickets(clientProfile)
  const { requestPasswordReset } = usePasswordManagement()
  const [resetEmail, setResetEmail] = useState(profile?.email || '')
  const [resetMessage, setResetMessage] = useState('')

  const visibleDocuments = useMemo(() => (documents || []).filter(doc => doc.visible_to_client !== false), [documents])
  const openTickets = useMemo(() => (tickets || []).filter(ticket => !['resuelto', 'cerrado'].includes(ticket.client_status)), [tickets])
  const canView = canViewClientDashboard(profile, resolvedPharmacyId)

  async function handleReset() {
    setResetMessage('')
    try {
      await requestPasswordReset(resetEmail)
      setResetMessage('Se ha enviado el enlace de recuperacion.')
    } catch (error) {
      setResetMessage(error.message)
    }
  }

  if (!canView) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          No tiene permisos para ver este dashboard.
        </div>
      </div>
    )
  }

  if (pharmacyLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-400 sm:px-6">Cargando dashboard...</div>
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-700">Portal cliente</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-950">{pharmacy?.pharmacy_name || 'Farmacia'}</h1>
                <p className="mt-1 text-sm text-slate-500">{[pharmacy?.city, pharmacy?.province].filter(Boolean).join(', ')}</p>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">Acceso activo</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat label="Tickets abiertos" value={openTickets.length} icon={ChatBubbleLeftRightIcon} />
              <Stat label="Documentos visibles" value={visibleDocuments.length} icon={DocumentTextIcon} />
              <Stat label="Servicios" value={pharmacy?.equipment ? 1 : 0} icon={SparklesIcon} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <BuildingStorefrontIcon className="h-4 w-4 text-teal-700" /> Datos basicos
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-slate-400">Contacto</dt><dd className="font-semibold text-slate-900">{pharmacy?.contact_phone || 'Sin telefono'}</dd></div>
                <div><dt className="text-xs text-slate-400">Email</dt><dd className="font-semibold text-slate-900">{pharmacy?.contact_email || 'Sin email'}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-slate-400">Direccion</dt><dd className="font-semibold text-slate-900">{pharmacy?.address || 'Sin direccion'}</dd></div>
              </dl>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <EnvelopeIcon className="h-4 w-4 text-teal-700" /> Contraseña
              </div>
              <div className="mt-4 space-y-3">
                <input value={resetEmail} onChange={event => setResetEmail(event.target.value)} className="field" placeholder="Email de acceso" />
                <button type="button" onClick={handleReset} className="btn-primary w-full">Solicitar recuperacion</button>
                {resetMessage && <p className="text-xs text-slate-500">{resetMessage}</p>}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <PhoneIcon className="h-4 w-4 text-teal-700" /> Accesos rapidos
            </div>
            <div className="mt-4 grid gap-2">
              <Link to="/cliente/tickets" className="btn-secondary justify-center">Ver tickets</Link>
              <Link to="/cliente/tickets/nuevo" className="btn-ghost border border-slate-200 justify-center">Abrir ticket</Link>
              <a href={`tel:${pharmacy?.contact_phone || ''}`} className="btn-ghost border border-slate-200 justify-center">Llamar a soporte</a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Servicios activos</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pharmacy?.equipment ? <span className="badge-green">Equipamiento activo</span> : <span className="badge-gray">Sin equipamiento</span>}
              {pharmacy?.it ? <span className="badge-blue">Equipos informaticos</span> : <span className="badge-gray">Sin IT</span>}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tickets recientes</p>
          <div className="mt-3 space-y-2">
            {openTickets.slice(0, 5).length ? openTickets.slice(0, 5).map(ticket => (
              <Link key={ticket.id} to={`/cliente/tickets/${ticket.id}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50">
                <span className="truncate text-sm font-semibold text-slate-800">{ticket.subject}</span>
                <span className="text-xs text-slate-400">{ticket.client_status}</span>
              </Link>
            )) : <p className="text-sm text-slate-400">No hay tickets abiertos.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documentos visibles</p>
          <div className="mt-3 space-y-2">
            {visibleDocuments.slice(0, 5).length ? visibleDocuments.slice(0, 5).map(doc => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <span className="truncate text-sm font-semibold text-slate-800">{doc.name || doc.file_name || 'Documento'}</span>
                <span className="text-xs text-slate-400">{doc.category || 'Otros'}</span>
              </div>
            )) : <p className="text-sm text-slate-400">No hay documentos visibles.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
