import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DATE_FIELDS = ['install_date', 'warranty_end']

/**
 * Convierte de forma recursiva cualquier string vacío a null.
 * Además, si is_viteka=false fuerza a null los campos de fecha top-level.
 */
function sanitize(payload) {
  function clean(val) {
    if (val === '' || val === undefined) return null
    if (Array.isArray(val)) return val.map(clean)
    if (val !== null && typeof val === 'object') {
      return Object.fromEntries(
        Object.entries(val).map(([k, v]) => [k, clean(v)])
      )
    }
    return val
  }

  const out = clean(payload)

  // Garantizar null en fechas top-level si no es equipo Viteka
  if (!out.is_viteka) {
    DATE_FIELDS.forEach(f => { out[f] = null })
  }

  return out
}

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

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const createDevice = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('pharmacy_it_devices')
      .insert(sanitize(payload))
      .select()
      .single()
    if (error) throw error
    setDevices(prev => [...prev, data])
    return data
  }, [])

  const updateDevice = useCallback(async (id, payload) => {
    const { data, error } = await supabase
      .from('pharmacy_it_devices')
      .update(sanitize(payload))
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
