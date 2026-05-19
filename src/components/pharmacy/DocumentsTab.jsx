import { useState, useRef } from 'react'

const DOC_TYPES = [
  { value: 'generic', label: 'Genérico' },
  { value: 'contract', label: 'Contrato' },
  { value: 'invoice', label: 'Factura' },
  { value: 'license', label: 'Licencia/Permiso' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'report', label: 'Informe' },
  { value: 'other', label: 'Otro' },
]

const DOC_ICONS = {
  contract: '📄', invoice: '🧾', license: '📜',
  certificate: '🏅', report: '📊', generic: '📁', other: '📎',
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function DocumentsTab({ detail }) {
  const { documents, uploadDocument, deleteDocument, getDocumentUrl } = detail
  const fileRef = useRef(null)
  const [docType, setDocType] = useState('generic')
  const [docName, setDocName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [loadingUrl, setLoadingUrl] = useState(null)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      await uploadDocument({ file, name: docName || file.name, docType })
      setDocName('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleOpen(doc) {
    setLoadingUrl(doc.id)
    try {
      const url = await getDocumentUrl(doc.file_path)
      if (url) window.open(url, '_blank')
    } catch (err) {
      alert('Error al abrir el documento')
    } finally {
      setLoadingUrl(null)
    }
  }

  const grouped = DOC_TYPES.reduce((acc, t) => {
    const docs = documents.filter(d => d.doc_type === t.value)
    if (docs.length) acc[t.value] = { label: t.label, docs }
    return acc
  }, {})

  return (
    <div>
      {/* Upload area */}
      <div className="card p-4 mb-5 border-dashed border-2 border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Subir documento</h4>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <label className="label">Nombre (opcional)</label>
            <input className="input" placeholder="Nombre del documento" value={docName} onChange={e => setDocName(e.target.value)} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input w-auto" value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <input ref={fileRef} type="file" id="doc-upload" className="hidden" onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
            <label
              htmlFor="doc-upload"
              className={`btn-primary cursor-pointer inline-flex items-center gap-2 ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {uploading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Subiendo...</>
              ) : '📎 Seleccionar archivo'}
            </label>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* Lista de documentos */}
      {documents.length === 0 ? (
        <div className="empty-state">
          <span className="text-3xl mb-2">📁</span>
          <p className="text-gray-500 text-sm">Sin documentos subidos</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([type, { label, docs }]) => (
            <div key={type}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {DOC_ICONS[type] || '📎'} {label}
              </h4>
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="card p-3 flex items-center gap-3">
                    <span className="text-2xl">{DOC_ICONS[doc.doc_type] || '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">
                        {formatSize(doc.file_size)}
                        {doc.created_at && ` · ${new Date(doc.created_at).toLocaleDateString('es-ES')}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleOpen(doc)}
                        disabled={loadingUrl === doc.id}
                        className="btn-ghost text-xs px-2 py-1"
                      >
                        {loadingUrl === doc.id ? '...' : '👁️ Ver'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(doc)}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Eliminar documento</h3>
            <p className="text-sm text-gray-600 mb-4">¿Eliminar <strong>{deleteConfirm.name}</strong>? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-danger" onClick={async () => { await deleteDocument(deleteConfirm); setDeleteConfirm(null) }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
