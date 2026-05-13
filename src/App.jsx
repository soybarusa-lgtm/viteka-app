import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import AppLayout from './layouts/AppLayout'

import Dashboard from './pages/Dashboard'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ChecklistsPage from './pages/ChecklistsPage'
import ChecklistExecutionPage from './pages/ChecklistExecutionPage'
import ChecklistReportPage from './pages/ChecklistReportPage'
import TemplateEditorPage from './pages/TemplateEditorPage'

import CreateClientModal from './components/modals/CreateClientModal'
import EditClientModal from './components/modals/EditClientModal'
import CreateProjectModal from './components/modals/CreateProjectModal'
import EditProjectModal from './components/modals/EditProjectModal'
import CreateChecklistModal from './components/modals/CreateChecklistModal'
import CreateTemplateModal from './components/modals/CreateTemplateModal'

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

export default function App() {
  const [session, setSession] = useState(null)

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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      loadClients()
      loadProjects()
      loadTemplates()
      loadExecutedChecklists()
    }
  }, [session])

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

    setClients([])
    setProjects([])
    setTemplates([])
    setExecutedChecklists([])
    setSelectedChecklistId(null)
    setSelectedTemplateId(null)
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

  async function loadProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients (
          name
        )
      `)
      .order('created_at', { ascending: false })

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

  async function loadExecutedChecklists() {
    const { data, error } = await supabase
      .from('checklists')
      .select(`
        *,
        projects (
          name,
          clients (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setExecutedChecklists(data || [])
  }

  async function createClient(clientData) {
    const { error } = await supabase
      .from('clients')
      .insert({
        company_id: COMPANY_ID,
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        notes: clientData.notes || '',
      })

    if (error) {
      alert(error.message)
      return
    }

    setIsCreateClientOpen(false)
    await loadClients()
    setCurrentPage('clients')
  }

  async function updateClient(clientId, clientData) {
    const { error } = await supabase
      .from('clients')
      .update({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        notes: clientData.notes || '',
      })
      .eq('id', clientId)

    if (error) {
      alert(error.message)
      return
    }

    setEditingClient(null)
    await loadClients()
  }

  async function deleteClient(clientId) {
    const confirmed = window.confirm(
      '¿Eliminar este cliente? Solo funcionará si no tiene proyectos asociados.'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (error) {
      alert(error.message)
      return
    }

    await loadClients()
  }

  async function createProject(projectData) {
    const { error } = await supabase
      .from('projects')
      .insert({
        company_id: COMPANY_ID,
        client_id: projectData.client_id,
        assigned_technician_id: session.user.id,
        name: projectData.name,
        status: 'active',
        notes: projectData.notes,
      })

    if (error) {
      alert(error.message)
      return
    }

    setIsCreateProjectOpen(false)
    await loadProjects()
    setCurrentPage('projects')
  }

  async function updateProject(projectId, projectData) {
    const { error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)

    if (error) {
      alert(error.message)
      return
    }

    setEditingProject(null)
    await loadProjects()
  }

  async function deleteProject(projectId) {
    const confirmed = window.confirm(
      '¿Eliminar este proyecto? Solo funcionará si no tiene checklists asociados.'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      alert(error.message)
      return
    }

    await loadProjects()
  }

  async function createTemplate(templateData) {
    const { data, error } = await supabase
      .from('checklist_templates')
      .insert({
        company_id: COMPANY_ID,
        name: templateData.name,
        description: templateData.description,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

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
        description: original.description,
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
        description: task.description,
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

    await loadTemplates()
    setSelectedTemplateId(newTemplate.id)
    setCurrentPage('template-editor')
  }

  async function deleteTemplate(templateId) {
    const confirmed = window.confirm(
      '¿Eliminar esta plantilla y todas sus secciones/tareas?'
    )

    if (!confirmed) return

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

    const { error: deleteSectionsError } = await supabase
      .from('checklist_template_sections')
      .delete()
      .eq('template_id', templateId)

    if (deleteSectionsError) {
      alert(deleteSectionsError.message)
      return
    }

    const { error: deleteTemplateError } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', templateId)

    if (deleteTemplateError) {
      alert(deleteTemplateError.message)
      return
    }

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
        description: task.description,
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

    await loadExecutedChecklists()
  }

  function openChecklist(checklistId) {
    setSelectedChecklistId(checklistId)
    setCurrentPage('checklist-execution')
  }

  function openChecklistReport() {
    setCurrentPage('checklist-report')
  }

  function backToChecklists() {
    loadExecutedChecklists()
    loadTemplates()
    setCurrentPage('checklists')
  }

  function editTemplate(templateId) {
    setSelectedTemplateId(templateId)
    setCurrentPage('template-editor')
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#EEF4F0] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-[#DCE7E1] shadow-sm p-8">
          <h1 className="text-3xl font-extrabold text-[#005643]">
            Viteka
          </h1>

          <p className="mt-2 text-[#8AAA96] font-medium">
            Acceso plataforma técnica
          </p>

          <form onSubmit={login} className="mt-8 space-y-4">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3"
              placeholder="Email"
            />

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3"
              placeholder="Contraseña"
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-[#005643] py-3 font-bold text-white"
            >
              Entrar
            </button>
          </form>

          {errorMsg && (
            <p className="mt-4 text-red-600 font-semibold">
              {errorMsg}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <AppLayout
      onLogout={logout}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
    >
      <>
        {currentPage === 'dashboard' && (
          <Dashboard
            clients={clients}
            projects={projects}
            templates={templates}
          />
        )}

        {currentPage === 'clients' && (
          <ClientsPage
            clients={clients}
            onCreateClient={() => setIsCreateClientOpen(true)}
            onEditClient={setEditingClient}
            onDeleteClient={deleteClient}
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

        {currentPage === 'template-editor' && selectedTemplateId && (
          <TemplateEditorPage
            templateId={selectedTemplateId}
            onBack={backToChecklists}
          />
        )}

        {currentPage === 'checklist-execution' && selectedChecklistId && (
          <ChecklistExecutionPage
            checklistId={selectedChecklistId}
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