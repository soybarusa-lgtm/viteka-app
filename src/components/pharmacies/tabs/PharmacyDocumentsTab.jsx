import { useEffect, useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  CheckBadgeIcon,
  ClockIcon,
  DocumentTextIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline'
import ConfirmDialog from '../../pharmacy/ConfirmDialog'
import { DOC_CATEGORIES } from '../../pharmacy/PHARMACY_CONSTANTS'
import { supabase } from '../../../lib/supabase'
import PharmacyEmptyState from '../PharmacyEmptyState'
import PharmacyModuleHeader from '../PharmacyModuleHeader'
import PharmacyModuleToolbar from '../PharmacyModuleToolbar'
import DocumentCard from '../documents/DocumentCard'
import DocumentCategorySection from '../documents/DocumentCategorySection'
import DocumentUploadDrawer from '../documents/DocumentUploadDrawer'

function getDocumentName(doc) {
  return doc?.name || doc?.file_name || 'Documento'
}

function getDocumentExt(doc) {
  const nameExt = getDocumentName(doc).split('.').pop()
  return String(doc?.file_ext || nameExt || '').replace(/^\./, '').toUpperCase()
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getReviewStatus(doc) {
  const raw = String(doc?.review_status || doc?.status || '').toLocaleLowerCase('es')
  return ['reviewed', 'revisado', 'ok'].includes(raw) ? 'Revisado' : 'Pendiente'
}

function isVisibleForClient(doc) {
  return Boolean(doc?.visible_for_client ?? doc?.is_visible_client ?? doc?.visible_client)
}

async function persistDocumentMetadata(docId, payload) {
  const variants = [
    payload,
    { name: payload.name, category: payload.category, review_status: payload.review_status },
    { name: payload.name, category: payload.category },
  ]

  let lastError = null
  for (const variant of variants) {
    const cleanPayload = Object.fromEntries(Object.entries(variant).filter(([, value]) => value !== undefined))
    const { error } = await supabase.from('pharmacy_documents').update(cleanPayload).eq('id', docId)
    if (!error) return
    lastError = error
  }

  throw lastError || new Error('No se pudo guardar el documento')
}

function EditDocumentModal({ doc, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: getDocumentName(doc),
    category: doc?.category || '',
    visible_for_client: isVisibleForClient(doc),
    review_status: getReviewStatus(doc) === 'Revisado' ? 'reviewed' : 'pending',
    notes: doc?.notes || '',
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
        <h3 className="text-lg font-bold text-[#071A1D]">Editar documento</h3>
        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Nombre</span>
            <input value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} className="w-full rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Categoría</span>
            <select value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))} className="w-full rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">
              <option value="">Sin categoría</option>
              {DOC_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.visible_for_client} onChange={event => setForm(prev => ({ ...prev, visible_for_client: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
            Visible para cliente
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Estado</span>
            <select value={form.review_status} onChange={event => setForm(prev => ({ ...prev, review_status: event.target.value }))} className="w-full rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100">
              <option value="pending">Pendiente</option>
              <option value="reviewed">Revisado</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Notas</span>
            <textarea rows={3} value={form.notes} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} className="w-full rounded-xl border border-[#DDEAE7] px-3 py-2.5 text-sm outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100" />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#DDEAE7] px-4 py-2 text-sm font-semibold text-slate-600">Cancelar</button>
          <button type="button" onClick={() => onSave(form)} disabled={saving} className="rounded-xl bg-[#00695C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PharmacyDocumentsTab({ pharmacyId, companyId, documentsApi, toast }) {
  const { documents = [], loading, error, uploadDocument, deleteDocument, getDocumentUrl, reload } = documentsApi
  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [savingDoc, setSavingDoc] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [meta, setMeta] = useState({ name: '', category: '', visibleForClient: false, notes: '' })

  const categories = useMemo(
    () => Array.from(new Set([...DOC_CATEGORIES, ...documents.map(doc => doc.category).filter(Boolean)])),
    [documents],
  )

  const metrics = useMemo(() => {
    const contratos = documents.filter(doc => String(doc.category || '').toLocaleLowerCase('es') === 'contratos').length
    const informes = documents.filter(doc => String(doc.category || '').toLocaleLowerCase('es') === 'informes').length
    const pendientes = documents.filter(doc => getReviewStatus(doc) === 'Pendiente').length
    return [
      { label: 'Documentos', value: documents.length, hint: 'archivo total', icon: FolderOpenIcon },
      { label: 'Contratos', value: contratos, hint: contratos > 0 ? 'documentación contractual' : 'sin contratos cargados', icon: DocumentTextIcon },
      { label: 'Informes', value: informes, hint: informes > 0 ? 'informes operativos' : 'sin informes cargados', icon: CheckBadgeIcon, tone: 'info' },
      { label: 'Pendientes', value: pendientes, hint: pendientes > 0 ? 'por revisar' : 'todo revisado', icon: ClockIcon, tone: pendientes > 0 ? 'warning' : 'default' },
    ]
  }, [documents])

  const visibleDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return documents.filter(doc => {
      const category = String(doc.category || '').toLocaleLowerCase('es')
      const matchesSearch = !normalizedQuery || [getDocumentName(doc), doc.category, doc.file_ext, doc.notes].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(normalizedQuery)

      let matchesFilter = true
      if (quickFilter === 'contracts') matchesFilter = category === 'contratos'
      if (quickFilter === 'reports') matchesFilter = category === 'informes'
      if (quickFilter === 'others') matchesFilter = category && !['contratos', 'informes'].includes(category)
      if (quickFilter === 'pending') matchesFilter = getReviewStatus(doc) === 'Pendiente'
      if (quickFilter === 'uncategorized') matchesFilter = !doc.category

      return matchesSearch && matchesFilter
    })
  }, [documents, query, quickFilter])

  const groupedDocuments = useMemo(() => visibleDocuments.reduce((acc, doc) => {
    const key = doc.category || 'Sin categoría'
    if (!acc[key]) acc[key] = []
    acc[key].push(doc)
    return acc
  }, {}), [visibleDocuments])

  useEffect(() => {
    const keys = Object.keys(groupedDocuments)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenSections(prev => {
      const next = { ...prev }
      keys.forEach(key => {
        if (typeof next[key] === 'undefined') next[key] = true
      })
      return next
    })
  }, [groupedDocuments])

  async function resolveUrl(doc) {
    const url = await getDocumentUrl(doc)
    if (!url) throw new Error('Documento sin URL')
    return url
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const created = await uploadDocument(selectedFile, {
        name: meta.name || selectedFile.name,
        category: meta.category,
        pharmacy_id: pharmacyId,
        company_id: companyId,
      })
      if (meta.visibleForClient || meta.notes) {
        await persistDocumentMetadata(created.id, {
          name: meta.name || selectedFile.name,
          category: meta.category || null,
          visible_for_client: meta.visibleForClient,
          notes: meta.notes || null,
          review_status: 'pending',
        })
        await reload()
      }
      toast('Documento subido', 'success')
      setMeta({ name: '', category: '', visibleForClient: false, notes: '' })
      setSelectedFile(null)
    } catch {
      toast('No se pudo subir el documento', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(doc) {
    setDeletingId(doc.id)
    try {
      const result = await deleteDocument(doc)
      toast(result?.storageError ? 'Documento eliminado con incidencia en almacenamiento' : 'Documento eliminado', result?.storageError ? 'error' : 'success')
      setConfirmDel(null)
    } catch {
      toast('No se pudo eliminar el documento', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Documentos operativos"
        subtitle="Archivo compacto con categorías, revisión y acciones rápidas."
        metrics={metrics}
      />

      <DocumentUploadDrawer
        open={drawerOpen}
        onToggle={() => setDrawerOpen(prev => !prev)}
        name={meta.name}
        onNameChange={value => setMeta(prev => ({ ...prev, name: value }))}
        category={meta.category}
        onCategoryChange={value => setMeta(prev => ({ ...prev, category: value }))}
        categories={categories}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        visibleForClient={meta.visibleForClient}
        onVisibleForClientChange={value => setMeta(prev => ({ ...prev, visibleForClient: value }))}
        notes={meta.notes}
        onNotesChange={value => setMeta(prev => ({ ...prev, notes: value }))}
        onUpload={handleUpload}
        uploading={uploading}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar documento, categoría, fecha o tipo..."
        filters={[
          { value: 'all', label: 'Todos' },
          { value: 'contracts', label: 'Contratos' },
          { value: 'reports', label: 'Informes' },
          { value: 'others', label: 'Otros' },
          { value: 'pending', label: 'Pendientes' },
          { value: 'uncategorized', label: 'Sin categoría' },
        ]}
        activeFilter={quickFilter}
        onFilterChange={setQuickFilter}
        rightSlot={
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DDEAE7] bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Actualizar
          </button>
        }
      />

      {error ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {visibleDocuments.length === 0 ? (
        <PharmacyEmptyState
          icon={DocumentTextIcon}
          title={documents.length === 0 ? 'No hay documentos cargados.' : 'No hay documentos con esos filtros.'}
          message={documents.length === 0 ? 'Sube el primer documento y ordénalo por categoría para dejar la ficha preparada.' : 'Prueba otra búsqueda o cambia el filtro activo.'}
          actionLabel="Subir documento"
          onAction={() => setDrawerOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedDocuments).map(([category, items]) => (
            <DocumentCategorySection
              key={category}
              title={category}
              count={items.length}
              pendingCount={items.filter(doc => getReviewStatus(doc) === 'Pendiente').length}
              isOpen={openSections[category] !== false}
              onToggle={() => setOpenSections(prev => ({ ...prev, [category]: prev[category] === false }))}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    fileType={getDocumentExt(doc)}
                    name={getDocumentName(doc)}
                    date={new Date(doc.created_at).toLocaleDateString('es-ES')}
                    size={formatBytes(doc.size_bytes)}
                    category={doc.category || 'Sin categoría'}
                    status={getReviewStatus(doc)}
                    visibleForClient={isVisibleForClient(doc)}
                    onView={async () => {
                      try {
                        window.open(await resolveUrl(doc), '_blank', 'noopener,noreferrer')
                      } catch {
                        toast('No se pudo abrir el documento', 'error')
                      }
                    }}
                    onDownload={async () => {
                      try {
                        const url = await resolveUrl(doc)
                        const link = window.document.createElement('a')
                        link.href = url
                        link.download = getDocumentName(doc)
                        link.target = '_blank'
                        window.document.body.appendChild(link)
                        link.click()
                        link.remove()
                      } catch {
                        toast('No se pudo descargar el documento', 'error')
                      }
                    }}
                    onCopyLink={async () => {
                      try {
                        await navigator.clipboard.writeText(await resolveUrl(doc))
                        toast('Enlace copiado', 'success')
                      } catch {
                        toast('No se pudo copiar el enlace', 'error')
                      }
                    }}
                    onEdit={() => setEditingDoc(doc)}
                    onDelete={() => setConfirmDel(doc)}
                  />
                ))}
              </div>
            </DocumentCategorySection>
          ))}
        </div>
      )}

      {editingDoc ? (
        <EditDocumentModal
          doc={editingDoc}
          saving={savingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={async form => {
            setSavingDoc(true)
            try {
              await persistDocumentMetadata(editingDoc.id, {
                name: form.name,
                category: form.category || null,
                visible_for_client: form.visible_for_client,
                review_status: form.review_status,
                notes: form.notes || null,
              })
              await reload()
              toast('Documento actualizado', 'success')
              setEditingDoc(null)
            } catch {
              toast('No se pudo guardar el documento', 'error')
            } finally {
              setSavingDoc(false)
            }
          }}
        />
      ) : null}

      {confirmDel ? (
        <ConfirmDialog
          title="Eliminar documento"
          message={`¿Seguro que quieres eliminar "${getDocumentName(confirmDel)}"?`}
          confirmLabel={deletingId === confirmDel.id ? 'Eliminando...' : 'Eliminar'}
          variant="danger"
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      ) : null}
    </div>
  )
}
