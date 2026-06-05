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

export function isInternalSupportUser(profile) {
  return INTERNAL_ROLES.has(profile?.role)
}

export function isClientSupportUser(profile) {
  return profile?.role === 'client' || profile?.role === 'cliente'
}

export function canPreviewClientPortal(profile) {
  return isClientSupportUser(profile) || isInternalSupportUser(profile)
}
