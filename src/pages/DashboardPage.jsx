import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { usePharmacyKpis } from '../hooks/usePharmacyKpis'
import { Link } from 'react-router-dom'

const STATUS_LABEL = {
  pending: 'Pendiente', active: 'Activo', in_progress: 'En progreso',
  blocked: 'Bloqueado', completed: 'Finalizado', cancelled: 'Cancelado',
  open: 'Abierta', resolved: 'Resuelta', closed: 'Cerrada',
}
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
  open: 'bg-red-100 text-red-700',
  resolved: 'bg-green-100 text-green-700',
}

function KpiCard({ label, value, sub, color = 'teal' }) {
  const colors = {
    teal:   'bg-teal-50   text-teal-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red:    'bg-red-50    text-red-700',
    blue:   'bg-blue-50   text-blue-700',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const companyId = profile?.company_id
  const { data, loading } = useDashboard(companyId)
  const { rows, totals, loading: kpiLoading } = usePharmacyKpis(companyId)

  if (authLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Farmacias activas"  value={data?.pharmacies    ?? 0} color="teal" />
        <KpiCard label="Proyectos activos"  value={data?.projectsActive ?? 0} color="blue" />
        <KpiCard label="Total proyectos"    value={data?.projectsTotal  ?? 0} color="teal" />
        <KpiCard label="Tareas pendientes"  value={data?.tasksPending   ?? 0} color="yellow" />
        <KpiCard label="Tareas vencidas"    value={data?.tasksOverdue   ?? 0} color="red" />
        <KpiCard label="Incidencias abiertas" value={data?.incidentsOpen ?? 0} color="red" />
      </div>

      {/* Proyectos por estado */}
      {data?.projectsByStatus && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Proyectos por estado</h2>
          <div className="flex gap-2 flex-wrap">
            {data.projectsByStatus.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${s.color}`} />
                <span className="text-sm text-gray-600">{s.label}: <strong>{s.count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPIs farmacias por provincia */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Farmacias con Viteka</h2>
          <p className="text-xs text-gray-400 mb-3">Solo farmacias donde Viteka es distribuidor/soporte</p>
          {kpiLoading ? (
            <div className="text-sm text-gray-400">Cargando...</div>
          ) : (
            <>
              <div className="grid grid-cols-4 text-xs font-medium text-gray-500 pb-2 border-b border-gray-100">
                <span>Provincia</span>
                <span className="text-center">Nixfarma</span>
                <span className="text-center">Cashlogy</span>
                <span className="text-center">Hanshow</span>
              </div>
              {rows.map(r => (
                <div key={r.province} className="grid grid-cols-4 text-sm py-1.5 border-b border-gray-50">
                  <span className="font-medium text-gray-700">{r.label}</span>
                  <span className="text-center text-teal-700">{r.nixfarma || '-'}</span>
                  <span className="text-center text-blue-700">{r.cashlogy || '-'}</span>
                  <span className="text-center text-purple-700">{r.hanshow || '-'}</span>
                </div>
              ))}
              <div className="grid grid-cols-4 text-sm font-semibold pt-2 text-gray-800">
                <span>Total</span>
                <span className="text-center">{totals.nixfarma}</span>
                <span className="text-center">{totals.cashlogy}</span>
                <span className="text-center">{totals.hanshow}</span>
              </div>
            </>
          )}
        </div>

        {/* Incidencias recientes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Incidencias abiertas recientes</h2>
          {(data?.recentIncidents?.length === 0) ? (
            <p className="text-sm text-gray-400">No hay incidencias abiertas</p>
          ) : (
            <div className="space-y-2">
              {(data?.recentIncidents || []).map(i => (
                <div key={i.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{i.title}</p>
                    {i.pharmacy_name && <p className="text-xs text-gray-400">{i.pharmacy_name}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[i.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[i.status] || i.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proyectos recientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Proyectos recientes</h2>
          <Link to="/proyectos" className="text-xs text-teal-600 hover:underline">Ver todos</Link>
        </div>
        {(data?.recentProjects?.length === 0) ? (
          <p className="text-sm text-gray-400">No hay proyectos aún</p>
        ) : (
          <div className="space-y-2">
            {(data?.recentProjects || []).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  {p.pharmacy_name && <p className="text-xs text-gray-400">{p.pharmacy_name}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[p.status] || p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
