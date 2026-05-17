export default function AppTextarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={[
        'w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#005643] focus:ring-2 focus:ring-[#005643]/10',
        className,
      ].join(' ')}
    />
  )
}
