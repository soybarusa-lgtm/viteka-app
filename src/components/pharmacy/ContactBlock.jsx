import { useEffect, useMemo, useState } from 'react'
import { ClockIcon, PlusIcon, Squares2X2Icon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Label, Input, Select, Textarea } from './PharmacyFormAtoms'
import {
  buildEmptyScheduleDetail,
  cloneScheduleDetail,
  formatScheduleSummary,
  getScheduleOptionLabels,
  sanitizeScheduleDetail,
  SCHEDULE_DAYS,
} from '../../lib/pharmacySchedule'

const PROVINCES = [
  { value: 'almeria', label: 'Almería' }, { value: 'cadiz', label: 'Cádiz' },
  { value: 'cordoba', label: 'Córdoba' }, { value: 'granada', label: 'Granada' },
  { value: 'huelva', label: 'Huelva' }, { value: 'jaen', label: 'Jaén' },
  { value: 'malaga', label: 'Málaga' }, { value: 'sevilla', label: 'Sevilla' },
]

function ScheduleEditorModal({ isOpen, value, fallbackSummary, onClose, onApply }) {
  const [draft, setDraft] = useState(() => cloneScheduleDetail(value || buildEmptyScheduleDetail()))

  useEffect(() => {
    if (!isOpen) return
    setDraft(cloneScheduleDetail(value || buildEmptyScheduleDetail()))
  }, [isOpen, value])

  const summary = useMemo(() => formatScheduleSummary(draft, fallbackSummary), [draft, fallbackSummary])

  const filledSourcesByDay = useMemo(() => {
    const clean = sanitizeScheduleDetail(draft)
    return SCHEDULE_DAYS.reduce((acc, day) => {
      acc[day.key] = SCHEDULE_DAYS.filter(sourceDay => {
        if (sourceDay.key === day.key) return false
        const config = clean.days[sourceDay.key]
        return config.enabled && config.ranges.some(range => range.start && range.end)
      })
      return acc
    }, {})
  }, [draft])

  if (!isOpen) return null

  function setDayEnabled(dayKey, enabled) {
    setDraft(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayKey]: {
          enabled,
          ranges: enabled
            ? (prev.days?.[dayKey]?.ranges?.length ? prev.days[dayKey].ranges : [{ start: '', end: '' }])
            : [{ start: '', end: '' }],
        },
      },
    }))
  }

  function setRange(dayKey, index, field, nextValue) {
    setDraft(prev => {
      const day = prev.days?.[dayKey] || { enabled: true, ranges: [{ start: '', end: '' }] }
      const ranges = [...(day.ranges || [{ start: '', end: '' }])]
      ranges[index] = { ...(ranges[index] || { start: '', end: '' }), [field]: nextValue }
      return {
        ...prev,
        days: {
          ...prev.days,
          [dayKey]: { ...day, enabled: true, ranges },
        },
      }
    })
  }

  function addRange(dayKey) {
    setDraft(prev => {
      const day = prev.days?.[dayKey] || { enabled: true, ranges: [{ start: '', end: '' }] }
      if ((day.ranges || []).length >= 2) return prev
      return {
        ...prev,
        days: {
          ...prev.days,
          [dayKey]: {
            ...day,
            enabled: true,
            ranges: [...(day.ranges || [{ start: '', end: '' }]), { start: '', end: '' }],
          },
        },
      }
    })
  }

  function removeRange(dayKey, index) {
    setDraft(prev => {
      const day = prev.days?.[dayKey] || { enabled: true, ranges: [{ start: '', end: '' }] }
      const nextRanges = (day.ranges || []).filter((_, rangeIndex) => rangeIndex !== index)
      return {
        ...prev,
        days: {
          ...prev.days,
          [dayKey]: {
            ...day,
            enabled: nextRanges.length > 0,
            ranges: nextRanges.length > 0 ? nextRanges : [{ start: '', end: '' }],
          },
        },
      }
    })
  }

  function copyDayFrom(targetDayKey, sourceDayKey) {
    setDraft(prev => {
      const sourceDay = prev.days?.[sourceDayKey]
      if (!sourceDay) return prev

      return {
        ...prev,
        days: {
          ...prev.days,
          [targetDayKey]: {
            enabled: true,
            ranges: (sourceDay.ranges || []).map(range => ({ ...range })),
          },
        },
      }
    })
  }

  function handleApply() {
    onApply(sanitizeScheduleDetail(draft), formatScheduleSummary(draft))
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Configurar horario</h3>
            <p className="mt-1 text-sm text-gray-500">Define los días de apertura y los tramos horarios al estilo ficha de empresa.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar horario"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          <div className="space-y-3">
            {SCHEDULE_DAYS.map(day => {
              const config = draft.days?.[day.key] || { enabled: false, ranges: [{ start: '', end: '' }] }
              const sourceDays = filledSourcesByDay[day.key] || []
              return (
                <div key={day.key} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={event => setDayEnabled(day.key, event.target.checked)}
                        className="h-4 w-4 accent-teal-600"
                      />
                      {day.label}
                    </label>

                    {config.enabled ? (
                      <div className="w-full space-y-2 md:max-w-xl">
                        {sourceDays.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Copiar de</span>
                            {sourceDays.map(sourceDay => (
                              <button
                                key={`${day.key}_${sourceDay.key}`}
                                type="button"
                                onClick={() => copyDayFrom(day.key, sourceDay.key)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-teal-300 hover:text-teal-700"
                              >
                                <Squares2X2Icon className="h-3.5 w-3.5" />
                                {sourceDay.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {(config.ranges || []).map((range, index) => (
                          <div key={`${day.key}_${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
                            <input
                              type="time"
                              value={range.start || ''}
                              onChange={event => setRange(day.key, index, 'start', event.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">a</span>
                            <input
                              type="time"
                              value={range.end || ''}
                              onChange={event => setRange(day.key, index, 'end', event.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <div className="flex items-center justify-end gap-2">
                              {index === 0 && (config.ranges || []).length < 2 && (
                                <button
                                  type="button"
                                  onClick={() => addRange(day.key)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                  Tramo
                                </button>
                              )}
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => removeRange(day.key, index)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Quitar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Cerrado</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumen</p>
            <p className={`mt-1 text-sm ${summary ? 'text-slate-700' : 'text-slate-400'}`}>
              {summary || 'Todavía no hay horario definido.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Aplicar horario
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContactBlock({ data, onChange, showGuardsAndSchedule = false, showSoe = false }) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const f = field => event => onChange(field, event?.target !== undefined ? event.target.value : event)

  const scheduleSummary = useMemo(() => {
    if (data.schedule) return data.schedule
    return formatScheduleSummary(data.schedule_detail)
  }, [data.schedule, data.schedule_detail])

  const optionLabels = useMemo(
    () => getScheduleOptionLabels(data.schedule_detail),
    [data.schedule_detail]
  )

  function handleApplySchedule(scheduleDetail, summary) {
    onChange('schedule_detail', scheduleDetail)
    onChange('schedule', summary)
    onChange('schedule_raw', '')
    setIsScheduleOpen(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Teléfono</Label>
          <Input value={data.phone} onChange={f('phone')} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={data.email} onChange={f('email')} />
        </div>

        <div className="sm:col-span-2">
          <Label>Dirección</Label>
          <Input value={data.address} onChange={f('address')} />
        </div>

        <div>
          <Label>Provincia</Label>
          <Select value={data.province} onChange={f('province')}>
            <option value="">Seleccionar...</option>
            {PROVINCES.map(province => (
              <option key={province.value} value={province.value}>
                {province.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Población</Label>
          <Input value={data.city} onChange={f('city')} />
        </div>

        <div>
          <Label>C.P.</Label>
          <Input value={data.postal_code} onChange={f('postal_code')} />
        </div>

        {showSoe && (
          <div>
            <Label>SOE</Label>
            <Input value={data.soe} onChange={f('soe')} />
          </div>
        )}

        {showGuardsAndSchedule && (
          <>
            <div className={showSoe ? '' : 'sm:col-span-2'}>
              <Label>Horario</Label>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-sm transition-colors hover:border-teal-400 hover:bg-teal-50/40"
              >
                <span className={`min-w-0 truncate pr-3 ${scheduleSummary ? 'text-gray-700' : 'text-gray-400'}`}>
                  {scheduleSummary || 'Configurar horario'}
                </span>
                <ClockIcon className="h-4 w-4 shrink-0 text-teal-600" />
              </button>
              {optionLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {optionLabels.map(label => (
                    <span
                      key={label}
                      className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                    >
                      <span className="truncate">{label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-slate-50/70 p-4">
              <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
                {[
                  ['open_365', '365 días'],
                  ['open_24h', '24H'],
                  ['local_holidays', 'Festivos locales'],
                  ['regional_holidays', 'Festivos autonómicos'],
                  ['national_holidays', 'Festivos nacionales'],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(data.schedule_detail?.options?.[key])}
                      onChange={event => {
                        const nextDetail = sanitizeScheduleDetail(data.schedule_detail || buildEmptyScheduleDetail())
                        nextDetail.options[key] = event.target.checked
                        onChange('schedule_detail', nextDetail)
                      }}
                      className="h-4 w-4 shrink-0 accent-teal-600"
                    />
                    <span className="leading-tight">{label}</span>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  id={`guards_${data.__key}`}
                  checked={data.has_guards}
                  onChange={event => onChange('has_guards', event.target.checked)}
                  className="h-4 w-4 accent-teal-600"
                />
                Hace guardias
              </label>

              {data.has_guards && (
                <div className="mt-3">
                  <Label>Indicaciones de las guardias</Label>
                  <Textarea
                    value={data.guard_notes || ''}
                    onChange={f('guard_notes')}
                    placeholder="Ej.: rotacion semanal, guardias de 24h, festivos, telefono de urgencia..."
                  />
                </div>
              )}
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <Label>Observaciones</Label>
          <Textarea value={data.observations} onChange={f('observations')} />
        </div>
      </div>

      <ScheduleEditorModal
        isOpen={isScheduleOpen}
        value={data.schedule_detail}
        fallbackSummary={data.schedule_raw || data.schedule}
        onClose={() => setIsScheduleOpen(false)}
        onApply={handleApplySchedule}
      />
    </>
  )
}
