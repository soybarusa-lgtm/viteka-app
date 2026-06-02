import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useClientTickets } from '../../../hooks/useClientTickets'
import { SUPPORT_PRODUCTS, SUPPORT_TYPES } from '../../../lib/supportStatus'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export default function ClientNewTicketPage() {
  const navigate = useNavigate()
  const { profile, session } = useOutletContext()
  const { createTicket } = useClientTickets(profile)
  const [form, setForm] = useState({ subject: '', type: 'Incidencia', priority: 'bajo', product: 'Soporte Técnico - Viteka', description: '' })
  const [files, setFiles] = useState([])
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)

  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setFeedback('')
    if (!form.subject.trim() || !form.description.trim()) {
      setFeedback('Indique el asunto y describa la incidencia.')
      return
    }
    if (files.some(file => file.size > MAX_FILE_BYTES)) {
      setFeedback('Cada archivo adjunto debe ocupar menos de 10 MB.')
      return
    }
    setSending(true)
    try {
      const ticket = await createTicket({ ...form, files })
      navigate(`/cliente/soporte/tickets/${ticket.id}`)
    } catch (error) {
      setFeedback(`No se pudo enviar el ticket: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <Link to="/cliente/soporte/tickets" className="text-xs font-bold text-teal-700 hover:underline">Tickets</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-950">Enviar un ticket</h1>
        <p className="mt-1 text-sm text-slate-500">Cuanta más información incluya, antes podremos ayudarle.</p>
      </div>

      {feedback && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</p>}
      <form onSubmit={submit} className="card space-y-4 p-5">
        <div>
          <label className="label">Solicitante *</label>
          <input readOnly className="field bg-slate-50 text-slate-500" value={profile?.email || session?.user?.email || ''} />
        </div>
        <div>
          <label className="label">Asunto *</label>
          <input className="field" value={form.subject} onChange={event => update('subject', event.target.value)} placeholder="Resumen breve del problema" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tipo</label>
            <select className="field" value={form.type} onChange={event => update('type', event.target.value)}>{SUPPORT_TYPES.map(item => <option key={item}>{item}</option>)}</select>
          </div>
          <div>
            <label className="label">Prioridad</label>
            <select className="field" value={form.priority} onChange={event => update('priority', event.target.value)}>
              <option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option><option value="urgente">Urgente</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Producto</label>
          <select className="field" value={form.product} onChange={event => update('product', event.target.value)}>{SUPPORT_PRODUCTS.map(item => <option key={item}>{item}</option>)}</select>
        </div>
        <div>
          <label className="label">Descripción *</label>
          <textarea rows={7} className="field resize-y" value={form.description} onChange={event => update('description', event.target.value)} placeholder="Describa qué ocurre, desde cuándo y qué estaba intentando hacer." />
        </div>
        <div>
          <label className="label">Archivos adjuntos</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500 hover:border-teal-300 hover:bg-teal-50">
            <PaperClipIcon className="h-4 w-4" /> Seleccionar archivos
            <input type="file" multiple className="hidden" onChange={event => setFiles([...event.target.files])} />
          </label>
          {!!files.length && <p className="mt-2 text-xs text-slate-500">{files.map(file => file.name).join(' · ')}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Link to="/cliente/soporte/tickets" className="btn-ghost">Cancelar</Link>
          <button disabled={sending} className="btn-primary"><PaperAirplaneIcon className="h-4 w-4" /> {sending ? 'Enviando...' : 'Enviar ticket'}</button>
        </div>
      </form>
    </div>
  )
}
