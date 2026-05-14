export default function Dashboard({
  clients = [],
  projects = [],
  templates = [],
  checklists = [],
}) {
  const activeProjects = projects.filter(project => project.status === 'active')
  const completedProjects = projects.filter(project => project.status === 'completed')
  const draftProjects = projects.filter(project => project.status === 'draft')
  const cancelledProjects = projects.filter(project => project.status === 'cancelled')

  const activeChecklists = checklists.filter(checklist => checklist.status !== 'completed')
  const completedChecklists = checklists.filter(checklist => checklist.status === 'completed')

  const totalTasks = checklists.reduce(
    (total, checklist) => total + (checklist.stats?.total || 0),
    0
  )

  const completedTasks = checklists.reduce(
    (total, checklist) => total + (checklist.stats?.completed || 0),
    0
  )

  const pendingTasks = checklists.reduce(
    (total, checklist) => total + (checklist.stats?.pending || 0),
    0
  )

  const blockedTasks = checklists.reduce(
    (total, checklist) => total + (checklist.stats?.blocked || 0),
    0
  )

  const globalProgress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

  const recentProjects = projects.slice(0, 5)
  const recentChecklists = checklists.slice(0, 5)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-[#0F172A]">
            Dashboard
          </h1>

          <p className="mt-3 text-base font-semibold text-[#64748B]">
            Resumen general de tu actividad técnica.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 text-sm font-black text-[#0F172A] shadow-sm hover:bg-[#F8FAFC]"
          >
            📅 Este mes⌄
          </button>

          <button
            type="button"
            className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95"
          >
            ▥ Ver informes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          icon="▣"
          title="Proyectos activos"
          value={activeProjects.length}
          trend="+2 este mes"
        />

        <StatCard
          icon="👥"
          title="Clientes"
          value={clients.length}
          trend="+1 este mes"
        />

        <StatCard
          icon="✓"
          title="Checklists completados"
          value={`${globalProgress}%`}
          trend="+8% este mes"
        />

        <StatCard
          icon="📄"
          title="Informes generados"
          value={completedChecklists.length}
          trend="+6 este mes"
        />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-7 2xl:grid-cols-[1.2fr_400px_420px]">
        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#0F172A]">
              Actividad de proyectos
            </h2>

            <button
              type="button"
              className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-black text-[#334155] hover:bg-[#F8FAFC]"
            >
              Este mes⌄
            </button>
          </div>

          <div className="relative h-80 overflow-hidden rounded-3xl bg-white">
            <div className="absolute left-0 right-0 top-10 border-t border-[#E2E8F0]" />
            <div className="absolute left-0 right-0 top-24 border-t border-[#E2E8F0]" />
            <div className="absolute left-0 right-0 top-40 border-t border-[#E2E8F0]" />
            <div className="absolute left-0 right-0 top-56 border-t border-[#E2E8F0]" />

            <svg
              viewBox="0 0 800 260"
              className="relative z-10 h-full w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="projectArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#009B73" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="#009B73" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              <path
                d="M0 210 C80 160, 120 150, 180 158 C260 168, 290 112, 360 128 C430 145, 455 78, 530 88 C610 100, 645 50, 800 38 L800 260 L0 260 Z"
                fill="url(#projectArea)"
              />

              <path
                d="M0 210 C80 160, 120 150, 180 158 C260 168, 290 112, 360 128 C430 145, 455 78, 530 88 C610 100, 645 50, 800 38"
                fill="none"
                stroke="#007A5E"
                strokeWidth="5"
                strokeLinecap="round"
              />

              <circle cx="800" cy="38" r="8" fill="#007A5E" />
            </svg>

            <div className="absolute right-8 top-20 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm">
              <p className="text-lg font-black text-[#0F172A]">
                {activeProjects.length}
              </p>

              <p className="text-xs font-semibold text-[#64748B]">
                Proyectos activos
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black text-[#0F172A]">
            Proyectos por estado
          </h2>

          <div className="mt-8 flex justify-center">
            <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-[#E2E8F0]">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(#005643 0deg 210deg, #4ADE80 210deg 300deg, #FBBF24 300deg 340deg, #EF4444 340deg 360deg)',
                }}
              />

              <div className="relative h-32 w-32 rounded-full bg-white" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <LegendRow label="Activos" value={activeProjects.length} dot="bg-[#005643]" />
            <LegendRow label="Completados" value={completedProjects.length} dot="bg-[#4ADE80]" />
            <LegendRow label="En revisión" value={draftProjects.length} dot="bg-[#FBBF24]" />
            <LegendRow label="Cancelados" value={cancelledProjects.length} dot="bg-[#EF4444]" />
          </div>
        </div>

        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#0F172A]">
              Actividad reciente
            </h2>

            <button
              type="button"
              className="text-sm font-black text-[#005643]"
            >
              Ver todo
            </button>
          </div>

          {recentChecklists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E2E8F0] p-8 text-center text-sm font-semibold text-[#64748B]">
              No hay actividad registrada.
            </div>
          ) : (
            <div className="space-y-5">
              {recentChecklists.map(checklist => (
                <ActivityItem
                  key={checklist.id}
                  title={checklist.title}
                  subtitle={`Proyecto: ${checklist.projects?.name || 'Sin proyecto'}`}
                  time={checklist.status === 'completed' ? 'Completado' : 'Activo'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-7 2xl:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-7 py-6">
            <h2 className="text-xl font-black text-[#0F172A]">
              Proyectos recientes
            </h2>

            <button
              type="button"
              className="text-sm font-black text-[#005643]"
            >
              Ver todos
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="px-7 py-10 text-sm font-semibold text-[#64748B]">
              No hay proyectos todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-xs font-black uppercase tracking-wide text-[#64748B]">
                    <th className="px-7 py-4">Proyecto</th>
                    <th className="px-7 py-4">Cliente</th>
                    <th className="px-7 py-4">Estado</th>
                    <th className="px-7 py-4">Progreso</th>
                    <th className="px-7 py-4">Última actividad</th>
                  </tr>
                </thead>

                <tbody>
                  {recentProjects.map(project => (
                    <tr
                      key={project.id}
                      className="border-b border-[#F1F5F9]"
                    >
                      <td className="px-7 py-5 font-black text-[#0F172A]">
                        {project.name}
                      </td>

                      <td className="px-7 py-5 text-sm font-semibold text-[#64748B]">
                        {project.clients?.name || 'Sin cliente'}
                      </td>

                      <td className="px-7 py-5">
                        <StatusBadge status={project.status} />
                      </td>

                      <td className="px-7 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-[#E2E8F0]">
                            <div
                              className="h-full rounded-full bg-[#005643]"
                              style={{
                                width:
                                  project.status === 'completed'
                                    ? '100%'
                                    : project.status === 'active'
                                      ? '75%'
                                      : '35%',
                              }}
                            />
                          </div>

                          <span className="text-sm font-black text-[#334155]">
                            {project.status === 'completed'
                              ? '100%'
                              : project.status === 'active'
                                ? '75%'
                                : '35%'}
                          </span>
                        </div>
                      </td>

                      <td className="px-7 py-5 text-sm font-semibold text-[#64748B]">
                        Hace 1 día
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#0F172A]">
              Tareas pendientes
            </h2>

            <button
              type="button"
              className="text-sm font-black text-[#005643]"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-5">
            <TaskItem
              title="Revisar checklist de seguridad"
              subtitle="Instalación técnica"
              date="Hoy"
            />

            <TaskItem
              title="Subir evidencias fotográficas"
              subtitle="Proyecto activo"
              date="Mañana"
            />

            <TaskItem
              title="Generar informe mensual"
              subtitle="Todos los proyectos"
              date="30 May"
            />

            <TaskItem
              title="Reunión con cliente"
              subtitle="Cliente activo"
              date="31 May"
            />

            <p className="pt-2 text-sm font-black text-[#005643]">
              + {pendingTasks} tareas pendientes · {blockedTasks} bloqueadas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, trend }) {
  return (
    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F7F0] text-2xl text-[#005643]">
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-[#475569]">
            {title}
          </p>

          <strong className="mt-2 block text-4xl font-black text-[#0F172A]">
            {value}
          </strong>

          <p className="mt-3 text-sm font-semibold text-[#64748B]">
            {trend} ↗
          </p>
        </div>
      </div>
    </div>
  )
}

function LegendRow({ label, value, dot }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${dot}`} />
        <span className="font-bold text-[#334155]">{label}</span>
      </div>

      <strong className="font-black text-[#0F172A]">
        {value}
      </strong>
    </div>
  )
}

function ActivityItem({ title, subtitle, time }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6F7F0] text-lg font-black text-[#005643]">
        ✓
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black text-[#0F172A]">
          {title}
        </p>

        <p className="mt-1 text-sm font-semibold text-[#64748B]">
          {subtitle}
        </p>
      </div>

      <span className="text-xs font-bold text-[#64748B]">
        {time}
      </span>
    </div>
  )
}

function TaskItem({ title, subtitle, date }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 h-6 w-6 rounded-md border border-[#CBD5E1]" />

      <div className="flex-1">
        <p className="font-black text-[#0F172A]">
          {title}
        </p>

        <p className="mt-1 text-sm font-semibold text-[#64748B]">
          {subtitle}
        </p>
      </div>

      <span className="text-sm font-black text-[#EF4444]">
        {date}
      </span>
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