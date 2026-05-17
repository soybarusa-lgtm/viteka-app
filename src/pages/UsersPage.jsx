import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROLES = [
  { value: 'owner',      label: 'Propietario', pill: 'bg-violet-50 text-violet-700 ring-violet-200' },
  { value: 'admin',      label: 'Admin',        pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { value: 'technician', label: 'Técnico',      pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'viewer',     label: 'Visor',        pill: 'bg-slate-100 text-slate-600 ring-slate-200' },
]
function roleStyle(r) { return ROLES.find(x => x.value === r) || ROLES[3] }
function getInitials(name = '') { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?' }
const COLORS = ['#005643','#0369a1','#7c3aed','#b45309','#0f766e','#be123c','#1d4ed8','#15803d']
function avatarColor(str = '') { let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length] }
function fmtDate(str) { if (!str) return '—'; return new Date(str).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) }

export default function UsersPage({ currentUser, onUserUpdated }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    setUsers(data || [])
    setLoading(false)
  }

  async function changeRole(user, role) {
    if (user.role === role) return
    setSaving(user.id)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id)
    if (error) { alert(error.message); setSaving(null); return }
    onUserUpdated?.(user, { ...user, role })
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role } : u))
    setSaving(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Usuarios</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Gestión de accesos y roles del equipo</p>
      </div>

      {/* Roles legend */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => (
          <span key={r.value} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${r.pill}`}>
            {r.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#005643] border-t-transparent" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Usuario', 'Rol', 'Portal', 'Creado', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {users.map(user => {
                const r = roleStyle(user.role)
                const isSelf = user.id === currentUser?.id
                return (
                  <tr key={user.id} className="hover:bg-[#FAFBFC]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold text-white"
                          style={{ backgroundColor: avatarColor(user.full_name || user.email) }}>
                          {getInitials(user.full_name || user.email)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[#0F172A]">{user.full_name || '—'}</p>
                          <p className="text-[12px] text-[#94A3B8]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${r.pill}`}>{r.label}</span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#64748B]">
                      {user.portal_type === 'client' ? 'Cliente' : 'Interno'}
                    </td>
                    <td className="px-6 py-4 text-[12px] text-[#94A3B8]">{fmtDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      {!isSelf && (
                        <select
                          value={user.role || 'viewer'}
                          onChange={e => changeRole(user, e.target.value)}
                          disabled={saving === user.id}
                          className="rounded-xl border border-[#E8EDF2] bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-[#005643] disabled:opacity-60">
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
