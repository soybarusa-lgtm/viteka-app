import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ArrowDownTrayIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { TicketPriorityBadge, TicketStatusBadge } from '../../components/soporte/shared/SupportBadges'
import { useClientTickets } from '../../hooks/useClientTickets'
import { exportToCsv, exportToJson, exportToPdf } from '../../lib/supportExports'
import { normalizeSearch, formatSupportDate } from '../../lib/supportFormatters'
import { formatTicketNumber } from '../../lib/supportStatus'

export default function ClientTicketsPage() {
  const { profile, pharmacyId } = useOutletContext()
  const clientProfile = useMemo(() => (pharmacyId ? { ...profile, pharmacy_id: pharmacyId } : profile), [pharmacyId, profile])
  const { tickets, loading, usingMocks } = useClientTickets(clientProfile)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('open')
  const [order, setOrder] = useState('updated_at')

  const filtered = useMemo(() => {
    const searchTerm = normalizeSearch(search)
    return (tickets || [])
      .filter(ticket => status === 'all' || (status === 'open' ? !['resuelto', 'cerrado'].includes(ticket.client_status) : ticket.client_status === status))
      .filter(ticket => normalizeSearch([ticket.subject, ticket.description, ticket.product, ticket.public_ticket_number].join(' ')).includes(searchTerm))
      .sort((a, b) => {
        if (order === 'priority') return String(b.priority_client || '').localeCompare(String(a.priority_client || ''))
        const left = String(a[order] || '')
        const right = String(b[order] || '')
        return right.localeCompare(left)
      })
  }, [order, search, status, tickets])

  if (loading) return <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-400">Cargando tickets...</p>

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/cliente/dashboard" className="text-xs font-bold text-teal-700 hover:underline">Inicio</Link>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Tickets</h1>
          {usingMocks && <p className="mt-1 text-xs text-amber-700">Vista demostrativa activa hasta completar la migracion del portal.</p>}
        </div>
        <Link to="/cliente/tickets/nuevo" className="btn-primary"><PlusIcon className="h-4 w-4" /> Enviar un ticket</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px]">
        <section className="card overflow-hidden">
          <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Busque sus tickets aqui..." />
          </label>
          <div className="divide-y divide-slate-100">
            {filtered.length ? filtered.map(ticket => (
              <Link key={ticket.id} to={`/cliente/tickets/${ticket.id}`} className="flex gap-3 px-4 py-4 transition hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-700">{formatTicketNumber(ticket.public_ticket_number)}</span>
                    <TicketStatusBadge status={ticket.client_status} client />
                    <TicketPriorityBadge priority={ticket.priority_client} />
                  </div>
                  <p className="mt-2 truncate text-sm font-bold text-slate-800">{ticket.subject}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{ticket.description}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{ticket.product} · Actualizado {formatSupportDate(ticket.updated_at, true)}</p>
                </div>
                <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            )) : <p className="px-4 py-14 text-center text-sm text-slate-400">No tiene tickets en esta vista.</p>}
          </div>
        </section>

        <aside className="card h-fit space-y-4 p-4">
          <div>
            <label className="label">Estado</label>
            <select className="field" value={status} onChange={event => setStatus(event.target.value)}>
              <option value="open">Abiertos o pendientes</option>
              <option value="all">Todos</option>
              <option value="resuelto">Resueltos</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>
          <div>
            <label className="label">Ordenar por</label>
            <select className="field" value={order} onChange={event => setOrder(event.target.value)}>
              <option value="created_at">Fecha de creacion</option>
              <option value="updated_at">Ultima actualizacion</option>
              <option value="priority">Prioridad</option>
            </select>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Exportar tickets</p>
            <button type="button" onClick={() => exportToCsv(filtered, undefined, 'mis-tickets.csv')} className="btn-ghost w-full border border-slate-200"><ArrowDownTrayIcon className="h-4 w-4" /> CSV</button>
            <button type="button" onClick={() => exportToPdf(filtered, undefined, 'mis-tickets.pdf', 'Mis tickets de soporte')} className="btn-ghost w-full border border-slate-200"><ArrowDownTrayIcon className="h-4 w-4" /> PDF</button>
            <button type="button" onClick={() => exportToJson(filtered, 'mis-tickets.json')} className="btn-ghost w-full border border-slate-200"><ArrowDownTrayIcon className="h-4 w-4" /> JSON</button>
          </div>
        </aside>
      </div>
    </div>
  )
}
