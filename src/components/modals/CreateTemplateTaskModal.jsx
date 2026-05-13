import { useState } from 'react'

export default function CreateTemplateTaskModal({
  isOpen,
  onClose,
  onCreate,
  sectionTitle,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [required, setRequired] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()

    if (!title.trim()) {
      alert('El nombre de la tarea es obligatorio.')
      return
    }

    setLoading(true)

    await onCreate({
      title,
      description,
      required,
    })

    setLoading(false)
    setTitle('')
    setDescription('')
    setRequired(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE7E1] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DCE7E1] px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold">
              Nueva tarea
            </h2>

            <p className="mt-1 text-sm text-[#8AAA96] font-medium">
              {sectionTitle ? `Sección: ${sectionTitle}` : 'Añade una tarea técnica.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 font-bold text-[#4A6B58] hover:bg-[#F5FAF6]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Nombre de la tarea
            </label>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="Ej. Verificar cableado"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Descripción
            </label>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-28 w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="Instrucciones o detalles técnicos"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-[#DCE7E1] p-4 font-bold text-[#4A6B58]">
            <input
              type="checkbox"
              checked={required}
              onChange={e => setRequired(e.target.checked)}
              className="h-5 w-5"
            />

            Tarea obligatoria
          </label>

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
              {loading ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}