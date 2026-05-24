import { useState } from 'react'
import { usePharmacyDevices } from '../../hooks/usePharmacyEquipment'

// ─── Catálogos ────────────────────────────────────────────────────────────
const DEVICE_TYPES = [
  { value: 'servidor',            label: '🖥️ Servidor' },
  { value: 'estacion',            label: '💻 Estación de trabajo' },
  { value: 'impresora_docs',      label: '🖨️ Impresora documentos' },
  { value: 'impresora_tickets',   label: '🧾 Impresora tickets' },
  { value: 'impresora_etiquetas', label: '🏷️ Impresora etiquetas' },
  { value: 'sai',                 label: '🔋 SAI / UPS' },
  { value: 'router',              label: '📡 Router' },
  { value: 'switch',              label: '🔀 Switch' },
]

const OS_OPTIONS   = ['Windows 11', 'Windows 10', 'Windows Server 2022', 'Windows Server 2019', 'Linux', 'Otro']
const DISK_TYPES   = ['SSD', 'HDD', 'NVMe']
const CONN_TYPES   = ['HDMI', 'VGA', 'DVI', 'DisplayPort', 'Otro']
const PRINT_CONNS  = ['Ethernet', 'USB', 'Serie', 'Bluetooth', 'WiFi', 'Otro']
const LAYERS       = ['1ª', '2ª', '3ª', '4ª', '5ª']
const NET_PRIORITY = ['Principal', 'Secundario', 'Backup']

function emptySpecs(type) {
  const pc = {
    os: '', ip: [''], antivirus: '', cpu: '', ram: '',
    disks: [{ type: 'SSD', capacity: '' }], gpu: '', psu: '',
    monitor: false, monitor_size: '', monitor_color: '', monitor_conn: 'HDMI',
    keyboard: 'no', mouse: 'no',
    card_reader: false, card_reader_model: '', card_reader_year: '',
    qr_reader: false, qr_wired: 'cable', qr_model: '', qr_year: '',
    linked_to: '',
  }
  if (type === 'servidor' || type === 'estacion') return pc
  if (type.startsWith('impresora')) return { brand: '', model: '', connection: 'USB', linked_to: '' }
  if (type === 'sai')    return { brand: '', model: '', capacity: '', year: '', linked_to: '' }
  if (type === 'router') return {
    brand: '', model: '', provider: '', year: '', priority: 'Principal',
    contact_name: '', contact_role: '', contact_phone: '', contact_email: '',
  }
  if (type === 'switch') return {
    brand: '', model: '', ports: '', managed: false,
    year: '', layer: '2ª', poe: false, poe_ports: '',
  }
  return {}
}

// ─── Chip de spec ─────────────────────────────────────────────────────────
function SpecChip({ label, muted = false }) {
  if (!label) return null
  return (
    <span className={[
      'inline-flex items-center rounded-full px-2 py-1 text-[11px] leading-none font-medium',
      muted
        ? 'bg-gray-100 text-gray-400'
        : 'bg-gray-50 border border-gray-200 text-gray-600',
    ].join(' ')}>
      {label}
    </span>
  )
}

// ─── Resumen de specs para la tarjeta colapsada ───────────────────────────
function buildSummaryChips(device) {
  const s = device.specs || {}
  const isPc = ['servidor', 'estacion'].includes(device.device_type)
  const isPrinter = device.device_type?.startsWith('impresora')

  if (isPc) {
    const firstIp = Array.isArray(s.ip) ? s.ip.find(Boolean) : s.ip
    const firstDisk = Array.isArray(s.disks) ? s.disks.find(d => d?.capacity) : null
    return [
      s.os,
      s.cpu,
      s.ram ? `RAM ${s.ram}` : null,
      firstDisk ? `${firstDisk.type} ${firstDisk.capacity}` : null,
      firstIp ? `IP ${firstIp}` : null,
      s.antivirus ? `AV: ${s.antivirus}` : null,
    ].filter(Boolean)
  }
  if (isPrinter) return [s.brand, s.model, s.connection].filter(Boolean)
  if (device.device_type === 'router')
    return [s.brand, s.model, s.provider, s.priority].filter(Boolean)
  if (device.device_type === 'switch')
    return [s.brand, s.model, s.ports ? `${s.ports} puertos` : null, s.layer ? `Capa ${s.layer}` : null].filter(Boolean)
  if (device.device_type === 'sai')
    return [s.brand, s.model, s.capacity].filter(Boolean)
  return []
}

// ─── DeviceCard ───────────────────────────────────────────────────────────
function DeviceCard({ device, allDevices, onUpdate, onDelete }) {
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState({ ...device })
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  const s = form.specs || {}
  function setSpec(k, v) { setForm(f => ({ ...f, specs: { ...f.specs, [k]: v } })) }
  function addIp()         { setSpec('ip', [...(s.ip || ['']), '']) }
  function setIp(i, v)     { const a = [...(s.ip || [''])]; a[i] = v; setSpec('ip', a) }
  function addDisk()       { setSpec('disks', [...(s.disks || []), { type: 'SSD', capacity: '' }]) }
  function setDisk(i, k, v){ const a = [...(s.disks || [])]; a[i] = { ...a[i], [k]: v }; setSpec('disks', a) }

  const typeLabel = DEVICE_TYPES.find(t => t.value === form.device_type)?.label || form.device_type
  const isPc      = ['servidor', 'estacion'].includes(form.device_type)
  const isPrinter = form.device_type?.startsWith('impresora')
  const chips     = buildSummaryChips(device)

  async function handleSave() {
    setSaving(true)
    try { await onUpdate(device.id, form) } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar este equipo (${typeLabel})? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      await onDelete(device.id)
    } catch (e) {
      alert('Error al eliminar: ' + e.message)
      setDeleting(false)
    }
  }

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-3 transition-opacity ${
      deleting ? 'opacity-40 pointer-events-none' : ''
    }`}>

      {/* ── Cabecera (siempre visible) ── */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        {/* Checkbox Viteka */}
        <input
          type="checkbox"
          checked={form.is_viteka || false}
          onClick={e => e.stopPropagation()}
          onChange={e => setForm(f => ({ ...f, is_viteka: e.target.checked }))}
          className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 shrink-0"
        />

        <div className="flex-1 min-w-0">
          {/* Tipo + badge Viteka */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-gray-800">{typeLabel}</span>
            {form.is_viteka && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                VITEKA
              </span>
            )}
            {form.serial_number && (
              <span className="text-[11px] text-gray-400 hidden sm:inline">
                S/N: {form.serial_number}
              </span>
            )}
          </div>

          {/* Chips de resumen – solo cuando está cerrado */}
          {!open && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.length > 0
                ? chips.map((c, i) => <SpecChip key={i} label={c} />)
                : <SpecChip label="Sin especificaciones" muted />
              }
            </div>
          )}
        </div>

        {/* Acciones siempre visibles */}
        <div className="flex items-center gap-1 shrink-0 ml-1" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
            title="Eliminar equipo"
          >
            {deleting ? '⏳' : '🗑'}
          </button>
          <span className="text-gray-300 text-xs pl-1">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* ── Cuerpo expandido ── */}
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100">

          {/* Datos VITEKA */}
          {form.is_viteka && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-3">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-3">Datos VITEKA</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="label">Nº de serie</label>
                  <input className="input" value={form.serial_number || ''} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fecha instalación</label>
                  <input className="input" type="date" value={form.install_date || ''} onChange={e => setForm(f => ({ ...f, install_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fin garantía</label>
                  <input className="input" type="date" value={form.warranty_end || ''} onChange={e => setForm(f => ({ ...f, warranty_end: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Observaciones</label>
                  <input className="input" value={form.observations || ''} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* PC / Servidor / Estación */}
          {isPc && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label">Sistema operativo</label>
                  <select className="input" value={s.os || ''} onChange={e => setSpec('os', e.target.value)}>
                    <option value="">Selecciona...</option>
                    {OS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label className="label">Procesador</label><input className="input" value={s.cpu || ''} onChange={e => setSpec('cpu', e.target.value)} /></div>
                <div><label className="label">RAM</label><input className="input" value={s.ram || ''} placeholder="Ej: 16 GB" onChange={e => setSpec('ram', e.target.value)} /></div>
                <div><label className="label">Antivirus</label><input className="input" value={s.antivirus || ''} onChange={e => setSpec('antivirus', e.target.value)} /></div>
                <div><label className="label">Gráfica</label><input className="input" value={s.gpu || ''} onChange={e => setSpec('gpu', e.target.value)} /></div>
                <div><label className="label">Fuente alimentación</label><input className="input" value={s.psu || ''} onChange={e => setSpec('psu', e.target.value)} /></div>
              </div>

              {/* IPs */}
              <div>
                <label className="label">Direcciones IP</label>
                {(s.ip || ['']).map((ip, i) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <input className="input flex-1" value={ip} placeholder="192.168.1.x" onChange={e => setIp(i, e.target.value)} />
                  </div>
                ))}
                <button type="button" onClick={addIp} className="btn-secondary text-xs mt-1">+ Añadir IP</button>
              </div>

              {/* Discos */}
              <div>
                <label className="label">Discos duros</label>
                {(s.disks || []).map((d, i) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <select className="input w-28" value={d.type} onChange={e => setDisk(i, 'type', e.target.value)}>
                      {DISK_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input className="input flex-1" placeholder="Capacidad (Ej: 512 GB)" value={d.capacity} onChange={e => setDisk(i, 'capacity', e.target.value)} />
                  </div>
                ))}
                <button type="button" onClick={addDisk} className="btn-secondary text-xs mt-1">+ Añadir disco</button>
              </div>

              {/* Monitor */}
              <div>
                <label className="label">Monitor</label>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={s.monitor || false}
                    onChange={e => setSpec('monitor', e.target.checked)}
                    className="rounded border-gray-300 text-teal-600" />
                  <span className="text-sm text-gray-700">Tiene monitor</span>
                </label>
                {s.monitor && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div><label className="label">Tamaño</label><input className="input" value={s.monitor_size || ''} placeholder='Ej: 24"' onChange={e => setSpec('monitor_size', e.target.value)} /></div>
                    <div><label className="label">Color</label><input className="input" value={s.monitor_color || ''} onChange={e => setSpec('monitor_color', e.target.value)} /></div>
                    <div>
                      <label className="label">Conexión</label>
                      <select className="input" value={s.monitor_conn || 'HDMI'} onChange={e => setSpec('monitor_conn', e.target.value)}>
                        {CONN_TYPES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Periféricos */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="label">Teclado</label>
                  <select className="input" value={s.keyboard || 'no'} onChange={e => setSpec('keyboard', e.target.value)}>
                    <option value="no">NO</option><option value="cable">Cable</option><option value="inalambrico">Inalámbrico</option>
                  </select>
                </div>
                <div>
                  <label className="label">Ratón</label>
                  <select className="input" value={s.mouse || 'no'} onChange={e => setSpec('mouse', e.target.value)}>
                    <option value="no">NO</option><option value="cable">Cable</option><option value="inalambrico">Inalámbrico</option>
                  </select>
                </div>
                <div>
                  <label className="label">Lector tarjetas</label>
                  <select className="input" value={s.card_reader ? 'si' : 'no'} onChange={e => setSpec('card_reader', e.target.value === 'si')}>
                    <option value="no">NO</option><option value="si">SI</option>
                  </select>
                  {s.card_reader && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      <input className="input" placeholder="Modelo" value={s.card_reader_model || ''} onChange={e => setSpec('card_reader_model', e.target.value)} />
                      <input className="input" placeholder="Año" type="number" value={s.card_reader_year || ''} onChange={e => setSpec('card_reader_year', e.target.value)} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Lector QR 2D</label>
                  <select className="input" value={s.qr_reader ? 'si' : 'no'} onChange={e => setSpec('qr_reader', e.target.value === 'si')}>
                    <option value="no">NO</option><option value="si">SI</option>
                  </select>
                  {s.qr_reader && (
                    <div className="space-y-1.5 mt-2">
                      <select className="input" value={s.qr_wired || 'cable'} onChange={e => setSpec('qr_wired', e.target.value)}>
                        <option value="cable">Cable</option><option value="inalambrico">Inalámbrico</option>
                      </select>
                      <input className="input" placeholder="Modelo" value={s.qr_model || ''} onChange={e => setSpec('qr_model', e.target.value)} />
                      <input className="input" placeholder="Año" type="number" value={s.qr_year || ''} onChange={e => setSpec('qr_year', e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Impresoras */}
          {isPrinter && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className="label">Marca</label><input className="input" value={s.brand || ''} onChange={e => setSpec('brand', e.target.value)} /></div>
              <div><label className="label">Modelo</label><input className="input" value={s.model || ''} onChange={e => setSpec('model', e.target.value)} /></div>
              <div>
                <label className="label">Conexión</label>
                <select className="input" value={s.connection || 'USB'} onChange={e => setSpec('connection', e.target.value)}>
                  {PRINT_CONNS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Equipo vinculado</label>
                <select className="input" value={s.linked_to || ''} onChange={e => setSpec('linked_to', e.target.value)}>
                  <option value="">—</option>
                  {allDevices.filter(d => ['servidor', 'estacion'].includes(d.device_type))
                    .map(d => <option key={d.id} value={d.id}>{DEVICE_TYPES.find(t => t.value === d.device_type)?.label} ({d.specs?.cpu || ''})</option>)}
                </select>
              </div>
            </div>
          )}

          {/* SAI */}
          {form.device_type === 'sai' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className="label">Marca</label><input className="input" value={s.brand || ''} onChange={e => setSpec('brand', e.target.value)} /></div>
              <div><label className="label">Modelo</label><input className="input" value={s.model || ''} onChange={e => setSpec('model', e.target.value)} /></div>
              <div><label className="label">Capacidad</label><input className="input" value={s.capacity || ''} placeholder="Ej: 1500 VA" onChange={e => setSpec('capacity', e.target.value)} /></div>
              <div><label className="label">Año</label><input className="input" type="number" value={s.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="label">Equipo vinculado</label>
                <select className="input" value={s.linked_to || ''} onChange={e => setSpec('linked_to', e.target.value)}>
                  <option value="">—</option>
                  {allDevices.filter(d => ['servidor', 'estacion'].includes(d.device_type))
                    .map(d => <option key={d.id} value={d.id}>{DEVICE_TYPES.find(t => t.value === d.device_type)?.label} ({d.specs?.cpu || ''})</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Router */}
          {form.device_type === 'router' && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div><label className="label">Marca</label><input className="input" value={s.brand || ''} onChange={e => setSpec('brand', e.target.value)} /></div>
                <div><label className="label">Modelo</label><input className="input" value={s.model || ''} onChange={e => setSpec('model', e.target.value)} /></div>
                <div><label className="label">Proveedor</label><input className="input" value={s.provider || ''} onChange={e => setSpec('provider', e.target.value)} /></div>
                <div><label className="label">Año</label><input className="input" type="number" value={s.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
                <div>
                  <label className="label">Prioridad</label>
                  <select className="input" value={s.priority || 'Principal'} onChange={e => setSpec('priority', e.target.value)}>
                    {NET_PRIORITY.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contacto proveedor</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div><label className="label">Nombre</label><input className="input" value={s.contact_name || ''} onChange={e => setSpec('contact_name', e.target.value)} /></div>
                <div><label className="label">Cargo</label><input className="input" value={s.contact_role || ''} onChange={e => setSpec('contact_role', e.target.value)} /></div>
                <div><label className="label">Teléfono</label><input className="input" type="tel" value={s.contact_phone || ''} onChange={e => setSpec('contact_phone', e.target.value)} /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={s.contact_email || ''} onChange={e => setSpec('contact_email', e.target.value)} /></div>
              </div>
            </>
          )}

          {/* Switch */}
          {form.device_type === 'switch' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className="label">Marca</label><input className="input" value={s.brand || ''} onChange={e => setSpec('brand', e.target.value)} /></div>
              <div><label className="label">Modelo</label><input className="input" value={s.model || ''} onChange={e => setSpec('model', e.target.value)} /></div>
              <div><label className="label">Nº salidas</label><input className="input" type="number" value={s.ports || ''} onChange={e => setSpec('ports', e.target.value)} /></div>
              <div><label className="label">Año</label><input className="input" type="number" value={s.year || ''} onChange={e => setSpec('year', e.target.value)} /></div>
              <div>
                <label className="label">Gestionable</label>
                <select className="input" value={s.managed ? 'si' : 'no'} onChange={e => setSpec('managed', e.target.value === 'si')}>
                  <option value="no">NO</option><option value="si">SI</option>
                </select>
              </div>
              <div>
                <label className="label">Capa</label>
                <select className="input" value={s.layer || '2ª'} onChange={e => setSpec('layer', e.target.value)}>
                  {LAYERS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">PoE</label>
                <select className="input" value={s.poe ? 'si' : 'no'} onChange={e => setSpec('poe', e.target.value === 'si')}>
                  <option value="no">NO</option><option value="si">SI</option>
                </select>
              </div>
              {s.poe && (
                <div>
                  <label className="label">Puertos PoE</label>
                  <input className="input" type="number" value={s.poe_ports || ''} onChange={e => setSpec('poe_ports', e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* Guardar */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm w-full sm:w-auto"
            >
              {saving ? 'Guardando…' : '💾 Guardar equipo'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── EquipmentDevicesTab (principal exportado) ────────────────────────────
export default function EquipmentDevicesTab({ pharmacyId }) {
  const { devices, loading, error, addDevice, updateDevice, deleteDevice } = usePharmacyDevices(pharmacyId)
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState('servidor')
  const [adding, setAdding]   = useState(false)

  async function handleAdd() {
    setAdding(true)
    try {
      await addDevice({
        device_type: newType,
        is_viteka: false,
        specs: emptySpecs(newType),
        sort_order: devices.length,
      })
      setShowAdd(false)
      setNewType('servidor')
    } catch (e) {
      alert('Error al crear equipo: ' + e.message)
    } finally {
      setAdding(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
    </div>
  )
  if (error) return <p className="text-sm text-red-500 py-4">{error}</p>

  return (
    <div className="space-y-2">

      {/* ── Botón añadir sticky en móvil ── */}
      <div className="sticky top-0 z-10 -mx-1 pb-2 pt-1 bg-white/95 backdrop-blur">
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-full rounded-2xl border border-dashed border-teal-300 bg-teal-50 py-3 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
          >
            ➕ Añadir equipo informático
          </button>
        )}
      </div>

      {/* ── Selector de tipo ── */}
      {showAdd && (
        <div className="rounded-2xl border border-dashed border-teal-300 bg-teal-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-teal-700">Selecciona el tipo de equipo</p>
          <div className="flex flex-wrap gap-2">
            {DEVICE_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setNewType(t.value)}
                className={[
                  'px-3 py-2 rounded-full text-xs font-medium border transition-all',
                  newType === t.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="btn-primary text-sm w-full sm:w-auto"
            >
              {adding ? 'Creando…' : 'Añadir equipo'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="btn-secondary text-sm w-full sm:w-auto"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Lista de equipos ── */}
      {devices.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 py-8 text-center">No hay equipos registrados.</p>
      )}

      {devices.map(d => (
        <DeviceCard
          key={d.id}
          device={d}
          allDevices={devices}
          onUpdate={updateDevice}
          onDelete={deleteDevice}
        />
      ))}
    </div>
  )
}
