import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PROFILE_SELECT = 'id, role, active, is_active, must_change_password, full_name, email, company_id, pharmacy_id, companies(name)'
const FALLBACK_SELECT = 'id, role, must_change_password, full_name, email, company_id, pharmacy_id'

function normalizeProfile(data) {
  if (!data) return null
  return {
    ...data,
    active: data.active ?? data.is_active ?? true,
    is_active: data.is_active ?? data.active ?? true,
    must_change_password: data.must_change_password === true,
  }
}

export function useAuth() {
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    setLoading(true)

    const primary = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .maybeSingle()

    let profileData = primary.data ?? null

    if (primary.error) {
      console.error('[useAuth] loadProfile error:', primary.error.message)

      const fallback = await supabase
        .from('profiles')
        .select(FALLBACK_SELECT)
        .eq('id', userId)
        .maybeSingle()

      if (fallback.error) {
        console.error('[useAuth] fallback profile error:', fallback.error.message)
      }

      profileData = fallback.data ?? null
    }

    setProfile(normalizeProfile(profileData))
    setLoading(false)
    return profileData
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return

      const currentSession = data.session ?? null
      setSession(currentSession)

      if (currentSession) {
        loadProfile(currentSession.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, nextSession) => {
      if (!active) return

      setSession(nextSession)

      if (nextSession) {
        loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      return null
    }

    return loadProfile(userId)
  }, [loadProfile, session?.user?.id])

  return {
    loading,
    profile,
    refreshProfile,
    session,
    userId: session?.user?.id ?? profile?.id ?? null,
  }
}
