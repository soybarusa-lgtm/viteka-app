import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDownTrayIcon, MagnifyingGlassIcon, PlusIcon, TicketIcon } from '@heroicons/react/24/outline'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import SupportTicketCreateDrawer from '../../components/soporte/interno/SupportTicketCreateDrawer'
import SupportPageHeader from '../../components/soporte/shared/SupportPageHeader'
import { TicketPriorityBadge, TicketStatusBadge } from '../../components/soporte/shared/SupportBadges'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../hooks/useAuth'
import { useSupportTickets } from '../../hooks/useSupportTickets'
import { exportToCsv, exportToJson, exportToPdf, exportToTxt } from '../../lib/supportExports'
import { formatSupportDate, normalizeSearch } from '../../lib/supportFormatters'
import { formatTicketNumber } from '../../lib/supportStatus'

const VIEWS = ['Nuevos y abiertos', 'Todos los tickets', 'Sin resolver', 'Archivados', 'Sin asignar']

function matchesView(ticket, view) {
  if (view === 'Todos los tickets') return true
  if (view === 'Archivados') return ticket.internal_status === 'archivado'
  if (view === 'Sin resolver') return !['resuelto', 'cerrado', 'archivado'].includes(ticket.internal_status)
  if (view === 'Sin asignar') return !ticket.assigned_agent_name && !ticket.group_name
  return ['nuevo', 'abierto', 'en_progreso', 'esperando_cliente', 'esperando_proveedor'].includes(ticket.internal_status)
}

function pickSearchPrefill(searchParams) {
  const personName = searchParams.get('person_name') || searchParams.get('requester_name') || ''
  const personEmail = searchParams.get('person_email') || searchParams.get('requester_email') || ''
  const projectName = searchParams.get('project_name') || ''
  const assetLabel = searchParams.get('asset_label') || ''

  return {
    pharmacyId: searchParams.get('pharmacy_id') || '',
    pharmacyName: searchParams.get('pharmacy_name') || '',
    requesterName: personName,
    requesterEmail: personEmail,
    subject: searchParams.get('subject') || '',
    type: searchParams.get('type') || 'Incidencia',
    priority: searchParams.get('priority') || 'medio',
    product: searchParams.get('product') || 'Soporte Técnico - Viteka',
    description: searchParams.get('description') || '',
    relatedProjectId: searchParams.get('project_id') || '',
    relatedProjectName: projectName,
    contextLines: [
      searchParams.get('pharmacy_name') ? `Farmacia: ${searchParams.get('pharmacy_name')}` : '',
      projectName ? `Proyecto: ${projectName}` : '',
      assetLabel ? `Equipo: ${assetLabel}` : '',
      personName ? `Contacto: ${personName}` : '',
    ].filter(Boolean),
  }
}

export default function SupportTicketsPage() {
  const { profile } = useAuth()
  const { tickets, loading, createTicket } = useSupportTickets(profile)
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [view, setView] = useState('Nuevos y abiertos')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')

  const createOpen = searchParams.get('create') === '1'
  const contextPharmacyId = searchParams.get('pharmacy_id') || ''
  const contextPharmacyName = searchParams.get('pharmacy_name') || ''
  const contextProjectId = searchParams.get('project_id') || ''
  const contextProjectName = searchParams.get('project_name') || ''
  const createPrefill = useMemo(() => pickSearchPrefill(searchParams), [searchParams])

  const filtered = useMemo(() => tickets
    .filter(ticket => !contextPharmacyId || ticket.pharmacy_id === contextPharmacyId)
    .filter(ticket => {
      if (!contextProjectId) return true
      const relatedProjectId = ticket.related_project_id || ticket.project_id || ''
      return String(relatedProjectId) === String(contextProjectId)
        || (!relatedProjectId && contextPharmacyId && ticket.pharmacy_id === contextPharmacyId)
    })
    .filter(ticket => matchesView(ticket, view))
    .filter(ticket => status === 'all' || ticket.internal_status === status)
    .filter(ticket => priority === 'all' || ticket.priority_internal === priority)
    .filter(ticket => normalizeSearch([
      ticket.subject,
      ticket.pharmacy_name,
      ticket.requester_name,
      ticket.requester_email,
      ticket.product,
      ticket.public_ticket_number,
      ticket.related_project_name,
    ].join(' ')).includes(normalizeSearch(search))), [contextPharmacyId, contextProjectId, priority, search, status, tickets, view])

  function openCreate(extra = {}) {
    const next = new URLSearchParams(searchParams)
    next.set('create', '1')
    Object.entries(extra).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next, { replace: false })
  }

  function closeCreate() {
    const next = new URLSearchParams(searchParams)
    ;['create', 'subject', 'type', 'priority', 'product', 'description', 'person_name', 'person_email', 'requester_name', 'requester_email', 'asset_label'].forEach(key => next.delete(key))
    setSearchParams(next, { replace: true })
  }

  async function handleCreate(payload) {
    const ticket = await createTicket(payload)
    toast('Ticket creado correctamente.', 'success')
    navigate(`/soporte/tickets/${ticket.id}`)
  }

  return (
    <InternalSupportFrame>
      <SupportPageHeader
        title="Tickets"
        detail={contextProjectName ? `Tickets vinculados al proyecto ${contextProjectName}.` : contextPharmacyName ? `Tickets vinculados a ${contextPharmacyName}.` : 'Bandeja única para incidencias, consultas y peticiones de las farmacias.'}
        actions={<button type="button" onClick={() => openCreate()} className="btn-primary"><PlusIcon className="h-4 w-4" /> Nuevo ticket</button>}
      />
      <div className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)_220px]">
        <aside className="card h-fit p-2">
          <p className="px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Vistas</p>
          {VIEWS.map(item => <button type="button" key={item} onClick={() => setView(item)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold transition ${view === item ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:bg-slate-50'}`}><TicketIcon className="h-4 w-4" /> {item}</button>)}
        </aside>
        <section className="card min-w-0 overflow-hidden">
          <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            <input className="w-full bg-transparent text-sm outline-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por ticket, farmacia, asunto, proyecto o producto..." />
          </label>
          <div className="divide-y divide-slate-100">
            {loading ? <p className="p-4 text-sm text-slate-400">Cargando...</p> : filtered.map(ticket => (
              <Link key={ticket.id} to={`/soporte/tickets/${ticket.id}`} className="block px-4 py-3 transition hover:bg-slate-50">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-teal-700">{formatTicketNumber(ticket.public_ticket_number)}</span>
                  <TicketStatusBadge status={ticket.internal_status} />
                  <TicketPriorityBadge priority={ticket.priority_internal} />
                </div>
                <p className="mt-2 truncate text-sm font-bold text-slate-800">{ticket.subject}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{ticket.pharmacy_name} · {ticket.requester_name} · {ticket.product}</p>
                {ticket.related_project_name ? <p className="mt-1 truncate text-[11px] font-semibold text-sky-700">Proyecto: {ticket.related_project_name}</p> : null}
                <p className="mt-1 text-[11px] text-slate-400">Actualizado {formatSupportDate(ticket.updated_at, true)}</p>
              </Link>
            ))}
            {!loading && !filtered.length && <p className="p-8 text-center text-sm text-slate-400">No hay tickets con estos filtros.</p>}
          </div>
        </section>
        <aside className="card h-fit space-y-4 p-4">
          <div><label className="label">Estado</label><select className="field" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todos</option><option value="nuevo">Nuevo</option><option value="abierto">Abierto</option><option value="en_progreso">En progreso</option><option value="esperando_cliente">Esperando cliente</option><option value="esperando_proveedor">Esperando proveedor</option><option value="resuelto">Resuelto</option><option value="archivado">Archivado</option></select></div>
          <div><label className="label">Prioridad</label><select className="field" value={priority} onChange={event => setPriority(event.target.value)}><option value="all">Todas</option><option value="urgente">Urgente</option><option value="alto">Alta</option><option value="medio">Media</option><option value="bajo">Baja</option></select></div>
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Extraer</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => exportToCsv(filtered)} className="btn-ghost border border-slate-200 px-2"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> CSV</button>
              <button onClick={() => exportToPdf(filtered)} className="btn-ghost border border-slate-200 px-2"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF</button>
              <button onClick={() => exportToTxt(filtered)} className="btn-ghost border border-slate-200 px-2"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> TXT</button>
              <button onClick={() => exportToJson(filtered)} className="btn-ghost border border-slate-200 px-2"><ArrowDownTrayIcon className="h-3.5 w-3.5" /> JSON</button>
            </div>
          </div>
        </aside>
      </div>

      <SupportTicketCreateDrawer open={createOpen} onClose={closeCreate} onCreate={handleCreate} prefill={createPrefill} />
    </InternalSupportFrame>
  )
}
