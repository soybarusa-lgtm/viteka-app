import { useEffect, useMemo, useState } from 'react'
import {
  PencilSquareIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import EditEquipmentModal from '../../pharmacy/EditEquipmentModal'
import PharmacyEditDrawer from '../../pharmacy/PharmacyEditDrawer'
import PharmacyModuleHeader from '../PharmacyModuleHeader'
import PharmacyModuleToolbar from '../PharmacyModuleToolbar'
import PharmacySectionCard from '../PharmacySectionCard'

const EQUIPMENT_SECTIONS = [
  { key: 'erp', title: 'ERP', summary: equipment => equipment?.erp || '' },
  { key: 'caja', title: 'Caja de cobro', summary: equipment => equipment?.caja || '' },
  { key: 'esl', title: 'Etiquetas ESL', summary: equipment => equipment?.esl || '' },
  { key: 'bascula', title: 'Bascula', summary: equipment => equipment?.bascula || '' },
  { key: 'antihurto', title: 'Antihurto', summary: equipment => equipment?.antihurto || '' },
  { key: 'consultoria', title: 'Consultoria', summary: equipment => equipment?.consultoria || '' },
  { key: 'robot', title: 'Robot', summary: equipment => equipment?.robot || '' },
  { key: 'cruz', title: 'Cruz luminosa', summary: equipment => equipment?.cruz || '' },
  { key: 'gestor_turnos', title: 'Gestor de turnos', summary: equipment => equipment?.gestor_turnos || equipment?.gestor_turnos_marca || '' },
  { key: 'spd', title: 'SPD', summary: equipment => equipment?.spd || equipment?.spd_marca || '' },
  { key: 'pantallas', title: 'Pantallas', summary: equipment => equipment?.pantallas || '' },
  { key: 'frigorifico', title: 'Frigorifico', summary: equipment => equipment?.frigorifico_marca || '' },
]

function equipmentLabel(value) {
  if (!value) return ''
  if (String(value).toUpperCase() === 'NO') return ''
  if (String(value).toUpperCase() === 'SI') return 'Activo'
  return String(value)
}

function buildSectionLines(sectionKey, equipment) {
  switch (sectionKey) {
    case 'erp':
      return [
        ['Producto', equipmentLabel(equipment?.erp)],
        ['Licencia', equipment?.erp_detail?.licencia],
        ['Puestos', equipment?.erp_detail?.puestos],
        ['Inicio', equipment?.erp_detail?.year],
      ]
    case 'caja':
      return [
        ['Producto', equipmentLabel(equipment?.caja)],
        ['Modelo', equipment?.caja_modelo],
        ['Ano', equipment?.caja_year],
      ]
    case 'esl':
      return [['Producto', equipmentLabel(equipment?.esl)], ['Ano', equipment?.esl_year]]
    case 'bascula':
      return [['Producto', equipmentLabel(equipment?.bascula)], ['Ano', equipment?.bascula_year]]
    case 'antihurto':
      return [['Producto', equipmentLabel(equipment?.antihurto)], ['Ano', equipment?.antihurto_year]]
    case 'consultoria':
      return [['Producto', equipmentLabel(equipment?.consultoria)]]
    case 'robot':
      return [['Producto', equipmentLabel(equipment?.robot)], ['Ano', equipment?.robot_year]]
    case 'cruz':
      return [['Cantidad', equipment?.cruz_cantidad], ['Ampliacion', equipment?.cruz_ampliacion]]
    case 'gestor_turnos':
      return [['Marca', equipment?.gestor_turnos_marca], ['Ano', equipment?.gestor_turnos_year]]
    case 'spd':
      return [['Marca', equipment?.spd_marca], ['Ano', equipment?.spd_year]]
    case 'pantallas':
      return [['Marca', equipment?.pantallas_detail?.marca], ['Ano', equipment?.pantallas_detail?.year]]
    case 'frigorifico':
      return [['Marca', equipment?.frigorifico_marca], ['Ano', equipment?.frigorifico_year]]
    default:
      return []
  }
}

export default function PharmacyEquipmentTab({
  pharmacy,
  equipment,
  onSaved,
  startEditing = false,
}) {
  const [query, setQuery] = useState('')
  const [drawerSection, setDrawerSection] = useState('')
  const [openSections, setOpenSections] = useState(
    Object.fromEntries(EQUIPMENT_SECTIONS.map(section => [section.key, true])),
  )

  const visibleSections = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return EQUIPMENT_SECTIONS.filter(section => {
      if (!needle) return true
      const haystack = [
        section.title,
        section.summary(equipment),
        ...buildSectionLines(section.key, equipment).flat(),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(needle)
    })
  }, [equipment, query])

  const activeCount = useMemo(
    () => EQUIPMENT_SECTIONS.filter(section => equipmentLabel(section.summary(equipment))).length,
    [equipment],
  )

  const managedByViteka = useMemo(() => {
    const flags = [
      equipment?.erp_viteka,
      equipment?.caja_viteka,
      equipment?.esl_viteka,
      equipment?.bascula_viteka,
      equipment?.consultoria_viteka,
      equipment?.frigorifico_viteka,
    ]
    return flags.filter(Boolean).length
  }, [equipment])

  const metrics = [
    { label: 'Productos activos', value: activeCount, hint: 'equipamientos con dato informado', icon: Squares2X2Icon },
    { label: 'Viteka', value: managedByViteka, hint: 'distribucion o soporte con Viteka', icon: ShieldCheckIcon, tone: 'success' },
    { label: 'ERP', value: equipmentLabel(equipment?.erp) || 'Sin ERP', hint: equipment?.erp_detail?.puestos ? `${equipment.erp_detail.puestos} puestos` : 'sin puestos informados', icon: WrenchScrewdriverIcon, tone: 'info' },
    { label: 'Caja', value: equipmentLabel(equipment?.caja) || 'Sin caja', hint: equipment?.caja_modelo || 'sin modelo', icon: WrenchScrewdriverIcon, tone: 'default' },
  ]

  useEffect(() => {
    if (!startEditing) return undefined
    const frameId = window.requestAnimationFrame(() => {
      setDrawerSection(current => current || 'erp')
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [startEditing])

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Equipamiento"
        subtitle="Catalogo funcional de la farmacia con una sola vista operativa y edicion por drawer para cada bloque."
        metrics={metrics}
        actionLabel="Editar equipamiento"
        actionIcon={PencilSquareIcon}
        onAction={() => setDrawerSection('erp')}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar producto, marca, modelo o ano..."
      />

      <div className="space-y-4">
        {visibleSections.map(section => {
          const summary = equipmentLabel(section.summary(equipment))
          const lines = buildSectionLines(section.key, equipment).filter(([, value]) => value)
          return (
            <PharmacySectionCard
              key={section.key}
              title={section.title}
              subtitle={summary ? `Estado actual: ${summary}` : 'Sin datos informados'}
              isOpen={openSections[section.key]}
              onToggle={() => setOpenSections(current => ({ ...current, [section.key]: !current[section.key] }))}
              actionLabel="Editar"
              actionIcon={PencilSquareIcon}
              onAction={() => setDrawerSection(section.key)}
              badges={summary ? [{ label: summary, className: 'bg-teal-50 text-teal-700' }] : []}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {lines.length ? lines.map(([label, value]) => (
                  <div key={`${section.key}-${label}`} className="rounded-xl border border-[#DDEAE7] bg-slate-50/70 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed border-[#DDEAE7] bg-white px-4 py-6 text-sm text-slate-400">
                    Sin informacion detallada en este bloque.
                  </div>
                )}
              </div>
            </PharmacySectionCard>
          )
        })}
      </div>

      <PharmacyEditDrawer
        isOpen={Boolean(drawerSection)}
        onClose={() => setDrawerSection('')}
        title="Editar equipamiento"
        subtitle={pharmacy?.pharmacy_name || ''}
      >
        <EditEquipmentModal
          pharmacy={pharmacy}
          equipment={equipment}
          initialSection={drawerSection || null}
          onClose={() => setDrawerSection('')}
          onSaved={() => {
            setDrawerSection('')
            onSaved?.()
          }}
        />
      </PharmacyEditDrawer>
    </div>
  )
}
