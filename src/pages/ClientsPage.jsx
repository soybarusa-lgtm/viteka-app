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

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Clientes
          </h1>

          <p className="mt-2 text-[#8AAA96] font-medium">
            Gestión de clientes registrados.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateClient}
          className="rounded-xl bg-[#005643] px-5 py-3 text-white font-bold hover:bg-[#0E7A60]"
        >
          Nuevo cliente
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Clientes" value={clients.length} />
        <StatCard label="Con email" value={clients.filter(client => client.email).length} />
        <StatCard label="Con teléfono" value={clients.filter(client => client.phone).length} />
      </div>

      <div className="mb-6 rounded-2xl bg-white border border-[#DCE7E1] p-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#DCE7E1] px-4 py-3 outline-none focus:border-[#005643]"
          placeholder="Buscar por cliente, email, teléfono o notas..."
        />
      </div>

      <div className="rounded-2xl bg-white border border-[#DCE7E1] shadow-sm overflow-hidden">
        <div className="hidden lg:grid grid-cols-5 border-b border-[#DCE7E1] bg-[#F7FAF8] px-6 py-4 font-bold text-sm text-[#4A6B58]">
          <div>Cliente</div>
          <div>Email</div>
          <div>Teléfono</div>
          <div>Estado</div>
          <div>Acciones</div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="px-6 py-8 text-[#8AAA96]">
            No hay clientes que coincidan con la búsqueda.
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.id}
              className="grid grid-cols-1 gap-3 border-b border-[#EEF4F0] px-6 py-5 lg:grid-cols-5"
            >
              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] lg:hidden">
                  Cliente
                </p>

                <p className="font-bold">
                  {client.name}
                </p>

                {client.notes && (
                  <p className="mt-1 text-sm text-[#8AAA96] lg:hidden">
                    {client.notes}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] lg:hidden">
                  Email
                </p>

                <p className="text-[#6E8B7B]">
                  {client.email || 'Sin email'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] lg:hidden">
                  Teléfono
                </p>

                <p className="text-[#6E8B7B]">
                  {client.phone || 'Sin teléfono'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] lg:hidden">
                  Estado
                </p>

                <span className="inline-block rounded-full bg-[#E5F3EC] px-3 py-1 text-xs font-bold text-[#005643]">
                  Activo
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-[#8AAA96] lg:hidden">
                  Acciones
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEditClient(client)}
                    className="rounded-xl border border-[#DCE7E1] px-4 py-2 text-sm font-bold text-[#005643] hover:bg-[#F5FAF6]"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteClient(client.id)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
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

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-[#DCE7E1] p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8AAA96]">
        {label}
      </p>

      <strong className="mt-2 block text-3xl">
        {value}
      </strong>
    </div>
  )
}