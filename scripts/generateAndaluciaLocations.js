import fs from 'fs'

const CSV_URL =
  'https://raw.githubusercontent.com/inigoflores/ds-codigos-postales-ine-es/master/data/codigos_postales_municipios.csv'

const ANDALUCIA_PROVINCES = new Set([
  'Almería',
  'Cádiz',
  'Córdoba',
  'Granada',
  'Huelva',
  'Jaén',
  'Málaga',
  'Sevilla',
])

const response = await fetch(CSV_URL)
const csv = await response.text()

const lines = csv.trim().split('\n')
const headers = lines[0].split(',')

const result = {}

for (const line of lines.slice(1)) {
  const values = line.split(',')

  const row = Object.fromEntries(
    headers.map((header, index) => [header.trim(), values[index]?.trim()])
  )

  const province = row.provincia
  const city = row.municipio
  const postalCode = String(row.codigo_postal || '').padStart(5, '0')

  if (!ANDALUCIA_PROVINCES.has(province)) continue
  if (!city || !postalCode) continue

  if (!result[province]) result[province] = []

  let cityItem = result[province].find(item => item.name === city)

  if (!cityItem) {
    cityItem = {
      name: city,
      postalCodes: [],
    }

    result[province].push(cityItem)
  }

  if (!cityItem.postalCodes.includes(postalCode)) {
    cityItem.postalCodes.push(postalCode)
  }
}

const sortedResult = Object.fromEntries(
  Object.entries(result)
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([province, cities]) => [
      province,
      cities
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        .map(city => ({
          ...city,
          postalCodes: city.postalCodes.sort(),
        })),
    ])
)

fs.writeFileSync(
  'src/lib/locations.generated.json',
  JSON.stringify(sortedResult, null, 2)
)

console.log('Archivo generado: src/lib/locations.generated.json')
console.log('Provincias:', Object.keys(sortedResult).length)