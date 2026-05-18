import { useState, useEffect } from 'react';

/**
 * Hook que carga arbol.json y expone:
 *  - provinces: [{ code, label }]  (todas las provincias del JSON)
 *  - getTowns(provinceLabel): [string]  (municipios de la provincia por su label)
 */
export function useSpanishLocations() {
  const [data, setData] = useState([]);

  useEffect(() => {
    import('../lib/arbol.json').then((module) => {
      const communities = module.default;
      const allProvinces = communities.flatMap((c) => c.provinces);
      setData(allProvinces);
    });
  }, []);

  const provinces = data.map((p) => ({ code: p.code, label: p.label }));

  const getTowns = (provinceLabel) => {
    if (!provinceLabel) return [];
    const province = data.find(
      (p) => p.label.toLowerCase() === provinceLabel.toLowerCase()
    );
    return province ? province.towns.map((t) => t.label) : [];
  };

  return { provinces, getTowns };
}
