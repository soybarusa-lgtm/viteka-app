import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PROVINCES_LABEL = {
  almeria: 'Almería',
  cadiz:   'Cádiz',
  cordoba: 'Córdoba',
  granada: 'Granada',
  huelva:  'Huelva',
  jaen:    'Jaén',
  malaga:  'Málaga',
  sevilla: 'Sevilla',
}

/**
 * Devuelve por provincia:
 *  - total de farmacias
 *  - cuántas tienen equipos de marca Nixfarma, Cashlogy, Hanshow
 */
export function usePharmacyKpis(companyId) {
  const [rows,    setRows]    = useState([])
  const [totals,  setTotals]  = useState({ pharmacies: 0, nixfarma: 0, cashlogy: 0, hanshow: 0 })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    if (!companyId) return
    setLoading(true); setError(null)
    try {
      // Todas las farmacias de la empresa
      const { data: pharmacies, error: pErr } = await supabase
        .from('pharmacies')
        .select('id, province')
        .eq('company_id', companyId)
      if (pErr) throw pErr

      // Equipos con brand relevante (una fila por farmacia+marca única)
      const { data: equipment, error: eErr } = await supabase
        .from('pharmacy_equipment')
        .select('pharmacy_id, brand')
        .eq('company_id', companyId)
        .in('brand', ['Nixfarma', 'Cashlogy', 'Hanshow'])
      if (eErr) throw eErr

      // Índice: pharmacy_id → Set de marcas presentes
      const brandsByPharmacy = {}
      for (const eq of equipment) {
        if (!brandsByPharmacy[eq.pharmacy_id]) brandsByPharmacy[eq.pharmacy_id] = new Set()
        brandsByPharmacy[eq.pharmacy_id].add(eq.brand)
      }

      // Agrupación por provincia
      const byProvince = {}
      for (const ph of pharmacies) {
        const prov = ph.province || 'sin_provincia'
        if (!byProvince[prov]) byProvince[prov] = { total: 0, nixfarma: 0, cashlogy: 0, hanshow: 0 }
        byProvince[prov].total++
        const brands = brandsByPharmacy[ph.id] || new Set()
        if (brands.has('Nixfarma')) byProvince[prov].nixfarma++
        if (brands.has('Cashlogy')) byProvince[prov].cashlogy++
        if (brands.has('Hanshow'))  byProvince[prov].hanshow++
      }

      const sorted = Object.entries(byProvince)
        .map(([prov, counts]) => ({
          province: prov,
          label: PROVINCES_LABEL[prov] || prov,
          ...counts,
        }))
        .sort((a, b) => b.total - a.total)

      setRows(sorted)
      setTotals({
        pharmacies: pharmacies.length,
        nixfarma:   sorted.reduce((s, r) => s + r.nixfarma, 0),
        cashlogy:   sorted.reduce((s, r) => s + r.cashlogy, 0),
        hanshow:    sorted.reduce((s, r) => s + r.hanshow,  0),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => { fetch() }, [fetch])

  return { rows, totals, loading, error, refetch: fetch }
}
