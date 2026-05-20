import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePharmacy(id) {
  const [pharmacy,  setPharmacy]  = useState(null)
  const [equipment, setEquipment] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
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

        if (!cancelled) {
          setPharmacy(ph)
          setEquipment(eq)
        }
      } catch (err) {
        console.error('usePharmacy:', err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  return { pharmacy, equipment, loading }
}
