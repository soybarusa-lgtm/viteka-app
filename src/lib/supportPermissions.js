const INTERNAL_ROLES = new Set([
  'owner',
  'superadmin',
  'admin',
  'administrador',
  'soporte',
  'support',
  'technician',
  'tecnico',
  'commercial',
  'comercial',
  'administracion',
  'administración',
])

const CLIENT_ROLES = new Set([
  'cliente_owner',
  'cliente_user',
  'cliente',
  'client',
])

export function isInternalSupportUser(profile) {
  return INTERNAL_ROLES.has(profile?.role)
}

export function isClientSupportUser(profile) {
  return CLIENT_ROLES.has(profile?.role)
}

export function canPreviewClientPortal(profile) {
  return isClientSupportUser(profile) || isInternalSupportUser(profile)
}
