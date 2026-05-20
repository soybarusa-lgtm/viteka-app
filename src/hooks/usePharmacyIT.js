import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePharmacyIT(pharmacyId) {
  const [devices,  setDevices]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('pharmacy_it_devices')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setDevices(data ?? [])
    setLoading(false)
  }, [pharmacyId])

  useEffect(() => { load() }, [load])

  const createDevice = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('pharmacy_it_devices')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    setDevices(prev => [...prev, data])
    return data
  }, [])

  const updateDevice = useCallback(async (id, payload) => {
    const { data, error } = await supabase
      .from('pharmacy_it_devices')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setDevices(prev => prev.map(d => d.id === id ? data : d))
    return data
  }, [])

  const deleteDevice = useCallback(async (id) => {
    const { error } = await supabase.from('pharmacy_it_devices').delete().eq('id', id)
    if (error) throw error
    setDevices(prev => prev.filter(d => d.id !== id))
  }, [])

  return { devices, loading, error, createDevice, updateDevice, deleteDevice, reload: load }
}
