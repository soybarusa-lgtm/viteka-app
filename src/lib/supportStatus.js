export const INTERNAL_STATUS_LABELS = {
  nuevo: 'Nuevo',
  abierto: 'Abierto',
  en_progreso: 'En progreso',
  esperando_cliente: 'Esperando cliente',
  esperando_proveedor: 'Esperando proveedor',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
  archivado: 'Archivado',
}

export const CLIENT_STATUS_LABELS = {
  abierto: 'Abierto',
  en_revision: 'En revisión',
  pendiente_respuesta: 'Pendiente de respuesta',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
}

export const PRIORITY_LABELS = {
  bajo: 'Baja',
  medio: 'Media',
  alto: 'Alta',
  urgente: 'Urgente',
}

export const SUPPORT_PRODUCTS = [
  'Soporte Técnico - Viteka',
  'Nixfarma',
  'Cashlogy',
  'Robot',
  'RXI',
  'Hanshow',
  'Equipos informáticos',
  'Otros',
]

export const SUPPORT_TYPES = ['Incidencia', 'Consulta', 'Petición', 'Mantenimiento', 'Instalación', 'Otro']

export function mapInternalStatusToClientStatus(status) {
  return {
    nuevo: 'abierto',
    abierto: 'abierto',
    en_progreso: 'en_revision',
    esperando_cliente: 'pendiente_respuesta',
    esperando_proveedor: 'en_revision',
    resuelto: 'resuelto',
    cerrado: 'cerrado',
    archivado: 'cerrado',
  }[status] || 'abierto'
}

export function getStatusBadgeClass(status) {
  return {
    nuevo: 'badge-blue',
    abierto: 'badge-blue',
    en_revision: 'badge-yellow',
    en_progreso: 'badge-yellow',
    pendiente_respuesta: 'badge-orange',
    esperando_cliente: 'badge-orange',
    esperando_proveedor: 'badge-yellow',
    resuelto: 'badge-green',
    cerrado: 'badge-gray',
    archivado: 'badge-gray',
  }[status] || 'badge-gray'
}

export function getPriorityBadgeClass(priority) {
  return {
    bajo: 'badge-gray',
    medio: 'badge-blue',
    alto: 'badge-orange',
    urgente: 'badge-red',
  }[priority] || 'badge-gray'
}

export function formatTicketNumber(number) {
  return `#${String(number || 0).padStart(5, '0')}`
}
