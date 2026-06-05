import { supabase } from './supabase'

export async function logAuditEvent(action, entityType, entityId, oldValues = null, newValues = null) {
  try {
    const { data: authData } = await supabase.auth.getUser()
    const user = authData?.user
    const payload = {
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      old_values: oldValues,
      new_values: newValues,
      actor_id: user?.id || null,
      actor_email: user?.email || null,
      summary: buildAuditSummary(action, entityType, oldValues, newValues),
    }
    const { error } = await supabase.from('audit_logs').insert(payload)
    if (error) throw error
  } catch (error) {
    console.warn('[audit] evento no persistido:', error?.message || error)
  }
}

function buildAuditSummary(action, entityType, oldValues, newValues) {
  const changes = oldValues && newValues
    ? Object.keys({ ...oldValues, ...newValues }).filter(key => JSON.stringify(oldValues?.[key]) !== JSON.stringify(newValues?.[key]))
    : []
  if (changes.length > 0) return `${action} en ${entityType}: ${changes.slice(0, 3).join(', ')}`
  return `${action} en ${entityType}`
}
