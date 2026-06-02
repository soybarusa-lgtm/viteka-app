import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PharmaciesPage = lazy(() => import('./pages/PharmaciesPage'))
const PharmacyDetailPage = lazy(() => import('./pages/PharmacyDetailPage'))
const NewPharmacyPage = lazy(() => import('./pages/NewPharmacyPage'))
const PharmacyEditPage = lazy(() => import('./pages/PharmacyEditPage'))
const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))

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
    const { data } = await supabase
      .from('profiles')
      .select('id, role, company_id')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data ?? null)
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
            <Route path="incidencias" element={<Navigate to="/proyectos" replace />} />
            <Route path="proyectos" element={<LazyRoute><ProjectsPage /></LazyRoute>} />
            <Route path="proyectos/:id" element={<LazyRoute><ProjectDetailPage /></LazyRoute>} />
            <Route path="documentos" element={<LazyRoute><DocumentsPage profile={profile} /></LazyRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
