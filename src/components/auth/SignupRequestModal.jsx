import { useEffect, useMemo, useState } from 'react'
import { CheckCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '../../context/ToastContext'
import { submitSignupRequest } from '../../lib/signupRequests'

const INITIAL_FORM = {
  full_name: '',
  pharmacy_name: '',
  population: '',
  city: '',
  phone: '',
  email: '',
  current_software: '',
}

export default function SignupRequestModal({ open, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setForm(INITIAL_FORM)
    setSaving(false)
    setError('')
    setResult(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const completedSummary = useMemo(() => {
    if (!result?.data) return ''
    return `${result.data.full_name} · ${result.data.pharmacy_name} · ${result.data.email}`
  }, [result])

  function setField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        ...form,
        source: 'login',
      }
      const outcome = await submitSignupRequest(payload)
      setResult(outcome)
      toast(outcome.local ? 'Solicitud guardada localmente para revisar después.' : 'Solicitud de alta enviada correctamente.', 'success')
    } catch (submitError) {
      setError(submitError.message || 'No se pudo enviar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Solicitar alta"
      onClick={event => event.target === event.currentTarget && onClose()}
    >
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-teal-700">Alta de acceso</p>
            <h2 className="font-display text-xl font-extrabold text-slate-950">Solicitar entrada en Viteka</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-teal-100 bg-teal-50/80 px-4 py-4 text-sm text-teal-900">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
              <p className="leading-6">
                Completa estos datos y Viteka revisará el alta manualmente. Si la solicitud se guarda sin conexión a la base de datos,
                quedará registrada de forma local para no perderla.
              </p>
            </div>
          </div>

          {result ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-950">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                <div className="space-y-2">
                  <p className="font-bold">Solicitud enviada con éxito.</p>
                  <p className="text-emerald-900/80">
                    {completedSummary}
                  </p>
                  <p className="text-emerald-900/80">
                    Tu solicitud se ha enviado correctamente; el equipo de Viteka la revisará y te avisaremos cuando tu cuenta esté disponible.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={onClose} className="btn-primary">
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label">Nombre y apellidos *</label>
                  <input
                    className="input"
                    value={form.full_name}
                    onChange={event => setField('full_name', event.target.value)}
                    placeholder="Nombre y apellidos"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Nombre de la farmacia *</label>
                  <input
                    className="input"
                    value={form.pharmacy_name}
                    onChange={event => setField('pharmacy_name', event.target.value)}
                    placeholder="Farmacia Central"
                    required
                  />
                </div>

                <div>
                  <label className="label">Población *</label>
                  <input
                    className="input"
                    value={form.population}
                    onChange={event => setField('population', event.target.value)}
                    placeholder="Población"
                    required
                  />
                </div>

                <div>
                  <label className="label">Ciudad *</label>
                  <input
                    className="input"
                    value={form.city}
                    onChange={event => setField('city', event.target.value)}
                    placeholder="Ciudad"
                    required
                  />
                </div>

                <div>
                  <label className="label">Teléfono *</label>
                  <input
                    className="input"
                    type="tel"
                    value={form.phone}
                    onChange={event => setField('phone', event.target.value)}
                    placeholder="600 000 000"
                    required
                  />
                </div>

                <div>
                  <label className="label">Correo electrónico *</label>
                  <input
                    className="input"
                    type="email"
                    value={form.email}
                    onChange={event => setField('email', event.target.value)}
                    placeholder="correo@farmacia.es"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Software de gestión actual *</label>
                  <input
                    className="input"
                    value={form.current_software}
                    onChange={event => setField('current_software', event.target.value)}
                    placeholder="Nixfarma, Farmatic, Unycop..."
                    required
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="btn-ghost">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Enviando...' : 'Solicitar acceso'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
