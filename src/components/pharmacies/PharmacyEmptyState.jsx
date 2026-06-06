export default function PharmacyEmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryDisabled = false,
}) {
  return (
    <section className="rounded-2xl border border-dashed border-[#DDEAE7] bg-white px-6 py-12 text-center shadow-sm">
      {Icon ? <Icon className="mx-auto h-10 w-10 text-slate-300" /> : null}
      <h3 className="mt-4 text-base font-bold text-[#071A1D]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{message}</p>
      {(actionLabel || secondaryActionLabel) ? (
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center rounded-xl bg-[#00695C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              {actionLabel}
            </button>
          ) : null}
          {secondaryActionLabel ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              disabled={secondaryDisabled}
              className="inline-flex items-center justify-center rounded-xl border border-[#DDEAE7] bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {secondaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
