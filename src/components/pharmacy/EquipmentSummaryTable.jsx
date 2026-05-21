import { useState, useMemo } from 'react'

// ── Helpers ─────────────────────────────────────────────────────────────────
function NameWithRating({ name, rating }) {
  if (!name) return <span className="text-gray-200">—</span>
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span className="text-gray-700">{name}</span>
      {rating ? (
        <span className="text-yellow-500 text-xs font-medium whitespace-nowrap">
          ★{Number(rating)}
        </span>
      ) : null}
    </span>
  )
}

function StatusBadge({ value }) {
  if (!value || value === 'NO')
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Sin producto</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">Activo</span>
}

/** Recuadro verde con favicon + "Viteka" */
function VitekaBadge({ is_viteka }) {
  if (!is_viteka) return null
  return (
    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-green-400 bg-green-50 text-green-700 text-[10px] font-semibold whitespace-nowrap">
      <img src="/favicon.svg" alt="" className="w-3 h-3 shrink-0" />
      Viteka
    </span>
  )
}

const SORT_DIRS = { asc: 'desc', desc: 'asc' }

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span className="ml-1 text-gray-300">↕</span>
  return <span className="ml-1 text-teal-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

// ── Row builder ──────────────────────────────────────────────────────────────
function buildRows(eq) {
  if (!eq) return []
  const d = (key) => eq[key] || {}

  return [
    {
      key: 'erp', producto: 'ERP',
      marca: eq.erp || '—', modelo: eq.erp_detail?.licencia ? `Lic: ${eq.erp_detail.licencia}` : '',
      anio: eq.erp_detail?.year || '',
      distribuidor: d('erp_detail').distribuidor || '', val_distribuidor: d('erp_detail').val_distribuidor || '',
      soporte: d('erp_detail').soporte || '', val_soporte: d('erp_detail').val_soporte || '',
      estado: eq.erp && eq.erp !== 'NO' ? 'SI' : 'NO', is_viteka: !!eq.erp_viteka,
    },
    {
      key: 'caja', producto: 'Caja de cobro',
      marca: eq.caja || '—', modelo: eq.caja_modelo || '',
      anio: eq.caja_year || '',
      distribuidor: d('cash_detail').distribuidor || '', val_distribuidor: d('cash_detail').val_distribuidor || '',
      soporte: d('cash_detail').soporte || '', val_soporte: d('cash_detail').val_soporte || '',
      estado: eq.caja && eq.caja !== 'NO' ? 'SI' : 'NO', is_viteka: !!eq.caja_viteka,
    },
    {
      key: 'esl', producto: 'Etiquetas ESL',
      marca: eq.esl || '—', modelo: '',
      anio: eq.esl_year || '',
      distribuidor: d('esl_detail').distribuidor || '', val_distribuidor: d('esl_detail').val_distribuidor || '',
      soporte: d('esl_detail').soporte || '', val_soporte: d('esl_detail').val_soporte || '',
      estado: eq.esl && eq.esl !== 'NO' ? 'SI' : 'NO', is_viteka: !!eq.esl_viteka,
    },
    {
      key: 'bascula', producto: 'Báscula',
      marca: eq.bascula || '—', modelo: '',
      anio: eq.bascula_year || '',
      distribuidor: d('scale_detail').distribuidor || '', val_distribuidor: d('scale_detail').val_distribuidor || '',
      soporte: d('scale_detail').soporte || '', val_soporte: d('scale_detail').val_soporte || '',
      estado: eq.bascula && eq.bascula !== 'NO' ? 'SI' : 'NO', is_viteka: !!eq.bascula_viteka,
    },
    {
      key: 'antihurto', producto: 'Arco antihurto',
      marca: eq.antihurto || '—', modelo: '',
      anio: eq.antihurto_year || '',
      distribuidor: d('antitheft_detail').distribuidor || '', val_distribuidor: d('antitheft_detail').val_distribuidor || '',
      soporte: d('antitheft_detail').soporte || '', val_soporte: d('antitheft_detail').val_soporte || '',
      estado: eq.antihurto && eq.antihurto !== 'NO' ? 'SI' : 'NO', is_viteka: false,
    },
    {
      key: 'consultoria', producto: 'Consultoría',
      marca: eq.consultoria || '—', modelo: eq.consultoria_detail?.otro || '',
      anio: eq.consultoria_detail?.year || '',
      distribuidor: d('consulting_detail').distribuidor || '', val_distribuidor: d('consulting_detail').val_distribuidor || '',
      soporte: d('consulting_detail').soporte || '', val_soporte: d('consulting_detail').val_soporte || '',
      estado: eq.consultoria && eq.consultoria !== 'NO' ? 'SI' : 'NO', is_viteka: !!eq.consultoria_viteka,
    },
    {
      key: 'robot', producto: 'Robot dispensador',
      marca: eq.robot || '—', modelo: '',
      anio: eq.robot_year || '',
      distribuidor: d('robot_detail').distribuidor || '', val_distribuidor: d('robot_detail').val_distribuidor || '',
      soporte: d('robot_detail').soporte || '', val_soporte: d('robot_detail').val_soporte || '',
      estado: eq.robot && eq.robot !== 'NO' ? 'SI' : 'NO', is_viteka: false,
    },
    {
      key: 'cruz', producto: 'Cruz luminosa',
      marca: eq.cruz && eq.cruz !== 'NO' ? `${eq.cruz_cantidad ?? 1} unidad(es)` : '—',
      modelo: eq.cruz_ampliacion ? `Ampliación: ${eq.cruz_ampliacion}` : '',
      anio: '', distribuidor: '', val_distribuidor: '', soporte: '', val_soporte: '',
      estado: eq.cruz && eq.cruz !== 'NO' ? 'SI' : 'NO', is_viteka: false,
    },
    {
      key: 'gestor_turnos', producto: 'Gestor de turnos',
      marca: eq.gestor_turnos_marca || (eq.gestor_turnos === 'SI' ? 'Sí' : '—'), modelo: '',
      anio: eq.gestor_turnos_year || '',
      distribuidor: d('queue_detail').distribuidor || '', val_distribuidor: d('queue_detail').val_distribuidor || '',
      soporte: d('queue_detail').soporte || '', val_soporte: d('queue_detail').val_soporte || '',
      estado: eq.gestor_turnos === 'SI' ? 'SI' : 'NO', is_viteka: false,
    },
    {
      key: 'spd', producto: 'SPD',
      marca: eq.spd_marca || (eq.spd === 'SI' ? 'Sí' : '—'), modelo: '',
      anio: eq.spd_year || '',
      distribuidor: d('spd_detail').distribuidor || '', val_distribuidor: d('spd_detail').val_distribuidor || '',
      soporte: d('spd_detail').soporte || '', val_soporte: d('spd_detail').val_soporte || '',
      estado: eq.spd === 'SI' ? 'SI' : 'NO', is_viteka: false,
    },
    (() => {
      const pant_d = eq.pantallas_detail || {}
      return {
        key: 'pantallas', producto: 'Pantallas',
        marca: pant_d.marca || (eq.pantallas === 'SI' ? 'Sí' : '—'),
        modelo: Array.isArray(pant_d.ubicaciones) && pant_d.ubicaciones.length ? pant_d.ubicaciones.join(', ') : '',
        anio: pant_d.year || '',
        distribuidor: d('screens_detail').distribuidor || '', val_distribuidor: d('screens_detail').val_distribuidor || '',
        soporte: d('screens_detail').soporte || '', val_soporte: d('screens_detail').val_soporte || '',
        estado: eq.pantallas === 'SI' ? 'SI' : 'NO', is_viteka: false,
      }
    })(),
    {
      key: 'frigorifico', producto: 'Frigorífico',
      marca: eq.frigorifico_marca || '—', modelo: '',
      anio: eq.frigorifico_year || '',
      distribuidor: d('fridge_detail').distribuidor || '', val_distribuidor: d('fridge_detail').val_distribuidor || '',
      soporte: d('fridge_detail').soporte || '', val_soporte: d('fridge_detail').val_soporte || '',
      estado: eq.frigorifico_marca ? 'SI' : 'NO', is_viteka: !!eq.frigorifico_viteka,
    },
  ]
}

// ── Columnas (6) ─────────────────────────────────────────────────────────────
const COLS = [
  { key: 'producto',     label: 'Producto',       sortable: true },
  { key: 'marca',        label: 'Marca / Modelo', sortable: true },
  { key: 'anio',         label: 'Año',            sortable: true },
  { key: 'distribuidor', label: 'Distribuidor',   sortable: true },
  { key: 'soporte',      label: 'Soporte',        sortable: true },
  { key: 'estado',       label: 'Estado',         sortable: true },
]

// ── Component ────────────────────────────────────────────────────────────────
export default function EquipmentSummaryTable({ equipment }) {
  const [sortCol, setSortCol] = useState('producto')
  const [sortDir, setSortDir] = useState('asc')
  const [filter,  setFilter]  = useState('all')

  function handleSort(col) {
    if (!COLS.find(c => c.key === col)?.sortable) return
    setSortDir(prev => sortCol === col ? SORT_DIRS[prev] : 'asc')
    setSortCol(col)
  }

  const rows = useMemo(() => {
    let base = buildRows(equipment)
    if (filter === 'viteka') base = base.filter(r => r.is_viteka)
    if (filter === 'active') base = base.filter(r => r.estado === 'SI')
    return [...base].sort((a, b) => {
      const av = String(a[sortCol] ?? '').toLowerCase()
      const bv = String(b[sortCol] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [equipment, sortCol, sortDir, filter])

  if (!equipment) return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeCount = rows.filter(r => r.estado === 'SI').length
  const vitekaCount = rows.filter(r => r.is_viteka).length

  return (
    <div className="space-y-4">
      {/* Filtros rápidos */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-400">
          {activeCount} activo{activeCount !== 1 ? 's' : ''} · {vitekaCount} Viteka
        </span>
        <div className="flex gap-1 ml-auto">
          {[['all','Todos'],['active','Activos'],['viteka','Viteka']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filter === val ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full table-auto text-sm">
          <thead className="bg-gray-50">
            <tr>
              {COLS.map(col => (
                <th key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap select-none ${
                    col.sortable ? 'cursor-pointer hover:text-teal-600' : ''
                  }`}>
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map(row => (
              <tr key={row.key}
                className={`transition-colors ${
                  row.estado === 'NO'
                    ? 'opacity-40'
                    : row.is_viteka
                      ? 'bg-green-50/40 hover:bg-green-50'
                      : 'hover:bg-gray-50'
                }`}>

                {/* Producto */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{row.producto}</span>
                    <VitekaBadge is_viteka={row.is_viteka} />
                  </div>
                </td>

                {/* Marca / Modelo */}
                <td className="px-4 py-3 text-gray-700">
                  <span className="font-medium">{row.marca}</span>
                  {row.modelo && <span className="text-xs text-gray-400 block">{row.modelo}</span>}
                </td>

                {/* Año */}
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {row.anio || <span className="text-gray-200">—</span>}
                </td>

                {/* Distribuidor + valoración */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <NameWithRating name={row.distribuidor} rating={row.val_distribuidor} />
                </td>

                {/* Soporte + valoración */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <NameWithRating name={row.soporte} rating={row.val_soporte} />
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <StatusBadge value={row.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
