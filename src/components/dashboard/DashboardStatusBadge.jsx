import { getStatusMeta, statusToneClasses } from '../../lib/operationalDashboardStatus'

export default function DashboardStatusBadge({ status, label }) {
  const meta = getStatusMeta(status)
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold leading-none ring-1 ${statusToneClasses(meta.tone)}`}>
      {label || meta.label}
    </span>
  )
}
