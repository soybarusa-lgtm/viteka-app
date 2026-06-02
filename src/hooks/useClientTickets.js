import { useSupportTickets } from './useSupportTickets'

export function useClientTickets(profile) {
  return useSupportTickets(profile, { clientOnly: true })
}
