import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Icons ─────────────────────────────────────────────────────────────────
function IconPrint() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>) }
function IconBack()  { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>) }

// ── Config ────────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  pending:        'Pendiente',
  in_progress:    'En curso',
  blocked:        'Bloqueada',
  completed:      'Completada',
  not_applicable: 'No aplica',
}
const STATUS_PILL = {
  pending:        'bg-slate-100 text-slate-600 ring-slate-200',
  in_progress:    'bg-amber-50 text-amber-700 ring-amber-200',
  blocked:        'bg-red-50 text-red-600 ring-red-200',
  completed:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  not_applicable: 'bg-gray-100 text-gray-500 ring-gray-200',
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function ChecklistReportPage({ checklistId, onBack, onBackToList }) {
  const [checklist, setChecklist] = useState(null)
  const [sections,  setSections]  = useState([])
  const [tasks,     setTasks]     = useState([])
  const [evidence,  setEvidence]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { if (checklistId) load() }, [checklistId])

  async function load() {
    setLoading(true)
    const { data: cl } = await supabase
      .from('checklists')
      .select('*, projects(name, clients(name, email, phone))')
      .eq('id', checklistId)
      .single()
    setChecklist(cl || null)

    const { data: secs } = await supabase.from('checklist_sections').select('*').eq('checklist_id', checklistId).order('position')
    setSections(secs || [])

    const ids = (secs || []).map(s => s.id)
    if (ids.length > 0) {
      const { data: tks } = await supabase.from('checklist_tasks').select('*').in('section_id', ids).order('position')
      setTasks(tks || [])
      const tIds = (tks || []).map(t => t.id)
      if (tIds.length > 0) {
        const { data: evs } = await supabase.from('task_evidence').select('*').in('task_id', tIds).order('created_at')
        setEvidence(evs || [])
      }
    }
    setLoading(false)
  }

  const progress = useMemo(() => {
    if (!tasks.length) return 0
    const done = tasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length
    return Math.round((done / tasks.length) * 100)
  }, [tasks])

  const counts = useMemo(() => ({
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked:   tasks.filter(t => t.status === 'blocked').length,
    pending:   tasks.filter(t => t.status === 'pending').length,
    na:        tasks.filter(t => t.status === 'not_applicable').length,
  }), [tasks])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" />
    </div>
  )
  if (!checklist) return (
    <div className="rounded-2xl border border-[#E8EDF2] bg-white p-8 text-[#94A3B8]">Cargando informe...</div>
  )

  const isCompleted = checklist.status === 'completed'
  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body { background: white !important; }
          aside, header, .no-print { display: none !important; }
          main, .print-area { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .report-card { box-shadow: none !important; break-inside: avoid; page-break-inside: avoid; }
          .print-area { border: none !important; }
          a { color: #005643 !important; text-decoration: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onBackToList}
            className="flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] bg-white px-4 py-2.5 text-[13px] font-medium text-[#64748B] shadow-sm hover:bg-[#F8FAFC]">
            <IconBack /> Checklists
          </button>
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] bg-white px-4 py-2.5 text-[13px] font-medium text-[#005643] shadow-sm hover:bg-[#F8FAFC]">
            <IconBack /> Volver a ejecución
          </button>
        </div>
        <button type="button" onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl bg-[#005643] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#00442f]">
          <IconPrint /> Imprimir / PDF
        </button>
      </div>

      {/* Report area */}
      <div className="print-area overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">

        {/* Report header */}
        <div className="border-b border-[#F1F5F9] bg-[#FAFBFC] px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xl font-semibold text-[#005643]">Viteka</p>
              <p className="text-[12px] uppercase tracking-wider text-[#94A3B8]">Informe técnico</p>
            </div>
            <div className="text-right text-[13px] text-[#64748B] space-y-0.5">
              <p>{today}</p>
              <p className={isCompleted ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                {isCompleted ? 'Finalizado' : 'En curso'}
              </p>
              {checklist.completed_at && (
                <p>Completado: {new Date(checklist.completed_at).toLocaleDateString('es-ES')}</p>
              )}
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[#0F172A]">{checklist.title}</h1>

          {/* KPI grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { l: 'Proyecto',   v: checklist.projects?.name || '—' },
              { l: 'Cliente',    v: checklist.projects?.clients?.name || '—' },
              { l: 'Progreso',   v: `${progress}%`, bold: true },
              { l: 'Completadas', v: counts.completed },
              { l: 'Pendientes', v: counts.pending },
              { l: 'Bloqueadas', v: counts.blocked, warn: counts.blocked > 0 },
            ].map(k => (
              <div key={k.l} className="rounded-xl border border-[#E8EDF2] bg-white p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">{k.l}</p>
                <p className={`mt-1 text-[15px] font-semibold truncate ${
                  k.warn ? 'text-red-600' : k.bold ? 'text-[#005643]' : 'text-[#0F172A]'
                }`}>{k.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-8 py-4 border-b border-[#F1F5F9]">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#F1F5F9]">
            <div className={`h-full rounded-full ${
              counts.blocked > 0 ? 'bg-red-400' : 'bg-[#005643]'
            }`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Observations */}
        {checklist.observations && (
          <div className="px-8 py-5 border-b border-[#F1F5F9]">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Observaciones generales</p>
            <p className="text-[13px] leading-relaxed text-[#334155] whitespace-pre-wrap">{checklist.observations}</p>
          </div>
        )}

        {/* Sections */}
        <div className="p-8 space-y-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Detalle técnico</p>

          {sections.map(sec => {
            const secTasks = tasks.filter(t => t.section_id === sec.id)
            const secDone  = secTasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length
            const secPct   = secTasks.length > 0 ? Math.round((secDone / secTasks.length) * 100) : 0
            return (
              <div key={sec.id} className="report-card overflow-hidden rounded-2xl border border-[#E8EDF2]">
                {/* Section header */}
                <div className="flex items-center justify-between bg-[#FAFBFC] px-6 py-3.5 border-b border-[#F1F5F9]">
                  <p className="text-[14px] font-semibold text-[#0F172A]">{sec.title}</p>
                  <div className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#E8EDF2]">
                      <div className="h-full rounded-full bg-[#005643]" style={{ width: `${secPct}%` }} />
                    </div>
                    <span>{secPct}%</span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-[#F8FAFC]">
                  {secTasks.map(task => {
                    const evs = evidence.filter(e => e.task_id === task.id)
                    const pill = STATUS_PILL[task.status] || STATUS_PILL.pending
                    return (
                      <div key={task.id} className="px-6 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-[14px] font-medium text-[#0F172A]">{task.title}</p>
                            {task.description && <p className="mt-0.5 text-[12px] text-[#94A3B8]">{task.description}</p>}
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${pill}`}>
                            {STATUS_LABELS[task.status] || task.status}
                          </span>
                        </div>

                        {/* Comments */}
                        {task.comments && (
                          <div className={`mt-3 rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${
                            task.status === 'blocked'
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-[#E8EDF2] bg-[#F8FAFC] text-[#334155]'
                          }`}>
                            <span className="font-medium">Comentarios: </span>{task.comments}
                          </div>
                        )}

                        {/* Evidence */}
                        {evs.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Evidencias ({evs.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {evs.map(ev => (
                                <a key={ev.id} href={ev.file_url} target="_blank" rel="noreferrer"
                                  className="overflow-hidden rounded-xl border border-[#E8EDF2] bg-white">
                                  {ev.file_type?.startsWith('image/') ? (
                                    <img src={ev.file_url} className="h-20 w-20 object-cover" />
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center text-[11px] font-medium text-[#64748B]">PDF</div>
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Signatures */}
        <div className="border-t border-[#F1F5F9] px-8 py-6">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Firmas</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SignatureCard title="Firma técnico"  name={checklist.technician_name}  signature={checklist.technician_signature} />
            <SignatureCard title="Firma cliente"  name={checklist.client_name}       signature={checklist.client_signature} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SignatureCard({ title, name, signature }) {
  return (
    <div className="rounded-2xl border border-[#E8EDF2] p-5">
      <p className="text-[12px] font-medium uppercase tracking-wider text-[#94A3B8]">{title}</p>
      <div className="mt-3 flex h-28 items-center justify-center overflow-hidden rounded-xl border border-[#E8EDF2] bg-[#FAFBFC]">
        {signature
          ? <img src={signature} className="max-h-24 w-full object-contain" />
          : <span className="text-[13px] text-[#94A3B8]">Sin firma registrada</span>
        }
      </div>
      <div className="mt-3 border-t border-[#F1F5F9] pt-3">
        <p className="text-[12px] text-[#94A3B8]">Nombre: <span className="font-medium text-[#334155]">{name || '—'}</span></p>
      </div>
    </div>
  )
}
