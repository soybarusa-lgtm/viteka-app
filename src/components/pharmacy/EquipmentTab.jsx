import { useState } from 'react'

const TYPES = ['Robótica', 'Semiautomático', 'Manual', 'TPV', 'Servidor', 'Red', 'Otro']
const EMPTY = { is_viteka: false, equipment_type: '', brand: '', model: '', serial_number: '', install_date: '', warranty_end: '', observations: '' }

export default function EquipmentTab({ detail }) {
  const { equipment, createEquipment, updateEquipment, deleteEquipment } = detail
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function openCreate() { setForm(EMPTY); setEditing(null); setShowForm(true) }
  function openEdit(e) { setForm(e); setEditing(e.id); setShowForm(true) }
  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.equipment_type) { setError('El tipo es obligatorio'); return }
    setSaving(true); setError('')
    try {
      if (editing) {
        const { id, pharmacy_id, company_id, created_at, updated_at, ...payload } = form
        await updateEquipment(editing, payload)
      } else {
        await createEquipment(form)
      }
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const vitekaEq = equipment.filter(e => e.is_viteka)
  const otherEq = equipment.filter(e => !e.is_viteka)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{equipment.length} equipo{equipment.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary text-sm">+ Añadir equipo</button>
      </div>

      {equipment.length === 0 && !showForm && (
        <div className="empty-state">
          <span className="text-3xl mb-2">🖥️</span>
          <p className="text-gray-500 text-sm">Sin equipos registrados</p>
        </div>
      )}

      {/* Equipos Viteka */}
      {vitekaEq.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Equipos Viteka</h4>
          <EquipmentList items={vitekaEq} onEdit={openEdit} onDelete={setDeleteConfirm} />
        </div>
      )}

      {/* Otros equipos */}
      {otherEq.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Otros equipos</h4>
          <EquipmentList items={otherEq} onEdit={openEdit} onDelete={setDeleteConfirm} />
        </div>
      )}

      {/* Formulario inline */}
      {showForm && (
        <div className="card p-5 border-teal-200 border-2">
          <h4 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar equipo' : 'Nuevo equipo'}</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_viteka} onChange={e => set('is_viteka', e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm font-medium text-teal-700">Equipo Viteka</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Tipo *</label>
                <select className="input" value={form.equipment_type || ''} onChange={e => set('equipment_type', e.target.value)} required>
                  <option value="">Selecciona...</option>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Marca</label><input className="input" value={form.brand || ''} onChange={e => set('brand', e.target.value)} /></div>
              <div><label className="label">Modelo</label><input className="input" value={form.model || ''} onChange={e => set('model', e.target.value)} /></div>
              <div><label className="label">Nº Serie</label><input className="input" value={form.serial_number || ''} onChange={e => set('serial_number', e.target.value)} /></div>
              <div><label className="label">Fecha instalación</label><input className="input" type="date" value={form.install_date || ''} onChange={e => set('install_date', e.target.value)} /></div>
              <div><label className="label">Fin garantía</label><input className="input" type="date" value={form.warranty_end || ''} onChange={e => set('warranty_end', e.target.value)} /></div>
            </div>
            <div><label className="label">Observaciones</label><textarea className="input" rows={2} value={form.observations || ''} onChange={e => set('observations', e.target.value)} /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Eliminar equipo</h3>
            <p className="text-sm text-gray-600 mb-4">¿Eliminar <strong>{deleteConfirm.brand} {deleteConfirm.model}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-danger" onClick={async () => { await deleteEquipment(deleteConfirm.id); setDeleteConfirm(null) }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EquipmentList({ items, onEdit, onDelete }) {
  return (
    <div className="space-y-2">
      {items.map(e => {
        const warrantyExpired = e.warranty_end && new Date(e.warranty_end) < new Date()
        return (
          <div key={e.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{e.brand} {e.model}</p>
                  <span className="badge-gray text-xs">{e.equipment_type}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {e.serial_number && <span>S/N: {e.serial_number}</span>}
                  {e.install_date && <span>Instalación: {new Date(e.install_date).toLocaleDateString('es-ES')}</span>}
                  {e.warranty_end && (
                    <span className={warrantyExpired ? 'text-red-500 font-medium' : ''}>
                      Garantía: {new Date(e.warranty_end).toLocaleDateString('es-ES')}
                      {warrantyExpired ? ' ⚠️ Vencida' : ''}
                    </span>
                  )}
                </div>
                {e.observations && <p className="text-xs text-gray-400 mt-1">{e.observations}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(e)} className="btn-ghost text-xs px-2 py-1">Editar</button>
                <button onClick={() => onDelete(e)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">🗑️</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
