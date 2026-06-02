import { useMemo } from 'react'

export function useSupportStats(tickets) {
  return useMemo(() => {
    const total = tickets.length
    const isOpen = ticket => !['resuelto', 'cerrado', 'archivado'].includes(ticket.internal_status)
    const opened = tickets.filter(isOpen)
    const resolved = tickets.filter(ticket => ticket.internal_status === 'resuelto')
    const closed = tickets.filter(ticket => ticket.internal_status === 'cerrado')
    const unassigned = opened.filter(ticket => !ticket.assigned_agent_id && !ticket.assigned_agent_name)
    const waiting = opened.filter(ticket => ['esperando_cliente', 'esperando_proveedor'].includes(ticket.internal_status))
    const urgent = opened.filter(ticket => ticket.priority_internal === 'urgente')
    const byStatus = tickets.reduce((counts, ticket) => ({ ...counts, [ticket.internal_status]: (counts[ticket.internal_status] || 0) + 1 }), {})
    const byProduct = tickets.reduce((counts, ticket) => ({ ...counts, [ticket.product || 'Otros']: (counts[ticket.product || 'Otros'] || 0) + 1 }), {})
    return { total, opened, resolved, closed, unassigned, waiting, urgent, byStatus, byProduct }
  }, [tickets])
}
