import { supabase } from '../lib/supabase'
import { logAuditEvent } from '../lib/auditLog'

export function usePasswordManagement() {
  async function changeOwnPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    await logAuditEvent('password.change', 'auth_user', 'self', null, { changed: true })
    return true
  }

  async function requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    await logAuditEvent('password.reset_requested', 'auth_user', email, null, { email })
    return true
  }

  async function adminResetPassword(payload) {
    const { data, error } = await supabase.functions.invoke('admin-reset-password', { body: payload })
    if (error) throw error
    await logAuditEvent('password.admin_reset', 'auth_user', payload?.email || payload?.id || null, null, payload)
    return data
  }

  async function forcePasswordChange(payload) {
    const result = await adminResetPassword({ ...payload, force_change: true })
    await logAuditEvent('password.force_change', 'auth_user', payload?.email || payload?.id || null, null, payload)
    return result
  }

  async function resendActivationEmail(payload) {
    const result = await supabase.functions.invoke('admin-reset-password', { body: { ...payload, action: 'resend_invite' } })
    if (result.error) throw result.error
    await logAuditEvent('password.resend_activation', 'auth_user', payload?.email || payload?.id || null, null, payload)
    return result.data
  }

  return {
    changeOwnPassword,
    requestPasswordReset,
    adminResetPassword,
    forcePasswordChange,
    resendActivationEmail,
  }
}
