import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activityLogs'

export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!projectId) return
    setLoading(true); setError(null)
    try {
      const [pRes, tRes, iRes] = await Promise.all([
        supabase.from('projects').select(`
          *,
          pharmacy:pharmacies(id, pharmacy_name, city, province),
          technician:profiles!assigned_technician_id(id, full_name),
          commercial:profiles!assigned_commercial_id(id, full_name)
        `).eq('id', projectId).single(),
        supabase.from('tasks').select('*, assignee:profiles!assigned_technician_id(id, full_name)').eq('project_id', projectId).order('created_at'),
        supabase.from('incidents').select('*, assignee:profiles!assigned_technician_id(id, full_name)').eq('project_id', projectId).order('created_at', { ascending: false }),
      ])
      if (pRes.error) throw pRes.error
      setProject(pRes.data)
      setTasks(tRes.data || [])
      setIncidents(iRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // TASKS
  async function createTask(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    const { data, error } = await supabase.from('tasks')
      .insert({ ...payload, project_id: projectId, company_id: profile.company_id })
      .select().single()
    if (error) throw error
    await logActivity({ entity_type: 'task', entity_id: data.id, entity_name: data.title, action: 'create', new_value: data })
    await fetchAll(); return data
  }

  async function updateTask(id, payload) {
    const { data, error } = await supabase.from('tasks').update(payload).eq('id', id).select().single()
    if (error) throw error
    await fetchAll(); return data
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    await fetchAll()
  }

  // INCIDENTS
  async function createIncident(payload) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    const { data, error } = await supabase.from('incidents')
      .insert({ ...payload, project_id: projectId, pharmacy_id: project?.pharmacy_id, company_id: profile.company_id })
      .select().single()
    if (error) throw error
    await logActivity({ entity_type: 'incident', entity_id: data.id, entity_name: data.title, action: 'create', new_value: data })
    await fetchAll(); return data
  }

  async function updateIncident(id, payload) {
    const { data, error } = await supabase.from('incidents').update(payload).eq('id', id).select().single()
    if (error) throw error
    await fetchAll(); return data
  }

  return { project, tasks, incidents, loading, error, refetch: fetchAll, createTask, updateTask, deleteTask, createIncident, updateIncident }
}
