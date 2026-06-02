import { Link, useParams } from 'react-router-dom'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import { useAuth } from '../../hooks/useAuth'
import { useSupportCompanies } from '../../hooks/useSupportCompanies'
import { useSupportContacts } from '../../hooks/useSupportContacts'
import { useSupportTickets } from '../../hooks/useSupportTickets'
import { TicketStatusBadge } from '../../components/soporte/shared/SupportBadges'
import { formatTicketNumber } from '../../lib/supportStatus'

export default function SupportCompanyDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { companies } = useSupportCompanies()
  const { contacts } = useSupportContacts()
  const { tickets } = useSupportTickets(profile)
  const company = companies.find(item => item.id === id)
  if (!company) return <InternalSupportFrame><p className="card p-5 text-sm text-slate-400">Cargando farmacia...</p></InternalSupportFrame>
  const companyContacts = contacts.filter(contact => contact.pharmacy_id === company.pharmacy_id)
  const companyTickets = tickets.filter(ticket => ticket.pharmacy_id === company.pharmacy_id)
  return (
    <InternalSupportFrame>
      <div><Link to="/soporte/companias" className="text-xs font-bold text-teal-700 hover:underline">Farmacias</Link><h1 className="mt-2 font-display text-2xl font-extrabold text-slate-950">{company.name}</h1><p className="mt-1 text-sm text-slate-500">{company.city} · {company.province}</p></div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="card overflow-hidden"><p className="border-b border-slate-100 px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Tickets recientes</p><div className="divide-y divide-slate-100">{companyTickets.length ? companyTickets.map(ticket => <Link key={ticket.id} to={`/soporte/tickets/${ticket.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-slate-50"><span><b className="font-mono text-xs text-teal-700">{formatTicketNumber(ticket.public_ticket_number)}</b><span className="ml-2 text-slate-700">{ticket.subject}</span></span><TicketStatusBadge status={ticket.internal_status} /></Link>) : <p className="p-4 text-sm text-slate-400">Sin tickets.</p>}</div></section>
        <aside className="space-y-4">
          <section className="card p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Información</p><p className="mt-3 text-sm font-bold text-slate-800">{company.phone}</p><p className="mt-1 text-sm text-slate-500">{company.email}</p></section>
          <section className="card p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Contactos</p>{companyContacts.map(contact => <p key={contact.id} className="mt-3 text-sm text-slate-600"><b className="block text-slate-800">{contact.name}</b>{contact.title}</p>)}</section>
        </aside>
      </div>
    </InternalSupportFrame>
  )
}
