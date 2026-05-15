import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const ACTION_LABELS = {
  create: 'Creado',
  update: 'Actualizado',
  delete: 'Eliminado',
  duplicate: 'Duplicado',
  complete: 'Completado',
  upload: 'Subido',
  status_update: 'Cambio de estado',
  comment_update: 'Comentario actualizado',
}

const ENTITY_LABELS = {
  client: 'Cliente',
  project: 'Proyecto',
  template: 'Plantilla',
  checklist: 'Checklist',
  task: 'Tarea',
  evidence: 'Evidencia',
  document: 'Documento',
}

const ACTION_STYLES = {
  create: 'bg-[#DCFCE7] text-[#166534]',
  update: 'bg-[#DBEAFE] text-[#1D4ED8]',
  delete: 'bg-[#FEE2E2] text-[#B91C1C]',
  duplicate: 'bg-[#F3E8FF] text-[#7E22CE]',
  complete: 'bg-[#ECFCCB] text-[#3F6212]',
  upload: 'bg-[#FEF3C7] text-[#92400E]',
  status_update: 'bg-[#E0F2FE] text-[#075985]',
  comment_update: 'bg-[#F1F5F9] text-[#334155]',
}

export default function TimelinePage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setLogs(data || [])
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const valueText = JSON.stringify({
        old: log.old_value,
        new: log.new_value,
      }).toLowerCase()

      const fullText = [
        log.entity_type,
        log.action,
        log.user_id,
        valueText,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        search.trim() === '' ||
        fullText.includes(search.toLowerCase())

      const matchesEntity =
        entityFilter === 'all' ||
        log.entity_type === entityFilter

      const matchesAction =
        actionFilter === 'all' ||
        log.action === actionFilter

      return matchesSearch && matchesEntity && matchesAction
    })
  }, [logs, search, entityFilter, actionFilter])

  if (loading) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 text-[#64748B]">
        Cargando timeline...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
            Timeline operativo
          </h1>

          <p className="mt-3 text-base text-[#64748B]">
            Secuencia visual de actividad, cambios y trazabilidad.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm text-[#334155] shadow-sm hover:bg-[#F8FAFC]"
        >
          Actualizar
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_220px_220px]">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por acción, entidad, usuario o valor..."
          className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm outline-none focus:border-[#059669]"
        />

        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm outline-none focus:border-[#059669]"
        >
          <option value="all">Todas las entidades</option>
          <option value="client">Clientes</option>
          <option value="project">Proyectos</option>
          <option value="template">Plantillas</option>
          <option value="checklist">Checklists</option>
          <option value="task">Tareas</option>
          <option value="evidence">Evidencias</option>
          <option value="document">Documentos</option>
        </select>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm outline-none focus:border-[#059669]"
        >
          <option value="all">Todas las acciones</option>
          <option value="create">Creado</option>
          <option value="update">Actualizado</option>
          <option value="delete">Eliminado</option>
          <option value="duplicate">Duplicado</option>
          <option value="complete">Completado</option>
          <option value="upload">Subido</option>
          <option value="status_update">Cambio de estado</option>
          <option value="comment_update">Comentario actualizado</option>
        </select>
      </div>

      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-[#64748B]">
            No hay actividad registrada.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute bottom-0 left-[23px] top-0 w-px bg-[#E2E8F0]" />

            <div className="space-y-7">
              {filteredLogs.map(log => (
                <TimelineItem
                  key={log.id}
                  log={log}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineItem({ log }) {
  const actionLabel = ACTION_LABELS[log.action] || log.action
  const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type

  const date = log.created_at
    ? new Date(log.created_at).toLocaleString()
    : '-'

  const titleFromNew =
    log.new_value?.title ||
    log.new_value?.name ||
    log.new_value?.file_name

  const titleFromOld =
    log.old_value?.title ||
    log.old_value?.name ||
    log.old_value?.file_name

  const itemTitle =
    titleFromNew ||
    titleFromOld ||
    log.entity_id ||
    'Elemento sin título'

  return (
    <div className="relative flex gap-5">
      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-[#059669]">
        {getEntityIcon(log.entity_type)}
      </div>

      <div className="min-w-0 flex-1 rounded-[28px] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#64748B]">
                {entityLabel}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  ACTION_STYLES[log.action] ||
                  'bg-[#F1F5F9] text-[#334155]'
                }`}
              >
                {actionLabel}
              </span>
            </div>

            <h2 className="mt-3 text-xl tracking-[-0.02em] text-[#0F172A] font-medium">
              {itemTitle}
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              Usuario: {log.user_id || 'No registrado'}
            </p>
          </div>

          <span className="text-sm text-[#94A3B8]">
            {date}
          </span>
        </div>

        <ChangeSummary
          oldValue={log.old_value}
          newValue={log.new_value}
          action={log.action}
        />
      </div>
    </div>
  )
}

function ChangeSummary({
  oldValue,
  newValue,
  action,
}) {
  if (action === 'status_update') {
    return (
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm">
        <span className="text-[#64748B]">Estado:</span>{' '}
        <span className="text-[#B91C1C]">
          {oldValue?.status || '-'}
        </span>{' '}
        <span className="text-[#94A3B8]">→</span>{' '}
        <span className="text-[#166534]">
          {newValue?.status || '-'}
        </span>
      </div>
    )
  }

  if (action === 'comment_update') {
    return (
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-[#64748B]">
        Comentario actualizado.
      </div>
    )
  }

  if (action === 'upload') {
    return (
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-[#64748B]">
        Archivo subido: {newValue?.file_name || 'evidencia'}
      </div>
    )
  }

  if (action === 'delete') {
    return (
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-[#64748B]">
        Elemento eliminado del sistema.
      </div>
    )
  }

  if (action === 'create') {
    return (
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-[#64748B]">
        Nuevo elemento creado.
      </div>
    )
  }

  if (action === 'update') {
    return (
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-[#64748B]">
        Información actualizada.
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-[#64748B]">
      Acción registrada.
    </div>
  )
}

function getEntityIcon(entityType) {
  const icons = {
    client: '◎',
    project: '▣',
    template: '☷',
    checklist: '✓',
    task: '◌',
    evidence: '▧',
    document: '≣',
  }

  return icons[entityType] || '•'
}