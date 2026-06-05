function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AuditLogList({ logs }) {
  if (!logs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
        <p className="text-sm font-bold text-slate-700">Sin eventos de auditoria</p>
        <p className="mt-1 text-xs text-slate-400">Cuando se aplique la migracion y haya cambios reales, apareceran aqui.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <article key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-900">{log.summary || log.action}</p>
              <p className="mt-1 text-xs text-slate-500">{log.entity_type} {log.entity_id ? `· ${log.entity_id}` : ''}</p>
            </div>
            <div className="text-left text-xs text-slate-400 md:text-right">
              <p>{formatDate(log.created_at)}</p>
              <p>{log.actor_email || log.actor_name || 'Sistema'}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
