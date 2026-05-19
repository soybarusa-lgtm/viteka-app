import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboard(companyId) {
  const [data, setData] = useState({
    pharmacies: 0,
    projectsActive: 0,
    projectsTotal: 0,
    tasksPending: 0,
    tasksOverdue: 0,
    incidentsOpen: 0,
    checklistsInProgress: 0,
    recentProjects: [],
    recentIncidents: [],
    projectsByStatus: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!companyId) return
    fetchDashboard()
  }, [companyId])

  async function fetchDashboard() {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString()

      const [
        { count: pharmacies },
        { count: projectsTotal },
        { count: projectsActive },
        { count: tasksPending },
        { count: tasksOverdue },
        { count: incidentsOpen },
        { count: checklistsInProgress },
        { data: recentProjects },
        { data: recentIncidents },
      ] = await Promise.all([
        supabase.from('pharmacies').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['active', 'in_progress']),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['pending', 'in_progress']),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending').lt('due_date', today),
        supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['open', 'in_progress']),
        supabase.from('checklists').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'in_progress'),
        supabase.from('projects').select('id, name, status, priority, due_date, pharmacies(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
        supabase.from('incidents').select('id, title, status, priority, created_at, pharmacies(name)').eq('company_id', companyId).in('status', ['open', 'in_progress']).order('created_at', { ascending: false }).limit(5),
      ])

      // Proyectos por estado para la mini-barra
      const { data: allProjects } = await supabase
        .from('projects')
        .select('status')
        .eq('company_id', companyId)

      const statusCount = (allProjects || []).reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {})

      const projectsByStatus = [
        { label: 'Activos',     count: (statusCount['active'] || 0) + (statusCount['in_progress'] || 0), color: 'bg-teal-500' },
        { label: 'Pendientes',  count: statusCount['pending'] || 0,   color: 'bg-yellow-400' },
        { label: 'Bloqueados',  count: statusCount['blocked'] || 0,   color: 'bg-red-500' },
        { label: 'Finalizados', count: statusCount['completed'] || 0, color: 'bg-gray-300' },
      ]

      setData({
        pharmacies:           pharmacies || 0,
        projectsTotal:        projectsTotal || 0,
        projectsActive:       projectsActive || 0,
        tasksPending:         tasksPending || 0,
        tasksOverdue:         tasksOverdue || 0,
        incidentsOpen:        incidentsOpen || 0,
        checklistsInProgress: checklistsInProgress || 0,
        recentProjects:       recentProjects || [],
        recentIncidents:      recentIncidents || [],
        projectsByStatus,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refresh: fetchDashboard }
}
