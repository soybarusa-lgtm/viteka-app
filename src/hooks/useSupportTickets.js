import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { addMockMessage, createMockTicket, listMockMessages, listMockTickets, updateMockTicket } from '../lib/supportMockStore'
import { mapInternalStatusToClientStatus } from '../lib/supportStatus'

function isMissingTable(error) {
  return ['PGRST205', '42P01'].includes(error?.code) || error?.message?.includes('support_tickets')
}

function safeStorageName(name) {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z0-9._-]+/g, '-')
}

async function tryAudit(profile, action, entityId, newValues = null) {
  if (!profile?.id) return
  await supabase.from('support_audit_logs').insert({
    company_id: profile.company_id,
    entity_type: 'ticket',
    entity_id: entityId,
    action,
    changed_by: profile.id,
    new_values: newValues,
  }).catch(() => {})
}

export function useSupportTickets(profile, { clientOnly = false } = {}) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMocks, setUsingMocks] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false })
      if (clientOnly && profile?.pharmacy_id) query = query.eq('pharmacy_id', profile.pharmacy_id)
      const { data, error: queryError } = await query
      if (queryError) throw queryError
      setTickets(data || [])
      setUsingMocks(false)
    } catch (queryError) {
      if (!isMissingTable(queryError)) setError(queryError.message)
      console.warn('[support] Supabase todavía no tiene el módulo aplicado; se utilizan datos de demostración.', queryError.message)
      const demo = listMockTickets()
      setTickets(clientOnly && profile?.pharmacy_id ? demo.filter(ticket => ticket.pharmacy_id === profile.pharmacy_id) : demo)
      setUsingMocks(true)
    } finally {
      setLoading(false)
    }
  }, [clientOnly, profile])

  useEffect(() => {
    // Loading on mount intentionally synchronizes this hook with Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload()
  }, [reload])

  const createTicket = useCallback(async payload => {
    if (usingMocks) {
      const ticket = createMockTicket(profile, payload)
      await reload()
      return ticket
    }
    const ticketPayload = {
      company_id: profile?.company_id,
      pharmacy_id: profile?.pharmacy_id,
      requester_profile_id: profile?.id,
      subject: payload.subject,
      description: payload.description,
      type: payload.type,
      product: payload.product,
      priority_client: payload.priority,
      priority_internal: payload.priority,
      source: 'portal_cliente',
      status: 'nuevo',
      internal_status: 'nuevo',
      client_status: 'abierto',
    }
    const { data: ticket, error: ticketError } = await supabase.from('support_tickets').insert(ticketPayload).select().single()
    if (ticketError) throw ticketError
    const { data: message, error: messageError } = await supabase.from('support_ticket_messages').insert({
      ticket_id: ticket.id,
      author_profile_id: profile?.id,
      author_name: profile?.full_name || profile?.email || 'Cliente',
      author_type: 'client',
      body: payload.description,
      is_private_note: false,
    }).select().single()
    if (messageError) throw messageError
    for (const file of payload.files || []) {
      const filePath = `${profile.company_id}/${ticket.id}/${Date.now()}_${safeStorageName(file.name)}`
      const { error: uploadError } = await supabase.storage.from('support-attachments').upload(filePath, file)
      if (uploadError) throw uploadError
      const { error: attachmentError } = await supabase.from('support_ticket_attachments').insert({
        ticket_id: ticket.id,
        message_id: message.id,
        company_id: profile.company_id,
        pharmacy_id: profile.pharmacy_id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by_profile_id: profile.id,
      })
      if (attachmentError) throw attachmentError
    }
    await tryAudit(profile, 'ticket_created', ticket.id, ticket)
    await reload()
    return ticket
  }, [profile, reload, usingMocks])

  const getTicketById = useCallback(async ticketId => {
    if (usingMocks) return { ticket: listMockTickets().find(ticket => ticket.id === ticketId), messages: listMockMessages(ticketId, !clientOnly) }
    const [{ data: ticket, error: ticketError }, { data: messages, error: messagesError }, { data: attachments, error: attachmentsError }] = await Promise.all([
      supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle(),
      supabase.from('support_ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at'),
      supabase.from('support_ticket_attachments').select('*').eq('ticket_id', ticketId).order('created_at'),
    ])
    if (ticketError || messagesError || attachmentsError) throw ticketError || messagesError || attachmentsError
    return { ticket: { ...ticket, attachments: attachments || [] }, messages: clientOnly ? (messages || []).filter(message => !message.is_private_note) : messages || [] }
  }, [clientOnly, usingMocks])

  const updateTicket = useCallback(async (ticketId, changes) => {
    const safeChanges = changes.internal_status
      ? { ...changes, client_status: mapInternalStatusToClientStatus(changes.internal_status) }
      : changes
    if (usingMocks) {
      const ticket = updateMockTicket(ticketId, safeChanges)
      await reload()
      return ticket
    }
    const { data, error: updateError } = await supabase.from('support_tickets').update(safeChanges).eq('id', ticketId).select().single()
    if (updateError) throw updateError
    await tryAudit(profile, 'ticket_updated', ticketId, safeChanges)
    await reload()
    return data
  }, [profile, reload, usingMocks])

  const addMessage = useCallback(async (ticketId, body, isPrivateNote) => {
    if (usingMocks) return addMockMessage(ticketId, profile, body, isPrivateNote)
    const { data, error: messageError } = await supabase.from('support_ticket_messages').insert({
      ticket_id: ticketId,
      author_profile_id: profile?.id,
      author_name: profile?.full_name || profile?.email || 'Equipo Viteka',
      author_type: profile?.role === 'client' ? 'client' : 'agent',
      body,
      is_private_note: isPrivateNote,
    }).select().single()
    if (messageError) throw messageError
    await tryAudit(profile, isPrivateNote ? 'private_note_created' : 'public_reply_created', ticketId, data)
    return data
  }, [profile, usingMocks])

  return {
    tickets,
    loading,
    error,
    usingMocks,
    reload,
    createTicket,
    getTicketById,
    updateTicket,
    addPublicReply: (ticketId, body) => addMessage(ticketId, body, false),
    addPrivateNote: (ticketId, body) => addMessage(ticketId, body, true),
    closeTicket: ticketId => updateTicket(ticketId, { internal_status: 'cerrado', closed_at: new Date().toISOString() }),
  }
}
