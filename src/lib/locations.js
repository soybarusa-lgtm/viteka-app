import tree from './arbol.json'

const andalucia = tree.find(
  item => item.label === 'Andalucía'
)

const provinces = andalucia?.provinces || []

export const PROVINCES_AND_CITIES = provinces.reduce(
  (acc, province) => {
    acc[province.label] = province.towns.map(town => ({
      name: town.label,
      postalCodes: [],
    }))

    return acc
  },
  {}
)