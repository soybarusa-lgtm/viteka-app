import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePharmacies } from '../hooks/usePharmacies'
import { MagnifyingGlassIcon, PlusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'

const PROVINCE_LABEL = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}

const LEGAL_LABEL = { autonomo: 'Autónomo', cb: 'C.B.', sl: 'S.L.', autonomo_sl: 'Autónomo + S.L.', cb_sl: 'C.B. + S.L.' }

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
    <div className="p-6 space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Farmacias</h1>
          <p className="text-sm text-gray-500">{pharmacies.length} farmacias registradas</p>
        </div>
        <Link
          to="/farmacias/nueva"
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva farmacia
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar farmacia..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterProvince}
          onChange={e => setFilterProvince(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">Todas las provincias</option>
          {provinces.map(p => (
            <option key={p} value={p}>{PROVINCE_LABEL[p] || p}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  <td className="px-4 py-3 text-gray-500">{PROVINCE_LABEL[ph.province] || ph.province || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{ph.city || '-'}</td>
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
      )}
    </div>
  )
}
