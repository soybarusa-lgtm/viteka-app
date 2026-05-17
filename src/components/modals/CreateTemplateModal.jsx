import { useState } from 'react'

export default function CreateTemplateModal({ isOpen, onClose, onCreate }) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) { alert('El nombre es obligatorio.'); return }
    setLoading(true)
    await onCreate({ name, description })
    setLoading(false)
    setName(''); setDescription('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Nueva plantilla</h2>
            <p className="text-[12px] text-[#94A3B8]">Crea una plantilla de checklist reutilizable</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Nombre</span>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-2.5 text-[13px] outline-none focus:border-[#005643] focus:bg-white focus:ring-1 focus:ring-[#005643]/20"
              placeholder="Inspección mensual..." />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Descripción</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-2.5 text-[13px] outline-none focus:border-[#005643] focus:bg-white focus:ring-1 focus:ring-[#005643]/20"
              placeholder="Breve descripción del uso de la plantilla" />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-[#E8EDF2] bg-white px-5 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="rounded-xl bg-[#005643] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#00442f] disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
