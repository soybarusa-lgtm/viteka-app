import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  Label, Input, Select, Section, ToggleBtn,
} from './PharmacyFormAtoms'
import ContactBlock from './ContactBlock'
import CbOwners from './CbOwners'
import { mkContact } from './PHARMACY_CONSTANTS'

function mkDetail(base = {}) {
  return { distribuidor: '', val_distribuidor: '', soporte: '', val_soporte: '', anotaciones: '', ...base }
}

function pharmacyToGeneralForm(ph) {
  const lType   = ph.legal_type || 'autonomo'
  const types   = lType.split('_')
  const hasAuto = types.includes('autonomo')
  const hasCb   = types.includes('cb')
  const sl      = ph.sl_data || {}
  const cbOwners = Array.isArray(ph.cb_owners) && ph.cb_owners.length >= 2
    ? ph.cb_owners
    : [{ name: '', nif: '', collegiate: '' }, { name: '', nif: '', collegiate: '' }]
  const mainData = {
    contact_phone: ph.contact_phone, contact_email: ph.contact_email,
    address: ph.address, province: ph.province, city: ph.city,
    postal_code: ph.postal_code, soe_number: ph.soe_number,
    schedule: ph.schedule, has_guards: ph.has_guards, observations: ph.observations,
  }
  return {
    pharmacy_name: ph.pharmacy_name || '',
    types,
    auto: { owner_name: ph.owner_name || '', nif: ph.nif || '', collegiate_number: ph.collegiate_number || '' },
    auto_contact: mkContact('auto', hasAuto ? mainData : {}),
    cb: { razon_social: ph.razon_social || '', cif: ph.cif || '', owners: cbOwners },
    cb_contact: mkContact('cb', hasCb ? mainData : {}),
    sl: { razon_social: sl.razon_social || '', cif: sl.cif || '' },
    sl_contact: mkContact('sl', sl),
  }
}

export default function EditGeneralModal({ pharmacy, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm]   = useState(() => pharmacyToGeneralForm(pharmacy))
  const [saving, setSaving] = useState(false)

  const set       = useCallback((k, v)    => setForm(p => ({ ...p, [k]: v })), [])
  const setNested = useCallback((s, k, v) => setForm(p => ({ ...p, [s]: { ...p[s], [k]: v } })), [])
  const setContact= useCallback((s, k, v) => setForm(p => ({ ...p, [s]: { ...p[s], [k]: v } })), [])

  const toggleType = useCallback(type => {
    setForm(p => {
      const has = p.types.includes(type)
      if (has) {
        if (p.types.length === 1) return p
        return { ...p, types: p.types.filter(t => t !== type) }
      }
      if (type === 'autonomo') return { ...p, types: [...p.types.filter(t => t !== 'cb'), 'autonomo'] }
      if (type === 'cb')       return { ...p, types: [...p.types.filter(t => t !== 'autonomo'), 'cb'] }
      return { ...p, types: [...p.types, type] }
    })
  }, [])

  const hasAuto = form.types.includes('autonomo')
  const hasCb   = form.types.includes('cb')
  const hasSl   = form.types.includes('sl')

  async function handleSave() {
    setSaving(true)
    try {
      const legalType   = [...form.types].sort().join('_')
      const mainContact = hasAuto ? form.auto_contact : hasCb ? form.cb_contact : form.sl_contact

      const payload = {
        pharmacy_name: form.pharmacy_name,
        legal_type: legalType,
        owner_name: hasAuto ? form.auto.owner_name : null,
        nif: hasAuto ? form.auto.nif : null,
        collegiate_number: hasAuto ? form.auto.collegiate_number : null,
        razon_social: hasCb ? form.cb.razon_social : (hasSl && !hasAuto && !hasCb ? form.sl.razon_social : null),
        cif: hasCb ? form.cb.cif : (hasSl && !hasAuto && !hasCb ? form.sl.cif : null),
        cb_owners: hasCb ? form.cb.owners : [],
        soe_number: mainContact.soe,
        schedule: mainContact.schedule,
        has_guards: mainContact.has_guards,
        contact_phone: mainContact.phone,
        contact_email: mainContact.email,
        address: mainContact.address,
        province: mainContact.province,
        city: mainContact.city,
        postal_code: mainContact.postal_code,
        observations: mainContact.observations,
        sl_data: hasSl ? {
          razon_social: form.sl.razon_social, cif: form.sl.cif,
          phone: form.sl_contact.phone, email: form.sl_contact.email,
          address: form.sl_contact.address, province: form.sl_contact.province,
          city: form.sl_contact.city, postal_code: form.sl_contact.postal_code,
          observations: form.sl_contact.observations,
        } : null,
      }

      const { error } = await supabase.from('pharmacies').update(payload).eq('id', pharmacy.id)
      if (error) throw error

      toast('Datos generales actualizados', 'success')
      onSaved()
    } catch (err) {
      toast(err.message || 'Error al guardar', 'error', 5500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full sm:max-w-3xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-900">Editar datos generales</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6">

          <Section title="Datos básicos">
            <div>
              <Label required>Nombre de la farmacia</Label>
              <Input required value={form.pharmacy_name} onChange={e => set('pharmacy_name', e.target.value)} />
            </div>
            <div>
              <Label required>Tipo jurídico</Label>
              <p className="text-xs text-gray-400 mb-2">Autónomo y C.B. son excluyentes. La S.L. puede combinarse.</p>
              <div className="flex flex-wrap gap-2">
                <ToggleBtn active={hasAuto} onClick={() => toggleType('autonomo')}>{hasAuto ? '✓ ' : ''}Autónomo</ToggleBtn>
                <ToggleBtn active={hasCb}   onClick={() => toggleType('cb')}>{hasCb ? '✓ ' : ''}C.B.</ToggleBtn>
                <ToggleBtn active={hasSl}   onClick={() => toggleType('sl')}>{hasSl ? '✓ ' : ''}S.L.</ToggleBtn>
              </div>
            </div>
          </Section>

          {hasAuto && (
            <Section title="Autónomo">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2"><Label required>Nombre del titular</Label><Input required value={form.auto.owner_name} onChange={e => setNested('auto','owner_name',e.target.value)} /></div>
                <div><Label>NIF</Label><Input value={form.auto.nif} onChange={e => setNested('auto','nif',e.target.value)} /></div>
                <div><Label>Nº Colegiado</Label><Input value={form.auto.collegiate_number} onChange={e => setNested('auto','collegiate_number',e.target.value)} /></div>
              </div>
              <hr className="border-gray-100" />
              <p className="text-xs font-medium text-gray-500 -mb-2">Contacto de la farmacia</p>
              <ContactBlock data={form.auto_contact} onChange={(f,v) => setContact('auto_contact',f,v)} showGuardsAndSchedule showSoe />
            </Section>
          )}

          {hasCb && (
            <Section title="Comunidad de Bienes (C.B.)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Razón social</Label><Input value={form.cb.razon_social} onChange={e => setNested('cb','razon_social',e.target.value)} /></div>
                <div><Label>CIF</Label><Input value={form.cb.cif} onChange={e => setNested('cb','cif',e.target.value)} /></div>
              </div>
              <div><Label>Titulares</Label><CbOwners owners={form.cb.owners} onChange={val => setNested('cb','owners',val)} /></div>
              <hr className="border-gray-100" />
              <p className="text-xs font-medium text-gray-500 -mb-2">Contacto de la farmacia</p>
              <ContactBlock data={form.cb_contact} onChange={(f,v) => setContact('cb_contact',f,v)} showGuardsAndSchedule showSoe />
            </Section>
          )}

          {hasSl && (
            <Section title="Sociedad Limitada (S.L.)" subtitle={hasAuto || hasCb ? 'Datos propios de la S.L.' : 'Datos de la sociedad y contacto'}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Razón social</Label><Input value={form.sl.razon_social} onChange={e => setNested('sl','razon_social',e.target.value)} /></div>
                <div><Label>CIF</Label><Input value={form.sl.cif} onChange={e => setNested('sl','cif',e.target.value)} /></div>
              </div>
              <hr className="border-gray-100" />
              <ContactBlock data={form.sl_contact} onChange={(f,v) => setContact('sl_contact',f,v)} showGuardsAndSchedule={!hasAuto && !hasCb} showSoe={!hasAuto && !hasCb} />
            </Section>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-white">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving || !form.pharmacy_name.trim()}
            className="px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}
