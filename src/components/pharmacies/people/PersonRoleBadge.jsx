export default function PersonRoleBadge({ role, isResponsible, isIncomplete }) {
  const normalizedRole = String(role || 'Sin rol').toLowerCase()

  let className = 'bg-slate-100 text-slate-600'
  if (normalizedRole.includes('titular')) className = 'bg-teal-50 text-teal-700'
  else if (normalizedRole.includes('adjunto')) className = 'bg-blue-50 text-blue-700'
  else if (isResponsible) className = 'bg-emerald-50 text-emerald-700'
  else if (isIncomplete) className = 'bg-orange-50 text-orange-700'

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {role || 'Sin rol'}
    </span>
  )
}
