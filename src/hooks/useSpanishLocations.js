import { useState, useEffect } from 'react'

/**
 * Carga arbol.json desde /public vía fetch y expone:
 *  - provinces:           [{ code, label }]      (todas las provincias)
 *  - getTowns(label):    [string]                (municipios por label)
 *  - cities:              [string]                (poblaciones de la provincia seleccionada)
 *  - setSelectedProvince: (value) => void        (actualiza cities)
 */
export function useSpanishLocations() {
  const [data, setData] = useState([])
  const [selectedProvince, setSelectedProvince] = useState('')

  useEffect(() => {
    fetch('/arbol.json')
      .then((res) => res.json())
      .then((communities) => {
        const allProvinces = communities.flatMap((c) => c.provinces)
        setData(allProvinces)
      })
      .catch((e) => console.error('Error cargando arbol.json', e))
  }, [])

  const provinces = data.map((p) => ({ code: p.code, label: p.label, value: p.label }))

  const getTowns = (provinceLabel) => {
    if (!provinceLabel) return []
    const province = data.find(
      (p) => p.label.toLowerCase() === provinceLabel.toLowerCase()
    )
    return province ? province.towns.map((t) => t.label) : []
  }

  // cities: lista plana de poblaciones para la provincia seleccionada
  const cities = getTowns(selectedProvince).map((name) => ({ value: name, label: name }))

  return { provinces, getTowns, cities, setSelectedProvince }
}
