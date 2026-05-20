import { useParams, useNavigate } from 'react-router-dom'
import { usePharmacy } from '../hooks/usePharmacy'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const PROVINCE_LABEL = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}
const LEGAL_LABEL = { autonomo: 'Autónomo', cb: 'C.B.', sl: 'S.L.', autonomo_sl: 'Autónomo + S.L.', cb_sl: 'C.B. + S.L.' }

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 mt-0.5">{value}</dd>
    </div>
  )
}

export default function PharmacyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pharmacy, loading } = usePharmacy(id)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!pharmacy) return (
    <div className="p-6 text-gray-500">Farmacia no encontrada.</div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pharmacy.pharmacy_name}</h1>
          <p className="text-sm text-gray-500">
            {LEGAL_LABEL[pharmacy.legal_type] || pharmacy.legal_type}
            {pharmacy.province ? ` · ${PROVINCE_LABEL[pharmacy.province] || pharmacy.province}` : ''}
          </p>
        </div>
        <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          pharmacy.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {pharmacy.is_active ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Datos generales</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Tipo jurídico"     value={LEGAL_LABEL[pharmacy.legal_type]} />
          <Field label="NIF / CIF"         value={pharmacy.nif || pharmacy.cif} />
          <Field label="Titular"           value={pharmacy.owner_name} />
          <Field label="Razón social"      value={pharmacy.razon_social} />
          <Field label="Nº Colegiado"      value={pharmacy.collegiate_number} />
          <Field label="SOE"               value={pharmacy.soe_number} />
          <Field label="Teléfono"          value={pharmacy.contact_phone} />
          <Field label="Email"             value={pharmacy.contact_email} />
          <Field label="Dirección"         value={pharmacy.address} />
          <Field label="Población"         value={pharmacy.city} />
          <Field label="Provincia"         value={PROVINCE_LABEL[pharmacy.province] || pharmacy.province} />
          <Field label="C.P."              value={pharmacy.postal_code} />
          <Field label="Horario"           value={pharmacy.schedule} />
          <Field label="Guardias"          value={pharmacy.has_guards ? 'Sí' : 'No'} />
          <Field label="Observaciones"     value={pharmacy.observations} />
        </dl>
      </div>

      {/* Próximas secciones — tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-400 text-center">
        Próximamente: Equipamiento · Personas · Proyectos · Incidencias · Documentos
      </div>
    </div>
  )
}
