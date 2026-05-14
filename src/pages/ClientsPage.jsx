import { useMemo, useState } from 'react'

export default function ClientsPage({
  clients = [],
  onCreateClient,
  onEditClient,
  onDeleteClient,
}) {
  const [search, setSearch] = useState('')

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const text = [
        client.name,
        client.email,
        client.phone,
        client.notes,
      ]
        .join(' ')
        .toLowerCase()

      return text.includes(search.toLowerCase())
    })
  }, [clients, search])

  const withEmail = clients.filter(client => client.email).length
  const withPhone = clients.filter(client => client.phone).length

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-[#0F172A]">
            Clientes
          </h1>

          <p className="mt-3 text-base font-semibold text-[#64748B]">
            Gestión de clientes, contactos y datos operativos.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateClient}
          className="rounded-2xl bg-gradient-to-br from-[#00684F] to-[#009B73] px-6 py-4 text-sm font-black text-white shadow-sm hover:opacity-95"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard title="Total clientes" value={clients.length} />
        <StatCard title="Con email" value={withEmail} />
        <StatCard title="Con teléfono" value={withPhone} />
      </div>

      <div className="mt-7 rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 text-sm font-semibold outline-none focus:border-[#005643]"
          placeholder="Buscar cliente, email, teléfono o notas..."
        />
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.4fr_1fr] border-b border-[#E2E8F0] bg-[#F8FAFC] px-7 py-5 xl:grid">
          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Cliente
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Email
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Teléfono
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Notas
          </div>

          <div className="text-xs font-black uppercase tracking-wide text-[#64748B]">
            Acciones
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="px-7 py-10 text-sm font-semibold text-[#64748B]">
            No hay clientes que coincidan con la búsqueda.
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.id}
              className="grid grid-cols-1 gap-5 border-b border-[#F1F5F9] px-7 py-6 xl:grid-cols-[1.2fr_1fr_1fr_1.4fr_1fr]"
            >
              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Cliente
                </p>

                <p className="font-black text-[#0F172A]">
                  {client.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Email
                </p>

                <p className="text-sm font-semibold text-[#64748B]">
                  {client.email || 'Sin email'}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Teléfono
                </p>

                <p className="text-sm font-semibold text-[#64748B]">
                  {client.phone || 'Sin teléfono'}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Notas
                </p>

                <p className="text-sm font-semibold text-[#64748B]">
                  {client.notes || 'Sin notas'}
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-[#94A3B8] xl:hidden">
                  Acciones
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onEditClient(client)}
                    className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-black text-[#0F172A] hover:bg-[#F8FAFC]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteClient(client.id)}
                    className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
}) {
  return (
    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-7 shadow-sm">
      <p className="text-sm font-bold text-[#64748B]">
        {title}
      </p>

      <strong className="mt-3 block text-5xl font-black text-[#0F172A]">
        {value}
      </strong>
    </div>
  )
}