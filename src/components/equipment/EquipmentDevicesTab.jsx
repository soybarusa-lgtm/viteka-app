import { useState } from 'react'
import { usePharmacyDevices } from '../../hooks/usePharmacyEquipment'

// ─── Catálogos ────────────────────────────────────────────────────────────
const DEVICE_TYPES = [
  { value: 'servidor',              label: '🖥️ Servidor' },
  { value: 'estacion',              label: '💻 Estación de trabajo' },
  { value: 'impresora_docs',        label: '🖨️ Impresora documentos' },
  { value: 'impresora_tickets',     label: '🧾 Impresora tickets' },
  { value: 'impresora_etiquetas',   label: '🏷️ Impresora etiquetas adhesivas' },
  { value: 'sai',                   label: '🔋 SAI / UPS' },
  { value: 'router',                label: '📡 Router' },
  { value: 'switch',                label: '🔀 Switch' },
]

const OS_OPTIONS    = ['Windows 11', 'Windows 10', 'Windows Server 2022', 'Windows Server 2019', 'Linux', 'Otro']
const DISK_TYPES    = ['SSD', 'HDD', 'NVMe']
const CONN_TYPES    = ['HDMI', 'VGA', 'DVI', 'DisplayPort', 'Otro']
const PRINT_CONNS   = ['Ethernet', 'USB', 'Serie', 'Bluetooth', 'WiFi', 'Otro']
const LAYERS        = ['1ª', '2ª', '3ª', '4ª', '5ª']
const NET_PRIORITY  = ['Principal', 'Secundario', 'Backup']

// Valor vacío para specs por tipo
function emptySpecs(type) {
  const pc = { os: '', ip: [''], antivirus: '', cpu: '', ram: '',
    disks: [{ type: 'SSD', capacity: '' }], gpu: '', psu: '',
    monitor: false, monitor_size: '', monitor_color: '', monitor_conn: 'HDMI',
    keyboard: 'no', mouse: 'no',
    card_reader: false, card_reader_model: '', card_reader_year: '',
    qr_reader: false, qr_wired: 'cable', qr_model: '', qr_year: '',
    linked_to: '' }
  if (type === 'servidor' || type === 'estacion') return pc
  if (type.startsWith('impresora')) return { brand: '', model: '', connection: 'USB', linked_to: '' }
  if (type === 'sai') return { brand: '', model: '', capacity: '', year: '', linked_to: '' }
  if (type === 'router') return {
    brand: '', model: '', provider: '', year: '', priority: 'Principal',
    contact_name: '', contact_role: '', contact_phone: '', contact_email: '' }
  if (type === 'switch') return {
    brand: '', model: '', ports: '', managed: false,
    year: '', layer: '2ª', poe: false, poe_ports: '' }
  return {}
}

// ─── DeviceCard ───────────────────────────────────────────────────────────
function DeviceCard({ device, allDevices, onUpdate, onDelete }) {
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState({ ...device })
  const [saving, setSaving] = useState(false)

  const s = form.specs || {}
  function setSpec(k, v) { setForm(f => ({ ...f, specs: { ...f.specs, [k]: v } })) }
  function addIp()  { setSpec('ip', [...(s.ip || ['']), '']) }
  function setIp(i, v) { const a = [...(s.ip||[''])]; a[i]=v; setSpec('ip', a) }
  function addDisk()  { setSpec('disks', [...(s.disks||[]), { type:'SSD', capacity:'' }]) }
  function setDisk(i, k, v) { const a=[...(s.disks||[])]; a[i]={...a[i],[k]:v}; setSpec('disks', a) }

  const typeLabel = DEVICE_TYPES.find(t => t.value === form.device_type)?.label || form.device_type
  const isPc = ['servidor','estacion'].includes(form.device_type)
  const isPrinter = form.device_type?.startsWith('impresora')

  async function handleSave() {
    setSaving(true)
    try { await onUpdate(device.id, form) } finally { setSaving(false) }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <input type="checkbox" checked={form.is_viteka || false}
          onClick={e => e.stopPropagation()}
          onChange={e => setForm(f => ({ ...f, is_viteka: e.target.checked }))}
          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="font-medium text-sm flex-1">{typeLabel}</span>
        {form.is_viteka && (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">✅ VITEKA</span>
        )}
        {form.serial_number && (
          <span className="text-xs text-gray-400 hidden sm:block">S/N: {form.serial_number}</span>
        )}
        <button onClick={e => { e.stopPropagation(); if(confirm('¿Eliminar equipo?')) onDelete(device.id) }}
          className="text-red-400 hover:text-red-600 text-xs px-2" type="button">🗑</button>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="p-4 space-y-4 bg-white">

          {/* Control VITEKA */}
          {form.is_viteka && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Datos VITEKA</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="label">Nº de serie</label>
                  <input className="input" value={form.serial_number||''} onChange={e=>setForm(f=>({...f,serial_number:e.target.value}))}/></div>
                <div><label className="label">Fecha instalación</label>
                  <input className="input" type="date" value={form.install_date||''} onChange={e=>setForm(f=>({...f,install_date:e.target.value}))}/></div>
                <div><label className="label">Fin garantía</label>
                  <input className="input" type="date" value={form.warranty_end||''} onChange={e=>setForm(f=>({...f,warranty_end:e.target.value}))}/></div>
                <div><label className="label">Observaciones</label>
                  <input className="input" value={form.observations||''} onChange={e=>setForm(f=>({...f,observations:e.target.value}))}/></div>
              </div>
            </div>
          )}

          {/* PC/Servidor/Estación */}
          {isPc && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><label className="label">Sistema operativo</label>
                  <select className="input" value={s.os||''} onChange={e=>setSpec('os',e.target.value)}>
                    <option value="">Selecciona...</option>
                    {OS_OPTIONS.map(o=><option key={o}>{o}</option>)}
                  </select></div>
                <div><label className="label">Procesador</label><input className="input" value={s.cpu||''} onChange={e=>setSpec('cpu',e.target.value)}/></div>
                <div><label className="label">RAM</label><input className="input" value={s.ram||''} placeholder="Ej: 16 GB" onChange={e=>setSpec('ram',e.target.value)}/></div>
                <div><label className="label">Antivirus</label><input className="input" value={s.antivirus||''} onChange={e=>setSpec('antivirus',e.target.value)}/></div>
                <div><label className="label">Gráfica</label><input className="input" value={s.gpu||''} onChange={e=>setSpec('gpu',e.target.value)}/></div>
                <div><label className="label">Fuente alimentación</label><input className="input" value={s.psu||''} onChange={e=>setSpec('psu',e.target.value)}/></div>
              </div>

              {/* IPs */}
              <div>
                <label className="label">Direcciones IP</label>
                {(s.ip||['']).map((ip,i) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <input className="input flex-1" value={ip} placeholder="192.168.1.x" onChange={e=>setIp(i,e.target.value)}/>
                  </div>
                ))}
                <button type="button" onClick={addIp} className="btn-secondary text-xs">+ Añadir IP</button>
              </div>

              {/* Discos */}
              <div>
                <label className="label">Discos duros</label>
                {(s.disks||[]).map((d,i) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <select className="input w-28" value={d.type} onChange={e=>setDisk(i,'type',e.target.value)}>
                      {DISK_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <input className="input flex-1" placeholder="Capacidad (Ej: 512 GB)" value={d.capacity} onChange={e=>setDisk(i,'capacity',e.target.value)}/>
                  </div>
                ))}
                <button type="button" onClick={addDisk} className="btn-secondary text-xs">+ Añadir disco</button>
              </div>

              {/* Monitor */}
              <div>
                <label className="label">Monitor</label>
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={s.monitor||false}
                    onChange={e=>setSpec('monitor',e.target.checked)}
                    className="rounded border-gray-300 text-teal-600"/>
                  <span className="text-sm">Tiene monitor</span>
                </div>
                {s.monitor && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div><label className="label">Tamaño</label><input className="input" value={s.monitor_size||''} placeholder='Ej: 24"' onChange={e=>setSpec('monitor_size',e.target.value)}/></div>
                    <div><label className="label">Color</label><input className="input" value={s.monitor_color||''} onChange={e=>setSpec('monitor_color',e.target.value)}/></div>
                    <div><label className="label">Conexión</label>
                      <select className="input" value={s.monitor_conn||'HDMI'} onChange={e=>setSpec('monitor_conn',e.target.value)}>
                        {CONN_TYPES.map(c=><option key={c}>{c}</option>)}
                      </select></div>
                  </div>
                )}
              </div>

              {/* Periféricos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="label">Teclado</label>
                  <select className="input" value={s.keyboard||'no'} onChange={e=>setSpec('keyboard',e.target.value)}>
                    <option value="no">NO</option><option value="cable">Cable</option><option value="inalambrico">Inalámbrico</option>
                  </select></div>
                <div><label className="label">Ratón</label>
                  <select className="input" value={s.mouse||'no'} onChange={e=>setSpec('mouse',e.target.value)}>
                    <option value="no">NO</option><option value="cable">Cable</option><option value="inalambrico">Inalámbrico</option>
                  </select></div>
                <div>
                  <label className="label">Lector tarjetas</label>
                  <select className="input" value={s.card_reader?'si':'no'} onChange={e=>setSpec('card_reader',e.target.value==='si')}>
                    <option value="no">NO</option><option value="si">SI</option>
                  </select>
                  {s.card_reader && (
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <input className="input" placeholder="Modelo" value={s.card_reader_model||''} onChange={e=>setSpec('card_reader_model',e.target.value)}/>
                      <input className="input" placeholder="Año" type="number" value={s.card_reader_year||''} onChange={e=>setSpec('card_reader_year',e.target.value)}/>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Lector QR 2D</label>
                  <select className="input" value={s.qr_reader?'si':'no'} onChange={e=>setSpec('qr_reader',e.target.value==='si')}>
                    <option value="no">NO</option><option value="si">SI</option>
                  </select>
                  {s.qr_reader && (
                    <div className="space-y-1 mt-1">
                      <select className="input" value={s.qr_wired||'cable'} onChange={e=>setSpec('qr_wired',e.target.value)}>
                        <option value="cable">Cable</option><option value="inalambrico">Inalámbrico</option>
                      </select>
                      <input className="input" placeholder="Modelo" value={s.qr_model||''} onChange={e=>setSpec('qr_model',e.target.value)}/>
                      <input className="input" placeholder="Año" type="number" value={s.qr_year||''} onChange={e=>setSpec('qr_year',e.target.value)}/>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Impresoras */}
          {isPrinter && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="label">Marca</label><input className="input" value={s.brand||''} onChange={e=>setSpec('brand',e.target.value)}/></div>
              <div><label className="label">Modelo</label><input className="input" value={s.model||''} onChange={e=>setSpec('model',e.target.value)}/></div>
              <div><label className="label">Conexión</label>
                <select className="input" value={s.connection||'USB'} onChange={e=>setSpec('connection',e.target.value)}>
                  {PRINT_CONNS.map(c=><option key={c}>{c}</option>)}
                </select></div>
              <div><label className="label">Equipo vinculado</label>
                <select className="input" value={s.linked_to||''} onChange={e=>setSpec('linked_to',e.target.value)}>
                  <option value="">—</option>
                  {allDevices.filter(d=>['servidor','estacion'].includes(d.device_type))
                    .map(d=><option key={d.id} value={d.id}>{DEVICE_TYPES.find(t=>t.value===d.device_type)?.label} ({d.specs?.cpu||''})</option>)}
                </select></div>
            </div>
          )}

          {/* SAI */}
          {form.device_type === 'sai' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="label">Marca</label><input className="input" value={s.brand||''} onChange={e=>setSpec('brand',e.target.value)}/></div>
              <div><label className="label">Modelo</label><input className="input" value={s.model||''} onChange={e=>setSpec('model',e.target.value)}/></div>
              <div><label className="label">Capacidad</label><input className="input" value={s.capacity||''} placeholder="Ej: 1500 VA" onChange={e=>setSpec('capacity',e.target.value)}/></div>
              <div><label className="label">Año</label><input className="input" type="number" value={s.year||''} onChange={e=>setSpec('year',e.target.value)}/></div>
              <div className="col-span-2 sm:col-span-4">
                <label className="label">Equipo vinculado</label>
                <select className="input" value={s.linked_to||''} onChange={e=>setSpec('linked_to',e.target.value)}>
                  <option value="">—</option>
                  {allDevices.filter(d=>['servidor','estacion'].includes(d.device_type))
                    .map(d=><option key={d.id} value={d.id}>{DEVICE_TYPES.find(t=>t.value===d.device_type)?.label} ({d.specs?.cpu||''})</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Router */}
          {form.device_type === 'router' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="label">Marca</label><input className="input" value={s.brand||''} onChange={e=>setSpec('brand',e.target.value)}/></div>
                <div><label className="label">Modelo</label><input className="input" value={s.model||''} onChange={e=>setSpec('model',e.target.value)}/></div>
                <div><label className="label">Proveedor</label><input className="input" value={s.provider||''} onChange={e=>setSpec('provider',e.target.value)}/></div>
                <div><label className="label">Año</label><input className="input" type="number" value={s.year||''} onChange={e=>setSpec('year',e.target.value)}/></div>
                <div><label className="label">Prioridad</label>
                  <select className="input" value={s.priority||'Principal'} onChange={e=>setSpec('priority',e.target.value)}>
                    {NET_PRIORITY.map(p=><option key={p}>{p}</option>)}
                  </select></div>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contacto proveedor</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="label">Nombre</label><input className="input" value={s.contact_name||''} onChange={e=>setSpec('contact_name',e.target.value)}/></div>
                <div><label className="label">Cargo</label><input className="input" value={s.contact_role||''} onChange={e=>setSpec('contact_role',e.target.value)}/></div>
                <div><label className="label">Teléfono</label><input className="input" type="tel" value={s.contact_phone||''} onChange={e=>setSpec('contact_phone',e.target.value)}/></div>
                <div><label className="label">Email</label><input className="input" type="email" value={s.contact_email||''} onChange={e=>setSpec('contact_email',e.target.value)}/></div>
              </div>
            </>
          )}

          {/* Switch */}
          {form.device_type === 'switch' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="label">Marca</label><input className="input" value={s.brand||''} onChange={e=>setSpec('brand',e.target.value)}/></div>
              <div><label className="label">Modelo</label><input className="input" value={s.model||''} onChange={e=>setSpec('model',e.target.value)}/></div>
              <div><label className="label">Nº salidas</label><input className="input" type="number" value={s.ports||''} onChange={e=>setSpec('ports',e.target.value)}/></div>
              <div><label className="label">Año</label><input className="input" type="number" value={s.year||''} onChange={e=>setSpec('year',e.target.value)}/></div>
              <div><label className="label">Gestionable</label>
                <select className="input" value={s.managed?'si':'no'} onChange={e=>setSpec('managed',e.target.value==='si')}>
                  <option value="no">NO</option><option value="si">SI</option>
                </select></div>
              <div><label className="label">Capa</label>
                <select className="input" value={s.layer||'2ª'} onChange={e=>setSpec('layer',e.target.value)}>
                  {LAYERS.map(l=><option key={l}>{l}</option>)}
                </select></div>
              <div><label className="label">PoE</label>
                <select className="input" value={s.poe?'si':'no'} onChange={e=>setSpec('poe',e.target.value==='si')}>
                  <option value="no">NO</option><option value="si">SI</option>
                </select></div>
              {s.poe && (
                <div><label className="label">Puertos PoE</label>
                  <input className="input" type="number" value={s.poe_ports||''} onChange={e=>setSpec('poe_ports',e.target.value)}/>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={handleSave} disabled={saving}
              className="btn-primary text-sm">
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
  const [showAdd, setShowAdd]     = useState(false)
  const [newType, setNewType]     = useState('servidor')
  const [adding, setAdding]       = useState(false)

  async function handleAdd() {
    setAdding(true)
    try {
      await addDevice({
        device_type: newType,
        is_viteka: false,
        specs: emptySpecs(newType),
        sort_order: devices.length
      })
      setShowAdd(false)
      setNewType('servidor')
    } catch(e) {
      alert('Error al crear equipo: ' + e.message)
    } finally { setAdding(false) }
  }

  if (loading) return <p className="text-sm text-gray-400 py-4">Cargando equipos…</p>
  if (error)   return <p className="text-sm text-red-500 py-4">{error}</p>

  return (
    <div>
      {devices.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 py-6 text-center">No hay equipos registrados.</p>
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

      {/* Añadir nuevo equipo */}
      {showAdd ? (
        <div className="border border-dashed border-teal-300 rounded-lg p-4 bg-teal-50">
          <p className="text-sm font-semibold text-teal-700 mb-3">Selecciona el tipo de equipo</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEVICE_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setNewType(t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  newType === t.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}
              >{t.label}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={adding}
              className="btn-primary text-sm">{adding ? 'Creando…' : 'Añadir equipo'}</button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="btn-secondary text-sm">Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)}
          className="w-full mt-2 border border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-400 hover:border-teal-400 hover:text-teal-600 transition-colors">
          ➕ Añadir equipo informático
        </button>
      )}
    </div>
  )
}
