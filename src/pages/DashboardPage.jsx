import { useMemo, useState } from 'react'
import { ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline'
import DashboardPendingList from '../components/dashboard/DashboardPendingList'
import DashboardStatusChart from '../components/dashboard/DashboardStatusChart'
import { useOperationalDashboard } from '../hooks/useOperationalDashboard'
import { normalizeKey } from '../lib/operationalDashboardStatus'

function formatUpdateTime(value) {
  if (!value) return '--:--'
  return value.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function filterByStatus(items, status) {
  if (!status) return items
  return items.filter(item => normalizeKey(item.status) === status)
}

export default function DashboardPage() {
  const {
    loading,
    warning,
    lastUpdated,
    taskStatusChart,
    supportStatusChart,
    myPendingTasks,
    generalPendingTasks,
    myPendingSupport,
    generalPendingSupport,
    reload,
  } = useOperationalDashboard()

  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [supportStatusFilter, setSupportStatusFilter] = useState('')

  const filteredTasks = useMemo(() => ({
    mine: filterByStatus(myPendingTasks, taskStatusFilter),
    general: filterByStatus(generalPendingTasks, taskStatusFilter),
  }), [generalPendingTasks, myPendingTasks, taskStatusFilter])

  const filteredSupport = useMemo(() => ({
    mine: filterByStatus(myPendingSupport, supportStatusFilter),
    general: filterByStatus(generalPendingSupport, supportStatusFilter),
  }), [generalPendingSupport, myPendingSupport, supportStatusFilter])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-wrapper space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl border border-teal-900/10 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Centro operativo</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-950 sm:text-3xl">Dashboard operativo</h1>
          <p className="mt-1 text-sm text-slate-500">Resumen de tareas y soporte pendiente</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <button type="button" onClick={reload} className="btn-primary">
            <ArrowPathIcon className="h-4 w-4" /> Actualizar
          </button>
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <ClockIcon className="h-4 w-4" /> Última actualización: {formatUpdateTime(lastUpdated)}
          </p>
        </div>
      </header>

      {warning && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warning}
        </p>
      )}

      {(taskStatusFilter || supportStatusFilter) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-bold text-slate-800">Filtro activo:</span>
          {taskStatusFilter && <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">Tareas · {taskStatusFilter}</span>}
          {supportStatusFilter && <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">Soporte · {supportStatusFilter}</span>}
          <button type="button" onClick={() => { setTaskStatusFilter(''); setSupportStatusFilter('') }} className="ml-auto text-xs font-bold text-teal-700 hover:underline">Limpiar filtros</button>
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardStatusChart
          title="Tareas por estado"
          items={taskStatusChart}
          activeStatus={taskStatusFilter}
          onStatusClick={status => setTaskStatusFilter(current => current === status ? '' : status)}
          onClear={() => setTaskStatusFilter('')}
        />
        <DashboardStatusChart
          title="Soporte por estado"
          items={supportStatusChart}
          activeStatus={supportStatusFilter}
          onStatusClick={status => setSupportStatusFilter(current => current === status ? '' : status)}
          onClear={() => setSupportStatusFilter('')}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPendingList
          title="Mis tareas pendientes"
          items={filteredTasks.mine}
          type="task"
          emptyText="No tienes tareas pendientes con el filtro actual."
        />
        <DashboardPendingList
          title="Mi soporte pendiente"
          items={filteredSupport.mine}
          type="support"
          emptyText="No tienes soporte pendiente con el filtro actual."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPendingList
          title="Tareas pendientes generales"
          items={filteredTasks.general}
          type="task"
          showAssignee
          emptyText="No hay tareas generales pendientes con el filtro actual."
        />
        <DashboardPendingList
          title="Soporte pendiente general"
          items={filteredSupport.general}
          type="support"
          showAssignee
          emptyText="No hay soporte general pendiente con el filtro actual."
        />
      </section>
    </div>
  )
}
