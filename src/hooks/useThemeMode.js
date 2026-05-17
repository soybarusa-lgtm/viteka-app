import { useEffect, useMemo, useState } from 'react'

/**
 * useThemeMode
 * Gestiona el tema visual de la app de forma dinámica:
 * - El usuario puede elegir 'light' o 'dark'
 * - Si hay incidencias críticas abiertas → tema 'alert' automático
 * - Si hay tareas vencidas → tema 'focus' automático
 * La preferencia del usuario se persiste en localStorage.
 */
export function useThemeMode({ incidents = [], tasks = [] } = {}) {
  const [userTheme, setUserTheme] = useState(
    () => localStorage.getItem('viteka-theme') || 'light'
  )

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
    return userTheme
  }, [incidents, tasks, userTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme)
  }, [appTheme])

  useEffect(() => {
    localStorage.setItem('viteka-theme', userTheme)
  }, [userTheme])

  function toggleTheme() {
    setUserTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  return { theme: appTheme, userTheme, setUserTheme, toggleTheme }
}
