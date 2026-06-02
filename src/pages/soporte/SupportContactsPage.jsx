import { Link } from 'react-router-dom'
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import SupportPageHeader from '../../components/soporte/shared/SupportPageHeader'
import { useSupportContacts } from '../../hooks/useSupportContacts'
import { normalizeSearch } from '../../lib/supportFormatters'

export default function SupportContactsPage() {
  const { contacts, loading } = useSupportContacts()
  const [search, setSearch] = useState('')
  const filtered = contacts.filter(contact => normalizeSearch(Object.values(contact).join(' ')).includes(normalizeSearch(search)))
  return (
    <InternalSupportFrame>
      <SupportPageHeader title="Contactos" detail="Personas vinculadas a las farmacias y sus vías de contacto." />
      <section className="card overflow-hidden">
        <label className="flex items-center gap-2 border-b border-slate-100 px-4 py-3"><MagnifyingGlassIcon className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar contacto o farmacia..." /></label>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-4 py-3">Contacto</th><th>Rol</th><th>Farmacia</th><th>Email</th><th>Móvil</th><th>Trabajo</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">{!loading && filtered.map(contact => <tr key={contact.id} className="text-slate-600 hover:bg-slate-50"><td className="px-4 py-3 font-bold text-slate-800">{contact.name}</td><td>{contact.title}</td><td>{contact.company_name}</td><td>{contact.email}</td><td>{contact.mobile_phone || '—'}</td><td>{contact.work_phone || '—'}</td><td><Link to={`/soporte/contactos/${contact.id}`} aria-label={`Abrir ${contact.name}`}><ChevronRightIcon className="h-4 w-4 text-slate-300" /></Link></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </InternalSupportFrame>
  )
}
