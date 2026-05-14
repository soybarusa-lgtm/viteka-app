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
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-[#0F172A]">
            Proyectos
          </h1>

          <p className="mt-3 text-base font-semibold text-[#64748B]">
            Gestión técnica de instalaciones y operaciones.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateProject}
          className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95"
        >
          + Nuevo proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          title="Total"
          value={projects.length}
        />

        <StatCard
          title="Activos"
          value={activeCount}
        />

        <StatCard
          title="Completados"
          value={completedCount}
        />

        <StatCard
          title="Cancelados"
          value={cancelledCount}
        />
      </div>

      <div className="mt-7 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_240px]">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
            placeholder="Buscar proyecto, cliente o notas..."
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-black outline-none focus:border-[#005643]"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">En revisión</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr] border-b border-[#E2E8F0] bg-[#F8FAFC] px-7 py-5 xl:grid">
          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Proyecto
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Cliente
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Estado
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Notas
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Acciones
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="px-7 py-10 text-sm font-semibold text-[#64748B]">
            No hay proyectos disponibles.
          </div>
        ) : (
          filteredProjects.map(project => (
            <div
              key={project.id}
              className="grid grid-cols-1 gap-5 border-b border-[#F1F5F9] px-7 py-6 xl:grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr]"
            >
              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Proyecto
                </p>

                <p className="font-black text-[#0F172A]">
                  {project.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Cliente
                </p>

                <p className="text-sm font-semibold text-[#64748B]">
                  {project.clients?.name || 'Sin cliente'}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Estado
                </p>

                <StatusBadge status={project.status} />
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Notas
                </p>

                <p className="text-sm font-semibold text-[#64748B]">
                  {project.notes || 'Sin notas'}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Acciones
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onEditProject(project)}
                    className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-black text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteProject(project.id)}
                    className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-100"
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
  title,
  value,
}) {
  return (
    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
      <p className="text-sm font-bold text-[#64748B]">
        {title}
      </p>

      <strong className="mt-3 block text-5xl font-black text-[#0F172A]">
        {value}
      </strong>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    draft: {
      label: 'En revisión',
      className: 'bg-[#FEF3C7] text-[#92400E]',
    },
    active: {
      label: 'Activo',
      className: 'bg-[#DCFCE7] text-[#166534]',
    },
    completed: {
      label: 'Completado',
      className: 'bg-[#DBEAFE] text-[#1D4ED8]',
    },
    cancelled: {
      label: 'Cancelado',
      className: 'bg-[#FEE2E2] text-[#B91C1C]',
    },
  }

  const current = config[status] || config.active

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${current.className}`}>
      {current.label}
    </span>
  )
}