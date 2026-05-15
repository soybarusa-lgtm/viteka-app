import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PeoplePage({ pharmacies = [] }) {
  const [people, setPeople] = useState([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const [pharmacyId, setPharmacyId] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadPeople()
  }, [])

  async function loadPeople() {
    const { data, error } = await supabase
      .from('pharmacy_people')
      .select(`
        *,
        clients (
          id,
          name,
          pharmacy_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setPeople(data || [])
  }

  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      const text = [
        person.full_name,
        person.role,
        person.email,
        person.phone,
        person.mobile,
        person.clients?.name,
        person.clients?.pharmacy_name,
      ]
        .join(' ')
        .toLowerCase()

      return text.includes(search.toLowerCase())
    })
  }, [people, search])

  async function createPerson(e) {
    e.preventDefault()

    if (!pharmacyId) {
      alert('Selecciona una farmacia.')
      return
    }

    if (!fullName.trim()) {
      alert('El nombre es obligatorio.')
      return
    }

    const { error } = await supabase
      .from('pharmacy_people')
      .insert({
        pharmacy_id: pharmacyId,
        full_name: fullName,
        role,
        phone,
        mobile,
        email,
        is_primary: isPrimary,
        notes,
      })

    if (error) {
      alert(error.message)
      return
    }

    setPharmacyId('')
    setFullName('')
    setRole('')
    setPhone('')
    setMobile('')
    setEmail('')
    setIsPrimary(false)
    setNotes('')
    setFormOpen(false)

    await loadPeople()
  }

  async function deletePerson(personId) {
    const confirmed = window.confirm('¿Eliminar esta persona?')
    if (!confirmed) return

    const { error } = await supabase
      .from('pharmacy_people')
      .delete()
      .eq('id', personId)

    if (error) {
      alert(error.message)
      return
    }

    await loadPeople()
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl tracking-[-0.045em] text-[#0F172A] font-medium">
            Personas
          </h1>

          <p className="mt-3 text-base text-[#64748B]">
            Contactos y responsables asociados a farmacias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setFormOpen(!formOpen)}
          className="rounded-2xl bg-[#005643] px-6 py-4 text-sm text-white shadow-sm"
        >
          + Nueva persona
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={createPerson}
          className="mb-8 rounded-[32px] border border-[#E2E8F0] bg-white p-8 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <Field label="Farmacia">
              <select
                value={pharmacyId}
                onChange={e => setPharmacyId(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar farmacia</option>
                {pharmacies.map(pharmacy => (
                  <option key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.pharmacy_name || pharmacy.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nombre completo">
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="input" />
            </Field>

            <Field label="Cargo / rol">
              <input value={role} onChange={e => setRole(e.target.value)} className="input" />
            </Field>

            <Field label="Teléfono">
              <input value={phone} onChange={e => setPhone(e.target.value)} className="input" />
            </Field>

            <Field label="Móvil">
              <input value={mobile} onChange={e => setMobile(e.target.value)} className="input" />
            </Field>

            <Field label="Email">
              <input value={email} onChange={e => setEmail(e.target.value)} className="input" />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Notas">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input min-h-[120px]" />
            </Field>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm text-[#334155]">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={e => setIsPrimary(e.target.checked)}
            />
            Contacto principal
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">
              Cancelar
            </button>

            <button type="submit" className="btn-primary">
              Crear persona
            </button>
          </div>
        </form>
      )}

      <div className="mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar persona, farmacia, email o teléfono..."
          className="w-full rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {filteredPeople.map(person => (
          <div key={person.id} className="rounded-[28px] border border-[#E2E8F0] bg-white p-7 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl tracking-[-0.03em] text-[#0F172A] font-medium">
                  {person.full_name}
                </h2>

                <p className="mt-2 text-sm text-[#64748B]">
                  {person.clients?.pharmacy_name || person.clients?.name || 'Sin farmacia'}
                </p>
              </div>

              {person.is_primary && (
                <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs text-[#166534]">
                  Principal
                </span>
              )}
            </div>

            <div className="mt-6 space-y-2 text-sm text-[#64748B]">
              <p>Rol: {person.role || '—'}</p>
              <p>Email: {person.email || '—'}</p>
              <p>Teléfono: {person.phone || '—'}</p>
              <p>Móvil: {person.mobile || '—'}</p>
            </div>

            {person.notes && (
              <p className="mt-5 rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
                {person.notes}
              </p>
            )}

            <button
              type="button"
              onClick={() => deletePerson(person.id)}
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-wide text-[#64748B] font-medium">
        {label}
      </span>
      {children}
    </label>
  )
}