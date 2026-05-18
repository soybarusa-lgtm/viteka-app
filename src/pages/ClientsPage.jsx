import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function Icon({ children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )
}
function IconSearch() { return <Icon><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon> }
function IconEdit()   { return <Icon size={14}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon> }
function IconTrash()  { return <Icon size={14}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Icon> }
function IconEye()    { return <Icon size={14}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon> }
function IconPin()    { return <Icon size={13}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon> }
function IconPhone()  { return <Icon size={13}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></Icon> }
function IconMail()   { return <Icon size={13}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Icon> }
function IconGrid()   { return <Icon size={15}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Icon> }
function IconList()   { return <Icon size={15}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Icon> }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PROVINCES_AN = ['Almería','Cádiz','Córdoba','Granada','Huelva','Jaén','Málaga','Sevilla']

const AVATAR_COLORS = ['#005643','#0369a1','#7c3aed','#b45309','#0f766e','#be123c','#1d4ed8','#15803d']
function avatarColor(str = '') {
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const VITEKA_PRODUCTS = [
  { key: 'nixfarma',    label: 'Nixfarma' },
  { key: 'cashlogy',   label: 'Cashlogy' },
  { key: 'hanshow',    label: 'Hanshow' },
  { key: 'equipos',    label: 'Equipos informáticos' },
  { key: 'basculas',   label: 'Básculas' },
  { key: 'antihurto',  label: 'Arcos antihurto' },
  { key: 'consultoria',label: 'Viteka Pro Gestión' },
  { key: 'otros',      label: 'Otros' },
]
const THIRD_PRODUCTS = [
  { key: 'erp',        label: 'ERP' },
  { key: 'caja_cobro', label: 'Caja de cobro' },
  { key: 'etiquetas',  label: 'Etiquetas electrónicas' },
  { key: 'equipos',    label: 'Equipos informáticos' },
  { key: 'basculas',   label: 'Básculas' },
  { key: 'antihurto',  label: 'Arcos antihurto' },
  { key: 'consultoria',label: 'Consultoría' },
  { key: 'otros',      label: 'Otros' },
]

// ---------------------------------------------------------------------------
// ClientsPage
// ---------------------------------------------------------------------------
export default function ClientsPage({
  clients = [],
  products = [],
  onCreateClient,
  onEditClient,
  onDeleteClient,
  onOpenClient,
  profile,
}) {
  const [search,   setSearch]   = useState('')
  const [province, setProvince] = useState('')
  const [view,     setView]     = useState('table')

  const byProvince = useMemo(() => {
    return PROVINCES_AN.map(p => ({
      label: p,
      count: clients.filter(c => c.province === p).length,
    }))
  }, [clients])

  const vitekaCounters = useMemo(() => {
    const vProducts = products.filter(p => p.viteka_support === true)
    return VITEKA_PRODUCTS.map(({ key, label }) => {
      const catMap = {
        nixfarma:    p => p.category === 'erp'        && p.brand?.toLowerCase() === 'nixfarma',
        cashlogy:    p => p.category === 'caja_cobro' && p.brand?.toLowerCase() === 'cashlogy',
        hanshow:     p => p.category === 'etiquetas'  && p.brand?.toLowerCase() === 'hanshow',
        equipos:     p => p.category === 'equipos',
        basculas:    p => p.category === 'basculas',
        antihurto:   p => p.category === 'antihurto',
        consultoria: p => p.category === 'consultoria' && p.brand?.toLowerCase().includes('viteka'),
        otros:       p => p.category === 'otros',
      }
      const fn = catMap[key] || (() => false)
      const clientIds = [...new Set(vProducts.filter(fn).map(p => p.client_id))]
      return { label, count: clientIds.length }
    })
  }, [products])

  const thirdCounters = useMemo(() => {
    const tProducts = products.filter(p => p.viteka_support === false)
    return THIRD_PRODUCTS.map(({ key, label }) => {
      const clientIds = [...new Set(tProducts.filter(p => p.category === key).map(p => p.client_id))]
      return { label, count: clientIds.length }
    })
  }, [products])

  const filtered = useMemo(() => {
    return clients.filter(c => {
      const text = [
        c.name, c.pharmacy_name, c.pharmacist_owner,
        c.email, c.contact_email, c.phone, c.contact_phone,
        c.city, c.province, c.nif_cif, c.tax_id, c.notes, c.observations,
      ].join(' ').toLowerCase()
      return (!search || text.includes(search.toLowerCase()))
          && (!province || c.province === province)
    })
  }, [clients, search, province])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Farmacias</h1>
          <p className="page-subtitle">Gestión de clientes, contactos y datos operativos</p>
        </div>
        {/* Delegar apertura del modal al padre (App.jsx) */}
        <button type="button" onClick={onCreateClient}
          className="btn-primary flex items-center gap-2 text-[13px]">
          <span className="text-base leading-none">+</span> Nueva farmacia
        </button>
      </div>

      {/* Por provincia */}
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Farmacias por provincia
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {byProvince.map(({ label, count }) => (
            <div key={label} className="card flex flex-col items-center justify-center gap-1 p-4 text-center">
              <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{count}</span>
              <span className="text-[11px] leading-tight" style={{ color: 'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Productos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Productos Viteka</h2>
            <span className="ml-auto text-[11px]" style={{ color: 'var(--muted)' }}>distribuidor y/o soporte</span>
          </div>
          <div className="space-y-2">
            {vitekaCounters.map(({ label, count }) => (
              <ProductBar key={label} label={label} count={count} total={clients.length} color="emerald" />
            ))}
          </div>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Productos de terceros</h2>
            <span className="ml-auto text-[11px]" style={{ color: 'var(--muted)' }}>sin distribución Viteka</span>
          </div>
          <div className="space-y-2">
            {thirdCounters.map(({ label, count }) => (
              <ProductBar key={label} label={label} count={count} total={clients.length} color="amber" />
            ))}
          </div>
        </section>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}><IconSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, NIF, email, teléfono, ciudad..."
            className="input w-full pl-9" />
        </div>
        <select value={province} onChange={e => setProvince(e.target.value)} className="input sm:w-[180px]">
          <option value="">Todas las provincias</option>
          {PROVINCES_AN.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          {[['table', <IconList />,'Lista'],['grid', <IconGrid />,'Tarjetas']].map(([v, icon, lbl]) => (
            <button key={v} type="button" onClick={() => setView(v)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition"
              style={view === v ? { background: 'var(--primary)', color: '#fff' } : { color: 'var(--muted)' }}>
              {icon} {lbl}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
        {filtered.length === clients.length ? `${clients.length} farmacias` : `${filtered.length} de ${clients.length} farmacias`}
      </p>

      {filtered.length === 0
        ? <EmptyState hasFilters={Boolean(search || province)} onClear={() => { setSearch(''); setProvince('') }} />
        : view === 'table'
          ? <TableView clients={filtered} onOpen={onOpenClient} onEdit={onEditClient} onDelete={onDeleteClient} />
          : <GridView  clients={filtered} onOpen={onOpenClient} onEdit={onEditClient} onDelete={onDeleteClient} />
      }
    </div>
  )
}

// ---------------------------------------------------------------------------
// ProductBar
// ---------------------------------------------------------------------------
function ProductBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const colors = {
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
    amber:   { bar: 'bg-amber-400',   text: 'text-amber-600' },
  }
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[12px]" style={{ color: 'var(--text-soft)' }}>{label}</span>
        <span className={`text-[12px] font-semibold ${colors[color].text}`}>{count}</span>
      </div>
      <div className="h-1.5 w-full rounded-full" style={{ background: 'var(--surface-soft)' }}>
        <div className={`h-1.5 rounded-full transition-all ${colors[color].bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TableView
// ---------------------------------------------------------------------------
function TableView({ clients, onOpen, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="table-base min-w-[700px]">
        <thead>
          <tr>{['Farmacia','Titular','Tipo jurídico','Provincia / Ciudad','Contacto',''].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr key={c.id} className="group">
              <td>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold text-white"
                    style={{ backgroundColor: avatarColor(c.pharmacy_name || c.name) }}>
                    {getInitials(c.pharmacy_name || c.name)}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>{c.pharmacy_name || c.name}</p>
                    {c.name !== c.pharmacy_name && c.name && (
                      <p className="text-[12px]" style={{ color: 'var(--muted)' }}>{c.name}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="text-[13px]" style={{ color: 'var(--text-soft)' }}>{c.pharmacist_owner || '—'}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {(c.legal_type || []).map(t => (
                    <span key={t} className="rounded-md px-2 py-0.5 text-[11px] font-medium uppercase"
                      style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)' }}>
                      {t}
                    </span>
                  ))}
                  {!c.legal_type?.length && <span className="text-[12px]" style={{ color: 'var(--muted)' }}>—</span>}
                </div>
              </td>
              <td>
                {(c.province || c.city) ? (
                  <div className="flex items-center gap-1.5 text-[13px]" style={{ color: 'var(--text-soft)' }}>
                    <span style={{ color: 'var(--muted)' }}><IconPin /></span>
                    {[c.city, c.province].filter(Boolean).join(', ')}
                  </div>
                ) : <span className="text-[13px]" style={{ color: 'var(--muted)' }}>—</span>}
              </td>
              <td>
                <div className="space-y-1">
                  {(c.contact_phone || c.phone) && (
                    <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-soft)' }}>
                      <span style={{ color: 'var(--muted)' }}><IconPhone /></span>{c.contact_phone || c.phone}
                    </div>
                  )}
                  {(c.contact_email || c.email) && (
                    <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-soft)' }}>
                      <span style={{ color: 'var(--muted)' }}><IconMail /></span>{c.contact_email || c.email}
                    </div>
                  )}
                  {!c.contact_phone && !c.phone && !c.contact_email && !c.email && (
                    <span className="text-[12px]" style={{ color: 'var(--muted)' }}>Sin contacto</span>
                  )}
                </div>
              </td>
              <td>
                <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {onOpen && <ActionBtn onClick={() => onOpen(c.id)} title="Ver detalle" color="green"><IconEye /></ActionBtn>}
                  <ActionBtn onClick={() => onEdit(c)}      title="Editar"    color="slate"><IconEdit /></ActionBtn>
                  <ActionBtn onClick={() => onDelete(c.id)} title="Eliminar"  color="red"><IconTrash /></ActionBtn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// GridView
// ---------------------------------------------------------------------------
function GridView({ clients, onOpen, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map(c => (
        <div key={c.id} className="group card flex flex-col p-5 transition hover:shadow-sm"
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold text-white"
              style={{ backgroundColor: avatarColor(c.pharmacy_name || c.name) }}>
              {getInitials(c.pharmacy_name || c.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium" style={{ color: 'var(--text)' }}>{c.pharmacy_name || c.name}</p>
              {c.pharmacist_owner && <p className="truncate text-[12px]" style={{ color: 'var(--muted)' }}>{c.pharmacist_owner}</p>}
            </div>
          </div>
          <div className="mt-4 flex-1 space-y-2">
            {(c.province || c.city) && (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-soft)' }}>
                <span style={{ color: 'var(--muted)' }}><IconPin /></span>
                <span className="truncate">{[c.city, c.province].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {(c.contact_phone || c.phone) && (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-soft)' }}>
                <span style={{ color: 'var(--muted)' }}><IconPhone /></span>
                <span className="truncate">{c.contact_phone || c.phone}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {onOpen && (
              <button type="button" onClick={() => onOpen(c.id)} className="btn-primary flex-1 py-1.5 text-center text-[12px]">Ver detalle</button>
            )}
            <ActionBtn onClick={() => onEdit(c)}      title="Editar"   color="slate"><IconEdit /></ActionBtn>
            <ActionBtn onClick={() => onDelete(c.id)} title="Eliminar" color="red"><IconTrash /></ActionBtn>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="empty-state">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--surface-soft)', color: 'var(--muted)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <p className="mt-4 text-[14px] font-medium" style={{ color: 'var(--text)' }}>
        {hasFilters ? 'Sin resultados' : 'Aún no hay farmacias'}
      </p>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
        {hasFilters ? 'Prueba con otros términos de búsqueda' : 'Crea la primera farmacia para empezar'}
      </p>
      {hasFilters && (
        <button type="button" onClick={onClear}
          className="mt-4 text-[13px] font-medium hover:underline" style={{ color: 'var(--primary)' }}>
          Limpiar filtros
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActionBtn
// ---------------------------------------------------------------------------
function ActionBtn({ onClick, title, color = 'slate', children }) {
  const styles = {
    green: { background: 'var(--badge-green-bg)', color: 'var(--badge-green-text)' },
    slate: { background: 'var(--surface-soft)',   color: 'var(--text-soft)' },
    red:   { background: 'var(--badge-red-bg)',   color: 'var(--badge-red-text)' },
  }
  return (
    <button type="button" onClick={onClick} title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-80"
      style={styles[color]}>{children}</button>
  )
}
