import { useMemo, useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import DashboardCompactList from '../components/dashboard/DashboardCompactList'
import DashboardStatusSummary from '../components/dashboard/DashboardStatusSummary'
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

function filterLabel(items, status) {
  return items.find(item => item.key === status)?.label || status
}

export default function DashboardPage() {
  const {
    loading,
    warning,
    lastUpdated,
    taskStatusSummary,
    supportStatusSummary,
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
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="page-wrapper space-y-3">
      <header className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-extrabold text-slate-950 sm:text-2xl">Dashboard operativo</h1>
          <p className="mt-0.5 text-xs text-slate-500">Pendientes de tareas y soporte</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-slate-400">Actualizado {formatUpdateTime(lastUpdated)}</p>
          <button type="button" onClick={reload} className="btn-primary !px-3 !py-2 !text-xs">
            <ArrowPathIcon className="h-3.5 w-3.5" /> Actualizar
          </button>
        </div>
      </header>

      {warning && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Algunos datos no se pudieron cargar.
        </p>
      )}

      {(taskStatusFilter || supportStatusFilter) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
          {taskStatusFilter && <span>Filtro tareas: <strong className="text-slate-800">{filterLabel(taskStatusSummary, taskStatusFilter)}</strong></span>}
          {supportStatusFilter && <span>Filtro soporte: <strong className="text-slate-800">{filterLabel(supportStatusSummary, supportStatusFilter)}</strong></span>}
          <button type="button" onClick={() => { setTaskStatusFilter(''); setSupportStatusFilter('') }} className="font-bold text-teal-700 hover:underline">Limpiar</button>
        </div>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <DashboardStatusSummary
          title="Tareas por estado"
          items={taskStatusSummary}
          activeStatus={taskStatusFilter}
          onStatusClick={status => setTaskStatusFilter(current => current === status ? '' : status)}
          onClear={() => setTaskStatusFilter('')}
        />
        <DashboardStatusSummary
          title="Soporte por estado"
          items={supportStatusSummary}
          activeStatus={supportStatusFilter}
          onStatusClick={status => setSupportStatusFilter(current => current === status ? '' : status)}
          onClear={() => setSupportStatusFilter('')}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardCompactList
          title="Mis tareas pendientes"
          items={filteredTasks.mine}
          type="task"
          emptyText="No tienes tareas pendientes."
        />
        <DashboardCompactList
          title="Mi soporte pendiente"
          items={filteredSupport.mine}
          type="support"
          emptyText="No tienes soporte pendiente."
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <DashboardCompactList
          title="Tareas pendientes generales"
          items={filteredTasks.general}
          type="task"
          emptyText="No hay tareas generales pendientes."
        />
        <DashboardCompactList
          title="Soporte pendiente general"
          items={filteredSupport.general}
          type="support"
          emptyText="No hay soporte general pendiente."
        />
      </section>
    </div>
  )
}
