import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activityLogs'

export function usePharmacies() {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('pharmacy_name', { ascending: true })
      if (error) throw error
      setPharmacies(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function createPharmacy(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()

    const { data, error } = await supabase
      .from('pharmacies')
      .insert({ ...payload, company_id: profile.company_id })
      .select()
      .single()
    if (error) throw error

    await logActivity({
      entity_type: 'pharmacy', entity_id: data.id,
      entity_name: data.pharmacy_name, action: 'create', new_value: data,
    })
    await fetch()
    return data
  }

  async function updatePharmacy(id, payload) {
    const prev = pharmacies.find(p => p.id === id)
    const { data, error } = await supabase
      .from('pharmacies').update(payload).eq('id', id).select().single()
    if (error) throw error

    await logActivity({
      entity_type: 'pharmacy', entity_id: id,
      entity_name: data.pharmacy_name, action: 'update',
      old_value: prev, new_value: data,
    })
    await fetch()
    return data
  }

  async function deletePharmacy(id) {
    const prev = pharmacies.find(p => p.id === id)
    const { error } = await supabase.from('pharmacies').delete().eq('id', id)
    if (error) throw error

    await logActivity({
      entity_type: 'pharmacy', entity_id: id,
      entity_name: prev?.pharmacy_name, action: 'delete', old_value: prev,
    })
    await fetch()
  }

  return { pharmacies, loading, error, refetch: fetch, createPharmacy, updatePharmacy, deletePharmacy }
}
