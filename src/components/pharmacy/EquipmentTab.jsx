import { useState } from 'react'

const ERP_OPTIONS        = ['Nixfarma', 'Farmatic', 'Unycop Next', 'Farmanager', 'Unicop Win', 'vGaleno', 'Compufarma', 'Otro']
const CASHLOGY_MODELS    = ['Cashlogy 1000', 'Cashlogy 1500', 'Cashlogy 2023', 'Maximate Safe', 'MaxiSafe', 'Cashinfinity CI-5', 'Cashinfinity CI-10X', 'Cashinfinity CI-100X', 'Cashkeeper Compacto', 'Cashkeeper Modular', 'CashDro S', 'CashDro 4', 'CashDro 5', 'CashDro 7', 'CashProtect 400 AS', 'CashProtect Pro AS', 'CashProtect PJ', 'CashProtect POS', 'CashProtect 1000', 'Otro']
const ESL_OPTIONS        = ['Hanshow', 'Pricer', 'Expofarm', 'Farmaconnet', 'Otro']
const SCALE_OPTIONS      = ['Pondus', 'Keito', 'Otro']
const ANTITHEFT_OPTIONS  = ['Checkpoint', 'Otro']
const CONSULTING_OPTIONS = ['Viteka Pro Gestión', 'Avantia Plus Gestión', 'Otro']
const ROBOT_OPTIONS      = ['BD Rowa', 'Gollmann', 'Meditech', 'Willach', 'Fablox', 'Luse', 'KLS', 'Tecnyfarma', 'Cruz', 'Otro']
const COMPUTER_TYPES     = ['Servidor', 'Estación', 'Impresora documentos', 'Impresora tickets', 'Impresora etiquetas', 'SAI', 'Router', 'Switch', 'Otro']

const CATEGORY_LIST = [
  { id: 'erp',        label: 'ERP',                   icon: '💊' },
  { id: 'cashlogy',   label: 'Caja de cobro',          icon: '💰' },
  { id: 'esl',        label: 'Etiquetas electrónicas', icon: '🏷️' },
  { id: 'scale',      label: 'Básculas',               icon: '⚖️' },
  { id: 'antitheft',  label: 'Arcos antihurto',        icon: '🔒' },
  { id: 'consulting', label: 'Consultoría',            icon: '📋' },
  { id: 'computer',   label: 'Equipos informáticos',   icon: '🖥️' },
  { id: 'robot',      label: 'Robot dispensador',      icon: '🤖' },
  { id: 'other',      label: 'Otros',                  icon: '📦' },
]

const YEARS = Array.from({ length: 15 }, (_, i) => String(new Date().getFullYear() - i))

const EMPTY = {
  category: '', brand: '', model: '',
  install_year: '', serial_number: '',
  install_date: '', warranty_end: '',
  is_viteka: false, observations: '',
}

function brandsForCategory(cat) {
  switch (cat) {
    case 'erp':        return ERP_OPTIONS
    case 'cashlogy':   return CASHLOGY_MODELS
    case 'esl':        return ESL_OPTIONS
    case 'scale':      return SCALE_OPTIONS
    case 'antitheft':  return ANTITHEFT_OPTIONS
    case 'consulting': return CONSULTING_OPTIONS
    case 'computer':   return COMPUTER_TYPES
    case 'robot':      return ROBOT_OPTIONS
    default:           return []
  }
}

function labelForItem(eq) {
  if (!eq.brand && !eq.model) return eq.equipment_type || 'Equipo'
  return [eq.brand, eq.model].filter(Boolean).join(' ')
}

export default function EquipmentTab({ detail }) {
  const { equipment, createEquipment, updateEquipment, deleteEquipment } = detail
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState(EMPTY)
  const [saving,        setSaving]        = useState(false)
  const [formError,     setFormError]     = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  function openCreate() { setForm(EMPTY); setEditing(null); setFormError(''); setShowForm(true) }
  function openEdit(e) {
    setForm({
      category:      e.equipment_type || '',
      brand:         e.brand          || '',
      model:         e.model          || '',
      install_year:  e.install_year   || '',
      serial_number: e.serial_number  || '',
      install_date:  e.install_date   || '',
      warranty_end:  e.warranty_end   || '',
      is_viteka:     e.is_viteka      || false,
      observations:  e.observations   || '',
    })
    setEditing(e.id)
    setFormError('')
    setShowForm(true)
  }

  function set(f, v) {
    setForm(prev => ({
      ...prev,
      [f]: v,
      ...(f === 'category' ? { brand: '', model: '' } : {}),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.category) { setFormError('Selecciona una categoría'); return }
    setSaving(true); setFormError('')
    try {
      const payload = {
        equipment_type: form.category,
        brand:          form.brand         || null,
        model:          form.model         || null,
        install_year:   form.install_year  || null,
        serial_number:  form.serial_number || null,
        install_date:   form.install_date  || null,
        warranty_end:   form.warranty_end  || null,
        is_viteka:      form.is_viteka,
        observations:   form.observations  || null,
      }
      if (editing) {
        await updateEquipment(editing, payload)
      } else {
        await createEquipment(payload)
      }
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const vitekaEq = equipment.filter(e => e.is_viteka)
  const otherEq  = equipment.filter(e => !e.is_viteka)
  const brandOptions = brandsForCategory(form.category)

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

      {vitekaEq.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Equipos Viteka</h4>
          <EquipmentList items={vitekaEq} onEdit={openEdit} onDelete={setDeleteConfirm} />
        </div>
      )}

      {otherEq.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Otros equipos</h4>
          <EquipmentList items={otherEq} onEdit={openEdit} onDelete={setDeleteConfirm} />
        </div>
      )}

      {showForm && (
        <div className="card p-5 border-2 border-teal-200 mt-4">
          <h4 className="font-semibold text-gray-800 mb-4">{editing ? 'Editar equipo' : 'Nuevo equipo'}</h4>
          <form onSubmit={handleSubmit} className="space-y-4">

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.is_viteka} onChange={e => set('is_viteka', e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-sm font-medium text-teal-700">Equipo distribuido/soportado por Viteka</span>
            </label>

            <div>
              <label className="label">Categoría *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_LIST.map(cat => (
                  <button key={cat.id} type="button" onClick={() => set('category', cat.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                      form.category === cat.id
                        ? 'bg-[#1c473c] text-white border-[#1c473c]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>
                    <span>{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.category && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {brandOptions.length > 0 ? (
                  <div>
                    <label className="label">
                      {form.category === 'computer' ? 'Tipo de equipo' :
                       form.category === 'cashlogy' ? 'Modelo' : 'Marca'}
                    </label>
                    <select className="input" value={form.brand} onChange={e => set('brand', e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {brandOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="label">Marca</label>
                    <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Marca" />
                  </div>
                )}
                <div>
                  <label className="label">Modelo</label>
                  <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Modelo" />
                </div>
              </div>
            )}

            {form.category && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">Año instalación</label>
                  <select className="input" value={form.install_year} onChange={e => set('install_year', e.target.value)}>
                    <option value="">Año...</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Fecha instalación</label>
                  <input className="input" type="date" value={form.install_date} onChange={e => set('install_date', e.target.value)} />
                </div>
                <div>
                  <label className="label">Fin garantía</label>
                  <input className="input" type="date" value={form.warranty_end} onChange={e => set('warranty_end', e.target.value)} />
                </div>
              </div>
            )}

            {form.category && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {form.is_viteka && (
                  <div>
                    <label className="label">Nº de serie</label>
                    <input className="input" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="SN-000000" />
                  </div>
                )}
                <div className={form.is_viteka ? '' : 'sm:col-span-2'}>
                  <label className="label">Observaciones</label>
                  <input className="input" value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Notas adicionales" />
                </div>
              </div>
            )}

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear equipo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Eliminar equipo</h3>
            <p className="text-sm text-gray-600 mb-4">¿Eliminar <strong>{labelForItem(deleteConfirm)}</strong>?</p>
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
        const cat = CATEGORY_LIST.find(c => c.id === e.equipment_type)
        return (
          <div key={e.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {cat && <span className="text-base">{cat.icon}</span>}
                  <p className="font-semibold text-gray-900">{labelForItem(e)}</p>
                  {cat && <span className="badge-gray text-xs">{cat.label}</span>}
                </div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                  {e.serial_number && <span>S/N: {e.serial_number}</span>}
                  {e.install_year  && <span>Instalación: {e.install_year}</span>}
                  {e.install_date  && <span>Fecha: {new Date(e.install_date).toLocaleDateString('es-ES')}</span>}
                  {e.warranty_end  && (
                    <span className={warrantyExpired ? 'text-red-500 font-medium' : ''}>
                      Garantía: {new Date(e.warranty_end).toLocaleDateString('es-ES')}
                      {warrantyExpired ? ' ⚠️ Vencida' : ''}
                    </span>
                  )}
                </div>
                {e.observations && <p className="text-xs text-gray-400 mt-1">{e.observations}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
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
