import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const OPEN_TASK_STATUSES = ['pending', 'in_progress', 'blocked']

function withProjectRange(query, from, to) {
  let ranged = query
  if (from) ranged = ranged.gte('created_at', `${from}T00:00:00`)
  if (to) ranged = ranged.lte('created_at', `${to}T23:59:59.999`)
  return ranged
}

export function useDashboard(companyId, { projectFrom, projectTo } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!companyId) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const today = new Date()
      const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-')

      const periodProjectsQuery = withProjectRange(
        supabase
          .from('projects')
          .select('id, name, status, priority, expected_close_date, pharmacy_id, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(8),
        projectFrom,
        projectTo,
      )
      const periodStatusesQuery = withProjectRange(
        supabase.from('projects').select('status').eq('company_id', companyId),
        projectFrom,
        projectTo,
      )

      const responses = await Promise.all([
        supabase.from('pharmacies').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['active', 'in_progress']),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', OPEN_TASK_STATUSES),
        supabase.from('tasks').select('id, title, description, status, priority, due_date, project_id').eq('company_id', companyId).in('status', OPEN_TASK_STATUSES).eq('due_date', todayKey).order('priority'),
        supabase.from('tasks').select('id, title, description, status, priority, due_date, project_id').eq('company_id', companyId).in('status', OPEN_TASK_STATUSES).lt('due_date', todayKey).order('due_date'),
        periodProjectsQuery,
        periodStatusesQuery,
      ])

      const errorResponse = responses.find(response => response.error)
      if (errorResponse?.error) throw errorResponse.error

      const [
        { count: pharmacies },
        { count: projectsTotal },
        { count: projectsActive },
        { count: tasksPending },
        { data: todayTaskRows },
        { data: overdueTaskRows },
        { data: periodProjectRows },
        { data: periodStatusRows },
      ] = responses

      const todayTasks = (todayTaskRows || []).filter(task => !task.title?.startsWith('[Hito] '))
      const overdueTasks = (overdueTaskRows || []).filter(task => !task.title?.startsWith('[Hito] '))
      const projectIds = [...new Set([
        ...todayTasks.map(task => task.project_id),
        ...overdueTasks.map(task => task.project_id),
      ].filter(Boolean))]

      let linkedProjects = []
      if (projectIds.length) {
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, pharmacy_id')
          .in('id', projectIds)
        if (projectsError) throw projectsError
        linkedProjects = projects || []
      }

      const pharmacyIds = [...new Set([
        ...(periodProjectRows || []).map(project => project.pharmacy_id),
        ...linkedProjects.map(project => project.pharmacy_id),
      ].filter(Boolean))]
      let pharmaciesById = {}
      if (pharmacyIds.length) {
        const { data: pharmaciesData, error: pharmaciesError } = await supabase
          .from('pharmacies')
          .select('id, pharmacy_name')
          .in('id', pharmacyIds)
        if (pharmaciesError) throw pharmaciesError
        pharmaciesById = Object.fromEntries((pharmaciesData || []).map(pharmacy => [pharmacy.id, pharmacy.pharmacy_name]))
      }

      const projectsById = Object.fromEntries(linkedProjects.map(project => [project.id, project]))
      const enrichTask = task => {
        const project = projectsById[task.project_id]
        return {
          ...task,
          project_name: project?.name || 'Sin proyecto',
          pharmacy_name: pharmaciesById[project?.pharmacy_id] || '',
        }
      }
      const enrichProject = project => ({ ...project, pharmacy_name: pharmaciesById[project.pharmacy_id] || '' })

      const statusCounts = (periodStatusRows || []).reduce((accumulator, project) => {
        accumulator[project.status] = (accumulator[project.status] || 0) + 1
        return accumulator
      }, {})
      const projectsByStatus = [
        { label: 'Activos', count: (statusCounts.active || 0) + (statusCounts.in_progress || 0), color: 'bg-teal-500' },
        { label: 'Pendientes', count: statusCounts.pending || 0, color: 'bg-amber-400' },
        { label: 'Bloqueados', count: statusCounts.blocked || 0, color: 'bg-rose-500' },
        { label: 'Finalizados', count: statusCounts.completed || 0, color: 'bg-slate-300' },
      ]

      setData({
        pharmacies: pharmacies || 0,
        projectsTotal: projectsTotal || 0,
        projectsActive: projectsActive || 0,
        tasksPending: tasksPending || 0,
        tasksOverdue: overdueTasks.length,
        todayTasks: todayTasks.map(enrichTask),
        overdueTasks: overdueTasks.map(enrichTask),
        periodProjects: (periodProjectRows || []).map(enrichProject),
        periodProjectsTotal: (periodStatusRows || []).length,
        projectsByStatus,
      })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [companyId, projectFrom, projectTo])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  return { data, loading, error, refresh: load }
}
