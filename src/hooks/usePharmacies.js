import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePharmacies(companyId) {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('pharmacies')
      .select('id, pharmacy_name, legal_type, province, city, is_active, created_at')
      .eq('company_id', companyId)
      .order('pharmacy_name')
    if (err) setError(err.message)
    else setPharmacies(data || [])
    setLoading(false)
  }, [companyId])

  useEffect(() => { load() }, [load])

  async function createPharmacy(payload) {
    const { data, error: err } = await supabase
      .from('pharmacies')
      .insert({ ...payload, company_id: companyId })
      .select()
      .single()
    if (err) throw err
    setPharmacies(prev => [...prev, data].sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name)))
    return data
  }

  async function updatePharmacy(id, payload) {
    const { data, error: err } = await supabase
      .from('pharmacies')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setPharmacies(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  async function deletePharmacy(id) {
    const { error: err } = await supabase.from('pharmacies').delete().eq('id', id)
    if (err) throw err
    setPharmacies(prev => prev.filter(p => p.id !== id))
  }

  return { pharmacies, loading, error, createPharmacy, updatePharmacy, deletePharmacy, reload: load }
}
