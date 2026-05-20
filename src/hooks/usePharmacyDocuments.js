import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePharmacyDocuments(pharmacyId) {
  const [documents, setDocuments] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('pharmacy_documents')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setDocuments(data ?? [])
    setLoading(false)
  }, [pharmacyId])

  useEffect(() => { load() }, [load])

  const uploadDocument = useCallback(async ({ file, category, name, pharmacyId: pid, companyId }) => {
    const ext      = file.name.split('.').pop()
    const path     = `${companyId}/${pid}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage
      .from('task-evidence')
      .upload(path, file, { upsert: false })
    if (upErr) throw upErr

    const { data: urlData } = supabase.storage.from('task-evidence').getPublicUrl(path)

    const { data, error: dbErr } = await supabase
      .from('pharmacy_documents')
      .insert({ pharmacy_id: pid, company_id: companyId, name: name || file.name, category, storage_path: path, public_url: urlData.publicUrl, file_ext: ext, size_bytes: file.size })
      .select()
      .single()
    if (dbErr) throw dbErr
    setDocuments(prev => [data, ...prev])
    return data
  }, [])

  const deleteDocument = useCallback(async (doc) => {
    await supabase.storage.from('task-evidence').remove([doc.storage_path])
    const { error } = await supabase.from('pharmacy_documents').delete().eq('id', doc.id)
    if (error) throw error
    setDocuments(prev => prev.filter(d => d.id !== doc.id))
  }, [])

  return { documents, loading, error, uploadDocument, deleteDocument, reload: load }
}
