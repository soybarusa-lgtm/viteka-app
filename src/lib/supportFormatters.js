export function formatSupportDate(value, withTime = false) {
  if (!value) return 'Sin informar'
  return new Date(value).toLocaleString('es-ES', withTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' })
}

export function normalizeSearch(value) {
  return String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
