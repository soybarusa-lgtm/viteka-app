import { useEffect, useState } from 'react'
import AuditLogList from '../../components/configuracion/AuditLogList'
import { supabase } from '../../lib/supabase'

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadLogs() {
      setLoading(true)
      const { data, error: auditError } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, entity_id, actor_email, actor_name, summary, created_at')
        .order('created_at', { ascending: false })
        .limit(80)
      if (cancelled) return
      if (auditError) {
        setLogs([])
        setError(auditError.message)
      } else {
        setLogs(data || [])
        setError(null)
      }
      setLoading(false)
    }
    loadLogs()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-950">Auditoria</h2>
        <p className="mt-1 text-sm text-slate-500">Cambios recientes de configuracion, permisos y equipo interno.</p>
        {error && <p className="mt-2 text-xs text-amber-600">{error}</p>}
      </div>
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">Cargando auditoria...</div>
      ) : (
        <AuditLogList logs={logs} />
      )}
    </div>
  )
}
