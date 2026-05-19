import { useMemo, useState } from 'react'

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function IconSearch() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IconCopy()  { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> }
function IconEdit()  { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IconTrash() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg> }
function IconPlay()  { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> }

export default function ChecklistsPage({
  templates = [],
  executedChecklists = [],
  onSelectTemplate,
  onCreateChecklist,
  onCreateTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onDeleteChecklist,
  onOpenChecklist,
  onEditTemplate,
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [tab, setTab]       = useState('executions')

  const filtered = useMemo(() => {
    return executedChecklists.filter(c => {
      const text = [c.title, c.projects?.name, c.projects?.clients?.name, c.projects?.clients?.pharmacy_name].join(' ').toLowerCase()
      const matchSearch = !search || text.includes(search.toLowerCase())
      const matchStatus = status === 'all' || c.status === status ||
        (status === 'blocked' && (c.stats?.blocked || 0) > 0)
      return matchSearch && matchStatus
    })
  }, [executedChecklists, search, status])

  const counts = useMemo(() => ({
    total:     executedChecklists.length,
    active:    executedChecklists.filter(c => c.status !== 'completed').length,
    completed: executedChecklists.filter(c => c.status === 'completed').length,
    blocked:   executedChecklists.filter(c => (c.stats?.blocked || 0) > 0).length,
    templates: templates.length,
  }), [executedChecklists, templates])

  return (
    <div className="page-container space-y-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Checklists</h1>
          <p className="text-sm text-gray-500">Ejecuciones técnicas y plantillas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCreateTemplate} className="btn-secondary text-sm">+ Plantilla</button>
          <button onClick={onCreateChecklist} className="btn-primary text-sm">+ Nuevo checklist</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Total',        value: counts.total,     dot: 'bg-gray-400',   alert: false },
          { label: 'En curso',     value: counts.active,    dot: 'bg-teal-500',   alert: false },
          { label: 'Finalizados',  value: counts.completed, dot: 'bg-blue-500',   alert: false },
          { label: 'Con bloqueos', value: counts.blocked,   dot: 'bg-red-400',    alert: counts.blocked > 0 },
          { label: 'Plantillas',   value: counts.templates, dot: 'bg-violet-400', alert: false },
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {[
          { id: 'executions', label: `Ejecuciones (${counts.total})` },
          { id: 'templates',  label: `Plantillas (${counts.templates})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Executions */}
      {tab === 'executions' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IconSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar checklist, proyecto o farmacia..."
                className="input pl-9" />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="input sm:w-44">
              <option value="all">Todos</option>
              <option value="in_progress">En curso</option>
              <option value="completed">Finalizados</option>
              <option value="blocked">Con bloqueos</option>
            </select>
          </div>

          <p className="text-xs text-gray-400">
            {filtered.length === executedChecklists.length
              ? `${executedChecklists.length} ejecuciones`
              : `${filtered.length} de ${executedChecklists.length}`}
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              label={executedChecklists.length === 0 ? 'Aún no hay ejecuciones' : 'Sin resultados'}
              sub={executedChecklists.length === 0 ? 'Crea un checklist a partir de una plantilla' : 'Prueba con otros filtros'}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map(c => (
                <ChecklistCard key={c.id} checklist={c}
                  onOpen={() => onOpenChecklist(c.id)}
                  onDelete={() => onDeleteChecklist(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Templates */}
      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <EmptyState label="Sin plantillas" sub="Crea la primera plantilla para empezar" />
          ) : (
            templates.map(t => (
              <div key={t.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                      t.is_active
                        ? 'bg-teal-50 text-teal-700 ring-teal-200'
                        : 'bg-gray-100 text-gray-500 ring-gray-200'
                    }`}>{t.is_active ? 'Activa' : 'Inactiva'}</span>
                  </div>
                  {t.description && <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{t.description}</p>}
                  <p className="mt-1 text-[11px] text-gray-300">{fmtDate(t.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ActionBtn onClick={() => onCreateChecklist()} title="Usar plantilla" cls="bg-teal-50 text-teal-700 hover:bg-teal-100"><IconPlay /></ActionBtn>
                  <ActionBtn onClick={() => onEditTemplate(t.id)} title="Editar" cls="bg-gray-100 text-gray-600 hover:bg-gray-200"><IconEdit /></ActionBtn>
                  <ActionBtn onClick={() => onDuplicateTemplate(t.id)} title="Duplicar" cls="bg-gray-100 text-gray-600 hover:bg-gray-200"><IconCopy /></ActionBtn>
                  <ActionBtn onClick={() => onDeleteTemplate(t.id)} title="Eliminar" cls="bg-red-50 text-red-500 hover:bg-red-100"><IconTrash /></ActionBtn>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ChecklistCard({ checklist: c, onOpen, onDelete }) {
  const hasBlocked = (c.stats?.blocked || 0) > 0
  const progress   = c.stats?.progress || 0
  return (
    <div className={`card p-5 transition hover:shadow-md ${
      hasBlocked ? 'border-red-200' : ''
    }`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <button onClick={onOpen} className="flex-1 min-w-0 text-left space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{c.title}</p>
              <StatusPill status={c.status} blocked={c.stats?.blocked || 0} />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {c.projects?.name || '—'}
              {c.projects?.clients && ` · ${c.projects.clients.pharmacy_name || c.projects.clients.name}`}
            </p>
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-gray-400">
              <span>Progreso</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${
                  hasBlocked ? 'bg-red-400' : 'bg-teal-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex flex-wrap gap-2">
            {[
              { l: 'Total',       v: c.stats?.total || 0,     danger: false },
              { l: 'Completadas', v: c.stats?.completed || 0, danger: false },
              { l: 'Pendientes',  v: c.stats?.pending || 0,   danger: false },
              { l: 'Bloqueadas',  v: c.stats?.blocked || 0,   danger: hasBlocked },
            ].map(s => (
              <span key={s.l} className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                s.danger ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
              }`}>{s.l}: <strong>{s.v}</strong></span>
            ))}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button onClick={onOpen}
            className="btn-primary rounded-lg px-3 py-1.5 text-xs">
            Abrir
          </button>
          <ActionBtn onClick={onDelete} title="Eliminar" cls="bg-red-50 text-red-500 hover:bg-red-100">
            <IconTrash />
          </ActionBtn>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status, blocked }) {
  if (blocked > 0)        return <span className="badge-red">Bloqueado</span>
  if (status === 'completed') return <span className="badge-blue">Finalizado</span>
  return <span className="badge-green">En curso</span>
}

function ActionBtn({ onClick, title, cls, children }) {
  return (
    <button onClick={onClick} title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${cls}`}>
      {children}
    </button>
  )
}

function EmptyState({ label, sub }) {
  return (
    <div className="empty-state">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="mt-1 text-sm text-gray-400">{sub}</p>
    </div>
  )
}
