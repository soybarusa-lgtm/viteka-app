import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { canPreviewClientPortal, isClientSupportUser, isInternalSupportUser } from './lib/supportPermissions'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import ClientSupportLayout from './components/soporte/cliente/ClientSupportLayout'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PharmaciesPage = lazy(() => import('./pages/PharmaciesPage'))
const PharmacyDetailPage = lazy(() => import('./pages/PharmacyDetailPage'))
const NewPharmacyPage = lazy(() => import('./pages/NewPharmacyPage'))
const PharmacyEditPage = lazy(() => import('./pages/PharmacyEditPage'))
const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
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

// Protege rutas autenticadas
function PrivateRoute({ session, children }) {
  if (session === undefined) return null // Cargando sesión
  return session ? children : <Navigate to="/login" replace />
}

// Compatibilidad con rutas antiguas en inglés (/pharmacies/*)
function LegacyPharmacyRedirect({ toEdit = false }) {
  const { id } = useParams()
  return (
    <Navigate
      to={toEdit ? `/farmacias/${id}/editar` : `/farmacias/${id}`}
      replace
    />
  )
}

function InternalRoute({ profile, children }) {
  if (profile === undefined) return null
  return isInternalSupportUser(profile) ? children : <Navigate to={isClientSupportUser(profile) ? '/cliente/soporte' : '/'} replace />
}

function ClientRoute({ session, profile, children }) {
  if (session === undefined || profile === undefined) return null
  if (!session) return <Navigate to="/login" replace />
  return canPreviewClientPortal(profile) ? children : <Navigate to="/soporte/dashboard" replace />
}

function PageFallback() {
  return (
    <div className="flex justify-center py-24">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
    </div>
  )
}

function LazyRoute({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, company_id, pharmacy_id, full_name, email')
      .eq('id', userId)
      .maybeSingle()
    if (!error) {
      setProfile(data ?? null)
      return
    }

    // Keep the historical backend usable until the support migration adds pharmacy_id.
    const { data: legacyProfile } = await supabase
      .from('profiles')
      .select('id, role, company_id')
      .eq('id', userId)
      .maybeSingle()
    setProfile(legacyProfile ? { ...legacyProfile, pharmacy_id: null, full_name: '', email: '' } : null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session ?? null
      setSession(s)
      if (s) loadProfile(s.user.id)
      else setProfile(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) loadProfile(s.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            session ? <Navigate to="/" replace /> : <LoginPage />
          } />

          <Route path="/" element={
            <PrivateRoute session={session}>
              <AppLayout session={session} />
            </PrivateRoute>
          }>
            <Route index element={isClientSupportUser(profile) ? <Navigate to="/cliente/soporte" replace /> : <LazyRoute><DashboardPage /></LazyRoute>} />
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

          <Route path="/cliente/soporte" element={
            <ClientRoute session={session} profile={profile}>
              <ClientSupportLayout profile={profile} session={session} />
            </ClientRoute>
          }>
            <Route index element={<LazyRoute><ClientSupportHomePage /></LazyRoute>} />
            <Route path="tickets" element={<LazyRoute><ClientTicketsPage /></LazyRoute>} />
            <Route path="tickets/nuevo" element={<LazyRoute><ClientNewTicketPage /></LazyRoute>} />
            <Route path="tickets/:id" element={<LazyRoute><ClientTicketDetailPage /></LazyRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
