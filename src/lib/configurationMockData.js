import { ROLES } from './permissions'

export const settingsMock = [
  {
    key: 'identity',
    title: 'Identidad visual',
    description: 'Logo, nombre de marca, tono visual y textos corporativos.',
    value: { brandName: 'Viteka', primaryColor: '#00695c', accentColor: '#8bc34a' },
  },
  {
    key: 'modules',
    title: 'Modulos activos',
    description: 'Farmacias, proyectos, soporte, documentos y portal cliente.',
    value: { farmacias: true, proyectos: true, soporte: true, documentos: true, portalCliente: true },
  },
  {
    key: 'custom_fields',
    title: 'Campos personalizados',
    description: 'Parametros extra para fichas, equipos, personas y documentos.',
    value: { farmacias: ['SOE', 'Guardias'], equipos: ['Distribuidor', 'Soporte'] },
  },
  {
    key: 'support',
    title: 'Soporte y tickets',
    description: 'SLA, prioridades, estados y reglas de comunicacion.',
    value: { slaHours: 8, defaultPriority: 'media', clientPortal: true },
  },
  {
    key: 'notifications',
    title: 'Notificaciones',
    description: 'Avisos internos, correo y recordatorios operativos.',
    value: { email: true, dailyDigest: true, ticketAlerts: true },
  },
  {
    key: 'security',
    title: 'Seguridad',
    description: 'Control de acceso, auditoria y sesiones.',
    value: { auditEnabled: true, sessionReviewDays: 30 },
  },
]

export const vitekaTeamMock = [
  {
    id: 'mock-owner',
    full_name: 'Rafael Lazaro',
    email: 'rafa.lazaro@viteka.es',
    phone: '',
    role: ROLES.OWNER,
    is_active: true,
    department: 'Direccion',
    internal_notes: 'Usuario principal de demostracion.',
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-support',
    full_name: 'Equipo Soporte',
    email: 'soporte@viteka.es',
    phone: '',
    role: ROLES.SOPORTE,
    is_active: true,
    department: 'Soporte',
    internal_notes: '',
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const auditMock = [
  {
    id: 'mock-audit-1',
    action: 'config.update',
    entity_type: 'app_settings',
    entity_id: 'identity',
    actor_name: 'Sistema',
    summary: 'Configuracion inicial cargada en modo demostracion.',
    created_at: new Date().toISOString(),
  },
]

export const clientPortalAccessMock = [
  {
    id: 'mock-client-access-1',
    auth_user_id: 'mock-auth-1',
    profile_id: 'mock-profile-1',
    pharmacy_id: 'mock-pharmacy-1',
    person_id: 'mock-person-1',
    email: 'cliente@farmacia.es',
    full_name: 'Cliente Demo',
    role: 'cliente_owner',
    is_active: true,
    must_change_password: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
