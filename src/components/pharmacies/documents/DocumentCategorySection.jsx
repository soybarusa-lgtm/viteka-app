import PharmacySectionCard from '../PharmacySectionCard'

export default function DocumentCategorySection({
  title,
  count,
  pendingCount,
  isOpen,
  onToggle,
  children,
}) {
  const badges = pendingCount > 0
    ? [{ label: `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}`, className: 'bg-orange-50 text-orange-700' }]
    : []

  return (
    <PharmacySectionCard
      title={title}
      count={count}
      subtitle="Archivo operativo"
      badges={badges}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {children}
    </PharmacySectionCard>
  )
}
