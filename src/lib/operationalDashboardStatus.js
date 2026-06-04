export const TASK_PENDING_STATUSES = ['pending', 'in_progress', 'blocked', 'active', 'open']
export const TASK_DONE_STATUSES = ['completed', 'cancelled', 'closed', 'resolved', 'archived']
export const SUPPORT_PENDING_STATUSES = ['nuevo', 'abierto', 'en_progreso', 'esperando_cliente', 'esperando_proveedor', 'open', 'in_progress', 'pending', 'active', 'blocked']
export const SUPPORT_DONE_STATUSES = ['resuelto', 'cerrado', 'archivado', 'resolved', 'closed', 'completed', 'cancelled', 'archived']

const STATUS_META = {
  pending: { label: 'Pendiente', tone: 'amber', order: 4 },
  active: { label: 'Activo', tone: 'teal', order: 3 },
  open: { label: 'Abierto', tone: 'teal', order: 3 },
  nuevo: { label: 'Nuevo', tone: 'teal', order: 3 },
  abierto: { label: 'Abierto', tone: 'teal', order: 3 },
  in_progress: { label: 'En progreso', tone: 'blue', order: 2 },
  en_progreso: { label: 'En progreso', tone: 'blue', order: 2 },
  blocked: { label: 'Bloqueado', tone: 'red', order: 1 },
  esperando_cliente: { label: 'Esperando cliente', tone: 'orange', order: 5 },
  esperando_proveedor: { label: 'Esperando proveedor', tone: 'orange', order: 5 },
  completed: { label: 'Finalizado', tone: 'gray', order: 9 },
  resolved: { label: 'Resuelto', tone: 'gray', order: 9 },
  resuelto: { label: 'Resuelto', tone: 'gray', order: 9 },
  closed: { label: 'Cerrado', tone: 'gray', order: 9 },
  cerrado: { label: 'Cerrado', tone: 'gray', order: 9 },
  cancelled: { label: 'Cancelado', tone: 'gray', order: 9 },
  archived: { label: 'Archivado', tone: 'gray', order: 9 },
  archivado: { label: 'Archivado', tone: 'gray', order: 9 },
}

const PRIORITY_META = {
  critical: { label: 'Critica', tone: 'redStrong', weight: 5 },
  critica: { label: 'Critica', tone: 'redStrong', weight: 5 },
  'crítica': { label: 'Critica', tone: 'redStrong', weight: 5 },
  urgent: { label: 'Urgente', tone: 'red', weight: 5 },
  urgente: { label: 'Urgente', tone: 'red', weight: 5 },
  high: { label: 'Alta', tone: 'orange', weight: 4 },
  alto: { label: 'Alta', tone: 'orange', weight: 4 },
  alta: { label: 'Alta', tone: 'orange', weight: 4 },
  medium: { label: 'Media', tone: 'blue', weight: 3 },
  medio: { label: 'Media', tone: 'blue', weight: 3 },
  media: { label: 'Media', tone: 'blue', weight: 3 },
  low: { label: 'Baja', tone: 'gray', weight: 1 },
  bajo: { label: 'Baja', tone: 'gray', weight: 1 },
  baja: { label: 'Baja', tone: 'gray', weight: 1 },
}

export function normalizeKey(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getStatusMeta(status) {
  const key = normalizeKey(status)
  return STATUS_META[key] || { label: status ? String(status) : 'Sin estado', tone: 'gray', order: 6 }
}

export function getPriorityMeta(priority) {
  const key = normalizeKey(priority)
  return PRIORITY_META[key] || PRIORITY_META.medium
}

export function isPendingStatus(status, type = 'task') {
  const key = normalizeKey(status)
  const pending = type === 'support' ? SUPPORT_PENDING_STATUSES : TASK_PENDING_STATUSES
  const done = type === 'support' ? SUPPORT_DONE_STATUSES : TASK_DONE_STATUSES
  if (done.includes(key)) return false
  return pending.includes(key) || !key
}

export function isOverdueDate(value) {
  if (!value) return false
  const date = new Date(`${String(value).slice(0, 10)}T23:59:59`)
  if (Number.isNaN(date.getTime())) return false
  return date < new Date()
}

export function formatShortDate(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(String(value).includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export function formatShortDateTime(value) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function statusToneClasses(tone) {
  return {
    teal: 'bg-teal-50 text-teal-700 ring-teal-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    orange: 'bg-orange-50 text-orange-700 ring-orange-100',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    red: 'bg-rose-50 text-rose-700 ring-rose-100',
    gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  }[tone] || 'bg-slate-100 text-slate-600 ring-slate-200'
}

export function priorityToneClasses(tone) {
  return {
    gray: 'bg-slate-100 text-slate-600 ring-slate-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-100',
    orange: 'bg-orange-50 text-orange-700 ring-orange-100',
    red: 'bg-rose-50 text-rose-700 ring-rose-100',
    redStrong: 'bg-red-100 text-red-800 ring-red-200',
  }[tone] || 'bg-slate-100 text-slate-600 ring-slate-200'
}

export function buildStatusChart(items) {
  const map = new Map()
  items.forEach(item => {
    const key = normalizeKey(item.status) || 'pending'
    const meta = getStatusMeta(key)
    const current = map.get(key) || { key, label: meta.label, tone: meta.tone, order: meta.order, count: 0 }
    current.count += 1
    map.set(key, current)
  })
  return [...map.values()].sort((a, b) => a.order - b.order || b.count - a.count || a.label.localeCompare(b.label))
}

export function sortPendingItems(items) {
  return [...items].sort((a, b) => {
    const priorityDiff = getPriorityMeta(b.priority).weight - getPriorityMeta(a.priority).weight
    if (priorityDiff) return priorityDiff

    const overdueDiff = Number(isOverdueDate(b.dueDate)) - Number(isOverdueDate(a.dueDate))
    if (overdueDiff) return overdueDiff

    const blockedDiff = Number(normalizeKey(b.status) === 'blocked') - Number(normalizeKey(a.status) === 'blocked')
    if (blockedDiff) return blockedDiff

    const progressDiff = Number(['in_progress', 'en_progreso'].includes(normalizeKey(b.status))) - Number(['in_progress', 'en_progreso'].includes(normalizeKey(a.status)))
    if (progressDiff) return progressDiff

    const aDue = a.dueDate ? new Date(`${String(a.dueDate).slice(0, 10)}T12:00:00`).getTime() : Number.POSITIVE_INFINITY
    const bDue = b.dueDate ? new Date(`${String(b.dueDate).slice(0, 10)}T12:00:00`).getTime() : Number.POSITIVE_INFINITY
    if (aDue !== bDue) return aDue - bDue

    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    if (aUpdated !== bUpdated) return bUpdated - aUpdated

    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bCreated - aCreated
  })
}
