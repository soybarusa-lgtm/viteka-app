import { supabase } from './supabase'

function normalizeAccess(row) {
  return {
    id: row.id,
    auth_user_id: row.auth_user_id || null,
    profile_id: row.profile_id || null,
    pharmacy_id: row.pharmacy_id || null,
    person_id: row.person_id || null,
    role: row.role || 'cliente_user',
    is_active: row.is_active !== false,
    must_change_password: row.must_change_password === true,
    email: row.email || row.profile?.email || '',
    full_name: row.full_name || row.profile?.full_name || '',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }
}

function isMissingTable(error) {
  return ['PGRST205', '42P01'].includes(error?.code) || /client_portal_access/i.test(error?.message || '')
}

async function invokeSafely(functionName, payload) {
  try {
    const result = await supabase.functions.invoke(functionName, { body: payload })
    if (result.error) throw result.error
    return result.data
  } catch (error) {
    console.warn(`[client-access] ${functionName} no disponible:`, error?.message || error)
    return null
  }
}

export function normalizeClientAccess(row) {
  return normalizeAccess(row)
}

export function isClientAccessTableMissing(error) {
  return isMissingTable(error)
}

export async function createClientPortalAccess(payload) {
  const functionPayload = { ...payload, target_type: payload.target_type || 'client' }
  const fnResult = await invokeSafely('admin-create-user', functionPayload)
  if (fnResult?.access) return normalizeAccess(fnResult.access)
  const { data, error } = await supabase.from('client_portal_access').insert({
    auth_user_id: payload.auth_user_id || crypto.randomUUID(),
    profile_id: payload.profile_id || null,
    pharmacy_id: payload.pharmacy_id || null,
    person_id: payload.person_id || null,
    email: payload.email || '',
    full_name: payload.full_name || '',
    role: payload.role || 'cliente_user',
    is_active: payload.is_active !== false,
    must_change_password: payload.must_change_password !== false,
  }).select('*').single()
  if (error) throw error
  return normalizeAccess(data)
}

export async function updateClientPortalAccess(id, payload) {
  const { data, error } = await supabase.from('client_portal_access').update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return normalizeAccess(data)
}

export async function deleteClientPortalAccess(id) {
  const { error } = await supabase.from('client_portal_access').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function resendClientInvite(payload) {
  await invokeSafely('admin-reset-password', { ...payload, action: 'resend_invite' })
  return true
}

export async function resetClientPassword(payload) {
  await invokeSafely('admin-reset-password', { ...payload, action: 'reset_password' })
  return true
}
