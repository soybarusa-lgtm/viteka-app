import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Config ───────────────────────────────────────────────────────────────────
const PRIORITY = {
  low:      { label: 'Baja',    cls: 'badge-gray',   dot: 'bg-slate-400' },
  medium:   { label: 'Media',   cls: 'badge-amber',  dot: 'bg-amber-400' },
  high:     { label: 'Alta',    cls: 'badge-orange', dot: 'bg-orange-500' },
  critical: { label: 'Crítica', cls: 'badge-red',    dot: 'bg-red-500' },
}
const INC_STATUS = {
  open:        { label: 'Abierta',  cls: 'badge-amber' },
  in_progress: { label: 'En curso', cls: 'badge-blue'  },
  resolved:    { label: 'Resuelta', cls: 'badge-green' },
  closed:      { label: 'Cerrada',  cls: 'badge-gray'  },
}
function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Icons ────────────────────────────────────────────────────────────────────
function IconSearch() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }
function IconTrash()  { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>) }
function IconPlus()   { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>) }
function IconX()      { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>) }

// ── Main ─────────────────────────────────────────────────────────────────────
export default function IncidentsPage({ pharmacies = [], projects = [], profile }) {
  const [incidents, setIncidents]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [formOpen, setFormOpen]             = useState(false)
  const [search, setSearch]                 = useState('')
  const [filterStatus, setFilterStatus]     = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const [pharmacyId, setPharmacyId]   = useState('')
  const [projectId, setProjectId]     = useState('')
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState('medium')
  const [visibleToClient, setVisibleToClient] = useState(false)
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => { if (profile?.company_id) load() }, [profile?.company_id])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('incidents')
      .select('*, clients(id,name,pharmacy_name), projects(id,name)')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
    if (!error) setIncidents(data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const text = [inc.title, inc.description, inc.clients?.name, inc.clients?.pharmacy_name, inc.projects?.name].join(' ').toLowerCase()
      return (
        (!search || text.includes(search.toLowerCase())) &&
        (filterStatus   === 'all' || inc.status   === filterStatus) &&
        (filterPriority === 'all' || inc.priority === filterPriority)
      )
    })
  }, [incidents, search, filterStatus, filterPriority])

  const counts = useMemo(() => ({
    total:    incidents.length,
    open:     incidents.filter(i => i.status === 'open').length,
    progress: incidents.filter(i => i.status === 'in_progress').length,
    critical: incidents.filter(i => i.priority === 'critical').length,
    resolved: incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length,
  }), [incidents])

  async function createIncident(e) {
    e.preventDefault()
    if (!title.trim() || !profile?.company_id) return
    setSubmitting(true)
    const { error } = await supabase.from('incidents').insert({
      company_id: profile.company_id,
      pharmacy_id: pharmacyId || null,
      project_id: projectId || null,
      title, description, priority,
      status: 'open',
      visible_to_client: visibleToClient,
      created_by: profile?.id || null,
    })
    setSubmitting(false)
    if (error) { alert(error.message); return }
    setTitle(''); setDescription(''); setPharmacyId(''); setProjectId('')
    setPriority('medium'); setVisibleToClient(false); setFormOpen(false)
    await load()
  }

  async function updateStatus(id, status) {
    await supabase.from('incidents').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  async function deleteIncident(id) {
    if (!window.confirm('¿Eliminar incidencia?')) return
    await supabase.from('incidents').delete().eq('id', id)
    setIncidents(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Incidencias</h1>
          <p className="page-subtitle">Mantenimiento, soporte y problemas operativos</p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(o => !o)}
          className={formOpen ? 'btn-secondary flex shrink-0 items-center gap-2 text-[13px]' : 'btn-primary flex shrink-0 items-center gap-2 text-[13px]'}
        >
          {formOpen ? <><IconX /> Cancelar</> : <><IconPlus /> Nueva</>}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total',     value: counts.total,    dot: 'bg-slate-400',   alert: false },
          { label: 'Abiertas',  value: counts.open,     dot: 'bg-amber-400',   alert: false },
          { label: 'En curso',  value: counts.progress, dot: 'bg-blue-500',    alert: false },
          { label: 'Críticas',  value: counts.critical, dot: 'bg-red-500',     alert: counts.critical > 0 },
          { label: 'Resueltas', value: counts.resolved, dot: 'bg-emerald-500', alert: false },
        ].map(k => (
          <div
            key={k.label}
            className="card flex flex-col justify-between p-3.5"
            style={k.alert ? { borderColor: 'var(--danger)', background: 'var(--danger-soft)' } : {}}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${k.dot}`} />
              <p className="truncate text-[11px]" style={{ color: k.alert ? 'var(--danger)' : 'var(--muted)' }}>{k.label}</p>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight"
              style={{ color: k.alert ? 'var(--danger)' : 'var(--text)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Inline form */}
      {formOpen && (
        <form onSubmit={createIncident} className="card space-y-4 p-5 shadow-sm">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Nueva incidencia</p>

          <FormField label="Título *">
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="input" placeholder="Describe el problema..." required />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Prioridad">
              <select value={priority} onChange={e => setPriority(e.target.value)} className="input">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </FormField>
            <FormField label="Farmacia">
              <select value={pharmacyId} onChange={e => setPharmacyId(e.target.value)} className="input">
                <option value="">Sin farmacia</option>
                {pharmacies.map(p => <option key={p.id} value={p.id}>{p.pharmacy_name || p.name}</option>)}
              </select>
            </FormField>
            <FormField label="Proyecto">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input">
                <option value="">Sin proyecto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Descripción">
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} className="input resize-none" />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: 'var(--text-soft)' }}>
            <input type="checkbox" checked={visibleToClient}
              onChange={e => setVisibleToClient(e.target.checked)} className="rounded" />
            Visible al cliente
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
              {submitting ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><IconSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar incidencia, farmacia o proyecto..."
            className="input w-full pl-9" />
        </div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input flex-1">
            <option value="all">Estado: todos</option>
            {Object.entries(INC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="input flex-1">
            <option value="all">Prioridad: todas</option>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
        {filtered.length === incidents.length ? `${incidents.length} incidencias` : `${filtered.length} de ${incidents.length}`}
      </p>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state border-dashed">
          <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
            {incidents.length === 0 ? 'Sin incidencias' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {incidents.length === 0 ? 'Crea la primera incidencia' : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inc => {
            const pr = PRIORITY[inc.priority]  || PRIORITY.medium
            const st = INC_STATUS[inc.status]  || INC_STATUS.open
            return (
              <div key={inc.id} className="card p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={st.cls}>{st.label}</span>
                  <span className={`inline-flex items-center gap-1 ${pr.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${pr.dot}`} />{pr.label}
                  </span>
                  {inc.visible_to_client && (
                    <span className="badge-purple">Portal cliente</span>
                  )}
                </div>

                <p className="text-[14px] font-medium leading-snug" style={{ color: 'var(--text)' }}>{inc.title}</p>
                <p className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
                  {inc.clients?.pharmacy_name || inc.clients?.name || 'Sin farmacia'}
                  {inc.projects?.name ? ` · ${inc.projects.name}` : ''}
                  {` · ${fmtDate(inc.created_at)}`}
                </p>
                {inc.description && (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>{inc.description}</p>
                )}

                <div className="mt-3 flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <select
                    value={inc.status}
                    onChange={e => updateStatus(inc.id, e.target.value)}
                    className="input flex-1 py-2 text-[12px]"
                  >
                    {Object.entries(INC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteIncident(inc.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:opacity-80"
                    style={{ background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)' }}
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</span>
      {children}
    </label>
  )
}
