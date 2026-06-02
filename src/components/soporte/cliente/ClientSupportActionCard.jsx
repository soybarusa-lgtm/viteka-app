import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function ClientSupportActionCard({ to, Icon, title, detail }) {
  return (
    <Link to={to} className="group card flex items-start gap-4 p-5 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
      <span className="rounded-xl bg-teal-50 p-3 text-teal-700"><Icon className="h-6 w-6" /></span>
      <span className="min-w-0">
        <span className="font-display text-lg font-extrabold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{detail}</span>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-teal-700">Continuar <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
      </span>
    </Link>
  )
}
