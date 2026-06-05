import { CheckIcon, MinusIcon } from '@heroicons/react/24/outline'
import { PERMISSIONS, ROLE_LABELS, ROLES, hasPermission } from '../../lib/permissions'
import RoleBadge from './RoleBadge'

const COLUMNS = [
  ['Configuracion', PERMISSIONS.CONFIG_VIEW],
  ['Equipo Viteka', PERMISSIONS.TEAM_MANAGE],
  ['Farmacias', PERMISSIONS.FARMACIAS_MANAGE],
  ['Soporte', PERMISSIONS.SUPPORT_MANAGE],
  ['Administracion', PERMISSIONS.ADMINISTRATION_MANAGE],
  ['Proyectos', PERMISSIONS.PROJECTS_MANAGE],
  ['Documentos', PERMISSIONS.DOCUMENTS_MANAGE],
  ['Auditoria', PERMISSIONS.AUDIT_VIEW],
]

export default function PermissionMatrix() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Rol</th>
              {COLUMNS.map(([label]) => <th key={label} className="px-4 py-3 text-center">{label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.values(ROLES).map(role => (
              <tr key={role}>
                <td className="px-4 py-3">
                  <RoleBadge role={role} />
                  <p className="mt-1 text-xs text-slate-400">{ROLE_LABELS[role]}</p>
                </td>
                {COLUMNS.map(([label, permission]) => {
                  const allowed = hasPermission({ role }, permission)
                  return (
                    <td key={`${role}-${label}`} className="px-4 py-3 text-center">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${allowed ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-300'}`}>
                        {allowed ? <CheckIcon className="h-4 w-4" /> : <MinusIcon className="h-4 w-4" />}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
