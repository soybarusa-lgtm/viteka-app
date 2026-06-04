const today = new Date()
const day = offset => {
  const next = new Date(today)
  next.setDate(today.getDate() + offset)
  return next.toISOString().slice(0, 10)
}
const hoursAgo = hours => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

export function createOperationalMocks(identity = {}) {
  const userId = identity.profileId || identity.sessionUserId || 'current-user'
  const userEmail = identity.email || 'usuario@viteka.es'

  const tasks = [
    { id: 'mock-task-1', title: 'Revisar backup del servidor', description: 'Validar copia y anotar resultado.', status: 'blocked', priority: 'critical', assigned_to: userId, assigned_to_email: userEmail, due_date: day(-2), pharmacy_name: 'Farmacia 1', created_at: hoursAgo(72), updated_at: hoursAgo(5) },
    { id: 'mock-task-2', title: 'Preparar instalacion de etiquetas ESL', status: 'in_progress', priority: 'high', assigned_user_id: userId, due_date: day(0), pharmacy_name: 'Farmacia Pechina', created_at: hoursAgo(48), updated_at: hoursAgo(2) },
    { id: 'mock-task-3', title: 'Confirmar datos de contacto', status: 'pending', priority: 'medium', assigned_to: 'other-user', due_date: day(1), pharmacy_name: 'Farmacia del Sol', created_at: hoursAgo(30), updated_at: hoursAgo(8) },
    { id: 'mock-task-4', title: 'Documentar configuracion del router', status: 'open', priority: 'low', assigned_to: null, due_date: day(3), pharmacy_name: 'Farmacia Granada', created_at: hoursAgo(24), updated_at: hoursAgo(12) },
    { id: 'mock-task-5', title: 'Validar licencia Nixfarma', status: 'active', priority: 'urgent', owner_id: 'other-user', due_date: day(-1), pharmacy_name: 'Farmacia El Romeral', created_at: hoursAgo(96), updated_at: hoursAgo(6) },
    { id: 'mock-task-6', title: 'Agendar formacion de mostrador', status: 'pending', priority: 'medium', assigned_to: null, due_date: day(7), pharmacy_name: 'Farmacia Lazaro', created_at: hoursAgo(10), updated_at: hoursAgo(9) },
  ]

  const support = [
    { id: 'mock-support-1', public_ticket_number: 3101, subject: 'Nixfarma no abre en puesto principal', status: 'en_progreso', internal_status: 'en_progreso', priority_internal: 'urgente', assigned_agent_id: userId, assigned_agent_email: userEmail, product: 'Nixfarma', type: 'Incidencia', pharmacy_name: 'Farmacia 1', created_at: hoursAgo(10), updated_at: hoursAgo(1) },
    { id: 'mock-support-2', public_ticket_number: 3102, subject: 'Cashlogy con descuadre de caja', status: 'abierto', internal_status: 'abierto', priority_internal: 'alto', assigned_agent_id: 'other-user', product: 'Cashlogy', type: 'Incidencia', pharmacy_name: 'Farmacia del Sol', created_at: hoursAgo(15), updated_at: hoursAgo(3) },
    { id: 'mock-support-3', public_ticket_number: 3103, subject: 'Consulta sobre informe de ventas', status: 'esperando_cliente', internal_status: 'esperando_cliente', priority_internal: 'medio', assigned_agent_id: userId, product: 'Nixfarma', type: 'Consulta', pharmacy_name: 'Farmacia Granada', created_at: hoursAgo(20), updated_at: hoursAgo(4) },
    { id: 'mock-support-4', public_ticket_number: 3104, subject: 'Pantalla del puesto 2 parpadea', status: 'nuevo', internal_status: 'nuevo', priority_internal: 'urgente', assigned_agent_id: null, product: 'Equipos informaticos', type: 'Incidencia', pharmacy_name: 'Farmacia Pechina', created_at: hoursAgo(3), updated_at: hoursAgo(3) },
    { id: 'mock-support-5', public_ticket_number: 3105, subject: 'Proveedor pendiente de lector Omnikey', status: 'esperando_proveedor', internal_status: 'esperando_proveedor', priority_internal: 'alto', assigned_agent_id: 'other-user', product: 'Equipos informaticos', type: 'Mantenimiento', pharmacy_name: 'Farmacia El Romeral', created_at: hoursAgo(36), updated_at: hoursAgo(7) },
    { id: 'mock-support-6', public_ticket_number: 3106, subject: 'Alta de usuario para portal cliente', status: 'open', internal_status: 'open', priority_internal: 'low', assigned_agent_id: null, product: 'Portal cliente', type: 'Peticion', pharmacy_name: 'Farmacia Lazaro', created_at: hoursAgo(6), updated_at: hoursAgo(6) },
  ]

  return { tasks, support }
}
