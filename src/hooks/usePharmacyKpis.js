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

// Valores que indican "tiene este software/equipo"
const ERP_NIXFARMA  = ['Nixfarma']
const CAJA_CASHLOGY = ['Cashlogy 1000','Cashlogy 1500','Cashlogy 2023','Maximate Safe','MaxiSafe']
const ESL_HANSHOW   = ['Hanshow']

/**
 * KPIs por provincia:
 *  - total farmacias
 *  - cuántas tienen ERP Nixfarma, Caja Cashlogy, ESL Hanshow
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
      const [{ data: pharmacies, error: pErr }, { data: equipment, error: eErr }] = await Promise.all([
        supabase.from('pharmacies').select('id, province').eq('company_id', companyId),
        supabase.from('pharmacy_equipment').select('pharmacy_id, erp, caja, esl').eq('company_id', companyId),
      ])
      if (pErr) throw pErr
      if (eErr) throw eErr

      // Índice pharmacy_id → fila de equipamiento
      const eqByPharmacy = {}
      for (const eq of (equipment || [])) {
        eqByPharmacy[eq.pharmacy_id] = eq
      }

      // Agrupación por provincia
      const byProvince = {}
      for (const ph of (pharmacies || [])) {
        const prov = ph.province || 'sin_provincia'
        if (!byProvince[prov]) byProvince[prov] = { total: 0, nixfarma: 0, cashlogy: 0, hanshow: 0 }
        byProvince[prov].total++
        const eq = eqByPharmacy[ph.id]
        if (eq) {
          if (ERP_NIXFARMA.includes(eq.erp))   byProvince[prov].nixfarma++
          if (CAJA_CASHLOGY.some(v => eq.caja?.startsWith(v.split(' ')[0]))) byProvince[prov].cashlogy++
          if (ESL_HANSHOW.includes(eq.esl))    byProvince[prov].hanshow++
        }
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
        pharmacies: (pharmacies || []).length,
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
