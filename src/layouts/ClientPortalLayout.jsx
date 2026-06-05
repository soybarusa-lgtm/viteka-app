import { Navigate, Outlet, useLocation } from 'react-router-dom'
import ClientPortalHeader from '../components/cliente/ClientPortalHeader'
import { canAccessClientPortal, canViewClientDashboard, normalizeRole, ROLES } from '../lib/permissions'

export default function ClientPortalLayout({ profile, session }) {
  const location = useLocation()
  const role = normalizeRole(profile?.role)
  const pharmacyId = new URLSearchParams(location.search).get('pharmacyId') || profile?.pharmacy_id || ''

  if (!canAccessClientPortal(profile)) return <Navigate to="/" replace />

  const canSeeDashboard = canViewClientDashboard(profile, pharmacyId)
  if (!canSeeDashboard && role !== ROLES.OWNER && role !== ROLES.ADMINISTRADOR && role !== ROLES.SOPORTE && role !== ROLES.ADMINISTRACION) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fbfa]">
      <ClientPortalHeader profile={profile} session={session} />
      <main className="flex-1">
        <Outlet context={{ profile, session, pharmacyId }} />
      </main>
    </div>
  )
}
