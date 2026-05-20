// Componente reutilizable de valoración por estrellas (1-5)
export default function StarRating({ value = 0, onChange, label }) {
  return (
    <div>
      {label && <label className="label mb-1">{label}</label>}
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className={`text-xl leading-none transition-colors ${
              n <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-200'
            }`}
          >
            ★
          </button>
        ))}
        {value > 0 && <span className="text-xs text-gray-400 ml-1">{value} / 5</span>}
      </div>
    </div>
  )
}
