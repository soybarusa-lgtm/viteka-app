import { useEffect, useState } from 'react'

export default function CreateTemplateSectionModal({ isOpen, onClose, onCreate }) {
  const [title,   setTitle]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) { alert('El nombre de la secci\u00f3n es obligatorio.'); return }
    setLoading(true)
    await onCreate({ title })
    setLoading(false)
    setTitle('')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-md rounded-2xl border border-[#E8EDF2] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Nueva secci\u00f3n</h2>
            <p className="text-[12px] text-[#94A3B8]">A\u00f1ade una secci\u00f3n a la plantilla</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition">
            \u2715
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Nombre de la secci\u00f3n</span>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full rounded-xl border border-[#E8EDF2] bg-[#F8FAFC] px-4 py-2.5 text-[13px] outline-none focus:border-[#005643] focus:bg-white focus:ring-1 focus:ring-[#005643]/20"
              placeholder="Ej. Instalaci\u00f3n, Verificaci\u00f3n, Entrega..." />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-[#E8EDF2] bg-white px-5 py-2.5 text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC]">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="rounded-xl bg-[#005643] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#00442f] disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear secci\u00f3n'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
