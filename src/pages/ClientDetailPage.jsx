import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Icons ──────────────────────────────────────────────────────────────────
function IconArrow() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>)
}
function IconPhone() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>)
}
function IconMail() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>)
}
function IconPin() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>)
}
function IconFolder() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>)
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
}
const COLORS = ['#005643','#0369a1','#7c3aed','#b45309','#0f766e','#be123c','#1d4ed8','#15803d']
function avatarColor(str = '') {
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

const STATUS = {
  draft:     { label: 'Borrador',   pill: 'bg-amber-50 text-amber-700 ring-amber-200' },
  active:    { label: 'Activo',     pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  completed: { label: 'Completado', pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
  cancelled: { label: 'Cancelado',  pill: 'bg-red-50 text-red-600 ring-red-200' },
}
function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function ClientDetailPage({ clientId, onBack }) {
  const [client, setClient]   = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('info') // 'info' | 'projects'

  useEffect(() => {
    if (!clientId) return
    load()
  }, [clientId])

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: ps }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    ])
    setClient(c || null)
    setProjects(ps || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[14px] font-medium text-[#0F172A]">Farmacia no encontrada</p>
        <button type="button" onClick={onBack} className="mt-4 text-[13px] text-[#005643] hover:underline">Volver</button>
      </div>
    )
  }

  const color  = avatarColor(client.pharmacy_name || client.name)
  const active = projects.filter(p => p.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-[13px] text-[#64748B] transition hover:text-[#0F172A]"
        >
          <IconArrow /> Volver a farmacias
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {getInitials(client.pharmacy_name || client.name)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">
              {client.pharmacy_name || client.name}
            </h1>
            <p className="mt-0.5 text-sm text-[#94A3B8]">
              {client.pharmacist_owner || 'Sin titular registrado'}
            </p>
          </div>
          {/* Mini stats */}
          <div className="flex gap-4 sm:ml-auto">
            <Stat label="Proyectos" value={projects.length} />
            <Stat label="Activos"   value={active} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] p-1 w-fit">
        {['info', 'projects'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition ${
              tab === t ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t === 'info' ? 'Información' : (<><IconFolder /> Proyectos <span className="ml-1 rounded-full bg-[#E8EDF2] px-1.5 py-0.5 text-[11px]">{projects.length}</span></>)}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <InfoCard title="Contacto principal">
            <InfoRow icon={<IconPhone />} label="Teléfono" value={client.contact_phone || client.phone} />
            <InfoRow icon={<IconMail />}  label="Email"    value={client.contact_email || client.email} />
          </InfoCard>

          <InfoCard title="Ubicación">
            <InfoRow icon={<IconPin />} label="Dirección" value={client.address} />
            <InfoRow icon={<IconPin />} label="Ciudad"    value={client.city} />
            <InfoRow icon={<IconPin />} label="Provincia" value={client.province} />
          </InfoCard>

          <InfoCard title="Datos empresariales">
            <InfoRow label="NIF/CIF"           value={client.nif_cif} />
            <InfoRow label="Nº SOE"            value={client.soe_number} />
            <InfoRow label="CIP"               value={client.cip} />
            <InfoRow label="Email negocio"     value={client.business_email} />
            <InfoRow label="Teléfono negocio"  value={client.business_phone} />
          </InfoCard>

          <InfoCard title="Datos colegiales">
            <InfoRow label="Datos colegiales"  value={client.collegiate_data} />
            <InfoRow label="Datos empresa"     value={client.company_data} />
            <InfoRow label="Operadores"        value={client.operators} />
          </InfoCard>

          {(client.observations || client.notes) && (
            <div className="lg:col-span-2">
              <InfoCard title="Observaciones">
                <p className="text-[13px] leading-relaxed text-[#64748B]">{client.observations || client.notes}</p>
              </InfoCard>
            </div>
          )}
        </div>
      )}

      {/* Tab: Projects */}
      {tab === 'projects' && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-12 text-center">
              <p className="text-[14px] font-medium text-[#0F172A]">Sin proyectos</p>
              <p className="mt-1 text-[13px] text-[#94A3B8]">Esta farmacia no tiene proyectos asignados</p>
            </div>
          ) : (
            projects.map(p => {
              const b = STATUS[p.status] || STATUS.active
              return (
                <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-[#E8EDF2] bg-white p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#0F172A] truncate">{p.name}</p>
                    {p.notes && <p className="mt-0.5 text-[12px] text-[#94A3B8] truncate">{p.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${b.pill}`}>{b.label}</span>
                    <span className="text-[12px] text-[#94A3B8]">{fmtDate(p.created_at)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5">
      <p className="mb-4 text-[12px] font-medium uppercase tracking-wider text-[#94A3B8]">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 shrink-0 text-[#94A3B8]">{icon}</span>}
      <div>
        <p className="text-[11px] text-[#94A3B8]">{label}</p>
        <p className="text-[13px] text-[#334155]">{value}</p>
      </div>
    </div>
  )
}
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E8EDF2] bg-white px-4 py-2 text-center">
      <p className="text-xl font-semibold text-[#0F172A]">{value}</p>
      <p className="text-[11px] text-[#94A3B8]">{label}</p>
    </div>
  )
}
