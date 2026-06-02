import { Link } from 'react-router-dom'
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import SupportPageHeader from '../../components/soporte/shared/SupportPageHeader'
import { useAuth } from '../../hooks/useAuth'
import { useSupportCompanies } from '../../hooks/useSupportCompanies'
import { useSupportTickets } from '../../hooks/useSupportTickets'
import { normalizeSearch } from '../../lib/supportFormatters'

export default function SupportCompaniesPage() {
  const { profile } = useAuth()
  const { companies, loading } = useSupportCompanies()
  const { tickets } = useSupportTickets(profile)
  const [search, setSearch] = useState('')
  const rows = useMemo(() => companies
    .filter(company => normalizeSearch(Object.values(company).join(' ')).includes(normalizeSearch(search)))
    .map(company => {
      const companyTickets = tickets.filter(ticket => ticket.pharmacy_id === company.pharmacy_id)
      return { ...company, opened: companyTickets.filter(ticket => !['resuelto', 'cerrado'].includes(ticket.internal_status)).length, resolved: companyTickets.filter(ticket => ticket.internal_status === 'resuelto').length }
    }), [companies, search, tickets])
  return (
    <InternalSupportFrame>
      <SupportPageHeader title="Farmacias de soporte" detail="Vista operativa de clientes, incidencias abiertas y carga reciente." />
      <section className="card overflow-hidden">
        <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-3"><MagnifyingGlassIcon className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar farmacia, provincia o localidad..." /></label>
        <div className="overflow-x-auto">
          <table className="min-w-[780px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-4 py-3">Farmacia</th><th>Localidad</th><th>Abiertos</th><th>Resueltos</th><th>Teléfono</th><th>Email</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">{!loading && rows.map(company => <tr key={company.id} className="text-slate-600 hover:bg-slate-50"><td className="px-4 py-3 font-bold text-slate-800">{company.name}</td><td>{company.city} · {company.province}</td><td>{company.opened}</td><td>{company.resolved}</td><td>{company.phone}</td><td>{company.email}</td><td><Link to={`/soporte/companias/${company.id}`} aria-label={`Abrir ${company.name}`}><ChevronRightIcon className="h-4 w-4 text-slate-300" /></Link></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </InternalSupportFrame>
  )
}
