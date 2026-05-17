import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function IconSearch() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }
function IconPhone() { return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>) }
function IconMail() { return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>) }

function getInitials(name = '') { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?' }
const COLORS = ['#005643','#0369a1','#7c3aed','#b45309','#0f766e','#be123c','#1d4ed8','#15803d']
function avatarColor(str = '') { let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length] }

export default function PeoplePage() {
  const [people, setPeople]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Load people from clients (pharmacist_owner + operators) and profiles
    const [{ data: clients }, { data: profiles }] = await Promise.all([
      supabase.from('clients').select('id, pharmacy_name, name, pharmacist_owner, contact_phone, contact_email, operators').order('pharmacy_name'),
      supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    ])

    // Build unified people list
    const list = []

    // Pharmacist owners from clients
    ;(clients || []).forEach(c => {
      if (c.pharmacist_owner) {
        list.push({
          id: `client-${c.id}`,
          name: c.pharmacist_owner,
          role: 'Titular de farmacia',
          pharmacy: c.pharmacy_name || c.name,
          phone: c.contact_phone,
          email: c.contact_email,
          source: 'client',
        })
      }
    })

    // Internal team
    ;(profiles || []).forEach(p => {
      list.push({
        id: `profile-${p.id}`,
        name: p.full_name || p.email,
        role: p.role,
        pharmacy: null,
        phone: null,
        email: p.email,
        source: 'internal',
      })
    })

    setPeople(list)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return people.filter(p => {
      const text = [p.name, p.role, p.pharmacy, p.email, p.phone].join(' ').toLowerCase()
      return !search || text.includes(search.toLowerCase())
    })
  }, [people, search])

  const internal = filtered.filter(p => p.source === 'internal')
  const external = filtered.filter(p => p.source === 'client')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Personas</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Equipo interno y titulares de farmacia</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total personas" value={people.length} />
        <KpiCard label="Equipo interno" value={internal.length} />
        <KpiCard label="Titulares farmacia" value={external.length} />
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, rol, farmacia o email..."
          className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" /></div>
      ) : (
        <div className="space-y-6">
          {internal.length > 0 && (
            <PeopleSection title="Equipo interno" people={internal} />
          )}
          {external.length > 0 && (
            <PeopleSection title="Titulares de farmacia" people={external} />
          )}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-12 text-center">
              <p className="text-[14px] font-medium text-[#0F172A]">Sin resultados</p>
              <p className="mt-1 text-[13px] text-[#94A3B8]">Prueba con otros términos</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PeopleSection({ title, people }) {
  return (
    <div>
      <p className="mb-3 text-[12px] font-medium uppercase tracking-wider text-[#94A3B8]">{title}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map(person => (
          <div key={person.id} className="flex items-start gap-3 rounded-2xl border border-[#E8EDF2] bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold text-white"
              style={{ backgroundColor: avatarColor(person.name) }}>
              {getInitials(person.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#0F172A]">{person.name}</p>
              <p className="text-[11px] text-[#94A3B8]">{person.role}</p>
              {person.pharmacy && <p className="mt-0.5 truncate text-[11px] text-[#94A3B8]">{person.pharmacy}</p>}
              {person.phone && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#64748B]"><IconPhone />{person.phone}</div>
              )}
              {person.email && (
                <div className="flex items-center gap-1 text-[11px] text-[#64748B]"><IconMail />{person.email}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5">
      <p className="text-[12px] text-[#94A3B8]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">{value}</p>
    </div>
  )
}
