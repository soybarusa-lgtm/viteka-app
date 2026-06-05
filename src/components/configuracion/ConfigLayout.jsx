import { Outlet } from 'react-router-dom'
import ConfigTabs from './ConfigTabs'

export default function ConfigLayout() {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="px-4 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950">Configuracion</h1>
              <p className="mt-1 text-sm text-slate-500">Parametros globales, equipo interno, contrasenas, portal cliente, permisos y auditoria de Viteka.</p>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-teal-800 ring-1 ring-teal-100">
              Solo owner y administrador
            </span>
          </div>
        </div>
        <div className="px-4 md:px-6">
          <ConfigTabs />
        </div>
      </header>
      <main className="px-4 py-5 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
