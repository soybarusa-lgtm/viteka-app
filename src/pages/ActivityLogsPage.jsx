import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function IconSearch() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }
function IconRefresh() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>) }

const ACTION_CFG = {
  create:    { label: 'Creado',    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  update:    { label: 'Editado',   pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
  delete:    { label: 'Eliminado', pill: 'bg-red-50 text-red-600 ring-red-200' },
  duplicate: { label: 'Duplicado', pill: 'bg-violet-50 text-violet-700 ring-violet-200' },
  login:     { label: 'Login',     pill: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

function fmtDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function extractMeta(meta) {
  if (!meta) return null
  if (typeof meta === 'string') {
    try { meta = JSON.parse(meta) } catch { return meta }
  }
  const pick = meta.description || meta.name || meta.title || meta.label
  if (pick) return String(pick)
  const first = Object.values(meta).find(v => typeof v === 'string' && v.length > 0)
  return first || null
}

export default function ActivityLogsPage() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [action, setAction]   = useState('all')
  const [entity, setEntity]   = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    let { data, error: err } = await supabase
      .from('activity_logs')
      .select('*, profiles(id, full_name, email)')
      .order('created_at', { ascending: false })
      .limit(500)
    if (err) {
      const fallback = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      data = fallback.data
      err  = fallback.error
    }
    if (err) { setError(err.message); setLoading(false); return }
    setLogs(data || [])
    setLoading(false)
  }

  const entityTypes = useMemo(() =>
    [...new Set(logs.map(l => l.entity_type).filter(Boolean))].sort()
  , [logs])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const user = l.profiles?.full_name || l.profiles?.email || l.user_id || ''
      const meta = extractMeta(l.metadata || l.description || l.details) || ''
      const text = [l.action, l.entity_type, l.entity_id, user, meta].join(' ').toLowerCase()
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
    <div className="page-wrapper space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A]">Auditoría</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Registro completo de acciones del sistema</p>
        </div>
        <button type="button" onClick={load} disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] bg-white px-3 py-2 text-[13px] text-[#64748B] transition hover:bg-[#F8FAFC] disabled:opacity-50 w-full sm:w-auto justify-center sm:justify-start">
          <IconRefresh /> Recargar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          Error al cargar los logs: {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total registros', value: counts.total,  dot: 'bg-slate-400' },
          { label: 'Creaciones',      value: counts.create, dot: 'bg-emerald-500' },
          { label: 'Ediciones',       value: counts.update, dot: 'bg-blue-500' },
          { label: 'Eliminaciones',   value: counts.delete, dot: 'bg-red-400' },
        ].map(k => (
          <div key={k.label} className="flex flex-col justify-between rounded-2xl border border-[#E8EDF2] bg-white p-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${k.dot}`}/>
              <p className="text-[11px] text-[#94A3B8]">{k.label}</p>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por acción, entidad, usuario..."
            className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20" />
        </div>
        <div className="flex gap-2">
          <select value={action} onChange={e => setAction(e.target.value)}
            className="flex-1 rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] outline-none">
            <option value="all">Todas las acciones</option>
            {Object.entries(ACTION_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={entity} onChange={e => setEntity(e.target.value)}
            className="flex-1 rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] outline-none">
            <option value="all">Todas las entidades</option>
            {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <p className="text-[12px] text-[#94A3B8]">
        {loading ? 'Cargando…' : (
          filtered.length === logs.length
            ? `${logs.length} registros`
            : `${filtered.length} de ${logs.length}`
        )}
      </p>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  {['Acción', 'Entidad', 'Descripción', 'Usuario', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#94A3B8]">
                      {logs.length === 0 ? 'No hay registros de auditoría todavía' : 'Sin resultados para los filtros aplicados'}
                    </td>
                  </tr>
                ) : filtered.map(log => {
                  const a    = ACTION_CFG[log.action] || { label: log.action, pill: 'bg-slate-100 text-slate-600 ring-slate-200' }
                  const user = log.profiles?.full_name || log.profiles?.email || log.user_id || '—'
                  const meta = extractMeta(log.metadata || log.description || log.details)
                  return (
                    <tr key={log.id} className="hover:bg-[#FAFBFC]">
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${a.pill}`}>{a.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] font-medium text-[#334155]">{log.entity_type || '—'}</p>
                        {log.entity_id && (
                          <p className="text-[11px] font-mono text-[#CBD5E1] truncate max-w-[80px]">{log.entity_id}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {meta
                          ? <p className="text-[13px] text-[#64748B] line-clamp-2">{meta}</p>
                          : <span className="text-[12px] text-[#CBD5E1]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#64748B] whitespace-nowrap">{user}</td>
                      <td className="px-4 py-3 text-[12px] text-[#94A3B8] whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
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
