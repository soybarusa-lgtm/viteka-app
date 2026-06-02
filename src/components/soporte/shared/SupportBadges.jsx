import { CLIENT_STATUS_LABELS, INTERNAL_STATUS_LABELS, PRIORITY_LABELS, getPriorityBadgeClass, getStatusBadgeClass } from '../../../lib/supportStatus'

export function TicketStatusBadge({ status, client = false }) {
  const labels = client ? CLIENT_STATUS_LABELS : INTERNAL_STATUS_LABELS
  return <span className={getStatusBadgeClass(status)}>{labels[status] || status}</span>
}

export function TicketPriorityBadge({ priority }) {
  return <span className={getPriorityBadgeClass(priority)}>{PRIORITY_LABELS[priority] || priority}</span>
}
