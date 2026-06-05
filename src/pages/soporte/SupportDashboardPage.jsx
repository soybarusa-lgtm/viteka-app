import { Link } from 'react-router-dom'
import { ArrowRightIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, ExclamationTriangleIcon, TicketIcon, UserMinusIcon } from '@heroicons/react/24/outline'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import SupportPageHeader from '../../components/soporte/shared/SupportPageHeader'
import { TicketPriorityBadge, TicketStatusBadge } from '../../components/soporte/shared/SupportBadges'
import { useAuth } from '../../hooks/useAuth'
import { useSupportStats } from '../../hooks/useSupportStats'
import { useSupportTickets } from '../../hooks/useSupportTickets'
import { formatSupportDate } from '../../lib/supportFormatters'
import { formatTicketNumber } from '../../lib/supportStatus'

function Metric({ label, value, Icon, alert = false }) {
  return (
    <article className={`card flex items-center gap-3 p-4 ${alert ? 'border-rose-200 bg-rose-50' : ''}`}>
      <span className={`rounded-xl p-2 ${alert ? 'bg-rose-100 text-rose-700' : 'bg-teal-50 text-teal-700'}`}><Icon className="h-5 w-5" /></span>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className={`mt-1 font-display text-2xl font-extrabold ${alert ? 'text-rose-700' : 'text-slate-900'}`}>{value}</p>
      </div>
    </article>
  )
}

export default function SupportDashboardPage() {
  const { profile } = useAuth()
  const { tickets, loading, usingMocks } = useSupportTickets(profile)
  const stats = useSupportStats(tickets)

  return (
    <InternalSupportFrame>
      <SupportPageHeader title="Centro de soporte" detail="Priorice incidencias, vigile carga operativa y entre rápidamente en las conversaciones que necesitan atención." actions={<Link to="/cliente/tickets/nuevo" className="btn-primary">Crear ticket</Link>} />
      {usingMocks && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Modo demostración activo: la migración de soporte todavía no se ha aplicado al Supabase histórico.</p>}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Sin resolver" value={stats.opened.length} Icon={TicketIcon} />
        <Metric label="Urgentes" value={stats.urgent.length} Icon={ExclamationTriangleIcon} alert={stats.urgent.length > 0} />
        <Metric label="En espera" value={stats.waiting.length} Icon={EnvelopeIcon} />
        <Metric label="No asignados" value={stats.unassigned.length} Icon={UserMinusIcon} />
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-teal-700">Bandeja operativa</p>
              <h2 className="font-display text-base font-extrabold text-slate-900">Actualizados recientemente</h2>
            </div>
            <Link to="/soporte/tickets" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">Ver todos <ArrowRightIcon className="h-3.5 w-3.5" /></Link>
          </header>
          <div className="divide-y divide-slate-100">
            {loading ? <p className="p-4 text-sm text-slate-400">Cargando...</p> : tickets.slice(0, 7).map(ticket => (
              <Link key={ticket.id} to={`/soporte/tickets/${ticket.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
                <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0 text-teal-700" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{ticket.subject}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{formatTicketNumber(ticket.public_ticket_number)} · {ticket.pharmacy_name} · {formatSupportDate(ticket.updated_at, true)}</p>
                </div>
                <TicketPriorityBadge priority={ticket.priority_internal} />
                <TicketStatusBadge status={ticket.internal_status} />
              </Link>
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <section className="card p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Tickets por grupo</p>
            <div className="mt-3 space-y-3">
              {Object.entries(stats.byProduct).slice(0, 6).map(([product, count]) => (
                <div key={product}>
                  <div className="flex justify-between gap-3 text-xs"><span className="truncate text-slate-600">{product}</span><b>{count}</b></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${Math.max(8, (count / Math.max(stats.total, 1)) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
          <section className="card p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Tareas pendientes</p>
            <p className="mt-3 text-sm text-slate-500">La agenda se conectará con Proyectos cuando se aplique el módulo de soporte.</p>
          </section>
        </aside>
      </div>
    </InternalSupportFrame>
  )
}
