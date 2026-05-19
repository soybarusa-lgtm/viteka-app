import { useState, useEffect, Component, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'

import AppLayout, { NAV_ITEMS } from './layouts/AppLayout'
import MobileDrawer from './layouts/MobileDrawer'

// LoginPage se mantiene estático: se necesita antes de autenticar
import LoginPage from './pages/LoginPage'

// Resto de páginas → carga perezosa (cada una genera un chunk independiente en Vite)
const Dashboard             = lazy(() => import('./pages/Dashboard'))
const PharmaciesPage        = lazy(() => import('./pages/PharmaciesPage'))
const PharmacyDetailPage    = lazy(() => import('./pages/PharmacyDetailPage'))
const PharmacyCreatePage    = lazy(() => import('./pages/PharmacyCreatePage'))
const ProjectsPage          = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage     = lazy(() => import('./pages/ProjectDetailPage'))
const TasksPage             = lazy(() => import('./pages/TasksPage'))
const ChecklistsPage        = lazy(() => import('./pages/ChecklistsPage'))
const ChecklistExecutionPage = lazy(() => import('./pages/ChecklistExecutionPage'))
const ChecklistReportPage   = lazy(() => import('./pages/ChecklistReportPage'))
const TemplateEditorPage    = lazy(() => import('./pages/TemplateEditorPage'))
const IncidentsPage         = lazy(() => import('./pages/IncidentsPage'))
const DocumentsPage         = lazy(() => import('./pages/DocumentsPage'))
const PeoplePage            = lazy(() => import('./pages/PeoplePage'))
const TimelinePage          = lazy(() => import('./pages/TimelinePage'))
const ActivityLogsPage      = lazy(() => import('./pages/ActivityLogsPage'))
const UsersPage             = lazy(() => import('./pages/UsersPage'))
const SettingsPage          = lazy(() => import('./pages/SettingsPage'))
const ClientsPage           = lazy(() => import('./pages/ClientsPage'))
const ClientDetailPage      = lazy(() => import('./pages/ClientDetailPage'))
const ClientPortalPage      = lazy(() => import('./pages/ClientPortalPage'))

// Fallback de Suspense — reutiliza el spinner existente
function PageSpinner() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '4px solid #1c473c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

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
    return (
      <Suspense fallback={<PageSpinner />}>
        <ClientPortalPage profile={profile} onLogout={() => supabase.auth.signOut()} />
      </Suspense>
    )
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
      case 'checklists':          return <ChecklistsPage { ...props } />
      case 'checklist-execution': return <ChecklistExecutionPage { ...props } />
      case 'checklist-report':    return <ChecklistReportPage { ...props } />
      case 'template-editor':     return <TemplateEditorPage {...props} />
      case 'incidents':           return <IncidentsPage { ...props } />
      case 'documents':           return <DocumentsPage { ...props } />
      case 'people':              return <PeoplePage { ...props } />
      case 'timeline':            return <TimelinePage {...props} />
      case 'activity-logs':       return <ActivityLogsPage { ...props } />
      case 'users':               return <UsersPage {...props} />
      case 'settings':            return <SettingsPage {...props} />
      case 'clients':             return <ClientsPage {...props} />
      case 'client-detail':       return <ClientDetailPage {...props} />
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
        <ErrorBoundary>
          <Suspense fallback={<PageSpinner />}>
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
      </AppLayout>
    </div>
  )
}
