import { useMemo, useState } from 'react'

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
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredChecklists = useMemo(() => {
    return executedChecklists.filter(checklist => {
      const text = [
        checklist.title,
        checklist.projects?.name,
        checklist.projects?.clients?.name,
        checklist.status,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = text.includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        checklist.status === statusFilter ||
        (statusFilter === 'in_progress' && checklist.status !== 'completed')

      return matchesSearch && matchesStatus
    })
  }, [executedChecklists, search, statusFilter])

  const activeCount = executedChecklists.filter(
    checklist => checklist.status !== 'completed'
  ).length

  const completedCount = executedChecklists.filter(
    checklist => checklist.status === 'completed'
  ).length

  const blockedCount = executedChecklists.filter(
    checklist => (checklist.stats?.blocked || 0) > 0
  ).length

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-[#0F172A]">
            Checklists
          </h1>

          <p className="mt-3 text-base font-semibold text-[#64748B]">
            Ejecuciones técnicas, plantillas y control de progreso.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={onCreateTemplate}
            className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 text-sm font-black text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]"
          >
            + Nueva plantilla
          </button>

          <button
            type="button"
            onClick={onCreateChecklist}
            className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95"
          >
            + Nuevo checklist
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard title="Ejecuciones" value={executedChecklists.length} />
        <StatCard title="En curso" value={activeCount} />
        <StatCard title="Finalizadas" value={completedCount} />
        <StatCard title="Con bloqueos" value={blockedCount} danger={blockedCount > 0} />
      </div>

      <div className="mt-7 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_240px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
            placeholder="Buscar checklist, proyecto o cliente..."
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-black outline-none focus:border-[#005643]"
          >
            <option value="all">Todos los estados</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Finalizados</option>
          </select>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-7 2xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="border-b border-[#E2E8F0] px-7 py-6">
            <h2 className="text-xl font-black text-[#0F172A]">
              Ejecuciones técnicas
            </h2>

            <p className="mt-1 text-sm font-semibold text-[#64748B]">
              {filteredChecklists.length} resultados
            </p>
          </div>

          {filteredChecklists.length === 0 ? (
            <div className="px-7 py-10 text-sm font-semibold text-[#64748B]">
              No hay ejecuciones que coincidan con los filtros.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {filteredChecklists.map(checklist => (
                <div
                  key={checklist.id}
                  className="px-7 py-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenChecklist(checklist.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-black text-[#0F172A]">
                          {checklist.title}
                        </h3>

                        <StatusBadge
                          status={checklist.status}
                          blocked={checklist.stats?.blocked || 0}
                        />
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[#64748B]">
                        Proyecto: {checklist.projects?.name || 'Sin proyecto'}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#94A3B8]">
                        Cliente: {checklist.projects?.clients?.name || 'Sin cliente'}
                      </p>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs font-black text-[#64748B]">
                          <span>Progreso</span>
                          <span>{checklist.stats?.progress || 0}%</span>
                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className={
                              (checklist.stats?.blocked || 0) > 0
                                ? 'h-full rounded-full bg-[#EF4444]'
                                : 'h-full rounded-full bg-[#005643]'
                            }
                            style={{
                              width: `${checklist.stats?.progress || 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <MiniStat label="Total" value={checklist.stats?.total || 0} />
                        <MiniStat label="Completadas" value={checklist.stats?.completed || 0} />
                        <MiniStat label="Pendientes" value={checklist.stats?.pending || 0} />
                        <MiniStat label="Bloqueadas" value={checklist.stats?.blocked || 0} danger={(checklist.stats?.blocked || 0) > 0} />
                      </div>
                    </button>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenChecklist(checklist.id)}
                        className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-black text-[#0F172A] hover:bg-[#F8FAFC]"
                      >
                        Abrir
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteChecklist(checklist.id)}
                        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="border-b border-[#E2E8F0] px-7 py-6">
            <h2 className="text-xl font-black text-[#0F172A]">
              Plantillas disponibles
            </h2>

            <p className="mt-1 text-sm font-semibold text-[#64748B]">
              Base para nuevas ejecuciones.
            </p>
          </div>

          {templates.length === 0 ? (
            <div className="px-7 py-10 text-sm font-semibold text-[#64748B]">
              No hay plantillas disponibles.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="px-7 py-6"
                >
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(template.id)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-black text-[#0F172A]">
                          {template.name}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-[#64748B]">
                          {template.description || 'Sin descripción'}
                        </p>
                      </div>

                      <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-black text-[#166534]">
                        {template.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </button>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onEditTemplate(template.id)}
                      className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-black text-[#0F172A] hover:bg-[#F8FAFC]"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateTemplate(template.id)}
                      className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-black text-[#005643] hover:bg-[#F8FAFC]"
                    >
                      Duplicar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTemplate(template.id)}
                      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  danger = false,
}) {
  return (
    <div
      className={
        danger
          ? 'rounded-3xl border border-red-200 bg-red-50 p-7 shadow-sm'
          : 'rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm'
      }
    >
      <p
        className={
          danger
            ? 'text-sm font-bold text-red-600'
            : 'text-sm font-bold text-[#64748B]'
        }
      >
        {title}
      </p>

      <strong
        className={
          danger
            ? 'mt-3 block text-5xl font-black text-red-700'
            : 'mt-3 block text-5xl font-black text-[#0F172A]'
        }
      >
        {value}
      </strong>
    </div>
  )
}

function MiniStat({
  label,
  value,
  danger = false,
}) {
  return (
    <div
      className={
        danger
          ? 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3'
          : 'rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3'
      }
    >
      <p
        className={
          danger
            ? 'text-[10px] font-black uppercase tracking-wide text-red-600'
            : 'text-[10px] font-black uppercase tracking-wide text-[#64748B]'
        }
      >
        {label}
      </p>

      <strong
        className={
          danger
            ? 'mt-1 block text-sm font-black text-red-700'
            : 'mt-1 block text-sm font-black text-[#0F172A]'
        }
      >
        {value}
      </strong>
    </div>
  )
}

function StatusBadge({
  status,
  blocked = 0,
}) {
  if (blocked > 0) {
    return (
      <span className="rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-black text-[#B91C1C]">
        Bloqueado
      </span>
    )
  }

  if (status === 'completed') {
    return (
      <span className="rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-black text-[#1D4ED8]">
        Finalizado
      </span>
    )
  }

  return (
    <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-black text-[#166534]">
      En curso
    </span>
  )
}