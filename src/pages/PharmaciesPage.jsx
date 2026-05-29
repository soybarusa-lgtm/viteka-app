import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import jsPDF from 'jspdf'
import { useAuth } from '../hooks/useAuth'
import { usePharmacies } from '../hooks/usePharmacies'
import { getScheduleDayRows, getScheduleOptionLabels } from '../lib/pharmacySchedule'
import {
  MagnifyingGlassIcon, PlusIcon, BuildingStorefrontIcon, MapPinIcon,
  Bars3Icon, ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

const PROVINCE_LABEL = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}
const LEGAL_LABEL = {
  autonomo: 'Autónomo', cb: 'C.B.', sl: 'S.L.',
  autonomo_sl: 'Autónomo + S.L.', cb_sl: 'C.B. + S.L.',
}

const DEFAULT_COLUMNS = [
  { key: 'pharmacy_name', label: 'Nombre de la farmacia' },
  { key: 'owners', label: 'Nombre del titular/es' },
  { key: 'province', label: 'Provincia' },
  { key: 'city', label: 'Población' },
  { key: 'postal_code', label: 'Código postal' },
  { key: 'workstations', label: 'Nº puestos' },
  { key: 'schedule', label: 'Horario' },
  { key: 'contact_phone', label: 'Teléfono' },
  { key: 'contact_email', label: 'Email' },
]

const EMPTY_VALUE = '—'

function getOwners(pharmacy) {
  const owners = []

  if (pharmacy.owner_name) owners.push(pharmacy.owner_name)

  if (Array.isArray(pharmacy.cb_owners)) {
    pharmacy.cb_owners.forEach(owner => {
      if (owner?.name) owners.push(owner.name)
    })
  }

  if (pharmacy.razon_social) owners.push(pharmacy.razon_social)

  return [...new Set(owners.filter(Boolean))].join(', ')
}

function getOwnerSummary(pharmacy) {
  const personalOwners = []

  if (pharmacy.owner_name) personalOwners.push(pharmacy.owner_name)

  if (Array.isArray(pharmacy.cb_owners)) {
    pharmacy.cb_owners.forEach(owner => {
      if (owner?.name) personalOwners.push(owner.name)
    })
  }

  const uniquePersonalOwners = [...new Set(personalOwners.filter(Boolean))]
  const legalNames = [...new Set([pharmacy.razon_social].filter(Boolean))]
  const primaryOwner = uniquePersonalOwners[0] || legalNames[0] || ''
  const extraOwners = uniquePersonalOwners.slice(primaryOwner === uniquePersonalOwners[0] ? 1 : 0)
  const extraLegalNames = primaryOwner === legalNames[0] ? legalNames.slice(1) : legalNames
  const hiddenCount = extraOwners.length + extraLegalNames.length

  return {
    primaryOwner,
    extraOwners,
    extraLegalNames,
    hiddenCount,
  }
}

function getWorkstations(pharmacy) {
  const value = pharmacy.equipment?.erp_detail?.puestos
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

function getColumnValue(pharmacy, key) {
  switch (key) {
    case 'pharmacy_name':
      return pharmacy.pharmacy_name || ''
    case 'owners':
      return getOwners(pharmacy)
    case 'province':
      return PROVINCE_LABEL[pharmacy.province] || pharmacy.province || ''
    case 'city':
      return pharmacy.city || ''
    case 'postal_code':
      return pharmacy.postal_code || ''
    case 'workstations':
      return getWorkstations(pharmacy)
    case 'schedule':
      return pharmacy.schedule || ''
    case 'contact_phone':
      return pharmacy.contact_phone || ''
    case 'contact_email':
      return pharmacy.contact_email || ''
    default:
      return ''
  }
}

function ScheduleTooltip({ pharmacy }) {
  const anchorRef = useRef(null)
  const tooltipRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })
  const scheduleRows = getScheduleDayRows(pharmacy.schedule_detail)
  const optionLabels = getScheduleOptionLabels(pharmacy.schedule_detail)
  const hasExtraInfo = scheduleRows.length > 0 || optionLabels.length > 0 || pharmacy.has_guards || pharmacy.schedule_guard_notes

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !tooltipRef.current) return undefined

    function updatePosition() {
      if (!anchorRef.current || !tooltipRef.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportPadding = 16
      const gap = 8

      let left = anchorRect.left
      if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - tooltipRect.width - viewportPadding
      }
      left = Math.max(viewportPadding, left)

      let top = anchorRect.bottom + gap
      if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
        top = anchorRect.top - tooltipRect.height - gap
      }
      top = Math.max(viewportPadding, top)

      setPosition({ top, left, ready: true })
    }

    const rafId = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, pharmacy])

  return (
    <div
      ref={anchorRef}
      className="max-w-[260px]"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="block truncate text-gray-500">
        {pharmacy.schedule || EMPTY_VALUE}
      </span>

      {hasExtraInfo && isOpen && createPortal(
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-[80] w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            opacity: position.ready ? 1 : 0,
          }}
        >
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Resumen</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{pharmacy.schedule || 'Sin horario informado'}</p>
            </div>

            {scheduleRows.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Detalle</p>
                <div className="mt-2 space-y-1.5">
                  {scheduleRows.map(row => (
                    <div key={row.day} className="grid grid-cols-[88px_1fr] gap-3 text-sm">
                      <span className="font-medium text-slate-600">{row.day}</span>
                      <span className="text-slate-700">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Apertura especial</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {optionLabels.length > 0 ? optionLabels.map(label => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {label}
                  </span>
                )) : (
                  <span className="text-sm text-slate-500">Sin aperturas especiales</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[88px_1fr] gap-3 text-sm">
              <span className="font-medium text-slate-600">Guardias</span>
              <span className={pharmacy.has_guards ? 'text-slate-700' : 'text-slate-500'}>
                {pharmacy.has_guards ? 'Sí' : 'No'}
              </span>
            </div>

            {pharmacy.schedule_guard_notes && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Indicaciones</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{pharmacy.schedule_guard_notes}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function OwnerTooltip({ pharmacy }) {
  const anchorRef = useRef(null)
  const tooltipRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })
  const ownerSummary = getOwnerSummary(pharmacy)
  const hasExtraInfo = ownerSummary.hiddenCount > 0

  useEffect(() => {
    if (!isOpen || !anchorRef.current || !tooltipRef.current) return undefined

    function updatePosition() {
      if (!anchorRef.current || !tooltipRef.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportPadding = 16
      const gap = 8

      let left = anchorRect.left
      if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
        left = window.innerWidth - tooltipRect.width - viewportPadding
      }
      left = Math.max(viewportPadding, left)

      let top = anchorRect.bottom + gap
      if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
        top = anchorRect.top - tooltipRect.height - gap
      }
      top = Math.max(viewportPadding, top)

      setPosition({ top, left, ready: true })
    }

    const rafId = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, pharmacy])

  if (!ownerSummary.primaryOwner) {
    return <span>{EMPTY_VALUE}</span>
  }

  return (
    <div
      ref={anchorRef}
      className="flex max-w-[320px] items-start gap-2"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="min-w-0 flex-1 truncate text-slate-700">{ownerSummary.primaryOwner}</span>

      {hasExtraInfo && (
        <>
          <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            +{ownerSummary.hiddenCount}
          </span>

          {isOpen && createPortal(
            <div
              ref={tooltipRef}
              className="pointer-events-none fixed z-[80] w-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                opacity: position.ready ? 1 : 0,
              }}
            >
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Titular principal</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{ownerSummary.primaryOwner}</p>
                </div>

                {ownerSummary.extraOwners.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Otros titulares</p>
                    <div className="mt-2 space-y-1.5">
                      {ownerSummary.extraOwners.map(owner => (
                        <p key={owner} className="text-sm text-slate-700">{owner}</p>
                      ))}
                    </div>
                  </div>
                )}

                {ownerSummary.extraLegalNames.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sociedad / C.B. / S.L.</p>
                    <div className="mt-2 space-y-1.5">
                      {ownerSummary.extraLegalNames.map(name => (
                        <p key={name} className="text-sm text-slate-700">{name}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  )
}

function compareValues(a, b, direction) {
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''

  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1

  const aNumber = Number(a)
  const bNumber = Number(b)
  const bothNumeric = !Number.isNaN(aNumber) && !Number.isNaN(bNumber)
  const result = bothNumeric
    ? aNumber - bNumber
    : String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true })

  return direction === 'asc' ? result : -result
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function downloadBlob(content, mimeType, fileName) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function SortIcon({ active, direction }) {
  if (!active) return <ChevronUpDownIcon className="w-3.5 h-3.5 text-gray-300" />
  return direction === 'asc'
    ? <ChevronUpIcon className="w-3.5 h-3.5 text-teal-600" />
    : <ChevronDownIcon className="w-3.5 h-3.5 text-teal-600" />
}

function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-3/5" />
        <div className="h-3 bg-gray-100 rounded w-2/5" />
      </div>
      <div className="h-5 w-14 bg-gray-100 rounded-full" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(DEFAULT_COLUMNS.length)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3.5 bg-gray-100 rounded w-4/5" />
        </td>
      ))}
    </tr>
  )
}

export default function PharmaciesPage() {
  const { profile } = useAuth()
  const { pharmacies, loading } = usePharmacies(profile?.company_id)
  const [search, setSearch] = useState('')
  const [filterProvince, setFilterProvince] = useState('')
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isExportFieldsOpen, setIsExportFieldsOpen] = useState(false)
  const [pendingExportType, setPendingExportType] = useState(null)
  const [selectedExportColumnKeys, setSelectedExportColumnKeys] = useState(DEFAULT_COLUMNS.map(column => column.key))
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [draggedColumnKey, setDraggedColumnKey] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'pharmacy_name', direction: 'asc' })

  const filtered = useMemo(() => pharmacies.filter(p => {
    const searchValue = [
      p.pharmacy_name,
      getOwners(p),
      PROVINCE_LABEL[p.province] || p.province,
      p.city,
      p.postal_code,
      p.schedule,
      p.contact_phone,
      p.contact_email,
    ].filter(Boolean).join(' ').toLowerCase()

    const matchSearch = searchValue.includes(search.toLowerCase())
    const matchProv = !filterProvince || p.province === filterProvince
    return matchSearch && matchProv
  }), [pharmacies, search, filterProvince])

  const sorted = useMemo(() => {
    const rows = [...filtered]
    if (!sortConfig.key) return rows

    rows.sort((a, b) => compareValues(
      getColumnValue(a, sortConfig.key),
      getColumnValue(b, sortConfig.key),
      sortConfig.direction,
    ))
    return rows
  }, [filtered, sortConfig])

  const provinces = useMemo(() => [...new Set(pharmacies.map(p => p.province).filter(Boolean))].sort(), [pharmacies])

  function buildFileName(ext) {
    const parts = ['farmacias']
    if (search.trim()) parts.push(search.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-'))
    if (filterProvince) parts.push(filterProvince)
    return `${parts.filter(Boolean).join('-')}.${ext}`
  }

  function getSelectedExportColumns(columnKeys = columns.map(column => column.key)) {
    const keySet = new Set(columnKeys)
    return columns.filter(column => keySet.has(column.key))
  }

  function buildExportDataset(columnKeys = columns.map(column => column.key)) {
    const selectedColumns = getSelectedExportColumns(columnKeys)
    const exportHeaders = selectedColumns.map(column => column.label)
    const exportRows = sorted.map(pharmacy => (
      Object.fromEntries(selectedColumns.map(column => [column.label, getColumnValue(pharmacy, column.key) || EMPTY_VALUE]))
    ))

    return { selectedColumns, exportHeaders, exportRows }
  }

  function serializeDelimitedRow(headers, row, delimiter) {
    return headers
      .map(header => `"${String(row[header]).replaceAll('"', '""')}"`)
      .join(delimiter)
  }

  function openExportFieldSelector(format) {
    setIsExportMenuOpen(false)
    setPendingExportType(format)
    setSelectedExportColumnKeys(columns.map(column => column.key))
    setIsExportFieldsOpen(true)
  }

  function closeExportFieldSelector() {
    setIsExportFieldsOpen(false)
    setPendingExportType(null)
  }

  function toggleExportColumn(columnKey) {
    setSelectedExportColumnKeys(prev => (
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    ))
  }

  function exportCsv(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const lines = [
      serializeDelimitedRow(exportHeaders, Object.fromEntries(exportHeaders.map(header => [header, header])), ','),
      ...exportRows.map(row => serializeDelimitedRow(exportHeaders, row, ',')),
    ]
    downloadBlob(lines.join('\n'), 'text/csv;charset=utf-8;', buildFileName('csv'))
  }

  function exportTxt(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const lines = [
      serializeDelimitedRow(exportHeaders, Object.fromEntries(exportHeaders.map(header => [header, header])), ';'),
      ...exportRows.map(row => serializeDelimitedRow(exportHeaders, row, ';')),
    ]
    downloadBlob(lines.join('\n'), 'text/plain;charset=utf-8;', buildFileName('txt'))
  }

  function exportExcel(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const table = `
      <table>
        <thead>
          <tr>${exportHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${exportRows.map(row => `<tr>${exportHeaders.map(header => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `
    const html = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>${table}</body>
      </html>
    `
    downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8;', buildFileName('xls'))
  }

  function exportPdf(columnKeys) {
    const { exportHeaders, exportRows } = buildExportDataset(columnKeys)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const left = 10
    const top = 12
    const bottom = 10
    const cellPadding = 1.6
    const lineHeight = 3.8
    const usableWidth = pageWidth - (left * 2)
    const colWidth = usableWidth / Math.max(exportHeaders.length, 1)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.text('Listado de farmacias', left, top)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(`Registros exportados: ${exportRows.length}`, pageWidth - 60, top)

    let currentY = top + 8

    function getRowMetrics(values, fontStyle) {
      pdf.setFont('helvetica', fontStyle)
      const linesByCell = values.map(value => pdf.splitTextToSize(String(value), colWidth - (cellPadding * 2)))
      const lineCount = Math.max(...linesByCell.map(lines => Math.max(lines.length, 1)))
      const height = Math.max((lineCount * lineHeight) + (cellPadding * 2), 8)
      return { linesByCell, height }
    }

    function drawTableRow(values, { fill = false, fontStyle = 'normal' } = {}) {
      const { linesByCell, height } = getRowMetrics(values, fontStyle)
      let currentX = left

      if (currentY + height > pageHeight - bottom) {
        pdf.addPage()
        currentY = 12
        drawHeader()
      }

      pdf.setFont('helvetica', fontStyle)
      values.forEach((_, index) => {
        if (fill) {
          pdf.setFillColor(243, 244, 246)
          pdf.rect(currentX, currentY, colWidth, height, 'F')
        }

        pdf.setDrawColor(209, 213, 219)
        pdf.rect(currentX, currentY, colWidth, height)
        pdf.text(linesByCell[index], currentX + cellPadding, currentY + cellPadding + lineHeight - 0.6)
        currentX += colWidth
      })

      currentY += height
    }

    function drawHeader() {
      let currentX = left
      pdf.setTextColor(55, 65, 81)
      currentX = left
      drawTableRow(exportHeaders, { fill: true, fontStyle: 'bold' })
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(75, 85, 99)
    }

    drawHeader()

    exportRows.forEach(row => {
      drawTableRow(exportHeaders.map(header => row[header]))
    })

    pdf.save(buildFileName('pdf'))
  }

  function confirmExport() {
    if (!pendingExportType || selectedExportColumnKeys.length === 0) return

    const actions = {
      excel: exportExcel,
      csv: exportCsv,
      txt: exportTxt,
      pdf: exportPdf,
    }

    const exportAction = actions[pendingExportType]
    closeExportFieldSelector()
    exportAction(selectedExportColumnKeys)
  }

  function handleSort(columnKey) {
    setSortConfig(prev => {
      if (prev.key !== columnKey) return { key: columnKey, direction: 'asc' }
      return { key: columnKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  function moveColumn(sourceKey, targetKey) {
    if (!sourceKey || sourceKey === targetKey) return

    setColumns(prev => {
      const sourceIndex = prev.findIndex(column => column.key === sourceKey)
      const targetIndex = prev.findIndex(column => column.key === targetKey)
      if (sourceIndex === -1 || targetIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Farmacias</h1>
          <p className="text-xs md:text-sm text-gray-500">
            {loading ? '…' : `${pharmacies.length} registradas`}
          </p>
        </div>
        <Link
          to="/farmacias/nueva"
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva farmacia</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterProvince}
          onChange={e => setFilterProvince(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[140px]"
        >
          <option value="">Todas</option>
          {provinces.map(p => (
            <option key={p} value={p}>{PROVINCE_LABEL[p] || p}</option>
          ))}
        </select>
        <div className="relative lg:ml-auto">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(prev => !prev)}
            disabled={loading || sorted.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Extraer
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {isExportMenuOpen && !loading && sorted.length > 0 && (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => openExportFieldSelector('excel')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Excel
              </button>
              <button
                type="button"
                onClick={() => openExportFieldSelector('csv')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => openExportFieldSelector('txt')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                TXT (;)
              </button>
              <button
                type="button"
                onClick={() => openExportFieldSelector('pdf')}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {isExportFieldsOpen && !loading && sorted.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 px-4" onClick={closeExportFieldSelector}>
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Extraer farmacias</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecciona si quieres exportar todas las columnas o solo algunas en formato <span className="font-medium text-gray-700">{pendingExportType?.toUpperCase()}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={closeExportFieldSelector}
                className="rounded-lg px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedExportColumnKeys(columns.map(column => column.key))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
              >
                Todas las columnas
              </button>
              <button
                type="button"
                onClick={() => setSelectedExportColumnKeys([])}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-teal-300 hover:bg-teal-50"
              >
                Limpiar selección
              </button>
            </div>

            <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3">
              {columns.map(column => (
                <label key={column.key} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedExportColumnKeys.includes(column.key)}
                    onChange={() => toggleExportColumn(column.key)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>{column.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {selectedExportColumnKeys.length} campo(s) seleccionado(s)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeExportFieldSelector}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmExport}
                  disabled={selectedExportColumnKeys.length === 0}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Extraer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <>
          <div className="md:hidden space-y-2">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto overflow-y-visible rounded-xl">
              <table className="w-full min-w-[1280px] text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {DEFAULT_COLUMNS.map(column => (
                      <th key={column.key} className="text-left px-4 py-3 font-medium text-gray-600">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto">
            <BuildingStorefrontIcon className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {search || filterProvince ? 'No hay resultados para tu búsqueda' : 'Aún no hay farmacias'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search || filterProvince
                ? 'Prueba con otros términos o limpia los filtros'
                : 'Empieza añadiendo la primera farmacia'}
            </p>
          </div>
          {!search && !filterProvince && (
            <Link
              to="/farmacias/nueva"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Nueva farmacia
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-2">
            {sorted.map(ph => (
              <Link
                key={ph.id}
                to={`/farmacias/${ph.id}`}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                  <BuildingStorefrontIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ph.pharmacy_name}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPinIcon className="w-3 h-3 shrink-0" />
                    <span>{[ph.city, PROVINCE_LABEL[ph.province] || ph.province].filter(Boolean).join(', ') || EMPTY_VALUE}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{getOwners(ph) || 'Sin titular informado'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ph.contact_phone || EMPTY_VALUE} · {ph.contact_email || EMPTY_VALUE}</p>
                </div>
                <span className={`mt-1 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  ph.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {ph.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden md:block rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto overflow-y-visible rounded-xl">
              <table className="w-full min-w-[1280px] text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {columns.map(column => {
                      const isActiveSort = sortConfig.key === column.key
                      return (
                        <th
                          key={column.key}
                          draggable
                          onDragStart={() => setDraggedColumnKey(column.key)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => moveColumn(draggedColumnKey, column.key)}
                          onDragEnd={() => setDraggedColumnKey(null)}
                          className={`group select-none whitespace-nowrap px-4 py-3 text-left font-medium text-gray-600 ${
                            draggedColumnKey === column.key ? 'bg-teal-50' : ''
                          }`}
                          title="Pulsa para ordenar. Arrastra el encabezado para mover la columna."
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSort(column.key)}
                              className="inline-flex items-center gap-1.5 hover:text-teal-700 focus:outline-none"
                            >
                              <span>{column.label}</span>
                              <SortIcon active={isActiveSort} direction={sortConfig.direction} />
                            </button>
                            <Bars3Icon className="w-3.5 h-3.5 cursor-grab text-gray-300 group-hover:text-gray-500" />
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(ph => (
                    <tr key={ph.id} className="hover:bg-gray-50 transition-colors">
                      {columns.map(column => {
                        const value = getColumnValue(ph, column.key)
                        return (
                          <td key={column.key} className="px-4 py-3 text-gray-500 align-top">
                            {column.key === 'pharmacy_name' ? (
                              <Link to={`/farmacias/${ph.id}`} className="font-medium text-teal-700 hover:underline">
                                {value || EMPTY_VALUE}
                              </Link>
                            ) : column.key === 'contact_email' && value ? (
                              <a href={`mailto:${value}`} className="text-teal-700 hover:underline">{value}</a>
                            ) : column.key === 'contact_phone' && value ? (
                              <a href={`tel:${value}`} className="text-teal-700 hover:underline">{value}</a>
                            ) : column.key === 'schedule' ? (
                              <ScheduleTooltip pharmacy={ph} />
                            ) : column.key === 'owners' ? (
                              <OwnerTooltip pharmacy={ph} />
                            ) : (
                              value || EMPTY_VALUE
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
