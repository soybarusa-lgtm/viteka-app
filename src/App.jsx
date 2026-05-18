import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { createActivityLog } from './lib/activityLogs'
import { createNotification } from './lib/notifications'
import { useThemeMode } from './hooks/useThemeMode'

import AppLayout from './layouts/AppLayout'
import ClientLayout from './layouts/ClientLayout'

import Dashboard from './pages/Dashboard'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ChecklistsPage from './pages/ChecklistsPage'
import ChecklistExecutionPage from './pages/ChecklistExecutionPage'
import ChecklistReportPage from './pages/ChecklistReportPage'
import TemplateEditorPage from './pages/TemplateEditorPage'
import ActivityLogsPage from './pages/ActivityLogsPage'
import ClientPortalPage from './pages/ClientPortalPage'
import DocumentsPage from './pages/DocumentsPage'
import TimelinePage from './pages/TimelinePage'
import ClientDetailPage from './pages/ClientDetailPage'
import PeoplePage from './pages/PeoplePage'
import IncidentsPage from './pages/IncidentsPage'
import TasksPage from './pages/TasksPage'
import SettingsPage from './pages/SettingsPage'

import CreateClientModal from './components/modals/CreateClientModal'
import EditClientModal from './components/modals/EditClientModal'
import CreateProjectModal from './components/modals/CreateProjectModal'
import EditProjectModal from './components/modals/EditProjectModal'
import CreateChecklistModal from './components/modals/CreateChecklistModal'
import CreateTemplateModal from './components/modals/CreateTemplateModal'
import UsersPage from './pages/UsersPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [templates, setTemplates] = useState([])
  const [executedChecklists, setExecutedChecklists] = useState([])
  const [incidents, setIncidents] = useState([])
  const [tasks, setTasks] = useState([])

  const [errorMsg, setErrorMsg] = useState('')
  const [currentPage, setCurrentPage] = useState('dashboard')

  const [selectedChecklistId, setSelectedChecklistId] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState(null)

  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  const [isCreateChecklistOpen, setIsCreateChecklistOpen] = useState(false)
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false)

  const { theme, userTheme, toggleTheme } = useThemeMode({ incidents, tasks })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })
    return () => { subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (session) loadInitialData()
  }, [session])

  async function loadInitialData() {
    const loadedProfile = await loadProfile()
    await Promise.all([
      loadClients(),
      loadProjects(loadedProfile),
      loadTemplates(),
      loadExecutedChecklists(loadedProfile),
      loadIncidents(loadedProfile),
      loadTasks(loadedProfile),
    ])
  }

  async function loadProfile() {
    const userId = session?.user?.id
    if (!userId) return null
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) { console.error('loadProfile error:', error.message); return null }
    if (!data) return null
    setProfile(data)
    return data
  }

  function isTechnician(userProfile = profile) {
    return userProfile?.role === 'technician'
  }

  async function login(e) {
    e.preventDefault()
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorMsg(error.message)
  }

  async function logout() {
    await supabase.auth.signOut()
    setProfile(null)
    setClients([])
    setProjects([])
    setTemplates([])
    setExecutedChecklists([])
    setIncidents([])
    setTasks([])
    setSelectedChecklistId(null)
    setSelectedTemplateId(null)
    setSelectedClientId(null)
    setCurrentPage('dashboard')
  }

  async function loadClients() {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (error) { setErrorMsg(error.message); return }
    setClients(data || [])
  }

  async function loadProjects(userProfile = profile) {
    let query = supabase.from('projects').select('*, clients(id,name,pharmacy_name)').order('created_at', { ascending: false })
    if (isTechnician(userProfile)) query = query.eq('assigned_technician_id', session.user.id)
    const { data, error } = await query
    if (error) { setErrorMsg(error.message); return }
    setProjects(data || [])
  }

  async function loadTemplates() {
    const { data, error } = await supabase.from('checklist_templates').select('*').order('created_at', { ascending: false })
    if (error) { setErrorMsg(error.message); return }
    setTemplates(data || [])
  }

  async function loadExecutedChecklists(userProfile = profile) {
    const { data, error } = await supabase
      .from('checklists')
      .select(`*, projects(id,name,assigned_technician_id,clients(id,name,pharmacy_name)),checklist_sections(id,checklist_tasks(id,status))`)
      .order('created_at', { ascending: false })
    if (error) { setErrorMsg(error.message); return }
    const visibleData = isTechnician(userProfile)
      ? (data || []).filter(c => c.projects?.assigned_technician_id === session.user.id)
      : data || []
    const formatted = visibleData.map(checklist => {
      const allTasks  = checklist.checklist_sections?.flatMap(s => s.checklist_tasks || []) || []
      const total     = allTasks.length
      const completed = allTasks.filter(t => t.status === 'completed' || t.status === 'not_applicable').length
      const blocked   = allTasks.filter(t => t.status === 'blocked').length
      const pending   = allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
      const progress  = total > 0 ? Math.round((completed / total) * 100) : 0
      return { ...checklist, stats: { total, completed, blocked, pending, progress } }
    })
    setExecutedChecklists(formatted)
  }

  async function loadIncidents(userProfile = profile) {
    if (!userProfile?.company_id) return
    const { data } = await supabase.from('incidents').select('id,priority,status').eq('company_id', userProfile.company_id)
    setIncidents(data || [])
  }

  async function loadTasks(userProfile = profile) {
    if (!userProfile?.company_id) return
    const { data } = await supabase.from('tasks').select('id,status,due_date').eq('company_id', userProfile.company_id)
    setTasks(data || [])
  }

  // ---------------------------------------------------------------------------
  // createClient — usa TODAS las columnas reales de la tabla clients
  // ---------------------------------------------------------------------------
  async function createClient(payload) {
    // ── 1. Verificar profile ──────────────────────────────────────────────
    console.group('[createClient] inicio')
    console.log('profile:', profile)
    console.log('payload recibido:', payload)

    // Refrescar profile si es null (race condition al montar)
    let activeProfile = profile
    if (!activeProfile?.company_id) {
      console.warn('profile.company_id nulo, refrescando...')
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle()
      activeProfile = freshProfile
      if (freshProfile) setProfile(freshProfile)
    }

    if (!activeProfile?.company_id) {
      console.error('company_id sigue siendo null tras refresco')
      console.groupEnd()
      alert('Error: no se pudo obtener el company_id del perfil.\nRecarga la página y vuelve a intentarlo.')
      return
    }

    // ── 2. Preparar datos ────────────────────────────────────────────────
    const cd = payload.clientData ?? payload
    const pharmacyName = (cd.pharmacy_name || cd.name || '').trim()

    if (!pharmacyName) {
      alert('El nombre de la farmacia es obligatorio.')
      console.groupEnd()
      return
    }

    const insertData = {
      company_id:        activeProfile.company_id,
      // Columnas confirmadas por ClientDetailPage.jsx
      name:              pharmacyName,
      pharmacy_name:     pharmacyName,
      pharmacist_owner:  cd.pharmacist_owner  || null,
      province:          cd.province          || null,
      city:              cd.city              || null,
      address:           cd.address           || null,
      contact_phone:     cd.contact_phone     || null,
      contact_email:     cd.contact_email     || null,
      phone:             cd.phone             || cd.contact_phone  || null,
      email:             cd.email             || cd.contact_email  || null,
      nif_cif:           cd.nif_cif           || null,
      soe_number:        cd.soe_number        || null,
      cip:               cd.cip               || null,
      business_email:    cd.business_email    || null,
      business_phone:    cd.business_phone    || null,
      collegiate_data:   cd.collegiate_data   || null,
      company_data:      cd.company_data      || null,
      operators:         cd.operators         || null,
      observations:      cd.observations      || cd.notes || null,
      notes:             cd.notes             || cd.observations   || null,
    }

    console.log('[createClient] insertData:', insertData)

    // ── 3. Insert ────────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from('clients')
      .insert(insertData)
      .select()
      .single()

    console.log('[createClient] resultado:', { data, error })
    console.groupEnd()

    if (error) {
      alert(`❌ Error al crear farmacia:\n\nCódigo: ${error.code}\nMensaje: ${error.message}\nDetalles: ${error.details || '-'}\nHint: ${error.hint || '-'}`)
      return
    }

    await createActivityLog({ userId: session.user.id, entityType: 'client', entityId: data.id, action: 'create', newValue: data })
    await createNotification({ userId: session.user.id, title: 'Farmacia creada', message: `Se creó la farmacia "${data.pharmacy_name || data.name}".`, type: 'success', entityType: 'client', entityId: data.id })

    setIsCreateClientOpen(false)
    await loadClients()
    setCurrentPage('clients')
  }

  async function updateClient(clientId, clientData) {
    const previous = clients.find(c => c.id === clientId)
    const pharmacyName = (clientData.pharmacy_name || clientData.name || '').trim()
    const { data, error } = await supabase
      .from('clients')
      .update({
        name:             pharmacyName,
        pharmacy_name:    pharmacyName,
        pharmacist_owner: clientData.pharmacist_owner || null,
        province:         clientData.province         || null,
        city:             clientData.city             || null,
        address:          clientData.address          || null,
        contact_phone:    clientData.contact_phone    || null,
        contact_email:    clientData.contact_email    || null,
        phone:            clientData.phone            || clientData.contact_phone || null,
        email:            clientData.email            || clientData.contact_email || null,
        nif_cif:          clientData.nif_cif          || null,
        soe_number:       clientData.soe_number       || null,
        observations:     clientData.observations     || clientData.notes || null,
        notes:            clientData.notes            || clientData.observations  || null,
      })
      .eq('id', clientId)
      .select()
      .single()
    if (error) { alert(`Error al actualizar:\n${error.message}`); return }
    await createActivityLog({ userId: session.user.id, entityType: 'client', entityId: clientId, action: 'update', oldValue: previous, newValue: data })
    setEditingClient(null)
    await loadClients()
  }

  async function deleteClient(clientId) {
    if (!window.confirm('¿Eliminar esta farmacia?')) return
    const previous = clients.find(c => c.id === clientId)
    const { error } = await supabase.from('clients').delete().eq('id', clientId)
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: session.user.id, entityType: 'client', entityId: clientId, action: 'delete', oldValue: previous })
    await loadClients()
  }

  async function createProject(projectData) {
    if (!profile?.company_id) return
    const { data, error } = await supabase
      .from('projects')
      .insert({ company_id: profile.company_id, client_id: projectData.client_id, assigned_technician_id: session.user.id, name: projectData.name, status: 'active', notes: projectData.notes || '', visible_to_client: projectData.visible_to_client || false })
      .select()
      .single()
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: session.user.id, entityType: 'project', entityId: data.id, action: 'create', newValue: data })
    await createNotification({ userId: session.user.id, title: 'Proyecto creado', message: `Se creó el proyecto "${projectData.name}".`, type: 'success', entityType: 'project', entityId: data.id })
    setIsCreateProjectOpen(false)
    await loadProjects()
    setCurrentPage('projects')
  }

  async function updateProject(projectId, projectData) {
    const previous = projects.find(p => p.id === projectId)
    const { data, error } = await supabase
      .from('projects')
      .update({ name: projectData.name, client_id: projectData.client_id, status: projectData.status || 'active', notes: projectData.notes || '', visible_to_client: projectData.visible_to_client || false })
      .eq('id', projectId)
      .select()
      .single()
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: session.user.id, entityType: 'project', entityId: projectId, action: 'update', oldValue: previous, newValue: data })
    setEditingProject(null)
    await loadProjects()
  }

  async function deleteProject(projectId) {
    if (!window.confirm('¿Eliminar este proyecto?')) return
    const previous = projects.find(p => p.id === projectId)
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: session.user.id, entityType: 'project', entityId: projectId, action: 'delete', oldValue: previous })
    await loadProjects()
  }

  async function createTemplate(templateData) {
    if (!profile?.company_id) return
    const { data, error } = await supabase
      .from('checklist_templates')
      .insert({ company_id: profile.company_id, name: templateData.name, description: templateData.description || '', is_active: true })
      .select()
      .single()
    if (error) { alert(error.message); return }
    await createActivityLog({ userId: session.user.id, entityType: 'template', entityId: data.id, action: 'create', newValue: data })
    setIsCreateTemplateOpen(false)
    await loadTemplates()
    setSelectedTemplateId(data.id)
    setCurrentPage('template-editor')
  }

  async function duplicateTemplate(templateId) {
    if (!profile?.company_id) return
    const original = templates.find(t => t.id === templateId)
    if (!original) { alert('No se encontró la plantilla.'); return }
    const { data: newTemplate, error: templateError } = await supabase
      .from('checklist_templates')
      .insert({ company_id: profile.company_id, name: `${original.name} - copia`, description: original.description || '', is_active: true })
      .select()
      .single()
    if (templateError) { alert(templateError.message); return }
    const { data: sections, error: sectionsError } = await supabase.from('checklist_template_sections').select('*').eq('template_id', templateId).order('position', { ascending: true })
    if (sectionsError) { alert(sectionsError.message); return }
    for (const section of sections || []) {
      const { data: newSection, error: newSectionError } = await supabase.from('checklist_template_sections').insert({ template_id: newTemplate.id, title: section.title, position: section.position }).select().single()
      if (newSectionError) { alert(newSectionError.message); return }
      const { data: tasks, error: tasksError } = await supabase.from('checklist_template_tasks').select('*').eq('section_id', section.id).order('position', { ascending: true })
      if (tasksError) { alert(tasksError.message); return }
      const newTasks = (tasks || []).map(task => ({ section_id: newSection.id, title: task.title, description: task.description || '', required: task.required, position: task.position }))
      if (newTasks.length > 0) {
        const { error: insertTasksError } = await supabase.from('checklist_template_tasks').insert(newTasks)
        if (insertTasksError) { alert(insertTasksError.message); return }
      }
    }
    await createActivityLog({ userId: session.user.id, entityType: 'template', entityId: newTemplate.id, action: 'duplicate', oldValue: original, newValue: newTemplate })
    await loadTemplates()
    setSelectedTemplateId(newTemplate.id)
    setCurrentPage('template-editor')
  }

  async function deleteTemplate(templateId) {
    if (!window.confirm('¿Eliminar esta plantilla y todas sus secciones/tareas?')) return
    const previous = templates.find(t => t.id === templateId)
    const { data: sections, error: sectionsError } = await supabase.from('checklist_template_sections').select('id').eq('template_id', templateId)
    if (sectionsError) { alert(sectionsError.message); return }
    const sectionIds = (sections || []).map(s => s.id)
    if (sectionIds.length > 0) {
      const { error: tasksError } = await supabase.from('checklist_template_tasks').delete().in('section_id', sectionIds)
      if (tasksError) { alert(tasksError.message); return }
    }
    await supabase.from('checklist_template_sections').delete().eq('template_id', templateId)
    const { error: deleteTemplateError } = await supabase.from('checklist_templates').delete().eq('id', templateId)
    if (deleteTemplateError) { alert(deleteTemplateError.message); return }
    await createActivityLog({ userId: session.user.id, entityType: 'template', entityId: templateId, action: 'delete', oldValue: previous })
    await loadTemplates()
  }

  async function createChecklist(checklistData) {
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .insert({ project_id: checklistData.project_id, template_id: checklistData.template_id, title: checklistData.title, status: 'in_progress', visible_to_client: checklistData.visible_to_client || false })
      .select()
      .single()
    if (checklistError) { alert(checklistError.message); return }
    const { data: sections, error: sectionsError } = await supabase.from('checklist_template_sections').select('*').eq('template_id', checklistData.template_id).order('position', { ascending: true })
    if (sectionsError) { alert(sectionsError.message); return }
    for (const section of sections || []) {
      const { data: newSection, error: newSectionError } = await supabase.from('checklist_sections').insert({ checklist_id: checklist.id, title: section.title, position: section.position }).select().single()
      if (newSectionError) { alert(newSectionError.message); return }
      const { data: tasks, error: tasksError } = await supabase.from('checklist_template_tasks').select('*').eq('section_id', section.id).order('position', { ascending: true })
      if (tasksError) { alert(tasksError.message); return }
      const tasksToInsert = (tasks || []).map(task => ({ section_id: newSection.id, title: task.title, description: task.description || '', position: task.position, required: task.required, status: 'pending' }))
      if (tasksToInsert.length > 0) {
        const { error: insertTasksError } = await supabase.from('checklist_tasks').insert(tasksToInsert)
        if (insertTasksError) { alert(insertTasksError.message); return }
      }
    }
    await createActivityLog({ userId: session.user.id, entityType: 'checklist', entityId: checklist.id, action: 'create', newValue: checklist })
    await createNotification({ userId: session.user.id, title: 'Checklist creado', message: `Se creó el checklist "${checklistData.title}".`, type: 'success', entityType: 'checklist', entityId: checklist.id })
    setIsCreateChecklistOpen(false)
    await loadExecutedChecklists()
    setSelectedChecklistId(checklist.id)
    setCurrentPage('checklist-execution')
  }

  async function deleteChecklist(checklistId) {
    if (!window.confirm('¿Eliminar esta ejecución de checklist?')) return
    const previous = executedChecklists.find(c => c.id === checklistId)
    const { data: sections, error: sectionsError } = await supabase.from('checklist_sections').select('id').eq('checklist_id', checklistId)
    if (sectionsError) { alert(sectionsError.message); return }
    const sectionIds = (sections || []).map(s => s.id)
    if (sectionIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase.from('checklist_tasks').select('id').in('section_id', sectionIds)
      if (tasksError) { alert(tasksError.message); return }
      const taskIds = (tasks || []).map(t => t.id)
      if (taskIds.length > 0) {
        await supabase.from('task_evidence').delete().in('task_id', taskIds)
        await supabase.from('checklist_tasks').delete().in('id', taskIds)
      }
      await supabase.from('checklist_sections').delete().in('id', sectionIds)
    }
    const { error: deleteChecklistError } = await supabase.from('checklists').delete().eq('id', checklistId)
    if (deleteChecklistError) { alert(deleteChecklistError.message); return }
    await createActivityLog({ userId: session.user.id, entityType: 'checklist', entityId: checklistId, action: 'delete', oldValue: previous })
    await loadExecutedChecklists()
  }

  function openClientDetail(clientId) { setSelectedClientId(clientId); setCurrentPage('client-detail') }
  function backToClients() { setSelectedClientId(null); setCurrentPage('clients') }
  function openChecklist(checklistId) { setSelectedChecklistId(checklistId); setCurrentPage('checklist-execution') }
  function openChecklistReport() { setCurrentPage('checklist-report') }
  async function backToChecklists() { await loadExecutedChecklists(); await loadTemplates(); setCurrentPage('checklists') }
  function editTemplate(templateId) { setSelectedTemplateId(templateId); setCurrentPage('template-editor') }

  function changePage(page) {
    const adminOnly = ['audit', 'settings', 'users']
    if (adminOnly.includes(page) && profile?.role !== 'owner' && profile?.role !== 'admin') {
      setCurrentPage('dashboard'); return
    }
    setSelectedClientId(null)
    setCurrentPage(page)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-8">
          <h1 className="text-3xl tracking-tight text-[#005643] font-medium">Viteka</h1>
          <p className="mt-2 text-[#64748B] font-normal">Acceso portal de soporte técnico</p>
          <form onSubmit={login} className="mt-8 space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="Email" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="Contraseña" />
            <button type="submit" className="btn-primary w-full">Entrar</button>
          </form>
          {errorMsg && <p className="mt-4 text-red-600 font-normal">{errorMsg}</p>}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-8 text-center">
          <p className="text-[#64748B]">Tu cuenta no tiene un perfil asignado. Contacta con el administrador.</p>
          <button onClick={logout} className="mt-4 text-sm text-[#005643] underline">Cerrar sesión</button>
        </div>
      </div>
    )
  }

  if (profile?.portal_type === 'client') {
    return (
      <ClientLayout onLogout={logout} currentPage={currentPage} setCurrentPage={changePage} profile={profile}>
        <ClientPortalPage currentPage={currentPage} />
      </ClientLayout>
    )
  }

  return (
    <AppLayout onLogout={logout} currentPage={currentPage} setCurrentPage={changePage} profile={profile} theme={theme} userTheme={userTheme} onToggleTheme={toggleTheme}>
      <>
        {currentPage === 'dashboard' && (
          <Dashboard clients={clients} projects={projects} templates={templates} checklists={executedChecklists} onNavigate={changePage} onCreateClient={() => setIsCreateClientOpen(true)} />
        )}
        {currentPage === 'clients' && (
          <ClientsPage clients={clients} onCreateClient={() => setIsCreateClientOpen(true)} onEditClient={setEditingClient} onDeleteClient={deleteClient} onOpenClient={openClientDetail} />
        )}
        {currentPage === 'client-detail' && selectedClientId && (
          <ClientDetailPage clientId={selectedClientId} onBack={backToClients} />
        )}
        {currentPage === 'people' && (
          <PeoplePage profile={profile} pharmacies={clients} />
        )}
        {currentPage === 'users' && (profile?.role === 'owner' || profile?.role === 'admin') && (
          <UsersPage currentUser={profile} onUserUpdated={async (oldUser, newUser) => {
            await createActivityLog({ userId: session.user.id, entityType: 'profile', entityId: newUser.id, action: 'update', oldValue: oldUser, newValue: newUser })
          }} />
        )}
        {currentPage === 'projects' && (
          <ProjectsPage projects={projects} onCreateProject={() => setIsCreateProjectOpen(true)} onEditProject={setEditingProject} onDeleteProject={deleteProject} />
        )}
        {currentPage === 'tasks' && (<TasksPage profile={profile} />)}
        {currentPage === 'checklists' && (
          <ChecklistsPage templates={templates} executedChecklists={executedChecklists} onSelectTemplate={editTemplate} onEditTemplate={editTemplate} onCreateChecklist={() => setIsCreateChecklistOpen(true)} onCreateTemplate={() => setIsCreateTemplateOpen(true)} onDuplicateTemplate={duplicateTemplate} onDeleteTemplate={deleteTemplate} onDeleteChecklist={deleteChecklist} onOpenChecklist={openChecklist} />
        )}
        {currentPage === 'incidents' && (<IncidentsPage pharmacies={clients} projects={projects} profile={profile} />)}
        {currentPage === 'documents' && (<DocumentsPage profile={profile} />)}
        {currentPage === 'timeline' && (<TimelinePage profile={profile} />)}
        {currentPage === 'template-editor' && selectedTemplateId && (
          <TemplateEditorPage templateId={selectedTemplateId} onBack={backToChecklists} />
        )}
        {currentPage === 'checklist-execution' && selectedChecklistId && (
          <ChecklistExecutionPage checklistId={selectedChecklistId} currentUserId={session.user.id} onOpenReport={openChecklistReport} onBack={backToChecklists} />
        )}
        {currentPage === 'checklist-report' && selectedChecklistId && (
          <ChecklistReportPage checklistId={selectedChecklistId} onBack={() => setCurrentPage('checklist-execution')} onBackToList={backToChecklists} />
        )}
        {currentPage === 'audit' && (profile?.role === 'owner' || profile?.role === 'admin') && (<ActivityLogsPage />)}
        {currentPage === 'settings' && (profile?.role === 'owner' || profile?.role === 'admin') && (<SettingsPage />)}
      </>

      <CreateClientModal isOpen={isCreateClientOpen} onClose={() => setIsCreateClientOpen(false)} onCreate={createClient} />
      <EditClientModal isOpen={Boolean(editingClient)} client={editingClient} onClose={() => setEditingClient(null)} onSave={updateClient} />
      <CreateProjectModal isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} onCreate={createProject} clients={clients} />
      <EditProjectModal isOpen={Boolean(editingProject)} project={editingProject} clients={clients} onClose={() => setEditingProject(null)} onSave={updateProject} />
      <CreateChecklistModal isOpen={isCreateChecklistOpen} onClose={() => setIsCreateChecklistOpen(false)} onCreate={createChecklist} projects={projects} templates={templates} />
      <CreateTemplateModal isOpen={isCreateTemplateOpen} onClose={() => setIsCreateTemplateOpen(false)} onCreate={createTemplate} />
    </AppLayout>
  )
}
