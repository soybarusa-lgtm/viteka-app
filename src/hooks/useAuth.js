import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
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
      const currentSession = data.session ?? null
      setSession(currentSession)
      if (currentSession) loadProfile(currentSession.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, nextSession) => {
      setSession(nextSession)
      if (nextSession) loadProfile(nextSession.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  return { profile, loading, session, userId: profile?.id || session?.user?.id || profile?.auth_user_id || null }
}
