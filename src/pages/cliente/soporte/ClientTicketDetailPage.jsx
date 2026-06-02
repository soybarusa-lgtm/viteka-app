import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import TicketConversation from '../../../components/soporte/interno/TicketConversation'
import { TicketPriorityBadge, TicketStatusBadge } from '../../../components/soporte/shared/SupportBadges'
import { useClientTickets } from '../../../hooks/useClientTickets'
import { formatSupportDate } from '../../../lib/supportFormatters'
import { formatTicketNumber } from '../../../lib/supportStatus'
import { supabase } from '../../../lib/supabase'

export default function ClientTicketDetailPage() {
  const { id } = useParams()
  const { profile } = useOutletContext()
  const { getTicketById, addPublicReply, usingMocks } = useClientTickets(profile)
  const [detail, setDetail] = useState(null)
  const [reply, setReply] = useState('')
  const [feedback, setFeedback] = useState('')

  const load = useCallback(async () => {
    try {
      setDetail(await getTicketById(id))
    } catch (error) {
      setFeedback(error.message)
    }
  }, [getTicketById, id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load, usingMocks])

  async function submit(event) {
    event.preventDefault()
    if (!reply.trim()) return
    await addPublicReply(id, reply.trim())
    setReply('')
    await load()
  }

  async function openAttachment(file) {
    if (!file.file_path) return
    const { data, error } = await supabase.storage.from('support-attachments').createSignedUrl(file.file_path, 60 * 10)
    if (error || !data?.signedUrl) {
      setFeedback('No se ha podido generar el enlace privado del archivo.')
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (!detail?.ticket) return <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-400">{feedback || 'Cargando ticket...'}</p>
  const { ticket, messages } = detail

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <Link to="/cliente/soporte/tickets" className="text-xs font-bold text-teal-700 hover:underline">Tickets</Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-teal-700">{formatTicketNumber(ticket.public_ticket_number)}</span>
          <TicketStatusBadge status={ticket.client_status} client />
          <TicketPriorityBadge priority={ticket.priority_client} />
        </div>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-slate-950">{ticket.subject}</h1>
        <p className="mt-1 text-xs text-slate-400">{ticket.product} · Creado {formatSupportDate(ticket.created_at, true)}</p>
      </div>

      <TicketConversation messages={messages} showPrivate={false} />
      {!!ticket.attachments?.length && (
        <section className="card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Archivos adjuntos</p>
          <div className="mt-2 flex flex-wrap gap-2">{ticket.attachments.map(file => file.file_path
            ? <button type="button" onClick={() => openAttachment(file)} key={file.id || file.file_name} className="badge-gray hover:bg-teal-50 hover:text-teal-700">{file.file_name}</button>
            : <span key={file.id || file.file_name} className="badge-gray">{file.file_name}</span>)}</div>
        </section>
      )}

      <form onSubmit={submit} className="card p-4">
        <label className="label">Responder a soporte</label>
        <textarea rows={4} className="field resize-y" value={reply} onChange={event => setReply(event.target.value)} placeholder="Escriba su respuesta..." />
        <div className="mt-3 flex justify-end">
          <button className="btn-primary"><PaperAirplaneIcon className="h-4 w-4" /> Enviar respuesta</button>
        </div>
      </form>
    </div>
  )
}
