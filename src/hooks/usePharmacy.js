import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePharmacy(id) {
  const [pharmacy,  setPharmacy]  = useState(null)
  const [equipment, setEquipment] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const { data: ph, error: phErr } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .single()
      if (phErr) throw phErr

      const { data: eq } = await supabase
        .from('pharmacy_equipment')
        .select('*')
        .eq('pharmacy_id', id)
        .maybeSingle()

      setPharmacy(ph)
      setEquipment(eq)
    } catch (err) {
      console.error('usePharmacy:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    let cancelled = false
    load().catch(() => {})
    return () => { cancelled = true }
  }, [load])

  return { pharmacy, equipment, loading, error, refetch: load }
}
