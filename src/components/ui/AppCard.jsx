export default function AppCard({ children, className = '', padding = 'md' }) {
  const paddings = {
    sm: 'p-3.5',
    md: 'p-4',
    lg: 'p-5',
  }

  return (
    <div
      className={[
        'rounded-2xl border border-[#E8EDF2] bg-white',
        paddings[padding],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
