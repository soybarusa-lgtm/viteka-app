import { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon, KeyIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useClientPortalAccess } from '../../hooks/useClientPortalAccess'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { normalizeRole } from '../../lib/permissions'

const EMPTY_FORM = {
  full_name: '',
  email: '',
  pharmacy_id: '',
  person_id: '',
  role: 'cliente_user',
  is_active: true,
  must_change_password: true,
}

export default function PortalClientePage() {
  const toast = useToast()
  const portal = useClientPortalAccess()
  const [pharmacies, setPharmacies] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState('')

  useEffect(() => {
    let mounted = true
    async function loadPharmacies() {
      const { data } = await supabase.from('pharmacies').select('id, pharmacy_name, city, province').order('pharmacy_name')
      if (mounted) setPharmacies(data || [])
    }
    loadPharmacies()
    return () => { mounted = false }
  }, [])

  const pharmacyOptions = useMemo(() => pharmacies.map(pharmacy => ({
    id: pharmacy.id,
    label: [pharmacy.pharmacy_name, pharmacy.city, pharmacy.province].filter(Boolean).join(' - '),
  })), [pharmacies])

  async function submit(event) {
    event.preventDefault()
    setBusy('create')
    try {
      await portal.createAccess({ ...form, role: normalizeRole(form.role) })
      toast('Acceso de cliente creado.', 'success')
      setForm(EMPTY_FORM)
    } catch (error) {
      toast(error.message || 'No se pudo crear el acceso de cliente', 'error')
    } finally {
      setBusy('')
    }
  }

  async function toggleAccess(access) {
    setBusy(access.id)
    try {
      if (access.is_active) await portal.disableAccess(access.id)
      else await portal.activateAccess(access.id)
      toast(access.is_active ? 'Acceso desactivado' : 'Acceso activado', 'success')
    } catch (error) {
      toast(error.message || 'No se pudo cambiar el estado', 'error')
    } finally {
      setBusy('')
    }
  }

  async function removeAccess(access) {
    if (!window.confirm(`Eliminar el acceso de ${access.full_name || access.email}?`)) return
    setBusy(`delete-${access.id}`)
    try {
      await portal.deleteAccess(access.id)
      toast('Acceso eliminado', 'success')
    } catch (error) {
      toast(error.message || 'No se pudo eliminar el acceso', 'error')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-950">Portal cliente</h2>
        <p className="mt-1 text-sm text-slate-500">Crea y mantiene los accesos cliente sin guardar contrasenas en texto plano. Los envios de acceso y reset se resuelven con funciones seguras.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={submit} className="card space-y-4 p-4">
          <div className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4 text-teal-700" />
            <h3 className="text-sm font-extrabold text-slate-950">Nuevo acceso</h3>
          </div>

          <div>
            <label className="label">Nombre completo</label>
            <input className="field" value={form.full_name} onChange={event => setForm(current => ({ ...current, full_name: event.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} />
          </div>
          <div>
            <label className="label">Farmacia</label>
            <select className="field" value={form.pharmacy_id} onChange={event => setForm(current => ({ ...current, pharmacy_id: event.target.value }))}>
              <option value="">Seleccione una farmacia</option>
              {pharmacyOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Persona vinculada</label>
            <input className="field" value={form.person_id} onChange={event => setForm(current => ({ ...current, person_id: event.target.value }))} placeholder="UUID o id de persona" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Rol</label>
              <select className="field" value={form.role} onChange={event => setForm(current => ({ ...current, role: event.target.value }))}>
                <option value="cliente_owner">Cliente administrador</option>
                <option value="cliente_user">Cliente usuario</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="field" value={form.is_active ? 'active' : 'inactive'} onChange={event => setForm(current => ({ ...current, is_active: event.target.value === 'active' }))}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.must_change_password} onChange={event => setForm(current => ({ ...current, must_change_password: event.target.checked }))} />
            Obligar cambio de contrasena al primer acceso
          </label>

          <button disabled={busy === 'create'} className="btn-primary w-full">
            <KeyIcon className="h-4 w-4" /> {busy === 'create' ? 'Creando...' : 'Crear acceso'}
          </button>
        </form>

        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">Accesos creados</h3>
              <p className="text-xs text-slate-500">Gestiona invitaciones, estado y bajas rapidas.</p>
            </div>
            <button type="button" onClick={portal.reload} className="btn-ghost border border-slate-200 text-xs">
              <ArrowPathIcon className="h-4 w-4" /> Recargar
            </button>
          </div>

          <div className="grid gap-3">
            {(portal.accessList || []).map(access => (
              <article key={access.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-950">{access.full_name || access.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{access.email || 'Sin email'} - {pharmacyOptions.find(pharmacy => pharmacy.id === access.pharmacy_id)?.label || 'Sin farmacia'} - {normalizeRole(access.role)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${access.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {access.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => portal.resendInvite({ id: access.id, email: access.email, pharmacy_id: access.pharmacy_id })} className="btn-ghost border border-slate-200 text-xs">
                    <ArrowPathIcon className="h-4 w-4" /> Reenviar invitacion
                  </button>
                  <button type="button" onClick={() => portal.resetPassword({ id: access.id, email: access.email, pharmacy_id: access.pharmacy_id })} className="btn-secondary text-xs">
                    <KeyIcon className="h-4 w-4" /> Reset contrasena
                  </button>
                  <button type="button" onClick={() => toggleAccess(access)} disabled={busy === access.id} className="btn-ghost border border-slate-200 text-xs">
                    {access.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" onClick={() => removeAccess(access)} disabled={busy === `delete-${access.id}`} className="btn-ghost border border-rose-200 text-xs text-rose-700">
                    <TrashIcon className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              </article>
            ))}
            {!portal.accessList?.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                Aun no hay accesos cliente creados.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
