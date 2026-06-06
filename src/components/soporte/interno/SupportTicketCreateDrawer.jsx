import { useEffect, useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../lib/supabase'
import { SUPPORT_PRODUCTS, SUPPORT_TYPES } from '../../../lib/supportStatus'

const EMPTY_FORM = {
  pharmacy_id: '',
  requester_name: '',
  requester_email: '',
  subject: '',
  type: 'Incidencia',
  priority: 'medio',
  product: 'Soporte Técnico - Viteka',
  description: '',
  related_project_id: '',
  related_project_name: '',
}

function buildInitialForm(prefill = {}) {
  return {
    ...EMPTY_FORM,
    pharmacy_id: prefill.pharmacyId || '',
    requester_name: prefill.requesterName || '',
    requester_email: prefill.requesterEmail || '',
    subject: prefill.subject || '',
    type: prefill.type || EMPTY_FORM.type,
    priority: prefill.priority || EMPTY_FORM.priority,
    product: prefill.product || EMPTY_FORM.product,
    description: prefill.description || '',
    related_project_id: prefill.relatedProjectId || '',
    related_project_name: prefill.relatedProjectName || '',
  }
}

export default function SupportTicketCreateDrawer({ open, onClose, onCreate, prefill = {} }) {
  const [form, setForm] = useState(() => buildInitialForm(prefill))
  const [pharmacies, setPharmacies] = useState([])
  const [contacts, setContacts] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(buildInitialForm(prefill))
    setError('')
  }, [open, prefill])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadPharmacies() {
      setLoadingData(true)
      const { data, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('id, pharmacy_name')
        .order('pharmacy_name')

      if (!cancelled) {
        setPharmacies(pharmacyError ? [] : (data || []))
        setLoadingData(false)
      }
    }

    loadPharmacies()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open || !form.pharmacy_id) {
      setContacts([])
      return
    }

    let cancelled = false

    async function loadContacts() {
      const { data, error: contactsError } = await supabase
        .from('pharmacy_persons')
        .select('id, name, email, role, is_responsible')
        .eq('pharmacy_id', form.pharmacy_id)
        .order('is_responsible', { ascending: false })
        .order('name', { ascending: true })

      if (!cancelled) {
        setContacts(contactsError ? [] : (data || []))
      }
    }

    loadContacts()
    return () => {
      cancelled = true
    }
  }, [form.pharmacy_id, open])

  const selectedPharmacyName = useMemo(
    () => pharmacies.find(pharmacy => pharmacy.id === form.pharmacy_id)?.pharmacy_name || prefill.pharmacyName || '',
    [form.pharmacy_id, pharmacies, prefill.pharmacyName],
  )

  const contextLines = useMemo(
    () => (prefill.contextLines || []).filter(Boolean),
    [prefill.contextLines],
  )

  function setField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function applyContact(contactId) {
    if (!contactId) return
    const contact = contacts.find(item => item.id === contactId)
    if (!contact) return
    setForm(current => ({
      ...current,
      requester_name: current.requester_name || contact.name || '',
      requester_email: current.requester_email || contact.email || '',
    }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.subject.trim() || !form.description.trim()) {
      setError('Escribe un asunto y una descripción antes de crear el ticket.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onCreate({
        ...form,
        pharmacy_name: selectedPharmacyName,
      })
      onClose()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/30"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo ticket interno"
      onClick={event => event.target === event.currentTarget && onClose()}
    >
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Soporte operativo</p>
            <h2 className="font-display text-xl font-extrabold text-slate-900">Crear ticket interno</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-5 py-5">
          {contextLines.length > 0 ? (
            <section className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-600">Contexto</p>
              <div className="mt-3 space-y-2">
                {contextLines.map(line => (
                  <div key={line} className="rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-sky-800">
                    {line}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Farmacia</label>
              <select
                className="field"
                value={form.pharmacy_id}
                onChange={event => setField('pharmacy_id', event.target.value)}
                disabled={loadingData}
              >
                <option value="">Sin farmacia asignada</option>
                {pharmacies.map(pharmacy => (
                  <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.pharmacy_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Contacto vinculado</label>
              <select className="field" defaultValue="" onChange={event => applyContact(event.target.value)} disabled={!contacts.length}>
                <option value="">Seleccionar contacto</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.role ? `· ${contact.role}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Prioridad</label>
              <select className="field" value={form.priority} onChange={event => setField('priority', event.target.value)}>
                <option value="bajo">Baja</option>
                <option value="medio">Media</option>
                <option value="alto">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div>
              <label className="label">Solicitante</label>
              <input className="field" value={form.requester_name} onChange={event => setField('requester_name', event.target.value)} placeholder="Nombre de contacto" />
            </div>

            <div>
              <label className="label">Email de contacto</label>
              <input className="field" type="email" value={form.requester_email} onChange={event => setField('requester_email', event.target.value)} placeholder="correo@farmacia.es" />
            </div>

            <div>
              <label className="label">Tipo</label>
              <select className="field" value={form.type} onChange={event => setField('type', event.target.value)}>
                {SUPPORT_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Producto</label>
              <select className="field" value={form.product} onChange={event => setField('product', event.target.value)}>
                {SUPPORT_PRODUCTS.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label">Asunto *</label>
              <input className="field" value={form.subject} onChange={event => setField('subject', event.target.value)} placeholder="Resumen breve del ticket" required />
            </div>

            {form.related_project_name ? (
              <div className="sm:col-span-2">
                <label className="label">Proyecto relacionado</label>
                <input className="field bg-slate-50 text-slate-500" readOnly value={form.related_project_name} />
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <label className="label">Descripción *</label>
              <textarea
                rows={7}
                className="field resize-y"
                value={form.description}
                onChange={event => setField('description', event.target.value)}
                placeholder="Describe el problema, la petición o el siguiente paso que necesita el equipo."
                required
              />
            </div>
          </div>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
