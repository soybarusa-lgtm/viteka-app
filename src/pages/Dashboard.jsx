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
    <div className="relative overflow-hidden pb-20">
      <div className="relative z-10">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
              Dashboard
            </h1>

            <p className="mt-4 text-base text-[#64748B] font-normal">
              Resumen general de tu actividad técnica.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-normal text-[#334155] shadow-sm hover:bg-[#F8FAFC]"
            >
              📅 Este mes
            </button>

            <button
              type="button"
              className="rounded-2xl bg-[#ECFDF5] px-5 py-3 text-sm font-medium text-[#047857] shadow-sm hover:bg-[#D1FAE5]"
            >
              ↗ Ver informes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <StatCard
            icon="▣"
            title="Proyectos activos"
            value={activeProjects.length}
            trend="+2 este mes"
            tone="green"
          />

          <StatCard
            icon="◎"
            title="Clientes"
            value={clients.length}
            trend="+1 este mes"
            tone="green"
          />

          <StatCard
            icon="✓"
            title="Checklists completados"
            value={`${globalProgress}%`}
            trend="+8% este mes"
            tone="green"
          />

          <StatCard
            icon="≣"
            title="Informes generados"
            value={completedChecklists.length || templates.length}
            trend="+6 este mes"
            tone="green"
          />
        </div>

        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-3xl tracking-[-0.035em] text-[#0F172A] font-medium">
              Actividad de proyectos
            </h2>

            <button
              type="button"
              className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-normal text-[#334155] shadow-sm"
            >
              Este mes
            </button>
          </div>

          <div className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <div className="absolute inset-x-8 top-16 border-t border-[#EEF2F7]" />
            <div className="absolute inset-x-8 top-32 border-t border-[#EEF2F7]" />
            <div className="absolute inset-x-8 top-48 border-t border-[#EEF2F7]" />
            <div className="absolute inset-x-8 top-64 border-t border-[#EEF2F7]" />

            {recentProjects.length === 0 ? (
              <div className="relative z-10 flex min-h-[360px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F5F9] text-[#0F766E]">
                    ↗
                  </div>

                  <h3 className="mt-6 text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
                    No hay actividad registrada
                  </h3>

                  <p className="mt-3 text-base text-[#64748B] font-normal">
                    Aún no hay actividad de proyectos para el periodo seleccionado.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 h-[360px]">
                <svg
                  viewBox="0 0 900 360"
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="areaGradientSoft" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity="0.23" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M0 300 C90 250, 170 210, 260 230 C350 250, 420 160, 510 170 C600 180, 680 110, 760 95 C820 84, 860 76, 900 62 L900 360 L0 360 Z"
                    fill="url(#areaGradientSoft)"
                  />

                  <path
                    d="M0 300 C90 250, 170 210, 260 230 C350 250, 420 160, 510 170 C600 180, 680 110, 760 95 C820 84, 860 76, 900 62"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white/90 px-6 py-4 text-center shadow-sm">
                  <p className="text-2xl text-[#0F172A] font-medium">
                    {activeProjects.length}
                  </p>

                  <p className="mt-1 text-sm text-[#64748B] font-normal">
                    Proyectos activos
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-7 2xl:grid-cols-[1fr_420px]">
          <div className="rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-7 py-6">
              <h2 className="text-2xl tracking-[-0.025em] text-[#0F172A] font-medium">
                Proyectos recientes
              </h2>

              <button
                type="button"
                className="text-sm font-medium text-[#047857]"
              >
                Ver todos
              </button>
            </div>

            {recentProjects.length === 0 ? (
              <div className="px-7 py-10 text-sm text-[#64748B] font-normal">
                No hay proyectos todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] text-xs uppercase tracking-wide text-[#64748B] font-medium">
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
                        <td className="px-7 py-5 text-[#0F172A] font-medium">
                          {project.name}
                        </td>

                        <td className="px-7 py-5 text-sm text-[#64748B] font-normal">
                          {project.clients?.name || 'Sin cliente'}
                        </td>

                        <td className="px-7 py-5">
                          <StatusBadge status={project.status} />
                        </td>

                        <td className="px-7 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-32 overflow-hidden rounded-full bg-[#E2E8F0]">
                              <div
                                className="h-full rounded-full bg-[#059669]"
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

                            <span className="text-sm text-[#334155] font-normal">
                              {project.status === 'completed'
                                ? '100%'
                                : project.status === 'active'
                                  ? '75%'
                                  : '35%'}
                            </span>
                          </div>
                        </td>

                        <td className="px-7 py-5 text-sm text-[#64748B] font-normal">
                          Hace 1 día
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl tracking-[-0.025em] text-[#0F172A] font-medium">
                Tareas pendientes
              </h2>

              <button
                type="button"
                className="text-sm font-medium text-[#047857]"
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

              <p className="pt-2 text-sm text-[#047857] font-medium">
                + {pendingTasks} tareas pendientes · {blockedTasks} bloqueadas
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-7 2xl:grid-cols-[400px_1fr]">
          <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <h2 className="text-2xl tracking-[-0.025em] text-[#0F172A] font-medium">
              Proyectos por estado
            </h2>

            <div className="mt-8 flex justify-center">
              <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-[#E2E8F0]">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(#059669 0deg 210deg, #86EFAC 210deg 300deg, #FBBF24 300deg 340deg, #EF4444 340deg 360deg)',
                  }}
                />

                <div className="relative h-30 w-30 rounded-full bg-white" />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <LegendRow label="Activos" value={activeProjects.length} dot="bg-[#059669]" />
              <LegendRow label="Completados" value={completedProjects.length} dot="bg-[#86EFAC]" />
              <LegendRow label="En revisión" value={draftProjects.length} dot="bg-[#FBBF24]" />
              <LegendRow label="Cancelados" value={cancelledProjects.length} dot="bg-[#EF4444]" />
            </div>
          </div>

          <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl tracking-[-0.025em] text-[#0F172A] font-medium">
                Actividad reciente
              </h2>

              <button
                type="button"
                className="text-sm font-medium text-[#047857]"
              >
                Ver todo
              </button>
            </div>

            {recentChecklists.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E2E8F0] p-8 text-center text-sm text-[#64748B] font-normal">
                No hay actividad registrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
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
      </div>

      <svg
        className="pointer-events-none absolute bottom-[-80px] right-[-80px] z-0 w-[55%] opacity-90"
        viewBox="0 0 800 240"
        fill="none"
      >
        <path
          d="M0 190C90 140 160 100 250 125C350 154 410 92 500 74C600 54 650 115 730 82C765 68 790 50 800 42V240H0V190Z"
          fill="#DDF7EE"
        />

        <path
          d="M0 190C90 140 160 100 250 125C350 154 410 92 500 74C600 54 650 115 730 82C765 68 790 50 800 42"
          stroke="#059669"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  trend,
  tone = 'green',
}) {
  const toneClass = {
    green: 'bg-[#ECFDF5] text-[#059669]',
    purple: 'bg-[#EEF2FF] text-[#4F46E5]',
    indigo: 'bg-[#F5F3FF] text-[#6366F1]',
  }

  return (
    <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-6">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] text-3xl ${toneClass[tone]}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-base text-[#475569] font-normal">
            {title}
          </p>

          <strong className="mt-2 block text-5xl leading-none tracking-[-0.045em] text-[#0F172A] font-medium">
            {value}
          </strong>

          <p className="mt-4 text-base text-[#16A34A] font-normal">
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
        <span className="text-[#334155] font-normal">{label}</span>
      </div>

      <strong className="text-[#0F172A] font-medium">
        {value}
      </strong>
    </div>
  )
}

function ActivityItem({ title, subtitle, time }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-[#F1F5F9] p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] text-lg text-[#059669] font-medium">
        ✓
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[#0F172A] font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm text-[#64748B] font-normal">
          {subtitle}
        </p>
      </div>

      <span className="text-xs text-[#64748B] font-normal">
        {time}
      </span>
    </div>
  )
}

function TaskItem({ title, subtitle, date }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 h-5 w-5 rounded-md border border-[#CBD5E1]" />

      <div className="flex-1">
        <p className="text-[#0F172A] font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm text-[#64748B] font-normal">
          {subtitle}
        </p>
      </div>

      <span className="text-sm text-[#EF4444] font-normal">
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
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${current.className}`}>
      {current.label}
    </span>
  )
}