import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { createActivityLog } from './lib/activityLogs'
import { createNotification } from './lib/notifications'

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

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [templates, setTemplates] = useState([])
  const [executedChecklists, setExecutedChecklists] = useState([])

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) {
      loadInitialData()
    }
  }, [session])

  async function loadInitialData() {
    const loadedProfile = await loadProfile()
    console.log('SESSION USER ID:', session?.user?.id)
console.log('SESSION EMAIL:', session?.user?.email)
    await Promise.all([
      loadClients(),
      loadProjects(loadedProfile),
      loadTemplates(),
      loadExecutedChecklists(loadedProfile),
    ])
  }

  async function loadProfile() {
  const userId = session?.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('loadProfile error:', error.message)
    setProfile({
      id: userId,
      full_name: session?.user?.email || 'Usuario',
      role: 'owner', // fallback temporal
      portal_type: 'internal',
    })
    return null
  }

  if (!data) {
    setProfile({
      id: userId,
      full_name: session?.user?.email || 'Usuario',
      role: 'owner', // fallback temporal
      portal_type: 'internal',
    })
    return null
  }

  setProfile(data)
  return data
}

  function isTechnician(userProfile = profile) {
    return userProfile?.role === 'technician'
  }

  async function login(e) {
    e.preventDefault()
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
    }
  }

  async function logout() {
    await supabase.auth.signOut()

    setProfile(null)
    setClients([])
    setProjects([])
    setTemplates([])
    setExecutedChecklists([])
    setSelectedChecklistId(null)
    setSelectedTemplateId(null)
    setSelectedClientId(null)
    setCurrentPage('dashboard')
  }

  async function loadClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setClients(data || [])
  }

  async function loadProjects(userProfile = profile) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        clients (
          id,
          name,
          pharmacy_name
        )
      `)
      .order('created_at', { ascending: false })

    if (isTechnician(userProfile)) {
      query = query.eq('assigned_technician_id', session.user.id)
    }

    const { data, error } = await query

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setProjects(data || [])
  }

  async function loadTemplates() {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setTemplates(data || [])
  }

  async function loadExecutedChecklists(userProfile = profile) {
    const { data, error } = await supabase
      .from('checklists')
      .select(`
        *,
        projects (
          id,
          name,
          assigned_technician_id,
          clients (
            id,
            name,
            pharmacy_name
          )
        ),
        checklist_sections (
          id,
          checklist_tasks (
            id,
            status
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    const visibleData = isTechnician(userProfile)
      ? (data || []).filter(
          checklist =>
            checklist.projects?.assigned_technician_id === session.user.id
        )
      : data || []

    const formatted = visibleData.map(checklist => {
      const allTasks =
        checklist.checklist_sections?.flatMap(
          section => section.checklist_tasks || []
        ) || []

      const total = allTasks.length

      const completed = allTasks.filter(
        task =>
          task.status === 'completed' ||
          task.status === 'not_applicable'
      ).length

      const blocked = allTasks.filter(
        task => task.status === 'blocked'
      ).length

      const pending = allTasks.filter(
        task =>
          task.status === 'pending' ||
          task.status === 'in_progress'
      ).length

      const progress =
        total > 0 ? Math.round((completed / total) * 100) : 0

      return {
        ...checklist,
        stats: {
          total,
          completed,
          blocked,
          pending,
          progress,
        },
      }
    })

    setExecutedChecklists(formatted)
  }

  async function createClient(clientData) {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        company_id: COMPANY_ID,
        name: clientData.name,
        pharmacy_name: clientData.pharmacy_name || clientData.name,
        pharmacist_owner: clientData.pharmacist_owner || '',
        province: clientData.province || '',
        city: clientData.city || '',
        postal_code: clientData.postal_code || '',
        contact_phone: clientData.contact_phone || clientData.phone || '',
        contact_email: clientData.contact_email || clientData.email || '',
        nif_cif: clientData.nif_cif || '',
        soe_number: clientData.soe_number || '',
        legal_type: clientData.legal_type || null,
        cb_holder_1_name: clientData.cb_holder_1_name || '',
        cb_holder_1_nif: clientData.cb_holder_1_nif || '',
        cb_holder_2_name: clientData.cb_holder_2_name || '',
        cb_holder_2_nif: clientData.cb_holder_2_nif || '',
        cb_cif: clientData.cb_cif || '',
        sl_company_name: clientData.sl_company_name || '',
        sl_cif: clientData.sl_cif || '',
        business_email: clientData.business_email || clientData.email || '',
        business_phone: clientData.business_phone || clientData.phone || '',
        address: clientData.address || '',
        collegiate_data: clientData.collegiate_data || '',
        company_data: clientData.company_data || '',
        operators: clientData.operators || '',
        cip: clientData.cip || '',
        observations: clientData.observations || clientData.notes || '',
        email: clientData.email || clientData.contact_email || '',
        phone: clientData.phone || clientData.contact_phone || '',
        notes: clientData.notes || clientData.observations || '',
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'client',
      entityId: data.id,
      action: 'create',
      newValue: data,
    })

    await createNotification({
      userId: session.user.id,
      title: 'Farmacia creada',
      message: `Se creó la farmacia "${data.pharmacy_name || data.name}".`,
      type: 'success',
      entityType: 'client',
      entityId: data.id,
    })

    setIsCreateClientOpen(false)
    await loadClients()
    setCurrentPage('clients')
  }

  async function updateClient(clientId, clientData) {
    const previous = clients.find(client => client.id === clientId)

    const { data, error } = await supabase
      .from('clients')
      .update({
        name: clientData.name,
        pharmacy_name: clientData.pharmacy_name || clientData.name,
        pharmacist_owner: clientData.pharmacist_owner || '',
        province: clientData.province || '',
        city: clientData.city || '',
        postal_code: clientData.postal_code || '',
        contact_phone: clientData.contact_phone || clientData.phone || '',
        contact_email: clientData.contact_email || clientData.email || '',
        nif_cif: clientData.nif_cif || '',
        soe_number: clientData.soe_number || '',
        legal_type: clientData.legal_type || null,
        cb_holder_1_name: clientData.cb_holder_1_name || '',
        cb_holder_1_nif: clientData.cb_holder_1_nif || '',
        cb_holder_2_name: clientData.cb_holder_2_name || '',
        cb_holder_2_nif: clientData.cb_holder_2_nif || '',
        cb_cif: clientData.cb_cif || '',
        sl_company_name: clientData.sl_company_name || '',
        sl_cif: clientData.sl_cif || '',
        business_email: clientData.business_email || clientData.email || '',
        business_phone: clientData.business_phone || clientData.phone || '',
        address: clientData.address || '',
        collegiate_data: clientData.collegiate_data || '',
        company_data: clientData.company_data || '',
        operators: clientData.operators || '',
        cip: clientData.cip || '',
        observations: clientData.observations || clientData.notes || '',
        email: clientData.email || clientData.contact_email || '',
        phone: clientData.phone || clientData.contact_phone || '',
        notes: clientData.notes || clientData.observations || '',
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'client',
      entityId: clientId,
      action: 'update',
      oldValue: previous,
      newValue: data,
    })

    setEditingClient(null)
    await loadClients()
  }

  async function deleteClient(clientId) {
    const confirmed = window.confirm('¿Eliminar esta farmacia?')
    if (!confirmed) return

    const previous = clients.find(client => client.id === clientId)

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'client',
      entityId: clientId,
      action: 'delete',
      oldValue: previous,
    })

    await loadClients()
  }

  async function createProject(projectData) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        company_id: COMPANY_ID,
        client_id: projectData.client_id,
        assigned_technician_id: session.user.id,
        name: projectData.name,
        status: 'active',
        notes: projectData.notes || '',
        visible_to_client: projectData.visible_to_client || false,
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'project',
      entityId: data.id,
      action: 'create',
      newValue: data,
    })

    await createNotification({
      userId: session.user.id,
      title: 'Proyecto creado',
      message: `Se creó el proyecto "${projectData.name}".`,
      type: 'success',
      entityType: 'project',
      entityId: data.id,
    })

    setIsCreateProjectOpen(false)
    await loadProjects()
    setCurrentPage('projects')
  }

  async function updateProject(projectId, projectData) {
    const previous = projects.find(project => project.id === projectId)

    const { data, error } = await supabase
      .from('projects')
      .update({
        name: projectData.name,
        client_id: projectData.client_id,
        status: projectData.status || 'active',
        notes: projectData.notes || '',
        visible_to_client: projectData.visible_to_client || false,
      })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'project',
      entityId: projectId,
      action: 'update',
      oldValue: previous,
      newValue: data,
    })

    setEditingProject(null)
    await loadProjects()
  }

  async function deleteProject(projectId) {
    const confirmed = window.confirm('¿Eliminar este proyecto?')
    if (!confirmed) return

    const previous = projects.find(project => project.id === projectId)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'project',
      entityId: projectId,
      action: 'delete',
      oldValue: previous,
    })

    await loadProjects()
  }

  async function createTemplate(templateData) {
    const { data, error } = await supabase
      .from('checklist_templates')
      .insert({
        company_id: COMPANY_ID,
        name: templateData.name,
        description: templateData.description || '',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'template',
      entityId: data.id,
      action: 'create',
      newValue: data,
    })

    setIsCreateTemplateOpen(false)
    await loadTemplates()

    setSelectedTemplateId(data.id)
    setCurrentPage('template-editor')
  }

  async function duplicateTemplate(templateId) {
    const original = templates.find(template => template.id === templateId)

    if (!original) {
      alert('No se encontró la plantilla.')
      return
    }

    const { data: newTemplate, error: templateError } = await supabase
      .from('checklist_templates')
      .insert({
        company_id: COMPANY_ID,
        name: `${original.name} - copia`,
        description: original.description || '',
        is_active: true,
      })
      .select()
      .single()

    if (templateError) {
      alert(templateError.message)
      return
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('checklist_template_sections')
      .select('*')
      .eq('template_id', templateId)
      .order('position', { ascending: true })

    if (sectionsError) {
      alert(sectionsError.message)
      return
    }

    for (const section of sections || []) {
      const { data: newSection, error: newSectionError } = await supabase
        .from('checklist_template_sections')
        .insert({
          template_id: newTemplate.id,
          title: section.title,
          position: section.position,
        })
        .select()
        .single()

      if (newSectionError) {
        alert(newSectionError.message)
        return
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('checklist_template_tasks')
        .select('*')
        .eq('section_id', section.id)
        .order('position', { ascending: true })

      if (tasksError) {
        alert(tasksError.message)
        return
      }

      const newTasks = (tasks || []).map(task => ({
        section_id: newSection.id,
        title: task.title,
        description: task.description || '',
        required: task.required,
        position: task.position,
      }))

      if (newTasks.length > 0) {
        const { error: insertTasksError } = await supabase
          .from('checklist_template_tasks')
          .insert(newTasks)

        if (insertTasksError) {
          alert(insertTasksError.message)
          return
        }
      }
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'template',
      entityId: newTemplate.id,
      action: 'duplicate',
      oldValue: original,
      newValue: newTemplate,
    })

    await loadTemplates()
    setSelectedTemplateId(newTemplate.id)
    setCurrentPage('template-editor')
  }

  async function deleteTemplate(templateId) {
    const confirmed = window.confirm(
      '¿Eliminar esta plantilla y todas sus secciones/tareas?'
    )

    if (!confirmed) return

    const previous = templates.find(template => template.id === templateId)

    const { data: sections, error: sectionsError } = await supabase
      .from('checklist_template_sections')
      .select('id')
      .eq('template_id', templateId)

    if (sectionsError) {
      alert(sectionsError.message)
      return
    }

    const sectionIds = (sections || []).map(section => section.id)

    if (sectionIds.length > 0) {
      const { error: tasksError } = await supabase
        .from('checklist_template_tasks')
        .delete()
        .in('section_id', sectionIds)

      if (tasksError) {
        alert(tasksError.message)
        return
      }
    }

    await supabase
      .from('checklist_template_sections')
      .delete()
      .eq('template_id', templateId)

    const { error: deleteTemplateError } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', templateId)

    if (deleteTemplateError) {
      alert(deleteTemplateError.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'template',
      entityId: templateId,
      action: 'delete',
      oldValue: previous,
    })

    await loadTemplates()
  }

  async function createChecklist(checklistData) {
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .insert({
        project_id: checklistData.project_id,
        template_id: checklistData.template_id,
        title: checklistData.title,
        status: 'in_progress',
        visible_to_client: checklistData.visible_to_client || false,
      })
      .select()
      .single()

    if (checklistError) {
      alert(checklistError.message)
      return
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('checklist_template_sections')
      .select('*')
      .eq('template_id', checklistData.template_id)
      .order('position', { ascending: true })

    if (sectionsError) {
      alert(sectionsError.message)
      return
    }

    for (const section of sections || []) {
      const { data: newSection, error: newSectionError } = await supabase
        .from('checklist_sections')
        .insert({
          checklist_id: checklist.id,
          title: section.title,
          position: section.position,
        })
        .select()
        .single()

      if (newSectionError) {
        alert(newSectionError.message)
        return
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('checklist_template_tasks')
        .select('*')
        .eq('section_id', section.id)
        .order('position', { ascending: true })

      if (tasksError) {
        alert(tasksError.message)
        return
      }

      const tasksToInsert = (tasks || []).map(task => ({
        section_id: newSection.id,
        title: task.title,
        description: task.description || '',
        position: task.position,
        required: task.required,
        status: 'pending',
      }))

      if (tasksToInsert.length > 0) {
        const { error: insertTasksError } = await supabase
          .from('checklist_tasks')
          .insert(tasksToInsert)

        if (insertTasksError) {
          alert(insertTasksError.message)
          return
        }
      }
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'checklist',
      entityId: checklist.id,
      action: 'create',
      newValue: checklist,
    })

    await createNotification({
      userId: session.user.id,
      title: 'Checklist creado',
      message: `Se creó el checklist "${checklistData.title}".`,
      type: 'success',
      entityType: 'checklist',
      entityId: checklist.id,
    })

    setIsCreateChecklistOpen(false)
    await loadExecutedChecklists()

    setSelectedChecklistId(checklist.id)
    setCurrentPage('checklist-execution')
  }

  async function deleteChecklist(checklistId) {
    const confirmed = window.confirm(
      '¿Eliminar esta ejecución de checklist?'
    )

    if (!confirmed) return

    const previous = executedChecklists.find(
      checklist => checklist.id === checklistId
    )

    const { data: sections, error: sectionsError } = await supabase
      .from('checklist_sections')
      .select('id')
      .eq('checklist_id', checklistId)

    if (sectionsError) {
      alert(sectionsError.message)
      return
    }

    const sectionIds = (sections || []).map(section => section.id)

    if (sectionIds.length > 0) {
      const { data: tasks, error: tasksError } = await supabase
        .from('checklist_tasks')
        .select('id')
        .in('section_id', sectionIds)

      if (tasksError) {
        alert(tasksError.message)
        return
      }

      const taskIds = (tasks || []).map(task => task.id)

      if (taskIds.length > 0) {
        await supabase
          .from('task_evidence')
          .delete()
          .in('task_id', taskIds)

        await supabase
          .from('checklist_tasks')
          .delete()
          .in('id', taskIds)
      }

      await supabase
        .from('checklist_sections')
        .delete()
        .in('id', sectionIds)
    }

    const { error: deleteChecklistError } = await supabase
      .from('checklists')
      .delete()
      .eq('id', checklistId)

    if (deleteChecklistError) {
      alert(deleteChecklistError.message)
      return
    }

    await createActivityLog({
      userId: session.user.id,
      entityType: 'checklist',
      entityId: checklistId,
      action: 'delete',
      oldValue: previous,
    })

    await loadExecutedChecklists()
  }

  function openClientDetail(clientId) {
    setSelectedClientId(clientId)
    setCurrentPage('client-detail')
  }

  function backToClients() {
    setSelectedClientId(null)
    setCurrentPage('clients')
  }

  function openChecklist(checklistId) {
    setSelectedChecklistId(checklistId)
    setCurrentPage('checklist-execution')
  }

  function openChecklistReport() {
    setCurrentPage('checklist-report')
  }

  async function backToChecklists() {
    await loadExecutedChecklists()
    await loadTemplates()
    setCurrentPage('checklists')
  }

  function editTemplate(templateId) {
    setSelectedTemplateId(templateId)
    setCurrentPage('template-editor')
  }

  function changePage(page) {
  if (
    page === 'audit' &&
    profile?.role !== 'owner' &&
    profile?.role !== 'admin'
  ) {
    setCurrentPage('dashboard')
    return
  }

  if (
    page === 'settings' &&
    profile?.role !== 'owner' &&
    profile?.role !== 'admin'
  ) {
    setCurrentPage('dashboard')
    return
  }

  if (
  page === 'users' &&
  profile?.role !== 'owner' &&
  profile?.role !== 'admin'
) {
  setCurrentPage('dashboard')
  return
}

  setSelectedClientId(null)
  setCurrentPage(page)
}

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] shadow-sm p-8">
          <h1 className="text-3xl tracking-tight text-[#005643] font-medium">
            Viteka
          </h1>

          <p className="mt-2 text-[#64748B] font-normal">
            Acceso portal de soporte técnico
          </p>

          <form onSubmit={login} className="mt-8 space-y-4">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="Email"
            />

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="Contraseña"
            />

            <button
              type="submit"
              className="btn-primary w-full"
            >
              Entrar
            </button>
          </form>

          {errorMsg && (
            <p className="mt-4 text-red-600 font-normal">
              {errorMsg}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (profile?.portal_type === 'client') {
    return (
      <ClientLayout
        onLogout={logout}
        currentPage={currentPage}
        setCurrentPage={changePage}
        profile={profile}
      >
        <ClientPortalPage currentPage={currentPage} />
      </ClientLayout>
    )
  }

  return (
    <AppLayout
      onLogout={logout}
      currentPage={currentPage}
      setCurrentPage={changePage}
      profile={profile}
    >
      <>
        {currentPage === 'dashboard' && (
          <Dashboard
            clients={clients}
            projects={projects}
            templates={templates}
            checklists={executedChecklists}
          />
        )}

        {currentPage === 'clients' && (
          <ClientsPage
            clients={clients}
            onCreateClient={() => setIsCreateClientOpen(true)}
            onEditClient={setEditingClient}
            onDeleteClient={deleteClient}
            onOpenClient={openClientDetail}
          />
        )}

        {currentPage === 'client-detail' && selectedClientId && (
          <ClientDetailPage
            clientId={selectedClientId}
            onBack={backToClients}
          />
        )}

        {currentPage === 'people' && (
          <PeoplePage pharmacies={clients} />
        )}

        {currentPage === 'users' &&
  (profile?.role === 'owner' || profile?.role === 'admin') && (
    <UsersPage
  currentUser={profile}
  onUserUpdated={async (oldUser, newUser) => {
    await createActivityLog({
      userId: session.user.id,
      entityType: 'profile',
      entityId: newUser.id,
      action: 'update',
      oldValue: oldUser,
      newValue: newUser,
    })
  }}
/>
  )}

        {currentPage === 'projects' && (
          <ProjectsPage
            projects={projects}
            onCreateProject={() => setIsCreateProjectOpen(true)}
            onEditProject={setEditingProject}
            onDeleteProject={deleteProject}
          />
        )}

        {currentPage === 'tasks' && (
          <TasksPage />
        )}

        {currentPage === 'checklists' && (
          <ChecklistsPage
            templates={templates}
            executedChecklists={executedChecklists}
            onSelectTemplate={editTemplate}
            onEditTemplate={editTemplate}
            onCreateChecklist={() => setIsCreateChecklistOpen(true)}
            onCreateTemplate={() => setIsCreateTemplateOpen(true)}
            onDuplicateTemplate={duplicateTemplate}
            onDeleteTemplate={deleteTemplate}
            onDeleteChecklist={deleteChecklist}
            onOpenChecklist={openChecklist}
          />
        )}

        {currentPage === 'incidents' && (
          <IncidentsPage
            pharmacies={clients}
            projects={projects}
            profile={profile}
          />
        )}

        {currentPage === 'documents' && (
          <DocumentsPage profile={profile} />
        )}

        {currentPage === 'timeline' && (
          <TimelinePage />
        )}

        {currentPage === 'template-editor' && selectedTemplateId && (
          <TemplateEditorPage
            templateId={selectedTemplateId}
            onBack={backToChecklists}
          />
        )}

        {currentPage === 'checklist-execution' && selectedChecklistId && (
          <ChecklistExecutionPage
            checklistId={selectedChecklistId}
            currentUserId={session.user.id}
            onOpenReport={openChecklistReport}
            onBack={backToChecklists}
          />
        )}

        {currentPage === 'checklist-report' && selectedChecklistId && (
          <ChecklistReportPage
            checklistId={selectedChecklistId}
            onBack={() => setCurrentPage('checklist-execution')}
            onBackToList={backToChecklists}
          />
        )}

        {currentPage === 'audit' &&
          (profile?.role === 'owner' ||
            profile?.role === 'admin') && (
            <ActivityLogsPage />
          )}

        {currentPage === 'settings' &&
          (profile?.role === 'owner' ||
            profile?.role === 'admin') && (
            <SettingsPage />
          )}
      </>

      <CreateClientModal
        isOpen={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        onCreate={createClient}
      />

      <EditClientModal
        isOpen={Boolean(editingClient)}
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSave={updateClient}
      />

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreate={createProject}
        clients={clients}
      />

      <EditProjectModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        clients={clients}
        onClose={() => setEditingProject(null)}
        onSave={updateProject}
      />

      <CreateChecklistModal
        isOpen={isCreateChecklistOpen}
        onClose={() => setIsCreateChecklistOpen(false)}
        onCreate={createChecklist}
        projects={projects}
        templates={templates}
      />

      <CreateTemplateModal
        isOpen={isCreateTemplateOpen}
        onClose={() => setIsCreateTemplateOpen(false)}
        onCreate={createTemplate}
      />
    </AppLayout>
  )
}