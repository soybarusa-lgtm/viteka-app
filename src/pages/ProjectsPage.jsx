import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import CreateProjectModal from '../components/modals/CreateProjectModal'

// ── Config ───────────────────────────────────────────────────────────────
const COMMERCIAL_STAGES = [
  { id: 'leads',       label: 'Leads',       dot: 'bg-gray-300'    },
  { id: 'contactado',  label: 'Contactado',  dot: 'bg-sky-400'     },
  { id: 'visita',      label: 'Visita',      dot: 'bg-amber-400'   },
  { id: 'propuesta',   label: 'Propuesta',   dot: 'bg-orange-400'  },
  { id: 'negociacion', label: 'Negociación', dot: 'bg-violet-400'  },
  { id: 'cerrado',     label: 'Cerrado',     dot: 'bg-emerald-500' },
  { id: 'perdido',     label: 'Perdido',     dot: 'bg-red-400'     },
]

const SUPPORT_STATUS = [
  { id: 'pending',   label: 'Pendiente',  badge: 'badge-gray'   },
  { id: 'active',    label: 'En curso',   badge: 'badge-blue'   },
  { id: 'completed', label: 'Completado', badge: 'badge-green'  },
  { id: 'paused',    label: 'Pausado',    badge: 'badge-yellow' },
  { id: 'cancelled', label: 'Cancelado',  badge: 'badge-red'    },
]

// ── Icons ───────────────────────────────────────────────────────────────
function IcList()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IcKanban() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="8" rx="1"/></svg> }
function IcSearch() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IcPlus()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcChevron(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }

// ── Kanban card ─────────────────────────────────────────────────────────────
function KanbanCard({ p, navigate }) {
  const overdue = p.expected_close_date && new Date(p.expected_close_date) < new Date()
  return (
    <div
      draggable
      onClick={() => navigate('project-detail', { projectId: p.id })}
      className="bg-white rounded-xl border border-gray-200 p-3 cursor-pointer
                 hover:border-gray-300 hover:shadow-sm transition select-none space-y-2"
    >
      <p className="text-sm font-medium text-gray-900 leading-snug">{p.name}</p>
      {p.pharmacy && (
        <p className="text-xs text-gray-400 truncate">{p.pharmacy.pharmacy_name}</p>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {p.amount ? (
          <span className="text-xs font-semibold" style={{ color: '#1c473c' }}>
            {Number(p.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </span>
        ) : <span />}
        {p.expected_close_date && (
          <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {new Date(p.expected_close_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
      {p.commercial && (
        <p className="text-xs text-gray-400">{p.commercial.full_name}</p>
      )}
    </div>
  )
}

// ── Kanban view ────────────────────────────────────────────────────────────
function KanbanView({ commercial, moveStage, navigate }) {
  const [dragging, setDragging] = useState(null)

  function onDragStart(e, p) { setDragging(p); e.dataTransfer.effectAllowed = 'move' }
  function onDragOver(e)      { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  async function onDrop(e, stageId) {
    e.preventDefault()
    if (!dragging || dragging.pipeline_stage === stageId) return
    await moveStage(dragging.id, stageId)
    setDragging(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5">
      {COMMERCIAL_STAGES.map(stage => {
        const cards = commercial.filter(p => p.pipeline_stage === stage.id)
        return (
          <div
            key={stage.id}
            onDragOver={onDragOver}
            onDrop={e => onDrop(e, stage.id)}
            className="shrink-0 w-60 flex flex-col gap-2"
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                <span className="text-xs font-medium text-gray-700">{stage.label}</span>
              </div>
              <span className="text-xs text-gray-400">{cards.length}</span>
            </div>
            {/* Drop zone */}
            <div
              className={`min-h-20 rounded-2xl p-2 space-y-2 transition
                ${ dragging ? 'bg-gray-100/60 ring-1 ring-gray-200' : 'bg-gray-50/80' }`}
            >
              {cards.map(p => (
                <div key={p.id} draggable onDragStart={e => onDragStart(e, p)}>
                  <KanbanCard p={p} navigate={navigate} />
                </div>
              ))}
              {cards.length === 0 && (
                <div className="flex items-center justify-center h-12">
                  <span className="text-xs text-gray-300">Vacío</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── List view (comercial) ─────────────────────────────────────────────────
function ListView({ commercial, navigate }) {
  if (commercial.length === 0) return (
    <div className="empty-state">
      <p className="text-sm text-gray-500 font-medium">Sin proyectos comerciales</p>
      <p className="mt-1 text-xs text-gray-400">Crea el primero con el botón de arriba</p>
    </div>
  )
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Farmacia</th>
              <th>Etapa</th>
              <th>Importe</th>
              <th>Cierre est.</th>
              <th>Comercial</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {commercial.map(p => {
              const stage  = COMMERCIAL_STAGES.find(s => s.id === p.pipeline_stage)
              const overdue = p.expected_close_date && new Date(p.expected_close_date) < new Date()
              return (
                <tr key={p.id} className="cursor-pointer" onClick={() => navigate('project-detail', { projectId: p.id })}>
                  <td className="font-medium text-gray-900">{p.name}</td>
                  <td className="text-gray-500">{p.pharmacy?.pharmacy_name || '—'}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      {stage && <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />}
                      <span className="text-gray-600">{stage?.label || p.pipeline_stage}</span>
                    </span>
                  </td>
                  <td className="font-medium" style={{ color: '#1c473c' }}>
                    {p.amount ? Number(p.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'}
                  </td>
                  <td className={overdue ? 'text-red-500 font-medium' : 'text-gray-500'}>
                    {p.expected_close_date ? new Date(p.expected_close_date).toLocaleDateString('es-ES') : '—'}
                  </td>
                  <td className="text-gray-500">{p.commercial?.full_name || '—'}</td>
                  <td className="text-gray-300"><IcChevron /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {commercial.map(p => {
          const stage  = COMMERCIAL_STAGES.find(s => s.id === p.pipeline_stage)
          const overdue = p.expected_close_date && new Date(p.expected_close_date) < new Date()
          return (
            <button key={p.id} onClick={() => navigate('project-detail', { projectId: p.id })}
              className="card w-full text-left p-4 flex items-center gap-3 hover:border-gray-300 transition">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {stage && <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />}
                  <span className="text-xs text-gray-400">{stage?.label}</span>
                  {p.pharmacy && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400 truncate">{p.pharmacy.pharmacy_name}</span></>}
                </div>
              </div>
              <div className="text-right shrink-0">
                {p.amount && <p className="text-sm font-semibold" style={{ color: '#1c473c' }}>{Number(p.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>}
                {p.expected_close_date && <p className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-400'}`}>{new Date(p.expected_close_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>}
              </div>
              <span className="text-gray-300 shrink-0"><IcChevron /></span>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Support view ─────────────────────────────────────────────────────────────
function SupportView({ support, navigate }) {
  const [search, setSearch] = useState('')
  const filtered = support.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name?.toLowerCase().includes(q) || p.pharmacy?.pharmacy_name?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IcSearch /></span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proyecto o farmacia"
          className="input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm text-gray-500 font-medium">
            {support.length === 0 ? 'Sin proyectos de soporte' : 'Sin resultados'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {support.length === 0 ? 'Crea el primero con el botón de arriba' : 'Prueba con otro término'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Farmacia</th>
                  <th>Estado</th>
                  <th>Técnico</th>
                  <th>Inicio</th>
                  <th>Cierre prev.</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const st = SUPPORT_STATUS.find(s => s.id === p.status)
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => navigate('project-detail', { projectId: p.id })}>
                      <td className="font-medium text-gray-900">{p.name}</td>
                      <td className="text-gray-500">{p.pharmacy?.pharmacy_name || '—'}</td>
                      <td><span className={st?.badge || 'badge-gray'}>{st?.label || p.status}</span></td>
                      <td className="text-gray-500">{p.technician?.full_name || '—'}</td>
                      <td className="text-gray-500">{p.start_date ? new Date(p.start_date).toLocaleDateString('es-ES') : '—'}</td>
                      <td className="text-gray-500">{p.expected_close_date ? new Date(p.expected_close_date).toLocaleDateString('es-ES') : '—'}</td>
                      <td className="text-gray-300"><IcChevron /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map(p => {
              const st = SUPPORT_STATUS.find(s => s.id === p.status)
              return (
                <button key={p.id} onClick={() => navigate('project-detail', { projectId: p.id })}
                  className="card w-full text-left p-4 flex items-center gap-3 hover:border-gray-300 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    {p.pharmacy && <p className="mt-0.5 text-xs text-gray-400 truncate">{p.pharmacy.pharmacy_name}</p>}
                    {p.technician && <p className="mt-0.5 text-xs text-gray-400">{p.technician.full_name}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={st?.badge || 'badge-gray'}>{st?.label || p.status}</span>
                  </div>
                  <span className="text-gray-300 shrink-0"><IcChevron /></span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ProjectsPage({ navigate }) {
  const { projects, loading, error, moveStage } = useProjects()
  const [tab,        setTab]        = useState('commercial')
  const [view,       setView]       = useState('kanban')
  const [showCreate, setShowCreate] = useState(null)

  const commercial = projects.filter(p => p.project_type === 'commercial')
  const support    = projects.filter(p => p.project_type === 'support')

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Proyectos</h1>
          <p className="page-subtitle">
            {commercial.length} comerciales · {support.length} de soporte
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreate('support')}   className="btn-secondary">Soporte</button>
          <button onClick={() => setShowCreate('commercial')} className="btn-primary">
            <IcPlus /> Comercial
          </button>
        </div>
      </div>

      {/* Tabs + view toggle */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        {/* Tabs */}
        <div className="flex">
          {[['commercial', 'Comercial'], ['support', 'Soporte']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm transition border-b-2 ${
                tab === id
                  ? 'border-[#1c473c] text-[#1c473c] font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View toggle — solo en comercial */}
        {tab === 'commercial' && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {[['kanban', <IcKanban key="k" />, 'Kanban'], ['list', <IcList key="l" />, 'Lista']].map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  view === id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-[#1c473c] border-t-transparent animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {tab === 'commercial' && view === 'kanban' && (
            <KanbanView commercial={commercial} moveStage={moveStage} navigate={navigate} />
          )}
          {tab === 'commercial' && view === 'list' && (
            <ListView commercial={commercial} navigate={navigate} />
          )}
          {tab === 'support' && (
            <SupportView support={support} navigate={navigate} />
          )}
        </>
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
