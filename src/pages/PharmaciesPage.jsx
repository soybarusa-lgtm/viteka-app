import { useMemo, useState } from 'react'
import { usePharmacies } from '../hooks/usePharmacies'
import PharmacyCreateModal from '../components/pharmacy/PharmacyCreateModal'
import PharmacyKpiBlock from '../components/dashboard/PharmacyKpiBlock'

function IcSearch() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function IcPlus()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IcChevron() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg> }

const TYPE_FILTERS = [
  { id: 'all',      label: 'Todas'    },
  { id: 'autonomo', label: 'Autónomo' },
  { id: 'cb',       label: 'C.B.'     },
  { id: 'sl',       label: 'S.L.'     },
]

function normalizeType(value) {
  const v = String(value || '').toLowerCase()
  if (v.includes('aut')) return 'autonomo'
  if (v.includes('cb') || v.includes('c.b')) return 'cb'
  if (v.includes('sl') || v.includes('s.l')) return 'sl'
  return 'other'
}

function getName(p)    { return p.name || p.pharmacy_name || p.farmacia_name || '—' }
function getCity(p)    { return p.city || p.poblacion || p.municipality || '—' }
function getContact(p) { return p.contact_name || p.manager_name || p.full_name || '—' }

function PharmacyRow({ pharmacy, navigate }) {
  return (
    <tr className="cursor-pointer" onClick={() => navigate('pharmacy-detail', { pharmacyId: pharmacy.id })}>
      <td className="font-medium text-gray-900">{getName(pharmacy)}</td>
      <td className="text-gray-500">{pharmacy.province || '—'}</td>
      <td className="text-gray-500">{getCity(pharmacy)}</td>
      <td className="text-gray-500">{pharmacy.legal_type || '—'}</td>
      <td className="text-gray-500 truncate max-w-[140px]">{getContact(pharmacy)}</td>
      <td className="text-gray-300"><IcChevron /></td>
    </tr>
  )
}

function PharmacyCard({ pharmacy, navigate }) {
  return (
    <button onClick={() => navigate('pharmacy-detail', { pharmacyId: pharmacy.id })}
      className="card-hover w-full p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{getName(pharmacy)}</p>
          <p className="mt-0.5 text-xs text-gray-400 truncate">{pharmacy.province || '—'} · {getCity(pharmacy)}</p>
        </div>
        <span className="badge-gray text-xs">{pharmacy.legal_type || '—'}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><p className="text-gray-400">Tipo</p><p className="mt-1 font-medium text-gray-700">{pharmacy.legal_type || '—'}</p></div>
        <div><p className="text-gray-400">Contacto</p><p className="mt-1 font-medium text-gray-700 truncate">{getContact(pharmacy)}</p></div>
      </div>
    </button>
  )
}

export default function PharmaciesPage({ navigate, profile }) {
  const { pharmacies = [], loading, error, refetch } = usePharmacies()

  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pharmacies.filter(p => {
      const hay = `${getName(p)} ${p.province || ''} ${getCity(p)} ${getContact(p)}`.toLowerCase()
      const matchesSearch = !q || hay.includes(q)
      const matchesType   = typeFilter === 'all' || normalizeType(p.legal_type) === typeFilter
      return matchesSearch && matchesType
    })
  }, [pharmacies, search, typeFilter])

  const hasFilters = search || typeFilter !== 'all'

  function handleCreated(newId) {
    refetch?.()
    navigate('pharmacy-detail', { pharmacyId: newId })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Farmacias</h1>
          <p className="page-subtitle">Gestión de fichas, contacto y distribución</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <IcPlus /> Nueva farmacia
        </button>
      </div>

      {/* KPI por provincia */}
      <div className="mb-6">
        <PharmacyKpiBlock companyId={profile?.company_id} />
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-6 space-y-4">
        <div className="relative max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IcSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por farmacia, provincia, ciudad o contacto"
            className="input pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map(f => (
            <button key={f.id} onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${
                typeFilter === f.id ? 'bg-[#1c473c] text-white border-[#1c473c]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>{f.label}</button>
          ))}
          {hasFilters && (
            <button className="btn-ghost text-xs" onClick={() => { setSearch(''); setTypeFilter('all') }}>
              Limpiar
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-[#1c473c] border-t-transparent animate-spin" />
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && (
        filtered.length === 0 ? (
          <div className="empty-state card border-dashed p-12">
            <p className="text-sm font-medium text-gray-500">
              {pharmacies.length === 0 ? 'Aún no hay farmacias registradas' : 'No hay resultados con esos filtros'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block table-container">
              <table className="table">
                <thead><tr><th>Farmacia</th><th>Provincia</th><th>Población</th><th>Tipo</th><th>Contacto</th><th /></tr></thead>
                <tbody>{filtered.map(p => <PharmacyRow key={p.id} pharmacy={p} navigate={navigate} />)}</tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {filtered.map(p => <PharmacyCard key={p.id} pharmacy={p} navigate={navigate} />)}
            </div>
          </>
        )
      )}

      <PharmacyCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
        profile={profile}
      />
    </div>
  )
}
