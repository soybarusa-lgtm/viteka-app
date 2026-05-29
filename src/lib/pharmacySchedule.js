const SCHEDULE_PREFIX = '__VITEKA_SCHEDULE_V1__'

export const SCHEDULE_DAYS = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'X' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' },
]

function buildEmptyDay() {
  return {
    enabled: false,
    ranges: [{ start: '', end: '' }],
  }
}

export function buildEmptyScheduleDetail() {
  return {
    days: Object.fromEntries(SCHEDULE_DAYS.map(day => [day.key, buildEmptyDay()])),
    options: {
      open_365: false,
      open_24h: false,
      local_holidays: false,
      regional_holidays: false,
      national_holidays: false,
    },
  }
}

export function cloneScheduleDetail(detail) {
  return JSON.parse(JSON.stringify(detail || buildEmptyScheduleDetail()))
}

function normalizeRange(range = {}) {
  const start = typeof range.start === 'string' ? range.start.trim() : ''
  const end = typeof range.end === 'string' ? range.end.trim() : ''

  if (!start || !end) return null

  return { start, end }
}

export function sanitizeScheduleDetail(detail) {
  const base = buildEmptyScheduleDetail()
  const sourceDays = detail?.days || {}

  for (const day of SCHEDULE_DAYS) {
    const sourceDay = sourceDays[day.key] || {}
    const ranges = Array.isArray(sourceDay.ranges)
      ? sourceDay.ranges.map(normalizeRange).filter(Boolean).slice(0, 2)
      : []

    base.days[day.key] = {
      enabled: Boolean(sourceDay.enabled) && ranges.length > 0,
      ranges: ranges.length > 0 ? ranges : [{ start: '', end: '' }],
    }
  }

  base.options = {
    open_365: Boolean(detail?.options?.open_365),
    open_24h: Boolean(detail?.options?.open_24h),
    local_holidays: Boolean(detail?.options?.local_holidays),
    regional_holidays: Boolean(detail?.options?.regional_holidays),
    national_holidays: Boolean(detail?.options?.national_holidays),
  }

  return base
}

export function hasStructuredSchedule(detail) {
  const clean = sanitizeScheduleDetail(detail)
  return SCHEDULE_DAYS.some(day => clean.days[day.key].enabled && clean.days[day.key].ranges.length > 0)
}

function rangesToText(ranges = []) {
  return ranges
    .map(range => `${range.start}-${range.end}`)
    .join(' / ')
}

export function formatScheduleSummary(detail, fallback = '') {
  if (!detail) return (fallback || '').trim()

  const clean = sanitizeScheduleDetail(detail)
  const segments = []
  let current = null

  for (const day of SCHEDULE_DAYS) {
    const config = clean.days[day.key]
    if (!config.enabled || config.ranges.length === 0) {
      if (current) {
        segments.push(current)
        current = null
      }
      continue
    }

    const times = rangesToText(config.ranges)
    if (current && current.times === times) {
      current.end = day
    } else {
      if (current) segments.push(current)
      current = { start: day, end: day, times }
    }
  }

  if (current) segments.push(current)

  if (segments.length === 0) return (fallback || '').trim()

  return segments
    .map(segment => {
      const dayLabel = segment.start.key === segment.end.key
        ? segment.start.short
        : `${segment.start.short}-${segment.end.short}`
      return `${dayLabel} ${segment.times}`
    })
    .join('; ')
}

export function getScheduleDayRows(detail) {
  const clean = sanitizeScheduleDetail(detail)

  return SCHEDULE_DAYS
    .map(day => {
      const config = clean.days[day.key]
      if (!config.enabled || config.ranges.length === 0) return null

      return {
        day: day.label,
        hours: rangesToText(config.ranges),
      }
    })
    .filter(Boolean)
}

function parseStructuredPayload(value) {
  if (typeof value !== 'string' || !value) return null

  const raw = value.startsWith(SCHEDULE_PREFIX)
    ? value.slice(SCHEDULE_PREFIX.length)
    : value

  if (!value.startsWith(SCHEDULE_PREFIX) && !raw.startsWith('{')) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (!('summary' in parsed) && !('days' in parsed) && !('guard_notes' in parsed) && !('options' in parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function parseScheduleValue(value) {
  const rawValue = typeof value === 'string' ? value : ''
  const payload = parseStructuredPayload(rawValue)

  if (!payload) {
    return {
      rawValue,
      isStructured: false,
      detail: null,
      summary: rawValue.trim(),
      guardNotes: '',
      options: buildEmptyScheduleDetail().options,
    }
  }

  const hasStructuredContent = Boolean(payload.days || payload.options)
  const detail = hasStructuredContent
    ? sanitizeScheduleDetail({ days: payload.days, options: payload.options })
    : null

  return {
    rawValue,
    isStructured: true,
    detail,
    summary: (payload.summary || formatScheduleSummary(detail) || '').trim(),
    guardNotes: (payload.guard_notes || '').trim(),
    options: detail?.options || buildEmptyScheduleDetail().options,
  }
}

export function getScheduleOptionLabels(detail) {
  const options = sanitizeScheduleDetail(detail).options
  const labels = []

  if (options.open_365) labels.push('365 días')
  if (options.open_24h) labels.push('24H')
  if (options.local_holidays) labels.push('Abre festivos locales')
  if (options.regional_holidays) labels.push('Abre festivos autonómicos')
  if (options.national_holidays) labels.push('Abre festivos nacionales')

  return labels
}

export function serializeScheduleValue({ detail, summary, rawValue = '', guardNotes = '' }) {
  const safeSummary = typeof summary === 'string' ? summary.trim() : ''
  const safeRawValue = typeof rawValue === 'string' ? rawValue.trim() : ''
  const safeGuardNotes = typeof guardNotes === 'string' ? guardNotes.trim() : ''
  const cleanDetail = detail ? sanitizeScheduleDetail(detail) : null
  const derivedSummary = cleanDetail ? formatScheduleSummary(cleanDetail) : ''
  const finalSummary = derivedSummary || safeSummary || (
    safeRawValue && !safeRawValue.startsWith(SCHEDULE_PREFIX) ? safeRawValue : ''
  )

  if (!finalSummary && !safeGuardNotes) return ''

  if (!hasStructuredSchedule(cleanDetail) && !safeGuardNotes && safeRawValue && !safeRawValue.startsWith(SCHEDULE_PREFIX)) {
    return safeRawValue
  }

  return `${SCHEDULE_PREFIX}${JSON.stringify({
    version: 1,
    summary: finalSummary,
    days: hasStructuredSchedule(cleanDetail) ? cleanDetail.days : null,
    options: cleanDetail?.options || buildEmptyScheduleDetail().options,
    guard_notes: safeGuardNotes,
  })}`
}
