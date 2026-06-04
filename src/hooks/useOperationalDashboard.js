import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { createOperationalMocks } from '../lib/operationalDashboardMock'
import {
  buildStatusChart,
  formatShortDate,
  getPriorityMeta,
  getStatusMeta,
  isPendingStatus,
  normalizeKey,
  sortPendingItems,
} from '../lib/operationalDashboardStatus'

function currentIdentity(profile, session) {
  return {
    profileId: profile?.id || null,
    sessionUserId: session?.user?.id || null,
    authUserId: profile?.auth_user_id || null,
    email: profile?.email || session?.user?.email || null,
    companyId: profile?.company_id || null,
  }
}

function matchesCurrentUser(row, identity, fields) {
  const ids = [identity.profileId, identity.sessionUserId, identity.authUserId].filter(Boolean).map(String)
  const email = identity.email ? normalizeKey(identity.email) : ''

  return fields.some(field => {
    const value = row?.[field]
    if (!value) return false
    if (String(field).toLowerCase().includes('email')) return email && normalizeKey(value) === email
    return ids.includes(String(value))
  })
}

async function selectRows(table, companyId) {
  const build = withCompany => {
    let query = supabase.from(table).select('*').limit(250)
    if (withCompany && companyId) query = query.eq('company_id', companyId)
    return query
  }

  if (companyId) {
    const response = await build(true)
    if (!response.error) return response.data || []
    console.warn(`[dashboard] ${table}: fallback sin company_id`, response.error.message)
  }

  const fallback = await build(false)
  if (fallback.error) throw fallback.error
  return fallback.data || []
}

async function fetchPharmaciesById(ids, companyId) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return new Map()

  const build = withCompany => {
    let query = supabase
      .from('pharmacies')
      .select('id, pharmacy_name, city, province')
      .in('id', uniqueIds)
    if (withCompany && companyId) query = query.eq('company_id', companyId)
    return query
  }

  let response = companyId ? await build(true) : await build(false)
  if (response.error && companyId) response = await build(false)
  if (response.error) {
    console.warn('[dashboard] No se pudieron cargar farmacias relacionadas:', response.error.message)
    return new Map()
  }
  return new Map((response.data || []).map(item => [item.id, item]))
}

async function fetchProfilesById(ids, companyId) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return new Map()

  const build = withCompany => {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', uniqueIds)
    if (withCompany && companyId) query = query.eq('company_id', companyId)
    return query
  }

  let response = companyId ? await build(true) : await build(false)
  if (response.error && companyId) response = await build(false)
  if (response.error) {
    console.warn('[dashboard] No se pudieron cargar responsables:', response.error.message)
    return new Map()
  }
  return new Map((response.data || []).map(item => [item.id, item]))
}

async function fetchProjectsById(ids, companyId) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return new Map()

  const build = withCompany => {
    let query = supabase
      .from('projects')
      .select('id, name, pharmacy_id')
      .in('id', uniqueIds)
    if (withCompany && companyId) query = query.eq('company_id', companyId)
    return query
  }

  let response = companyId ? await build(true) : await build(false)
  if (response.error && companyId) response = await build(false)
  if (response.error) {
    console.warn('[dashboard] No se pudieron cargar proyectos relacionados:', response.error.message)
    return new Map()
  }
  return new Map((response.data || []).map(item => [item.id, item]))
}

function firstValue(row, fields) {
  for (const field of fields) {
    if (row?.[field] !== undefined && row?.[field] !== null && row?.[field] !== '') return row[field]
  }
  return null
}

function resolveAssignedName(row, profileMap, fields) {
  const id = firstValue(row, fields)
  if (!id) return ''
  return profileMap.get(id)?.full_name || row.assigned_agent_name || row.assigned_to_name || String(id)
}

function normalizeTask(row, pharmaciesById, projectsById, profilesById) {
  const project = projectsById.get(row.project_id)
  const pharmacyId = row.pharmacy_id || project?.pharmacy_id
  const pharmacy = pharmaciesById.get(pharmacyId)
  const status = normalizeKey(row.status || 'pending') || 'pending'
  const priority = normalizeKey(row.priority || 'medium') || 'medium'
  const statusMeta = getStatusMeta(status)
  const priorityMeta = getPriorityMeta(priority)

  return {
    id: row.id,
    title: row.title || row.name || 'Tarea sin titulo',
    description: row.description || '',
    status,
    statusLabel: statusMeta.label,
    priority,
    priorityLabel: priorityMeta.label,
    dueDate: row.due_date || row.dueDate || null,
    pharmacyName: row.pharmacy_name || pharmacy?.pharmacy_name || '',
    assignedTo: resolveAssignedName(row, profilesById, ['assigned_to', 'assigned_user_id', 'owner_id', 'assigned_technician_id']),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    projectId: row.project_id || null,
    raw: row,
  }
}

function normalizeSupport(row, pharmaciesById, profilesById) {
  const status = normalizeKey(row.internal_status || row.status || row.client_status || 'open') || 'open'
  const priority = normalizeKey(row.priority_internal || row.priority_client || row.priority || 'medium') || 'medium'
  const statusMeta = getStatusMeta(status)
  const priorityMeta = getPriorityMeta(priority)
  const pharmacy = pharmaciesById.get(row.pharmacy_id)

  return {
    id: row.id,
    publicNumber: row.public_ticket_number || row.ticket_number || '',
    title: row.subject || row.title || 'Soporte sin asunto',
    description: row.description || '',
    status,
    statusLabel: statusMeta.label,
    priority,
    priorityLabel: priorityMeta.label,
    product: row.product || '',
    type: row.type || '',
    pharmacyName: row.pharmacy_name || pharmacy?.pharmacy_name || '',
    assignedTo: resolveAssignedName(row, profilesById, ['assigned_agent_id', 'assigned_to', 'assigned_user_id', 'agent_id', 'assigned_technician_id']),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    raw: row,
  }
}

function isTaskMine(row, identity) {
  return matchesCurrentUser(row, identity, ['assigned_to', 'assigned_user_id', 'owner_id', 'assigned_technician_id', 'assigned_to_email'])
}

function isSupportMine(row, identity) {
  return matchesCurrentUser(row, identity, ['assigned_agent_id', 'assigned_to', 'assigned_user_id', 'agent_id', 'assigned_technician_id', 'assigned_agent_email'])
}

function filterChart(items, filter) {
  if (!filter) return items
  return items.filter(item => normalizeKey(item.status) === filter)
}

export function useOperationalDashboard() {
  const { profile, loading: authLoading, session } = useAuth()
  const [state, setState] = useState({
    loading: true,
    error: '',
    warning: '',
    lastUpdated: null,
    taskStatusChart: [],
    supportStatusChart: [],
    myPendingTasks: [],
    generalPendingTasks: [],
    myPendingSupport: [],
    generalPendingSupport: [],
  })

  const identity = useMemo(() => currentIdentity(profile, session), [profile, session])

  const load = useCallback(async () => {
    if (authLoading) return
    setState(current => ({ ...current, loading: true, error: '', warning: '' }))

    const warnings = []
    try {
      let taskRows = []
      let supportRows = []
      let taskSource = 'supabase'
      let supportSource = 'supabase'

      try {
        taskRows = await selectRows('tasks', identity.companyId)
      } catch (taskError) {
        console.warn('[dashboard] tasks no disponible, usando mock:', taskError.message)
        warnings.push('tasks')
        taskSource = 'mock'
      }

      if (taskSource === 'mock') {
        taskRows = createOperationalMocks(identity).tasks
      }

      try {
        supportRows = await selectRows('support_tickets', identity.companyId)
      } catch (supportTicketError) {
        console.warn('[dashboard] support_tickets no disponible, probando incidents:', supportTicketError.message)
        try {
          supportRows = await selectRows('incidents', identity.companyId)
          supportSource = 'incidents'
        } catch (incidentsError) {
          console.warn('[dashboard] incidents no disponible, usando mock:', incidentsError.message)
          warnings.push('support')
          supportSource = 'mock'
        }
      }

      if (supportSource === 'mock') {
        supportRows = createOperationalMocks(identity).support
      }

      const pendingTaskRows = taskRows.filter(row => isPendingStatus(row.status, 'task'))
      const pendingSupportRows = supportRows.filter(row => isPendingStatus(row.internal_status || row.status || row.client_status, 'support'))

      const projectIds = pendingTaskRows.map(row => row.project_id).filter(Boolean)
      const projectsById = await fetchProjectsById(projectIds, identity.companyId)
      const pharmacyIds = [
        ...pendingTaskRows.map(row => row.pharmacy_id),
        ...pendingTaskRows.map(row => projectsById.get(row.project_id)?.pharmacy_id),
        ...pendingSupportRows.map(row => row.pharmacy_id),
      ].filter(Boolean)
      const pharmaciesById = await fetchPharmaciesById(pharmacyIds, identity.companyId)

      const assignedIds = [
        ...pendingTaskRows.flatMap(row => [row.assigned_to, row.assigned_user_id, row.owner_id, row.assigned_technician_id]),
        ...pendingSupportRows.flatMap(row => [row.assigned_agent_id, row.assigned_to, row.assigned_user_id, row.agent_id, row.assigned_technician_id]),
      ].filter(Boolean)
      const profilesById = await fetchProfilesById(assignedIds, identity.companyId)

      const myTaskRows = pendingTaskRows.filter(row => isTaskMine(row, identity))
      const generalTaskRows = pendingTaskRows.filter(row => !isTaskMine(row, identity))
      const mySupportRows = pendingSupportRows.filter(row => isSupportMine(row, identity))
      const generalSupportRows = pendingSupportRows.filter(row => !isSupportMine(row, identity))

      const myPendingTasks = sortPendingItems(myTaskRows.map(row => normalizeTask(row, pharmaciesById, projectsById, profilesById)))
      const generalPendingTasks = sortPendingItems(generalTaskRows.map(row => normalizeTask(row, pharmaciesById, projectsById, profilesById)))
      const myPendingSupport = sortPendingItems(mySupportRows.map(row => normalizeSupport(row, pharmaciesById, profilesById)))
      const generalPendingSupport = sortPendingItems(generalSupportRows.map(row => normalizeSupport(row, pharmaciesById, profilesById)))

      setState({
        loading: false,
        error: '',
        warning: warnings.length ? 'Algunos datos no se pudieron cargar. Se muestran datos disponibles.' : '',
        lastUpdated: new Date(),
        taskStatusChart: buildStatusChart([...myPendingTasks, ...generalPendingTasks]),
        supportStatusChart: buildStatusChart([...myPendingSupport, ...generalPendingSupport]),
        myPendingTasks,
        generalPendingTasks,
        myPendingSupport,
        generalPendingSupport,
      })
    } catch (error) {
      console.warn('[dashboard] Error operativo, usando mocks:', error.message)
      const mocks = createOperationalMocks(identity)
      const taskRows = mocks.tasks.filter(row => isPendingStatus(row.status, 'task'))
      const supportRows = mocks.support.filter(row => isPendingStatus(row.internal_status || row.status, 'support'))
      const emptyMap = new Map()
      const myTaskRows = taskRows.filter(row => isTaskMine(row, identity))
      const generalTaskRows = taskRows.filter(row => !isTaskMine(row, identity))
      const mySupportRows = supportRows.filter(row => isSupportMine(row, identity))
      const generalSupportRows = supportRows.filter(row => !isSupportMine(row, identity))
      const myPendingTasks = sortPendingItems(myTaskRows.map(row => normalizeTask(row, emptyMap, emptyMap, emptyMap)))
      const generalPendingTasks = sortPendingItems(generalTaskRows.map(row => normalizeTask(row, emptyMap, emptyMap, emptyMap)))
      const myPendingSupport = sortPendingItems(mySupportRows.map(row => normalizeSupport(row, emptyMap, emptyMap)))
      const generalPendingSupport = sortPendingItems(generalSupportRows.map(row => normalizeSupport(row, emptyMap, emptyMap)))

      setState({
        loading: false,
        error: '',
        warning: 'Algunos datos no se pudieron cargar. Se muestran datos disponibles.',
        lastUpdated: new Date(),
        taskStatusChart: buildStatusChart([...myPendingTasks, ...generalPendingTasks]),
        supportStatusChart: buildStatusChart([...myPendingSupport, ...generalPendingSupport]),
        myPendingTasks,
        generalPendingTasks,
        myPendingSupport,
        generalPendingSupport,
      })
    }
  }, [authLoading, identity])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  return {
    ...state,
    loading: authLoading || state.loading,
    reload: load,
    filterChart,
    formatShortDate,
  }
}
