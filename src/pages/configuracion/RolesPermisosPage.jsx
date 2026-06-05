import PermissionMatrix from '../../components/configuracion/PermissionMatrix'

export default function RolesPermisosPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-950">Roles y permisos</h2>
        <p className="mt-1 text-sm text-slate-500">Matriz de acceso para mantener clara la jerarquia operativa de la aplicacion.</p>
      </div>
      <PermissionMatrix />
    </div>
  )
}
