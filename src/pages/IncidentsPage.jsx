import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PRIORITY = {
  low:      { label: 'Baja',    cls: 'badge-gray',   dot: 'bg-gray-400'   },
  medium:   { label: 'Media',   cls: 'badge-yellow', dot: 'bg-yellow-400' },
  high:     { label: 'Alta',    cls: 'badge-orange', dot: 'bg-orange-500' },
  critical: { label: 'Crítica', cls: 'badge-red',    dot: 'bg-red-500'    },
}
const INC_STATUS = {
  open:        { label: 'Abierta',  cls: 'badge-yellow' },
  in_progress: { label: 'En curso', cls: 'badge-blue'   },
  resolved:    { label: 'Resuelta', cls: 'badge-green'  },
  closed:      { label: 'Cerrada',  cls: 'badge-gray'   },
}
function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function IconSearch() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IconPlus()   { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconX()      { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IconTrash()  { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> }

export default function IncidentsPage({ profile }) {
  const [incidents, setIncidents]           = useState([])
  const [pharmacies, setPharmacies]         = useState([])
  const [projects, setProjects]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [formOpen, setFormOpen]             = useState(false)
  const [search, setSearch]                 = useState('')
  const [filterStatus, setFilterStatus]     = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const [pharmacyId, setPharmacyId]           = useState('')
  const [projectId, setProjectId]             = useState('')
  const [title, setTitle]                     = useState('')
  const [description, setDescription]         = useState('')
  const [priority, setPriority]               = useState('medium')
  const [visibleToClient, setVisibleToClient] = useState(false)
  const [submitting, setSubmitting]           = useState(false)
  const [searchParams, setSearchParams]       = useSearchParams()
  const autoOpenedRef = useRef(false)

  useEffect(() => { if (profile?.company_id) init() }, [profile?.company_id])

  useEffect(() => {
    const shouldOpen = searchParams.get('open') === '1'
    if (!shouldOpen || autoOpenedRef.current) return
    setPharmacyId(searchParams.get('pharmacy_id') || '')
    setFormOpen(true)
    setSearchParams({}, { replace: true })
    autoOpenedRef.current = true
  }, [searchParams, setSearchParams])

  async function init() {
    setLoading(true)
    const [{ data: inc }, { data: ph }, { data: pr }] = await Promise.all([
      supabase.from('incidents')
        .select('*, pharmacies(id,name), projects(id,name)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false }),
      supabase.from('pharmacies')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .eq('is_active', true),
      supabase.from('projects')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .in('status', ['active', 'in_progress', 'pending']),
    ])
    setIncidents(inc || [])
    setPharmacies(ph || [])
    setProjects(pr || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const text = [inc.title, inc.description, inc.pharmacies?.name, inc.projects?.name].join(' ').toLowerCase()
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
    if (!title.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('incidents').insert({
      company_id:        profile.company_id,
      pharmacy_id:       pharmacyId || null,
      project_id:        projectId  || null,
      title, description, priority,
      status:            'open',
      visible_to_client: visibleToClient,
      created_by:        profile.id,
    })
    setSubmitting(false)
    if (error) { alert(error.message); return }
    setTitle(''); setDescription(''); setPharmacyId(''); setProjectId('')
    setPriority('medium'); setVisibleToClient(false); setFormOpen(false)
    await init()
  }

  async function updateStatus(id, status) {
    await supabase.from('incidents').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  async function deleteIncident(id) {
    if (!window.confirm('¿Eliminar esta incidencia?')) return
    await supabase.from('incidents').delete().eq('id', id)
    setIncidents(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="page-container space-y-5">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Incidencias</h1>
          <p className="text-sm text-gray-500">Mantenimiento, soporte y problemas operativos</p>
        </div>
        <button
          onClick={() => setFormOpen(o => !o)}
          className={formOpen ? 'btn-secondary' : 'btn-primary'}
        >
          {formOpen ? <><IconX /> Cancelar</> : <><IconPlus /> Nueva incidencia</>}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total',     value: counts.total,    dot: 'bg-gray-400',   alert: false },
          { label: 'Abiertas',  value: counts.open,     dot: 'bg-yellow-400', alert: false },
          { label: 'En curso',  value: counts.progress, dot: 'bg-blue-500',   alert: false },
          { label: 'Críticas',  value: counts.critical, dot: 'bg-red-500',    alert: counts.critical > 0 },
          { label: 'Resueltas', value: counts.resolved, dot: 'bg-teal-500',   alert: false },
        ].map(k => (
          <div key={k.label} className={`card p-4 flex flex-col gap-3 ${
            k.alert ? 'border-red-200 bg-red-50' : ''
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${k.dot}`} />
              <p className={`text-xs truncate ${k.alert ? 'text-red-500' : 'text-gray-500'}`}>{k.label}</p>
            </div>
            <p className={`text-2xl font-semibold tracking-tight ${
              k.alert ? 'text-red-600' : 'text-gray-900'
            }`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Formulario inline */}
      {formOpen && (
        <form onSubmit={createIncident} className="card p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Nueva incidencia</p>

          <div>
            <label className="label">Título *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="input" placeholder="Describe el problema..." required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Prioridad</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="input">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            <div>
              <label className="label">Farmacia</label>
              <select value={pharmacyId} onChange={e => setPharmacyId(e.target.value)} className="input">
                <option value="">Sin farmacia</option>
                {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Proyecto</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input">
                <option value="">Sin proyecto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} className="input resize-none" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={visibleToClient}
              onChange={e => setVisibleToClient(e.target.checked)} className="rounded" />
            Visible al cliente
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
              {submitting ? 'Guardando...' : 'Crear incidencia'}
            </button>
          </div>
        </form>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar incidencia, farmacia o proyecto..."
            className="input pl-9" />
        </div>
        <div className="flex gap-3">
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

      <p className="text-xs text-gray-400">
        {filtered.length === incidents.length
          ? `${incidents.length} incidencias`
          : `${filtered.length} de ${incidents.length}`}
      </p>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm font-medium text-gray-700">
            {incidents.length === 0 ? 'Sin incidencias' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {incidents.length === 0 ? 'Crea la primera incidencia' : 'Prueba con otros filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inc => {
            const pr = PRIORITY[inc.priority]  || PRIORITY.medium
            const st = INC_STATUS[inc.status]  || INC_STATUS.open
            return (
              <div key={inc.id} className="card p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={st.cls}>{st.label}</span>
                  <span className={`inline-flex items-center gap-1 ${pr.cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${pr.dot}`} />
                    {pr.label}
                  </span>
                  {inc.visible_to_client && (
                    <span className="badge-blue">Portal cliente</span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 leading-snug">{inc.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {inc.pharmacies?.name || 'Sin farmacia'}
                    {inc.projects?.name ? ` · ${inc.projects.name}` : ''}
                    {` · ${fmtDate(inc.created_at)}`}
                  </p>
                </div>

                {inc.description && (
                  <p className="line-clamp-2 text-sm text-gray-600 leading-relaxed">{inc.description}</p>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <select
                    value={inc.status}
                    onChange={e => updateStatus(inc.id, e.target.value)}
                    className="input flex-1 py-1.5 text-xs"
                  >
                    {Object.entries(INC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteIncident(inc.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition"
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
