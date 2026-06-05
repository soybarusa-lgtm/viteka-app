import { ROLES, ROLE_LABELS } from '../../lib/permissions'

export default function EquipoVitekaForm({ value, onChange, onSubmit, onCancel, canAssignRole, saving }) {
  const setField = (field, nextValue) => onChange({ ...value, [field]: nextValue })

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">{value?.id ? 'Editar persona' : 'Nueva persona'}</h2>
          <p className="text-sm text-slate-500">Alta operativa del equipo interno Viteka.</p>
        </div>
        <button type="button" onClick={onCancel} className="btn-ghost text-xs">Cerrar</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="label">Nombre completo</span>
          <input className="field" value={value.full_name || ''} onChange={e => setField('full_name', e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input className="field" type="email" value={value.email || ''} onChange={e => setField('email', e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Telefono</span>
          <input className="field" value={value.phone || ''} onChange={e => setField('phone', e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Rol</span>
          <select className="field" value={value.role || ROLES.SOPORTE} onChange={e => setField('role', e.target.value)}>
            {Object.values(ROLES).map(role => (
              <option key={role} value={role} disabled={!canAssignRole(role)}>{ROLE_LABELS[role]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Departamento</span>
          <input className="field" value={value.department || ''} onChange={e => setField('department', e.target.value)} />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" checked={value.is_active !== false} onChange={e => setField('is_active', e.target.checked)} />
          Usuario activo
        </label>
        <label className="block md:col-span-2">
          <span className="label">Notas internas</span>
          <textarea className="field min-h-24" value={value.internal_notes || ''} onChange={e => setField('internal_notes', e.target.value)} />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  )
}
