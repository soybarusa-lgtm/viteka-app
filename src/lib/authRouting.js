import { normalizeRole } from './permissions'

const INTERNAL_ROLES = new Set(['owner', 'administrador', 'soporte', 'administracion'])
const CLIENT_ROLES = new Set(['cliente_owner', 'cliente_user', 'cliente', 'client'])

function getRoleValue(profileOrRole) {
  if (typeof profileOrRole === 'string') return normalizeRole(profileOrRole)
  return normalizeRole(profileOrRole?.role)
}

export function isInternalRole(profileOrRole) {
  return INTERNAL_ROLES.has(getRoleValue(profileOrRole))
}

export function isClientRole(profileOrRole) {
  return CLIENT_ROLES.has(getRoleValue(profileOrRole))
}

export function isProfileActive(profile) {
  if (!profile) return false
  if (profile.active === false) return false
  if (profile.is_active === false) return false
  return true
}

export function requiresPasswordChange(profile) {
  return profile?.must_change_password === true
}

export function getPostLoginPath(profile) {
  if (!profile) return '/login'
  if (requiresPasswordChange(profile)) return '/change-password'
  if (isClientRole(profile)) return '/cliente/dashboard'
  if (isInternalRole(profile)) return '/'
  return '/login'
}
