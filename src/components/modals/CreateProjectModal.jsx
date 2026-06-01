import { useEffect, useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import {
  PRIORITIES,
  PROJECT_DIVISIONS,
  PROJECT_PIPELINES,
  PROJECT_STATUSES,
  defaultStage,
} from '../../lib/projectManagement'

function createEmptyForm(defaultType, defaultPharmacyId) {
  return {
    name: '',
    project_type: defaultType,
    pharmacy_id: defaultPharmacyId,
    status: 'active',
    pipeline_stage: defaultStage(defaultType),
    amount: '',
    priority: 'medium',
    start_date: '',
    expected_close_date: '',
    assigned_technician_id: '',
    assigned_commercial_id: '',
  }
}

export default function CreateProjectModal({
  defaultType = 'commercial',
  defaultPharmacyId = '',
  onClose,
  onCreate,
}) {
  const [pharmacies, setPharmacies] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(() => createEmptyForm(defaultType, defaultPharmacyId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      const [pharmacyResponse, usersResponse] = await Promise.all([
        supabase.from('pharmacies').select('id, pharmacy_name').order('pharmacy_name'),
        supabase.from('profiles').select('id, full_name, role, is_active').eq('is_active', true).order('full_name'),
      ])
      setPharmacies(pharmacyResponse.data || [])
      setUsers(usersResponse.data || [])
    }
    loadData()
  }, [])

  const pipeline = PROJECT_PIPELINES[form.project_type] || PROJECT_PIPELINES.commercial
  const technicians = useMemo(
    () => users.filter(user => ['technician', 'admin', 'owner'].includes(user.role)),
    [users],
  )
  const commercials = useMemo(
    () => users.filter(user => ['commercial', 'admin', 'owner'].includes(user.role)),
    [users],
  )

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function setDivision(projectType) {
    setForm(prev => ({
      ...prev,
      project_type: projectType,
      pipeline_stage: defaultStage(projectType),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('El nombre del proyecto es obligatorio.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onCreate(form)
      onClose()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-0 sm:items-center sm:p-4" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Nuevo proyecto</p>
            <h2 className="font-display text-xl font-bold text-slate-900">Crear espacio de trabajo</h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
          <div>
            <label className="label">División *</label>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {PROJECT_DIVISIONS.map(division => (
                <button
                  key={division.id}
                  type="button"
                  onClick={() => setDivision(division.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    form.project_type === division.id
                      ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/10'
                      : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/40'
                  }`}
                >
                  <span className="block text-sm font-bold text-slate-900">{division.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{division.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nombre del proyecto *</label>
              <input className="input" value={form.name} onChange={event => set('name', event.target.value)} placeholder="Ej. Implantación Nixfarma · Farmacia Central" required />
            </div>
            <div>
              <label className="label">Farmacia</label>
              <select className="input" value={form.pharmacy_id} onChange={event => set('pharmacy_id', event.target.value)}>
                <option value="">Sin farmacia asignada</option>
                {pharmacies.map(pharmacy => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.pharmacy_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select className="input" value={form.priority} onChange={event => set('priority', event.target.value)}>
                {PRIORITIES.map(priority => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Etapa inicial</label>
              <select className="input" value={form.pipeline_stage} onChange={event => set('pipeline_stage', event.target.value)}>
                {pipeline.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status} onChange={event => set('status', event.target.value)}>
                {PROJECT_STATUSES.slice(0, 4).map(status => <option key={status.id} value={status.id}>{status.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha de inicio</label>
              <input className="input" type="date" value={form.start_date} onChange={event => set('start_date', event.target.value)} />
            </div>
            <div>
              <label className="label">Fecha objetivo</label>
              <input className="input" type="date" value={form.expected_close_date} onChange={event => set('expected_close_date', event.target.value)} />
            </div>
            {form.project_type === 'commercial' ? (
              <>
                <div>
                  <label className="label">Comercial responsable</label>
                  <select className="input" value={form.assigned_commercial_id} onChange={event => set('assigned_commercial_id', event.target.value)}>
                    <option value="">Sin asignar</option>
                    {commercials.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Importe estimado</label>
                  <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={event => set('amount', event.target.value)} placeholder="0,00 €" />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="label">Técnico responsable</label>
                <select className="input" value={form.assigned_technician_id} onChange={event => set('assigned_technician_id', event.target.value)}>
                  <option value="">Sin asignar</option>
                  {technicians.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
                </select>
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
