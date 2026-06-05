export default function ConfigCard({ title, description, children, badge }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
        {badge && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">{badge}</span>}
      </div>
      {children}
    </section>
  )
}
