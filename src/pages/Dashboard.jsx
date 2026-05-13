export default function Dashboard({
  clients = [],
  projects = [],
  templates = [],
  checklists = [],
}) {
  const activeProjects = projects.filter(project => project.status === 'active')
  const completedProjects = projects.filter(project => project.status === 'completed')
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

  const blockedTasks = checklists.reduce(
    (total, checklist) => total + (checklist.stats?.blocked || 0),
    0
  )

  const globalProgress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Dashboard
        </h1>

        <p className="mt-2 text-[#8AAA96] font-medium">
          Resumen general de la plataforma técnica.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Clientes"
          value={clients.length}
          subtitle="Clientes registrados"
        />

        <StatCard
          title="Proyectos activos"
          value={activeProjects.length}
          subtitle={`${completedProjects.length} completados`}
        />

        <StatCard
          title="Checklists activos"
          value={activeChecklists.length}
          subtitle={`${completedChecklists.length} finalizados`}
        />

        <StatCard
          title="Plantillas"
          value={templates.length}
          subtitle="Plantillas disponibles"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Tareas totales" value={totalTasks} />
        <KpiCard title="Tareas completadas" value={completedTasks} />
        <KpiCard title="Tareas bloqueadas" value={blockedTasks} />
        <KpiCard title="Progreso global" value={`${globalProgress}%`} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white border border-[#DCE7E1] shadow-sm overflow-hidden">
          <div className="border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4">
            <h2 className="font-extrabold text-[#005643]">
              Checklists recientes
            </h2>
          </div>

          {checklists.length === 0 ? (
            <div className="px-6 py-8 text-[#8AAA96]">
              No hay checklists todavía.
            </div>
          ) : (
            checklists.slice(0, 5).map(checklist => (
              <div
                key={checklist.id}
                className="border-b border-[#EEF4F0] px-6 py-5"
              >
                <p className="font-bold">
                  {checklist.title}
                </p>

                <p className="mt-1 text-sm text-[#6E8B7B]">
                  Proyecto: {checklist.projects?.name || 'Sin proyecto'}
                </p>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#4A6B58]">
                    <span>Progreso</span>
                    <span>{checklist.stats?.progress || 0}%</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#E5EFEA]">
                    <div
                      className={
                        (checklist.stats?.blocked || 0) > 0
                          ? 'h-full rounded-full bg-[#B91C1C]'
                          : 'h-full rounded-full bg-[#005643]'
                      }
                      style={{
                        width: `${checklist.stats?.progress || 0}%`,
                      }}
                    />
                  </div>
                </div>

                <ChecklistStatusBadge status={checklist.status} />
              </div>
            ))
          )}
        </div>

        <div className="rounded-2xl bg-white border border-[#DCE7E1] shadow-sm overflow-hidden">
          <div className="border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4">
            <h2 className="font-extrabold text-[#005643]">
              Estado operativo
            </h2>
          </div>

          <div className="space-y-4 p-6">
            <SystemIndicator label="Supabase" status="online" />
            <SystemIndicator label="Autenticación" status="online" />
            <SystemIndicator label="Storage evidencias" status="online" />
            <SystemIndicator label="Frontend" status="online" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl bg-white border border-[#DCE7E1] p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8AAA96]">
        {title}
      </p>

      <strong className="mt-3 block text-4xl font-extrabold">
        {value}
      </strong>

      <p className="mt-2 text-sm text-[#8AAA96]">
        {subtitle}
      </p>
    </div>
  )
}

function KpiCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-[#005643] p-6 text-white shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-white/70">
        {title}
      </p>

      <strong className="mt-3 block text-4xl font-extrabold">
        {value}
      </strong>
    </div>
  )
}

function ChecklistStatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="mt-3 inline-block rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#166534]">
        Finalizado
      </span>
    )
  }

  return (
    <span className="mt-3 inline-block rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-bold text-[#92400E]">
      En curso
    </span>
  )
}

function SystemIndicator({ label, status }) {
  const isOnline = status === 'online'

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#EEF4F0] p-4">
      <span className="font-bold text-[#4A6B58]">
        {label}
      </span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          isOnline
            ? 'bg-[#DCFCE7] text-[#166534]'
            : 'bg-[#FEE2E2] text-[#B91C1C]'
        }`}
      >
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  )
}