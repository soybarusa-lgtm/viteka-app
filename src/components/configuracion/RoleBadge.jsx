import { ROLE_LABELS, normalizeRole } from '../../lib/permissions'

const TONES = {
  owner: 'bg-teal-700 text-white',
  administrador: 'bg-teal-50 text-teal-800 ring-1 ring-teal-100',
  soporte: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  administracion: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
}

export default function RoleBadge({ role }) {
  const normalized = normalizeRole(role)
  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ${TONES[normalized] || 'bg-slate-100 text-slate-600'}`}>
      {ROLE_LABELS[normalized] || role || 'Sin rol'}
    </span>
  )
}
