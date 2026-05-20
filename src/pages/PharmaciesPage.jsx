import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePharmacies } from '../hooks/usePharmacies'
import { MagnifyingGlassIcon, PlusIcon, BuildingStorefrontIcon, MapPinIcon } from '@heroicons/react/24/outline'

const PROVINCE_LABEL = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}

const LEGAL_LABEL = {
  autonomo: 'Autónomo', cb: 'C.B.', sl: 'S.L.',
  autonomo_sl: 'Autónomo + S.L.', cb_sl: 'C.B. + S.L.',
}

export default function PharmaciesPage() {
  const { profile } = useAuth()
  const { pharmacies, loading } = usePharmacies(profile?.company_id)
  const [search, setSearch] = useState('')
  const [filterProvince, setFilterProvince] = useState('')

  const filtered = pharmacies.filter(p => {
    const matchSearch = p.pharmacy_name.toLowerCase().includes(search.toLowerCase())
    const matchProv   = !filterProvince || p.province === filterProvince
    return matchSearch && matchProv
  })

  const provinces = [...new Set(pharmacies.map(p => p.province).filter(Boolean))].sort()

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Farmacias</h1>
          <p className="text-xs md:text-sm text-gray-500">{pharmacies.length} registradas</p>
        </div>
        <Link
          to="/farmacias/nueva"
          className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva farmacia</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterProvince}
          onChange={e => setFilterProvince(e.target.value)}
          className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[140px]"
        >
          <option value="">Todas</option>
          {provinces.map(p => (
            <option key={p} value={p}>{PROVINCE_LABEL[p] || p}</option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-7 h-7 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay farmacias que coincidan</p>
        </div>
      ) : (
        <>
          {/* MÓVIL — cards */}
          <div className="md:hidden space-y-2">
            {filtered.map(ph => (
              <Link
                key={ph.id}
                to={`/farmacias/${ph.id}`}
                className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-teal-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                  <BuildingStorefrontIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{ph.pharmacy_name}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPinIcon className="w-3 h-3 shrink-0" />
                    <span>{[ph.city, PROVINCE_LABEL[ph.province] || ph.province].filter(Boolean).join(', ') || '—'}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{LEGAL_LABEL[ph.legal_type] || ph.legal_type}</p>
                </div>
                <span className={`mt-1 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  ph.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {ph.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </Link>
            ))}
          </div>

          {/* DESKTOP — tabla */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Provincia</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Población</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(ph => (
                  <tr key={ph.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/farmacias/${ph.id}`} className="font-medium text-teal-700 hover:underline">
                        {ph.pharmacy_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{LEGAL_LABEL[ph.legal_type] || ph.legal_type}</td>
                    <td className="px-4 py-3 text-gray-500">{PROVINCE_LABEL[ph.province] || ph.province || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{ph.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        ph.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ph.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
