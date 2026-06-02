export default function SupportPageHeader({ eyebrow = 'Soporte técnico', title, detail, actions }) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-950">{title}</h1>
        {detail && <p className="mt-1 max-w-3xl text-sm text-slate-500">{detail}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
