import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function IconEye() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}
function IconList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}
function IconPhone() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  )
}
function IconPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const AVATAR_COLORS = [
  '#005643', '#0369a1', '#7c3aed', '#b45309',
  '#0f766e', '#be123c', '#1d4ed8', '#15803d',
]

function avatarColor(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ---------------------------------------------------------------------------
// ClientsPage
// ---------------------------------------------------------------------------
export default function ClientsPage({
  clients = [],
  onCreateClient,
  onEditClient,
  onDeleteClient,
  onOpenClient,
}) {
  const [search, setSearch]       = useState('')
  const [province, setProvince]   = useState('')
  const [view, setView]           = useState('table') // 'table' | 'grid'

  // Unique provinces for filter
  const provinces = useMemo(() => {
    const all = clients.map(c => c.province).filter(Boolean)
    return [...new Set(all)].sort()
  }, [clients])

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const text = [
        c.name, c.pharmacy_name, c.pharmacist_owner,
        c.email, c.contact_email, c.phone, c.contact_phone,
        c.city, c.province, c.notes, c.observations,
      ].join(' ').toLowerCase()

      const matchSearch   = !search   || text.includes(search.toLowerCase())
      const matchProvince = !province || c.province === province

      return matchSearch && matchProvince
    })
  }, [clients, search, province])

  // KPIs
  const withPhone = clients.filter(c => c.phone || c.contact_phone).length
  const withEmail = clients.filter(c => c.email || c.contact_email).length
  const provinces_count = new Set(clients.map(c => c.province).filter(Boolean)).size

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Farmacias</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Gestión de clientes, contactos y datos operativos
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateClient}
          className="flex items-center gap-2 rounded-xl bg-[#005643] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#00442f]"
        >
          <span className="text-base leading-none">+</span>
          Nueva farmacia
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total farmacias"  value={clients.length}    sub="registradas" />
        <KpiCard label="Con teléfono"     value={withPhone}         sub={`de ${clients.length}`} />
        <KpiCard label="Con email"        value={withEmail}         sub={`de ${clients.length}`} />
        <KpiCard label="Provincias"       value={provinces_count}   sub="distintas" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            <IconSearch />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono, ciudad..."
            className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20"
          />
        </div>

        {/* Province filter */}
        <select
          value={province}
          onChange={e => setProvince(e.target.value)}
          className="rounded-xl border border-[#E8EDF2] bg-white px-3 py-2.5 text-[13px] text-[#334155] outline-none focus:border-[#005643] sm:w-[180px]"
        >
          <option value="">Todas las provincias</option>
          {provinces.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex rounded-xl border border-[#E8EDF2] bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition ${
              view === 'table'
                ? 'bg-[#005643] text-white'
                : 'text-[#64748B] hover:bg-[#F8FAFC]'
            }`}
          >
            <IconList /> Lista
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition ${
              view === 'grid'
                ? 'bg-[#005643] text-white'
                : 'text-[#64748B] hover:bg-[#F8FAFC]'
            }`}
          >
            <IconGrid /> Tarjetas
          </button>
        </div>
      </div>

      {/* Count */}
      <p className="text-[12px] text-[#94A3B8]">
        {filtered.length === clients.length
          ? `${clients.length} farmacias`
          : `${filtered.length} de ${clients.length} farmacias`}
      </p>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={Boolean(search || province)} onClear={() => { setSearch(''); setProvince('') }} />
      ) : view === 'table' ? (
        <TableView
          clients={filtered}
          onOpen={onOpenClient}
          onEdit={onEditClient}
          onDelete={onDeleteClient}
        />
      ) : (
        <GridView
          clients={filtered}
          onOpen={onOpenClient}
          onEdit={onEditClient}
          onDelete={onDeleteClient}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Table view
// ---------------------------------------------------------------------------
function TableView({ clients, onOpen, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-[#F1F5F9]">
              {['Farmacia', 'Titular', 'Provincia / Ciudad', 'Contacto', ''].map(h => (
                <th key={h} className="px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {clients.map(client => (
              <tr
                key={client.id}
                className="group transition-colors hover:bg-[#FAFBFC]"
              >
                {/* Farmacia */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold text-white"
                      style={{ backgroundColor: avatarColor(client.pharmacy_name || client.name) }}
                    >
                      {getInitials(client.pharmacy_name || client.name)}
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-[#0F172A]">
                        {client.pharmacy_name || client.name}
                      </p>
                      {client.name !== client.pharmacy_name && client.name && (
                        <p className="text-[12px] text-[#94A3B8]">{client.name}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Titular */}
                <td className="px-6 py-4 text-[13px] text-[#64748B]">
                  {client.pharmacist_owner || '—'}
                </td>

                {/* Ubicación */}
                <td className="px-6 py-4">
                  {(client.province || client.city) ? (
                    <div className="flex items-center gap-1.5 text-[13px] text-[#64748B]">
                      <span className="text-[#94A3B8]"><IconPin /></span>
                      {[client.city, client.province].filter(Boolean).join(', ')}
                    </div>
                  ) : (
                    <span className="text-[13px] text-[#CBD5E1]">—</span>
                  )}
                </td>

                {/* Contacto */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {(client.contact_phone || client.phone) && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                        <span className="text-[#94A3B8]"><IconPhone /></span>
                        {client.contact_phone || client.phone}
                      </div>
                    )}
                    {(client.contact_email || client.email) && (
                      <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                        <span className="text-[#94A3B8]"><IconMail /></span>
                        {client.contact_email || client.email}
                      </div>
                    )}
                    {!client.contact_phone && !client.phone && !client.contact_email && !client.email && (
                      <span className="text-[12px] text-[#CBD5E1]">Sin contacto</span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {onOpen && (
                      <ActionBtn onClick={() => onOpen(client.id)} title="Ver detalle" color="green">
                        <IconEye />
                      </ActionBtn>
                    )}
                    <ActionBtn onClick={() => onEdit(client)} title="Editar" color="slate">
                      <IconEdit />
                    </ActionBtn>
                    <ActionBtn onClick={() => onDelete(client.id)} title="Eliminar" color="red">
                      <IconTrash />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grid (card) view
// ---------------------------------------------------------------------------
function GridView({ clients, onOpen, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map(client => (
        <div
          key={client.id}
          className="group flex flex-col rounded-2xl border border-[#E8EDF2] bg-white p-5 transition hover:border-[#005643]/30 hover:shadow-sm"
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold text-white"
              style={{ backgroundColor: avatarColor(client.pharmacy_name || client.name) }}
            >
              {getInitials(client.pharmacy_name || client.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-[#0F172A]">
                {client.pharmacy_name || client.name}
              </p>
              {client.pharmacist_owner && (
                <p className="truncate text-[12px] text-[#94A3B8]">{client.pharmacist_owner}</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="mt-4 flex-1 space-y-2">
            {(client.province || client.city) && (
              <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                <span className="text-[#94A3B8]"><IconPin /></span>
                <span className="truncate">{[client.city, client.province].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {(client.contact_phone || client.phone) && (
              <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                <span className="text-[#94A3B8]"><IconPhone /></span>
                <span className="truncate">{client.contact_phone || client.phone}</span>
              </div>
            )}
            {(client.contact_email || client.email) && (
              <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                <span className="text-[#94A3B8]"><IconMail /></span>
                <span className="truncate">{client.contact_email || client.email}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2 border-t border-[#F1F5F9] pt-4">
            {onOpen && (
              <button
                type="button"
                onClick={() => onOpen(client.id)}
                className="flex-1 rounded-lg bg-[#005643] py-1.5 text-center text-[12px] font-medium text-white transition hover:bg-[#00442f]"
              >
                Ver detalle
              </button>
            )}
            <ActionBtn onClick={() => onEdit(client)} title="Editar" color="slate">
              <IconEdit />
            </ActionBtn>
            <ActionBtn onClick={() => onDelete(client.id)} title="Eliminar" color="red">
              <IconTrash />
            </ActionBtn>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#94A3B8]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <p className="mt-4 text-[14px] font-medium text-[#0F172A]">
        {hasFilters ? 'Sin resultados' : 'Aún no hay farmacias'}
      </p>
      <p className="mt-1 text-[13px] text-[#94A3B8]">
        {hasFilters
          ? 'Prueba con otros términos de búsqueda'
          : 'Crea la primera farmacia para empezar'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-[13px] font-medium text-[#005643] hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reusable action button
// ---------------------------------------------------------------------------
function ActionBtn({ onClick, title, color = 'slate', children }) {
  const styles = {
    green: 'bg-[#DCFCE7] text-[#166534] hover:bg-[#bbf7d0]',
    slate: 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]',
    red:   'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#fecaca]',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${styles[color]}`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------
function KpiCard({ label, value, sub }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E8EDF2] bg-white p-5">
      <p className="text-[12px] text-[#94A3B8]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#0F172A]">{value}</p>
      {sub && <p className="mt-1 text-[12px] text-[#94A3B8]">{sub}</p>}
    </div>
  )
}
