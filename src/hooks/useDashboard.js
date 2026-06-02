import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboard(companyId) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const load = useCallback(async () => {
    if (!companyId) {
      setData(null)
      setLoading(false)
      return
    }
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
        { data: recentProjects },
        { data: allProjects },
      ] = await Promise.all([
        supabase.from('pharmacies').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('is_active', true),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['active', 'in_progress']),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['pending', 'in_progress']),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending').lt('due_date', today),
        supabase.from('projects').select('id, name, status, priority, expected_close_date, pharmacy_id').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
        supabase.from('projects').select('status').eq('company_id', companyId),
      ])

      // Enriquecer con nombre de farmacia
      const ids = [
        ...(recentProjects  || []).map(p => p.pharmacy_id),
      ].filter(Boolean)
      let names = {}
      if (ids.length) {
        const { data: phs } = await supabase.from('pharmacies').select('id, pharmacy_name').in('id', [...new Set(ids)])
        for (const p of (phs || [])) names[p.id] = p.pharmacy_name
      }
      const enrich = arr => (arr || []).map(r => ({ ...r, pharmacy_name: names[r.pharmacy_id] ?? null }))

      // Proyectos por estado
      const sc = (allProjects || []).reduce((a, p) => { a[p.status] = (a[p.status] || 0) + 1; return a }, {})
      const projectsByStatus = [
        { label: 'Activos',     count: (sc.active || 0) + (sc.in_progress || 0), color: 'bg-teal-500' },
        { label: 'Pendientes',  count: sc.pending   || 0, color: 'bg-yellow-400' },
        { label: 'Bloqueados',  count: sc.blocked   || 0, color: 'bg-red-500' },
        { label: 'Finalizados', count: sc.completed || 0, color: 'bg-gray-300' },
      ]

      setData({
        pharmacies:     pharmacies    || 0,
        projectsTotal:  projectsTotal || 0,
        projectsActive: projectsActive|| 0,
        tasksPending:   tasksPending  || 0,
        tasksOverdue:   tasksOverdue  || 0,
        recentProjects:  enrich(recentProjects),
        projectsByStatus,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  return { data, loading, error, refresh: load }
}
