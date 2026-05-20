import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Label, Input } from './PharmacyFormAtoms'

export default function CbOwners({ owners, onChange }) {
  const update = (i, field, val) =>
    onChange(owners.map((o, idx) => (idx === i ? { ...o, [field]: val } : o)))
  const add    = () => onChange([...owners, { name: '', nif: '', collegiate: '' }])
  const remove = i  => onChange(owners.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      {owners.map((o, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg relative">
          <div>
            <Label>{`Nombre titular ${i + 1}`}{i < 2 && <span className="text-red-500">*</span>}</Label>
            <Input value={o.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Nombre completo" />
          </div>
          <div>
            <Label>NIF</Label>
            <Input value={o.nif} onChange={e => update(i, 'nif', e.target.value)} placeholder="00000000X" />
          </div>
          <div>
            <Label>Nº Colegiado</Label>
            <Input value={o.collegiate} onChange={e => update(i, 'collegiate', e.target.value)} />
          </div>
          {i >= 2 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-2 right-2 text-red-400 hover:text-red-600"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium"
      >
        <PlusIcon className="w-3.5 h-3.5" /> Añadir titular
      </button>
    </div>
  )
}
