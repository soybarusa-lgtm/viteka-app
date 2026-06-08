import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'
import { useAuth } from './hooks/useAuth'
import { canAccessConfig } from './lib/permissions'
import {
  getPostLoginPath,
  isClientRole,
  isInternalRole,
  isProfileActive,
  requiresPasswordChange,
} from './lib/authRouting'
import ClientSupportLayout from './components/soporte/cliente/ClientSupportLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PharmaciesPage = lazy(() => import('./pages/PharmaciesPage'))
const PharmacyDetailPage = lazy(() => import('./pages/PharmacyOperationsDetailPage'))
const NewPharmacyPage = lazy(() => import('./pages/NewPharmacyPage'))
const PharmacyEditPage = lazy(() => import('./pages/PharmacyEditPage'))
const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
const ConfigLayout = lazy(() => import('./components/configuracion/ConfigLayout'))
const ConfigGeneralPage = lazy(() => import('./pages/configuracion/ConfigGeneralPage'))
const EquipoVitekaPage = lazy(() => import('./pages/configuracion/EquipoVitekaPage'))
const SolicitudesAltaPage = lazy(() => import('./pages/configuracion/SolicitudesAltaPage'))
const RolesPermisosPage = lazy(() => import('./pages/configuracion/RolesPermisosPage'))
const AuditoriaPage = lazy(() => import('./pages/configuracion/AuditoriaPage'))
const ClientSupportHomePage = lazy(() => import('./pages/cliente/soporte/ClientSupportHomePage'))
const ClientTicketsPage = lazy(() => import('./pages/cliente/soporte/ClientTicketsPage'))
const ClientNewTicketPage = lazy(() => import('./pages/cliente/soporte/ClientNewTicketPage'))
const ClientTicketDetailPage = lazy(() => import('./pages/cliente/soporte/ClientTicketDetailPage'))
const SupportDashboardPage = lazy(() => import('./pages/soporte/SupportDashboardPage'))
const SupportTicketsPage = lazy(() => import('./pages/soporte/SupportTicketsPage'))
const SupportTicketDetailPage = lazy(() => import('./pages/soporte/SupportTicketDetailPage'))
const SupportContactsPage = lazy(() => import('./pages/soporte/SupportContactsPage'))
const SupportContactDetailPage = lazy(() => import('./pages/soporte/SupportContactDetailPage'))
const SupportCompaniesPage = lazy(() => import('./pages/soporte/SupportCompaniesPage'))
const SupportCompanyDetailPage = lazy(() => import('./pages/soporte/SupportCompanyDetailPage'))
const SupportKnowledgeBasePage = lazy(() => import('./pages/soporte/SupportKnowledgeBasePage'))
const SupportStatsPage = lazy(() => import('./pages/soporte/SupportStatsPage'))

function PrivateSpinner() {
  return (
    <div className="flex justify-center py-24">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
    </div>
  )
}

function LegacyPharmacyRedirect({ toEdit = false }) {
  const { id } = useParams()
  return (
    <Navigate
      to={toEdit ? `/farmacias/${id}/editar` : `/farmacias/${id}`}
      replace
    />
  )
}

function ConfigRoute({ profile, children }) {
  if (!profile) return <Navigate to="/login" replace />
  return canAccessConfig(profile) ? children : <Navigate to="/" replace />
}

function InternalRoute({ profile, children }) {
  if (!profile) return <Navigate to="/login" replace />
  return isInternalRole(profile) ? children : <Navigate to="/cliente/dashboard" replace />
}

function InternalPortalRoute({ session, profile, loading, children }) {
  if (loading) return <PrivateSpinner />
  if (!session || !profile) return <Navigate to="/login" replace />
  if (!isProfileActive(profile)) return <Navigate to="/login" replace />
  if (requiresPasswordChange(profile)) return <Navigate to="/change-password" replace />
  if (isClientRole(profile)) return <Navigate to="/cliente/dashboard" replace />
  if (!isInternalRole(profile)) return <Navigate to="/login" replace />
  return children
}

function ClientPortalRoute({ session, profile, loading, children }) {
  if (loading) return <PrivateSpinner />
  if (!session || !profile) return <Navigate to="/login" replace />
  if (!isProfileActive(profile)) return <Navigate to="/login" replace />
  if (requiresPasswordChange(profile)) return <Navigate to="/change-password" replace />
  if (isClientRole(profile)) return children
  if (isInternalRole(profile)) return <Navigate to="/" replace />
  return <Navigate to="/login" replace />
}

function PasswordChangeRoute({ session, profile, loading, children }) {
  if (loading) return <PrivateSpinner />
  if (!session || !profile) return <Navigate to="/login" replace />
  if (!isProfileActive(profile)) return <Navigate to="/login" replace />
  if (requiresPasswordChange(profile)) return children
  return <Navigate to={getPostLoginPath(profile)} replace />
}

function PublicAuthRoute({ session, profile, loading, children }) {
  if (loading) return <PrivateSpinner />
  if (session && profile && isProfileActive(profile)) {
    const targetPath = getPostLoginPath(profile)
    if (requiresPasswordChange(profile)) {
      return <Navigate to="/change-password" replace />
    }
    if (targetPath !== '/login') {
      return <Navigate to={targetPath} replace />
    }
  }
  return children
}

function LazyRoute({ children }) {
  return <Suspense fallback={<PrivateSpinner />}>{children}</Suspense>
}

export default function App() {
  const { loading, profile, refreshProfile, session } = useAuth()
  const portalPath = session && profile ? getPostLoginPath(profile) : null
  const statusMessage = session && profile && !isProfileActive(profile)
    ? 'Tu cuenta no está activa. Contacta con soporte de Viteka.'
    : session && profile && isProfileActive(profile) && portalPath === '/login'
      ? 'No se pudo identificar tu perfil o permisos. Contacta con soporte de Viteka.'
      : session && !profile
        ? 'No se pudo cargar tu perfil. Vuelve a iniciar sesión o contacta con soporte de Viteka.'
        : ''

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicAuthRoute session={session} profile={profile} loading={loading}>
                <LoginPage statusMessage={statusMessage} />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicAuthRoute session={session} profile={profile} loading={loading}>
                <ForgotPasswordPage />
              </PublicAuthRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/change-password"
            element={
              <PasswordChangeRoute session={session} profile={profile} loading={loading}>
                <ChangePasswordPage profile={profile} onProfileRefresh={refreshProfile} />
              </PasswordChangeRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          <Route
            path="/"
            element={
              <InternalPortalRoute session={session} profile={profile} loading={loading}>
                <AppLayout session={session} profile={profile} />
              </InternalPortalRoute>
            }
          >
            <Route index element={<LazyRoute><DashboardPage /></LazyRoute>} />
            <Route path="pharmacies" element={<Navigate to="/farmacias" replace />} />
            <Route path="pharmacies/new" element={<Navigate to="/farmacias/nueva" replace />} />
            <Route path="pharmacies/:id" element={<LegacyPharmacyRedirect />} />
            <Route path="pharmacies/:id/edit" element={<LegacyPharmacyRedirect toEdit />} />
            <Route path="farmacias" element={<LazyRoute><PharmaciesPage /></LazyRoute>} />
            <Route path="farmacias/nueva" element={<LazyRoute><NewPharmacyPage /></LazyRoute>} />
            <Route path="farmacias/:id" element={<LazyRoute><PharmacyDetailPage /></LazyRoute>} />
            <Route path="farmacias/:id/editar" element={<LazyRoute><PharmacyEditPage /></LazyRoute>} />
            <Route path="personas" element={<LazyRoute><PeoplePage /></LazyRoute>} />
            <Route path="incidencias" element={<Navigate to="/soporte/dashboard" replace />} />
            <Route path="proyectos" element={<LazyRoute><ProjectsPage /></LazyRoute>} />
            <Route path="proyectos/:id" element={<LazyRoute><ProjectDetailPage /></LazyRoute>} />
            <Route path="documentos" element={<LazyRoute><DocumentsPage profile={profile} /></LazyRoute>} />
            <Route path="configuracion" element={<ConfigRoute profile={profile}><LazyRoute><ConfigLayout /></LazyRoute></ConfigRoute>}>
              <Route index element={<Navigate to="/configuracion/general" replace />} />
              <Route path="general" element={<LazyRoute><ConfigGeneralPage /></LazyRoute>} />
              <Route path="equipo-viteka" element={<LazyRoute><EquipoVitekaPage /></LazyRoute>} />
              <Route path="solicitudes-alta" element={<LazyRoute><SolicitudesAltaPage /></LazyRoute>} />
              <Route path="roles-permisos" element={<LazyRoute><RolesPermisosPage /></LazyRoute>} />
              <Route path="auditoria" element={<LazyRoute><AuditoriaPage /></LazyRoute>} />
            </Route>
            <Route path="soporte" element={<InternalRoute profile={profile}><Outlet /></InternalRoute>}>
              <Route index element={<Navigate to="/soporte/dashboard" replace />} />
              <Route path="dashboard" element={<LazyRoute><SupportDashboardPage /></LazyRoute>} />
              <Route path="tickets" element={<LazyRoute><SupportTicketsPage /></LazyRoute>} />
              <Route path="tickets/:id" element={<LazyRoute><SupportTicketDetailPage /></LazyRoute>} />
              <Route path="contactos" element={<LazyRoute><SupportContactsPage /></LazyRoute>} />
              <Route path="contactos/:id" element={<LazyRoute><SupportContactDetailPage /></LazyRoute>} />
              <Route path="companias" element={<LazyRoute><SupportCompaniesPage /></LazyRoute>} />
              <Route path="companias/:id" element={<LazyRoute><SupportCompanyDetailPage /></LazyRoute>} />
              <Route path="base-conocimiento" element={<LazyRoute><SupportKnowledgeBasePage /></LazyRoute>} />
              <Route path="estadisticas" element={<LazyRoute><SupportStatsPage /></LazyRoute>} />
            </Route>
          </Route>

          <Route
            path="/cliente"
            element={
              <ClientPortalRoute session={session} profile={profile} loading={loading}>
                <ClientSupportLayout profile={profile} session={session} />
              </ClientPortalRoute>
            }
          >
            <Route index element={<Navigate to="/cliente/dashboard" replace />} />
            <Route path="dashboard" element={<LazyRoute><ClientSupportHomePage /></LazyRoute>} />
            <Route path="soporte" element={<Outlet />}>
              <Route index element={<Navigate to="/cliente/dashboard" replace />} />
              <Route path="tickets" element={<LazyRoute><ClientTicketsPage /></LazyRoute>} />
              <Route path="tickets/nuevo" element={<LazyRoute><ClientNewTicketPage /></LazyRoute>} />
              <Route path="tickets/:id" element={<LazyRoute><ClientTicketDetailPage /></LazyRoute>} />
            </Route>
          </Route>

          <Route
            path="*"
            element={<Navigate to={session && profile && isProfileActive(profile) ? getPostLoginPath(profile) : '/login'} replace />}
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
