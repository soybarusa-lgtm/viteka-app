import { useState, useRef, useEffect } from 'react'

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

const EMPTY = {
  category: '', brand: '', model: '',
  serial_number: '', install_date: '', warranty_end: '',
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

function fmtDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isExpired(d) {
  return d && new Date(d) < new Date()
}

// ── Popover ──────────────────────────────────────────────────────────────────
function Popover({ eq, anchorRef }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const popRef = useRef(null)

  useEffect(() => {
    if (!anchorRef.current || !popRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const pop  = popRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    setPos({
      top:  rect.top + scrollY - pop.height - 8,
      left: Math.min(rect.left, window.innerWidth - pop.width - 16),
    })
  }, [])

  const exp = isExpired(eq.warranty_end)

  return (
    <div
      ref={popRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 50 }}
      className="w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-xs pointer-events-none"
    >
      <p className="font-semibold text-gray-900 text-sm mb-2">{labelForItem(eq)}</p>
      <div className="space-y-1 text-gray-600">
        {eq.serial_number && (
          <div className="flex justify-between">
            <span className="text-gray-400">S/N</span>
            <span className="font-mono">{eq.serial_number}</span>
          </div>
        )}
        {eq.install_date && (
          <div className="flex justify-between">
            <span className="text-gray-400">Instalación</span>
            <span>{fmtDate(eq.install_date)}</span>
          </div>
        )}
        {eq.warranty_end && (
          <div className="flex justify-between">
            <span className="text-gray-400">Garantía</span>
            <span className={exp ? 'text-red-500 font-medium' : 'text-green-600'}>
              {fmtDate(eq.warranty_end)}{exp ? ' ⚠️' : ''}
            </span>
          </div>
        )}
        {eq.observations && (
          <div className="pt-1 border-t border-gray-100 mt-1">
            <span className="text-gray-400 block mb-0.5">Observaciones</span>
            <span className="text-gray-700">{eq.observations}</span>
          </div>
        )}
        {!eq.serial_number && !eq.install_date && !eq.warranty_end && !eq.observations && (
          <p className="text-gray-400 italic">Sin detalles adicionales</p>
        )}
      </div>
    </div>
  )
}

// ── EquipmentRow ─────────────────────────────────────────────────────────────
function EquipmentRow({ eq, onEdit, onDelete }) {
  const [hovered,  setHovered]  = useState(false)
  const [expanded, setExpanded] = useState(false)
  const rowRef = useRef(null)
  const cat = CATEGORY_LIST.find(c => c.id === eq.equipment_type)
  const exp = isExpired(eq.warranty_end)

  return (
    <>
      <div
        ref={rowRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setExpanded(p => !p)}
        className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-lg ${
          hovered || expanded ? 'bg-gray-50' : 'bg-white'
        } border border-gray-100`}
      >
        {/* Acento izquierdo Viteka */}
        {eq.is_viteka && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-green-400" />}

        {/* Icono */}
        <span className="text-lg shrink-0">{cat?.icon ?? '📦'}</span>

        {/* Nombre + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-gray-900 text-sm truncate">{labelForItem(eq)}</span>
            {eq.is_viteka && (
              <img src="/brand/favicon.svg" alt="Viteka" title="Producto Viteka" className="w-3.5 h-3.5 shrink-0" />
            )}
            {cat && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 whitespace-nowrap">
                {cat.label}
              </span>
            )}
          </div>
        </div>

        {/* Garantía */}
        <div className="shrink-0 text-xs">
          {eq.warranty_end ? (
            <span className={exp ? 'text-red-500 font-semibold' : 'text-green-600'}>
              {exp ? '⚠️ Gtía vencida' : `Gtía: ${fmtDate(eq.warranty_end)}`}
            </span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(eq)} className="btn-ghost text-xs px-2 py-1">Editar</button>
          <button onClick={() => onDelete(eq)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition">🗑️</button>
        </div>

        {/* Popover hover */}
        {hovered && <Popover eq={eq} anchorRef={rowRef} />}
      </div>

      {/* Expansión click (mobile) */}
      {expanded && (
        <div className="mx-4 mb-1 px-4 py-3 bg-gray-50 rounded-b-lg border border-t-0 border-gray-100 text-xs text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
          {eq.serial_number && <><span className="text-gray-400">S/N</span><span className="font-mono">{eq.serial_number}</span></>}
          {eq.install_date  && <><span className="text-gray-400">Instalación</span><span>{fmtDate(eq.install_date)}</span></>}
          {eq.warranty_end  && (
            <><span className="text-gray-400">Garantía</span>
            <span className={exp ? 'text-red-500 font-medium' : 'text-green-600'}>
              {fmtDate(eq.warranty_end)}{exp ? ' ⚠️' : ''}
            </span></>
          )}
          {eq.observations  && <><span className="text-gray-400 col-span-2">Obs.</span><span className="col-span-2">{eq.observations}</span></>}
          {!eq.serial_number && !eq.install_date && !eq.warranty_end && !eq.observations && (
            <span className="col-span-2 text-gray-400 italic">Sin detalles adicionales</span>
          )}
        </div>
      )}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EquipmentTab({ detail }) {
  const { equipment, createEquipment, updateEquipment, deleteEquipment, copyFromPharmacy, duplicateEquipment } = detail
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState(EMPTY)
  const [saving,        setSaving]        = useState(false)
  const [formError,     setFormError]     = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [groupByType,   setGroupByType]   = useState(true)  // agrupado por tipo por defecto

  function openCreate() { setForm(EMPTY); setEditing(null); setFormError(''); setShowForm(true) }
  function openEdit(e) {
    setForm({
      category:      e.equipment_type || '',
      brand:         e.brand          || '',
      model:         e.model          || '',
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

  const brandOptions = brandsForCategory(form.category)

  const renderList = () => {
    if (!groupByType) {
      const vitekaEq = equipment.filter(e => e.is_viteka)
      const otherEq  = equipment.filter(e => !e.is_viteka)
      return (
        <>
          {vitekaEq.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Equipos Viteka</h4>
              <div className="space-y-1">
                {vitekaEq.map(e => <EquipmentRow key={e.id} eq={e} onEdit={openEdit} onDelete={setDeleteConfirm} />)}
              </div>
            </div>
          )}
          {otherEq.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Otros equipos</h4>
              <div className="space-y-1">
                {otherEq.map(e => <EquipmentRow key={e.id} eq={e} onEdit={openEdit} onDelete={setDeleteConfirm} />)}
              </div>
            </div>
          )}
        </>
      )
    }

    // Vista agrupada por tipo — orden según CATEGORY_LIST
    return CATEGORY_LIST.map(cat => {
      const items = equipment.filter(e => e.equipment_type === cat.id)
      if (items.length === 0) return null
      return (
        <div key={cat.id} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{cat.icon}</span>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat.label}</h4>
            <span className="text-[10px] bg-gray-100 text-gray-400 rounded-full px-2 py-0.5 font-medium">{items.length}</span>
            <div className="flex-1 border-t border-gray-100" />
          </div>
          <div className="space-y-1">
            {items.map(e => <EquipmentRow key={e.id} eq={e} onEdit={openEdit} onDelete={setDeleteConfirm} />)}
          </div>
        </div>
      )
    })
  }

  return (
    <div>
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <p className="text-sm text-gray-500">{equipment.length} equipo{equipment.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {copyFromPharmacy && (
            <button onClick={copyFromPharmacy} className="btn-secondary text-xs">
              📋 Copiar de farmacia
            </button>
          )}
          {duplicateEquipment && (
            <button onClick={duplicateEquipment} className="btn-secondary text-xs">
              ⧉ Duplicar
            </button>
          )}
          <button
            onClick={() => setGroupByType(p => !p)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
              groupByType
                ? 'bg-teal-50 border-teal-300 text-teal-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            ↕ {groupByType ? 'Agrupado por tipo' : 'Ordenar por tipo'}
          </button>
          <button onClick={openCreate} className="btn-primary text-sm">+ Añadir equipo</button>
        </div>
      </div>

      {equipment.length === 0 && !showForm && (
        <div className="empty-state">
          <span className="text-3xl mb-2">🖥️</span>
          <p className="text-gray-500 text-sm">Sin equipos registrados</p>
        </div>
      )}

      {renderList()}

      {/* Formulario */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Modal eliminar */}
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
