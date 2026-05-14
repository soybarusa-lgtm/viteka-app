import { useEffect, useState } from 'react'

export default function EditProjectModal({
  isOpen,
  project,
  clients = [],
  onClose,
  onSave,
}) {
  const [name, setName] = useState('')
  const [clientId, setClientId] = useState('')
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name || '')
      setClientId(project.client_id || '')
      setStatus(project.status || 'active')
      setNotes(project.notes || '')
    }
  }, [project])

  if (!isOpen || !project) return null

  async function submit(e) {
    e.preventDefault()

    setLoading(true)

    await onSave(project.id, {
      name,
      client_id: clientId,
      status,
      notes,
    })

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-[#E2E8F0] bg-white shadow-xl">
        <div className="border-b border-[#E2E8F0] px-7 py-6">
          <h2 className="text-2xl font-black text-[#0F172A]">
            Editar proyecto
          </h2>

          <p className="mt-2 text-sm font-semibold text-[#64748B]">
            Modificar información del proyecto.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 p-7">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Nombre
            </label>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Cliente
            </label>

            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-black outline-none focus:border-[#005643]"
            >
              {clients.map(client => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Estado
            </label>

            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-black outline-none focus:border-[#005643]"
            >
              <option value="draft">En revisión</option>
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Notas
            </label>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-[140px] w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
            />
          </div>

          <div className="flex justify-end gap-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 text-sm font-black text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}