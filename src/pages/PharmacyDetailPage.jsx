import { useState } from 'react'
import { usePharmacyDetail } from '../hooks/usePharmacyDetail'
import ContactsTab from '../components/pharmacy/ContactsTab'
import EquipmentTab from '../components/pharmacy/EquipmentTab'
import DocumentsTab from '../components/pharmacy/DocumentsTab'

const LEGAL_LABELS = {
  autonomo: 'Autónomo', cb: 'CB', sl: 'SL',
  autonomo_sl: 'Autónomo + SL', cb_sl: 'CB + SL',
}

const PROVINCE_LABELS = {
  malaga: 'Málaga', granada: 'Granada', sevilla: 'Sevilla', cordoba: 'Córdoba',
  cadiz: 'Cádiz', almeria: 'Almería', huelva: 'Huelva', jaen: 'Jaén',
}

const TABS = [
  { id: 'info',       label: '📋 Información' },
  { id: 'contacts',   label: '👥 Contactos' },
  { id: 'equipment',  label: '🖥️ Equipos' },
  { id: 'documents',  label: '📁 Documentos' },
  { id: 'projects',   label: '📂 Proyectos' },
]

const PROJECT_STATUS_LABELS = {
  active: 'Activo', completed: 'Completado', cancelled: 'Cancelado', paused: 'Pausado',
}

export default function PharmacyDetailPage({ pharmacyId, navigate }) {
  const detail = usePharmacyDetail(pharmacyId)
  const { pharmacy, projects, loading, error } = detail
  const [tab, setTab] = useState('info')

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !pharmacy) return (
    <div className="page-container">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error || 'Farmacia no encontrada'}
      </div>
    </div>
  )

  const p = pharmacy

  function goToEquipment() {
    navigate('pharmacy-equipment', { pharmacyId: p.id, pharmacyName: p.pharmacy_name })
  }

  return (
    <div className="page-container pb-24 md:pb-6">

      {/* Breadcrumb + header */}
      <div className="mb-4">
        <button onClick={() => navigate('pharmacies')} className="text-sm text-teal-600 hover:underline mb-2 inline-flex items-center gap-1">
          ← Farmacias
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{p.pharmacy_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="badge-gray">{LEGAL_LABELS[p.legal_type] || p.legal_type}</span>
              <span className={p.is_active ? 'badge-green' : 'badge-gray'}>
                {p.is_active ? 'Activa' : 'Inactiva'}
              </span>
              {p.province && <span className="text-sm text-gray-500">📍 {PROVINCE_LABELS[p.province] || p.province}{p.city ? `, ${p.city}` : ''}</span>}
            </div>
          </div>
          {/* Acciones del header */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={goToEquipment}
              className="btn-secondary flex items-center gap-1.5"
            >
              🔧 Equipamiento
            </button>
            <button
              onClick={() => navigate('pharmacies', { openEdit: p.id })}
              className="btn-secondary"
            >
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Información */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Datos principales */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Datos de la farmacia</h3>
            <dl className="space-y-2 text-sm">
              {p.owner_name && <InfoRow label="Titular" value={p.owner_name} />}
              {p.nif && <InfoRow label="NIF" value={p.nif} />}
              {p.collegiate_number && <InfoRow label="Nº Colegiado" value={p.collegiate_number} />}
              {p.soe_number && <InfoRow label="Nº SOE" value={p.soe_number} />}
              {p.razon_social && <InfoRow label="Razón social" value={p.razon_social} />}
              {p.cif && <InfoRow label="CIF" value={p.cif} />}
              {p.schedule && <InfoRow label="Horario" value={p.schedule} />}
              <InfoRow label="Guardias" value={p.has_guards ? 'Sí' : 'No'} />
            </dl>
          </div>

          {/* Contacto y ubicación */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Contacto y ubicación</h3>
            <dl className="space-y-2 text-sm">
              {p.contact_phone && <InfoRow label="Teléfono" value={<a href={`tel:${p.contact_phone}`} className="text-teal-600 hover:underline">{p.contact_phone}</a>} />}
              {p.contact_email && <InfoRow label="Email" value={<a href={`mailto:${p.contact_email}`} className="text-teal-600 hover:underline">{p.contact_email}</a>} />}
              {p.address && <InfoRow label="Dirección" value={p.address} />}
              {p.city && <InfoRow label="Municipio" value={p.city} />}
              {p.province && <InfoRow label="Provincia" value={PROVINCE_LABELS[p.province] || p.province} />}
              {p.postal_code && <InfoRow label="C.P." value={p.postal_code} />}
            </dl>
          </div>

          {/* Socios CB */}
          {p.cb_owners?.length > 0 && (
            <div className="card p-5 md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-3">Socios CB</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Nombre</th><th>NIF</th><th>Nº Colegiado</th></tr></thead>
                  <tbody>
                    {p.cb_owners.map((o, i) => (
                      <tr key={i}><td>{o.name}</td><td>{o.nif || '—'}</td><td>{o.collegiate_number || '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {p.observations && (
            <div className="card p-5 md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-2">Observaciones</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{p.observations}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Contactos */}
      {tab === 'contacts' && <ContactsTab detail={detail} />}

      {/* Tab: Equipos — acceso directo a la ficha de equipamiento */}
      {tab === 'equipment' && (
        <div>
          <div className="card p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-800 mb-0.5">Ficha de equipamiento</p>
              <p className="text-sm text-gray-500">
                Gestiona ERP, caja de cobro, etiquetas electrónicas, robots, equipos informáticos y más.
              </p>
            </div>
            <button
              onClick={goToEquipment}
              className="btn-primary shrink-0 flex items-center gap-2"
            >
              🔧 Ver / editar equipamiento
            </button>
          </div>
          <EquipmentTab detail={detail} />
        </div>
      )}

      {/* Tab: Documentos */}
      {tab === 'documents' && <DocumentsTab detail={detail} />}

      {/* Tab: Proyectos */}
      {tab === 'projects' && (
        <div>
          {projects.length === 0 ? (
            <div className="empty-state">
              <span className="text-4xl mb-3">📂</span>
              <p className="font-medium text-gray-500">Sin proyectos asociados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(pr => (
                <button
                  key={pr.id}
                  onClick={() => navigate('project-detail', { projectId: pr.id })}
                  className="card-hover p-4 w-full text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{pr.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pr.project_type === 'commercial' ? '💼 Comercial' : '🔧 Soporte'}
                        {pr.pipeline_stage && ` · ${pr.pipeline_stage}`}
                      </p>
                    </div>
                    <span className={`badge-${
                      pr.status === 'active' ? 'green' : pr.status === 'completed' ? 'blue' : 'gray'
                    }`}>
                      {PROJECT_STATUS_LABELS[pr.status] || pr.status}
                    </span>
                  </div>
                </button>
            ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="text-gray-400 w-32 shrink-0">{label}</dt>
      <dd className="text-gray-700 font-medium">{value}</dd>
    </div>
  )
}
