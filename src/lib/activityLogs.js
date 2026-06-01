import { supabase } from './supabase'

/**
 * Registra una acción en el log de auditoría.
 * @param {object} params
 * @param {string} params.entity_type  - 'pharmacy' | 'project' | 'task' | 'incident' | etc.
 * @param {string} params.entity_id    - UUID de la entidad
 * @param {string} params.entity_name  - Nombre legible de la entidad
 * @param {string} params.action       - 'create' | 'update' | 'delete'
 * @param {object} [params.old_value]  - Valor anterior (para updates y deletes)
 * @param {object} [params.new_value]  - Valor nuevo (para creates y updates)
 */
export async function logActivity({ entity_type, entity_id, entity_name, action, old_value = null, new_value = null }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) return

    const payload = {
      company_id: profile.company_id,
      user_id: user.id,
      user_name: profile.full_name,
      entity_type,
      entity_id,
      entity_name,
      action,
      old_value,
      new_value,
    }
    const { error } = await supabase.from('activity_logs').insert(payload)
    if (error?.code === 'PGRST204' && error.message?.includes("'user_name'")) {
      const legacyPayload = { ...payload }
      delete legacyPayload.user_name
      await supabase.from('activity_logs').insert(legacyPayload)
    }
  } catch (err) {
    // El log no debe romper el flujo principal
    console.error('Error al registrar actividad:', err)
  }
}

// Alias para compatibilidad con imports existentes
export const createActivityLog = logActivity
