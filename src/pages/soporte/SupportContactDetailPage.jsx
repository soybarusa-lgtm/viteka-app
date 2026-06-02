import { Link, useParams } from 'react-router-dom'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import { useSupportContacts } from '../../hooks/useSupportContacts'

export default function SupportContactDetailPage() {
  const { id } = useParams()
  const { contacts } = useSupportContacts()
  const contact = contacts.find(item => item.id === id)
  if (!contact) return <InternalSupportFrame><p className="card p-5 text-sm text-slate-400">Cargando contacto...</p></InternalSupportFrame>
  return (
    <InternalSupportFrame>
      <div><Link to="/soporte/contactos" className="text-xs font-bold text-teal-700 hover:underline">Contactos</Link><h1 className="mt-2 font-display text-2xl font-extrabold text-slate-950">{contact.name}</h1><p className="mt-1 text-sm text-slate-500">{contact.title} · {contact.company_name}</p></div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="card p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Escala de tiempo</p><p className="mt-4 text-sm text-slate-500">La actividad del contacto aparecerá aquí cuando se aplique la migración del módulo.</p></section>
        <aside className="card space-y-3 p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Datos de contacto</p><p className="text-sm font-bold text-slate-800">{contact.email}</p><p className="text-sm text-slate-600">{contact.mobile_phone || contact.work_phone || 'Sin teléfono'}</p><p className="text-xs text-slate-400">{contact.company_name}</p></aside>
      </div>
    </InternalSupportFrame>
  )
}
