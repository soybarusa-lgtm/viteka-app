import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activityLogs'

export function useProjects({ type } = {}) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      let q = supabase
        .from('projects')
        .select(`
          *,
          pharmacy:pharmacies(id, pharmacy_name, city, province),
          technician:profiles!assigned_technician_id(id, full_name),
          commercial:profiles!assigned_commercial_id(id, full_name)
        `)
        .order('created_at', { ascending: false })
      if (type) q = q.eq('project_type', type)
      const { data, error } = await q
      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => { fetch() }, [fetch])

  async function createProject(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...payload, company_id: profile.company_id })
      .select()
      .single()
    if (error) throw error
    await logActivity({ entity_type: 'project', entity_id: data.id, entity_name: data.name, action: 'create', new_value: data })
    await fetch()
    return data
  }

  async function updateProject(id, payload) {
    const prev = projects.find(p => p.id === id)
    const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select().single()
    if (error) throw error
    await logActivity({ entity_type: 'project', entity_id: id, entity_name: data.name, action: 'update', old_value: prev, new_value: data })
    await fetch()
    return data
  }

  async function deleteProject(id) {
    const prev = projects.find(p => p.id === id)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    await logActivity({ entity_type: 'project', entity_id: id, entity_name: prev?.name, action: 'delete', old_value: prev })
    await fetch()
  }

  async function moveStage(id, pipeline_stage) {
    const { data, error } = await supabase.from('projects').update({ pipeline_stage }).eq('id', id).select().single()
    if (error) throw error
    setProjects(prev => prev.map(p => p.id === id ? { ...p, pipeline_stage } : p))
    return data
  }

  return { projects, loading, error, refetch: fetch, createProject, updateProject, deleteProject, moveStage }
}
