import { useMemo, useState } from 'react'

export default function ProjectsPage({
  projects = [],
  onCreateProject,
  onEditProject,
  onDeleteProject,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const text = [
        project.name,
        project.clients?.name,
        project.notes,
        project.status,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = text.includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        project.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const activeCount = projects.filter(
    project => project.status === 'active'
  ).length

  const completedCount = projects.filter(
    project => project.status === 'completed'
  ).length

  const cancelledCount = projects.filter(
    project => project.status === 'cancelled'
  ).length

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Proyectos
          </h1>

          <p className="mt-2 text-[#8AAA96] font-medium">
            Gestión de instalaciones y trabajos técnicos.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateProject}
          className="rounded-xl bg-[#005643] px-5 py-3 text-white font-bold hover:bg-[#0E7A60]"
        >
          Nuevo proyecto
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={projects.length} />
        <StatCard label="Activos" value={activeCount} />
        <StatCard label="Completados" value={completedCount} />
        <StatCard label="Cancelados" value={cancelledCount} />
      </div>

      <div className="mb-6 rounded-2xl bg-white border border-[#DCE7E1] p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
            placeholder="Buscar por proyecto, cliente o notas..."
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-[#DCE7E1] shadow-sm overflow-hidden">
        <div className="hidden xl:grid grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr] border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4 font-bold text-sm text-[#4A6B58]">
          <div>Proyecto</div>
          <div>Cliente</div>
          <div>Estado</div>
          <div>Notas</div>
          <div>Acciones</div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="px-6 py-8 text-[#8AAA96]">
            No hay proyectos que coincidan con los filtros.
          </div>
        ) : (
          filteredProjects.map(project => (
            <div
              key={project.id}
              className="grid grid-cols-1 gap-4 border-b border-[#EEF4F0] px-6 py-5 xl:grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr]"
            >
              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] xl:hidden">
                  Proyecto
                </p>

                <p className="font-bold">
                  {project.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] xl:hidden">
                  Cliente
                </p>

                <p className="text-[#6E8B7B]">
                  {project.clients?.name || 'Sin cliente'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] xl:hidden">
                  Estado
                </p>

                <ProjectStatusBadge status={project.status} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] xl:hidden">
                  Notas
                </p>

                <p className="text-[#6E8B7B]">
                  {project.notes || 'Sin notas'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] xl:hidden">
                  Acciones
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEditProject(project)}
                    className="rounded-xl border border-[#DCE7E1] px-4 py-2 text-sm font-bold text-[#005643] hover:bg-[#F5FAF6]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteProject(project.id)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
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
  )
}

function StatCard({
  label,
  value,
}) {
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

function ProjectStatusBadge({ status }) {
  const config = {
    draft: {
      label: 'Borrador',
      className: 'bg-[#F3F4F6] text-[#374151]',
    },
    active: {
      label: 'Activo',
      className: 'bg-[#E5F3EC] text-[#005643]',
    },
    completed: {
      label: 'Completado',
      className: 'bg-[#DCFCE7] text-[#166534]',
    },
    cancelled: {
      label: 'Cancelado',
      className: 'bg-[#FEE2E2] text-[#B91C1C]',
    },
  }

  const current = config[status] || config.active

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${current.className}`}>
      {current.label}
    </span>
  )
}