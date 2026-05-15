import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function UsersPage({ currentUser, onUserUpdated }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('portal_type', 'internal')
      .order('created_at', { ascending: false })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setUsers(data || [])
  }

  async function updateUser(userId, patch) {
    const previous = users.find(user => user.id === userId)

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setUsers(current =>
      current.map(user => (user.id === userId ? data : user))
    )

    if (onUserUpdated) {
      await onUserUpdated(previous, data)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8">
        <p className="text-[#64748B]">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
          Usuarios internos
        </h1>
        <p className="mt-3 text-base text-[#64748B]">
          Gestión de nombre y rol del equipo interno.
        </p>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Nombre
                </th>
                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Rol
                </th>
                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Portal
                </th>
                <th className="px-6 py-5 text-left text-xs uppercase tracking-wide text-[#64748B] font-medium">
                  Creado
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map(user => {
                const isOwner = user.role === 'owner'
                const isSelf = currentUser?.id === user.id
                const canEditRole = !isOwner && !isSelf

                return (
                  <tr key={user.id} className="border-b border-[#F1F5F9]">
                    <td className="px-6 py-5">
                      <input
                        value={user.full_name || ''}
                        onChange={e => {
                          const value = e.target.value
                          setUsers(current =>
                            current.map(item =>
                              item.id === user.id
                                ? { ...item, full_name: value }
                                : item
                            )
                          )
                        }}
                        onBlur={e => {
                          const value = e.target.value.trim()
                          if (!value || value === (user.full_name || '')) return
                          updateUser(user.id, { full_name: value })
                        }}
                        className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm"
                      />
                    </td>

                    <td className="px-6 py-5">
                      <select
                        value={user.role}
                        disabled={!canEditRole}
                        onChange={e => updateUser(user.id, { role: e.target.value })}
                        className="rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm disabled:opacity-60"
                      >
                        {isOwner ? (
                          <option value="owner">owner</option>
                        ) : (
                          <>
                            <option value="admin">admin</option>
                            <option value="technician">technician</option>
                            <option value="client">client</option>
                          </>
                        )}
                      </select>

                      {isSelf && (
                        <p className="mt-1 text-xs text-[#64748B]">Tu usuario actual</p>
                      )}
                    </td>

                    <td className="px-6 py-5 text-sm text-[#334155]">
                      {user.portal_type || '-'}
                    </td>

                    <td className="px-6 py-5 text-sm text-[#334155]">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleString('es-ES')
                        : '-'}
                    </td>
                  </tr>
                )
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-[#64748B]">
                    No hay usuarios internos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}