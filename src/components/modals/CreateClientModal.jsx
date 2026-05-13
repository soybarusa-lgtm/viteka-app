import { useState } from 'react'

export default function CreateClientModal({
  isOpen,
  onClose,
  onCreate
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  if (!isOpen) return null

  function submit(e) {
    e.preventDefault()

    if (!name.trim()) {
      alert('El nombre del cliente es obligatorio.')
      return
    }

    onCreate({
      name,
      email,
      phone,
    })

    setName('')
    setEmail('')
    setPhone('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-[#DCE7E1] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DCE7E1] px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold">
              Nuevo cliente
            </h2>

            <p className="mt-1 text-sm text-[#8AAA96] font-medium">
              Añade un cliente a la plataforma.
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
              Nombre
            </label>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Email
            </label>

            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="cliente@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4A6B58] mb-2">
              Teléfono
            </label>

            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
              placeholder="+34 600 000 000"
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
              className="rounded-xl bg-[#005643] px-5 py-3 text-white font-bold hover:bg-[#0E7A60]"
            >
              Crear cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}