import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MOCK_SUPPORT_CONTACTS } from '../lib/supportMockData'

export function useSupportContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('support_contacts').select('*, support_companies(name)').order('name')
    setContacts(error ? MOCK_SUPPORT_CONTACTS : (data || []).map(contact => ({ ...contact, company_name: contact.support_companies?.name || '' })))
    if (error) console.warn('[support] Contactos demo activos:', error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  return { contacts, loading, reload }
}
