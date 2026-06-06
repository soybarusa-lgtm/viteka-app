import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { addMockMessage, createMockTicket, listMockMessages, listMockTickets, updateMockTicket } from '../lib/supportMockStore'
import { mapInternalStatusToClientStatus } from '../lib/supportStatus'

function isMissingTable(error) {
  return ['PGRST205', '42P01'].includes(error?.code) || error?.message?.includes('support_tickets')
}

function isMissingColumn(error) {
  const message = error?.message || ''
  return ['42703', 'PGRST204'].includes(error?.code)
    || message.includes('schema cache')
    || message.includes('Could not find the')
    || message.includes('column')
}

function safeStorageName(name) {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z0-9._-]+/g, '-')
}

function inferGroupName(product) {
  if (!product) return 'Soporte'
  if (String(product).toLocaleLowerCase('es').includes('nixfarma')) return 'Software'
  if (String(product).toLocaleLowerCase('es').includes('equipo')) return 'Soporte técnico'
  return 'Soporte'
}

function buildContextBlock(payload = {}) {
  const lines = [
    payload.related_project_name ? `Proyecto relacionado: ${payload.related_project_name}` : '',
    payload.requester_name ? `Contacto relacionado: ${payload.requester_name}` : '',
    payload.requester_email ? `Email de contacto: ${payload.requester_email}` : '',
    payload.asset_label ? `Equipo relacionado: ${payload.asset_label}` : '',
  ].filter(Boolean)

  if (!lines.length) return ''
  return `\n\n---\nContexto operativo\n${lines.map(line => `- ${line}`).join('\n')}`
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

async function getCurrentProfileCompanyId(profile) {
  if (profile?.company_id) return profile.company_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()
  return data?.company_id || null
}

async function enrichTickets(rawTickets = []) {
  if (!rawTickets.length) return rawTickets

  const pharmacyIds = [...new Set(rawTickets.map(ticket => ticket.pharmacy_id).filter(Boolean))]
  const requesterIds = [...new Set(rawTickets.map(ticket => ticket.requester_profile_id).filter(Boolean))]
  const relatedProjectIds = [...new Set(rawTickets.map(ticket => ticket.related_project_id || ticket.project_id).filter(Boolean))]

  const [pharmaciesResponse, requestersResponse, projectsResponse] = await Promise.all([
    pharmacyIds.length
      ? supabase.from('pharmacies').select('id, pharmacy_name').in('id', pharmacyIds)
      : Promise.resolve({ data: [], error: null }),
    requesterIds.length
      ? supabase.from('profiles').select('id, full_name, email').in('id', requesterIds)
      : Promise.resolve({ data: [], error: null }),
    relatedProjectIds.length
      ? supabase.from('projects').select('id, name').in('id', relatedProjectIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const pharmacyMap = Object.fromEntries((pharmaciesResponse.data || []).map(item => [item.id, item.pharmacy_name]))
  const requesterMap = Object.fromEntries((requestersResponse.data || []).map(item => [item.id, item.full_name || item.email || '']))
  const projectMap = Object.fromEntries((projectsResponse.data || []).map(item => [item.id, item.name]))

  return rawTickets.map(ticket => {
    const relatedProjectId = ticket.related_project_id || ticket.project_id || null
    return {
      ...ticket,
      pharmacy_name: ticket.pharmacy_name || pharmacyMap[ticket.pharmacy_id] || 'Sin farmacia',
      requester_name: ticket.requester_name || requesterMap[ticket.requester_profile_id] || 'Sin solicitante',
      related_project_name: ticket.related_project_name || projectMap[relatedProjectId] || '',
    }
  })
}

async function insertTicketWithFallback(ticketPayload) {
  const variants = [
    ticketPayload,
    {
      company_id: ticketPayload.company_id,
      pharmacy_id: ticketPayload.pharmacy_id,
      requester_profile_id: ticketPayload.requester_profile_id,
      requester_name: ticketPayload.requester_name,
      subject: ticketPayload.subject,
      description: ticketPayload.description,
      type: ticketPayload.type,
      product: ticketPayload.product,
      group_name: ticketPayload.group_name,
      priority_client: ticketPayload.priority_client,
      priority_internal: ticketPayload.priority_internal,
      source: ticketPayload.source,
      status: ticketPayload.status,
      internal_status: ticketPayload.internal_status,
      client_status: ticketPayload.client_status,
    },
    {
      company_id: ticketPayload.company_id,
      pharmacy_id: ticketPayload.pharmacy_id,
      requester_profile_id: ticketPayload.requester_profile_id,
      subject: ticketPayload.subject,
      description: ticketPayload.description,
      type: ticketPayload.type,
      product: ticketPayload.product,
      priority_client: ticketPayload.priority_client,
      priority_internal: ticketPayload.priority_internal,
      source: ticketPayload.source,
      status: ticketPayload.status,
      internal_status: ticketPayload.internal_status,
      client_status: ticketPayload.client_status,
    },
  ]

  let lastError = null
  for (const variant of variants) {
    const response = await supabase.from('support_tickets').insert(variant).select().single()
    if (!response.error) return response
    lastError = response.error
    if (!isMissingColumn(response.error)) break
  }

  return { data: null, error: lastError }
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
      setTickets(await enrichTickets(data || []))
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

    const companyId = await getCurrentProfileCompanyId(profile)
    const ticketPayload = {
      company_id: companyId,
      pharmacy_id: payload.pharmacy_id || profile?.pharmacy_id || null,
      requester_profile_id: profile?.role === 'client' ? profile?.id : payload.requester_profile_id || null,
      requester_name: payload.requester_name || profile?.full_name || profile?.email || 'Cliente',
      requester_email: payload.requester_email || profile?.email || null,
      subject: payload.subject,
      description: `${payload.description || ''}${buildContextBlock(payload)}`.trim(),
      type: payload.type,
      product: payload.product,
      group_name: payload.group_name || inferGroupName(payload.product),
      priority_client: payload.priority,
      priority_internal: payload.priority,
      source: payload.source || (clientOnly ? 'portal_cliente' : 'portal_interno'),
      status: 'nuevo',
      internal_status: 'nuevo',
      client_status: 'abierto',
      related_project_id: payload.related_project_id || payload.project_id || null,
      related_project_name: payload.related_project_name || payload.project_name || null,
    }

    const { data: ticket, error: ticketError } = await insertTicketWithFallback(ticketPayload)
    if (ticketError) throw ticketError

    const { data: message, error: messageError } = await supabase.from('support_ticket_messages').insert({
      ticket_id: ticket.id,
      author_profile_id: profile?.id,
      author_name: profile?.full_name || profile?.email || (clientOnly ? 'Cliente' : 'Equipo Viteka'),
      author_type: profile?.role === 'client' ? 'client' : 'agent',
      body: payload.description,
      is_private_note: false,
    }).select().single()
    if (messageError) throw messageError

    for (const file of payload.files || []) {
      const filePath = `${companyId}/${ticket.id}/${Date.now()}_${safeStorageName(file.name)}`
      const { error: uploadError } = await supabase.storage.from('support-attachments').upload(filePath, file)
      if (uploadError) throw uploadError
      const { error: attachmentError } = await supabase.from('support_ticket_attachments').insert({
        ticket_id: ticket.id,
        message_id: message.id,
        company_id: companyId,
        pharmacy_id: ticketPayload.pharmacy_id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by_profile_id: profile?.id || null,
      })
      if (attachmentError) throw attachmentError
    }
    await tryAudit(profile, 'ticket_created', ticket.id, ticket)
    await reload()
    return ticket
  }, [clientOnly, profile, reload, usingMocks])

  const getTicketById = useCallback(async ticketId => {
    if (usingMocks) return { ticket: listMockTickets().find(ticket => ticket.id === ticketId), messages: listMockMessages(ticketId, !clientOnly) }
    const [{ data: ticket, error: ticketError }, { data: messages, error: messagesError }, { data: attachments, error: attachmentsError }] = await Promise.all([
      supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle(),
      supabase.from('support_ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at'),
      supabase.from('support_ticket_attachments').select('*').eq('ticket_id', ticketId).order('created_at'),
    ])
    if (ticketError || messagesError || attachmentsError) throw ticketError || messagesError || attachmentsError
    const [enrichedTicket] = await enrichTickets(ticket ? [{ ...ticket, attachments: attachments || [] }] : [])
    return { ticket: enrichedTicket, messages: clientOnly ? (messages || []).filter(message => !message.is_private_note) : messages || [] }
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
