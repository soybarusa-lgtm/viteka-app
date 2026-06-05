import { Link } from 'react-router-dom'
import { BuildingStorefrontIcon, ChatBubbleLeftRightIcon, HomeIcon, UsersIcon } from '@heroicons/react/24/outline'
import { canOpenClientContextFromTicket } from '../../lib/permissions'

export default function ClientContextPanel({ profile, ticket }) {
  if (!canOpenClientContextFromTicket(profile, ticket)) return null

  const base = ticket?.pharmacy_id ? `/cliente/dashboard?pharmacyId=${encodeURIComponent(ticket.pharmacy_id)}` : '/cliente/dashboard'
  const ticketsUrl = ticket?.pharmacy_id ? `/cliente/tickets?pharmacyId=${encodeURIComponent(ticket.pharmacy_id)}` : '/cliente/tickets'

  return (
    <section className="card space-y-3 p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Contexto cliente</p>
      <p className="text-sm font-semibold text-slate-800">{ticket?.pharmacy_name || 'Farmacia vinculada'}</p>
      <div className="grid gap-2">
        <Link to={base} className="btn-secondary justify-center text-xs"><HomeIcon className="h-4 w-4" /> Ver dashboard cliente</Link>
        <Link to={ticketsUrl} className="btn-ghost justify-center text-xs border border-slate-200"><ChatBubbleLeftRightIcon className="h-4 w-4" /> Ver tickets cliente</Link>
        {ticket?.pharmacy_id && (
          <Link to={`/farmacias/${ticket.pharmacy_id}`} className="btn-ghost justify-center text-xs border border-slate-200"><BuildingStorefrontIcon className="h-4 w-4" /> Ver farmacia</Link>
        )}
        {ticket?.requester_profile_id && (
          <Link to={`/personas?profileId=${encodeURIComponent(ticket.requester_profile_id)}`} className="btn-ghost justify-center text-xs border border-slate-200"><UsersIcon className="h-4 w-4" /> Ver persona</Link>
        )}
      </div>
    </section>
  )
}
