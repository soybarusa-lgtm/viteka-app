import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const ACTION_COLORS = {
  create: 'bg-[#DCFCE7] text-[#166534]',
  update: 'bg-[#DBEAFE] text-[#1D4ED8]',
  delete: 'bg-[#FEE2E2] text-[#B91C1C]',
  duplicate: 'bg-[#F3E8FF] text-[#7E22CE]',
  complete: 'bg-[#ECFCCB] text-[#3F6212]',
  upload: 'bg-[#FEF3C7] text-[#92400E]',
  status_update: 'bg-[#E0F2FE] text-[#075985]',
  comment_update: 'bg-[#F1F5F9] text-[#334155]',
}

function formatDescription(log) {
  const entity = log.entity_type || 'entidad'
  const action = log.action || 'acción'
  const actor = log.profiles?.full_name || log.profiles?.email || 'Usuario'

  // Intento de descripción más humana según acción
  if (action === 'create') return `${actor} creó ${entity}.`
  if (action === 'update') return `${actor} actualizó ${entity}.`
  if (action === 'delete') return `${actor} eliminó ${entity}.`
  if (action === 'duplicate') return `${actor} duplicó ${entity}.`
  if (action === 'upload') return `${actor} subió archivo en ${entity}.`
  if (action === 'complete') return `${actor} completó ${entity}.`
  if (action === 'status_update') return `${actor} cambió estado en ${entity}.`
  if (action === 'comment_update') return `${actor} añadió/actualizó comentario en ${entity}.`

  return `${actor} realizó ${action} en ${entity}.`
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)

    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setLogs(data || [])
  }

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const text = search.toLowerCase().trim()

      const description = formatDescription(log).toLowerCase()
      const matchesSearch =
        text === '' ||
        log.entity_type?.toLowerCase().includes(text) ||
        log.action?.toLowerCase().includes(text) ||
        log.profiles?.full_name?.toLowerCase().includes(text) ||
        log.profiles?.email?.toLowerCase().includes(text) ||
        description.includes(text)

      const matchesEntity =
        entityFilter === 'all' ||
        log.entity_type === entityFilter

      return matchesSearch && matchesEntity
    })
  }, [logs, search, entityFilter])

  if (loading) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8">
        <p className="text-[#64748B]">Cargando actividad...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
            Auditoría
          </h1>

          <p className="mt-3 text-base text-[#64748B] font-normal">
            Consulta de movimientos con día, hora, técnico/operario y descripción.
          </p>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por usuario, acción o descripción..."
          className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm outline-none focus:border-[#059669]"
        />

        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm outline-none focus:border-[#059669]"
        >
          <option value="all">Todos</option>
          <option value="client">Clientes</option>
          <option value="project">Proyectos</option>
          <option value="template">Plantillas</option>
          <option value="checklist">Checklists</option>
          <option value="task">Tareas</option>
          <option value="evidence">Evidencias</option>
          <option value="profile">Usuarios</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Fecha
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Hora
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Técnico / Operario
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Acción
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Descripción
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map(log => {
                const dateObj = new Date(log.created_at)

                const date = dateObj.toLocaleDateString('es-ES')
                const time = dateObj.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })

                const userName =
                  log.profiles?.full_name ||
                  log.profiles?.email ||
                  'Usuario'

                const role = log.profiles?.role || '-'

                return (
                  <tr key={log.id} className="border-b border-[#F1F5F9] align-top">
                    <td className="px-6 py-5 text-sm text-[#334155]">{date}</td>

                    <td className="px-6 py-5 text-sm text-[#334155]">{time}</td>

                    <td className="px-6 py-5">
                      <p className="text-sm text-[#0F172A] font-medium">{userName}</p>
                      <p className="mt-1 text-xs text-[#64748B]">{role}</p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          ACTION_COLORS[log.action] || 'bg-[#F1F5F9] text-[#334155]'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-[#334155]">
                      {formatDescription(log)}
                    </td>
                  </tr>
                )
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#64748B]">
                    No hay registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}