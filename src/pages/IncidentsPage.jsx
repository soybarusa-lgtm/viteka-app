import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

export default function IncidentsPage({ pharmacies = [], projects = [], profile }) {
  const [incidents, setIncidents] = useState([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const [pharmacyId, setPharmacyId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [visibleToClient, setVisibleToClient] = useState(false)

  useEffect(() => {
    loadIncidents()
  }, [])

  async function loadIncidents() {
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        clients (
          id,
          name,
          pharmacy_name
        ),
        projects (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setIncidents(data || [])
  }

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const text = [
        incident.title,
        incident.description,
        incident.status,
        incident.priority,
        incident.clients?.name,
        incident.clients?.pharmacy_name,
        incident.projects?.name,
      ]
        .join(' ')
        .toLowerCase()

      return text.includes(search.toLowerCase())
    })
  }, [incidents, search])

  async function createIncident(e) {
    e.preventDefault()

    if (!title.trim()) {
      alert('El título es obligatorio.')
      return
    }

    const { error } = await supabase
      .from('incidents')
      .insert({
        company_id: COMPANY_ID,
        pharmacy_id: pharmacyId || null,
        project_id: projectId || null,
        title,
        description,
        priority,
        status: 'open',
        visible_to_client: visibleToClient,
        created_by: profile?.id || null,
      })

    if (error) {
      alert(error.message)
      return
    }

    setTitle('')
    setDescription('')
    setPharmacyId('')
    setProjectId('')
    setPriority('medium')
    setVisibleToClient(false)
    setFormOpen(false)

    await loadIncidents()
  }

  async function updateIncidentStatus(incidentId, status) {
    const { error } = await supabase
      .from('incidents')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', incidentId)

    if (error) {
      alert(error.message)
      return
    }

    await loadIncidents()
  }

  async function deleteIncident(incidentId) {
    const confirmed = window.confirm('¿Eliminar incidencia?')
    if (!confirmed) return

    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', incidentId)

    if (error) {
      alert(error.message)
      return
    }

    await loadIncidents()
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
            Incidencias
          </h1>

          <p className="mt-3 text-base text-[#64748B]">
            Mantenimiento, auditorías, soporte y problemas operativos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(!formOpen)}
          className="rounded-2xl bg-[#005643] px-6 py-4 text-sm text-white shadow-sm"
        >
          + Nueva incidencia
        </button>
      </div>

      {formOpen && (
        <form onSubmit={createIncident} className="mb-8 rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Field label="Farmacia">
              <select value={pharmacyId} onChange={e => setPharmacyId(e.target.value)} className="input">
                <option value="">Sin farmacia</option>
                {pharmacies.map(pharmacy => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.pharmacy_name || pharmacy.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Proyecto">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input">
                <option value="">Sin proyecto</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Título">
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" />
            </Field>

            <Field label="Prioridad">
              <select value={priority} onChange={e => setPriority(e.target.value)} className="input">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Descripción">
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[140px]" />
            </Field>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm text-[#334155]">
            <input
              type="checkbox"
              checked={visibleToClient}
              onChange={e => setVisibleToClient(e.target.checked)}
            />
            Visible al cliente
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">
              Cancelar
            </button>

            <button type="submit" className="btn-primary">
              Crear incidencia
            </button>
          </div>
        </form>
      )}

      <div className="mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar incidencia..."
          className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm outline-none"
        />
      </div>

      <div className="space-y-5">
        {filteredIncidents.map(incident => (
          <div key={incident.id} className="rounded-[28px] border border-[#E2E8F0] bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap gap-3">
                  <Badge>{incident.status}</Badge>
                  <Badge>{incident.priority}</Badge>
                  {incident.visible_to_client && <Badge>Cliente</Badge>}
                </div>

                <h2 className="mt-4 text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
                  {incident.title}
                </h2>

                <p className="mt-2 text-sm text-[#64748B]">
                  {incident.clients?.pharmacy_name || incident.clients?.name || 'Sin farmacia'} · {incident.projects?.name || 'Sin proyecto'}
                </p>

                <p className="mt-4 text-sm leading-7 text-[#64748B]">
                  {incident.description || 'Sin descripción'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={incident.status}
                  onChange={e => updateIncidentStatus(incident.id, e.target.value)}
                  className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm"
                >
                  <option value="open">Abierta</option>
                  <option value="in_progress">En curso</option>
                  <option value="resolved">Resuelta</option>
                  <option value="closed">Cerrada</option>
                </select>

                <button
                  type="button"
                  onClick={() => deleteIncident(incident.id)}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-wide text-[#64748B] font-medium">
        {label}
      </span>
      {children}
    </label>
  )
}

function Badge({ children }) {
  return (
    <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs text-[#334155]">
      {children}
    </span>
  )
}