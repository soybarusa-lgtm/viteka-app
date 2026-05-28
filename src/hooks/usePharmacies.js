import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isActiveCommercialStatus } from '../lib/pharmacyStatus'

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
        commercial_status,
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
    const commercialStatus = payload.commercial_status || 'activo'
    const { data, error: err } = await supabase
      .from('pharmacies')
      .insert({
        ...payload,
        commercial_status: commercialStatus,
        is_active: isActiveCommercialStatus(commercialStatus),
        company_id: companyId,
      })
      .select()
      .single()
    if (err) throw err
    setPharmacies(prev => [...prev, data].sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name)))
    return data
  }

  async function updatePharmacy(id, payload) {
    const nextPayload = { ...payload }
    if (Object.prototype.hasOwnProperty.call(nextPayload, 'commercial_status')) {
      nextPayload.is_active = isActiveCommercialStatus(nextPayload.commercial_status)
    }

    const { data, error: err } = await supabase
      .from('pharmacies')
      .update(nextPayload)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    setPharmacies(prev => prev.map(p => p.id === id ? { ...p, ...data, equipment: p.equipment } : p))
    return data
  }

  async function updatePharmacyStatus(id, commercialStatus) {
    const { data, error: err } = await supabase
      .from('pharmacies')
      .update({
        commercial_status: commercialStatus,
        is_active: isActiveCommercialStatus(commercialStatus),
      })
      .eq('id', id)
      .select('id, commercial_status, is_active')
      .single()

    if (err) throw err
    setPharmacies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    return data
  }

  async function deletePharmacy(id) {
    const { error: err } = await supabase.from('pharmacies').delete().eq('id', id)
    if (err) throw err
    setPharmacies(prev => prev.filter(p => p.id !== id))
  }

  return { pharmacies, loading, error, createPharmacy, updatePharmacy, updatePharmacyStatus, deletePharmacy, reload: load }
}
