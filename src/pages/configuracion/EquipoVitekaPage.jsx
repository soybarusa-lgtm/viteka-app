import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import EquipoVitekaForm from '../../components/configuracion/EquipoVitekaForm'
import EquipoVitekaTable from '../../components/configuracion/EquipoVitekaTable'
import { useAuth } from '../../hooks/useAuth'
import { useVitekaTeam } from '../../hooks/useVitekaTeam'
import { canDeleteTeamMember, canEditTeamMember, canManageRole, ROLES } from '../../lib/permissions'
import { useToast } from '../../context/ToastContext'

const EMPTY_FORM = { full_name: '', email: '', phone: '', role: ROLES.SOPORTE, is_active: true, department: '', internal_notes: '' }

export default function EquipoVitekaPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const team = useVitekaTeam(profile)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    try {
      if (form.id) await team.updateMember(form.id, form)
      else await team.createMember(form)
      setForm(null)
      toast('Equipo Viteka actualizado', 'success')
    } catch (error) {
      toast(error.message || 'No se pudo guardar el usuario', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(member) {
    try {
      if (member.is_active) await team.deactivateMember(member.id)
      else await team.activateMember(member.id)
      toast(member.is_active ? 'Usuario desactivado' : 'Usuario activado', 'success')
    } catch (error) {
      toast(error.message || 'No se pudo cambiar el estado', 'error')
    }
  }

  async function handleDelete(member) {
    if (!window.confirm(`Borrar a ${member.full_name}?`)) return
    try {
      await team.deleteMember(member.id)
      toast('Usuario borrado', 'success')
    } catch (error) {
      toast(error.message || 'No se pudo borrar el usuario', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">Equipo Viteka</h2>
          <p className="text-sm text-slate-500">{team.usingMocks ? 'Datos de demostracion hasta aplicar la migracion.' : 'Usuarios internos conectados a perfiles.'}</p>
          {team.error && <p className="mt-1 text-xs text-amber-600">{team.error}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{team.metrics.total} personas</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{team.metrics.active} activas</span>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">{team.metrics.admins} admin</span>
          <button type="button" onClick={openNew} className="btn-primary"><PlusIcon className="h-4 w-4" /> Nueva persona</button>
        </div>
      </div>

      {form && (
        <EquipoVitekaForm
          value={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={() => setForm(null)}
          canAssignRole={role => canManageRole(profile, role)}
          saving={saving}
        />
      )}

      {team.loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Cargando equipo...</div>
      ) : (
        <EquipoVitekaTable
          members={team.members}
          onEdit={member => setForm(member)}
          onToggleActive={handleToggle}
          onDelete={handleDelete}
          canEdit={member => canEditTeamMember(profile, member)}
          canDelete={member => canDeleteTeamMember(profile, member)}
        />
      )}
    </div>
  )
}
