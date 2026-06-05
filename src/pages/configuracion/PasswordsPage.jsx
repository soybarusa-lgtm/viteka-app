import { useMemo, useState } from 'react'
import { ArrowPathIcon, CheckCircleIcon, KeyIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import { useVitekaTeam } from '../../hooks/useVitekaTeam'
import { useClientPortalAccess } from '../../hooks/useClientPortalAccess'
import { usePasswordManagement } from '../../hooks/usePasswordManagement'
import { useToast } from '../../context/ToastContext'
import { canResetPassword, canCreateClientAccess, normalizeRole, ROLE_LABELS } from '../../lib/permissions'

const EMPTY_CLIENT = {
  full_name: '',
  email: '',
  pharmacy_id: '',
  role: 'cliente_user',
  is_active: true,
  must_change_password: true,
}

function MemberRow({ member, onReset, onInvite, busy }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-slate-950">{member.full_name}</p>
          <p className="mt-1 text-xs text-slate-500">{member.email || 'Sin email'} - {ROLE_LABELS[normalizeRole(member.role)] || member.role}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {member.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onReset(member)} disabled={busy} className="btn-secondary text-xs">
          <KeyIcon className="h-4 w-4" /> Restablecer
        </button>
        <button type="button" onClick={() => onInvite(member)} disabled={busy} className="btn-ghost border border-slate-200 text-xs">
          <ArrowPathIcon className="h-4 w-4" /> Reenviar acceso
        </button>
      </div>
    </div>
  )
}

export default function PasswordsPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const team = useVitekaTeam(profile)
  const clientAccess = useClientPortalAccess()
  const { forcePasswordChange, resendActivationEmail } = usePasswordManagement()
  const [busyId, setBusyId] = useState('')
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT)

  const manageableTeam = useMemo(
    () => (team.members || []).filter(member => canResetPassword(profile, member)),
    [profile, team.members],
  )

  async function handleReset(member) {
    setBusyId(member.id)
    try {
      await forcePasswordChange({ id: member.id, email: member.email })
      toast(`Se ha generado un cambio de contrasena para ${member.full_name}.`, 'success')
    } catch (error) {
      toast(error.message || 'No se pudo restablecer la contrasena', 'error')
    } finally {
      setBusyId('')
    }
  }

  async function handleInvite(member) {
    setBusyId(member.id)
    try {
      await resendActivationEmail({ id: member.id, email: member.email })
      toast(`Se ha reenviado el acceso a ${member.full_name}.`, 'success')
    } catch (error) {
      toast(error.message || 'No se pudo reenviar el acceso', 'error')
    } finally {
      setBusyId('')
    }
  }

  async function createClientAccess(event) {
    event.preventDefault()
    setBusyId('client-create')
    try {
      await clientAccess.createAccess({
        ...clientForm,
        pharmacy_id: clientForm.pharmacy_id || null,
        role: normalizeRole(clientForm.role),
      })
      toast('Acceso de cliente creado.', 'success')
      setClientForm(EMPTY_CLIENT)
    } catch (error) {
      toast(error.message || 'No se pudo crear el acceso de cliente', 'error')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-950">Contrasenas y accesos</h2>
        <p className="mt-1 text-sm text-slate-500">Gestiona invitaciones, cambios de contrasena y acceso al portal cliente sin exponer credenciales en la interfaz.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <section className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950">Equipo interno</h3>
                <p className="text-xs text-slate-500">Restablece acceso solo a los roles permitidos.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{manageableTeam.length} gestionables</span>
            </div>
          </div>
          <div className="grid gap-3">
            {manageableTeam.map(member => (
              <MemberRow
                key={member.id}
                member={member}
                busy={busyId === member.id}
                onReset={handleReset}
                onInvite={handleInvite}
              />
            ))}
            {!manageableTeam.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                No hay usuarios internos con permisos de gestion disponibles.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <form onSubmit={createClientAccess} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-4 w-4 text-teal-700" />
              <h3 className="text-sm font-extrabold text-slate-950">Crear acceso cliente</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="label">Nombre completo</label>
                <input className="field" value={clientForm.full_name} onChange={event => setClientForm(current => ({ ...current, full_name: event.target.value }))} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="field" type="email" value={clientForm.email} onChange={event => setClientForm(current => ({ ...current, email: event.target.value }))} />
              </div>
              <div>
                <label className="label">Farmacia / acceso</label>
                <input className="field" value={clientForm.pharmacy_id} onChange={event => setClientForm(current => ({ ...current, pharmacy_id: event.target.value }))} placeholder="UUID o referencia de farmacia" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Rol</label>
                  <select className="field" value={clientForm.role} onChange={event => setClientForm(current => ({ ...current, role: event.target.value }))}>
                    <option value="cliente_owner">Cliente administrador</option>
                    <option value="cliente_user">Cliente usuario</option>
                  </select>
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select className="field" value={clientForm.is_active ? 'active' : 'inactive'} onChange={event => setClientForm(current => ({ ...current, is_active: event.target.value === 'active' }))}>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <input type="checkbox" checked={clientForm.must_change_password} onChange={event => setClientForm(current => ({ ...current, must_change_password: event.target.checked }))} />
                Forzar cambio de contrasena al primer acceso
              </label>
            </div>
            <button disabled={busyId === 'client-create'} className="btn-primary mt-4 w-full">
              <PlusIcon className="h-4 w-4" /> {busyId === 'client-create' ? 'Creando...' : 'Crear acceso'}
            </button>
            {!canCreateClientAccess(profile) && (
              <p className="mt-2 text-xs text-amber-700">Tu rol actual no permite crear accesos de cliente, pero puedes revisar la informacion.</p>
            )}
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-950">Accesos cliente existentes</h3>
            <div className="mt-3 space-y-3">
              {(clientAccess.accessList || []).slice(0, 8).map(access => (
                <div key={access.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{access.full_name || access.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{access.email || 'Sin email'} - {normalizeRole(access.role)}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${access.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {access.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => clientAccess.resendInvite({ id: access.id, email: access.email, pharmacy_id: access.pharmacy_id })} className="btn-ghost border border-slate-200 text-xs">
                      <ArrowPathIcon className="h-4 w-4" /> Reenviar
                    </button>
                    <button type="button" onClick={() => clientAccess.resetPassword({ id: access.id, email: access.email, pharmacy_id: access.pharmacy_id })} className="btn-secondary text-xs">
                      <KeyIcon className="h-4 w-4" /> Reset
                    </button>
                    <button type="button" onClick={() => (access.is_active ? clientAccess.disableAccess(access.id) : clientAccess.activateAccess(access.id))} className="btn-ghost border border-slate-200 text-xs">
                      <CheckCircleIcon className="h-4 w-4" /> {access.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
              {!clientAccess.accessList?.length && (
                <p className="text-sm text-slate-400">Aun no hay accesos cliente configurados.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
