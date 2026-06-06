import { CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function ProjectNextSteps({ steps = [] }) {
  return (
    <section className="rounded-2xl border border-[#DDEAE7] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-500">
          <CalendarDaysIcon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#071A1D]">Próximos pasos</h3>
          <p className="text-xs text-slate-500">Seguimiento inmediato de la farmacia</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {steps.length > 0 ? steps.map(step => (
          <div key={`${step.projectId}-${step.date}-${step.action}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-xs font-semibold text-teal-700">{step.date || 'Sin fecha'}</p>
            <p className="mt-1 text-sm font-semibold text-[#071A1D]">{step.action}</p>
            <p className="mt-1 text-xs text-slate-500">{step.projectName}</p>
          </div>
        )) : (
          <div className="rounded-xl border border-dashed border-[#DDEAE7] bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
            No hay próximos pasos pendientes.
          </div>
        )}
      </div>
    </section>
  )
}
