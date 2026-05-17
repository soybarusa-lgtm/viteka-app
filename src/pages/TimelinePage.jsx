import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function IconSearch() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }
function IconCalendar() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>) }

const EVENT_CFG = {
  checklist_created:   { label: 'Checklist creado',   dot: 'bg-emerald-500' },
  checklist_completed: { label: 'Checklist completado', dot: 'bg-blue-500' },
  task_completed:      { label: 'Tarea completada',    dot: 'bg-emerald-400' },
  task_blocked:        { label: 'Tarea bloqueada',     dot: 'bg-red-400' },
  incident_created:    { label: 'Incidencia abierta',  dot: 'bg-amber-400' },
  incident_resolved:   { label: 'Incidencia resuelta', dot: 'bg-teal-500' },
  project_created:     { label: 'Proyecto creado',     dot: 'bg-violet-500' },
  document_uploaded:   { label: 'Documento subido',    dot: 'bg-sky-500' },
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(str) {
  if (!str) return ''
  return new Date(str).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function TimelinePage() {
  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('activity_logs')
      .select('*, profiles(id, full_name, email)')
      .order('created_at', { ascending: false })
      .limit(200)
    setLogs(data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const text = [l.action, l.entity_type, l.profiles?.full_name, l.profiles?.email].join(' ').toLowerCase()
      return (
        (!search || text.includes(search.toLowerCase())) &&
        (typeFilter === 'all' || l.entity_type === typeFilter)
      )
    })
  }, [logs, search, typeFilter])

  // Group by date
  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(log => {
      const day = new Date(log.created_at).toDateString()
      if (!groups[day]) groups[day] = []
      groups[day].push(log)
    })
    return Object.entries(groups)
  }, [filtered])

  const entityTypes = useMemo(() => [
    ...new Set(logs.map(l => l.entity_type).filter(Boolean))
  ], [logs])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Línea de tiempo</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Historial cronológico de actividad</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por acción, entidad o usuario..."
            className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#005643] sm:w-[160px]">
          <option value="all">Todas las entidades</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-12 text-center">
          <p className="text-[14px] font-medium text-[#0F172A]">Sin actividad</p>
          <p className="mt-1 text-[13px] text-[#94A3B8]">No hay eventos que coincidan</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, dayLogs]) => (
            <div key={day}>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[#94A3B8]"><IconCalendar /></span>
                <p className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider">{fmtDate(dayLogs[0].created_at)}</p>
                <span className="rounded-full bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] text-[#94A3B8]">{dayLogs.length}</span>
              </div>
              <div className="relative ml-4 space-y-0 border-l-2 border-[#F1F5F9] pl-6">
                {dayLogs.map((log, i) => {
                  const cfg = EVENT_CFG[`${log.entity_type}_${log.action}`] || { label: `${log.entity_type} ${log.action}`, dot: 'bg-slate-300' }
                  const user = log.profiles?.full_name || log.profiles?.email || 'Sistema'
                  return (
                    <div key={log.id} className="relative pb-4 last:pb-0">
                      <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-2 ring-white ${cfg.dot}`} />
                      <div className="rounded-xl border border-[#F1F5F9] bg-white p-3 hover:border-[#E8EDF2]">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-medium text-[#0F172A]">{cfg.label}</p>
                          <span className="shrink-0 text-[11px] text-[#94A3B8]">{fmtTime(log.created_at)}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-[#94A3B8]">{user}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
