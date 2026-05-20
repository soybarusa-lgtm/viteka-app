import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

// ─── usePharmacyEquipment ──────────────────────────────────────────────────
// Gestiona el registro único de equipamiento de una farmacia (upsert)
export function usePharmacyEquipment(pharmacyId) {
  const [equipment, setEquipment] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('pharmacy_equipment')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .maybeSingle()
    if (err) setError(err.message)
    else setEquipment(data)
    setLoading(false)
  }, [pharmacyId])

  useEffect(() => { load() }, [load])

  async function save(payload) {
    setSaving(true)
    setError(null)
    const { data: profile } = await supabase
      .from('profiles').select('company_id').single()
    const base = { pharmacy_id: pharmacyId, company_id: profile.company_id, ...payload }
    let result
    if (equipment?.id) {
      result = await supabase.from('pharmacy_equipment').update(base).eq('id', equipment.id).select().single()
    } else {
      result = await supabase.from('pharmacy_equipment').insert(base).select().single()
    }
    if (result.error) { setError(result.error.message); setSaving(false); throw result.error }
    setEquipment(result.data)
    setSaving(false)
  }

  return { equipment, loading, saving, error, save, reload: load }
}

// ─── usePharmacyDevices ───────────────────────────────────────────────────
// CRUD de equipos informáticos individuales de una farmacia
export function usePharmacyDevices(pharmacyId) {
  const [devices, setDevices]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('pharmacy_devices')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('sort_order')
    if (err) setError(err.message)
    else setDevices(data || [])
    setLoading(false)
  }, [pharmacyId])

  useEffect(() => { load() }, [load])

  async function addDevice(payload) {
    const { data: profile } = await supabase
      .from('profiles').select('company_id').single()
    const { data, error: err } = await supabase
      .from('pharmacy_devices')
      .insert({ pharmacy_id: pharmacyId, company_id: profile.company_id, ...payload })
      .select().single()
    if (err) throw err
    setDevices(prev => [...prev, data])
    return data
  }

  async function updateDevice(id, payload) {
    const { data, error: err } = await supabase
      .from('pharmacy_devices').update(payload).eq('id', id).select().single()
    if (err) throw err
    setDevices(prev => prev.map(d => d.id === id ? data : d))
    return data
  }

  async function deleteDevice(id) {
    const { error: err } = await supabase
      .from('pharmacy_devices').delete().eq('id', id)
    if (err) throw err
    setDevices(prev => prev.filter(d => d.id !== id))
  }

  return { devices, loading, error, addDevice, updateDevice, deleteDevice, reload: load }
}
