import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import CreateProjectModal from '../components/modals/CreateProjectModal'

const COMMERCIAL_STAGES = [
  { id: 'leads',       label: 'Leads',        color: 'bg-gray-100 border-gray-300' },
  { id: 'contactado',  label: 'Contactado',   color: 'bg-blue-50 border-blue-300' },
  { id: 'visita',      label: 'Visita',       color: 'bg-yellow-50 border-yellow-300' },
  { id: 'propuesta',   label: 'Propuesta',    color: 'bg-orange-50 border-orange-300' },
  { id: 'negociacion', label: 'Negociación', color: 'bg-purple-50 border-purple-300' },
  { id: 'cerrado',     label: 'Cerrado ✅',   color: 'bg-green-50 border-green-300' },
  { id: 'perdido',     label: 'Perdido ❌',   color: 'bg-red-50 border-red-300' },
]

const SUPPORT_STATUS = [
  { id: 'pending',     label: 'Pendiente',   badge: 'badge-gray' },
  { id: 'active',      label: 'En curso',    badge: 'badge-blue' },
  { id: 'completed',   label: 'Completado',  badge: 'badge-green' },
  { id: 'paused',      label: 'Pausado',     badge: 'badge-gray' },
  { id: 'cancelled',   label: 'Cancelado',   badge: 'badge-red' },
]

export default function ProjectsPage({ navigate }) {
  const { projects, loading, error, moveStage } = useProjects()
  const [tab, setTab] = useState('commercial')
  const [view, setView] = useState('kanban')
  const [showCreate, setShowCreate] = useState(null) // 'commercial' | 'support'
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(null)

  const commercial = projects.filter(p => p.project_type === 'commercial')
  const support = projects.filter(p => p.project_type === 'support')

  const filteredSupport = support.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name?.toLowerCase().includes(q) || p.pharmacy?.pharmacy_name?.toLowerCase().includes(q)
  })

  // Kanban drag
  function onDragStart(e, project) {
    setDragging(project)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }

  async function onDrop(e, stageId) {
    e.preventDefault()
    if (!dragging || dragging.pipeline_stage === stageId) return
    await moveStage(dragging.id, stageId)
    setDragging(null)
  }

  return (
    <div className="page-container pb-24 md:pb-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📂 Proyectos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{commercial.length} comerciales · {support.length} de soporte</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate('support')} className="btn-secondary">+ Soporte</button>
          <button onClick={() => setShowCreate('commercial')} className="btn-primary">+ Comercial</button>
        </div>
      </div>

      {/* Tabs tipo / vista */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-1 border-b border-gray-200">
          {[['commercial', '💼 Comercial'], ['support', '🔧 Soporte']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                tab === id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'commercial' && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('kanban')}
              className={`px-3 py-1 text-xs rounded-md transition ${
                view === 'kanban' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}>📌 Kanban</button>
            <button onClick={() => setView('list')}
              className={`px-3 py-1 text-xs rounded-md transition ${
                view === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}>☰ Lista</button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">Error: {error}</div>}

      {/* --- COMERCIAL: KANBAN --- */}
      {!loading && tab === 'commercial' && view === 'kanban' && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
          {COMMERCIAL_STAGES.map(stage => {
            const cards = commercial.filter(p => p.pipeline_stage === stage.id)
            return (
              <div
                key={stage.id}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, stage.id)}
                className={`shrink-0 w-64 rounded-xl border-2 ${stage.color} p-3 min-h-40`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{stage.label}</h3>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 font-semibold text-gray-500">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map(p => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={e => onDragStart(e, p)}
                      onClick={() => navigate('project-detail', { projectId: p.id })}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-teal-200 transition select-none"
                    >
                      <p className="text-sm font-semibold text-gray-800 leading-tight mb-1">{p.name}</p>
                      {p.pharmacy && <p className="text-xs text-gray-400 truncate">🏪 {p.pharmacy.pharmacy_name}</p>}
                      {p.amount && <p className="text-xs font-semibold text-teal-600 mt-1">{Number(p.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>}
                      {p.commercial && <p className="text-xs text-gray-400 mt-1">👤 {p.commercial.full_name}</p>}
                      {p.expected_close_date && (
                        <p className={`text-xs mt-1 ${
                          new Date(p.expected_close_date) < new Date() ? 'text-red-500 font-medium' : 'text-gray-400'
                        }`}>📅 {new Date(p.expected_close_date).toLocaleDateString('es-ES')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* --- COMERCIAL: LISTA --- */}
      {!loading && tab === 'commercial' && view === 'list' && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Proyecto</th><th>Farmacia</th><th>Etapa</th><th>Importe</th><th>Cierre</th><th>Comercial</th></tr></thead>
            <tbody>
              {commercial.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">Sin proyectos comerciales</td></tr>
              )}
              {commercial.map(p => {
                const stage = COMMERCIAL_STAGES.find(s => s.id === p.pipeline_stage)
                return (
                  <tr key={p.id} className="cursor-pointer" onClick={() => navigate('project-detail', { projectId: p.id })}>
                    <td><p className="font-medium text-teal-700">{p.name}</p></td>
                    <td className="text-sm text-gray-500">{p.pharmacy?.pharmacy_name || '—'}</td>
                    <td><span className="badge-gray text-xs">{stage?.label || p.pipeline_stage}</span></td>
                    <td className="text-sm font-medium">{p.amount ? Number(p.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'}</td>
                    <td className={`text-sm ${
                      p.expected_close_date && new Date(p.expected_close_date) < new Date() ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {p.expected_close_date ? new Date(p.expected_close_date).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td className="text-sm text-gray-500">{p.commercial?.full_name || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- SOPORTE --- */}
      {!loading && tab === 'support' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input className="input max-w-xs" placeholder="Buscar proyecto o farmacia..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="btn-ghost text-xs" onClick={() => setSearch('')}>× Limpiar</button>}
          </div>

          {filteredSupport.length === 0 ? (
            <div className="empty-state">
              <span className="text-4xl mb-3">🔧</span>
              <p className="font-medium text-gray-500">Sin proyectos de soporte</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block table-container">
                <table className="table">
                  <thead><tr><th>Proyecto</th><th>Farmacia</th><th>Estado</th><th>Técnico</th><th>Inicio</th><th>Cierre prev.</th></tr></thead>
                  <tbody>
                    {filteredSupport.map(p => {
                      const st = SUPPORT_STATUS.find(s => s.id === p.status)
                      return (
                        <tr key={p.id} className="cursor-pointer" onClick={() => navigate('project-detail', { projectId: p.id })}>
                          <td><p className="font-medium text-teal-700">{p.name}</p></td>
                          <td className="text-sm text-gray-500">{p.pharmacy?.pharmacy_name || '—'}</td>
                          <td><span className={st?.badge || 'badge-gray'}>{st?.label || p.status}</span></td>
                          <td className="text-sm text-gray-500">{p.technician?.full_name || '—'}</td>
                          <td className="text-sm text-gray-500">{p.start_date ? new Date(p.start_date).toLocaleDateString('es-ES') : '—'}</td>
                          <td className="text-sm text-gray-500">{p.expected_close_date ? new Date(p.expected_close_date).toLocaleDateString('es-ES') : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Móvil */}
              <div className="md:hidden space-y-3">
                {filteredSupport.map(p => {
                  const st = SUPPORT_STATUS.find(s => s.id === p.status)
                  return (
                    <button key={p.id} onClick={() => navigate('project-detail', { projectId: p.id })} className="card-hover p-4 w-full text-left">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        <span className={st?.badge || 'badge-gray'}>{st?.label || p.status}</span>
                      </div>
                      <p className="text-xs text-gray-500">🏪 {p.pharmacy?.pharmacy_name || '—'}</p>
                      {p.technician && <p className="text-xs text-gray-400 mt-0.5">🔧 {p.technician.full_name}</p>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          defaultType={showCreate}
          onClose={() => setShowCreate(null)}
        />
      )}
    </div>
  )
}
