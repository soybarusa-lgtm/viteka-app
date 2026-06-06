import { PlusIcon } from '@heroicons/react/24/outline'
import PharmacySectionCard from '../PharmacySectionCard'

export default function ITCategoryCard({
  title,
  count,
  vitekaCount,
  alertCount,
  isOpen,
  onToggle,
  onAdd,
  children,
}) {
  const badges = [
    vitekaCount > 0
      ? { label: `${vitekaCount} Viteka`, className: 'bg-teal-50 text-teal-700' }
      : null,
    alertCount > 0
      ? { label: `${alertCount} alerta${alertCount === 1 ? '' : 's'}`, className: 'bg-orange-50 text-orange-700' }
      : null,
  ].filter(Boolean)

  return (
    <PharmacySectionCard
      title={title}
      count={count}
      subtitle="Categoría operativa"
      badges={badges}
      actionLabel="Añadir equipo"
      actionIcon={PlusIcon}
      onAction={onAdd}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {children}
    </PharmacySectionCard>
  )
}
