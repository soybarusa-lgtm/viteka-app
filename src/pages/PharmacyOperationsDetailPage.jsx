import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  PencilSquareIcon,
  PlusIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '../context/ToastContext'
import { usePharmacy } from '../hooks/usePharmacy'
import { usePharmacyDocuments } from '../hooks/usePharmacyDocuments'
import { usePharmacyIT } from '../hooks/usePharmacyIT'
import { usePharmacyPersons } from '../hooks/usePharmacyPersons'
import { useProjects } from '../hooks/useProjects'
import LegacyPharmacyDetailPage from './PharmacyDetailPage'
import PharmacyDocumentsTab from '../components/pharmacies/tabs/PharmacyDocumentsTab'
import PharmacyITTab from '../components/pharmacies/tabs/PharmacyITTab'
import PharmacyPeopleTab from '../components/pharmacies/tabs/PharmacyPeopleTab'
import PharmacyProjectsTab from '../components/pharmacies/tabs/PharmacyProjectsTab'

const PROVINCE_LABEL = {
  almeria: 'Almería',
  cadiz: 'Cádiz',
  cordoba: 'Córdoba',
  granada: 'Granada',
  huelva: 'Huelva',
  jaen: 'Jaén',
  malaga: 'Málaga',
  sevilla: 'Sevilla',
}

const LEGAL_LABEL = {
  autonomo: 'Persona Jurídica.',
  cb: 'C.B.',
  sl: 'S.L.',
  autonomo_sl: 'Persona Jurídica. + S.L.',
  cb_sl: 'C.B. + S.L.',
}

const TARGET_TABS = ['it', 'people', 'projects', 'documents']
const TABS = [
  { key: 'general', label: 'Datos generales', icon: BuildingStorefrontIcon },
  { key: 'equipment', label: 'Equipamiento', icon: WrenchScrewdriverIcon },
  { key: 'it', label: 'Equip. Informático', icon: ComputerDesktopIcon },
  { key: 'people', label: 'Personas', icon: UsersIcon },
  { key: 'projects', label: 'Proyectos', icon: FolderOpenIcon },
  { key: 'documents', label: 'Documentos', icon: DocumentTextIcon },
]

export default function PharmacyOperationsDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab') || 'general'
  const legacyRequested = searchParams.get('legacy') === '1'

  if (legacyRequested || !TARGET_TABS.includes(requestedTab)) {
    return <LegacyPharmacyDetailPage />
  }

  const { pharmacy, loading, error } = usePharmacy(id)
  const peopleApi = usePharmacyPersons(id)
  const documentsApi = usePharmacyDocuments(id)
  const itApi = usePharmacyIT(id)
  const { projects } = useProjects()

  const filteredProjects = useMemo(
    () => (projects || []).filter(project => project.pharmacy_id === id),
    [id, projects],
  )

  const tabCounts = useMemo(() => ({
    it: itApi.devices?.length || 0,
    people: peopleApi.persons?.length || 0,
    projects: filteredProjects.length,
    documents: documentsApi.documents?.length || 0,
  }), [documentsApi.documents, filteredProjects.length, itApi.devices, peopleApi.persons])

  function openModernTab(tabKey) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tabKey)
    next.delete('legacy')
    next.delete('action')
    next.delete('person')
    setSearchParams(next, { replace: true })
  }

  function openLegacyTab(tabKey, extras = {}) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tabKey)
    next.set('legacy', '1')
    Object.entries(extras).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') next.delete(key)
      else next.set(key, value)
    })
    navigate(`/farmacias/${id}?${next.toString()}`)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>
  }

  if (error || !pharmacy) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-slate-500">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
        <p className="text-lg font-medium">Farmacia no encontrada</p>
        <button onClick={() => navigate(-1)} className="text-sm text-teal-600 hover:underline">Volver</button>
      </div>
    )
  }

  const locationLine = [pharmacy.city, PROVINCE_LABEL[pharmacy.province] || pharmacy.province].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="px-3 py-3 md:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button type="button" onClick={() => navigate(-1)} className="mt-0.5 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Volver">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-lg font-extrabold text-slate-950 md:text-xl">{pharmacy.pharmacy_name}</h1>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${pharmacy.is_active === false ? 'bg-slate-50 text-slate-500 ring-slate-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'}`}>
                    {pharmacy.is_active === false ? 'Inactiva' : 'Activa'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {locationLine}
                  {pharmacy.legal_type ? ` · ${LEGAL_LABEL[pharmacy.legal_type] || pharmacy.legal_type}` : ''}
                  {pharmacy.contact_phone ? ` · ${pharmacy.contact_phone}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button type="button" onClick={() => navigate(`/soporte/tickets?pharmacy_id=${encodeURIComponent(id)}`)} className="btn-secondary text-xs">
                <PlusIcon className="h-4 w-4" /> Crear ticket
              </button>
              <button type="button" onClick={() => openLegacyTab('general', { action: 'edit' })} className="btn-primary text-xs">
                <PencilSquareIcon className="h-4 w-4" /> Editar datos
              </button>
            </div>
          </div>

          <div className="-mx-3 mt-3 flex gap-1 overflow-x-auto px-3 pb-0 -mb-px scrollbar-none md:-mx-5 md:px-5">
            {TABS.map(tab => {
              const Icon = tab.icon
              const count = tabCounts[tab.key]
              const isActive = requestedTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => tab.key === 'general' || tab.key === 'equipment' ? openLegacyTab(tab.key) : openModernTab(tab.key)}
                  className={`inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-bold leading-tight whitespace-nowrap transition-colors sm:min-h-0 sm:justify-start sm:py-2.5 sm:text-xs ${isActive ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {Number.isFinite(count) && count > 0 ? <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${isActive ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>{count}</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-3 py-4 md:px-5 md:py-5">
        {requestedTab === 'it' ? <PharmacyITTab devices={itApi.devices} loading={itApi.loading} onCreate={() => openLegacyTab('it', { action: 'new-it' })} onOpenLegacy={() => openLegacyTab('it')} onCreateTicket={() => navigate(`/soporte/tickets?pharmacy_id=${encodeURIComponent(id)}`)} /> : null}
        {requestedTab === 'people' ? <PharmacyPeopleTab persons={peopleApi.persons} loading={peopleApi.loading} onCreate={() => openLegacyTab('people', { action: 'new-person' })} onEdit={person => openLegacyTab('people', { action: 'edit-person', person: person.id })} onCreateTicket={() => navigate(`/soporte/tickets?pharmacy_id=${encodeURIComponent(id)}`)} onPortalAccess={person => toast(`Acceso portal pendiente para ${person.name || 'esta persona'}`, 'success')} toast={toast} /> : null}
        {requestedTab === 'documents' ? <PharmacyDocumentsTab documentsApi={{ ...documentsApi, pharmacyId: id, companyId: pharmacy.company_id }} toast={toast} /> : null}
        {requestedTab === 'projects' ? <PharmacyProjectsTab projects={filteredProjects} pharmacyName={pharmacy.pharmacy_name} onCreate={() => navigate(`/proyectos?pharmacy_id=${encodeURIComponent(id)}&create=1&type=commercial`)} onOpen={project => project?.id ? navigate(`/proyectos/${project.id}`) : navigate('/proyectos')} onEdit={project => navigate(project?.id ? `/proyectos/${project.id}` : '/proyectos')} onCreateTask={() => navigate(`/proyectos?pharmacy_id=${encodeURIComponent(id)}&create=1&type=support&mode=task`)} onCreateTicket={() => navigate(`/soporte/tickets?pharmacy_id=${encodeURIComponent(id)}`)} /> : null}
      </div>
    </div>
  )
}
