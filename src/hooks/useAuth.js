import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) loadProfile(data.session.user.id)
      else setLoading(false)
    })
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*, companies(name)')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  return { profile, loading }
}
