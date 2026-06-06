import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/activityLogs'

const HITO_PREFIX = '[Hito] '
const MISSING_SCHEMA_CODES = ['42P01', 'PGRST204', 'PGRST205']
const PROJECT_DETAIL_SELECT_BASE = `
  *,
  pharmacy:pharmacies(id, pharmacy_name, city, province)
`
const PROJECT_DETAIL_SELECT_WITH_ASSIGNEES = `
  *,
  pharmacy:pharmacies(id, pharmacy_name, city, province),
  commercial:profiles!assigned_commercial_id(id, full_name, email),
  technician:profiles!assigned_technician_id(id, full_name, email)
`

function isMissingSchema(error) {
  return MISSING_SCHEMA_CODES.includes(error?.code)
}

function isMissingAssigneeRelationship(error) {
  const message = error?.message || ''
  return ['PGRST200', 'PGRST201', 'PGRST204'].includes(error?.code)
    || message.includes('assigned_commercial_id')
    || message.includes('assigned_technician_id')
    || message.includes('profiles')
}

function compact(payload, fields) {
  return Object.fromEntries(
    fields
      .filter(field => payload[field] !== '' && payload[field] !== undefined)
      .map(field => [field, payload[field] ?? null]),
  )
}

function fallbackMilestones(tasks) {
  return tasks
    .filter(task => task.title?.startsWith(HITO_PREFIX))
    .map(task => ({
      id: `task:${task.id}`,
      task_id: task.id,
      title: task.title.slice(HITO_PREFIX.length),
      milestone_type: task.description?.match(/^\[([^\]]+)\]/)?.[1] || 'milestone',
      notes: task.description?.replace(/^\[[^\]]+\]\s*/, '') || '',
      status: task.status,
      start_at: task.due_date,
      end_at: task.due_date,
      fallback: true,
      created_at: task.created_at,
    }))
}

function fallbackMessage(log) {
  return {
    id: log.id,
    author_id: log.user_id,
    author_name: log.author_name,
    created_at: log.created_at,
    audience: log.new_value?.audience || 'internal',
    channel: log.new_value?.channel || 'note',
    subject: log.new_value?.subject || '',
    message: log.new_value?.message || '',
    fallback: true,
  }
}

async function selectProject(projectId) {
  const withAssignees = await supabase
    .from('projects')
    .select(PROJECT_DETAIL_SELECT_WITH_ASSIGNEES)
    .eq('id', projectId)
    .single()

  if (!withAssignees.error) return withAssignees
  if (!isMissingAssigneeRelationship(withAssignees.error)) return withAssignees

  const legacy = await supabase
    .from('projects')
    .select(PROJECT_DETAIL_SELECT_BASE)
    .eq('id', projectId)
    .single()

  if (legacy.error) return legacy
  return {
    data: {
      ...legacy.data,
      commercial: null,
      technician: null,
    },
    error: null,
  }
}

export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [incidents, setIncidents] = useState([])
  const [milestones, setMilestones] = useState([])
  const [messages, setMessages] = useState([])
  const [capabilities, setCapabilities] = useState({ nativeMilestones: false, nativeMessages: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [projectResponse, tasksResponse, incidentsResponse, milestonesResponse, messagesResponse, logsResponse] = await Promise.all([
        selectProject(projectId),
        supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at'),
        supabase.from('incidents').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('project_milestones').select('*').eq('project_id', projectId).order('start_at'),
        supabase.from('project_messages').select('*, author:profiles!author_id(id, full_name)').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('id, user_id, new_value, created_at').eq('entity_type', 'project_message').eq('entity_id', projectId).order('created_at', { ascending: false }),
      ])

      if (projectResponse.error) throw projectResponse.error
      if (tasksResponse.error) throw tasksResponse.error
      if (incidentsResponse.error) throw incidentsResponse.error

      const taskData = tasksResponse.data || []
      const hasNativeMilestones = !milestonesResponse.error
      const hasNativeMessages = !messagesResponse.error

      if (milestonesResponse.error && !isMissingSchema(milestonesResponse.error)) throw milestonesResponse.error
      if (messagesResponse.error && !isMissingSchema(messagesResponse.error)) throw messagesResponse.error
      if (logsResponse.error) throw logsResponse.error

      setProject(projectResponse.data)
      setTasks(taskData)
      setIncidents(incidentsResponse.data || [])
      setMilestones(hasNativeMilestones ? (milestonesResponse.data || []) : fallbackMilestones(taskData))
      setMessages(hasNativeMessages
        ? (messagesResponse.data || []).map(message => ({ ...message, author_name: message.author?.full_name }))
        : (logsResponse.data || []).map(fallbackMessage))
      setCapabilities({ nativeMilestones: hasNativeMilestones, nativeMessages: hasNativeMessages })
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll() }, [fetchAll])

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id, full_name')
      .eq('id', user.id)
      .single()
    if (profileError) throw profileError
    return profile
  }

  async function createTask(payload) {
    const profile = await getProfile()
    const taskPayload = compact(payload, ['title', 'description', 'status', 'due_date', 'priority'])
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({ ...taskPayload, project_id: projectId, company_id: profile.company_id })
      .select()
      .single()
    if (insertError) throw insertError
    await logActivity({ entity_type: 'task', entity_id: data.id, entity_name: data.title, action: 'create', new_value: data })
    await fetchAll()
    return data
  }

  async function updateTask(id, payload) {
    const taskPayload = compact(payload, ['title', 'description', 'status', 'due_date', 'priority'])
    const { data, error: updateError } = await supabase.from('tasks').update(taskPayload).eq('id', id).select().single()
    if (updateError) throw updateError
    await logActivity({ entity_type: 'task', entity_id: data.id, entity_name: data.title, action: 'update', new_value: data })
    await fetchAll()
    return data
  }

  async function deleteTask(id) {
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id)
    if (deleteError) throw deleteError
    await fetchAll()
  }

  async function createIncident(payload) {
    const profile = await getProfile()
    const incidentPayload = compact(payload, ['title', 'description', 'priority', 'status', 'resolved_at'])
    const { data, error: insertError } = await supabase
      .from('incidents')
      .insert({
        ...incidentPayload,
        project_id: projectId,
        pharmacy_id: project?.pharmacy_id || null,
        company_id: profile.company_id,
      })
      .select()
      .single()
    if (insertError) throw insertError
    await logActivity({ entity_type: 'incident', entity_id: data.id, entity_name: data.title, action: 'create', new_value: data })
    await fetchAll()
    return data
  }

  async function updateIncident(id, payload) {
    const incidentPayload = compact(payload, ['title', 'description', 'priority', 'status', 'resolved_at'])
    const { data, error: updateError } = await supabase.from('incidents').update(incidentPayload).eq('id', id).select().single()
    if (updateError) throw updateError
    await logActivity({ entity_type: 'incident', entity_id: data.id, entity_name: data.title, action: 'update', new_value: data })
    await fetchAll()
    return data
  }

  async function deleteIncident(id) {
    const { error: deleteError } = await supabase.from('incidents').delete().eq('id', id)
    if (deleteError) throw deleteError
    await fetchAll()
  }

  async function createMilestone(payload) {
    const profile = await getProfile()
    if (capabilities.nativeMilestones) {
      const { error: insertError } = await supabase.from('project_milestones').insert({
        ...compact(payload, ['title', 'milestone_type', 'status', 'start_at', 'end_at', 'notes', 'visible_to_client']),
        project_id: projectId,
        company_id: profile.company_id,
        created_by: profile.id,
      })
      if (!insertError) {
        await fetchAll()
        return
      }
      if (!isMissingSchema(insertError)) throw insertError
    }

    await createTask({
      title: `${HITO_PREFIX}${payload.title}`,
      description: `[${payload.milestone_type || 'milestone'}] ${payload.notes || ''}`.trim(),
      status: payload.status || 'pending',
      due_date: payload.start_at ? payload.start_at.slice(0, 10) : '',
      priority: 'medium',
    })
  }

  async function createMessage(payload) {
    const profile = await getProfile()
    if (capabilities.nativeMessages) {
      const { error: insertError } = await supabase.from('project_messages').insert({
        ...compact(payload, ['audience', 'channel', 'subject', 'message']),
        project_id: projectId,
        company_id: profile.company_id,
        author_id: profile.id,
      })
      if (!insertError) {
        await fetchAll()
        return
      }
      if (!isMissingSchema(insertError)) throw insertError
    }

    await logActivity({
      entity_type: 'project_message',
      entity_id: projectId,
      entity_name: project?.name,
      action: 'create',
      new_value: compact(payload, ['audience', 'channel', 'subject', 'message']),
    })
    await fetchAll()
  }

  return {
    project,
    tasks,
    incidents,
    milestones,
    messages,
    capabilities,
    loading,
    error,
    refetch: fetchAll,
    createTask,
    updateTask,
    deleteTask,
    createIncident,
    updateIncident,
    deleteIncident,
    createMilestone,
    createMessage,
  }
}
