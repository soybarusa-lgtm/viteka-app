import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/notifications'

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

export default function DocumentsPage({
  profile,
}) {
  const [documents, setDocuments] = useState([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [visibleToClient, setVisibleToClient] = useState(false)

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    const { data, error } = await supabase
      .from('company_documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setDocuments(data || [])
  }

  async function uploadDocument(file) {
  if (!file) return

  if (!title.trim()) {
    alert('Título obligatorio.')
    return
  }

  setUploading(true)

  const extension = file.name.split('.').pop()
  const fileName = `${Date.now()}.${extension}`
  const filePath = `documents/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('company-documents')
    .upload(filePath, file)

  if (uploadError) {
    setUploading(false)
    alert(uploadError.message)
    return
  }

  const { data: publicUrlData } = supabase.storage
    .from('company-documents')
    .getPublicUrl(filePath)

  const { data, error: insertError } = await supabase
    .from('company_documents')
    .insert({
      company_id: COMPANY_ID,
      title,
      description,
      category,
      file_name: file.name,
      file_path: filePath,
      file_url: publicUrlData.publicUrl,
      mime_type: file.type,
      visible_to_client: visibleToClient,
      uploaded_by: profile?.id || null,
    })
    .select()
    .single()

  setUploading(false)

  if (insertError) {
    alert(insertError.message)
    return
  }

  await createNotification({
    userId: profile?.id,
    title: 'Documento subido',
    message: `Se subió el documento "${title}".`,
    type: 'success',
    entityType: 'document',
    entityId: data.id,
  })

  setTitle('')
  setDescription('')
  setCategory('general')
  setVisibleToClient(false)

  await loadDocuments()
}

  async function deleteDocument(documentId, filePath) {
    const confirmed = window.confirm('¿Eliminar documento?')

    if (!confirmed) return

    if (filePath) {
      await supabase.storage
        .from('company-documents')
        .remove([filePath])
    }

    const { error } = await supabase
      .from('company_documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      alert(error.message)
      return
    }

    await loadDocuments()
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
          Documentación
        </h1>

        <p className="mt-3 text-base text-[#64748B]">
          Biblioteca documental corporativa.
        </p>
      </div>

      <div className="mb-8 rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide text-[#64748B] font-medium">
              Título
            </label>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 outline-none focus:border-[#005643]"
              placeholder="Manual operativo..."
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wide text-[#64748B] font-medium">
              Categoría
            </label>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 outline-none focus:border-[#005643]"
            >
              <option value="general">General</option>
              <option value="protocol">Protocolos</option>
              <option value="manual">Manuales</option>
              <option value="report">Informes</option>
              <option value="category">Categorías</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs uppercase tracking-wide text-[#64748B] font-medium">
            Descripción
          </label>

          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="min-h-[120px] w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 outline-none focus:border-[#005643]"
          />
        </div>

        <label className="mt-5 flex items-start gap-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
          <input
            type="checkbox"
            checked={visibleToClient}
            onChange={e => setVisibleToClient(e.target.checked)}
            className="mt-1 h-5 w-5"
          />

          <div>
            <p className="text-sm text-[#0F172A] font-medium">
              Visible al cliente
            </p>

            <p className="mt-1 text-sm text-[#64748B]">
              El documento podrá mostrarse en el portal cliente.
            </p>
          </div>
        </label>

        <div className="mt-6">
          <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm text-white shadow-sm hover:opacity-95">
            {uploading ? 'Subiendo...' : 'Subir documento'}

            <input
              type="file"
              className="hidden"
              onChange={e => uploadDocument(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {documents.map(document => (
          <div
            key={document.id}
            className="rounded-[28px] border border-[#E2E8F0] bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669]">
                ≣
              </div>

              {document.visible_to_client && (
                <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs text-[#166534]">
                  Cliente
                </span>
              )}
            </div>

            <h2 className="mt-6 text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
              {document.title}
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#64748B]">
              {document.description || 'Sin descripción'}
            </p>

            <p className="mt-4 text-xs text-[#94A3B8]">
              {document.file_name}
            </p>

            <div className="mt-7 flex gap-3">
              <a
                href={document.file_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#0F172A] px-5 py-3 text-sm text-white transition hover:opacity-90"
              >
                Abrir
              </a>

              <button
                type="button"
                onClick={() =>
                  deleteDocument(document.id, document.file_path)
                }
                className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600 transition hover:bg-red-100"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}