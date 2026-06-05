import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { vitekaTeamMock } from '../lib/configurationMockData'
import { canDeleteTeamMember, canEditTeamMember, canManageRole, normalizeRole, ROLES } from '../lib/permissions'
import { logAuditEvent } from '../lib/auditLog'

const INTERNAL_ROLES = new Set([ROLES.OWNER, ROLES.ADMINISTRADOR, ROLES.SOPORTE, ROLES.ADMINISTRACION])

function normalizeMember(row) {
  return {
    id: row.id,
    full_name: row.full_name || row.email || 'Sin nombre',
    email: row.email || '',
    phone: row.phone || '',
    role: normalizeRole(row.role),
    is_active: row.is_active !== false,
    department: row.department || '',
    internal_notes: row.internal_notes || '',
    last_login_at: row.last_login_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
    auth_user_id: row.auth_user_id || null,
    must_change_password: row.must_change_password === true,
  }
}

export function useVitekaTeam(currentUserProfile) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingMocks, setUsingMocks] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    let { data, error: membersError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, is_active, department, internal_notes, last_login_at, created_at, updated_at, auth_user_id, must_change_password')
      .order('full_name', { ascending: true })

    if (membersError) {
      ;({ data, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, role, company_id, auth_user_id, must_change_password')
        .order('full_name', { ascending: true }))
    }

    if (membersError) {
      setMembers(vitekaTeamMock)
      setUsingMocks(true)
      setError(membersError.message)
      setLoading(false)
      return
    }

    const normalized = (data || [])
      .map(normalizeMember)
      .filter(member => INTERNAL_ROLES.has(normalizeRole(member.role)))

    setMembers(normalized.length ? normalized : vitekaTeamMock)
    setUsingMocks(!normalized.length)
    setLoading(false)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect -- reload sincroniza el hook con Supabase al montar. */
  useEffect(() => {
    reload()
  }, [reload])
  /* eslint-enable react-hooks/set-state-in-effect */

  const guardEdit = useCallback((member) => {
    if (!canEditTeamMember(currentUserProfile, member)) throw new Error('No tienes permisos para editar este usuario.')
  }, [currentUserProfile])

  const createMember = useCallback(async (payload) => {
    if (!canManageRole(currentUserProfile, payload.role)) throw new Error('No tienes permisos para asignar este rol.')
    const timestamp = new Date().toISOString()
    const optimisticMember = normalizeMember({ ...payload, id: crypto.randomUUID(), created_at: timestamp, updated_at: timestamp })
    let createdId = optimisticMember.id
    if (usingMocks) {
      setMembers(prev => [optimisticMember, ...prev])
    } else {
      const { data, error: fnError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          ...payload,
          target_type: 'internal',
        },
      })
      if (fnError) throw fnError
      createdId = data?.user?.id || optimisticMember.id
      const createdMember = normalizeMember({
        ...payload,
        id: createdId,
        auth_user_id: createdId,
        created_at: timestamp,
        updated_at: timestamp,
      })
      if (data?.access) {
        setMembers(prev => [normalizeMember(data.access), ...prev])
      } else {
        setMembers(prev => [createdMember, ...prev])
      }
    }
    await logAuditEvent('team.create', 'profiles', createdId, null, payload)
  }, [currentUserProfile, usingMocks])

  const updateMember = useCallback(async (id, payload) => {
    const target = members.find(member => member.id === id)
    guardEdit(target)
    if (payload.role && !canManageRole(currentUserProfile, payload.role)) throw new Error('No tienes permisos para asignar este rol.')
    const nextPayload = { ...payload, updated_at: new Date().toISOString() }
    if (!usingMocks) {
      const safePayload = { ...nextPayload }
      delete safePayload.email
      let { error: updateError } = await supabase.from('profiles').update(safePayload).eq('id', id)
      if (updateError && /department|schema cache/i.test(updateError.message || '')) {
        const fallbackPayload = { ...safePayload }
        delete fallbackPayload.department
        ;({ error: updateError } = await supabase.from('profiles').update(fallbackPayload).eq('id', id))
      }
      if (updateError) throw updateError
    }
    setMembers(prev => prev.map(member => member.id === id ? normalizeMember({ ...member, ...nextPayload }) : member))
    await logAuditEvent('team.update', 'profiles', id, target, nextPayload)
  }, [currentUserProfile, guardEdit, members, usingMocks])

  const changeRole = useCallback((id, role) => updateMember(id, { role: normalizeRole(role) }), [updateMember])
  const activateMember = useCallback((id) => updateMember(id, { is_active: true }), [updateMember])
  const deactivateMember = useCallback((id) => updateMember(id, { is_active: false }), [updateMember])

  const deleteMember = useCallback(async (id) => {
    const target = members.find(member => member.id === id)
    if (!canDeleteTeamMember(currentUserProfile, target)) throw new Error('No tienes permisos para borrar este usuario.')
    const ownerCount = members.filter(member => normalizeRole(member.role) === ROLES.OWNER).length
    if (normalizeRole(target?.role) === ROLES.OWNER && ownerCount <= 1) throw new Error('No puedes borrar el ultimo superadministrador.')
    if (!usingMocks) {
      const { error: deleteError } = await supabase.from('profiles').delete().eq('id', id)
      if (deleteError) throw deleteError
    }
    setMembers(prev => prev.filter(member => member.id !== id))
    await logAuditEvent('team.delete', 'profiles', id, target, null)
  }, [currentUserProfile, members, usingMocks])

  const metrics = useMemo(() => ({
    total: members.length,
    active: members.filter(member => member.is_active).length,
    admins: members.filter(member => [ROLES.OWNER, ROLES.ADMINISTRADOR].includes(normalizeRole(member.role))).length,
  }), [members])

  return { members, metrics, loading, error, usingMocks, createMember, updateMember, changeRole, activateMember, deactivateMember, deleteMember, reload }
}
