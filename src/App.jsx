import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

// Layouts
import AppLayout from './layouts/AppLayout'

// Pages — Portal Interno
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

// Pages — Portal Cliente
import ClientPortalPage from './pages/ClientPortalPage'

// Auth
import LoginPage from './pages/LoginPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [pageParams, setPageParams] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoadingAuth(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else {
        setProfile(null)
        setLoadingAuth(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
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

  if (!session) {
    return <LoginPage onLogin={() => {}} />
  }

  // Portal cliente
  if (profile?.portal_type === 'client') {
    return <ClientPortalPage profile={profile} onLogout={() => supabase.auth.signOut()} />
  }

  // Portal interno
  function renderPage() {
    const props = { navigate, profile, ...pageParams }
    switch (currentPage) {
      case 'dashboard':             return <Dashboard {...props} />
      case 'pharmacies':            return <PharmaciesPage {...props} />
      case 'pharmacy-detail':       return <PharmacyDetailPage {...props} />
      case 'projects':              return <ProjectsPage {...props} />
      case 'project-detail':        return <ProjectDetailPage {...props} />
      case 'tasks':                 return <TasksPage {...props} />
      case 'checklists':            return <ChecklistsPage {...props} />
      case 'checklist-execution':   return <ChecklistExecutionPage {...props} />
      case 'checklist-report':      return <ChecklistReportPage {...props} />
      case 'template-editor':       return <TemplateEditorPage {...props} />
      case 'incidents':             return <IncidentsPage {...props} />
      case 'documents':             return <DocumentsPage {...props} />
      case 'people':                return <PeoplePage {...props} />
      case 'timeline':              return <TimelinePage {...props} />
      case 'activity-logs':         return <ActivityLogsPage {...props} />
      case 'users':                 return <UsersPage {...props} />
      case 'settings':              return <SettingsPage {...props} />
      default:                      return <Dashboard {...props} />
    }
  }

  return (
    <AppLayout
      profile={profile}
      currentPage={currentPage}
      navigate={navigate}
      onLogout={() => supabase.auth.signOut()}
    >
      {renderPage()}
    </AppLayout>
  )
}
