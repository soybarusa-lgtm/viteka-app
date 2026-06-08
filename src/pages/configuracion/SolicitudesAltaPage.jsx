import { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon, CheckCircleIcon, ClockIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../hooks/useAuth'
import { fetchSignupRequests, updateSignupRequest } from '../../lib/signupRequests'

const STATUS_META = {
  new: { label: 'Nueva', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
  reviewed: { label: 'Revisada', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  in_progress: { label: 'En proceso', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
  closed: { label: 'Cerrada', tone: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

function formatDate(value) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.new
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

export default function SolicitudesAltaPage() {
  const toast = useToast()
  const { profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function loadRequests() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSignupRequests()
      setRequests(data)
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests()
  }, [])

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return requests.filter(item => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesQuery = !normalizedQuery || [
        item.full_name,
        item.pharmacy_name,
        item.population,
        item.city,
        item.phone,
        item.email,
        item.current_software,
      ].some(value => String(value || '').toLowerCase().includes(normalizedQuery))
      return matchesStatus && matchesQuery
    })
  }, [query, requests, statusFilter])

  const counters = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(item => item.status === 'new').length,
    reviewed: requests.filter(item => item.status === 'reviewed').length,
    progress: requests.filter(item => item.status === 'in_progress').length,
  }), [requests])

  async function markStatus(id, status) {
    setSavingId(id)
    setError('')
    try {
      const updated = await updateSignupRequest(id, {
        status,
        reviewed_by: profile?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      setRequests(current => current.map(item => (item.id === id ? updated : item)))
      toast(`Solicitud marcada como ${STATUS_META[status]?.label?.toLowerCase() || 'actualizada'}.`, 'success')
    } catch (updateError) {
      setError(updateError.message || 'No se pudo actualizar la solicitud.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white px-4 py-5 shadow-sm md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal-700">Configuración · Altas</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-950">Solicitudes de alta</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Centraliza las peticiones que llegan desde el login para revisarlas, priorizarlas y convertirlas en accesos internos cuando toque.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[420px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Total</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-950">{counters.total}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sky-600">Nuevas</p>
              <p className="mt-1 text-2xl font-extrabold text-sky-900">{counters.pending}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-600">Revisadas</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-900">{counters.reviewed}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700">En proceso</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-900">{counters.progress}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_180px_120px]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Buscar</span>
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="input"
                placeholder="Nombre, farmacia, ciudad, email, software..."
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Estado</span>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="input">
                <option value="all">Todos</option>
                <option value="new">Nuevas</option>
                <option value="reviewed">Revisadas</option>
                <option value="in_progress">En proceso</option>
                <option value="closed">Cerradas</option>
              </select>
            </label>
            <div className="flex items-end">
              <button type="button" onClick={loadRequests} className="btn-secondary inline-flex w-full items-center justify-center gap-2">
                <ArrowPathIcon className="h-4 w-4" />
                Recargar
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Solicitante</th>
                <th className="px-4 py-3">Farmacia</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Software</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    Cargando solicitudes...
                  </td>
                </tr>
              ) : filteredRequests.length ? filteredRequests.map(item => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4 text-sm text-slate-500">
                    <div className="flex items-start gap-2">
                      <ClockIcon className="mt-0.5 h-4 w-4 text-slate-300" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-950">{item.full_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.population} · {item.city}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{item.pharmacy_name}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-slate-300" />
                        <span>{item.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4 text-slate-300" />
                        <span>{item.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{item.current_software}</td>
                  <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {item.status !== 'reviewed' ? (
                        <button
                          type="button"
                          onClick={() => markStatus(item.id, 'reviewed')}
                          disabled={savingId === item.id}
                          className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Revisar
                        </button>
                      ) : null}
                      {item.status !== 'in_progress' ? (
                        <button
                          type="button"
                          onClick={() => markStatus(item.id, 'in_progress')}
                          disabled={savingId === item.id}
                          className="btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          En proceso
                        </button>
                      ) : null}
                      {item.status !== 'closed' ? (
                        <button
                          type="button"
                          onClick={() => markStatus(item.id, 'closed')}
                          disabled={savingId === item.id}
                          className="btn-ghost disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cerrar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No hay solicitudes con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm">
        <p className="font-semibold text-slate-900">Siguiente paso sugerido</p>
        <p className="mt-2 leading-6">
          Desde aquí puedes validar la solicitud, crear el usuario interno en Supabase y después dar acceso con la política de cambio de contraseña.
        </p>
      </section>
    </div>
  )
}

