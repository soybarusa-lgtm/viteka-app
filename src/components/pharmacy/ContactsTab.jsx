import { useState } from 'react'

const ROLES = ['titular', 'gestor', 'adjunto', 'técnico', 'auxiliar', 'otro']
const RESPONSIBILITIES = ['compras', 'facturación', 'personal', 'informática', 'almacén', 'atención al cliente']

const EMPTY = { full_name: '', role: '', responsibilities: [], phone: '', email: '', observations: '' }

export default function ContactsTab({ detail }) {
  const { contacts, createContact, updateContact, deleteContact } = detail
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function openCreate() { setForm(EMPTY); setEditing(null); setShowForm(true) }
  function openEdit(c) { setForm(c); setEditing(c.id); setShowForm(true) }
  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  function toggleResp(r) {
    set('responsibilities', form.responsibilities?.includes(r)
      ? form.responsibilities.filter(x => x !== r)
      : [...(form.responsibilities || []), r])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name?.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true); setError('')
    try {
      if (editing) {
        const { id, pharmacy_id, company_id, created_at, updated_at, ...payload } = form
        await updateContact(editing, payload)
      } else {
        await createContact(form)
      }
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      await deleteContact(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary text-sm">+ Añadir contacto</button>
      </div>

      {contacts.length === 0 && !showForm && (
        <div className="empty-state">
          <span className="text-3xl mb-2">👥</span>
          <p className="text-gray-500 text-sm">Sin contactos registrados</p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3 mb-4">
        {contacts.map(c => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{c.full_name}</p>
                {c.role && <p className="text-xs text-teal-600 capitalize font-medium mt-0.5">{c.role}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                  {c.phone && <a href={`tel:${c.phone}`} className="hover:text-teal-600">📞 {c.phone}</a>}
                  {c.email && <a href={`mailto:${c.email}`} className="hover:text-teal-600">✉️ {c.email}</a>}
                </div>
                {c.responsibilities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.responsibilities.map(r => (
                      <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                )}
                {c.observations && <p className="text-xs text-gray-400 mt-1">{c.observations}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="btn-ghost text-xs px-2 py-1">Editar</button>
                <button onClick={() => setDeleteConfirm(c)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="card p-5 border-teal-200 border-2">
          <h4 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar contacto' : 'Nuevo contacto'}</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre *</label>
                <input className="input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={form.role || ''} onChange={e => set('role', e.target.value)}>
                  <option value="">Sin rol</option>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input className="input" type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Responsabilidades</label>
              <div className="flex flex-wrap gap-2">
                {RESPONSIBILITIES.map(r => (
                  <button
                    key={r} type="button"
                    onClick={() => toggleResp(r)}
                    className={`text-xs px-3 py-1 rounded-full border transition ${
                      form.responsibilities?.includes(r)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Observaciones</label>
              <textarea className="input" rows={2} value={form.observations || ''} onChange={e => set('observations', e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm delete */}
      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Eliminar contacto</h3>
            <p className="text-sm text-gray-600 mb-4">¿Eliminar a <strong>{deleteConfirm.full_name}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-danger" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
