export const DEFAULT_PHARMACY_STATUS = 'activo'

export const PHARMACY_STATUS_OPTIONS = [
  {
    value: 'lead',
    label: 'Lead',
    badgeClass: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  },
  {
    value: 'prospecto',
    label: 'Prospecto',
    badgeClass: 'bg-blue-700 text-white ring-1 ring-blue-700',
  },
  {
    value: 'oportunidad',
    label: 'Oportunidad',
    badgeClass: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  },
  {
    value: 'en_riesgo',
    label: 'En riesgo',
    badgeClass: 'bg-orange-500 text-white ring-1 ring-orange-500',
  },
  {
    value: 'activo',
    label: 'Activo',
    badgeClass: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  },
  {
    value: 'baja',
    label: 'Baja',
    badgeClass: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
  },
  {
    value: 'perdido',
    label: 'Perdido',
    badgeClass: 'bg-red-500 text-white ring-1 ring-red-500',
  },
]

export const PHARMACY_STATUS_VALUES = PHARMACY_STATUS_OPTIONS.map(option => option.value)

export function normalizePharmacyStatus(value, isActive = true) {
  if (PHARMACY_STATUS_VALUES.includes(value)) return value
  return isActive === false ? 'perdido' : DEFAULT_PHARMACY_STATUS
}

export function getPharmacyStatusOption(value, isActive = true) {
  const normalized = normalizePharmacyStatus(value, isActive)
  return PHARMACY_STATUS_OPTIONS.find(option => option.value === normalized) || PHARMACY_STATUS_OPTIONS[0]
}

export function isActiveCommercialStatus(value) {
  const normalized = normalizePharmacyStatus(value)
  return !['baja', 'perdido'].includes(normalized)
}
