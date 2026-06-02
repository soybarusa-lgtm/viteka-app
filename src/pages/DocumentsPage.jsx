import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/notifications'
import { normalizeText } from '../lib/projectManagement'

const DOCUMENT_BUCKET = 'documents'
const MAX_FILE_SIZE = 25 * 1024 * 1024

const CATEGORIES = [
  { value: 'generic', label: 'General' },
  { value: 'protocol', label: 'Protocolos' },
  { value: 'manual', label: 'Manuales' },
  { value: 'report', label: 'Informes' },
]

const CAT_COLORS = {
  generic: 'bg-slate-100 text-slate-600',
  protocol: 'bg-violet-50 text-violet-700',
  manual: 'bg-blue-50 text-blue-700',
  report: 'bg-amber-50 text-amber-700',
}

function IconFile()     { return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>) }
function IconUpload()   { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>) }
function IconDownload() { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>) }
function IconTrash()    { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>) }
function IconSearch()   { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }

function safeStorageName(name = 'documento') {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'documento'
}

function fmtDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtSize(bytes) {
  if (!bytes) return 'Sin tamaño'
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage({ profile }) {
  const companyId = profile?.company_id
  const fileInputRef = useRef(null)
  const autoOpenedRef = useRef(false)
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('generic')
  const [selectedFile, setSelectedFile] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const load = useCallback(async () => {
    if (!companyId) {
      setDocuments([])
      return
    }
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .is('pharmacy_id', null)
      .order('created_at', { ascending: false })
    if (error) {
      setFeedback({ type: 'error', text: `No se pudo cargar la biblioteca: ${error.message}` })
      return
    }
    setDocuments(data || [])
  }, [companyId])

  // Loading on mount intentionally synchronizes this page with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  useEffect(() => {
    const shouldOpen = searchParams.get('open') === '1'
    if (!shouldOpen || autoOpenedRef.current) return
    setFormOpen(true)
    setSearchParams({}, { replace: true })
    autoOpenedRef.current = true
  }, [searchParams, setSearchParams])

  function resetForm() {
    setTitle('')
    setCategory('generic')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function closeForm() {
    resetForm()
    setFormOpen(false)
  }

  async function uploadDocument(event) {
    event.preventDefault()
    setFeedback(null)
    if (!selectedFile || !title.trim()) {
      setFeedback({ type: 'error', text: 'Indica un título y selecciona el archivo que quieres subir.' })
      return
    }
    if (!companyId) {
      setFeedback({ type: 'error', text: 'No se ha podido identificar la empresa del usuario.' })
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFeedback({ type: 'error', text: 'El archivo supera el límite de 25 MB.' })
      return
    }

    setUploading(true)
    const filePath = `${companyId}/corporate/${Date.now()}_${safeStorageName(selectedFile.name)}`
    try {
      const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(filePath, selectedFile)
      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('documents')
        .insert({
          company_id: companyId,
          pharmacy_id: null,
          contact_id: null,
          name: title.trim(),
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type || null,
          doc_type: category,
          uploaded_by: profile?.id || null,
        })
        .select()
        .single()
      if (error) {
        await supabase.storage.from(DOCUMENT_BUCKET).remove([filePath])
        throw error
      }

      await createNotification({
        userId: profile?.id,
        title: 'Documento subido',
        message: `"${title.trim()}" se ha añadido a la biblioteca.`,
        type: 'success',
        entityType: 'document',
        entityId: data.id,
      }).catch(() => {})

      closeForm()
      setFeedback({ type: 'success', text: 'Documento subido correctamente.' })
      await load()
    } catch (error) {
      setFeedback({ type: 'error', text: `No se pudo subir el documento: ${error.message}` })
    } finally {
      setUploading(false)
    }
  }

  async function deleteDocument(document) {
    if (!window.confirm(`¿Eliminar "${document.name}"?`)) return
    setFeedback(null)
    try {
      if (document.file_path) {
        const { error: storageError } = await supabase.storage.from(DOCUMENT_BUCKET).remove([document.file_path])
        if (storageError) throw storageError
      }
      const { error } = await supabase.from('documents').delete().eq('id', document.id)
      if (error) throw error
      setDocuments(prev => prev.filter(item => item.id !== document.id))
      setFeedback({ type: 'success', text: 'Documento eliminado.' })
    } catch (error) {
      setFeedback({ type: 'error', text: `No se pudo eliminar el documento: ${error.message}` })
    }
  }

  async function openDocument(document) {
    const previewWindow = window.open('', '_blank')
    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(document.file_path, 60 * 10)
    if (error || !data?.signedUrl) {
      previewWindow?.close()
      setFeedback({ type: 'error', text: 'No se ha podido generar el enlace privado temporal.' })
      return
    }
    if (previewWindow) previewWindow.location.href = data.signedUrl
    else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const filtered = documents.filter(document => {
    const text = normalizeText([document.name, document.file_type, document.doc_type].join(' '))
    return (!search || text.includes(normalizeText(search))) && (catFilter === 'all' || document.doc_type === catFilter)
  })

  return (
    <div className="page-wrapper space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Documentación</h1>
          <p className="mt-1 text-sm text-slate-400">Biblioteca corporativa privada</p>
        </div>
        <button type="button" onClick={() => formOpen ? closeForm() : setFormOpen(true)} className="btn-primary w-full sm:w-auto">
          <IconUpload /> {formOpen ? 'Cancelar' : 'Subir documento'}
        </button>
      </div>

      {feedback && (
        <p className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-teal-200 bg-teal-50 text-teal-800'}`}>
          {feedback.text}
        </p>
      )}

      {formOpen && (
        <form onSubmit={uploadDocument} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-bold text-slate-900">Nuevo documento</p>
            <p className="mt-1 text-xs text-slate-400">Se guardará de forma privada. El enlace de consulta caduca a los 10 minutos.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Título *">
              <input value={title} onChange={event => setTitle(event.target.value)} className="field" placeholder="Manual operativo..." />
            </FormField>
            <FormField label="Categoría">
              <select value={category} onChange={event => setCategory(event.target.value)} className="field">
                {CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </FormField>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">{selectedFile?.name || 'Ningún archivo seleccionado'}</p>
              <p className="mt-0.5 text-xs text-slate-400">{selectedFile ? fmtSize(selectedFile.size) : 'PDF, Office, imágenes u otros archivos · máximo 25 MB'}</p>
            </div>
            <label className="btn-ghost shrink-0 cursor-pointer border border-slate-200 bg-white">
              Seleccionar archivo
              <input ref={fileInputRef} type="file" className="hidden" onChange={event => setSelectedFile(event.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={closeForm}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              <IconUpload /> {uploading ? 'Subiendo...' : 'Subir documento'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por título, categoría o tipo de archivo..." className="field pl-9" />
        </div>
        <div className="tabs-scroll">
          <CatBtn active={catFilter === 'all'} onClick={() => setCatFilter('all')}>Todos</CatBtn>
          {CATEGORIES.map(item => <CatBtn key={item.value} active={catFilter === item.value} onClick={() => setCatFilter(item.value)}>{item.label}</CatBtn>)}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length === documents.length ? `${documents.length} documentos` : `${filtered.length} de ${documents.length}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><IconFile /></div>
          <p className="mt-4 text-sm font-medium text-slate-900">{documents.length === 0 ? 'Sin documentos' : 'Sin resultados'}</p>
          <p className="mt-1 text-xs text-slate-400">{documents.length === 0 ? 'Sube el primer documento corporativo' : 'Prueba otros filtros'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(document => (
            <article key={document.id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-200 hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><IconFile /></div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CAT_COLORS[document.doc_type] || CAT_COLORS.generic}`}>
                  {CATEGORIES.find(item => item.value === document.doc_type)?.label || document.doc_type}
                </span>
              </div>
              <div className="mt-3 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-slate-900">{document.name}</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-300">
                <span>{fmtSize(document.file_size)}</span>
                <span>{fmtDate(document.created_at)}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => openDocument(document)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-700 py-1.5 text-xs font-medium text-white transition hover:bg-teal-800">
                  <IconDownload /> Abrir
                </button>
                <button type="button" aria-label={`Eliminar ${document.name}`} onClick={() => deleteDocument(document)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700 transition hover:bg-rose-100">
                  <IconTrash />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function CatBtn({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? 'bg-teal-700 text-white' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
      {children}
    </button>
  )
}
