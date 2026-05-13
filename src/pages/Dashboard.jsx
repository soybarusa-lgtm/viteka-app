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

  const pendingTasks = checklists.reduce(
    (total, checklist) => total + (checklist.stats?.pending || 0),
    0
  )

  const globalProgress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0

  const recentChecklists = checklists.slice(0, 6)
  const recentProjects = projects.slice(0, 5)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-[#E5F3EC] px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#005643]">
            Plataforma operativa
          </span>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#052E26]">
            Dashboard técnico
          </h1>

          <p className="mt-2 text-base font-medium text-[#6E8B7B]">
            Control de clientes, proyectos, checklists y progreso operativo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <StatCard
          icon="👥"
          title="Clientes"
          value={clients.length}
          subtitle="Total registrados"
        />

        <StatCard
          icon="▣"
          title="Proyectos activos"
          value={activeProjects.length}
          subtitle={`${projects.length} proyectos totales`}
        />

        <StatCard
          icon="✓"
          title="Checklists activos"
          value={activeChecklists.length}
          subtitle={`${completedChecklists.length} finalizados`}
        />

        <StatCard
          icon="📄"
          title="Plantillas"
          value={templates.length}
          subtitle="Disponibles"
        />

        <StatCard
          icon="◎"
          title="Progreso global"
          value={`${globalProgress}%`}
          subtitle="Tareas completadas"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-[#DCE7E1] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-[#052E26]">
              Progreso global de checklists
            </h2>

            <p className="mt-1 text-sm font-medium text-[#6E8B7B]">
              Porcentaje de tareas completadas en todas las ejecuciones.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] lg:items-center">
            <div className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-[#E5EFEA]">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#005643 ${globalProgress * 3.6}deg, #E5EFEA 0deg)`,
                }}
              />

              <div className="relative flex h-44 w-44 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <strong className="text-5xl font-black text-[#052E26]">
                  {globalProgress}%
                </strong>

                <span className="mt-1 text-sm font-bold text-[#6E8B7B]">
                  Completado
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <ProgressRow
                label="Completadas"
                value={completedTasks}
                dot="bg-[#005643]"
              />

              <ProgressRow
                label="Pendientes / en curso"
                value={pendingTasks}
                dot="bg-[#F59E0B]"
              />

              <ProgressRow
                label="Bloqueadas"
                value={blockedTasks}
                dot="bg-[#EF4444]"
              />

              <ProgressRow
                label="Total de tareas"
                value={totalTasks}
                dot="bg-[#94A3B8]"
              />

              <div className="mt-6 rounded-2xl bg-[#E5F3EC] px-5 py-4 text-sm font-extrabold text-[#005643]">
                Total de tareas: {totalTasks}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#DCE7E1] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-[#052E26]">
              Actividad reciente
            </h2>

            <span className="rounded-full bg-[#E5F3EC] px-3 py-1 text-xs font-extrabold text-[#005643]">
              En vivo
            </span>
          </div>

          {recentChecklists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCE7E1] p-8 text-center font-medium text-[#8AAA96]">
              No hay actividad registrada todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {recentChecklists.map(checklist => (
                <ActivityItem
                  key={checklist.id}
                  title={checklist.title}
                  subtitle={`Proyecto: ${checklist.projects?.name || 'Sin proyecto'}`}
                  status={checklist.status}
                  progress={checklist.stats?.progress || 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-[#DCE7E1] bg-white shadow-sm">
          <div className="border-b border-[#DCE7E1] px-6 py-5">
            <h2 className="text-xl font-black text-[#052E26]">
              Ejecuciones recientes
            </h2>
          </div>

          {recentChecklists.length === 0 ? (
            <div className="px-6 py-10 text-[#8AAA96]">
              No hay ejecuciones todavía.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[#EEF4F0] text-xs font-black uppercase tracking-wide text-[#6E8B7B]">
                    <th className="px-6 py-4">
                      Título
                    </th>

                    <th className="px-6 py-4">
                      Proyecto
                    </th>

                    <th className="px-6 py-4">
                      Estado
                    </th>

                    <th className="px-6 py-4">
                      Progreso
                    </th>

                    <th className="px-6 py-4">
                      Tareas
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentChecklists.map(checklist => (
                    <tr
                      key={checklist.id}
                      className="border-b border-[#EEF4F0]"
                    >
                      <td className="px-6 py-5 font-extrabold text-[#052E26]">
                        {checklist.title}
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-[#6E8B7B]">
                        {checklist.projects?.name || 'Sin proyecto'}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={checklist.status} blocked={checklist.stats?.blocked || 0} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-[#E5EFEA]">
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

                          <span className="text-sm font-extrabold">
                            {checklist.stats?.progress || 0}%
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm font-bold text-[#6E8B7B]">
                        {checklist.stats?.completed || 0} / {checklist.stats?.total || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[#DCE7E1] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-[#052E26]">
              Estado operativo
            </h2>

            <div className="mt-5 space-y-3">
              <SystemIndicator label="Supabase" status="online" />
              <SystemIndicator label="Autenticación" status="online" />
              <SystemIndicator label="Storage evidencias" status="online" />
              <SystemIndicator label="Frontend" status="online" />
            </div>
          </div>

          <div className="rounded-3xl bg-[#005643] p-6 text-white shadow-sm">
            <h2 className="text-xl font-black">
              Estado del producto
            </h2>

            <p className="mt-3 text-sm font-medium leading-relaxed text-white/80">
              El MVP ya cubre clientes, proyectos, plantillas, ejecuciones técnicas, evidencias y progreso operativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="rounded-3xl border border-[#DCE7E1] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F3EC] text-2xl">
          {icon}
        </div>

        <span className="rounded-full bg-[#F7FAF8] px-3 py-1 text-xs font-bold text-[#6E8B7B]">
          KPI
        </span>
      </div>

      <p className="mt-5 text-sm font-bold text-[#6E8B7B]">
        {title}
      </p>

      <strong className="mt-1 block text-4xl font-black text-[#052E26]">
        {value}
      </strong>

      <p className="mt-3 text-sm font-medium text-[#8AAA96]">
        {subtitle}
      </p>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  dot,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#EEF4F0] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${dot}`} />

        <span className="font-bold text-[#052E26]">
          {label}
        </span>
      </div>

      <strong className="font-black">
        {value}
      </strong>
    </div>
  )
}

function ActivityItem({
  title,
  subtitle,
  status,
  progress,
}) {
  return (
    <div className="rounded-2xl border border-[#EEF4F0] p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5F3EC] font-black text-[#005643]">
          ✓
        </div>

        <div className="flex-1">
          <p className="font-extrabold text-[#052E26]">
            {title}
          </p>

          <p className="mt-1 text-sm font-medium text-[#6E8B7B]">
            {subtitle}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <StatusBadge status={status} />

            <span className="text-xs font-bold text-[#8AAA96]">
              {progress}% completado
            </span>
          </div>
        </div>
      </div>
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
      <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-black text-[#166534]">
        Completado
      </span>
    )
  }

  return (
    <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-black text-[#92400E]">
      En progreso
    </span>
  )
}

function SystemIndicator({
  label,
  status,
}) {
  const isOnline = status === 'online'

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#EEF4F0] p-4">
      <span className="font-extrabold text-[#052E26]">
        {label}
      </span>

      <span
        className={
          isOnline
            ? 'rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-black text-[#166534]'
            : 'rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-black text-[#B91C1C]'
        }
      >
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  )
}