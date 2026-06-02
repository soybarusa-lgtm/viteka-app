const now = Date.now()
const hoursAgo = hours => new Date(now - hours * 60 * 60 * 1000).toISOString()

export const MOCK_SUPPORT_COMPANIES = [
  { id: 'company-benahadux', pharmacy_id: 'pharmacy-benahadux', name: 'Farmacia Benahadux', email: 'benahadux@farmacia.es', phone: '950 31 00 24', city: 'Benahadux', province: 'Almería' },
  { id: 'company-sol', pharmacy_id: 'pharmacy-sol', name: 'Farmacia del Sol', email: 'farmacia@farmaciadelsol.es', phone: '952 21 14 75', city: 'Mijas', province: 'Málaga' },
  { id: 'company-pechina', pharmacy_id: 'pharmacy-pechina', name: 'Farmacia Pechina', email: 'farmaciapechina@gmail.com', phone: '950 23 45 67', city: 'Pechina', province: 'Almería' },
  { id: 'company-castillo', pharmacy_id: 'pharmacy-castillo', name: 'Farmacia Castillo', email: 'castillo@farmacia.es', phone: '952 55 20 11', city: 'Vélez-Málaga', province: 'Málaga' },
  { id: 'company-sagrario', pharmacy_id: 'pharmacy-sagrario', name: 'Farmacia del Sagrario', email: 'sagrario@farmacia.es', phone: '958 29 05 32', city: 'Granada', province: 'Granada' },
  { id: 'company-estadiomar', pharmacy_id: 'pharmacy-estadiomar', name: 'Farmacia EstadioMar', email: 'estadiomar@farmacia.es', phone: '950 18 92 11', city: 'Almería', province: 'Almería' },
]

export const MOCK_SUPPORT_CONTACTS = [
  { id: 'contact-sandra', support_company_id: 'company-benahadux', pharmacy_id: 'pharmacy-benahadux', name: 'Sandra', title: 'Titular', email: 'sandra@farmacia.es', mobile_phone: '650 100 221', work_phone: '950 31 00 24', company_name: 'Farmacia Benahadux' },
  { id: 'contact-amanda', support_company_id: 'company-sol', pharmacy_id: 'pharmacy-sol', name: 'Amanda', title: 'Responsable', email: 'amanda@farmaciadelsol.es', mobile_phone: '600 198 204', work_phone: '952 21 14 75', company_name: 'Farmacia del Sol' },
  { id: 'contact-compras', support_company_id: 'company-pechina', pharmacy_id: 'pharmacy-pechina', name: 'Compras', title: 'Administración', email: 'compras@farmaciapechina.es', mobile_phone: '', work_phone: '950 23 45 67', company_name: 'Farmacia Pechina' },
  { id: 'contact-eli', support_company_id: 'company-castillo', pharmacy_id: 'pharmacy-castillo', name: 'Eli', title: 'Auxiliar', email: 'eli@farmaciacastillo.es', mobile_phone: '611 208 413', work_phone: '952 55 20 11', company_name: 'Farmacia Castillo' },
  { id: 'contact-santos', support_company_id: 'company-sagrario', pharmacy_id: 'pharmacy-sagrario', name: 'Santos', title: 'Titular', email: 'santos@sagrario.es', mobile_phone: '644 003 133', work_phone: '958 29 05 32', company_name: 'Farmacia del Sagrario' },
  { id: 'contact-steffi', support_company_id: 'company-estadiomar', pharmacy_id: 'pharmacy-estadiomar', name: 'Steffi', title: 'Responsable', email: 'steffi@estadiomar.es', mobile_phone: '670 765 981', work_phone: '950 18 92 11', company_name: 'Farmacia EstadioMar' },
]

export const MOCK_SUPPORT_TICKETS = [
  ['ticket-1001', 1001, 'Pantalla ordenador principal', 'Farmacia Benahadux', 'pharmacy-benahadux', 'Sandra', 'Equipos informáticos', 'Incidencia', 'urgente', 'en_progreso', 2, 'La pantalla del puesto principal se apaga de forma intermitente.'],
  ['ticket-1002', 1002, 'Consulta sobre extracción de datos e inventario', 'Farmacia del Sol', 'pharmacy-sol', 'Amanda', 'Nixfarma', 'Consulta', 'medio', 'esperando_cliente', 8, 'Necesitamos confirmar el proceso correcto para extraer inventario.'],
  ['ticket-1003', 1003, 'Implementar NotificaMEES', 'Farmacia Pechina', 'pharmacy-pechina', 'Compras', 'Nixfarma', 'Petición', 'bajo', 'nuevo', 20, 'Solicitamos información para activar el nuevo servicio.'],
  ['ticket-1004', 1004, 'Lector Omnikey fallando', 'Farmacia Castillo', 'pharmacy-castillo', 'Eli', 'Equipos informáticos', 'Incidencia', 'alto', 'abierto', 26, 'El lector no reconoce las tarjetas sanitarias.'],
  ['ticket-1005', 1005, 'Servidor pierde conexión a la red', 'Farmacia del Sagrario', 'pharmacy-sagrario', 'Santos', 'Equipos informáticos', 'Incidencia', 'urgente', 'abierto', 34, 'Se producen desconexiones aleatorias durante la jornada.'],
  ['ticket-1006', 1006, 'Problema libro recetario', 'Farmacia EstadioMar', 'pharmacy-estadiomar', 'Steffi', 'Nixfarma', 'Incidencia', 'alto', 'esperando_proveedor', 48, 'No permite cerrar el libro recetario mensual.'],
  ['ticket-1007', 1007, 'Impresora no imprime', 'Farmacia Benahadux', 'pharmacy-benahadux', 'Sandra', 'Equipos informáticos', 'Incidencia', 'medio', 'resuelto', 72, 'La impresora de documentos quedó bloqueada.'],
  ['ticket-1008', 1008, 'No se abre Nixfarma', 'Farmacia del Sol', 'pharmacy-sol', 'Amanda', 'Nixfarma', 'Incidencia', 'urgente', 'cerrado', 96, 'La aplicación no arrancaba tras una actualización de Windows.'],
  ['ticket-1009', 1009, 'Problemas con RXI', 'Farmacia Pechina', 'pharmacy-pechina', 'Compras', 'RXI', 'Mantenimiento', 'medio', 'nuevo', 5, 'La comunicación con RXI tarda más de lo habitual.'],
].map(([id, public_ticket_number, subject, pharmacy_name, pharmacy_id, requester_name, product, type, priority_internal, internal_status, age, description]) => ({
  id,
  public_ticket_number,
  subject,
  pharmacy_name,
  pharmacy_id,
  requester_name,
  product,
  type,
  priority_internal,
  priority_client: priority_internal,
  internal_status,
  client_status: internal_status === 'en_progreso' ? 'en_revision' : internal_status === 'esperando_cliente' ? 'pendiente_respuesta' : internal_status === 'resuelto' ? 'resuelto' : internal_status === 'cerrado' ? 'cerrado' : 'abierto',
  description,
  source: 'portal_cliente',
  group_name: product === 'Nixfarma' ? 'Software' : 'Soporte técnico',
  assigned_agent_name: ['nuevo', 'abierto'].includes(internal_status) ? '' : 'Rafael Lázaro',
  created_at: hoursAgo(age),
  updated_at: hoursAgo(Math.max(1, Math.floor(age / 4))),
}))

export const MOCK_SUPPORT_MESSAGES = [
  { id: 'message-1001-a', ticket_id: 'ticket-1001', author_name: 'Sandra', author_type: 'client', body: 'La pantalla se apaga varias veces durante la mañana. Hemos revisado el cable de corriente.', is_private_note: false, created_at: hoursAgo(2) },
  { id: 'message-1001-b', ticket_id: 'ticket-1001', author_name: 'Rafael Lázaro', author_type: 'agent', body: 'Estamos revisando si el origen está en el monitor o en el puesto. Contactaremos con la farmacia antes de realizar la intervención.', is_private_note: false, created_at: hoursAgo(1) },
  { id: 'message-1001-c', ticket_id: 'ticket-1001', author_name: 'Rafael Lázaro', author_type: 'agent', body: 'Comprobar disponibilidad de monitor de sustitución antes de llamar.', is_private_note: true, created_at: hoursAgo(0.5) },
]

export const MOCK_KB_FOLDERS = [
  'Recetas y estupefacientes',
  'Robots',
  'Facturación',
  'RXI',
  'Cashlogy',
  'Hanshow',
  'Equipos informáticos',
  'Otros',
]
