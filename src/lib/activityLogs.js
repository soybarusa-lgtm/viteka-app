import { supabase } from './supabase'

export async function createActivityLog({
  userId,
  entityType,
  entityId,
  action,
  oldValue = null,
  newValue = null,
}) {
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_value: oldValue,
      new_value: newValue,
    })

  if (error) {
    console.error('Activity log error:', error.message)
  }
}