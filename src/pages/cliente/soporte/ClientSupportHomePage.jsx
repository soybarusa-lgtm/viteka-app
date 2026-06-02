import { Link, useOutletContext } from 'react-router-dom'
import { MagnifyingGlassIcon, PaperAirplaneIcon, TicketIcon } from '@heroicons/react/24/outline'
import ClientSupportActionCard from '../../../components/soporte/cliente/ClientSupportActionCard'

export default function ClientSupportHomePage() {
  const { profile } = useOutletContext()

  return (
    <>
      <section className="bg-[#e7f4df] px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-700">Ayuda Viteka</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-teal-950 sm:text-5xl">
            Hola{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}. ¿Cómo podemos ayudarle?
          </h1>
          <label className="mx-auto mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-lg shadow-teal-900/5">
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-teal-700" />
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Introduzca aquí su término de búsqueda..." />
          </label>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 sm:py-12">
        <ClientSupportActionCard
          to="/cliente/soporte/tickets"
          Icon={TicketIcon}
          title="Ver todos los tickets"
          detail="Lleve un seguimiento del progreso de sus tickets y sus conversaciones con soporte."
        />
        <ClientSupportActionCard
          to="/cliente/soporte/tickets/nuevo"
          Icon={PaperAirplaneIcon}
          title="Enviar un ticket"
          detail="Describa su problema rellenando el formulario de soporte."
        />
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-8 sm:px-6">
        <div className="rounded-2xl border border-teal-100 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          ¿Necesita revisar una incidencia reciente? <Link to="/cliente/soporte/tickets" className="font-bold text-teal-700 hover:underline">Consulte sus conversaciones abiertas.</Link>
        </div>
      </section>
    </>
  )
}
