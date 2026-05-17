import { useMemo, useState } from 'react'

// ── Icons ──────────────────────────────────────────────────────────────────
function IconSearch() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }
function IconCopy()   { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>) }
function IconEdit()   { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>) }
function IconTrash()  { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>) }
function IconPlay()   { return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>) }

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Component ───────────────────────────────────────────────────────────────
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
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('all')
  const [tab, setTab]         = useState('executions') // 'executions' | 'templates'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Checklists</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Ejecuciones técnicas y plantillas</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCreateTemplate}
            className="flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] bg-white px-4 py-2.5 text-[13px] font-medium text-[#334155] shadow-sm transition hover:bg-[#F8FAFC]">
            + Plantilla
          </button>
          <button type="button" onClick={onCreateChecklist}
            className="flex items-center gap-1.5 rounded-xl bg-[#005643] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#00442f]">
            + Nuevo checklist
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Total',       value: counts.total,     dot: 'bg-slate-400' },
          { label: 'En curso',    value: counts.active,    dot: 'bg-emerald-500' },
          { label: 'Finalizados', value: counts.completed, dot: 'bg-blue-500' },
          { label: 'Con bloqueos',value: counts.blocked,   dot: 'bg-red-400' },
          { label: 'Plantillas',  value: counts.templates, dot: 'bg-violet-400' },
        ].map(k => (
          <div key={k.label} className={`flex flex-col justify-between rounded-2xl border p-4 ${
            k.label === 'Con bloqueos' && counts.blocked > 0
              ? 'border-red-200 bg-red-50'
              : 'border-[#E8EDF2] bg-white'
          }`}>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${k.dot}`} />
              <p className="text-[11px] text-[#94A3B8]">{k.label}</p>
            </div>
            <p className={`mt-2 text-2xl font-semibold tracking-tight ${
              k.label === 'Con bloqueos' && counts.blocked > 0 ? 'text-red-700' : 'text-[#0F172A]'
            }`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] p-1 w-fit">
        {[{ id: 'executions', label: `Ejecuciones (${counts.total})` }, { id: 'templates', label: `Plantillas (${counts.templates})` }].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium transition ${
              tab === t.id ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Executions */}
      {tab === 'executions' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar checklist, proyecto o farmacia..."
                className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20" />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#005643] sm:w-[160px]">
              <option value="all">Todos</option>
              <option value="in_progress">En curso</option>
              <option value="completed">Finalizados</option>
              <option value="blocked">Con bloqueos</option>
            </select>
          </div>

          <p className="text-[12px] text-[#94A3B8]">
            {filtered.length === executedChecklists.length ? `${executedChecklists.length} ejecuciones` : `${filtered.length} de ${executedChecklists.length}`}
          </p>

          {filtered.length === 0 ? (
            <EmptyState label={executedChecklists.length === 0 ? 'Aún no hay ejecuciones' : 'Sin resultados'}
              sub={executedChecklists.length === 0 ? 'Crea un checklist a partir de una plantilla' : 'Prueba con otros filtros'} />
          ) : (
            <div className="space-y-3">
              {filtered.map(c => (
                <ChecklistCard
                  key={c.id}
                  checklist={c}
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
              <div key={t.id} className="flex flex-col gap-4 rounded-2xl border border-[#E8EDF2] bg-white p-5 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium text-[#0F172A] truncate">{t.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                      t.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-100 text-gray-500 ring-gray-200'
                    }`}>{t.is_active ? 'Activa' : 'Inactiva'}</span>
                  </div>
                  {t.description && <p className="mt-0.5 text-[12px] text-[#94A3B8] line-clamp-1">{t.description}</p>}
                  <p className="mt-1 text-[11px] text-[#CBD5E1]">{fmtDate(t.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ActionBtn onClick={() => onCreateChecklist()} title="Usar plantilla" color="green"><IconPlay /></ActionBtn>
                  <ActionBtn onClick={() => onEditTemplate(t.id)} title="Editar" color="slate"><IconEdit /></ActionBtn>
                  <ActionBtn onClick={() => onDuplicateTemplate(t.id)} title="Duplicar" color="slate"><IconCopy /></ActionBtn>
                  <ActionBtn onClick={() => onDeleteTemplate(t.id)} title="Eliminar" color="red"><IconTrash /></ActionBtn>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Checklist card ──────────────────────────────────────────────────────────
function ChecklistCard({ checklist: c, onOpen, onDelete }) {
  const hasBlocked = (c.stats?.blocked || 0) > 0
  const progress   = c.stats?.progress || 0

  return (
    <div className={`rounded-2xl border bg-white p-5 transition hover:shadow-sm ${
      hasBlocked ? 'border-red-200' : 'border-[#E8EDF2]'
    }`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Info */}
        <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-medium text-[#0F172A]">{c.title}</p>
            <StatusPill status={c.status} blocked={c.stats?.blocked || 0} />
          </div>
          <p className="mt-1 text-[12px] text-[#94A3B8]">
            {c.projects?.name || '—'}
            {c.projects?.clients && ` · ${c.projects.clients.pharmacy_name || c.projects.clients.name}`}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span>Progreso</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className={`h-full rounded-full transition-all ${hasBlocked ? 'bg-red-400' : 'bg-[#005643]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Mini stats */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { l: 'Total',       v: c.stats?.total || 0,     danger: false },
              { l: 'Completadas', v: c.stats?.completed || 0, danger: false },
              { l: 'Pendientes',  v: c.stats?.pending || 0,   danger: false },
              { l: 'Bloqueadas',  v: c.stats?.blocked || 0,   danger: hasBlocked },
            ].map(s => (
              <span key={s.l} className={`rounded-lg px-2 py-1 text-[11px] font-medium ${
                s.danger ? 'bg-red-50 text-red-600' : 'bg-[#F8FAFC] text-[#64748B]'
              }`}>{s.l}: <strong>{s.v}</strong></span>
            ))}
          </div>
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onOpen}
            className="rounded-lg bg-[#005643] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#00442f]">
            Abrir
          </button>
          <ActionBtn onClick={onDelete} title="Eliminar" color="red"><IconTrash /></ActionBtn>
        </div>
      </div>
    </div>
  )
}

// ── StatusPill ──────────────────────────────────────────────────────────────
function StatusPill({ status, blocked }) {
  if (blocked > 0) return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-red-200">Bloqueado</span>
  if (status === 'completed') return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200">Finalizado</span>
  return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">En curso</span>
}

// ── Reusable ─────────────────────────────────────────────────────────────────
function ActionBtn({ onClick, title, color, children }) {
  const s = { green: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', slate: 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]', red: 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#fecaca]' }
  return (
    <button type="button" onClick={onClick} title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${s[color]}`}>
      {children}
    </button>
  )
}
function EmptyState({ label, sub }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-12 text-center">
      <p className="text-[14px] font-medium text-[#0F172A]">{label}</p>
      <p className="mt-1 text-[13px] text-[#94A3B8]">{sub}</p>
    </div>
  )
}
