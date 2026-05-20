import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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

  useEffect(() => { load() }, [load])

  const createPerson = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('pharmacy_persons')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    setPersons(prev => [...prev, data])
    return data
  }, [])

  const updatePerson = useCallback(async (id, payload) => {
    const { data, error } = await supabase
      .from('pharmacy_persons')
      .update(payload)
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
