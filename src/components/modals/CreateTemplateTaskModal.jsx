import { useState } from 'react'

export default function CreateTemplateTaskModal({ isOpen, onClose, onCreate, sectionTitle }) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [required,    setRequired]    = useState(false)
  const [loading,     setLoading]     = useState(false)

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) { alert('El nombre de la tarea es obligatorio.'); return }
    setLoading(true)
    await onCreate({ title, description, required })
    setLoading(false)
    setTitle(''); setDescription(''); setRequired(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E8EDF2] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Nueva tarea</h2>
            {sectionTitle
              ? <p className="text-[12px] text-[#94A3B8]">Sección: <span className="font-medium text-[#334155]">{sectionTitle}</span></p>
              : <p className="text-[12px] text-[#94A3B8]">Añade una tarea técnica</p>
            }
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Nombre de la tarea</span>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-2.5 text-[13px] outline-none focus:border-[#005643] focus:bg-white focus:ring-1 focus:ring-[#005643]/20"
              placeholder="Ej. Verificar cableado" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Descripción</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full resize-none rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-2.5 text-[13px] outline-none focus:border-[#005643] focus:bg-white focus:ring-1 focus:ring-[#005643]/20"
              placeholder="Instrucciones o detalles técnicos" />
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-3">
            <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} className="rounded" />
            <span className="text-[13px] text-[#334155]">Tarea obligatoria</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-[#E8EDF2] bg-white px-5 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="rounded-xl bg-[#005643] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#00442f] disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
