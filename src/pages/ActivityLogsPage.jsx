import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function IconSearch() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }

const ACTION_CFG = {
  create: { label: 'Creado',    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  update: { label: 'Editado',   pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
  delete: { label: 'Eliminado', pill: 'bg-red-50 text-red-600 ring-red-200' },
  duplicate: { label: 'Duplicado', pill: 'bg-violet-50 text-violet-700 ring-violet-200' },
}

function fmtDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ActivityLogsPage() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [action, setAction]   = useState('all')
  const [entity, setEntity]   = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('activity_logs')
      .select('*, profiles(id, full_name, email)')
      .order('created_at', { ascending: false })
      .limit(500)
    setLogs(data || [])
    setLoading(false)
  }

  const entityTypes = useMemo(() => [...new Set(logs.map(l => l.entity_type).filter(Boolean))], [logs])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const user = l.profiles?.full_name || l.profiles?.email || ''
      const text = [l.action, l.entity_type, l.entity_id, user].join(' ').toLowerCase()
      return (
        (!search || text.includes(search.toLowerCase())) &&
        (action === 'all' || l.action === action) &&
        (entity === 'all' || l.entity_type === entity)
      )
    })
  }, [logs, search, action, entity])

  const counts = useMemo(() => ({
    total:  logs.length,
    create: logs.filter(l => l.action === 'create').length,
    update: logs.filter(l => l.action === 'update').length,
    delete: logs.filter(l => l.action === 'delete').length,
  }), [logs])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Auditoría</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Registro completo de acciones del sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total',       value: counts.total,  dot: 'bg-slate-400' },
          { label: 'Creaciones',  value: counts.create, dot: 'bg-emerald-500' },
          { label: 'Ediciones',   value: counts.update, dot: 'bg-blue-500' },
          { label: 'Eliminados',  value: counts.delete, dot: 'bg-red-400' },
        ].map(k => (
          <div key={k.label} className="flex flex-col justify-between rounded-2xl border border-[#E8EDF2] bg-white p-5">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${k.dot}`}/>
              <p className="text-[12px] text-[#94A3B8]">{k.label}</p>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#0F172A]">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por acción, entidad o usuario..."
            className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20" />
        </div>
        <select value={action} onChange={e => setAction(e.target.value)}
          className="rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] outline-none sm:w-[140px]">
          <option value="all">Todas las acciones</option>
          {Object.entries(ACTION_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={entity} onChange={e => setEntity(e.target.value)}
          className="rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] outline-none sm:w-[150px]">
          <option value="all">Todas las entidades</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <p className="text-[12px] text-[#94A3B8]">
        {filtered.length === logs.length ? `${logs.length} registros` : `${filtered.length} de ${logs.length}`}
      </p>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  {['Acción', 'Entidad', 'ID', 'Usuario', 'Fecha'].map(h => (
                    <th key={h} className="px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-[13px] text-[#94A3B8]">Sin registros</td></tr>
                ) : filtered.map(log => {
                  const a = ACTION_CFG[log.action] || { label: log.action, pill: 'bg-slate-100 text-slate-600 ring-slate-200' }
                  return (
                    <tr key={log.id} className="hover:bg-[#FAFBFC]">
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${a.pill}`}>{a.label}</span>
                      </td>
                      <td className="px-6 py-3 text-[13px] font-medium text-[#334155]">{log.entity_type}</td>
                      <td className="px-6 py-3 text-[12px] font-mono text-[#94A3B8] max-w-[120px] truncate">{log.entity_id}</td>
                      <td className="px-6 py-3 text-[13px] text-[#64748B]">{log.profiles?.full_name || log.profiles?.email || '—'}</td>
                      <td className="px-6 py-3 text-[12px] text-[#94A3B8] whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
