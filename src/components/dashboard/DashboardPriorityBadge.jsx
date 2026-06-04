import { getPriorityMeta, priorityToneClasses } from '../../lib/operationalDashboardStatus'

export default function DashboardPriorityBadge({ priority, label }) {
  const meta = getPriorityMeta(priority)
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold leading-none ring-1 ${priorityToneClasses(meta.tone)}`}>
      {label || meta.label}
    </span>
  )
}
