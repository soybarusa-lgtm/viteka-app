import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, companies(name)')
      .eq('id', userId)
      .maybeSingle()
    if (error) console.error('[useAuth] loadProfile error:', error.message)
    setProfile(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) loadProfile(data.session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  return { profile, loading }
}
