import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownTrayIcon, MagnifyingGlassIcon, TicketIcon } from '@heroicons/react/24/outline'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import SupportPageHeader from '../../components/soporte/shared/SupportPageHeader'
import { TicketPriorityBadge, TicketStatusBadge } from '../../components/soporte/shared/SupportBadges'
import { useAuth } from '../../hooks/useAuth'
import { useSupportTickets } from '../../hooks/useSupportTickets'
import { exportToCsv, exportToJson, exportToPdf, exportToTxt } from '../../lib/supportExports'
import { formatSupportDate, normalizeSearch } from '../../lib/supportFormatters'
import { formatTicketNumber } from '../../lib/supportStatus'

const VIEWS = ['Nuevos y abiertos', 'Todos los tickets', 'Sin resolver', 'Archivados', 'Papelera']

export default function SupportTicketsPage() {
  const { profile } = useAuth()
  const { tickets, loading } = useSupportTickets(profile)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('Nuevos y abiertos')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')

  const filtered = useMemo(() => tickets
    .filter(ticket => view === 'Todos los tickets' || view === 'Papelera' ? true : view === 'Archivados' ? ticket.internal_status === 'archivado' : !['resuelto', 'cerrado', 'archivado'].includes(ticket.internal_status))
    .filter(ticket => status === 'all' || ticket.internal_status === status)
    .filter(ticket => priority === 'all' || ticket.priority_internal === priority)
    .filter(ticket => normalizeSearch([ticket.subject, ticket.pharmacy_name, ticket.requester_name, ticket.product, ticket.public_ticket_number].join(' ')).includes(normalizeSearch(search))), [priority, search, status, tickets, view])

  return (
    <InternalSupportFrame>
      <SupportPageHeader title="Tickets" detail="Bandeja única para incidencias, consultas y peticiones de las farmacias." />
      <div className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)_220px]">
        <aside className="card h-fit p-2">
          <p className="px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Vistas</p>
          {VIEWS.map(item => <button type="button" key={item} onClick={() => setView(item)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-bold transition ${view === item ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:bg-slate-50'}`}><TicketIcon className="h-4 w-4" /> {item}</button>)}
        </aside>
        <section className="card min-w-0 overflow-hidden">
          <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            <input className="w-full bg-transparent text-sm outline-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por ticket, farmacia, asunto o producto..." />
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
                <p className="mt-1 text-[11px] text-slate-400">Actualizado {formatSupportDate(ticket.updated_at, true)}</p>
              </Link>
            ))}
            {!loading && !filtered.length && <p className="p-8 text-center text-sm text-slate-400">No hay tickets con estos filtros.</p>}
          </div>
        </section>
        <aside className="card h-fit space-y-4 p-4">
          <div><label className="label">Estado</label><select className="field" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todos</option><option value="nuevo">Nuevo</option><option value="abierto">Abierto</option><option value="en_progreso">En progreso</option><option value="esperando_cliente">Esperando cliente</option><option value="resuelto">Resuelto</option></select></div>
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
    </InternalSupportFrame>
  )
}
