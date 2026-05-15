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
          email
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
      const matchesSearch =
        search.trim() === '' ||
        log.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.profiles?.full_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        log.profiles?.email
          ?.toLowerCase()
          .includes(search.toLowerCase())

      const matchesEntity =
        entityFilter === 'all' ||
        log.entity_type === entityFilter

      return matchesSearch && matchesEntity
    })
  }, [logs, search, entityFilter])

  if (loading) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8">
        <p className="text-[#64748B]">
          Cargando actividad...
        </p>
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
            Historial completo de acciones y cambios realizados.
          </p>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar acciones..."
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
        </select>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Fecha
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Usuario
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Entidad
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Acción
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Valor anterior
                </th>

                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Nuevo valor
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map(log => (
                <tr
                  key={log.id}
                  className="border-b border-[#F1F5F9] align-top"
                >
                  <td className="px-6 py-5 text-sm text-[#334155]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>

                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm text-[#0F172A] font-medium">
                        {log.profiles?.full_name || 'Usuario'}
                      </p>

                      <p className="mt-1 text-xs text-[#64748B]">
                        {log.profiles?.email || '-'}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs text-[#334155] font-medium">
                      {log.entity_type}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        ACTION_COLORS[log.action] ||
                        'bg-[#F1F5F9] text-[#334155]'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <pre className="max-w-[320px] overflow-auto rounded-2xl bg-[#F8FAFC] p-4 text-xs text-[#334155]">
                      {log.old_value
                        ? JSON.stringify(log.old_value, null, 2)
                        : '-'}
                    </pre>
                  </td>

                  <td className="px-6 py-5">
                    <pre className="max-w-[320px] overflow-auto rounded-2xl bg-[#F8FAFC] p-4 text-xs text-[#334155]">
                      {log.new_value
                        ? JSON.stringify(log.new_value, null, 2)
                        : '-'}
                    </pre>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-[#64748B]"
                  >
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