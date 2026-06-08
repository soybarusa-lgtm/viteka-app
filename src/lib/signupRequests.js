import { supabase } from './supabase'

const LOCAL_STORAGE_KEY = 'viteka.signup_requests'

function readLocalRequests() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalRequests(requests) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests))
  } catch {
    // Ignore storage failures in private/incognito contexts.
  }
}

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeRequest(row) {
  return {
    id: row.id,
    full_name: row.full_name || '',
    pharmacy_name: row.pharmacy_name || '',
    population: row.population || '',
    city: row.city || '',
    phone: row.phone || '',
    email: row.email || '',
    current_software: row.current_software || '',
    notes: row.notes || '',
    status: row.status || 'new',
    source: row.source || 'login',
    reviewed_at: row.reviewed_at || null,
    reviewed_by: row.reviewed_by || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }
}

function isMissingTable(error) {
  return ['PGRST205', '42P01'].includes(error?.code) || /signup_requests/i.test(error?.message || '')
}

function buildPayload(payload) {
  return {
    full_name: normalizeText(payload.full_name),
    pharmacy_name: normalizeText(payload.pharmacy_name),
    population: normalizeText(payload.population),
    city: normalizeText(payload.city),
    phone: normalizeText(payload.phone),
    email: normalizeText(payload.email).toLowerCase(),
    current_software: normalizeText(payload.current_software),
    notes: normalizeText(payload.notes),
    source: payload.source || 'login',
    status: payload.status || 'new',
  }
}

export async function submitSignupRequest(payload) {
  const nextPayload = buildPayload(payload)

  try {
    const { error } = await supabase
      .from('signup_requests')
      .insert(nextPayload)

    if (error) throw error
    return {
      data: normalizeRequest({
        ...nextPayload,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      local: false,
    }
  } catch (error) {
    if (!isMissingTable(error) && !/permission/i.test(error?.message || '')) throw error

    const localRequest = normalizeRequest({
      ...nextPayload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    const requests = [localRequest, ...readLocalRequests().filter(item => item.email !== localRequest.email || item.full_name !== localRequest.full_name)]
    writeLocalRequests(requests)

    return { data: localRequest, local: true }
  }
}

export async function fetchSignupRequests() {
  try {
    const { data, error } = await supabase
      .from('signup_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(normalizeRequest)
  } catch (error) {
    if (!isMissingTable(error) && !/permission/i.test(error?.message || '')) throw error
    return readLocalRequests().map(normalizeRequest)
  }
}

export async function updateSignupRequest(id, patch) {
  const nextPatch = {
    ...patch,
    updated_at: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase
      .from('signup_requests')
      .update(nextPatch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return normalizeRequest(data)
  } catch (error) {
    if (!isMissingTable(error) && !/permission/i.test(error?.message || '')) throw error

    const nextRequests = readLocalRequests().map(item => (
      item.id === id ? normalizeRequest({ ...item, ...nextPatch }) : item
    ))
    writeLocalRequests(nextRequests)
    return nextRequests.find(item => item.id === id) || null
  }
}
