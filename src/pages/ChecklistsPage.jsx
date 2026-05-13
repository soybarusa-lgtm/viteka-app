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

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Checklists
          </h1>

          <p className="mt-2 text-[#8AAA96] font-medium">
            Plantillas y ejecuciones técnicas.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCreateTemplate}
            className="rounded-xl border border-[#DCE7E1] bg-white px-5 py-3 font-bold text-[#005643] hover:bg-[#F5FAF6]"
          >
            Nueva plantilla
          </button>

          <button
            type="button"
            onClick={onCreateChecklist}
            className="rounded-xl bg-[#005643] px-5 py-3 text-white font-bold hover:bg-[#0E7A60]"
          >
            Nuevo checklist
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Ejecuciones" value={executedChecklists.length} />
        <StatCard label="En curso" value={activeCount} />
        <StatCard label="Finalizadas" value={completedCount} />
      </div>

      <div className="mb-6 rounded-2xl bg-white border border-[#DCE7E1] p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
            placeholder="Buscar por checklist, proyecto o cliente..."
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
          >
            <option value="all">Todos los estados</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Finalizados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-[#DCE7E1] shadow-sm overflow-hidden">
          <div className="border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4">
            <h2 className="font-extrabold text-[#005643]">
              Ejecuciones
            </h2>
          </div>

          {filteredChecklists.length === 0 ? (
            <div className="px-6 py-8 text-[#8AAA96]">
              No hay checklists que coincidan con la búsqueda.
            </div>
          ) : (
            filteredChecklists.map(checklist => (
              <div
                key={checklist.id}
                className="border-b border-[#EEF4F0] px-6 py-5 hover:bg-[#F7FAF8]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenChecklist(checklist.id)}
                    className="text-left"
                  >
                    <p className="font-bold">
                      {checklist.title}
                    </p>

                    <p className="mt-1 text-sm text-[#6E8B7B]">
                      Proyecto: {checklist.projects?.name || 'Sin proyecto'}
                    </p>

                    <p className="mt-1 text-sm text-[#8AAA96]">
                      Cliente: {checklist.projects?.clients?.name || 'Sin cliente'}
                    </p>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <ChecklistStatusBadge status={checklist.status} />

                    <button
                      type="button"
                      onClick={() => onDeleteChecklist(checklist.id)}
                      className="h-fit rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl bg-white border border-[#DCE7E1] shadow-sm overflow-hidden">
          <div className="border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4">
            <h2 className="font-extrabold text-[#005643]">
              Plantillas disponibles
            </h2>
          </div>

          {templates.length === 0 ? (
            <div className="px-6 py-8 text-[#8AAA96]">
              No hay plantillas disponibles.
            </div>
          ) : (
            templates.map(template => (
              <div
                key={template.id}
                className="border-b border-[#EEF4F0] px-6 py-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectTemplate(template.id)}
                      className="text-left"
                    >
                      <p className="font-bold">
                        {template.name}
                      </p>

                      <p className="mt-1 text-sm text-[#6E8B7B]">
                        {template.description || 'Sin descripción'}
                      </p>

                      <span className="mt-3 inline-block rounded-full bg-[#E5F3EC] px-3 py-1 text-xs font-bold text-[#005643]">
                        {template.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEditTemplate(template.id)}
                      className="h-fit rounded-xl border border-[#DCE7E1] px-4 py-2 text-sm font-bold text-[#005643] hover:bg-[#F5FAF6]"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateTemplate(template.id)}
                      className="h-fit rounded-xl border border-[#DCE7E1] px-4 py-2 text-sm font-bold text-[#4A6B58] hover:bg-[#F5FAF6]"
                    >
                      Duplicar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTemplate(template.id)}
                      className="h-fit rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-[#DCE7E1] p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8AAA96]">
        {label}
      </p>

      <strong className="mt-2 block text-3xl">
        {value}
      </strong>
    </div>
  )
}

function ChecklistStatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="h-fit rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#166534]">
        Finalizado
      </span>
    )
  }

  return (
    <span className="h-fit rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-bold text-[#92400E]">
      En curso
    </span>
  )
}