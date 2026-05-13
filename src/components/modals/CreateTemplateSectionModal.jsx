import { useState } from 'react'

export default function CreateTemplateSectionModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()

    if (!title.trim()) {
      alert('El nombre de la sección es obligatorio.')
      return
    }

    setLoading(true)

    await onCreate({
      title,
    })

    setLoading(false)
    setTitle('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE7E1] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DCE7E1] px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold">
              Nueva sección
            </h2>

            <p className="mt-1 text-sm text-[#8AAA96] font-medium">
              Añade una sección a la plantilla.
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
              Nombre de la sección
            </label>

            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="Ej. Instalación, Verificación, Entrega..."
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
              {loading ? 'Creando...' : 'Crear sección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}