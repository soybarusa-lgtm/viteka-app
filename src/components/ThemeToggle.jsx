/**
 * ThemeToggle
 * Botón compacto para alternar entre light y dark.
 * Muestra un badge de estado cuando el tema es 'alert' o 'focus'.
 */
export default function ThemeToggle({ theme, userTheme, onToggle }) {
  const isAlert  = theme === 'alert'
  const isFocus  = theme === 'focus'
  const isDark   = userTheme === 'dark'

  return (
    <div className="flex items-center gap-2">
      {/* Badge de estado contextual */}
      {isAlert && (
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--danger)] ring-1 ring-[var(--danger)]/20 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
          Incidencia crítica
        </span>
      )}
      {isFocus && (
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Tarea vencida
        </span>
      )}

      {/* Toggle light / dark */}
      <button
        type="button"
        onClick={onToggle}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
      >
        {isDark ? <IconSun /> : <IconMoon />}
      </button>
    </div>
  )
}

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}
