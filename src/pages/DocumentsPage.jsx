import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/notifications'

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

const CATEGORIES = [
  { value: 'general',  label: 'General' },
  { value: 'protocol', label: 'Protocolos' },
  { value: 'manual',   label: 'Manuales' },
  { value: 'report',   label: 'Informes' },
]

const CAT_COLORS = {
  general:  'bg-slate-100 text-slate-600',
  protocol: 'bg-violet-50 text-violet-700',
  manual:   'bg-blue-50 text-blue-700',
  report:   'bg-amber-50 text-amber-700',
}

function IconFile()     { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>) }
function IconUpload()   { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>) }
function IconDownload() { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>) }
function IconTrash()    { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>) }
function IconSearch()   { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DocumentsPage({ profile }) {
  const [documents, setDocuments] = useState([])
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [uploading, setUploading] = useState(false)

  const [title, setTitle]         = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]   = useState('general')
  const [visibleToClient, setVisibleToClient] = useState(false)
  const [formOpen, setFormOpen]   = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const autoOpenedRef = useRef(false)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const shouldOpen = searchParams.get('open') === '1'
    if (!shouldOpen || autoOpenedRef.current) return
    setFormOpen(true)
    setSearchParams({}, { replace: true })
    autoOpenedRef.current = true
  }, [searchParams, setSearchParams])

  async function load() {
    const { data } = await supabase.from('company_documents').select('*').order('created_at', { ascending: false })
    setDocuments(data || [])
  }

  async function uploadDocument(file) {
    if (!file || !title.trim()) { alert('Título obligatorio.'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `documents/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('company-documents').upload(filePath, file)
    if (uploadError) { setUploading(false); alert(uploadError.message); return }
    const { data: urlData } = supabase.storage.from('company-documents').getPublicUrl(filePath)
    const { data, error } = await supabase.from('company_documents').insert({
      company_id: COMPANY_ID, title, description, category,
      file_name: file.name, file_path: filePath, file_url: urlData.publicUrl,
      mime_type: file.type, visible_to_client: visibleToClient, uploaded_by: profile?.id || null,
    }).select().single()
    setUploading(false)
    if (error) { alert(error.message); return }
    await createNotification({ userId: profile?.id, title: 'Documento subido', message: `"${title}" subido correctamente.`, type: 'success', entityType: 'document', entityId: data.id })
    setTitle(''); setDescription(''); setCategory('general'); setVisibleToClient(false); setFormOpen(false)
    await load()
  }

  async function deleteDocument(id, filePath) {
    if (!window.confirm('¿Eliminar documento?')) return
    if (filePath) await supabase.storage.from('company-documents').remove([filePath])
    await supabase.from('company_documents').delete().eq('id', id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const filtered = documents.filter(d => {
    const text = [d.title, d.description, d.file_name, d.category].join(' ').toLowerCase()
    return (!search || text.includes(search.toLowerCase())) && (catFilter === 'all' || d.category === catFilter)
  })

  return (
    <div className="page-wrapper space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">Documentación</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Biblioteca documental corporativa</p>
        </div>
        <button type="button" onClick={() => setFormOpen(o => !o)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#005643] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#00442f] w-full sm:w-auto">
          <IconUpload /> {formOpen ? 'Cancelar' : 'Subir documento'}
        </button>
      </div>

      {/* Upload form */}
      {formOpen && (
        <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5 space-y-4">
          <p className="text-[13px] font-medium text-[#0F172A]">Nuevo documento</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Título *">
              <input value={title} onChange={e => setTitle(e.target.value)} className="field" placeholder="Manual operativo..." />
            </FormField>
            <FormField label="Categoría">
              <select value={category} onChange={e => setCategory(e.target.value)} className="field">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Descripción">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="field resize-none" />
          </FormField>
          <label className="flex items-center gap-2 text-[13px] text-[#334155] cursor-pointer">
            <input type="checkbox" checked={visibleToClient} onChange={e => setVisibleToClient(e.target.checked)} className="rounded" />
            Visible al cliente
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#005643] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#00442f] w-full sm:w-auto justify-center">
            {uploading ? 'Subiendo...' : <><IconUpload /> Seleccionar archivo</>}
            <input type="file" className="hidden" onChange={e => uploadDocument(e.target.files[0])} disabled={uploading} />
          </label>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, descripción o archivo..."
            className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20" />
        </div>
        {/* Category pills — scroll horizontal en móvil */}
        <div className="tabs-scroll">
          <CatBtn active={catFilter === 'all'} onClick={() => setCatFilter('all')}>Todos</CatBtn>
          {CATEGORIES.map(c => <CatBtn key={c.value} active={catFilter === c.value} onClick={() => setCatFilter(c.value)}>{c.label}</CatBtn>)}
        </div>
      </div>

      <p className="text-[12px] text-[#94A3B8]">
        {filtered.length === documents.length ? `${documents.length} documentos` : `${filtered.length} de ${documents.length}`}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#94A3B8]"><IconFile /></div>
          <p className="mt-4 text-[14px] font-medium text-[#0F172A]">{documents.length === 0 ? 'Sin documentos' : 'Sin resultados'}</p>
          <p className="mt-1 text-[13px] text-[#94A3B8]">{documents.length === 0 ? 'Sube el primer documento' : 'Prueba otros filtros'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(doc => (
            <div key={doc.id} className="group flex flex-col rounded-2xl border border-[#E8EDF2] bg-white p-5 transition hover:border-[#005643]/30 hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669]"><IconFile /></div>
                <div className="flex flex-wrap gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CAT_COLORS[doc.category] || CAT_COLORS.general}`}>
                    {CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                  </span>
                  {doc.visible_to_client && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">Cliente</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex-1">
                <p className="text-[14px] font-medium text-[#0F172A] line-clamp-2">{doc.title}</p>
                {doc.description && <p className="mt-1 text-[12px] text-[#94A3B8] line-clamp-2">{doc.description}</p>}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#CBD5E1]">
                <span className="truncate max-w-[120px]">{doc.file_name}</span>
                <span>{fmtDate(doc.created_at)}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[#F1F5F9] pt-4">
                <a href={doc.file_url} target="_blank" rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#005643] py-1.5 text-[12px] font-medium text-white transition hover:bg-[#00442f]">
                  <IconDownload /> Abrir
                </a>
                <button type="button" onClick={() => deleteDocument(doc.id, doc.file_path)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#991B1B] transition hover:bg-[#fecaca]">
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">{label}</span>
      {children}
    </label>
  )
}
function CatBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
        active ? 'bg-[#005643] text-white' : 'bg-white border border-[#E8EDF2] text-[#64748B] hover:bg-[#F8FAFC]'
      }`}>
      {children}
    </button>
  )
}
