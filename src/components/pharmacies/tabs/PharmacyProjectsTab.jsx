import { useMemo, useState } from 'react'
import {
  BanknotesIcon,
  BriefcaseIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { fmtCurrency, fmtDate, getDivision, getStage, getStatus, isOverdue } from '../../../lib/projectManagement'
import PharmacyEmptyState from '../PharmacyEmptyState'
import PharmacyModuleHeader from '../PharmacyModuleHeader'
import PharmacyModuleToolbar from '../PharmacyModuleToolbar'
import PharmacyProjectCard from '../projects/PharmacyProjectCard'
import ProjectNextSteps from '../projects/ProjectNextSteps'

function isWonProject(project, division) {
  return division.id === 'commercial' && (
    project.pipeline_stage === 'cerrado'
    || project.status === 'completed'
  )
}

export default function PharmacyProjectsTab({
  projects = [],
  pharmacyName,
  onCreate,
  onOpen,
  onEdit,
  onCreateTask,
  onCreateTicket,
}) {
  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')

  const metrics = useMemo(() => {
    const active = projects.filter(project => ['active', 'in_progress'].includes(project.status)).length
    const overdue = projects.filter(isOverdue).length
    const amount = projects.reduce((sum, project) => sum + Number(project.amount || 0), 0)
    return [
      { label: 'Proyectos', value: projects.length, hint: 'cartera vinculada', icon: BriefcaseIcon },
      { label: 'Activos', value: active, hint: active > 0 ? 'en marcha' : 'sin actividad abierta', icon: ClockIcon, tone: 'success' },
      { label: 'Vencidos', value: overdue, hint: overdue > 0 ? 'requieren seguimiento' : 'sin vencimientos críticos', icon: ExclamationTriangleIcon, tone: overdue > 0 ? 'warning' : 'default' },
      { label: 'Valor', value: fmtCurrency(amount), hint: amount > 0 ? 'importe estimado' : 'sin importe estimado', icon: BanknotesIcon, tone: 'info' },
    ]
  }, [projects])

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return projects.filter(project => {
      const division = getDivision(project)
      const status = getStatus(project.status)
      const responsible = project.commercial?.full_name || project.technician?.full_name || ''
      const haystack = [
        project.name,
        division.label,
        status.label,
        getStage(project).label,
        responsible,
      ].filter(Boolean).join(' ').toLocaleLowerCase('es')
      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery)

      let matchesFilter = true
      if (quickFilter === 'active') matchesFilter = ['active', 'in_progress'].includes(project.status)
      if (quickFilter === 'won') matchesFilter = isWonProject(project, division)
      if (quickFilter === 'overdue') matchesFilter = isOverdue(project)
      if (quickFilter === 'commercial') matchesFilter = division.id === 'commercial'
      if (quickFilter === 'support') matchesFilter = division.id === 'support'
      if (quickFilter === 'training') matchesFilter = division.id === 'training'
      if (quickFilter === 'installation') matchesFilter = division.id === 'installation'

      return matchesSearch && matchesFilter
    })
  }, [projects, query, quickFilter])

  const nextSteps = useMemo(() => visibleProjects
    .filter(project => project.expected_close_date || getStage(project).label)
    .sort((left, right) => String(left.expected_close_date || '9999-12-31').localeCompare(String(right.expected_close_date || '9999-12-31')))
    .slice(0, 5)
    .map(project => ({
      projectId: project.id,
      projectName: project.name || 'Proyecto sin nombre',
      date: project.expected_close_date ? fmtDate(project.expected_close_date) : 'Sin fecha',
      action: getStage(project).label,
    })), [visibleProjects])

  return (
    <div className="space-y-4">
      <PharmacyModuleHeader
        title="Proyectos de la farmacia"
        subtitle="Cartera y próximos pasos conectados a esta farmacia. La vista por defecto se mantiene en formato operativo para evitar un tablero vacío gigante."
        metrics={metrics}
        actionLabel="+ Proyecto"
        actionIcon={PlusIcon}
        onAction={onCreate}
      />

      <PharmacyModuleToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar proyectos de esta farmacia..."
        filters={[
          { value: 'all', label: 'Todos' },
          { value: 'active', label: 'Activos' },
          { value: 'won', label: 'Ganados' },
          { value: 'overdue', label: 'Vencidos' },
          { value: 'commercial', label: 'Comercial' },
          { value: 'support', label: 'Soporte' },
          { value: 'training', label: 'Formación' },
          { value: 'installation', label: 'Instalaciones' },
        ]}
        activeFilter={quickFilter}
        onFilterChange={setQuickFilter}
      />

      {visibleProjects.length === 0 ? (
        <PharmacyEmptyState
          icon={BriefcaseIcon}
          title="No hay proyectos asociados."
          message="Puedes crear uno nuevo, partir de una plantilla o abrir la cartera global de proyectos para vincular trabajo ya existente."
          actionLabel="Crear proyecto"
          onAction={onCreate}
          secondaryActionLabel="Ver proyectos globales"
          onSecondaryAction={() => onOpen({ id: null })}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleProjects.map(project => {
              const division = getDivision(project)
              const status = getStatus(project.status)
              return (
                <PharmacyProjectCard
                  key={project.id}
                  name={project.name || 'Proyecto sin nombre'}
                  category={division.label}
                  statusLabel={status.label}
                  pharmacyName={pharmacyName}
                  responsible={project.commercial?.full_name || project.technician?.full_name || 'Sin asignar'}
                  nextDate={project.expected_close_date ? fmtDate(project.expected_close_date) : '—'}
                  amount={project.amount ? fmtCurrency(project.amount) : '—'}
                  nextStep={getStage(project).label}
                  onOpen={() => onOpen(project)}
                  onEdit={() => onEdit(project)}
                  onTask={() => onCreateTask(project)}
                  onTicket={() => onCreateTicket(project)}
                />
              )
            })}
          </div>
          <ProjectNextSteps steps={nextSteps} />
        </div>
      )}
    </div>
  )
}
