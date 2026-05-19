import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

import AppLayout, { NAV_ITEMS } from './layouts/AppLayout'
import MobileDrawer from './layouts/MobileDrawer'

import Dashboard from './pages/Dashboard'
import PharmaciesPage from './pages/PharmaciesPage'
import PharmacyDetailPage from './pages/PharmacyDetailPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TasksPage from './pages/TasksPage'
import ChecklistsPage from './pages/ChecklistsPage'
import ChecklistExecutionPage from './pages/ChecklistExecutionPage'
import ChecklistReportPage from './pages/ChecklistReportPage'
import TemplateEditorPage from './pages/TemplateEditorPage'
import IncidentsPage from './pages/IncidentsPage'
import DocumentsPage from './pages/DocumentsPage'
import PeoplePage from './pages/PeoplePage'
import TimelinePage from './pages/TimelinePage'
import ActivityLogsPage from './pages/ActivityLogsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import ClientPortalPage from './pages/ClientPortalPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [session,     setSession]     = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [pageParams,  setPageParams]  = useState({})
  const [mobileOpen,  setMobileOpen]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoadingAuth(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoadingAuth(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      setProfile(data)
    } catch (err) {
      console.error('Error cargando perfil:', err)
    } finally {
      setLoadingAuth(false)
    }
  }

  function navigate(page, params = {}) {
    setCurrentPage(page)
    setPageParams(params)
    window.scrollTo(0, 0)
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <LoginPage onLogin={() => {}} />

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
          <p className="text-gray-500 text-sm">Tu cuenta no tiene perfil asignado. Contacta con el administrador.</p>
          <button onClick={() => supabase.auth.signOut()} className="text-teal-600 underline text-sm">Cerrar sesión</button>
        </div>
      </div>
    )
  }

  if (profile.portal_type === 'client') {
    return <ClientPortalPage profile={profile} onLogout={() => supabase.auth.signOut()} />
  }

  const role       = profile?.role || 'technician'
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(role))

  function renderPage() {
    const props = { navigate, profile, ...pageParams }
    switch (currentPage) {
      case 'dashboard':           return <Dashboard {...props} />
      case 'pharmacies':          return <PharmaciesPage {...props} />
      case 'pharmacy-detail':     return <PharmacyDetailPage {...props} />
      case 'projects':            return <ProjectsPage {...props} />
      case 'project-detail':      return <ProjectDetailPage {...props} />
      case 'tasks':               return <TasksPage {...props} />
      case 'checklists':          return <ChecklistsPage {...props} />
      case 'checklist-execution': return <ChecklistExecutionPage {...props} />
      case 'checklist-report':    return <ChecklistReportPage {...props} />
      case 'template-editor':     return <TemplateEditorPage {...props} />
      case 'incidents':           return <IncidentsPage {...props} />
      case 'documents':           return <DocumentsPage {...props} />
      case 'people':              return <PeoplePage {...props} />
      case 'timeline':            return <TimelinePage {...props} />
      case 'activity-logs':       return <ActivityLogsPage {...props} />
      case 'users':               return <UsersPage {...props} />
      case 'settings':            return <SettingsPage {...props} />
      default:                    return <Dashboard {...props} />
    }
  }

  return (
    <>
      {/* Drawer móvil: sibling de AppLayout, fuera de cualquier overflow/stacking context */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        visibleNav={visibleNav}
        currentPage={currentPage}
        navigate={navigate}
        profile={profile}
        onLogout={() => supabase.auth.signOut()}
      />

      <AppLayout
        profile={profile}
        currentPage={currentPage}
        navigate={navigate}
        onLogout={() => supabase.auth.signOut()}
        onMenuOpen={() => setMobileOpen(true)}
      >
        {renderPage()}
      </AppLayout>
    </>
  )
}
