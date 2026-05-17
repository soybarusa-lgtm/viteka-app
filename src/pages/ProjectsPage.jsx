import { useMemo, useState } from 'react'

// ── Icons ──────────────────────────────────────────────────────────────────
function IconSearch() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)
}
function IconEdit() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>)
}
function IconTrash() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>)
}
function IconBuilding() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h1"/><path d="M14 9h1"/><path d="M9 14h1"/><path d="M14 14h1"/><path d="M9 19v-5h6v5"/></svg>)
}

// ── Helpers ────────────────────────────────────────────────────────────────
const STATUS = {
  draft:     { label: 'Borrador',   cls: 'badge-amber' },
  active:    { label: 'Activo',     cls: 'badge-green' },
  completed: { label: 'Completado', cls: 'badge-blue'  },
  cancelled: { label: 'Cancelado',  cls: 'badge-red'   },
}
function badge(status) { return STATUS[status] || STATUS.active }
function fmtDate(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────
export default function ProjectsPage({
  projects = [],
  onCreateProject,
  onEditProject,
  onDeleteProject,
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [client, setClient] = useState('')

  const clients = useMemo(() => {
    const map = {}
    projects.forEach(p => {
      if (p.clients?.id) map[p.clients.id] = p.clients.pharmacy_name || p.clients.name
    })
    return Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]))
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const text = [p.name, p.clients?.name, p.clients?.pharmacy_name, p.notes].join(' ').toLowerCase()
      return (
        (!search || text.includes(search.toLowerCase())) &&
        (status === 'all' || p.status === status) &&
        (!client || p.clients?.id === client)
      )
    })
  }, [projects, search, status, client])

  const counts = useMemo(() => ({
    total:     projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length,
  }), [projects])

  const dotColors = { draft: 'bg-amber-400', active: 'bg-emerald-500', completed: 'bg-blue-500', cancelled: 'bg-red-400' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Proyectos</h1>
          <p className="page-subtitle">Gestión técnica de instalaciones y operaciones</p>
        </div>
        <button type="button" onClick={onCreateProject} className="btn-primary flex items-center gap-2 text-[13px]">
          <span className="text-base leading-none">+</span> Nuevo proyecto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total',       value: counts.total,     dot: 'bg-slate-400' },
          { label: 'Activos',     value: counts.active,    dot: dotColors.active },
          { label: 'Completados', value: counts.completed, dot: dotColors.completed },
          { label: 'Cancelados',  value: counts.cancelled, dot: dotColors.cancelled },
        ].map(k => (
          <div key={k.label} className="card flex flex-col justify-between p-5">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${k.dot}`} />
              <p className="text-[12px]" style={{ color: 'var(--muted)' }}>{k.label}</p>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><IconSearch /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cliente o notas..."
            className="input w-full pl-9"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="input sm:w-[160px]">
          <option value="all">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="active">Activo</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        {clients.length > 0 && (
          <select value={client} onChange={e => setClient(e.target.value)} className="input sm:w-[180px]">
            <option value="">Todas las farmacias</option>
            {clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
      </div>

      <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
        {filtered.length === projects.length ? `${projects.length} proyectos` : `${filtered.length} de ${projects.length} proyectos`}
      </p>

      {/* Table / Empty */}
      {filtered.length === 0 ? (
        <div className="empty-state border-dashed">
          <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>
            {search || status !== 'all' || client ? 'Sin resultados' : 'Aún no hay proyectos'}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
            {search || status !== 'all' || client ? 'Prueba con otros filtros' : 'Crea el primer proyecto para empezar'}
          </p>
          {(search || status !== 'all' || client) && (
            <button type="button" onClick={() => { setSearch(''); setStatus('all'); setClient('') }}
              className="mt-4 text-[13px] font-medium hover:underline" style={{ color: 'var(--primary)' }}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table-base min-w-[640px]">
            <thead>
              <tr>
                {['Proyecto', 'Farmacia', 'Estado', 'Creado', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const b = badge(p.status)
                return (
                  <tr key={p.id} className="group">
                    <td>
                      <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>{p.name}</p>
                      {p.notes && <p className="mt-0.5 line-clamp-1 text-[12px]" style={{ color: 'var(--muted)' }}>{p.notes}</p>}
                    </td>
                    <td>
                      {p.clients ? (
                        <div className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                          <span style={{ color: 'var(--muted)' }}><IconBuilding /></span>
                          {p.clients.pharmacy_name || p.clients.name}
                        </div>
                      ) : <span className="text-[13px]" style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td><span className={b.cls}>{b.label}</span></td>
                    <td className="text-[13px]" style={{ color: 'var(--muted)' }}>{fmtDate(p.created_at)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <ActionBtn onClick={() => onEditProject(p)} title="Editar" color="slate"><IconEdit /></ActionBtn>
                        <ActionBtn onClick={() => onDeleteProject(p.id)} title="Eliminar" color="red"><IconTrash /></ActionBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ActionBtn({ onClick, title, color, children }) {
  const styles = {
    slate: { background: 'var(--surface-soft)', color: 'var(--text-soft)' },
    red:   { background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)' },
  }
  return (
    <button type="button" onClick={onClick} title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-80"
      style={styles[color]}>
      {children}
    </button>
  )
}
