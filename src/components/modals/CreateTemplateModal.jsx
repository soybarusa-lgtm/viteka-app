import { useState } from 'react'

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()

    if (!name.trim()) {
      alert('El nombre de la plantilla es obligatorio.')
      return
    }

    setLoading(true)

    await onCreate({
      name,
      description,
    })

    setLoading(false)

    setName('')
    setDescription('')
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-[#E2E8F0] bg-white shadow-xl">
        <div className="border-b border-[#E2E8F0] px-7 py-6">
          <h2 className="text-2xl font-black text-[#0F172A]">
            Nueva plantilla
          </h2>

          <p className="mt-2 text-sm font-semibold text-[#64748B]">
            Crea una plantilla base para futuras ejecuciones.
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
              placeholder="Plantilla revisión técnica..."
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Descripción
            </label>

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[140px] w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
              placeholder="Descripción de uso de esta plantilla..."
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
              className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}