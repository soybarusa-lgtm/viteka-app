import { mapInternalStatusToClientStatus } from './supportStatus'
import { MOCK_SUPPORT_MESSAGES, MOCK_SUPPORT_TICKETS } from './supportMockData'

const STORE_KEY = 'viteka-support-mock-store-v1'

function readStore() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORE_KEY))
    if (stored?.tickets && stored?.messages) return stored
  } catch {
    // Fall back to pristine demo data if browser storage is unavailable.
  }
  return { tickets: MOCK_SUPPORT_TICKETS, messages: MOCK_SUPPORT_MESSAGES }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    // The in-memory experience remains usable if storage is disabled.
  }
  return store
}

export function listMockTickets() {
  return readStore().tickets
}

export function listMockMessages(ticketId, includePrivate = true) {
  return readStore().messages.filter(message => message.ticket_id === ticketId && (includePrivate || !message.is_private_note))
}

export function createMockTicket(profile, payload) {
  const store = readStore()
  const nextNumber = Math.max(...store.tickets.map(ticket => ticket.public_ticket_number), 1000) + 1
  const ticket = {
    id: `ticket-${crypto.randomUUID()}`,
    public_ticket_number: nextNumber,
    company_id: profile?.company_id || null,
    pharmacy_id: profile?.pharmacy_id || 'pharmacy-benahadux',
    pharmacy_name: profile?.pharmacy_name || 'Farmacia del cliente',
    requester_name: profile?.full_name || profile?.email || 'Cliente',
    requester_profile_id: profile?.id || null,
    subject: payload.subject,
    description: payload.description,
    type: payload.type,
    product: payload.product,
    priority_client: payload.priority,
    priority_internal: payload.priority,
    source: 'portal_cliente',
    internal_status: 'nuevo',
    client_status: 'abierto',
    group_name: '',
    assigned_agent_name: '',
    attachments: (payload.files || []).map(file => ({ file_name: file.name, file_size: file.size })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  const message = {
    id: `message-${crypto.randomUUID()}`,
    ticket_id: ticket.id,
    author_profile_id: profile?.id || null,
    author_name: ticket.requester_name,
    author_type: 'client',
    body: payload.description,
    is_private_note: false,
    created_at: ticket.created_at,
  }
  writeStore({ tickets: [ticket, ...store.tickets], messages: [...store.messages, message] })
  return ticket
}

export function updateMockTicket(ticketId, changes) {
  const store = readStore()
  const tickets = store.tickets.map(ticket => ticket.id === ticketId
    ? {
        ...ticket,
        ...changes,
        client_status: changes.internal_status ? mapInternalStatusToClientStatus(changes.internal_status) : ticket.client_status,
        updated_at: new Date().toISOString(),
      }
    : ticket)
  writeStore({ ...store, tickets })
  return tickets.find(ticket => ticket.id === ticketId)
}

export function addMockMessage(ticketId, profile, body, isPrivateNote = false) {
  const store = readStore()
  const message = {
    id: `message-${crypto.randomUUID()}`,
    ticket_id: ticketId,
    author_profile_id: profile?.id || null,
    author_name: profile?.full_name || profile?.email || (isPrivateNote ? 'Equipo Viteka' : 'Cliente'),
    author_type: isPrivateNote ? 'agent' : profile?.role === 'client' ? 'client' : 'agent',
    body,
    is_private_note: isPrivateNote,
    created_at: new Date().toISOString(),
  }
  writeStore({ tickets: store.tickets.map(ticket => ticket.id === ticketId ? { ...ticket, updated_at: message.created_at } : ticket), messages: [...store.messages, message] })
  return message
}
