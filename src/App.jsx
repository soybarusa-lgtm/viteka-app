import { useState, useEffect, Component } from 'react'
import { supabase } from './lib/supabase'

import AppLayout, { NAV_ITEMS } from './layouts/AppLayout'
import MobileDrawer from './layouts/MobileDrawer'

import Dashboard from './pages/Dashboard'
import PharmaciesPage from './pages/PharmaciesPage'
import PharmacyDetailPage from './pages/PharmacyDetailPage'
import PharmacyCreatePage from './pages/PharmacyCreatePage'
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

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#f6f5f0', padding: '24px',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '8px' }}>Algo fue mal</p>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                backgroundColor: '#1c473c', color: 'white',
                border: 'none', borderRadius: '10px',
                padding: '8px 20px', cursor: 'pointer', fontSize: '14px',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ width: '32px', height: '32px', border: '4px solid #1c473c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!session) return <LoginPage onLogin={() => {}} />

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>Tu cuenta no tiene perfil asignado. Contacta con el administrador.</p>
          <button onClick={() => supabase.auth.signOut()} style={{ color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}>
            Cerrar sesión
          </button>
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
      case 'pharmacy-create':     return <PharmacyCreatePage {...props} />
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
    <div style={{ minHeight: '100vh' }}>
      <ErrorBoundary>
        <MobileDrawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          visibleNav={visibleNav}
          currentPage={currentPage}
          navigate={navigate}
          profile={profile}
          onLogout={() => supabase.auth.signOut()}
        />
      </ErrorBoundary>
      <AppLayout
        profile={profile}
        currentPage={currentPage}
        navigate={navigate}
        onLogout={() => supabase.auth.signOut()}
        onMenuOpen={() => setMobileOpen(true)}
      >
        {renderPage()}
      </AppLayout>
    </div>
  )
}
