export const PROJECT_DIVISIONS = [
  {
    id: 'commercial',
    label: 'Comercial',
    shortLabel: 'Comercial',
    description: 'Oportunidades, propuestas y cierres',
    accent: 'teal',
  },
  {
    id: 'support',
    label: 'Soporte',
    shortLabel: 'Soporte',
    description: 'Seguimiento técnico y mejora continua',
    accent: 'blue',
  },
  {
    id: 'training',
    label: 'Formación',
    shortLabel: 'Formación',
    description: 'Planes formativos y sesiones',
    accent: 'amber',
  },
  {
    id: 'installation',
    label: 'Instalaciones',
    shortLabel: 'Instalaciones',
    description: 'Preparación, despliegue y puesta en marcha',
    accent: 'violet',
  },
]

export const PROJECT_PIPELINES = {
  commercial: [
    { id: 'leads', label: 'Entrada', color: 'bg-slate-400' },
    { id: 'contactado', label: 'Contactado', color: 'bg-sky-500' },
    { id: 'visita', label: 'Diagnóstico', color: 'bg-cyan-500' },
    { id: 'propuesta', label: 'Propuesta', color: 'bg-amber-500' },
    { id: 'negociacion', label: 'Negociación', color: 'bg-orange-500' },
    { id: 'cerrado', label: 'Ganado', color: 'bg-emerald-500' },
    { id: 'perdido', label: 'Descartado', color: 'bg-rose-400' },
  ],
  support: [
    { id: 'support:entrada', label: 'Entrada', color: 'bg-slate-400' },
    { id: 'support:analisis', label: 'Análisis', color: 'bg-sky-500' },
    { id: 'support:plan', label: 'Plan de acción', color: 'bg-cyan-500' },
    { id: 'support:ejecucion', label: 'En ejecución', color: 'bg-amber-500' },
    { id: 'support:validacion', label: 'Validación', color: 'bg-orange-500' },
    { id: 'support:cerrado', label: 'Cerrado', color: 'bg-emerald-500' },
  ],
  training: [
    { id: 'training:necesidad', label: 'Necesidad', color: 'bg-slate-400' },
    { id: 'training:planificacion', label: 'Planificación', color: 'bg-sky-500' },
    { id: 'training:convocatoria', label: 'Convocatoria', color: 'bg-cyan-500' },
    { id: 'training:imparticion', label: 'Impartición', color: 'bg-amber-500' },
    { id: 'training:evaluacion', label: 'Evaluación', color: 'bg-orange-500' },
    { id: 'training:cerrado', label: 'Completado', color: 'bg-emerald-500' },
  ],
  installation: [
    { id: 'installation:entrada', label: 'Entrada', color: 'bg-slate-400' },
    { id: 'installation:preparacion', label: 'Preparación', color: 'bg-sky-500' },
    { id: 'installation:agenda', label: 'Agenda', color: 'bg-cyan-500' },
    { id: 'installation:instalacion', label: 'Instalación', color: 'bg-amber-500' },
    { id: 'installation:puesta_en_marcha', label: 'Puesta en marcha', color: 'bg-orange-500' },
    { id: 'installation:cerrado', label: 'Entregado', color: 'bg-emerald-500' },
  ],
}

export const PROJECT_STATUSES = [
  { id: 'active', label: 'Activo', badge: 'badge-blue' },
  { id: 'pending', label: 'Pendiente', badge: 'badge-yellow' },
  { id: 'in_progress', label: 'En curso', badge: 'badge-blue' },
  { id: 'blocked', label: 'Bloqueado', badge: 'badge-red' },
  { id: 'paused', label: 'Pausado', badge: 'badge-yellow' },
  { id: 'completed', label: 'Finalizado', badge: 'badge-green' },
  { id: 'cancelled', label: 'Cancelado', badge: 'badge-gray' },
]

export const PRIORITIES = [
  { id: 'low', label: 'Baja', dot: 'bg-slate-300', badge: 'badge-gray' },
  { id: 'medium', label: 'Media', dot: 'bg-sky-400', badge: 'badge-blue' },
  { id: 'high', label: 'Alta', dot: 'bg-orange-400', badge: 'badge-orange' },
  { id: 'critical', label: 'Crítica', dot: 'bg-rose-500', badge: 'badge-red' },
]

export const TASK_STATUSES = [
  { id: 'pending', label: 'Pendiente', badge: 'badge-gray' },
  { id: 'in_progress', label: 'En curso', badge: 'badge-blue' },
  { id: 'blocked', label: 'Bloqueada', badge: 'badge-red' },
  { id: 'completed', label: 'Completada', badge: 'badge-green' },
]

export const MILESTONE_TYPES = [
  { id: 'milestone', label: 'Hito' },
  { id: 'meeting', label: 'Reunión' },
  { id: 'delivery', label: 'Entrega' },
  { id: 'training', label: 'Formación' },
  { id: 'installation', label: 'Instalación' },
  { id: 'follow_up', label: 'Seguimiento' },
]

export const MESSAGE_CHANNELS = [
  { id: 'note', label: 'Nota' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Llamada' },
  { id: 'meeting', label: 'Reunión' },
  { id: 'portal', label: 'Portal cliente' },
]

export function getDivision(projectOrId) {
  if (typeof projectOrId === 'string') {
    return PROJECT_DIVISIONS.find(division => division.id === projectOrId) || PROJECT_DIVISIONS[0]
  }

  const project = projectOrId || {}
  const prefixedDivision = String(project.pipeline_stage || '').split(':')[0]
  return PROJECT_DIVISIONS.find(division => division.id === prefixedDivision)
    || PROJECT_DIVISIONS.find(division => division.id === project.project_type)
    || PROJECT_DIVISIONS[0]
}

export function getPipeline(divisionOrProject) {
  return PROJECT_PIPELINES[getDivision(divisionOrProject).id] || PROJECT_PIPELINES.commercial
}

export function getStage(project) {
  const pipeline = getPipeline(project)
  return pipeline.find(stage => stage.id === project?.pipeline_stage) || pipeline[0]
}

export function getStatus(status) {
  return PROJECT_STATUSES.find(item => item.id === status) || PROJECT_STATUSES[0]
}

export function getPriority(priority) {
  return PRIORITIES.find(item => item.id === priority) || PRIORITIES[1]
}

export function defaultStage(divisionId) {
  return PROJECT_PIPELINES[divisionId]?.[0]?.id || PROJECT_PIPELINES.commercial[0].id
}

export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function fmtDate(value, options = {}) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: options.year === false ? undefined : 'numeric',
  })
}

export function fmtDateTime(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtCurrency(value) {
  if (value === null || value === undefined || value === '') return 'Sin importe'
  return Number(value).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export function isOverdue(project) {
  if (!project?.expected_close_date || ['completed', 'cancelled'].includes(project.status)) return false
  return new Date(project.expected_close_date) < new Date(new Date().toDateString())
}
