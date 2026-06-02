import { useMemo, useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import SupportPageHeader from '../../components/soporte/shared/SupportPageHeader'
import { TicketPriorityBadge, TicketStatusBadge } from '../../components/soporte/shared/SupportBadges'
import { useAuth } from '../../hooks/useAuth'
import { useSupportStats } from '../../hooks/useSupportStats'
import { useSupportTickets } from '../../hooks/useSupportTickets'
import { exportToCsv, exportToJson, exportToPdf, exportToTxt } from '../../lib/supportExports'
import { formatTicketNumber } from '../../lib/supportStatus'

function BarList({ data }) {
  const max = Math.max(...Object.values(data), 1)
  return <div className="space-y-3">{Object.entries(data).map(([label, value]) => <div key={label}><div className="flex justify-between gap-3 text-xs"><span className="truncate text-slate-500">{label}</span><b>{value}</b></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-600" style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div>
}

export default function SupportStatsPage() {
  const { profile } = useAuth()
  const { tickets } = useSupportTickets(profile)
  const [period, setPeriod] = useState('month')
  const stats = useSupportStats(tickets)
  const rows = useMemo(() => tickets, [tickets])
  return (
    <InternalSupportFrame>
      <SupportPageHeader title="Estadísticas rápidas" detail="Lectura ejecutiva del volumen de soporte. Los tiempos SLA se activarán con los datos reales." actions={<select className="field w-auto" value={period} onChange={event => setPeriod(event.target.value)}><option value="month">Este mes</option><option value="quarter">Este trimestre</option><option value="year">Este año</option></select>} />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="card p-4"><p className="label">Tickets creados</p><b className="font-display text-2xl">{stats.total}</b></div><div className="card p-4"><p className="label">Sin resolver</p><b className="font-display text-2xl">{stats.opened.length}</b></div><div className="card p-4"><p className="label">Resueltos</p><b className="font-display text-2xl">{stats.resolved.length}</b></div><div className="card p-4"><p className="label">Sin asignar</p><b className="font-display text-2xl">{stats.unassigned.length}</b></div></section>
      <section className="grid gap-4 lg:grid-cols-2"><article className="card p-4"><p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Tickets por estado</p><BarList data={stats.byStatus} /></article><article className="card p-4"><p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Tickets por producto</p><BarList data={stats.byProduct} /></article></section>
      <section className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Detalle exportable</p><div className="flex flex-wrap gap-1"><button className="btn-ghost px-2 py-2" onClick={() => exportToCsv(rows)}><ArrowDownTrayIcon className="h-3.5 w-3.5" /> CSV</button><button className="btn-ghost px-2 py-2" onClick={() => exportToPdf(rows)}><ArrowDownTrayIcon className="h-3.5 w-3.5" /> PDF</button><button className="btn-ghost px-2 py-2" onClick={() => exportToTxt(rows)}><ArrowDownTrayIcon className="h-3.5 w-3.5" /> TXT</button><button className="btn-ghost px-2 py-2" onClick={() => exportToJson(rows)}><ArrowDownTrayIcon className="h-3.5 w-3.5" /> JSON</button></div></header>
        <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-4 py-3">ID</th><th>Asunto</th><th>Farmacia</th><th>Estado</th><th>Prioridad</th><th>Producto</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(ticket => <tr key={ticket.id} className="text-slate-600"><td className="px-4 py-3 font-mono font-bold text-teal-700">{formatTicketNumber(ticket.public_ticket_number)}</td><td>{ticket.subject}</td><td>{ticket.pharmacy_name}</td><td><TicketStatusBadge status={ticket.internal_status} /></td><td><TicketPriorityBadge priority={ticket.priority_internal} /></td><td>{ticket.product}</td></tr>)}</tbody></table></div>
      </section>
    </InternalSupportFrame>
  )
}
