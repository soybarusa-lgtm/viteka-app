export default function PharmacyMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}) {
  const tones = {
    default: {
      card: 'border-[#DDEAE7] bg-white',
      icon: 'bg-slate-100 text-slate-600',
      value: 'text-[#071A1D]',
      label: 'text-slate-500',
      hint: 'text-slate-400',
    },
    success: {
      card: 'border-teal-200 bg-teal-50/40',
      icon: 'bg-teal-100 text-teal-700',
      value: 'text-teal-900',
      label: 'text-teal-700',
      hint: 'text-teal-700/70',
    },
    info: {
      card: 'border-blue-100 bg-blue-50/60',
      icon: 'bg-blue-100 text-blue-700',
      value: 'text-blue-900',
      label: 'text-blue-700',
      hint: 'text-blue-700/70',
    },
    warning: {
      card: 'border-orange-200 bg-orange-50',
      icon: 'bg-orange-100 text-orange-700',
      value: 'text-orange-900',
      label: 'text-orange-700',
      hint: 'text-orange-700/70',
    },
  }

  const palette = tones[tone] || tones.default

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${palette.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${palette.label}`}>
            {label}
          </p>
          <p className={`mt-2 text-2xl font-extrabold ${palette.value}`}>
            {value ?? 0}
          </p>
          {hint ? <p className={`mt-1 text-xs ${palette.hint}`}>{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={`rounded-xl p-2.5 ${palette.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </article>
  )
}
