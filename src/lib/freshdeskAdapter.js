// Freshdesk must be called from a serverless function or Supabase Edge Function.
// Never expose a Freshdesk API key through a VITE_* environment variable.
const unavailable = () => Promise.reject(new Error('Adaptador Freshdesk pendiente de backend seguro.'))

export const listFreshdeskTickets = unavailable
export const getFreshdeskTicket = unavailable
export const createFreshdeskTicket = unavailable
export const updateFreshdeskTicket = unavailable
export const listFreshdeskContacts = unavailable
export const listFreshdeskCompanies = unavailable
export const syncFreshdeskTicketToLocal = unavailable
