export const ROLES = {
  OWNER: 'owner',
  ADMINISTRADOR: 'administrador',
  SOPORTE: 'soporte',
  ADMINISTRACION: 'administracion',
}

export const ROLE_LABELS = {
  [ROLES.OWNER]: 'Superadministrador',
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.SOPORTE]: 'Soporte',
  [ROLES.ADMINISTRACION]: 'Administracion',
}

export const ROLE_DESCRIPTIONS = {
  [ROLES.OWNER]: 'Control total de configuracion, usuarios, permisos y auditoria.',
  [ROLES.ADMINISTRADOR]: 'Gestion operativa de configuracion, farmacias, proyectos y equipo.',
  [ROLES.SOPORTE]: 'Gestion de soporte, tickets, farmacias y documentacion operativa.',
  [ROLES.ADMINISTRACION]: 'Gestion administrativa, documentos y datos de clientes.',
}

export const PERMISSIONS = {
  CONFIG_VIEW: 'config:view',
  CONFIG_EDIT: 'config:edit',
  TEAM_MANAGE: 'team:manage',
  ROLE_MANAGE: 'role:manage',
  FARMACIAS_MANAGE: 'farmacias:manage',
  SUPPORT_MANAGE: 'support:manage',
  ADMINISTRATION_MANAGE: 'administration:manage',
  PROJECTS_MANAGE: 'projects:manage',
  DOCUMENTS_MANAGE: 'documents:manage',
  AUDIT_VIEW: 'audit:view',
}

const ROLE_ALIASES = {
  admin: ROLES.ADMINISTRADOR,
  administrador: ROLES.ADMINISTRADOR,
  administracion: ROLES.ADMINISTRACION,
  administración: ROLES.ADMINISTRACION,
  administrativo: ROLES.ADMINISTRACION,
  owner: ROLES.OWNER,
  superadmin: ROLES.OWNER,
  soporte: ROLES.SOPORTE,
  support: ROLES.SOPORTE,
  technician: ROLES.SOPORTE,
  tecnico: ROLES.SOPORTE,
}

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMINISTRADOR]: [
    PERMISSIONS.CONFIG_VIEW,
    PERMISSIONS.CONFIG_EDIT,
    PERMISSIONS.TEAM_MANAGE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.FARMACIAS_MANAGE,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.ADMINISTRATION_MANAGE,
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.DOCUMENTS_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],
  [ROLES.SOPORTE]: [
    PERMISSIONS.FARMACIAS_MANAGE,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.DOCUMENTS_MANAGE,
  ],
  [ROLES.ADMINISTRACION]: [
    PERMISSIONS.FARMACIAS_MANAGE,
    PERMISSIONS.ADMINISTRATION_MANAGE,
    PERMISSIONS.DOCUMENTS_MANAGE,
  ],
}

export function normalizeRole(role) {
  const key = String(role || '').trim().toLowerCase()
  return ROLE_ALIASES[key] || key
}

export function hasPermission(profile, permission) {
  const role = normalizeRole(profile?.role)
  return Boolean(permission && ROLE_PERMISSIONS[role]?.includes(permission))
}

export function canAccessConfig(profile) {
  return hasPermission(profile, PERMISSIONS.CONFIG_VIEW)
}

export function canManageVitekaTeam(profile) {
  return hasPermission(profile, PERMISSIONS.TEAM_MANAGE)
}

export function canManageRole(currentUserProfile, targetRole) {
  const currentRole = normalizeRole(currentUserProfile?.role)
  const normalizedTarget = normalizeRole(targetRole)
  if (currentRole === ROLES.OWNER) return Object.values(ROLES).includes(normalizedTarget)
  if (currentRole === ROLES.ADMINISTRADOR) return [ROLES.SOPORTE, ROLES.ADMINISTRACION].includes(normalizedTarget)
  return false
}

export function canEditTeamMember(currentUserProfile, targetMember) {
  const targetRole = normalizeRole(targetMember?.role)
  if (normalizeRole(currentUserProfile?.role) === ROLES.OWNER) return true
  return canManageVitekaTeam(currentUserProfile) && targetRole !== ROLES.OWNER && canManageRole(currentUserProfile, targetRole)
}

export function canDeleteTeamMember(currentUserProfile, targetMember) {
  if (!targetMember) return false
  if (normalizeRole(currentUserProfile?.role) === ROLES.OWNER) return true
  return canEditTeamMember(currentUserProfile, targetMember) && normalizeRole(targetMember.role) !== ROLES.OWNER
}
