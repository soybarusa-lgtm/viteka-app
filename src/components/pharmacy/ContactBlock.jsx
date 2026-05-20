import { Label, Input, Select, Textarea } from './PharmacyFormAtoms'

const PROVINCES = [
  { value: 'almeria', label: 'Almería' }, { value: 'cadiz',   label: 'Cádiz' },
  { value: 'cordoba', label: 'Córdoba' }, { value: 'granada', label: 'Granada' },
  { value: 'huelva',  label: 'Huelva'  }, { value: 'jaen',    label: 'Jaén'  },
  { value: 'malaga',  label: 'Málaga'  }, { value: 'sevilla', label: 'Sevilla' },
]

export default function ContactBlock({ data, onChange, showGuardsAndSchedule = false, showSoe = false }) {
  const f = field => e => onChange(field, e?.target !== undefined ? e.target.value : e)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><Label>Teléfono</Label><Input value={data.phone} onChange={f('phone')} /></div>
      <div><Label>Email</Label><Input type="email" value={data.email} onChange={f('email')} /></div>
      <div className="sm:col-span-2"><Label>Dirección</Label><Input value={data.address} onChange={f('address')} /></div>
      <div>
        <Label>Provincia</Label>
        <Select value={data.province} onChange={f('province')}>
          <option value="">Seleccionar...</option>
          {PROVINCES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </Select>
      </div>
      <div><Label>Población</Label><Input value={data.city} onChange={f('city')} /></div>
      <div><Label>C.P.</Label><Input value={data.postal_code} onChange={f('postal_code')} /></div>
      {showSoe && <div><Label>SOE</Label><Input value={data.soe} onChange={f('soe')} /></div>}
      {showGuardsAndSchedule && (
        <>
          <div className={showSoe ? '' : 'sm:col-span-2'}>
            <Label>Horario</Label>
            <Input value={data.schedule} onChange={f('schedule')} placeholder="L-V 9:30-14:00 / 17:00-21:00" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id={`guards_${data.__key}`}
              checked={data.has_guards}
              onChange={e => onChange('has_guards', e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <label htmlFor={`guards_${data.__key}`} className="text-sm text-gray-700 cursor-pointer">
              Hace guardias
            </label>
          </div>
        </>
      )}
      <div className="sm:col-span-2"><Label>Observaciones</Label><Textarea value={data.observations} onChange={f('observations')} /></div>
    </div>
  )
}
