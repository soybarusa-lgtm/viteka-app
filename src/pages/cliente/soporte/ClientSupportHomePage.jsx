import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  LifebuoyIcon,
  PaperAirplaneIcon,
  TicketIcon,
} from '@heroicons/react/24/outline'
import { useClientTickets } from '../../../hooks/useClientTickets'
import { useSupportStats } from '../../../hooks/useSupportStats'
import { formatShortDateTime, getStatusMeta, normalizeKey, statusToneClasses } from '../../../lib/operationalDashboardStatus'

function MetricCard({ title, value, detail, Icon, accent = 'teal' }) {
  const accentClasses = {
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  }[accent] || 'bg-slate-100 text-slate-700 ring-slate-200'

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex rounded-2xl p-2 ring-1 ${accentClasses}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{detail}</p>
    </article>
  )
}

export default function ClientSupportHomePage() {
  const { profile } = useOutletContext()
  const { tickets, loading, error, usingMocks } = useClientTickets(profile)
  const stats = useSupportStats(tickets)

  const recentTickets = useMemo(() => tickets.slice(0, 4), [tickets])
  const waitingForCustomer = useMemo(
    () => tickets.filter(ticket => normalizeKey(ticket.internal_status) === 'esperando_cliente').length,
    [tickets],
  )
  const urgentCount = useMemo(
    () => tickets.filter(ticket => ['urgente', 'urgent'].includes(normalizeKey(ticket.priority_internal || ticket.priority_client || ticket.priority))).length,
    [tickets],
  )

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-wrapper space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-[#d7ebe4] bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),linear-gradient(135deg,#f7fffc_0%,#edf7f3_52%,#ffffff_100%)] shadow-sm">
        <div className="px-4 py-6 sm:px-6 sm:py-7">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal-700 ring-1 ring-teal-100">
              <LifebuoyIcon className="h-3.5 w-3.5" /> Ayuda Viteka
            </p>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-teal-950 sm:text-4xl">
              Hola{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}. Aquí tiene una visión clara de su soporte.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Este espacio queda orientado a informarle del estado de sus incidencias, conversaciones abiertas y próximos pasos recomendados.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Tickets abiertos"
              value={stats.opened.length}
              detail="Incidencias que siguen en curso y todavía requieren seguimiento."
              Icon={TicketIcon}
              accent="teal"
            />
            <MetricCard
              title="Esperando su respuesta"
              value={waitingForCustomer}
              detail="Cuanto antes responda, antes podremos avanzar con ellos."
              Icon={ClockIcon}
              accent="amber"
            />
            <MetricCard
              title="Resueltos"
              value={stats.resolved.length}
              detail="Tickets ya cerrados técnicamente o solucionados por el equipo."
              Icon={CheckCircleIcon}
              accent="emerald"
            />
            <MetricCard
              title="Alta prioridad"
              value={urgentCount}
              detail={urgentCount ? 'Hay incidencias urgentes que están siendo tratadas con prioridad.' : 'No hay incidencias urgentes detectadas ahora mismo.'}
              Icon={ChatBubbleLeftRightIcon}
              accent="blue"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          No se pudo cargar toda la información del soporte. Se muestra el mejor estado disponible.
        </div>
      )}

      {usingMocks && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 shadow-sm">
          Esta vista está usando datos de demostración mientras termina la sincronización completa del módulo de soporte.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Últimos movimientos</p>
              <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">Estado reciente de sus tickets</h2>
            </div>
            <Link to="/cliente/soporte/tickets" className="text-sm font-bold text-teal-700 hover:underline">Ver todos</Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentTickets.length ? recentTickets.map(ticket => {
              const meta = getStatusMeta(ticket.internal_status || ticket.status)
              return (
                <article key={ticket.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{ticket.subject || 'Ticket sin asunto'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.public_ticket_number ? `${ticket.public_ticket_number} · ` : ''}
                        {ticket.pharmacy_name || 'Su farmacia'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ring-1 ${statusToneClasses(meta.tone)}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Última actualización {formatShortDateTime(ticket.updated_at || ticket.created_at)}
                  </p>
                </article>
              )
            }) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                Aún no hay tickets registrados en esta bandeja.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Acciones rápidas</p>
            <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">Qué puede hacer desde aquí</h2>
            <div className="mt-4 grid gap-3">
              <Link to="/cliente/soporte/tickets" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/60">
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-2xl bg-teal-50 p-2 text-teal-700 ring-1 ring-teal-100"><TicketIcon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Revisar todos los tickets</p>
                    <p className="text-xs text-slate-500">Consulte estados, conversaciones y seguimiento histórico.</p>
                  </div>
                </div>
              </Link>
              <Link to="/cliente/soporte/tickets/nuevo" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-teal-200 hover:bg-teal-50/60">
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-2xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100"><PaperAirplaneIcon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Enviar un nuevo ticket</p>
                    <p className="text-xs text-slate-500">Abra una incidencia nueva cuando necesite ayuda adicional.</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Orientación</p>
            <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">Cómo agilizar el soporte</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="rounded-2xl bg-slate-50 px-4 py-3">Explique qué está ocurriendo, desde cuándo y a quién afecta dentro de la farmacia.</p>
              <p className="rounded-2xl bg-slate-50 px-4 py-3">Si un ticket aparece como <strong className="text-slate-900">esperando su respuesta</strong>, añadir contexto o capturas acelera la resolución.</p>
              <p className="rounded-2xl bg-slate-50 px-4 py-3">Para incidencias nuevas, use un ticket independiente aunque se parezcan a un caso anterior.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
