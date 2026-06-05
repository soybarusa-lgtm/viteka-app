import { ROLES, normalizeRole } from './permissions'

const INTERNAL_ROLES = new Set([
  ROLES.OWNER,
  ROLES.ADMINISTRADOR,
  ROLES.SOPORTE,
  ROLES.ADMINISTRACION,
])

export function isInternalSupportUser(profile) {
  return INTERNAL_ROLES.has(normalizeRole(profile?.role))
}

export function isClientSupportUser(profile) {
  const role = normalizeRole(profile?.role)
  return role === ROLES.CLIENTE_OWNER || role === ROLES.CLIENTE_USER
}

export function canPreviewClientPortal(profile) {
  return isClientSupportUser(profile) || isInternalSupportUser(profile)
}
