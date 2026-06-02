import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
const ALLOWED_FIELDS = new Set([
  'pharmacy_id',
  'company_id',
  'name',
  'phone',
  'email',
  'role',
  'is_responsible',
  'areas',
  'custom_area',
  'observations',
])

function sanitizePersonPayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => ALLOWED_FIELDS.has(key) && value !== undefined)
  )
}

export function usePharmacyPersons(pharmacyId) {
  const [persons, setPersons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('pharmacy_persons')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setPersons(data ?? [])
    setLoading(false)
  }, [pharmacyId])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const createPerson = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('pharmacy_persons')
      .insert(sanitizePersonPayload(payload))
      .select()
      .single()
    if (error) throw error
    setPersons(prev => [...prev, data])
    return data
  }, [])

  const updatePerson = useCallback(async (id, payload) => {
    const { data, error } = await supabase
      .from('pharmacy_persons')
      .update(sanitizePersonPayload(payload))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setPersons(prev => prev.map(p => p.id === id ? data : p))
    return data
  }, [])

  const deletePerson = useCallback(async (id) => {
    const { error } = await supabase
      .from('pharmacy_persons')
      .delete()
      .eq('id', id)
    if (error) throw error
    setPersons(prev => prev.filter(p => p.id !== id))
  }, [])

  return { persons, loading, error, createPerson, updatePerson, deletePerson, reload: load }
}
