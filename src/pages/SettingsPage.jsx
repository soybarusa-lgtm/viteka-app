import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COMPANY_ID = '53d152e5-8459-4996-aa9e-e27ecd97892d'

export default function SettingsPage() {
  const [company, setCompany] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Form fields
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [address, setAddress]     = useState('')
  const [website, setWebsite]     = useState('')
  const [taxId, setTaxId]         = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('companies').select('*').eq('id', COMPANY_ID).maybeSingle()
    if (data) {
      setCompany(data)
      setName(data.name || '')
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setAddress(data.address || '')
      setWebsite(data.website || '')
      setTaxId(data.tax_id || '')
    }
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('companies').update({
      name, email, phone, address, website, tax_id: taxId,
    }).eq('id', COMPANY_ID)
    setSaving(false)
    if (error) { alert(error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0F172A]">Configuración</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Datos de la empresa y preferencias</p>
      </div>

      <form onSubmit={save} className="max-w-2xl space-y-6">
        <div className="rounded-2xl border border-[#E8EDF2] bg-white p-6">
          <p className="mb-5 text-[13px] font-medium text-[#0F172A]">Datos de empresa</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nombre de empresa">
              <input value={name} onChange={e => setName(e.target.value)} className="field" placeholder="Viteka Soporte SL" />
            </FormField>
            <FormField label="NIF / CIF">
              <input value={taxId} onChange={e => setTaxId(e.target.value)} className="field" placeholder="B12345678" />
            </FormField>
            <FormField label="Email de contacto">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="field" />
            </FormField>
            <FormField label="Teléfono">
              <input value={phone} onChange={e => setPhone(e.target.value)} className="field" />
            </FormField>
            <FormField label="Dirección" className="sm:col-span-2">
              <input value={address} onChange={e => setAddress(e.target.value)} className="field" />
            </FormField>
            <FormField label="Sitio web">
              <input value={website} onChange={e => setWebsite(e.target.value)} className="field" placeholder="https://viteka.es" />
            </FormField>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-xl bg-[#005643] px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#00442f] disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {saved && (
            <span className="text-[13px] text-emerald-600 font-medium">✓ Guardado correctamente</span>
          )}
        </div>
      </form>
    </div>
  )
}

function FormField({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">{label}</span>
      {children}
    </label>
  )
}
