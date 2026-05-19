import { supabase } from './supabase'

/**
 * Crea una notificación interna para un usuario.
 * @param {object} params
 * @param {string} params.user_id
 * @param {string} params.company_id
 * @param {string} params.title
 * @param {string} [params.message]
 * @param {string} [params.type]        - 'info' | 'warning' | 'error' | 'success'
 * @param {string} [params.entity_type]
 * @param {string} [params.entity_id]
 * @param {boolean} [params.send_email] - true para incidencias críticas
 */
export async function createNotification({
  user_id,
  company_id,
  title,
  message = '',
  type = 'info',
  entity_type = null,
  entity_id = null,
  send_email = false,
}) {
  try {
    await supabase.from('notifications').insert({
      user_id,
      company_id,
      title,
      message,
      type,
      entity_type,
      entity_id,
      send_email,
    })
  } catch (err) {
    console.error('Error al crear notificación:', err)
  }
}
