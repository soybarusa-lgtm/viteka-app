import { useEffect, useMemo, useState } from 'react'

/**
 * useThemeMode
 * Modo oscuro temporalmente deshabilitado.
 * Siempre aplica 'light' (o 'alert'/'focus' por contexto operativo).
 */
export function useThemeMode({ incidents = [], tasks = [] } = {}) {
  // Dark deshabilitado: forzamos 'light' como base siempre
  const [userTheme] = useState('light')

  const appTheme = useMemo(() => {
    const criticalOpen = incidents.filter(
      i => i.priority === 'critical' && i.status !== 'closed' && i.status !== 'resolved'
    ).length

    const overdue = tasks.filter(
      t =>
        t.status !== 'done' &&
        t.status !== 'completed' &&
        t.due_date &&
        new Date(t.due_date) < new Date()
    ).length

    if (criticalOpen > 0) return 'alert'
    if (overdue > 0) return 'focus'
    return 'light'
  }, [incidents, tasks])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme)
    // Limpia cualquier preferencia dark guardada en localStorage
    localStorage.setItem('viteka-theme', 'light')
  }, [appTheme])

  // toggleTheme no-op hasta que se reactive el dark mode
  function toggleTheme() {}
  function setUserTheme() {}

  return { theme: appTheme, userTheme, setUserTheme, toggleTheme }
}
