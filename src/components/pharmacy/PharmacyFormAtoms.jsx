// Átomos UI compartidos entre formularios de farmacia

export function Label({ children, required }) {
  return (
    <label className="block text-xs font-medium text-gray-600 mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
    >
      {children}
    </select>
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
    />
  )
}

export function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="border-b border-gray-100 pb-2">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function ToggleBtn({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`py-2 px-5 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? 'bg-teal-600 text-white border-teal-600'
          : disabled
          ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
          : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
      }`}
    >
      {children}
    </button>
  )
}

export function ChipBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
        active
          ? 'bg-teal-600 text-white border-teal-600'
          : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
      }`}
    >
      {children}
    </button>
  )
}

export function SatisfactionSelect({ value, onChange }) {
  return (
    <Select value={value} onChange={onChange}>
      <option value="">Grado de satisfacción con distribuidor actual</option>
      {[1, 2, 3, 4, 5].map(n => (
        <option key={n} value={n}>
          {n} — {['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][n - 1]}
        </option>
      ))}
    </Select>
  )
}

// VitekaCheck: solo se renderiza si showViteka=true
export function VitekaCheck({ value, onChange, showViteka = true }) {
  if (!showViteka) return null
  return (
    <label className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg cursor-pointer select-none">
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-teal-600"
      />
      <span className="text-sm text-teal-800">Viteka es distribuidor / soporte</span>
    </label>
  )
}

const YEARS = Array.from({ length: 31 }, (_, i) => 2026 - i)

export function YearSelect({ value, onChange }) {
  return (
    <Select value={value} onChange={onChange}>
      <option value="">Año</option>
      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
    </Select>
  )
}

// Badge de Viteka para vistas de solo lectura
export function VitekaBadge({ value }) {
  if (!value) return null
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">Viteka</span>
}

// Badge de satisfacción para vistas de solo lectura
export function SatisfactionBadge({ value }) {
  if (!value) return <span className="text-gray-400 text-xs">-</span>
  const colors = ['','bg-red-100 text-red-600','bg-orange-100 text-orange-600','bg-yellow-100 text-yellow-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700']
  const labels = ['','Muy malo','Malo','Regular','Bueno','Excelente']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[value]}`}>
      {value}/5 — {labels[value]}
    </span>
  )
}
