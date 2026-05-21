import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useEquipamiento
 * Tablas:
 *   - pharmacy_equipment   → datos no-IT (ERP, caja, ESL, básculas…)
 *   - pharmacy_it_devices  → equipos informáticos (uno por fila)
 */
export function useEquipamiento(pharmacyId) {
  const [equipment, setEquipment] = useState(null)
  const [devices,   setDevices]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)

  // ── Carga ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    setError(null)
    try {
      const [{ data: eq, error: eqErr }, { data: devs, error: devErr }] = await Promise.all([
        supabase.from('pharmacy_equipment').select('*').eq('pharmacy_id', pharmacyId).maybeSingle(),
        supabase.from('pharmacy_it_devices').select('*').eq('pharmacy_id', pharmacyId).order('created_at'),
      ])
      if (eqErr)  throw eqErr
      if (devErr) throw devErr
      setEquipment(eq || {})
      setDevices(devs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pharmacyId])

  // ── Guardar equipamiento principal (SIN it_devices) ───────────────────────
  const saveEquipment = useCallback(async (formData) => {
    setSaving(true)
    setError(null)
    try {
      // Extraemos it_devices para no enviarlo a pharmacy_equipment
      const { it_devices: localDevs, ...rest } = formData
      const payload = { ...rest, pharmacy_id: pharmacyId }

      // 1. Upsert del equipamiento principal
      const { error: eqErr } = equipment?.id
        ? await supabase.from('pharmacy_equipment').update(payload).eq('id', equipment.id)
        : await supabase.from('pharmacy_equipment').insert(payload)
      if (eqErr) throw eqErr

      // 2. Upsert de dispositivos IT
      if (Array.isArray(localDevs) && localDevs.length > 0) {
        // Dispositivos con id → update; sin id → insert
        const toUpdate = localDevs.filter(d => d.id)
        const toInsert = localDevs
          .filter(d => !d.id)
          .map(({ id, created_at, ...d }) => ({ ...d, pharmacy_id: pharmacyId }))

        const updates = toUpdate.map(({ id, created_at, pharmacy_id: _pid, ...d }) =>
          supabase.from('pharmacy_it_devices').update({ ...d, pharmacy_id: pharmacyId }).eq('id', id)
        )
        const results = await Promise.all(updates)
        const updateErr = results.find(r => r.error)?.error
        if (updateErr) throw updateErr

        if (toInsert.length > 0) {
          const { error: insErr } = await supabase.from('pharmacy_it_devices').insert(toInsert)
          if (insErr) throw insErr
        }
      }

      await load()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [pharmacyId, equipment, load])

  // ── Eliminar dispositivo ───────────────────────────────────────────────────
  const deleteDevice = useCallback(async (deviceId) => {
    const { error: err } = await supabase.from('pharmacy_it_devices').delete().eq('id', deviceId)
    if (err) throw err
    setDevices(prev => prev.filter(d => d.id !== deviceId))
  }, [])

  // ── Duplicar dispositivo existente en BD ──────────────────────────────────
  const duplicateDevice = useCallback(async (deviceId) => {
    setSaving(true)
    setError(null)
    try {
      const { data: orig, error: fetchErr } = await supabase
        .from('pharmacy_it_devices')
        .select('*')
        .eq('id', deviceId)
        .single()
      if (fetchErr) throw fetchErr

      const { id, created_at, ...rest } = orig
      const copy = { ...rest, nombre: `${rest.nombre || rest.tipo || 'Equipo'} (copia)` }
      const { error: insErr } = await supabase.from('pharmacy_it_devices').insert(copy)
      if (insErr) throw insErr
      await load()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [load])

  // ── Copiar todos los dispositivos de otra farmacia ────────────────────────
  const copyDevicesFromPharmacy = useCallback(async (sourcePharmacyId) => {
    setSaving(true)
    setError(null)
    try {
      const { data: sourceDevs, error: fetchErr } = await supabase
        .from('pharmacy_it_devices')
        .select('*')
        .eq('pharmacy_id', sourcePharmacyId)
        .order('created_at')
      if (fetchErr) throw fetchErr
      if (!sourceDevs?.length) return

      const payload = sourceDevs.map(({ id, pharmacy_id, created_at, ...rest }) => ({
        ...rest,
        pharmacy_id: pharmacyId,
      }))
      const { error: insErr } = await supabase.from('pharmacy_it_devices').insert(payload)
      if (insErr) throw insErr
      await load()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [pharmacyId, load])

  return {
    equipment, devices, loading, saving, error,
    load, saveEquipment, deleteDevice,
    duplicateDevice, copyDevicesFromPharmacy,
  }
}
