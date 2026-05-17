import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

function IconSearch() { return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>) }
function IconPhone() { return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>) }
function IconMail() { return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>) }

const ROLE_LABELS = {
  owner:      'Propietario',
  admin:      'Administrador',
  technician: 'Técnico',
  viewer:     'Visualizador',
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'
}
const COLORS = ['#005643','#0369a1','#7c3aed','#b45309','#0f766e','#be123c','#1d4ed8','#15803d']
function avatarColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

// Parsea el campo operators (puede ser string separado por comas/saltos)
function parseOperators(raw) {
  if (!raw || typeof raw !== 'string') return []
  return raw.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean)
}

export default function PeoplePage({ profile }) {
  const [people, setPeople]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState('all') // 'all' | 'internal' | 'pharmacists' | 'operators'

  useEffect(() => { load() }, [profile])

  async function load() {
    setLoading(true)

    const [{ data: clients }, { data: profiles }] = await Promise.all([
      supabase
        .from('clients')
        .select('id, pharmacy_name, name, pharmacist_owner, contact_phone, contact_email, operators')
        .order('pharmacy_name'),
      supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name'),
    ])

    const list = []

    // Titulares de farmacia
    ;(clients || []).forEach(c => {
      if (c.pharmacist_owner?.trim()) {
        list.push({
          id: `owner-${c.id}`,
          name: c.pharmacist_owner.trim(),
          roleLabel: 'Titular',
          pharmacy: c.pharmacy_name || c.name,
          phone: c.contact_phone || null,
          email: c.contact_email || null,
          source: 'pharmacist',
        })
      }

      // Operadores de la farmacia
      parseOperators(c.operators).forEach((op, i) => {
        list.push({
          id: `op-${c.id}-${i}`,
          name: op,
          roleLabel: 'Operador/a',
          pharmacy: c.pharmacy_name || c.name,
          phone: null,
          email: null,
          source: 'operator',
        })
      })
    })

    // Equipo interno
    ;(profiles || []).forEach(p => {
      list.push({
        id: `profile-${p.id}`,
        name: p.full_name || p.email || '—',
        roleLabel: ROLE_LABELS[p.role] || p.role || 'Usuario',
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
    const bySearch = people.filter(p => {
      if (!search) return true
      const text = [p.name, p.roleLabel, p.pharmacy, p.email, p.phone].join(' ').toLowerCase()
      return text.includes(search.toLowerCase())
    })
    if (tab === 'all')          return bySearch
    if (tab === 'internal')     return bySearch.filter(p => p.source === 'internal')
    if (tab === 'pharmacists')  return bySearch.filter(p => p.source === 'pharmacist')
    if (tab === 'operators')    return bySearch.filter(p => p.source === 'operator')
    return bySearch
  }, [people, search, tab])

  const counts = useMemo(() => ({
    total:       people.length,
    internal:    people.filter(p => p.source === 'internal').length,
    pharmacists: people.filter(p => p.source === 'pharmacist').length,
    operators:   people.filter(p => p.source === 'operator').length,
  }), [people])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Personas</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Equipo interno y contactos de farmacia</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total',              value: counts.total,       dot: 'bg-slate-400' },
          { label: 'Equipo interno',     value: counts.internal,    dot: 'bg-[#005643]' },
          { label: 'Titulares',          value: counts.pharmacists, dot: 'bg-violet-500' },
          { label: 'Operadores',         value: counts.operators,   dot: 'bg-sky-500'   },
        ].map(k => (
          <div key={k.label} className="flex flex-col justify-between rounded-2xl border border-[#E8EDF2] bg-white p-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${k.dot}`} />
              <p className="text-[11px] text-[#94A3B8]">{k.label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0F172A]">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"><IconSearch /></span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, rol, farmacia o email..."
          className="w-full rounded-xl border border-[#E8EDF2] bg-white py-2.5 pl-9 pr-4 text-[13px] outline-none placeholder:text-[#94A3B8] focus:border-[#005643] focus:ring-1 focus:ring-[#005643]/20" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] p-1 w-fit">
        {[
          { id: 'all',         label: `Todos (${counts.total})` },
          { id: 'internal',    label: `Equipo (${counts.internal})` },
          { id: 'pharmacists', label: `Titulares (${counts.pharmacists})` },
          { id: 'operators',   label: `Operadores (${counts.operators})` },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-[12px] font-medium transition ${
              tab === t.id ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-12 text-center">
          <p className="text-[14px] font-medium text-[#0F172A]">Sin resultados</p>
          <p className="mt-1 text-[13px] text-[#94A3B8]">Prueba con otros términos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(person => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({ person }) {
  const sourcePill = {
    internal:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
    pharmacist:  'bg-violet-50 text-violet-700 ring-violet-200',
    operator:    'bg-sky-50 text-sky-700 ring-sky-200',
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#E8EDF2] bg-white p-4 hover:shadow-sm transition-shadow">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-semibold text-white"
        style={{ backgroundColor: avatarColor(person.name) }}
      >
        {getInitials(person.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#0F172A]">{person.name}</p>
        <span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${sourcePill[person.source] || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
          {person.roleLabel}
        </span>
        {person.pharmacy && (
          <p className="mt-1 truncate text-[11px] text-[#94A3B8]">{person.pharmacy}</p>
        )}
        {person.phone && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#64748B]">
            <IconPhone />
            <span>{person.phone}</span>
          </div>
        )}
        {person.email && (
          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
            <IconMail />
            <span className="truncate">{person.email}</span>
          </div>
        )}
      </div>
    </div>
  )
}
