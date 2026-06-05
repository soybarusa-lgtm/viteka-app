import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChatBubbleLeftRightIcon, CheckCircleIcon, LockClosedIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import ClientContextPanel from '../../components/support/ClientContextPanel'
import InternalSupportFrame from '../../components/soporte/interno/InternalSupportFrame'
import TicketConversation from '../../components/soporte/interno/TicketConversation'
import { TicketPriorityBadge, TicketStatusBadge } from '../../components/soporte/shared/SupportBadges'
import { useAuth } from '../../hooks/useAuth'
import { useSupportTickets } from '../../hooks/useSupportTickets'
import { formatSupportDate } from '../../lib/supportFormatters'
import { formatTicketNumber, INTERNAL_STATUS_LABELS, PRIORITY_LABELS } from '../../lib/supportStatus'

export default function SupportTicketDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { getTicketById, updateTicket, addPublicReply, addPrivateNote, closeTicket, usingMocks, loading } = useSupportTickets(profile)
  const [detail, setDetail] = useState(null)
  const [reply, setReply] = useState('')
  const [note, setNote] = useState('')
  const [group, setGroup] = useState('')
  const [mode, setMode] = useState('reply')
  const [feedback, setFeedback] = useState('')

  const load = useCallback(async () => {
    try {
      const nextDetail = await getTicketById(id)
      setDetail(nextDetail)
      setGroup(nextDetail.ticket?.group_name || '')
    } catch (error) {
      setFeedback(error.message)
    }
  }, [getTicketById, id])

  useEffect(() => {
    if (loading) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load, loading, usingMocks])

  async function saveReply(event) {
    event.preventDefault()
    const body = mode === 'note' ? note : reply
    if (!body.trim()) return
    if (mode === 'note') {
      await addPrivateNote(id, body.trim())
      setNote('')
    } else {
      await addPublicReply(id, body.trim())
      setReply('')
    }
    await load()
  }

  async function change(key, value) {
    await updateTicket(id, { [key]: value })
    await load()
  }

  if (!detail?.ticket) return <InternalSupportFrame><p className="card p-5 text-sm text-slate-400">{feedback || 'Cargando ticket...'}</p></InternalSupportFrame>
  const { ticket, messages } = detail

  return (
    <InternalSupportFrame>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/soporte/tickets" className="text-xs font-bold text-teal-700 hover:underline">Tickets</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-teal-700">{formatTicketNumber(ticket.public_ticket_number)}</span>
            <TicketStatusBadge status={ticket.internal_status} />
            <TicketPriorityBadge priority={ticket.priority_internal} />
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-slate-950">{ticket.subject}</h1>
          <p className="mt-1 text-xs text-slate-400">{ticket.pharmacy_name} · {ticket.requester_name} · Creado {formatSupportDate(ticket.created_at, true)}</p>
        </div>
        <button type="button" onClick={async () => { await closeTicket(id); await load() }} className="btn-secondary"><CheckCircleIcon className="h-4 w-4" /> Cerrar ticket</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
        <main className="space-y-4">
          <TicketConversation messages={messages} />
          <form onSubmit={saveReply} className={`card p-4 ${mode === 'note' ? 'border-amber-200 bg-amber-50' : ''}`}>
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => setMode('reply')} className={`btn-ghost px-3 py-2 ${mode === 'reply' ? 'bg-teal-50 text-teal-800' : ''}`}><ChatBubbleLeftRightIcon className="h-4 w-4" /> Responder</button>
              <button type="button" onClick={() => setMode('note')} className={`btn-ghost px-3 py-2 ${mode === 'note' ? 'bg-amber-100 text-amber-800' : ''}`}><LockClosedIcon className="h-4 w-4" /> Nota privada</button>
            </div>
            <textarea rows={5} className="field resize-y" value={mode === 'note' ? note : reply} onChange={event => mode === 'note' ? setNote(event.target.value) : setReply(event.target.value)} placeholder={mode === 'note' ? 'Esta nota solo será visible para el equipo interno.' : 'Escriba una respuesta visible para el cliente.'} />
            <div className="mt-3 flex justify-end"><button className="btn-primary"><PaperAirplaneIcon className="h-4 w-4" /> {mode === 'note' ? 'Guardar nota' : 'Enviar respuesta'}</button></div>
          </form>
        </main>

        <aside className="space-y-4">
          <section className="card space-y-3 p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Propiedades</p>
            <div><label className="label">Estado</label><select className="field" value={ticket.internal_status} onChange={event => change('internal_status', event.target.value)}>{Object.entries(INTERNAL_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label className="label">Prioridad</label><select className="field" value={ticket.priority_internal} onChange={event => change('priority_internal', event.target.value)}>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label className="label">Grupo</label><input className="field" value={group} onChange={event => setGroup(event.target.value)} placeholder="Sin asignar" /><button type="button" onClick={() => change('group_name', group)} className="btn-ghost mt-2 w-full border border-slate-200 px-3 py-2">Actualizar grupo</button></div>
            <div><label className="label">Agente</label><input readOnly className="field bg-slate-50" value={ticket.assigned_agent_name || 'Sin asignar'} /></div>
          </section>
          <section className="card p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Contacto</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{ticket.requester_name}</p>
            <p className="mt-1 text-xs text-slate-500">{ticket.pharmacy_name}</p>
            <p className="mt-3 text-xs text-slate-400">{ticket.product} · {ticket.type}</p>
          </section>
          <ClientContextPanel profile={profile} ticket={ticket} />
        </aside>
      </div>
    </InternalSupportFrame>
  )
}
