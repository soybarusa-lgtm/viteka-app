import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PROVINCES = {
  almeria: 'Almería', cadiz: 'Cádiz', cordoba: 'Córdoba', granada: 'Granada',
  huelva: 'Huelva', jaen: 'Jaén', malaga: 'Málaga', sevilla: 'Sevilla',
}

export function usePharmacyKpis(companyId) {
  const [rows,    setRows]    = useState([])
  const [totals,  setTotals]  = useState({ pharmacies: 0, nixfarma: 0, cashlogy: 0, hanshow: 0 })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true); setError(null)
    try {
      const [{ data: phs, error: pErr }, { data: eqs, error: eErr }] = await Promise.all([
        supabase.from('pharmacies').select('id, province').eq('company_id', companyId),
        supabase.from('pharmacy_equipment').select('pharmacy_id, erp, caja, esl').eq('company_id', companyId),
      ])
      if (pErr) throw pErr
      if (eErr) throw eErr

      const eqMap = {}
      for (const eq of (eqs || [])) eqMap[eq.pharmacy_id] = eq

      const byProv = {}
      for (const ph of (phs || [])) {
        const p = ph.province || 'sin_provincia'
        if (!byProv[p]) byProv[p] = { total: 0, nixfarma: 0, cashlogy: 0, hanshow: 0 }
        byProv[p].total++
        const eq = eqMap[ph.id]
        if (eq) {
          if (eq.erp  === 'Nixfarma') byProv[p].nixfarma++
          if (eq.caja === 'Cashlogy') byProv[p].cashlogy++
          if (eq.esl  === 'Hanshow')  byProv[p].hanshow++
        }
      }

      const sorted = Object.entries(byProv)
        .map(([prov, c]) => ({ province: prov, label: PROVINCES[prov] || prov, ...c }))
        .sort((a, b) => b.total - a.total)

      setRows(sorted)
      setTotals({
        pharmacies: (phs || []).length,
        nixfarma:  sorted.reduce((s, r) => s + r.nixfarma,  0),
        cashlogy:  sorted.reduce((s, r) => s + r.cashlogy, 0),
        hanshow:   sorted.reduce((s, r) => s + r.hanshow,   0),
      })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [companyId])

  // Loading on mount intentionally synchronizes this hook with Supabase.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])
  return { rows, totals, loading, error, refetch: load }
}
