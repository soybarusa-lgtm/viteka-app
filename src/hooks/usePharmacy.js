import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePharmacy(pharmacyId) {
  const [pharmacy, setPharmacy]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('id', pharmacyId)
      .single()
    if (err) setError(err.message)
    else setPharmacy(data)
    setLoading(false)
  }, [pharmacyId])

  useEffect(() => { load() }, [load])

  async function update(payload) {
    const { data, error: err } = await supabase
      .from('pharmacies')
      .update(payload)
      .eq('id', pharmacyId)
      .select()
      .single()
    if (err) throw err
    setPharmacy(data)
    return data
  }

  return { pharmacy, loading, error, update, reload: load }
}
