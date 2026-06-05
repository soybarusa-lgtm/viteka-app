import { PencilSquareIcon, TrashIcon, PowerIcon } from '@heroicons/react/24/outline'
import RoleBadge from './RoleBadge'

function formatDate(value) {
  if (!value) return 'Sin acceso'
  return new Date(value).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function EquipoVitekaTable({ members, onEdit, onToggleActive, onDelete, canEdit, canDelete }) {
  if (!members.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-bold text-slate-700">No hay personas internas registradas</p>
        <p className="mt-1 text-xs text-slate-400">Crea el primer usuario operativo del equipo Viteka.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Ultimo acceso</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-bold text-slate-900">{member.full_name}</td>
                <td className="px-4 py-3 text-teal-700">{member.email}</td>
                <td className="px-4 py-3"><RoleBadge role={member.role} /></td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {member.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(member.last_login_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" disabled={!canEdit(member)} onClick={() => onEdit(member)} className="rounded-lg p-2 text-slate-500 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-30" title="Editar">
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={!canEdit(member)} onClick={() => onToggleActive(member)} className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-30" title={member.is_active ? 'Desactivar' : 'Activar'}>
                      <PowerIcon className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={!canDelete(member)} onClick={() => onDelete(member)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" title="Borrar">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
