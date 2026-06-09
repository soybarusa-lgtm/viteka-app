import { useEffect, useMemo, useState } from 'react'
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import SupportTicketCreateDrawer from '../../soporte/interno/SupportTicketCreateDrawer'
import PharmacyEmptyState from '../PharmacyEmptyState'
import PharmacyModuleHeader from '../PharmacyModuleHeader'
import PharmacyModuleToolbar from '../PharmacyModuleToolbar'
import { TicketPriorityBadge, TicketStatusBadge } from '../../soporte/shared/SupportBadges'
import { formatTicketNumber, INTERNAL_STATUS_LABELS, PRIORITY_LABELS } from '../../../lib/supportStatus'

function ticketMatchesFilter(ticket, filter) {
  if (filter === 'open') return ['nuevo', 'abierto', 'en_progreso'].includes(ticket.internal_status)
  if (filter === 'waiting') return ['esperando_cliente', 'esperando_proveedor'].includes(ticket.internal_status)
  if (filter === 'urgent') return ticket.priority_internal === 'urgente'
  if (filter === 'unassigned') return !ticket.assigned_agent_id
  return true
}

export default function PharmacyIncidentsTab({
  profile,
  pharmacy,
  tickets = [],
  loading,
  onCreateTicket,
  onUpdateTicket,
  startCreating = false,
}) {
  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [savingId, setSavingId] = useState('')

  const metrics = useMemo(() => {
    const openCount = tickets.filter(ticket => ['nuevo', 'abierto', 'en_progreso'].includes(ticket.internal_status)).length
    const waitingCount = tickets.filter(ticket => ['esperando_cliente', 'esperando_proveedor'].includes(ticket.internal_status)).length
    const urgentCount = tickets.filter(ticket => ticket.priority_internal === 'urgente').length
    return [
      { label: 'Tickets', value: tickets.length, hint: 'incidencias vinculadas', icon: ChatBubbleLeftRightIcon },
      { label: 'Abiertos', value: openCount, hint: 'pendientes de trabajo', icon: ExclamationTriangleIcon, tone: openCount > 0 ? 'warning' : 'default' },
      { label: 'En espera', value: waitingCount, hint: waitingCount > 0 ? 'bloqueados o esperando' : 'sin bloqueos', icon: ExclamationTriangleIcon, tone: waitingCount > 0 ? 'warning' : 'default' },
      { label: 'Urgentes', value: urgentCount, hint: urgentCount > 0 ? 'prioridad critica' : 'sin urgencias', icon: ExclamationTriangleIcon, tone: urgentCount > 0 ? 'warning' : 'default' },
    ]
  }, [tickets])

  const visibleTickets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tickets.filter(ticket => {
      const haystack = [
        ticket.subject,
        ticket.requester_name,
        ticket.product,
        ticket.group_name,
        ticket.internal_status,
        ticket.priority_internal,
      ].filter(Boolean).join(' ').toLowerCase()

      return (!needle || haystack.includes(needle)) && ticketMatchesFilter(ticket, quickFilter)
    })
  }, [query, quickFilter, tickets])

  async function updateField(ticketId, changes) {
    setSavingId(ticketId)
    try {
      await onUpdateTicket(ticketId, changes)
    } finally {
      setSavingId('')
    }
  }

  useEffect(() => {
    if (!startCreating) return undefined
    const frameId = window.requestAnimationFrame(() => setDrawerOpen(true))
    return () => window.cancelAnimationFrame(frameId)
  }, [startCreating])

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Incidencias"
        subtitle="Bandeja interna de tickets relacionados con esta farmacia, con creacion y seguimiento sin abandonar la ficha."
        metrics={metrics}
        actionLabel="Crear ticket"
        actionIcon={PlusIcon}
        onAction={() => setDrawerOpen(true)}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar por asunto, producto, solicitante o grupo..."
        filters={[
          { value: 'all', label: 'Todos' },
          { value: 'open', label: 'Abiertos' },
          { value: 'waiting', label: 'En espera' },
          { value: 'urgent', label: 'Urgentes' },
          { value: 'unassigned', label: 'Sin asignar' },
        ]}
        activeFilter={quickFilter}
        onFilterChange={setQuickFilter}
      />

      {visibleTickets.length === 0 ? (
        <PharmacyEmptyState
          icon={ChatBubbleLeftRightIcon}
          title={tickets.length === 0 ? 'No hay incidencias asociadas.' : 'No hay incidencias con esos filtros.'}
          message={tickets.length === 0 ? 'Crea el primer ticket de soporte desde la propia ficha de farmacia.' : 'Prueba otra busqueda o cambia el filtro activo.'}
          actionLabel="Crear ticket"
          onAction={() => setDrawerOpen(true)}
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#DDEAE7] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-3 py-3">Solicitante</th>
                  <th className="px-3 py-3">Producto</th>
                  <th className="px-3 py-3">Grupo</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Prioridad</th>
                  <th className="px-3 py-3">Actualizado</th>
                  <th className="px-3 py-3 text-right">Abrir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTickets.map(ticket => (
                  <tr key={ticket.id} className="align-top text-slate-600 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="max-w-[280px]">
                        <p className="font-mono text-xs font-bold text-teal-700">{formatTicketNumber(ticket.public_ticket_number)}</p>
                        <p className="mt-1 font-semibold text-slate-900">{ticket.subject}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3">{ticket.requester_name || 'Sin solicitante'}</td>
                    <td className="px-3 py-3">{ticket.product || 'Sin producto'}</td>
                    <td className="px-3 py-3">{ticket.group_name || 'Soporte'}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <TicketStatusBadge status={ticket.internal_status} />
                        <select
                          value={ticket.internal_status || 'nuevo'}
                          onChange={event => updateField(ticket.id, { internal_status: event.target.value })}
                          disabled={savingId === ticket.id}
                          className="rounded-lg border border-[#DDEAE7] px-2 py-1 text-xs text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                        >
                          {Object.entries(INTERNAL_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <TicketPriorityBadge priority={ticket.priority_internal} />
                        <select
                          value={ticket.priority_internal || 'medio'}
                          onChange={event => updateField(ticket.id, { priority_internal: event.target.value, priority_client: event.target.value })}
                          disabled={savingId === ticket.id}
                          className="rounded-lg border border-[#DDEAE7] px-2 py-1 text-xs text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                        >
                          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString('es-ES') : 'Sin fecha'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to={`/soporte/tickets/${ticket.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DDEAE7] px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                      >
                        Abrir <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <SupportTicketCreateDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreate={async payload => {
          await onCreateTicket(payload)
        }}
        prefill={{
          pharmacyId: pharmacy?.id,
          pharmacyName: pharmacy?.pharmacy_name,
          requesterName: profile?.full_name || '',
          requesterEmail: profile?.email || '',
          subject: pharmacy?.pharmacy_name ? `Nueva incidencia · ${pharmacy.pharmacy_name}` : '',
          product: 'Soporte Tecnico - Viteka',
          contextLines: [
            pharmacy?.pharmacy_name ? `Farmacia: ${pharmacy.pharmacy_name}` : '',
            pharmacy?.city ? `Poblacion: ${pharmacy.city}` : '',
          ],
        }}
      />
    </div>
  )
}
