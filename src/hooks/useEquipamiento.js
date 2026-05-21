import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * useEquipamiento
 * Gestiona lectura y escritura del equipamiento de una farmacia.
 * Tablas Supabase:
 *   - pharmacy_equipment        → secciones principales (ERP, caja, ESL, etc.)
 *   - pharmacy_it_devices       → equipos informáticos con detalle
 */
export function useEquipamiento(pharmacyId) {
  const [equipment, setEquipment]   = useState(null)
  const [devices,   setDevices]     = useState([])
  const [loading,   setLoading]     = useState(false)
  const [saving,    setSaving]      = useState(false)
  const [error,     setError]       = useState(null)

  const load = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    setError(null)
    try {
      const [{ data: eq }, { data: devs }] = await Promise.all([
        supabase.from('pharmacy_equipment').select('*').eq('pharmacy_id', pharmacyId).maybeSingle(),
        supabase.from('pharmacy_it_devices').select('*').eq('pharmacy_id', pharmacyId).order('created_at'),
      ])
      setEquipment(eq || {})
      setDevices(devs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pharmacyId])

  const saveEquipment = useCallback(async (data) => {
    setSaving(true)
    setError(null)
    try {
      const payload = { ...data, pharmacy_id: pharmacyId }
      const { error: err } = equipment?.id
        ? await supabase.from('pharmacy_equipment').update(payload).eq('id', equipment.id)
        : await supabase.from('pharmacy_equipment').insert(payload)
      if (err) throw err
      await load()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [pharmacyId, equipment, load])

  const saveDevice = useCallback(async (device) => {
    setSaving(true)
    setError(null)
    try {
      const payload = { ...device, pharmacy_id: pharmacyId }
      const { error: err } = device.id
        ? await supabase.from('pharmacy_it_devices').update(payload).eq('id', device.id)
        : await supabase.from('pharmacy_it_devices').insert(payload)
      if (err) throw err
      await load()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [pharmacyId, load])

  const deleteDevice = useCallback(async (deviceId) => {
    const { error: err } = await supabase.from('pharmacy_it_devices').delete().eq('id', deviceId)
    if (err) throw err
    setDevices(prev => prev.filter(d => d.id !== deviceId))
  }, [])

  /**
   * Copia todos los dispositivos IT de otra farmacia a esta.
   * Omite los campos id, pharmacy_id y created_at del origen.
   */
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
      const { error: insertErr } = await supabase.from('pharmacy_it_devices').insert(payload)
      if (insertErr) throw insertErr
      await load()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [pharmacyId, load])

  /**
   * Duplica un dispositivo existente en la misma farmacia.
   */
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
      const payload = { ...rest, nombre: `${rest.nombre || rest.tipo || 'Equipo'} (copia)` }
      const { error: insertErr } = await supabase.from('pharmacy_it_devices').insert(payload)
      if (insertErr) throw insertErr
      await load()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [load])

  return {
    equipment, devices, loading, saving, error,
    load, saveEquipment, saveDevice, deleteDevice,
    copyDevicesFromPharmacy, duplicateDevice,
  }
}
