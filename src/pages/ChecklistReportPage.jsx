import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_LABELS = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  blocked: 'Bloqueada',
  completed: 'Completada',
  not_applicable: 'No aplica',
}

export default function ChecklistReportPage({
  checklistId,
  onBack,
  onBackToList,
}) {
  const [checklist, setChecklist] = useState(null)
  const [sections, setSections] = useState([])
  const [tasks, setTasks] = useState([])
  const [evidence, setEvidence] = useState([])

  useEffect(() => {
    if (checklistId) {
      loadReport()
    }
  }, [checklistId])

  async function loadReport() {
    const { data: checklistData } = await supabase
      .from('checklists')
      .select(`
        *,
        projects (
          name,
          clients (
            name,
            email,
            phone
          )
        )
      `)
      .eq('id', checklistId)
      .single()

    setChecklist(checklistData)

    const { data: sectionsData } = await supabase
      .from('checklist_sections')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('position', { ascending: true })

    setSections(sectionsData || [])

    const sectionIds = (sectionsData || []).map(section => section.id)

    if (sectionIds.length > 0) {
      const { data: tasksData } = await supabase
        .from('checklist_tasks')
        .select('*')
        .in('section_id', sectionIds)
        .order('position', { ascending: true })

      setTasks(tasksData || [])

      const taskIds = (tasksData || []).map(task => task.id)

      if (taskIds.length > 0) {
        const { data: evidenceData } = await supabase
          .from('task_evidence')
          .select('*')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false })

        setEvidence(evidenceData || [])
      }
    }
  }

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0

    const completed = tasks.filter(
      task => task.status === 'completed'
    ).length

    return Math.round((completed / tasks.length) * 100)
  }, [tasks])

  const pendingCount = tasks.filter(task => task.status === 'pending').length
  const blockedCount = tasks.filter(task => task.status === 'blocked').length
  const completedCount = tasks.filter(task => task.status === 'completed').length

  if (!checklist) {
    return (
      <div className="rounded-2xl bg-white border border-[#DCE7E1] p-8">
        Cargando informe...
      </div>
    )
  }

  return (
    <div>
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            aside,
            header,
            .no-print {
              display: none !important;
            }

            main,
            .print-area {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
            }

            .report-card,
            .signature-card {
              box-shadow: none !important;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .print-area {
              border: none !important;
            }

            a {
              color: #005643 !important;
              text-decoration: none !important;
            }
          }
        `}
      </style>

      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onBackToList}
            className="rounded-xl border border-[#DCE7E1] px-5 py-3 font-bold text-[#4A6B58] hover:bg-[#F5FAF6]"
          >
            Volver a checklists
          </button>

          <button
            onClick={onBack}
            className="rounded-xl border border-[#DCE7E1] px-5 py-3 font-bold text-[#005643] hover:bg-[#F5FAF6]"
          >
            Volver a ejecución
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="rounded-xl bg-[#005643] px-5 py-3 font-bold text-white hover:bg-[#0E7A60]"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="print-area rounded-2xl bg-white border border-[#DCE7E1] p-6 lg:p-8">
        <div className="border-b border-[#DCE7E1] pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#005643]">
                Viteka
              </h1>

              <p className="mt-1 text-[#8AAA96] font-semibold">
                Informe técnico
              </p>
            </div>

            <div className="text-right text-sm text-[#4A6B58]">
              <p>
                Fecha: {new Date().toLocaleDateString('es-ES')}
              </p>

              <p>
                Estado: {checklist.status === 'completed' ? 'Finalizado' : 'En curso'}
              </p>

              {checklist.completed_at && (
                <p>
                  Finalizado: {new Date(checklist.completed_at).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          </div>

          <h2 className="mt-8 text-2xl font-extrabold">
            {checklist.title}
          </h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoBox
              label="Proyecto"
              value={checklist.projects?.name || 'Sin proyecto'}
            />

            <InfoBox
              label="Cliente"
              value={checklist.projects?.clients?.name || 'Sin cliente'}
            />

            <InfoBox
              label="Progreso"
              value={`${progress}%`}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoBox label="Tareas completadas" value={completedCount} />
            <InfoBox label="Tareas pendientes" value={pendingCount} />
            <InfoBox label="Tareas bloqueadas" value={blockedCount} />
          </div>
        </div>

        <section className="mt-8">
          <h3 className="text-xl font-extrabold text-[#005643]">
            Observaciones generales
          </h3>

          <div className="mt-3 rounded-xl border border-[#DCE7E1] p-5 text-[#374151] whitespace-pre-wrap">
            {checklist.observations || 'Sin observaciones generales.'}
          </div>
        </section>

        <section className="mt-8 space-y-6">
          <h3 className="text-xl font-extrabold text-[#005643]">
            Detalle técnico
          </h3>

          {sections.map(section => {
            const sectionTasks = tasks.filter(
              task => task.section_id === section.id
            )

            return (
              <div
                key={section.id}
                className="report-card rounded-2xl border border-[#DCE7E1] overflow-hidden"
              >
                <div className="bg-[#F7FAF8] px-5 py-4 border-b border-[#DCE7E1]">
                  <h4 className="font-extrabold text-[#005643]">
                    {section.title}
                  </h4>
                </div>

                <div>
                  {sectionTasks.map(task => {
                    const taskEvidence = evidence.filter(
                      item => item.task_id === task.id
                    )

                    return (
                      <div
                        key={task.id}
                        className="border-b border-[#EEF4F0] px-5 py-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-extrabold">
                              {task.title}
                            </p>

                            {task.description && (
                              <p className="mt-1 text-sm text-[#6B7280]">
                                {task.description}
                              </p>
                            )}
                          </div>

                          <span className="rounded-full bg-[#E5F3EC] px-3 py-1 text-xs font-bold text-[#005643]">
                            {STATUS_LABELS[task.status] || task.status}
                          </span>
                        </div>

                        <div className="mt-4 rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#374151] whitespace-pre-wrap">
                          <strong>Comentarios:</strong>{' '}
                          {task.comments || 'Sin comentarios.'}
                        </div>

                        {taskEvidence.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-3 text-sm font-extrabold text-[#4A6B58]">
                              Evidencias
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {taskEvidence.map(item => (
                                <a
                                  key={item.id}
                                  href={item.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-xl border border-[#DCE7E1] p-2 text-xs font-bold text-[#005643]"
                                >
                                  {item.file_type?.startsWith('image/') ? (
                                    <img
                                      src={item.file_url}
                                      className="mb-2 h-24 w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-[#F3F4F6]">
                                      PDF
                                    </div>
                                  )}

                                  Evidencia
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
        </section>

        <section className="mt-10">
          <h3 className="text-xl font-extrabold text-[#005643]">
            Firmas
          </h3>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
            <SignatureReportCard
              title="Firma técnico"
              name={checklist.technician_name}
              signature={checklist.technician_signature}
            />

            <SignatureReportCard
              title="Firma cliente"
              name={checklist.client_name}
              signature={checklist.client_signature}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#DCE7E1] bg-[#F7FAF8] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8AAA96]">
        {label}
      </p>

      <p className="mt-2 font-extrabold">
        {value || '—'}
      </p>
    </div>
  )
}

function SignatureReportCard({
  title,
  name,
  signature,
}) {
  return (
    <div className="signature-card rounded-2xl border border-[#DCE7E1] p-6">
      <p className="font-bold text-[#4A6B58]">
        {title}
      </p>

      <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#FAFCFB]">
        {signature ? (
          <img
            src={signature}
            className="max-h-32 w-full object-contain"
          />
        ) : (
          <span className="text-sm text-[#8AAA96]">
            Sin firma registrada
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-[#CBD5E1] pt-3 text-sm text-[#4A6B58]">
        <strong>Nombre:</strong> {name || '—'}
      </div>
    </div>
  )
}