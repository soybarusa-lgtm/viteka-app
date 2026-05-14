import { useEffect, useState } from 'react'

export default function EditClientModal({
  isOpen,
  client,
  onClose,
  onSave,
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (client) {
      setName(client.name || '')
      setEmail(client.email || '')
      setPhone(client.phone || '')
      setNotes(client.notes || '')
    }
  }, [client])

  if (!isOpen || !client) return null

  async function submit(e) {
    e.preventDefault()

    if (!name.trim()) {
      alert('El nombre del cliente es obligatorio.')
      return
    }

    setLoading(true)

    await onSave(client.id, {
      name,
      email,
      phone,
      notes,
    })

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-[#E2E8F0] bg-white shadow-xl">
        <div className="border-b border-[#E2E8F0] px-7 py-6">
          <h2 className="text-2xl font-black text-[#0F172A]">
            Editar cliente
          </h2>

          <p className="mt-2 text-sm font-semibold text-[#64748B]">
            Actualizar datos del cliente.
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
              Email
            </label>

            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-[#64748B]">
              Teléfono
            </label>

            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
            />
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
              className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}