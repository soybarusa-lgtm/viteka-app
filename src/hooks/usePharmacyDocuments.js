import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DOCUMENT_BUCKET = 'task-evidence'

function safeStorageName(name = 'documento') {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'documento'
}

export function usePharmacyDocuments(pharmacyId) {
  const [documents, setDocuments] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) {
      setDocuments([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('pharmacy_documents')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
      setDocuments([])
    } else {
      setDocuments(data ?? [])
    }
    setLoading(false)
  }, [pharmacyId])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Firma: uploadDocument(file, { name, category, pharmacy_id, company_id })
  const uploadDocument = useCallback(async (file, { name, category, pharmacy_id: pid, company_id: companyId }) => {
    const ext  = file.name.split('.').pop()
    const path = `${companyId}/${pid}/${Date.now()}_${safeStorageName(file.name)}`

    const { error: upErr } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, { upsert: false })
    if (upErr) throw upErr

    const { data, error: dbErr } = await supabase
      .from('pharmacy_documents')
      .insert({
        pharmacy_id:  pid,
        company_id:   companyId,
        name:         name || file.name,
        category:     category || 'Otros',
        storage_path: path,
        public_url:   '',
        file_ext:     ext,
        size_bytes:   file.size,
      })
      .select()
      .single()
    if (dbErr) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([path])
      throw dbErr
    }
    setDocuments(prev => [data, ...prev])
    return data
  }, [])

  const getDocumentUrl = useCallback(async (doc) => {
    if (!doc) return ''
    const fallbackUrl = doc.public_url || doc.file_url || ''
    if (!doc.storage_path) return fallbackUrl

    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(doc.storage_path, 60 * 10)

    if (!error && data?.signedUrl) return data.signedUrl
    return fallbackUrl
  }, [])

  const deleteDocument = useCallback(async (docOrId, storagePath) => {
    const doc = typeof docOrId === 'object'
      ? docOrId
      : { id: docOrId, storage_path: storagePath }

    if (!doc?.id) throw new Error('Documento sin identificador')

    const { error } = await supabase
      .from('pharmacy_documents')
      .delete()
      .eq('id', doc.id)

    if (error) throw error

    let storageError = null
    if (doc.storage_path) {
      const { error: removeError } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .remove([doc.storage_path])
      storageError = removeError
    }

    setDocuments(prev => prev.filter(d => d.id !== doc.id))
    return { storageError }
  }, [])

  return { documents, loading, error, uploadDocument, deleteDocument, getDocumentUrl, reload: load }
}
