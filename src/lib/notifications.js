import { supabase } from './supabase'

export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  entityType = null,
  entityId = null,
}) {
  if (!userId) return

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      entity_type: entityType,
      entity_id: entityId,
      read: false,
    })

  if (error) {
    console.error('Notification error:', error.message)
    alert(`Notification error: ${error.message}`)
  }
}