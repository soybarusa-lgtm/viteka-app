import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ClientDetailPage({
  clientId,
  onBack,
  onEditClient,
}) {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  async function loadClient() {
    setLoading(true)

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setClient(data)
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 text-[#64748B]">
        Cargando ficha del cliente...
      </div>
    )
  }

  if (!client) {
    return (
      <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 text-[#64748B]">
        Cliente no encontrado.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-5 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm text-[#334155] shadow-sm hover:bg-[#F8FAFC]"
          >
            ← Volver a clientes
          </button>

          <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
            {client.pharmacy_name || client.name || 'Ficha cliente'}
          </h1>

          <p className="mt-3 text-base text-[#64748B]">
            {client.city || 'Sin ciudad'} · {client.province || 'Sin provincia'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEditClient(client)}
          className="rounded-2xl bg-[#0F172A] px-6 py-4 text-sm text-white shadow-sm hover:opacity-90"
        >
          Editar ficha
        </button>
      </div>

      <div className="grid grid-cols-1 gap-7 xl:grid-cols-[1fr_420px]">
        <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <h2 className="mb-7 text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
            Datos principales
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Info label="Nombre farmacia" value={client.pharmacy_name || client.name} />
            <Info label="Titular farmacéutico" value={client.pharmacist_owner} />
            <Info label="Provincia" value={client.province} />
            <Info label="Ciudad" value={client.city} />
            <Info label="Teléfono contacto" value={client.contact_phone || client.phone} />
            <Info label="Correo contacto" value={client.contact_email || client.email} />
            <Info label="NIF/CIF" value={client.nif_cif} />
            <Info label="Número SOE" value={client.soe_number} />
            <Info label="CIP" value={client.cip} />
            <Info label="Dirección" value={client.address} />
          </div>
        </section>

        <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <h2 className="mb-7 text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
            Datos empresa
          </h2>

          <div className="space-y-5">
            <Info label="Correo electrónico" value={client.business_email || client.email} />
            <Info label="Teléfono" value={client.business_phone || client.phone} />
            <Info label="Datos colegiado" value={client.collegiate_data} multiline />
            <Info label="Operadores" value={client.operators} multiline />
          </div>
        </section>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-7 xl:grid-cols-2">
        <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <h2 className="mb-5 text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
            Datos de empresa
          </h2>

          <p className="whitespace-pre-wrap text-sm leading-7 text-[#64748B]">
            {client.company_data || 'Sin datos de empresa.'}
          </p>
        </section>

        <section className="rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <h2 className="mb-5 text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
            Observaciones
          </h2>

          <p className="whitespace-pre-wrap text-sm leading-7 text-[#64748B]">
            {client.observations || client.notes || 'Sin observaciones.'}
          </p>
        </section>
      </div>
    </div>
  )
}

function Info({
  label,
  value,
  multiline = false,
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <p className="text-xs uppercase tracking-wide text-[#64748B] font-medium">
        {label}
      </p>

      <p
        className={`mt-2 text-sm text-[#0F172A] ${
          multiline ? 'whitespace-pre-wrap leading-7' : ''
        }`}
      >
        {value || '—'}
      </p>
    </div>
  )
}