import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePharmacies(companyId) {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const load = useCallback(async () => {
    if (!companyId) {
      setPharmacies([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('pharmacies')
      .select(`
        id,
        pharmacy_name,
        legal_type,
        owner_name,
        razon_social,
        cb_owners,
        province,
        city,
        postal_code,
        schedule,
        contact_phone,
        contact_email,
        is_active,
        created_at
      `)
      .eq('company_id', companyId)
      .order('pharmacy_name')

    if (err) {
      setError(err.message)
      setPharmacies([])
      setLoading(false)
      return
    }

    const pharmacyRows = data || []
    const pharmacyIds = pharmacyRows.map(p => p.id)

    let equipmentByPharmacy = {}
    if (pharmacyIds.length > 0) {
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('pharmacy_equipment')
        .select('pharmacy_id, erp_detail')
        .in('pharmacy_id', pharmacyIds)

      if (equipmentError) {
        setError(equipmentError.message)
      } else {
        equipmentByPharmacy = (equipmentData || []).reduce((acc, item) => {
          acc[item.pharmacy_id] = item
          return acc
        }, {})
      }
    }

    setPharmacies(pharmacyRows.map(pharmacy => ({
      ...pharmacy,
      equipment: equipmentByPharmacy[pharmacy.id] || null,
    })))
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
