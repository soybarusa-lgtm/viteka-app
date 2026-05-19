import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activityLogs'

export function usePharmacyDetail(pharmacyId) {
  const [pharmacy, setPharmacy] = useState(null)
  const [contacts, setContacts] = useState([])
  const [equipment, setEquipment] = useState([])
  const [documents, setDocuments] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true); setError(null)
    try {
      const [pRes, cRes, eRes, dRes, prRes] = await Promise.all([
        supabase.from('pharmacies').select('*').eq('id', pharmacyId).single(),
        supabase.from('pharmacy_contacts').select('*').eq('pharmacy_id', pharmacyId).order('full_name'),
        supabase.from('pharmacy_equipment').select('*').eq('pharmacy_id', pharmacyId).order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('pharmacy_id', pharmacyId).order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name, project_type, status, pipeline_stage, start_date, expected_close_date').eq('pharmacy_id', pharmacyId).order('created_at', { ascending: false }),
      ])
      if (pRes.error) throw pRes.error
      setPharmacy(pRes.data)
      setContacts(cRes.data || [])
      setEquipment(eRes.data || [])
      setDocuments(dRes.data || [])
      setProjects(prRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pharmacyId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // --- CONTACTS ---
  async function createContact(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    const { data, error } = await supabase.from('pharmacy_contacts')
      .insert({ ...payload, pharmacy_id: pharmacyId, company_id: profile.company_id })
      .select().single()
    if (error) throw error
    await logActivity({ entity_type: 'contact', entity_id: data.id, entity_name: data.full_name, action: 'create', new_value: data })
    await fetchAll()
    return data
  }

  async function updateContact(id, payload) {
    const { data, error } = await supabase.from('pharmacy_contacts').update(payload).eq('id', id).select().single()
    if (error) throw error
    await logActivity({ entity_type: 'contact', entity_id: id, entity_name: data.full_name, action: 'update', new_value: data })
    await fetchAll()
    return data
  }

  async function deleteContact(id) {
    const prev = contacts.find(c => c.id === id)
    const { error } = await supabase.from('pharmacy_contacts').delete().eq('id', id)
    if (error) throw error
    await logActivity({ entity_type: 'contact', entity_id: id, entity_name: prev?.full_name, action: 'delete', old_value: prev })
    await fetchAll()
  }

  // --- EQUIPMENT ---
  async function createEquipment(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    const { data, error } = await supabase.from('pharmacy_equipment')
      .insert({ ...payload, pharmacy_id: pharmacyId, company_id: profile.company_id })
      .select().single()
    if (error) throw error
    await logActivity({ entity_type: 'equipment', entity_id: data.id, entity_name: data.brand + ' ' + data.model, action: 'create', new_value: data })
    await fetchAll()
    return data
  }

  async function updateEquipment(id, payload) {
    const { data, error } = await supabase.from('pharmacy_equipment').update(payload).eq('id', id).select().single()
    if (error) throw error
    await logActivity({ entity_type: 'equipment', entity_id: id, entity_name: data.brand + ' ' + data.model, action: 'update', new_value: data })
    await fetchAll()
    return data
  }

  async function deleteEquipment(id) {
    const prev = equipment.find(e => e.id === id)
    const { error } = await supabase.from('pharmacy_equipment').delete().eq('id', id)
    if (error) throw error
    await logActivity({ entity_type: 'equipment', entity_id: id, entity_name: prev?.brand, action: 'delete', old_value: prev })
    await fetchAll()
  }

  // --- DOCUMENTS ---
  async function uploadDocument({ file, name, docType }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    const ext = file.name.split('.').pop()
    const path = `${profile.company_id}/${pharmacyId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('task-evidence').upload(path, file)
    if (upErr) throw upErr
    const { data, error } = await supabase.from('documents').insert({
      pharmacy_id: pharmacyId,
      company_id: profile.company_id,
      name: name || file.name,
      file_path: path,
      file_size: file.size,
      file_type: file.type,
      doc_type: docType || 'generic',
      uploaded_by: user.id,
    }).select().single()
    if (error) throw error
    await fetchAll()
    return data
  }

  async function deleteDocument(doc) {
    await supabase.storage.from('task-evidence').remove([doc.file_path])
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (error) throw error
    await fetchAll()
  }

  async function getDocumentUrl(filePath) {
    const { data } = await supabase.storage.from('task-evidence').createSignedUrl(filePath, 60)
    return data?.signedUrl
  }

  return {
    pharmacy, contacts, equipment, documents, projects,
    loading, error, refetch: fetchAll,
    createContact, updateContact, deleteContact,
    createEquipment, updateEquipment, deleteEquipment,
    uploadDocument, deleteDocument, getDocumentUrl,
  }
}
