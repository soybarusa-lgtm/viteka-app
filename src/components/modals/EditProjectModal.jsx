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

    if (!name.trim()) {
      alert('El nombre del proyecto es obligatorio.')
      return
    }

    if (!clientId) {
      alert('Selecciona un cliente.')
      return
    }

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
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE7E1] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DCE7E1] px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold">
              Editar proyecto
            </h2>

            <p className="mt-1 text-sm text-[#8AAA96] font-medium">
              Actualiza cliente, estado y notas del proyecto.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 font-bold text-[#4A6B58] hover:bg-[#F5FAF6]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Nombre
            </label>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="Nombre del proyecto"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Cliente
            </label>

            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
            >
              <option value="">Seleccionar cliente</option>

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
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Estado
            </label>

            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Notas
            </label>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="min-h-24 w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="Notas internas del proyecto"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#DCE7E1] px-5 py-3 font-bold hover:bg-[#F5FAF6]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#005643] px-5 py-3 text-white font-bold hover:bg-[#0E7A60] disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}