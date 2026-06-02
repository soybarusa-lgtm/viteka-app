import { ChatBubbleLeftRightIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { formatSupportDate } from '../../../lib/supportFormatters'

export default function TicketConversation({ messages, showPrivate = true }) {
  const visible = (messages || []).filter(message => showPrivate || !message.is_private_note)
  if (!visible.length) return <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">Todavía no hay mensajes.</p>

  return (
    <div className="space-y-3">
      {visible.map(message => (
        <article key={message.id} className={`rounded-xl border p-4 ${message.is_private_note ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {message.is_private_note ? <LockClosedIcon className="h-4 w-4 shrink-0 text-amber-700" /> : <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0 text-teal-700" />}
              <p className="truncate text-sm font-bold text-slate-800">{message.author_name || 'Usuario'}</p>
              {message.is_private_note && <span className="badge-yellow">Nota privada</span>}
            </div>
            <time className="shrink-0 text-[11px] text-slate-400">{formatSupportDate(message.created_at, true)}</time>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{message.body}</p>
        </article>
      ))}
    </div>
  )
}
