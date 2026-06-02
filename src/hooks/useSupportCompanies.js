import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MOCK_SUPPORT_COMPANIES } from '../lib/supportMockData'

export function useSupportCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('support_companies').select('*').order('name')
    setCompanies(error ? MOCK_SUPPORT_COMPANIES : data || [])
    if (error) console.warn('[support] Compañías demo activas:', error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  return { companies, loading, reload }
}
