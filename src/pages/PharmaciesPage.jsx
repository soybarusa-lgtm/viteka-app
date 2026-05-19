import { useState } from 'react'
import { usePharmacies } from '../hooks/usePharmacies'
import CreatePharmacyModal from '../components/modals/CreatePharmacyModal'
import EditPharmacyModal from '../components/modals/EditPharmacyModal'

const PROVINCE_LABELS = {
  malaga: 'Málaga', granada: 'Granada', sevilla: 'Sevilla', cordoba: 'Córdoba',
  cadiz: 'Cádiz', almeria: 'Almería', huelva: 'Huelva', jaen: 'Jaén',
}

const LEGAL_LABELS = {
  autonomo: 'Autónomo', cb: 'CB', sl: 'SL',
  autonomo_sl: 'Autónomo + SL', cb_sl: 'CB + SL',
}

export default function PharmaciesPage({ navigate }) {
  const { pharmacies, loading, error, deletePharmacy } = usePharmacies()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [filterProvince, setFilterProvince] = useState('')
  const [filterLegal, setFilterLegal] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = pharmacies.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      p.pharmacy_name?.toLowerCase().includes(q) ||
      p.owner_name?.toLowerCase().includes(q) ||
      p.razon_social?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.nif?.toLowerCase().includes(q) ||
      p.cif?.toLowerCase().includes(q)
    const matchProvince = !filterProvince || p.province === filterProvince
    const matchLegal = !filterLegal || p.legal_type === filterLegal
    const matchStatus = !filterStatus ||
      (filterStatus === 'active' ? p.is_active : !p.is_active)
    return matchSearch && matchProvince && matchLegal && matchStatus
  })

  async function handleDelete() {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deletePharmacy(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (e) {
      alert('Error al eliminar: ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-container pb-24 md:pb-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🏪 Farmacias</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pharmacies.length} farmacias registradas</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Nueva farmacia
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Buscar por nombre, NIF, ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
          <option value="">Todas las provincias</option>
          {Object.entries(PROVINCE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select className="input w-auto" value={filterLegal} onChange={e => setFilterLegal(e.target.value)}>
          <option value="">Tipo jurídico</option>
          {Object.entries(LEGAL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Estado</option>
          <option value="active">Activa</option>
          <option value="inactive">Inactiva</option>
        </select>
        {(search || filterProvince || filterLegal || filterStatus) && (
          <button className="btn-ghost text-xs" onClick={() => {
            setSearch(''); setFilterProvince(''); setFilterLegal(''); setFilterStatus('')
          }}>× Limpiar</button>
        )}
      </div>

      {/* Contenido */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          Error: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <span className="text-4xl mb-3">🏪</span>
          <p className="font-medium text-gray-500">No se encontraron farmacias</p>
          <p className="text-sm mt-1">Prueba a cambiar los filtros o crea una nueva</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          {/* Vista desktop: tabla */}
          <div className="hidden md:block table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Farmacia</th>
                  <th>Tipo</th>
                  <th>Provincia</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <button
                        onClick={() => navigate('pharmacy-detail', { pharmacyId: p.id })}
                        className="font-medium text-teal-700 hover:underline text-left"
                      >
                        {p.pharmacy_name}
                      </button>
                      <p className="text-xs text-gray-400">
                        {p.owner_name || p.razon_social || '—'}
                      </p>
                    </td>
                    <td><span className="badge-gray">{LEGAL_LABELS[p.legal_type] || p.legal_type}</span></td>
                    <td>{PROVINCE_LABELS[p.province] || p.province || '—'}</td>
                    <td>{p.contact_phone || '—'}</td>
                    <td>
                      <span className={p.is_active ? 'badge-green' : 'badge-gray'}>
                        {p.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate('pharmacy-detail', { pharmacyId: p.id })} className="btn-ghost text-xs py-1 px-2">Ver</button>
                        <button onClick={() => setEditTarget(p)} className="btn-secondary text-xs py-1 px-2">Editar</button>
                        <button onClick={() => setDeleteConfirm(p)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista móvil: cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="card-hover p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate('pharmacy-detail', { pharmacyId: p.id })}
                      className="font-semibold text-teal-700 text-sm hover:underline text-left">
                      {p.pharmacy_name}
                    </button>
                    <p className="text-xs text-gray-500">{p.owner_name || p.razon_social || '—'}</p>
                  </div>
                  <span className={p.is_active ? 'badge-green' : 'badge-gray'}>
                    {p.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                  <span>📍 {PROVINCE_LABELS[p.province] || p.province || '—'}</span>
                  <span>🏢 {LEGAL_LABELS[p.legal_type] || p.legal_type}</span>
                  {p.contact_phone && <span>📞 {p.contact_phone}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('pharmacy-detail', { pharmacyId: p.id })} className="btn-primary text-xs py-1.5 flex-1">Ver detalle</button>
                  <button onClick={() => setEditTarget(p)} className="btn-secondary text-xs py-1.5 px-3">Editar</button>
                  <button onClick={() => setDeleteConfirm(p)} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showCreate && <CreatePharmacyModal onClose={() => setShowCreate(false)} />}
      {editTarget && <EditPharmacyModal pharmacy={editTarget} onClose={() => setEditTarget(null)} />}

      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 z-50 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Eliminar farmacia</h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de que quieres eliminar <strong>{deleteConfirm.pharmacy_name}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
