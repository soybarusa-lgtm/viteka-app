import { useState, useEffect } from 'react'
import { useProjects } from '../../hooks/useProjects'
import { supabase } from '../../lib/supabase'

const STAGES = [
  { value: 'leads', label: 'Leads' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'visita', label: 'Visita' },
  { value: 'propuesta', label: 'Propuesta' },
  { value: 'negociacion', label: 'Negociación' },
]

const SUPPORT_STATUS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'En curso' },
  { value: 'paused', label: 'Pausado' },
]

export default function CreateProjectModal({ defaultType = 'commercial', onClose }) {
  const { createProject } = useProjects()
  const [pharmacies, setPharmacies] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    name: '',
    project_type: defaultType,
    pharmacy_id: '',
    status: 'active',
    pipeline_stage: 'leads',
    amount: '',
    start_date: '',
    expected_close_date: '',
    assigned_technician_id: '',
    assigned_commercial_id: '',
    notes: '',
    visible_to_client: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      const [phRes, usRes] = await Promise.all([
        supabase.from('pharmacies').select('id, pharmacy_name').order('pharmacy_name'),
        supabase.from('profiles').select('id, full_name, role').eq('is_active', true).order('full_name'),
      ])
      setPharmacies(phRes.data || [])
      setUsers(usRes.data || [])
    }
    loadData()
  }, [])

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  const isCommercial = form.project_type === 'commercial'
  const technicians = users.filter(u => ['technician', 'admin', 'owner'].includes(u.role))
  const commercials = users.filter(u => ['commercial', 'admin', 'owner'].includes(u.role))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (!payload.pharmacy_id) delete payload.pharmacy_id
      if (!payload.assigned_technician_id) delete payload.assigned_technician_id
      if (!payload.assigned_commercial_id) delete payload.assigned_commercial_id
      if (!payload.amount) delete payload.amount
      if (!payload.start_date) delete payload.start_date
      if (!payload.expected_close_date) delete payload.expected_close_date
      await createProject(payload)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="font-bold text-gray-900">Nuevo proyecto {isCommercial ? 'comercial' : 'de soporte'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4">

          <div>
            <label className="label">Nombre del proyecto *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          <div>
            <label className="label">Farmacia</label>
            <select className="input" value={form.pharmacy_id} onChange={e => set('pharmacy_id', e.target.value)}>
              <option value="">Sin farmacia asignada</option>
              {pharmacies.map(p => <option key={p.id} value={p.id}>{p.pharmacy_name}</option>)}
            </select>
          </div>

          {isCommercial ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Etapa pipeline</label>
                <select className="input" value={form.pipeline_stage} onChange={e => set('pipeline_stage', e.target.value)}>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Importe (€)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} />
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {SUPPORT_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fecha inicio</label>
              <input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Cierre previsto</label>
              <input className="input" type="date" value={form.expected_close_date} onChange={e => set('expected_close_date', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isCommercial && (
              <div>
                <label className="label">Técnico asignado</label>
                <select className="input" value={form.assigned_technician_id} onChange={e => set('assigned_technician_id', e.target.value)}>
                  <option value="">Sin asignar</option>
                  {technicians.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            )}
            {isCommercial && (
              <div>
                <label className="label">Comercial asignado</label>
                <select className="input" value={form.assigned_commercial_id} onChange={e => set('assigned_commercial_id', e.target.value)}>
                  <option value="">Sin asignar</option>
                  {commercials.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.visible_to_client} onChange={e => set('visible_to_client', e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <span className="text-sm text-gray-700">Visible en portal cliente</span>
          </label>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </form>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear proyecto'}
          </button>
        </div>
      </div>
    </div>
  )
}
