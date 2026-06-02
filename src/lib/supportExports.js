import { jsPDF } from 'jspdf'
import { formatTicketNumber } from './supportStatus'

const DEFAULT_COLUMNS = [
  ['public_ticket_number', 'Ticket'],
  ['subject', 'Asunto'],
  ['pharmacy_name', 'Farmacia'],
  ['product', 'Producto'],
  ['internal_status', 'Estado'],
  ['priority_internal', 'Prioridad'],
  ['created_at', 'Creado'],
]

function mappedRows(data, columns = DEFAULT_COLUMNS) {
  return data.map(item => columns.map(([key]) => key === 'public_ticket_number' ? formatTicketNumber(item[key]) : String(item[key] ?? '')))
}

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportToCsv(data, columns = DEFAULT_COLUMNS, filename = 'tickets.csv') {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`
  download([columns.map(([, label]) => quote(label)).join(';'), ...mappedRows(data, columns).map(row => row.map(quote).join(';'))].join('\n'), filename, 'text/csv;charset=utf-8')
}

export function exportToTxt(data, columns = DEFAULT_COLUMNS, filename = 'tickets.txt') {
  download(mappedRows(data, columns).map(row => row.join(' ; ')).join('\n'), filename, 'text/plain;charset=utf-8')
}

export function exportToJson(data, filename = 'tickets.json') {
  download(JSON.stringify(data, null, 2), filename, 'application/json;charset=utf-8')
}

export function exportToPdf(data, columns = DEFAULT_COLUMNS, filename = 'tickets.pdf', title = 'Tickets de soporte') {
  const pdf = new jsPDF({ orientation: 'landscape' })
  pdf.setFontSize(15)
  pdf.text(title, 14, 15)
  pdf.setFontSize(8)
  const header = columns.map(([, label]) => label).join(' | ')
  pdf.text(header, 14, 23, { maxWidth: 270 })
  let y = 30
  for (const row of mappedRows(data, columns)) {
    if (y > 190) {
      pdf.addPage()
      y = 15
    }
    pdf.text(row.join(' | ').slice(0, 235), 14, y, { maxWidth: 270 })
    y += 6
  }
  pdf.save(filename)
}
