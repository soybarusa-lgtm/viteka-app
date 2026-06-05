export const ROLES = {
  OWNER: 'owner',
  ADMINISTRADOR: 'administrador',
  SOPORTE: 'soporte',
  ADMINISTRACION: 'administracion',
  CLIENTE_OWNER: 'cliente_owner',
  CLIENTE_USER: 'cliente_user',
}

export const ROLE_LABELS = {
  [ROLES.OWNER]: 'Superadministrador',
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.SOPORTE]: 'Soporte',
  [ROLES.ADMINISTRACION]: 'Administracion',
  [ROLES.CLIENTE_OWNER]: 'Cliente administrador',
  [ROLES.CLIENTE_USER]: 'Cliente usuario',
}

export const ROLE_DESCRIPTIONS = {
  [ROLES.OWNER]: 'Control total de la app, configuracion, equipo y auditoria.',
  [ROLES.ADMINISTRADOR]: 'Gestion operativa y administrativa con acceso amplio.',
  [ROLES.SOPORTE]: 'Operacion de soporte, tickets, farmacias y documentos.',
  [ROLES.ADMINISTRACION]: 'Gestion administrativa, documentos y seguimiento.',
  [ROLES.CLIENTE_OWNER]: 'Usuario cliente con control de su farmacia y sus tickets.',
  [ROLES.CLIENTE_USER]: 'Usuario cliente limitado a sus tickets y documentos visibles.',
}

export const PERMISSIONS = {
  CONFIG_VIEW: 'config.view',
  CONFIG_EDIT: 'config.edit',
  CONFIG_CRITICAL_EDIT: 'config.critical_edit',
  VITEKA_TEAM_VIEW: 'viteka_team.view',
  VITEKA_TEAM_CREATE: 'viteka_team.create',
  VITEKA_TEAM_EDIT: 'viteka_team.edit',
  VITEKA_TEAM_DELETE: 'viteka_team.delete',
  VITEKA_TEAM_CHANGE_ROLE: 'viteka_team.change_role',
  VITEKA_TEAM_CREATE_ADMIN: 'viteka_team.create_admin',
  VITEKA_TEAM_RESET_PASSWORD: 'viteka_team.reset_password',
  CLIENT_ACCESS_VIEW: 'client_access.view',
  CLIENT_ACCESS_CREATE: 'client_access.create',
  CLIENT_ACCESS_EDIT: 'client_access.edit',
  CLIENT_ACCESS_DISABLE: 'client_access.disable',
  CLIENT_PORTAL_VIEW: 'client_portal.view',
  CLIENT_PORTAL_CREATE_TICKET: 'client_portal.create_ticket',
  CLIENT_PORTAL_VIEW_TICKETS: 'client_portal.view_tickets',
  CLIENT_PORTAL_VIEW_DOCUMENTS: 'client_portal.view_documents',
  CLIENT_PORTAL_MANAGE_USERS: 'client_portal.manage_users',
  FARMACIAS_OPERATE: 'farmacias.operate',
  SOPORTE_OPERATE: 'soporte.operate',
  ADMINISTRACION_OPERATE: 'administracion.operate',
  PROYECTOS_OPERATE: 'proyectos.operate',
  DOCUMENTOS_OPERATE: 'documentos.operate',
  AUDIT_VIEW: 'audit.view',
}

const ROLE_ALIASES = {
  owner: ROLES.OWNER,
  superadmin: ROLES.OWNER,
  administrador: ROLES.ADMINISTRADOR,
  admin: ROLES.ADMINISTRADOR,
  soporte: ROLES.SOPORTE,
  support: ROLES.SOPORTE,
  technician: ROLES.SOPORTE,
  tecnico: ROLES.SOPORTE,
  administracion: ROLES.ADMINISTRACION,
  'administración': ROLES.ADMINISTRACION,
  administrativo: ROLES.ADMINISTRACION,
  cliente_owner: ROLES.CLIENTE_OWNER,
  cliente_user: ROLES.CLIENTE_USER,
  client_owner: ROLES.CLIENTE_OWNER,
  client_user: ROLES.CLIENTE_USER,
  client: ROLES.CLIENTE_USER,
  cliente: ROLES.CLIENTE_USER,
}

const ALL_PERMISSIONS = Object.values(PERMISSIONS)

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: ALL_PERMISSIONS,
  [ROLES.ADMINISTRADOR]: [
    PERMISSIONS.CONFIG_VIEW,
    PERMISSIONS.CONFIG_EDIT,
    PERMISSIONS.VITEKA_TEAM_VIEW,
    PERMISSIONS.VITEKA_TEAM_CREATE,
    PERMISSIONS.VITEKA_TEAM_EDIT,
    PERMISSIONS.VITEKA_TEAM_CHANGE_ROLE,
    PERMISSIONS.VITEKA_TEAM_RESET_PASSWORD,
    PERMISSIONS.CLIENT_ACCESS_VIEW,
    PERMISSIONS.CLIENT_ACCESS_CREATE,
    PERMISSIONS.CLIENT_ACCESS_EDIT,
    PERMISSIONS.CLIENT_ACCESS_DISABLE,
    PERMISSIONS.FARMACIAS_OPERATE,
    PERMISSIONS.SOPORTE_OPERATE,
    PERMISSIONS.ADMINISTRACION_OPERATE,
    PERMISSIONS.PROYECTOS_OPERATE,
    PERMISSIONS.DOCUMENTOS_OPERATE,
    PERMISSIONS.AUDIT_VIEW,
  ],
  [ROLES.SOPORTE]: [
    PERMISSIONS.FARMACIAS_OPERATE,
    PERMISSIONS.SOPORTE_OPERATE,
    PERMISSIONS.PROYECTOS_OPERATE,
    PERMISSIONS.DOCUMENTOS_OPERATE,
  ],
  [ROLES.ADMINISTRACION]: [
    PERMISSIONS.FARMACIAS_OPERATE,
    PERMISSIONS.ADMINISTRACION_OPERATE,
    PERMISSIONS.PROYECTOS_OPERATE,
    PERMISSIONS.DOCUMENTOS_OPERATE,
    PERMISSIONS.CLIENT_ACCESS_VIEW,
  ],
  [ROLES.CLIENTE_OWNER]: [
    PERMISSIONS.CLIENT_PORTAL_VIEW,
    PERMISSIONS.CLIENT_PORTAL_CREATE_TICKET,
    PERMISSIONS.CLIENT_PORTAL_VIEW_TICKETS,
    PERMISSIONS.CLIENT_PORTAL_VIEW_DOCUMENTS,
    PERMISSIONS.CLIENT_PORTAL_MANAGE_USERS,
  ],
  [ROLES.CLIENTE_USER]: [
    PERMISSIONS.CLIENT_PORTAL_VIEW,
    PERMISSIONS.CLIENT_PORTAL_CREATE_TICKET,
    PERMISSIONS.CLIENT_PORTAL_VIEW_TICKETS,
    PERMISSIONS.CLIENT_PORTAL_VIEW_DOCUMENTS,
  ],
}

const INTERNAL_ROLES = new Set([ROLES.OWNER, ROLES.ADMINISTRADOR, ROLES.SOPORTE, ROLES.ADMINISTRACION])
const CLIENT_ROLES = new Set([ROLES.CLIENTE_OWNER, ROLES.CLIENTE_USER])

export function normalizeRole(role) {
  const key = String(role || '').trim().toLowerCase()
  return ROLE_ALIASES[key] || key
}

export function hasPermission(profile, permission) {
  const role = normalizeRole(profile?.role)
  if (!permission) return false
  if (role === ROLES.OWNER) return true
  return Boolean(ROLE_PERMISSIONS[role]?.includes(permission))
}

export function canAccessConfig(profile) {
  return hasPermission(profile, PERMISSIONS.CONFIG_VIEW)
}

export function canManageVitekaTeam(profile) {
  return hasPermission(profile, PERMISSIONS.VITEKA_TEAM_VIEW)
}

export function canCreateInternalRole(currentUserProfile, roleToCreate) {
  const currentRole = normalizeRole(currentUserProfile?.role)
  const nextRole = normalizeRole(roleToCreate)
  if (currentRole === ROLES.OWNER) return INTERNAL_ROLES.has(nextRole) || CLIENT_ROLES.has(nextRole)
  if (currentRole === ROLES.ADMINISTRADOR) return [ROLES.SOPORTE, ROLES.ADMINISTRACION, ROLES.CLIENTE_OWNER, ROLES.CLIENTE_USER].includes(nextRole)
  return false
}

export function canManageRole(currentUserProfile, roleToCreate) {
  return canCreateInternalRole(currentUserProfile, roleToCreate)
}

export function canEditTeamMember(currentUserProfile, targetMember) {
  if (!targetMember) return false
  const currentRole = normalizeRole(currentUserProfile?.role)
  const targetRole = normalizeRole(targetMember.role)
  if (currentRole === ROLES.OWNER) return true
  if (currentRole === ROLES.ADMINISTRADOR) return [ROLES.SOPORTE, ROLES.ADMINISTRACION, ROLES.CLIENTE_OWNER, ROLES.CLIENTE_USER].includes(targetRole)
  return false
}

export function canDeleteTeamMember(currentUserProfile, targetMember) {
  if (!targetMember) return false
  if (normalizeRole(currentUserProfile?.role) === ROLES.OWNER) return normalizeRole(targetMember.role) !== ROLES.OWNER
  return canEditTeamMember(currentUserProfile, targetMember) && normalizeRole(targetMember.role) !== ROLES.OWNER
}

export function canResetPassword(currentUserProfile, targetMember) {
  if (!targetMember) return false
  if (normalizeRole(currentUserProfile?.role) === ROLES.OWNER) return true
  if (normalizeRole(currentUserProfile?.role) === ROLES.ADMINISTRADOR) {
    return [ROLES.SOPORTE, ROLES.ADMINISTRACION, ROLES.CLIENTE_OWNER, ROLES.CLIENTE_USER].includes(normalizeRole(targetMember.role))
  }
  return false
}

export function canCreateClientAccess(currentUserProfile) {
  return hasPermission(currentUserProfile, PERMISSIONS.CLIENT_ACCESS_CREATE)
}

export function canAccessClientPortal(profile) {
  const role = normalizeRole(profile?.role)
  return CLIENT_ROLES.has(role) || INTERNAL_ROLES.has(role)
}

export function canViewClientDashboard(profile, pharmacyId) {
  const role = normalizeRole(profile?.role)
  if (CLIENT_ROLES.has(role)) {
    if (!pharmacyId) return true
    return String(profile?.pharmacy_id || '') === String(pharmacyId)
  }
  return INTERNAL_ROLES.has(role)
}

export function canOpenClientContextFromTicket(profile, ticket) {
  if (!ticket) return false
  return INTERNAL_ROLES.has(normalizeRole(profile?.role)) && Boolean(ticket.pharmacy_id || ticket.requester_profile_id)
}

