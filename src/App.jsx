import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PharmaciesPage from './pages/PharmaciesPage'
import PharmacyDetailPage from './pages/PharmacyDetailPage'

function PrivateRoute({ session, children }) {
  if (session === undefined) return null // cargando
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  return (
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
          <Route path="farmacias/:id" element={<PharmacyDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
