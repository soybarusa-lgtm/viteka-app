import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePharmacy } from '../hooks/usePharmacy'
import {
  ArrowLeftIcon, PencilSquareIcon,
  BuildingStorefrontIcon, WrenchScrewdriverIcon,
  UsersIcon, FolderOpenIcon, ExclamationTriangleIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline'

// ── Helpers ────────────────────────────────────────────────────────────────
const PROVINCE_LABEL = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}
const LEGAL_LABEL = {
  autonomo: 'Autónomo', cb: 'C.B.', sl: 'S.L.',
  autonomo_sl: 'Autónomo + S.L.', cb_sl: 'C.B. + S.L.',
}
const SATISFACTION_LABEL = { 1: 'Muy malo', 2: 'Malo', 3: 'Regular', 4: 'Bueno', 5: 'Excelente' }

function Field({ label, value, wide }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className={wide ? 'col-span-2 md:col-span-3' : ''}>
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value}</dd>
    </div>
  )
}

function SectionBlock({ title, children }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h3>
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</dl>
    </div>
  )
}

function Badge({ active }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>{active ? 'Activa' : 'Inactiva'}</span>
  )
}

function EmptyTab({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-300">
      <Icon className="w-12 h-12 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

function SatisfactionBadge({ value }) {
  if (!value) return <span className="text-gray-400 text-xs">-</span>
  const colors = ['', 'bg-red-100 text-red-600', 'bg-orange-100 text-orange-600', 'bg-yellow-100 text-yellow-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[value]}`}>
      {value}/5 — {SATISFACTION_LABEL[value]}
    </span>
  )
}

function VitekaBadge({ value }) {
  if (!value) return null
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">Viteka</span>
}

// ── Pestañas ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'general',   label: 'Datos generales', icon: BuildingStorefrontIcon },
  { key: 'equipment', label: 'Equipamiento',     icon: WrenchScrewdriverIcon },
  { key: 'people',    label: 'Personas',         icon: UsersIcon },
  { key: 'projects',  label: 'Proyectos',        icon: FolderOpenIcon },
  { key: 'incidents', label: 'Incidencias',      icon: ExclamationTriangleIcon },
  { key: 'documents', label: 'Documentos',       icon: DocumentTextIcon },
]

// ── Tab: Datos generales ────────────────────────────────────────────────────────
function TabGeneral({ pharmacy }) {
  const lType   = pharmacy.legal_type || ''
  const hasAuto = lType.includes('autonomo')
  const hasCb   = lType.includes('cb')
  const hasSl   = lType.includes('sl')
  const sl       = pharmacy.sl_data || {}
  const cbOwners = Array.isArray(pharmacy.cb_owners) ? pharmacy.cb_owners : []

  return (
    <div className="space-y-4">

      {/* Autónomo */}
      {hasAuto && (
        <SectionBlock title="Autónomo">
          <Field label="Nombre del titular" value={pharmacy.owner_name} />
          <Field label="NIF"                value={pharmacy.nif} />
          <Field label="Nº Colegiado"       value={pharmacy.collegiate_number} />
          <Field label="SOE"                value={pharmacy.soe_number} />
          <Field label="Teléfono"           value={pharmacy.contact_phone} />
          <Field label="Email"              value={pharmacy.contact_email} />
          <Field label="Dirección"          value={pharmacy.address} wide />
          <Field label="Población"          value={pharmacy.city} />
          <Field label="Provincia"          value={PROVINCE_LABEL[pharmacy.province] || pharmacy.province} />
          <Field label="C.P."               value={pharmacy.postal_code} />
          <Field label="Horario"            value={pharmacy.schedule} />
          <Field label="Guardias"           value={pharmacy.has_guards ? 'Sí' : 'No'} />
          <Field label="Observaciones"      value={pharmacy.observations} wide />
        </SectionBlock>
      )}

      {/* C.B. */}
      {hasCb && (
        <SectionBlock title="Comunidad de Bienes (C.B.)">
          <Field label="Razón social" value={pharmacy.razon_social} />
          <Field label="CIF"          value={pharmacy.cif} />
          {cbOwners.map((o, i) => (
            <div key={i} className="col-span-2 md:col-span-3 grid grid-cols-3 gap-3 bg-white rounded-lg p-3 border border-gray-200">
              <div><dt className="text-xs text-gray-400">Titular {i + 1}</dt><dd className="text-sm font-medium text-gray-800">{o.name || '-'}</dd></div>
              <div><dt className="text-xs text-gray-400">NIF</dt><dd className="text-sm font-medium text-gray-800">{o.nif || '-'}</dd></div>
              <div><dt className="text-xs text-gray-400">Colegiado</dt><dd className="text-sm font-medium text-gray-800">{o.collegiate || '-'}</dd></div>
            </div>
          ))}
          <Field label="Teléfono"      value={pharmacy.contact_phone} />
          <Field label="Email"         value={pharmacy.contact_email} />
          <Field label="Dirección"     value={pharmacy.address} wide />
          <Field label="Población"     value={pharmacy.city} />
          <Field label="Provincia"     value={PROVINCE_LABEL[pharmacy.province] || pharmacy.province} />
          <Field label="C.P."          value={pharmacy.postal_code} />
          <Field label="SOE"           value={pharmacy.soe_number} />
          <Field label="Horario"       value={pharmacy.schedule} />
          <Field label="Guardias"      value={pharmacy.has_guards ? 'Sí' : 'No'} />
          <Field label="Observaciones" value={pharmacy.observations} wide />
        </SectionBlock>
      )}

      {/* S.L. */}
      {hasSl && (
        <SectionBlock title="Sociedad Limitada (S.L.)">
          <Field label="Razón social"  value={(hasAuto || hasCb) ? sl.razon_social  : pharmacy.razon_social} />
          <Field label="CIF"           value={(hasAuto || hasCb) ? sl.cif           : pharmacy.cif} />
          <Field label="Teléfono S.L." value={(hasAuto || hasCb) ? sl.phone         : pharmacy.contact_phone} />
          <Field label="Email S.L."    value={(hasAuto || hasCb) ? sl.email         : pharmacy.contact_email} />
          <Field label="Dirección"     value={(hasAuto || hasCb) ? sl.address       : pharmacy.address} wide />
          <Field label="Población"     value={(hasAuto || hasCb) ? sl.city          : pharmacy.city} />
          <Field label="Provincia"     value={PROVINCE_LABEL[(hasAuto || hasCb) ? sl.province : pharmacy.province] || ((hasAuto || hasCb) ? sl.province : pharmacy.province)} />
          <Field label="C.P."          value={(hasAuto || hasCb) ? sl.postal_code   : pharmacy.postal_code} />
          <Field label="Observaciones" value={(hasAuto || hasCb) ? sl.observations  : pharmacy.observations} wide />
        </SectionBlock>
      )}

    </div>
  )
}

// ── Tab: Equipamiento ─────────────────────────────────────────────────────────
function EquipRow({ label, marca, modelo, year, viteka, satisfaction }) {
  if (!marca || marca === 'NO') return null
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 px-4 text-sm font-medium text-gray-700 whitespace-nowrap">{label}</td>
      <td className="py-3 px-4 text-sm text-gray-600">{marca}{modelo ? ` — ${modelo}` : ''}</td>
      <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap">{year || '-'}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <VitekaBadge value={viteka} />
          {!viteka && <SatisfactionBadge value={Number(satisfaction)} />}
        </div>
      </td>
    </tr>
  )
}

function TabEquipment({ equipment }) {
  if (!equipment) return (
    <EmptyTab icon={WrenchScrewdriverIcon} message="Sin equipamiento registrado" />
  )
  const eq = equipment
  const pantallas = eq.pantallas_detail || {}
  const ubicaciones = Array.isArray(pantallas.ubicaciones) ? pantallas.ubicaciones.join(', ') : ''

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marca / Modelo</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Año</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody>
            <EquipRow label="ERP"        marca={eq.erp}       year={eq.erp_detail?.year}  viteka={eq.erp_viteka}    satisfaction={eq.erp_satisfaction} />
            <EquipRow label="Caja cobro" marca={eq.caja}      modelo={eq.caja_modelo}     year={eq.caja_year}        viteka={eq.caja_viteka}   satisfaction={eq.caja_satisfaction} />
            <EquipRow label="ESL"        marca={eq.esl}       year={eq.esl_year}           viteka={eq.esl_viteka}    satisfaction={eq.esl_satisfaction} />
            <EquipRow label="Báscula"    marca={eq.bascula}   year={eq.bascula_year}       viteka={eq.bascula_viteka} />
            <EquipRow label="Antihurto"  marca={eq.antihurto} year={eq.antihurto_year} />
            <EquipRow label="Robot"      marca={eq.robot}     year={eq.robot_year} />
            <EquipRow
              label="Cruz"
              marca={eq.cruz && eq.cruz !== 'NO' ? `${eq.cruz}${eq.cruz_cantidad ? ` (${eq.cruz_cantidad})` : ''}` : 'NO'}
            />
            <EquipRow
              label="Gestor turnos"
              marca={eq.gestor_turnos !== 'NO' ? (eq.gestor_turnos_marca || 'Sí') : 'NO'}
              year={eq.gestor_turnos_year}
            />
            <EquipRow
              label="SPD"
              marca={eq.spd !== 'NO' ? (eq.spd_marca || 'Sí') : 'NO'}
              year={eq.spd_year}
            />
            <EquipRow
              label="Pantallas"
              marca={eq.pantallas !== 'NO' ? `${pantallas.marca || 'Sí'}${ubicaciones ? ` (${ubicaciones})` : ''}` : 'NO'}
              year={pantallas.year}
            />
          </tbody>
        </table>
      </div>

      {eq.consultoria && eq.consultoria !== 'NO' && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Consultoría</h3>
          <p className="text-sm text-gray-800">
            {eq.consultoria}
            {eq.consultoria_detail?.month && eq.consultoria_detail?.year
              ? ` — desde ${eq.consultoria_detail.month}/${eq.consultoria_detail.year}`
              : ''}
          </p>
        </div>
      )}

      {eq.frigorifico_marca && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Frigorífico</h3>
          <p className="text-sm text-gray-800">
            {eq.frigorifico_marca}{eq.frigorifico_year ? ` — ${eq.frigorifico_year}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PharmacyDetailPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { pharmacy, equipment, loading } = usePharmacy(id)
  const [activeTab, setActiveTab] = useState('general')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!pharmacy) return (
    <div className="p-6 text-gray-500">Farmacia no encontrada.</div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Cabecera */}
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => navigate(-1)} className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{pharmacy.pharmacy_name}</h1>
            <Badge active={pharmacy.is_active} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {LEGAL_LABEL[pharmacy.legal_type] || pharmacy.legal_type}
            {pharmacy.city     ? ` · ${pharmacy.city}` : ''}
            {pharmacy.province ? `, ${PROVINCE_LABEL[pharmacy.province] || pharmacy.province}` : ''}
          </p>
        </div>
        <Link
          to={`/farmacias/${id}/editar`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 border border-gray-200 hover:border-teal-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4" />
          Editar
        </Link>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon   = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenido activo */}
      <div>
        {activeTab === 'general'   && <TabGeneral   pharmacy={pharmacy} />}
        {activeTab === 'equipment' && <TabEquipment equipment={equipment} />}
        {activeTab === 'people'    && <EmptyTab icon={UsersIcon}              message="Sin personas registradas" />}
        {activeTab === 'projects'  && <EmptyTab icon={FolderOpenIcon}         message="Sin proyectos registrados" />}
        {activeTab === 'incidents' && <EmptyTab icon={ExclamationTriangleIcon} message="Sin incidencias registradas" />}
        {activeTab === 'documents' && <EmptyTab icon={DocumentTextIcon}        message="Sin documentos adjuntos" />}
      </div>

    </div>
  )
}
