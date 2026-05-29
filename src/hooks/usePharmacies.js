import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isActiveCommercialStatus } from '../lib/pharmacyStatus'

const BASE_SELECT = `
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
`

const STATUS_SELECT = `
  ${BASE_SELECT},
  commercial_status
`

function isMissingCommercialStatusColumn(error) {
  const message = error?.message || ''
  return message.includes('commercial_status')
}

async function selectPharmacies(companyId) {
  const withStatus = await supabase
    .from('pharmacies')
    .select(STATUS_SELECT)
    .eq('company_id', companyId)
    .order('pharmacy_name')

  if (!withStatus.error) {
    return { ...withStatus, supportsCommercialStatus: true }
  }

  if (!isMissingCommercialStatusColumn(withStatus.error)) {
    return { ...withStatus, supportsCommercialStatus: true }
  }

  const legacy = await supabase
    .from('pharmacies')
    .select(BASE_SELECT)
    .eq('company_id', companyId)
    .order('pharmacy_name')

  if (legacy.error) {
    return { ...legacy, supportsCommercialStatus: false }
  }

  return {
    data: (legacy.data || []).map(pharmacy => ({ ...pharmacy, commercial_status: null })),
    error: null,
    supportsCommercialStatus: false,
  }
}

export function usePharmacies(companyId) {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!companyId) {
      setPharmacies([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: err } = await selectPharmacies(companyId)

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
    const insertPayload = {
      ...payload,
      commercial_status: commercialStatus,
      is_active: isActiveCommercialStatus(commercialStatus),
      company_id: companyId,
    }

    let { data, error: err } = await supabase
      .from('pharmacies')
      .insert(insertPayload)
      .select()
      .single()

    if (err && isMissingCommercialStatusColumn(err)) {
      const { commercial_status, ...legacyPayload } = insertPayload
      const legacyResult = await supabase
        .from('pharmacies')
        .insert(legacyPayload)
        .select()
        .single()

      data = legacyResult.data
      err = legacyResult.error
    }

    if (err) throw err
    setPharmacies(prev => [...prev, data].sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name)))
    return data
  }

  async function updatePharmacy(id, payload) {
    const nextPayload = { ...payload }
    if (Object.prototype.hasOwnProperty.call(nextPayload, 'commercial_status')) {
      nextPayload.is_active = isActiveCommercialStatus(nextPayload.commercial_status)
    }

    let { data, error: err } = await supabase
      .from('pharmacies')
      .update(nextPayload)
      .eq('id', id)
      .select()
      .single()

    if (err && isMissingCommercialStatusColumn(err)) {
      const { commercial_status, ...legacyPayload } = nextPayload
      const legacyResult = await supabase
        .from('pharmacies')
        .update(legacyPayload)
        .eq('id', id)
        .select()
        .single()

      data = legacyResult.data
      err = legacyResult.error
    }

    if (err) throw err
    setPharmacies(prev => prev.map(p => p.id === id ? { ...p, ...data, equipment: p.equipment } : p))
    return data
  }

  async function updatePharmacyStatus(id, commercialStatus) {
    let { data, error: err } = await supabase
      .from('pharmacies')
      .update({
        commercial_status: commercialStatus,
        is_active: isActiveCommercialStatus(commercialStatus),
      })
      .eq('id', id)
      .select('id, commercial_status, is_active')
      .single()

    if (err && isMissingCommercialStatusColumn(err)) {
      const legacyResult = await supabase
        .from('pharmacies')
        .update({
          is_active: isActiveCommercialStatus(commercialStatus),
        })
        .eq('id', id)
        .select('id, is_active')
        .single()

      data = legacyResult.data
        ? { ...legacyResult.data, commercial_status: null }
        : legacyResult.data
      err = legacyResult.error
    }

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
