import { useMemo, useState } from 'react'
import { DocumentPlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import SupportPageHeader from '../../components/soporte/shared/SupportPageHeader'
import { MOCK_KB_FOLDERS } from '../../lib/supportMockData'
import { normalizeSearch } from '../../lib/supportFormatters'

export default function SupportKnowledgeBasePage() {
  const [search, setSearch] = useState('')
  const folders = useMemo(() => MOCK_KB_FOLDERS.filter(folder => normalizeSearch(folder).includes(normalizeSearch(search))), [search])
  return (
    <InternalSupportFrame>
      <SupportPageHeader title="Base de conocimiento" detail="Organice procedimientos recurrentes para reducir tiempos de respuesta y preparar contenido visible para clientes." actions={<button className="btn-primary"><DocumentPlusIcon className="h-4 w-4" /> Nuevo artículo</button>} />
      <label className="card flex items-center gap-2 px-4 py-3"><MagnifyingGlassIcon className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm outline-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar artículos y carpetas..." /></label>
      <section className="card overflow-hidden">
        <header className="border-b border-slate-100 bg-teal-50 px-4 py-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-teal-700">Categoría</p><h2 className="mt-1 font-display text-lg font-extrabold text-teal-950">Nixfarma</h2></header>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
          {folders.map((folder, index) => <button type="button" key={folder} className="bg-white p-4 text-left transition hover:bg-slate-50"><p className="text-sm font-bold text-slate-800">{folder}</p><p className="mt-2 text-xs text-slate-400">{index % 3} artículos publicados</p></button>)}
        </div>
      </section>
    </InternalSupportFrame>
  )
}
