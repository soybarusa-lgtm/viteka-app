import { Label, Input, Select } from './PharmacyFormAtoms'

const SAT_OPTIONS = ['', '1', '2', '3', '4', '5']
const SAT_LABELS  = { '': '—', '1': '1 — Muy malo', '2': '2 — Malo', '3': '3 — Regular', '4': '4 — Bueno', '5': '5 — Excelente' }

function SatSelect({ value, onChange }) {
  return (
    <Select value={value || ''} onChange={onChange}>
      {SAT_OPTIONS.map(o => <option key={o} value={o}>{SAT_LABELS[o]}</option>)}
    </Select>
  )
}

/**
 * Bloque reutilizable de Distribuidor / Soporte / Anotaciones.
 * Si viteka=true los campos distribuidor y soporte se muestran como "Viteka" (read-only).
 * detail: objeto con { distribuidor, val_distribuidor, soporte, val_soporte, anotaciones }
 * onChange(key, value)
 */
export default function DistribuidorBlock({ viteka = false, detail = {}, onChange }) {
  const d = detail

  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribuidor y soporte</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Distribuidor */}
        <div>
          <Label>Distribuidor</Label>
          {viteka
            ? <p className="mt-1 px-3 py-2 rounded-lg bg-teal-50 text-sm text-teal-700 font-medium border border-teal-200">Viteka</p>
            : <Input value={d.distribuidor || ''} onChange={e => onChange('distribuidor', e.target.value)} placeholder="Nombre del distribuidor" />
          }
        </div>

        {/* Valoración distribuidor */}
        <div>
          <Label>Valoración distribuidor</Label>
          <SatSelect value={d.val_distribuidor} onChange={e => onChange('val_distribuidor', e.target.value)} />
        </div>

        {/* Soporte */}
        <div>
          <Label>Soporte</Label>
          {viteka
            ? <p className="mt-1 px-3 py-2 rounded-lg bg-teal-50 text-sm text-teal-700 font-medium border border-teal-200">Viteka</p>
            : <Input value={d.soporte || ''} onChange={e => onChange('soporte', e.target.value)} placeholder="Nombre del soporte" />
          }
        </div>

        {/* Valoración soporte */}
        <div>
          <Label>Valoración soporte</Label>
          <SatSelect value={d.val_soporte} onChange={e => onChange('val_soporte', e.target.value)} />
        </div>
      </div>

      {/* Anotaciones */}
      <div>
        <Label>Anotaciones</Label>
        <textarea
          rows={2}
          value={d.anotaciones || ''}
          onChange={e => onChange('anotaciones', e.target.value)}
          placeholder="Notas adicionales sobre este producto..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  )
}
