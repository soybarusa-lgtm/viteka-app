// arbol.json vive en /public y se carga de forma lazy.
// Se cachea en módulo para que solo haya un fetch por sesión.
let _cache = null

async function loadTree() {
  if (_cache) return _cache
  const res = await fetch('/arbol.json')
  if (!res.ok) throw new Error(`No se pudo cargar arbol.json: ${res.status}`)
  _cache = await res.json()
  return _cache
}

/**
 * Devuelve el objeto { [provincia]: [{ name, postalCodes }] }
 * Misma forma que el export estático anterior, pero async.
 */
export async function getProvincesAndCities() {
  const tree = await loadTree()
  const andalucia = tree.find(item => item.label === 'Andalucía')
  const provinces = andalucia?.provinces || []

  return provinces.reduce((acc, province) => {
    acc[province.label] = province.towns.map(town => ({
      name: town.label,
      postalCodes: [],
    }))
    return acc
  }, {})
}

/**
 * Helper síncrono para componentes que ya hayan precargado.
 * Lanza si se llama antes de que la carga haya terminado.
 */
export function getProvincesAndCitiesSync() {
  if (!_cache) throw new Error('arbol.json no está cargado aún. Usa getProvincesAndCities() primero.')
  const andalucia = _cache.find(item => item.label === 'Andalucía')
  const provinces = andalucia?.provinces || []
  return provinces.reduce((acc, province) => {
    acc[province.label] = province.towns.map(town => ({
      name: town.label,
      postalCodes: [],
    }))
    return acc
  }, {})
}

/**
 * Precarga el JSON en background. Llamar en el punto de entrada
 * de la app (main.jsx o el componente raíz) para que esté listo
 * cuando el usuario llegue al formulario.
 */
export function prefetchLocations() {
  loadTree().catch(() => {}) // silencioso, se reintentará cuando se necesite
}
