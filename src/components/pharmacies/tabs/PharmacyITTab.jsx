import { useEffect, useMemo, useState } from 'react'
import {
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ServerIcon,
  ShieldCheckIcon,
  WifiIcon,
} from '@heroicons/react/24/outline'
import { IT_TYPES } from '../../pharmacy/PHARMACY_CONSTANTS'
import PharmacyEmptyState from '../PharmacyEmptyState'
import PharmacyModuleHeader from '../PharmacyModuleHeader'
import PharmacyModuleToolbar from '../PharmacyModuleToolbar'
import ITCategoryCard from '../it/ITCategoryCard'
import ITEquipmentCard from '../it/ITEquipmentCard'

const IT_LABEL = Object.fromEntries(IT_TYPES.map(type => [type.value, type.label]))

function resolveBrand(device) {
  const specs = device?.specs || {}
  return [specs.marca || device?.brand || '', specs.modelo || device?.model || '']
    .filter(Boolean)
    .join(' / ')
}

function getPrimaryIp(device) {
  const ips = Array.isArray(device?.specs?.ip) ? device.specs.ip.filter(Boolean) : []
  return ips[0] || ''
}

function getSupportLabel(device) {
  return device?.specs?.provider || device?.specs?.contact_name || device?.serial_number || ''
}

function hasAlert(device) {
  const missingIdentity = !device?.label && !resolveBrand(device)
  const missingDates = !device?.install_date || (device?.is_viteka && !device?.warranty_end)
  const missingNetwork = ['servidor', 'estacion', 'router'].includes(device?.device_type) && !getPrimaryIp(device)
  return missingIdentity || missingDates || missingNetwork
}

function matchesFilter(device, quickFilter, selectedType) {
  if (quickFilter === 'viteka') return Boolean(device.is_viteka)
  if (quickFilter === 'alerts') return hasAlert(device)
  if (quickFilter === 'no-dates') return !device.install_date && !device.warranty_end
  if (quickFilter === 'type') return !selectedType || device.device_type === selectedType
  return true
}

export default function PharmacyITTab({
  devices = [],
  loading,
  onCreate,
  onOpenLegacy,
  onCreateTicket,
}) {
  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [selectedType, setSelectedType] = useState('')
  const [openSections, setOpenSections] = useState({})

  const metrics = useMemo(() => {
    const alertCount = devices.filter(hasAlert).length
    const routerCount = devices.filter(device => device.device_type === 'router').length
    return [
      { label: 'Total', value: devices.length, hint: 'equipos registrados', icon: ComputerDesktopIcon },
      { label: 'Viteka', value: devices.filter(device => device.is_viteka).length, hint: 'gestionados por Viteka', icon: ShieldCheckIcon, tone: 'success' },
      { label: 'Alertas', value: alertCount, hint: alertCount > 0 ? 'revisar datos críticos' : 'sin incidencias técnicas', icon: ExclamationTriangleIcon, tone: alertCount > 0 ? 'warning' : 'default' },
      { label: 'Router', value: routerCount, hint: routerCount > 0 ? 'routers activos' : 'sin routers registrados', icon: WifiIcon, tone: 'info' },
    ]
  }, [devices])

  const visibleDevices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return devices.filter(device => {
      const haystack = [
        IT_LABEL[device.device_type] || device.device_type,
        device.label,
        resolveBrand(device),
        getPrimaryIp(device),
        getSupportLabel(device),
      ].filter(Boolean).join(' ').toLocaleLowerCase('es')

      return (!normalizedQuery || haystack.includes(normalizedQuery))
        && matchesFilter(device, quickFilter, selectedType)
    })
  }, [devices, query, quickFilter, selectedType])

  const groups = useMemo(() => {
    const knownTypes = new Set(IT_TYPES.map(type => type.value))
    const groupedMap = visibleDevices.reduce((acc, device) => {
      const key = knownTypes.has(device.device_type) ? device.device_type : 'otros'
      if (!acc[key]) acc[key] = []
      acc[key].push(device)
      return acc
    }, {})

    return Object.entries(groupedMap).map(([type, items]) => ({
      type,
      label: type === 'otros' ? 'Otros tipos existentes' : (IT_LABEL[type] || type),
      items,
      vitekaCount: items.filter(item => item.is_viteka).length,
      alertCount: items.filter(hasAlert).length,
    }))
  }, [visibleDevices])

  useEffect(() => {
    setOpenSections(prev => {
      const next = { ...prev }
      groups.forEach(group => {
        if (typeof next[group.type] === 'undefined') {
          next[group.type] = group.alertCount > 0 || group.vitekaCount > 0 || group.items.length <= 2
        }
      })
      return next
    })
  }, [groups])

  const toolbarFilters = [
    { value: 'all', label: 'Todos' },
    { value: 'viteka', label: 'Viteka' },
    { value: 'alerts', label: 'Alertas' },
    { value: 'no-dates', label: 'Sin fechas' },
    { value: 'type', label: 'Tipo' },
  ]

  if (loading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Informática operativa"
        subtitle="Control técnico por tipo, criticidad y soporte. La vista es compacta y las acciones profundas siguen disponibles en la edición completa."
        metrics={metrics}
        actionLabel="+ Añadir equipo"
        actionIcon={PlusIcon}
        onAction={onCreate}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar equipo, marca, IP o ubicación..."
        filters={toolbarFilters}
        activeFilter={quickFilter}
        onFilterChange={value => {
          setQuickFilter(value)
          if (value !== 'type') setSelectedType('')
        }}
        rightSlot={quickFilter === 'type' ? (
          <select
            value={selectedType}
            onChange={event => setSelectedType(event.target.value)}
            className="rounded-xl border border-[#DDEAE7] px-3 py-2 text-sm text-slate-600 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">Todos los tipos</option>
            {IT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        ) : null}
      />

      {groups.length === 0 ? (
        <PharmacyEmptyState
          icon={ComputerDesktopIcon}
          title={devices.length === 0 ? 'No hay equipos informáticos registrados.' : 'No hay equipos con esos filtros.'}
          message={devices.length === 0 ? 'Añade el primer equipo o abre la edición completa si necesitas capturar una ficha más técnica.' : 'Prueba otra búsqueda o cambia el filtro activo.'}
          actionLabel="Añadir equipo"
          onAction={onCreate}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <ITCategoryCard
              key={group.type}
              title={group.label}
              count={group.items.length}
              vitekaCount={group.vitekaCount}
              alertCount={group.alertCount}
              isOpen={openSections[group.type] !== false}
              onToggle={() => setOpenSections(prev => ({ ...prev, [group.type]: prev[group.type] === false }))}
              onAdd={onCreate}
            >
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {group.items.map(device => (
                  <ITEquipmentCard
                    key={device.id}
                    title={device.label || IT_LABEL[device.device_type] || 'Equipo'}
                    typeLabel={IT_LABEL[device.device_type] || device.device_type || 'Otro'}
                    brandModel={resolveBrand(device)}
                    location={device.specs?.location || '—'}
                    ip={getPrimaryIp(device) || '—'}
                    reviewDate={device.install_date || device.warranty_end || '—'}
                    support={getSupportLabel(device) || '—'}
                    status={hasAlert(device) ? 'Revisar ficha' : 'Operativo'}
                    isViteka={Boolean(device.is_viteka)}
                    hasMissingDates={!device.install_date && !device.warranty_end}
                    onView={() => onOpenLegacy(device)}
                    onEdit={() => onOpenLegacy(device)}
                    onTicket={() => onCreateTicket(device)}
                  />
                ))}
              </div>
            </ITCategoryCard>
          ))}
        </div>
      )}
    </div>
  )
}
