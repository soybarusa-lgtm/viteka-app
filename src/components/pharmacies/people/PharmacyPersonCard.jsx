import {
  ClipboardDocumentIcon,
  EnvelopeIcon,
  FolderOpenIcon,
  LifebuoyIcon,
  ListBulletIcon,
  PencilSquareIcon,
  PhoneIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import PersonRoleBadge from './PersonRoleBadge'

function ActionButton({ icon: Icon, label, onClick, disabled = false, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
        primary
          ? 'bg-[#00695C] text-white hover:bg-teal-700 disabled:opacity-50'
          : 'border border-[#DDEAE7] bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

export default function PharmacyPersonCard({
  name,
  role,
  responsibleLabel,
  phone,
  email,
  nixfarmaOperator,
  since,
  areas = [],
  notes,
  isResponsible,
  isIncomplete,
  onEdit,
  onTicket,
  onProject,
  onTask,
  onCopyEmail,
  onCopyPhone,
  onPortalAccess,
}) {
  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm ${isIncomplete ? 'border-orange-200' : 'border-[#DDEAE7]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-[#071A1D]">{name}</h3>
            <PersonRoleBadge role={role} isResponsible={isResponsible} isIncomplete={isIncomplete} />
            {responsibleLabel ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {responsibleLabel}
              </span>
            ) : null}
          </div>
          {nixfarmaOperator ? <p className="mt-1 text-xs font-medium text-blue-700">Operador Nixfarma: {nixfarmaOperator}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2"><PhoneIcon className="h-4 w-4 text-slate-400" />{phone || '—'}</div>
        <div className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4 text-slate-400" />{email || '—'}</div>
        <div className="text-slate-500">Desde: <span className="font-medium text-slate-600">{since || '—'}</span></div>
        <div className="text-slate-500">Responsabilidad: <span className={`font-medium ${isResponsible ? 'text-emerald-700' : 'text-slate-600'}`}>{responsibleLabel || 'Sin prioridad'}</span></div>
      </div>

      {areas.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {areas.map(area => (
            <span key={`${name}-${area}`} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              {area}
            </span>
          ))}
        </div>
      ) : null}

      {notes ? <p className="mt-3 text-xs text-slate-400">{notes}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <ActionButton icon={PencilSquareIcon} label="Editar" onClick={onEdit} />
        <ActionButton icon={LifebuoyIcon} label="Crear ticket" onClick={onTicket} primary />
        <ActionButton icon={FolderOpenIcon} label="Crear proyecto" onClick={onProject} />
        <ActionButton icon={ListBulletIcon} label="Crear tarea" onClick={onTask} />
        <ActionButton icon={ClipboardDocumentIcon} label="Copiar email" onClick={onCopyEmail} disabled={!email} />
        <ActionButton icon={PhoneIcon} label="Copiar teléfono" onClick={onCopyPhone} disabled={!phone} />
        <ActionButton icon={UserPlusIcon} label="Acceso portal" onClick={onPortalAccess} />
      </div>
    </article>
  )
}
