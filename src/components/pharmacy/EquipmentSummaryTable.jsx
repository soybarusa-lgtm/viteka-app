import { useMemo, useState } from 'react'

function NameWithRating({ name, rating }) {
  if (!name) return <span className="text-gray-200">—</span>
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-gray-700">{name}</span>
      {rating ? (
        <span className="whitespace-nowrap text-xs font-medium text-yellow-500">
          ★{Number(rating)}
        </span>
      ) : null}
    </span>
  )
}

function StatusBadge({ value }) {
  if (!value || value === 'NO') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Sin producto
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
      Activo
    </span>
  )
}

function VitekaBadge({ isViteka }) {
  if (!isViteka) return null
  return <img src="/brand/favicon.svg" alt="Viteka" title="Producto Viteka" className="ml-2 inline-block h-4 w-4 shrink-0" />
}

const SORT_DIRS = { asc: 'desc', desc: 'asc' }

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span className="ml-1 text-gray-300">↕</span>
  return <span className="ml-1 text-teal-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

function detailFor(eq, key) {
  return eq?.[key] || {}
}

function customValue(value, detail = {}) {
  if (value !== 'Otro') return value
  return detail?.otro || 'Otro'
}

function buildRows(eq) {
  if (!eq) return []

  return [
    {
      key: 'erp',
      producto: 'ERP',
      marca: customValue(eq.erp, eq.erp_detail) || '—',
      modelo: eq.erp_detail?.licencia ? `Lic: ${eq.erp_detail.licencia}` : '',
      anio: eq.erp_detail?.year || '',
      distribuidor: detailFor(eq, 'erp_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'erp_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'erp_detail').soporte || '',
      val_soporte: detailFor(eq, 'erp_detail').val_soporte || '',
      estado: eq.erp && eq.erp !== 'NO' ? 'SI' : 'NO',
      is_viteka: Boolean(eq.erp_viteka),
    },
    {
      key: 'caja',
      producto: 'Caja de cobro',
      marca: customValue(eq.caja, eq.cash_detail) || '—',
      modelo: eq.caja === 'Otro' ? '' : (eq.caja_modelo || ''),
      anio: eq.caja_year || '',
      distribuidor: detailFor(eq, 'cash_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'cash_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'cash_detail').soporte || '',
      val_soporte: detailFor(eq, 'cash_detail').val_soporte || '',
      estado: eq.caja && eq.caja !== 'NO' ? 'SI' : 'NO',
      is_viteka: Boolean(eq.caja_viteka),
    },
    {
      key: 'esl',
      producto: 'Etiquetas ESL',
      marca: customValue(eq.esl, eq.esl_detail) || '—',
      modelo: '',
      anio: eq.esl_year || '',
      distribuidor: detailFor(eq, 'esl_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'esl_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'esl_detail').soporte || '',
      val_soporte: detailFor(eq, 'esl_detail').val_soporte || '',
      estado: eq.esl && eq.esl !== 'NO' ? 'SI' : 'NO',
      is_viteka: Boolean(eq.esl_viteka),
    },
    {
      key: 'bascula',
      producto: 'Báscula',
      marca: customValue(eq.bascula, eq.scale_detail) || '—',
      modelo: '',
      anio: eq.bascula_year || '',
      distribuidor: detailFor(eq, 'scale_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'scale_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'scale_detail').soporte || '',
      val_soporte: detailFor(eq, 'scale_detail').val_soporte || '',
      estado: eq.bascula && eq.bascula !== 'NO' ? 'SI' : 'NO',
      is_viteka: Boolean(eq.bascula_viteka),
    },
    {
      key: 'antihurto',
      producto: 'Arco antihurto',
      marca: customValue(eq.antihurto, eq.antitheft_detail) || '—',
      modelo: '',
      anio: eq.antihurto_year || '',
      distribuidor: detailFor(eq, 'antitheft_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'antitheft_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'antitheft_detail').soporte || '',
      val_soporte: detailFor(eq, 'antitheft_detail').val_soporte || '',
      estado: eq.antihurto && eq.antihurto !== 'NO' ? 'SI' : 'NO',
      is_viteka: false,
    },
    {
      key: 'consultoria',
      producto: 'Consultoría',
      marca: eq.consultoria || '—',
      modelo: eq.consultoria_detail?.otro || '',
      anio: eq.consultoria_detail?.year || '',
      distribuidor: detailFor(eq, 'consulting_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'consulting_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'consulting_detail').soporte || '',
      val_soporte: detailFor(eq, 'consulting_detail').val_soporte || '',
      estado: eq.consultoria && eq.consultoria !== 'NO' ? 'SI' : 'NO',
      is_viteka: Boolean(eq.consultoria_viteka),
    },
    {
      key: 'robot',
      producto: 'Robot dispensador',
      marca: customValue(eq.robot, eq.robot_detail) || '—',
      modelo: '',
      anio: eq.robot_year || '',
      distribuidor: detailFor(eq, 'robot_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'robot_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'robot_detail').soporte || '',
      val_soporte: detailFor(eq, 'robot_detail').val_soporte || '',
      estado: eq.robot && eq.robot !== 'NO' ? 'SI' : 'NO',
      is_viteka: false,
    },
    {
      key: 'cruz',
      producto: 'Cruz luminosa',
      marca: eq.cruz && eq.cruz !== 'NO' ? `${eq.cruz_cantidad ?? 1} unidad(es)` : '—',
      modelo: eq.cruz_ampliacion ? `Ampliación: ${eq.cruz_ampliacion}` : '',
      anio: '',
      distribuidor: '',
      val_distribuidor: '',
      soporte: '',
      val_soporte: '',
      estado: eq.cruz && eq.cruz !== 'NO' ? 'SI' : 'NO',
      is_viteka: false,
    },
    {
      key: 'gestor_turnos',
      producto: 'Gestor de turnos',
      marca: eq.gestor_turnos_marca || (eq.gestor_turnos === 'SI' ? 'Sí' : '—'),
      modelo: '',
      anio: eq.gestor_turnos_year || '',
      distribuidor: detailFor(eq, 'queue_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'queue_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'queue_detail').soporte || '',
      val_soporte: detailFor(eq, 'queue_detail').val_soporte || '',
      estado: eq.gestor_turnos === 'SI' ? 'SI' : 'NO',
      is_viteka: false,
    },
    {
      key: 'spd',
      producto: 'SPD',
      marca: eq.spd_marca || (eq.spd === 'SI' ? 'Sí' : '—'),
      modelo: '',
      anio: eq.spd_year || '',
      distribuidor: detailFor(eq, 'spd_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'spd_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'spd_detail').soporte || '',
      val_soporte: detailFor(eq, 'spd_detail').val_soporte || '',
      estado: eq.spd === 'SI' ? 'SI' : 'NO',
      is_viteka: false,
    },
    (() => {
      const pantallasDetail = eq.pantallas_detail || {}
      return {
        key: 'pantallas',
        producto: 'Pantallas',
        marca: pantallasDetail.marca || (eq.pantallas === 'SI' ? 'Sí' : '—'),
        modelo: Array.isArray(pantallasDetail.ubicaciones) && pantallasDetail.ubicaciones.length
          ? pantallasDetail.ubicaciones.join(', ')
          : '',
        anio: pantallasDetail.year || '',
        distribuidor: detailFor(eq, 'screens_detail').distribuidor || '',
        val_distribuidor: detailFor(eq, 'screens_detail').val_distribuidor || '',
        soporte: detailFor(eq, 'screens_detail').soporte || '',
        val_soporte: detailFor(eq, 'screens_detail').val_soporte || '',
        estado: eq.pantallas === 'SI' ? 'SI' : 'NO',
        is_viteka: false,
      }
    })(),
    {
      key: 'frigorifico',
      producto: 'Frigorífico',
      marca: eq.frigorifico_marca || '—',
      modelo: '',
      anio: eq.frigorifico_year || '',
      distribuidor: detailFor(eq, 'fridge_detail').distribuidor || '',
      val_distribuidor: detailFor(eq, 'fridge_detail').val_distribuidor || '',
      soporte: detailFor(eq, 'fridge_detail').soporte || '',
      val_soporte: detailFor(eq, 'fridge_detail').val_soporte || '',
      estado: eq.frigorifico_marca ? 'SI' : 'NO',
      is_viteka: Boolean(eq.frigorifico_viteka),
    },
  ]
}

const COLS = [
  { key: 'producto', label: 'Producto', sortable: true },
  { key: 'marca', label: 'Marca / Modelo', sortable: true },
  { key: 'anio', label: 'Año', sortable: true },
  { key: 'distribuidor', label: 'Distribuidor', sortable: true },
  { key: 'soporte', label: 'Soporte', sortable: true },
  { key: 'estado', label: 'Estado', sortable: true },
]

export default function EquipmentSummaryTable({ equipment, searchQuery = '', onRowClick }) {
  const [sortCol, setSortCol] = useState('producto')
  const [sortDir, setSortDir] = useState('asc')
  const [filter, setFilter] = useState('all')

  function handleSort(col) {
    if (!COLS.find(column => column.key === col)?.sortable) return
    setSortDir(prev => (sortCol === col ? SORT_DIRS[prev] : 'asc'))
    setSortCol(col)
  }

  const rows = useMemo(() => {
    let base = buildRows(equipment)
    if (filter === 'viteka') base = base.filter(row => row.is_viteka)
    if (filter === 'active') base = base.filter(row => row.estado === 'SI')

    const query = searchQuery.trim().toLocaleLowerCase('es')
    if (query) {
      base = base.filter(row => Object.values(row).filter(Boolean).join(' ').toLocaleLowerCase('es').includes(query))
    }

    return [...base].sort((a, b) => {
      const av = String(a[sortCol] ?? '').toLowerCase()
      const bv = String(b[sortCol] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [equipment, filter, searchQuery, sortCol, sortDir])

  if (!equipment) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    )
  }

  const activeCount = rows.filter(row => row.estado === 'SI').length
  const vitekaCount = rows.filter(row => row.is_viteka).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <span className="text-xs text-gray-400">
            {activeCount} activo{activeCount !== 1 ? 's' : ''} · {vitekaCount} Viteka
          </span>
          {onRowClick && (
            <p className="mt-1 text-[11px] text-slate-400">Pulsa cualquier fila para ver el detalle y editar ese equipamiento.</p>
          )}
        </div>
        <div className="ml-auto flex gap-1">
          {[['all', 'Todos'], ['active', 'Activos'], ['viteka', 'Viteka']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === value ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full table-auto text-sm">
          <thead className="bg-gray-50">
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${
                    col.sortable ? 'cursor-pointer hover:text-teal-600' : ''
                  }`}
                >
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map(row => (
              <tr
                key={row.key}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  row.estado === 'NO'
                    ? 'opacity-40'
                    : row.is_viteka
                      ? 'bg-green-50/40 hover:bg-green-50'
                      : 'hover:bg-gray-50'
                } ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{row.producto}</span>
                    <VitekaBadge isViteka={row.is_viteka} />
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <span className="font-medium">{row.marca}</span>
                  {row.modelo && <span className="block text-xs text-gray-400">{row.modelo}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                  {row.anio || <span className="text-gray-200">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <NameWithRating name={row.distribuidor} rating={row.val_distribuidor} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <NameWithRating name={row.soporte} rating={row.val_soporte} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={row.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
          Sin equipamiento con esos filtros.
        </p>
      )}
    </div>
  )
}
