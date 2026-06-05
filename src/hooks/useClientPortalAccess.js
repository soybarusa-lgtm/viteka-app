import { useCallback, useEffect, useState } from 'react'
import { clientPortalAccessMock } from '../lib/configurationMockData'
import {
  createClientPortalAccess,
  deleteClientPortalAccess,
  isClientAccessTableMissing,
  normalizeClientAccess,
  resendClientInvite,
  resetClientPassword,
  updateClientPortalAccess,
} from '../lib/clientPortalAccess'
import { supabase } from '../lib/supabase'
import { logAuditEvent } from '../lib/auditLog'

export function useClientPortalAccess({ profileId = null, pharmacyId = null } = {}) {
  const [accessList, setAccessList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingMocks, setUsingMocks] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase.from('client_portal_access').select('*, profile:profiles(full_name, email)').order('created_at', { ascending: false })
    if (profileId) query = query.eq('profile_id', profileId)
    if (pharmacyId) query = query.eq('pharmacy_id', pharmacyId)
    const { data, error: accessError } = await query
    if (accessError) {
      if (!isClientAccessTableMissing(accessError)) setError(accessError.message)
      setUsingMocks(true)
      setAccessList(clientPortalAccessMock)
      setLoading(false)
      return
    }
    setUsingMocks(false)
    setAccessList((data || []).map(normalizeClientAccess))
    setLoading(false)
  }, [pharmacyId, profileId])

  /* eslint-disable react-hooks/set-state-in-effect -- reload sincroniza el estado inicial del listado. */
  useEffect(() => {
    reload()
  }, [reload])
  /* eslint-enable react-hooks/set-state-in-effect */

  const createAccess = useCallback(async payload => {
    const access = usingMocks
      ? normalizeClientAccess({ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      : await createClientPortalAccess(payload)
    if (usingMocks) setAccessList(prev => [access, ...prev])
    else await reload()
    await logAuditEvent('client_access.create', 'client_portal_access', access.id, null, payload)
    return access
  }, [reload, usingMocks])

  const updateAccess = useCallback(async (id, payload) => {
    const access = usingMocks
      ? normalizeClientAccess({ id, ...payload, updated_at: new Date().toISOString() })
      : await updateClientPortalAccess(id, payload)
    if (usingMocks) setAccessList(prev => prev.map(item => item.id === id ? access : item))
    else await reload()
    await logAuditEvent('client_access.update', 'client_portal_access', id, null, payload)
    return access
  }, [reload, usingMocks])

  const disableAccess = useCallback(async id => updateAccess(id, { is_active: false }), [updateAccess])
  const activateAccess = useCallback(async id => updateAccess(id, { is_active: true }), [updateAccess])
  const resendInvite = useCallback(async payload => {
    await resendClientInvite(payload)
    await logAuditEvent('client_access.invite', 'client_portal_access', payload?.id || null, null, payload)
  }, [])
  const resetPassword = useCallback(async payload => {
    await resetClientPassword(payload)
    await logAuditEvent('client_access.reset_password', 'client_portal_access', payload?.id || null, null, payload)
  }, [])
  const deleteAccess = useCallback(async id => {
    if (!usingMocks) await deleteClientPortalAccess(id)
    setAccessList(prev => prev.filter(item => item.id !== id))
    await logAuditEvent('client_access.delete', 'client_portal_access', id, null, null)
  }, [usingMocks])

  return {
    accessList,
    loading,
    error,
    usingMocks,
    reload,
    createAccess,
    updateAccess,
    activateAccess,
    disableAccess,
    resendInvite,
    resetPassword,
    deleteAccess,
  }
}
