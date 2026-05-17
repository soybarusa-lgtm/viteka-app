export default function AppButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  className = '',
}) {
  const variants = {
    primary: 'bg-[#005643] text-white hover:bg-[#00442f] active:bg-[#003827]',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  }

  const sizes = {
    sm: 'h-9 px-3 text-[13px] rounded-lg',
    md: 'h-11 px-4 text-sm rounded-xl',
    lg: 'h-12 px-5 text-sm rounded-xl',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#005643]/20 disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
