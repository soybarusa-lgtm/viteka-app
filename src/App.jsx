import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PharmaciesPage from './pages/PharmaciesPage'
import PharmacyDetailPage from './pages/PharmacyDetailPage'
import NewPharmacyPage from './pages/NewPharmacyPage'
import PharmacyEditPage from './pages/PharmacyEditPage'

// Protege rutas autenticadas
function PrivateRoute({ session, children }) {
  if (session === undefined) return null // Cargando sesión
  return session ? children : <Navigate to="/login" replace />
}

// Protege rutas solo para el rol 'admin'
function AdminRoute({ session, profile, children }) {
  if (session === undefined || profile === undefined) return null
  if (!session) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)

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

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data ?? null)
  }

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
            <Route path="farmacias" element={<PharmaciesPage />} />
            <Route path="farmacias/nueva" element={<NewPharmacyPage />} />
            <Route path="farmacias/:id" element={<PharmacyDetailPage />} />
            <Route path="farmacias/:id/editar" element={<PharmacyEditPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
