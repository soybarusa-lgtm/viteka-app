import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PharmaciesPage from './pages/PharmaciesPage'
import PharmacyDetailPage from './pages/PharmacyDetailPage'
import NewPharmacyPage from './pages/NewPharmacyPage'
import PharmacyEditPage from './pages/PharmacyEditPage'
import PeoplePage from './pages/PeoplePage'
import IncidentsPage from './pages/IncidentsPage'
import DocumentsPage from './pages/DocumentsPage'

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))

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

function ProjectRoute({ detail = false }) {
  const Page = detail ? ProjectDetailPage : ProjectsPage
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" /></div>}>
      <Page />
    </Suspense>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data ?? null)
  }

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
  }, [])

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
            <Route index element={<DashboardPage />} />
            <Route path="pharmacies" element={<Navigate to="/farmacias" replace />} />
            <Route path="pharmacies/new" element={<Navigate to="/farmacias/nueva" replace />} />
            <Route path="pharmacies/:id" element={<LegacyPharmacyRedirect />} />
            <Route path="pharmacies/:id/edit" element={<LegacyPharmacyRedirect toEdit />} />
            <Route path="farmacias" element={<PharmaciesPage />} />
            <Route path="farmacias/nueva" element={<NewPharmacyPage />} />
            <Route path="farmacias/:id" element={<PharmacyDetailPage />} />
            <Route path="farmacias/:id/editar" element={<PharmacyEditPage />} />
            <Route path="personas" element={<PeoplePage />} />
            <Route path="incidencias" element={<IncidentsPage profile={profile} />} />
            <Route path="proyectos" element={<ProjectRoute />} />
            <Route path="proyectos/:id" element={<ProjectRoute detail />} />
            <Route path="documentos" element={<DocumentsPage profile={profile} />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
