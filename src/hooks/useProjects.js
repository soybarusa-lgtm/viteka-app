import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activityLogs'

const SAFE_PROJECT_FIELDS = [
  'pharmacy_id',
  'project_type',
  'name',
  'status',
  'start_date',
  'expected_close_date',
  'assigned_technician_id',
  'assigned_commercial_id',
  'pipeline_stage',
  'amount',
  'priority',
]

function compactPayload(payload) {
  return Object.fromEntries(
    SAFE_PROJECT_FIELDS
      .filter(field => payload[field] !== '' && payload[field] !== undefined)
      .map(field => [field, payload[field] ?? null]),
  )
}

function shouldUseLegacyDivision(error, division) {
  return ['training', 'installation'].includes(division)
    && ['23514', 'PGRST204'].includes(error?.code)
}

export function useProjects({ type } = {}) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          pharmacy:pharmacies(id, pharmacy_name, city, province)
        `)
        .order('created_at', { ascending: false })

      if (type) query = query.eq('project_type', type)
      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setProjects(data || [])
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [type])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetch() }, [fetch])

  async function getCompanyId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (profileError) throw profileError
    return profile.company_id
  }

  async function insertProject(payload) {
    const companyId = await getCompanyId()
    const insertPayload = { ...compactPayload(payload), company_id: companyId }
    let { data, error: insertError } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select()
      .single()

    // Until the historical Supabase project receives the migration, preserve
    // the new operational division in its prefixed pipeline stage.
    if (insertError && shouldUseLegacyDivision(insertError, payload.project_type)) {
      const fallbackPayload = { ...insertPayload, project_type: 'support' }
      ;({ data, error: insertError } = await supabase
        .from('projects')
        .insert(fallbackPayload)
        .select()
        .single())
    }

    if (insertError) throw insertError
    return data
  }

  async function createProject(payload) {
    const data = await insertProject(payload)
    await logActivity({
      entity_type: 'project',
      entity_id: data.id,
      entity_name: data.name,
      action: 'create',
      new_value: data,
    })
    await fetch()
    return data
  }

  async function updateProject(id, payload) {
    const prev = projects.find(project => project.id === id)
    const { data, error: updateError } = await supabase
      .from('projects')
      .update(compactPayload(payload))
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    await logActivity({
      entity_type: 'project',
      entity_id: id,
      entity_name: data.name,
      action: 'update',
      old_value: prev,
      new_value: data,
    })
    await fetch()
    return data
  }

  async function deleteProject(id) {
    const prev = projects.find(project => project.id === id)
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', id)
    if (deleteError) throw deleteError
    await logActivity({
      entity_type: 'project',
      entity_id: id,
      entity_name: prev?.name,
      action: 'delete',
      old_value: prev,
    })
    await fetch()
  }

  async function moveStage(id, pipelineStage) {
    const { data, error: updateError } = await supabase
      .from('projects')
      .update({ pipeline_stage: pipelineStage })
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    setProjects(prev => prev.map(project => (
      project.id === id ? { ...project, pipeline_stage: pipelineStage } : project
    )))
    return data
  }

  return {
    projects,
    loading,
    error,
    refetch: fetch,
    createProject,
    updateProject,
    deleteProject,
    moveStage,
  }
}
