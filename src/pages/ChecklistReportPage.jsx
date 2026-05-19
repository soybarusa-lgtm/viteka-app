import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}
function fmtDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL = {
  pending:        'Pendiente',
  in_progress:    'En curso',
  completed:      'Completada',
  blocked:        'Bloqueada',
  not_applicable: 'No aplica',
}
const STATUS_CLS = {
  pending:        'bg-gray-100 text-gray-600',
  in_progress:    'bg-yellow-50 text-yellow-700',
  completed:      'bg-teal-50 text-teal-700',
  blocked:        'bg-red-50 text-red-600',
  not_applicable: 'bg-gray-50 text-gray-400',
}

function IconArrow()    { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> }
function IconDownload() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }

export default function ChecklistReportPage({ checklistId, onBack }) {
  const [checklist, setChecklist] = useState(null)
  const [sections,  setSections]  = useState([])
  const [tasks,     setTasks]     = useState([])
  const [evidence,  setEvidence]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => { if (checklistId) load() }, [checklistId])

  async function load() {
    setLoading(true)
    const { data: cl } = await supabase.from('checklists').select('*, projects(name, pharmacies(name))').eq('id', checklistId).single()
    setChecklist(cl)
    const { data: secs } = await supabase.from('checklist_sections').select('*').eq('checklist_id', checklistId).order('position')
    setSections(secs || [])
    const ids = (secs || []).map(s => s.id)
    if (ids.length > 0) {
      const { data: tks } = await supabase.from('checklist_tasks').select('*').in('section_id', ids).order('position')
      setTasks(tks || [])
      const tIds = (tks || []).map(t => t.id)
      if (tIds.length > 0) {
        const { data: evs } = await supabase.from('task_evidence').select('*').in('task_id', tIds)
        setEvidence(evs || [])
      }
    }
    setLoading(false)
  }

  async function exportPDF() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW   = pdf.internal.pageSize.getWidth()
      const pageH   = pdf.internal.pageSize.getHeight()
      const imgW    = pageW - 20
      const imgH    = (canvas.height * imgW) / canvas.width
      let y = 10
      let remaining = imgH
      let sourceY   = 0
      const scaleRatio = canvas.width / imgW

      while (remaining > 0) {
        const sliceH = Math.min(remaining, pageH - 20)
        const sliceCanvas  = document.createElement('canvas')
        sliceCanvas.width  = canvas.width
        sliceCanvas.height = sliceH * scaleRatio
        const ctx = sliceCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, sourceY * scaleRatio, canvas.width, sliceH * scaleRatio, 0, 0, canvas.width, sliceH * scaleRatio)
        pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, y, imgW, sliceH)
        remaining -= sliceH
        sourceY   += sliceH
        if (remaining > 0) { pdf.addPage(); y = 10 }
      }

      pdf.save(`informe-${checklist?.title || checklistId}.pdf`)
    } catch (err) {
      alert('Error al generar PDF: ' + err.message)
    }
    setExporting(false)
  }

  const stats = {
    total:     tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked:   tasks.filter(t => t.status === 'blocked').length,
    pending:   tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length,
    na:        tasks.filter(t => t.status === 'not_applicable').length,
  }
  const progress = stats.total > 0
    ? Math.round(((stats.completed + stats.na) / stats.total) * 100)
    : 0

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="page-container space-y-5">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
          <IconArrow /> Volver
        </button>
        <button onClick={exportPDF} disabled={exporting}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
          {exporting
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <IconDownload />
          }
          {exporting ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
      </div>

      {/* Report content — capturado por html2canvas */}
      <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-2xl">

        {/* Report header */}
        <div className="border-b border-gray-100 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">Informe Técnico</p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{checklist?.title}</h1>
              {checklist?.projects && (
                <p className="mt-1 text-sm text-gray-500">
                  {checklist.projects.name}
                  {checklist.projects.pharmacies?.name && ` · ${checklist.projects.pharmacies.name}`}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                checklist?.status === 'completed'
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {checklist?.status === 'completed' ? 'Finalizado' : 'En curso'}
              </span>
              <p className="mt-2 text-xs text-gray-400">Inicio: {fmtDate(checklist?.created_at)}</p>
              {checklist?.completed_at && (
                <p className="text-xs text-gray-400">Cierre: {fmtDate(checklist.completed_at)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { l: 'Total',       v: stats.total,     cls: 'bg-gray-50 text-gray-700' },
            { l: 'Completadas', v: stats.completed, cls: 'bg-teal-50 text-teal-700' },
            { l: 'Bloqueadas',  v: stats.blocked,   cls: stats.blocked > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400' },
            { l: 'Pendientes',  v: stats.pending,   cls: 'bg-yellow-50 text-yellow-700' },
            { l: 'No aplica',   v: stats.na,        cls: 'bg-gray-50 text-gray-400' },
          ].map(s => (
            <div key={s.l} className={`rounded-xl px-3 py-3 text-center ${s.cls}`}>
              <p className="text-xl font-bold leading-none">{s.v}</p>
              <p className="mt-1 text-[10px] font-medium">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-gray-500">
            <span>Progreso</span><span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Sections & tasks */}
        {sections.map((section, si) => {
          const sectionTasks = tasks.filter(t => t.section_id === section.id)
          return (
            <div key={section.id}>
              <h2 className="mb-3 text-sm font-bold text-gray-800 border-b border-gray-100 pb-1">
                {si + 1}. {section.title}
              </h2>
              <div className="space-y-2">
                {sectionTasks.map((task, ti) => {
                  const evs = evidence.filter(e => e.task_id === task.id)
                  return (
                    <div key={task.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="flex-1 text-sm font-medium text-gray-900">
                          {si + 1}.{ti + 1} {task.title}
                        </p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_CLS[task.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {STATUS_LABEL[task.status] || task.status}
                        </span>
                        {task.required && (
                          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-500">Requerida</span>
                        )}
                      </div>

                      {task.description && (
                        <p className="mt-1 text-xs text-gray-400 leading-relaxed">{task.description}</p>
                      )}
                      {task.comments && (
                        <p className="mt-2 rounded-lg bg-white border border-gray-100 px-3 py-2 text-xs text-gray-600 italic leading-relaxed">
                          💬 {task.comments}
                        </p>
                      )}

                      {evs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {evs.filter(ev => ev.file_type?.startsWith('image/')).map(ev => (
                            <img key={ev.id} src={ev.file_url} alt={ev.file_name}
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
                          ))}
                          {evs.filter(ev => !ev.file_type?.startsWith('image/')).map(ev => (
                            <span key={ev.id}
                              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-500">
                              📄 {ev.file_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-[10px] text-gray-300">Generado el {fmtDateTime(new Date().toISOString())} · Viteka App</p>
        </div>
      </div>
    </div>
  )
}
