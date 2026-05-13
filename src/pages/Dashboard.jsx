import { useMemo } from 'react'

export default function Dashboard({
  clients = [],
  projects = [],
  templates = [],
}) {
  const stats = useMemo(() => {
    const activeProjects = projects.filter(
      project => project.status === 'active'
    ).length

    const completedProjects = projects.filter(
      project => project.status === 'completed'
    ).length

    const draftProjects = projects.filter(
      project => project.status === 'draft'
    ).length

    return {
      clients: clients.length,
      projects: projects.length,
      activeProjects,
      completedProjects,
      draftProjects,
      templates: templates.length,
    }
  }, [clients, projects, templates])

  const latestProjects = projects.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <span className="inline-block rounded-full bg-[#E5F3EC] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#005643]">
          Plataforma Operativa
        </span>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          Dashboard técnico
        </h1>

        <p className="mt-2 text-[#8AAA96] font-medium">
          Vista general de clientes, proyectos y plantillas técnicas.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes" value={stats.clients} />
        <StatCard label="Proyectos" value={stats.projects} />
        <StatCard label="Activos" value={stats.activeProjects} />
        <StatCard label="Plantillas" value={stats.templates} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          label="Proyectos activos"
          value={stats.activeProjects}
          helper="Trabajos en curso"
          variant="green"
        />

        <StatusCard
          label="Proyectos completados"
          value={stats.completedProjects}
          helper="Trabajos finalizados"
          variant="blue"
        />

        <StatusCard
          label="Borradores"
          value={stats.draftProjects}
          helper="Pendientes de activar"
          variant="gray"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl bg-white border border-[#DCE7E1] shadow-sm overflow-hidden">
          <div className="border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4">
            <h2 className="font-extrabold text-[#005643]">
              Últimos proyectos
            </h2>
          </div>

          {latestProjects.length === 0 ? (
            <div className="px-6 py-8 text-[#8AAA96]">
              Todavía no hay proyectos registrados.
            </div>
          ) : (
            latestProjects.map(project => (
              <div
                key={project.id}
                className="border-b border-[#EEF4F0] px-6 py-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold">
                      {project.name}
                    </p>

                    <p className="mt-1 text-sm text-[#6E8B7B]">
                      Cliente: {project.clients?.name || 'Sin cliente'}
                    </p>

                    {project.notes && (
                      <p className="mt-1 text-sm text-[#8AAA96]">
                        {project.notes}
                      </p>
                    )}
                  </div>

                  <ProjectStatusBadge status={project.status} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-[#DCE7E1] p-6 shadow-sm">
            <h2 className="font-extrabold text-[#005643]">
              Próximos pasos MVP
            </h2>

            <div className="mt-5 space-y-3">
              <TodoItem done label="Clientes, proyectos y checklists" />
              <TodoItem done label="Ejecución técnica con estados" />
              <TodoItem done label="Evidencias y firmas" />
              <TodoItem label="PDF profesional final" />
              <TodoItem label="Plantillas editables" />
              <TodoItem label="Deploy producción" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#005643] p-6 text-white shadow-sm">
            <h2 className="font-extrabold">
              Estado del producto
            </h2>

            <p className="mt-3 text-sm text-white/80">
              El MVP ya cubre el flujo técnico principal. El siguiente salto es
              gestión avanzada de plantillas y exportación profesional.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-[#DCE7E1] p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8AAA96]">
        {label}
      </p>

      <strong className="mt-2 block text-3xl">
        {value}
      </strong>
    </div>
  )
}

function StatusCard({
  label,
  value,
  helper,
  variant,
}) {
  const variants = {
    green: 'bg-[#E5F3EC] text-[#005643]',
    blue: 'bg-[#EFF6FF] text-[#1D4ED8]',
    gray: 'bg-[#F3F4F6] text-[#374151]',
  }

  return (
    <div className="rounded-2xl bg-white border border-[#DCE7E1] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[#4A6B58]">
          {label}
        </p>

        <span className={`rounded-full px-3 py-1 text-xs font-bold ${variants[variant]}`}>
          {helper}
        </span>
      </div>

      <strong className="mt-4 block text-4xl">
        {value}
      </strong>
    </div>
  )
}

function TodoItem({ label, done = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          done
            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#DCFCE7] text-xs font-bold text-[#166534]'
            : 'flex h-6 w-6 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold text-[#6B7280]'
        }
      >
        {done ? '✓' : '•'}
      </span>

      <span
        className={
          done
            ? 'text-sm font-semibold text-[#4A6B58]'
            : 'text-sm font-semibold text-[#8AAA96]'
        }
      >
        {label}
      </span>
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
    <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${current.className}`}>
      {current.label}
    </span>
  )
}