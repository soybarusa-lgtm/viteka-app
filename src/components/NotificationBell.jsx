import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Props:
 *  - userId: string         — ID del usuario autenticado
 *  - dark: bool             — modo sidebar oscura (icono y badge adaptados)
 *  - sidebarExpanded: bool  — si la sidebar está expandida (dropdown a la derecha)
 *  - onNavigate: fn         — callback al hacer click en notificación
 */
export default function NotificationBell({ userId, dark = false, sidebarExpanded = false, onNavigate }) {
  const wrapperRef = useRef(null)
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(false)

  // ─ Carga + suscripción realtime ───────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    loadNotifications()
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => loadNotifications())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  // ─ Click outside ──────────────────────────────────────────────────────
  useEffect(() => {
    function onOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function loadNotifications() {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    setLoading(false)
    if (!error) setNotifications(data || [])
  }

  async function openNotification(n) {
    await supabase.from('notifications').update({ read: true }).eq('id', n.id)
    await loadNotifications()
    setOpen(false)
    onNavigate?.(n)
  }

  async function markAllRead() {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    await loadNotifications()
  }

  async function deleteOne(id, e) {
    e.stopPropagation()
    await supabase.from('notifications').delete().eq('id', id)
    await loadNotifications()
  }

  async function deleteAll() {
    if (!window.confirm('¿Eliminar todas las notificaciones?')) return
    await supabase.from('notifications').delete().eq('user_id', userId)
    await loadNotifications()
  }

  const unread = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  // ─ Posición del dropdown ─────────────────────────────────────────────────
  // Siempre abre hacia la derecha desde la sidebar (left-full)
  const dropdownPos = 'left-full top-0 ml-2'

  return (
    <div ref={wrapperRef} className="relative">

      {/* ─ Botón campana ─ */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Notificaciones"
        className={`relative flex items-center gap-2.5 rounded-lg px-2 py-2 w-full transition
          ${ dark
              ? 'text-white/60 hover:bg-white/8 hover:text-white/90'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
      >
        {/* Icono campana SVG */}
        <span className="shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </span>

        {/* Badge no leídas */}
        {unread > 0 && (
          <span className="absolute left-4 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}

        {/* Label (solo sidebar expandida) */}
        {sidebarExpanded && (
          <span className="text-sm">Notificaciones</span>
        )}
        {sidebarExpanded && unread > 0 && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ─ Dropdown ─ */}
      {open && (
        <div
          className={`absolute ${dropdownPos} z-50 w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Notificaciones</h2>
              <p className="mt-0.5 text-xs text-gray-400">{unread} sin leer</p>
            </div>
            <div className="flex gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 transition">
                  Marcar leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={deleteAll}
                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 transition">
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-100">
            {loading && (
              <div className="py-10 text-center text-sm text-gray-400">Cargando...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="py-10 text-center text-sm text-gray-400">No hay notificaciones</div>
            )}
            {!loading && notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-5 py-4 transition hover:bg-gray-50 ${ !n.read ? 'bg-[#f0faf6]' : '' }`}
              >
                <button onClick={() => openNotification(n)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={getTypeClass(n.type)}>{getTypeLabel(n.type)}</span>
                    <span className="text-[11px] text-gray-400">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  {n.message && <p className="mt-1 text-xs leading-5 text-gray-500">{n.message}</p>}
                </button>
                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                  {!n.read && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                  <button onClick={(e) => deleteOne(n.id, e)}
                    className="rounded px-1.5 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getTypeClass(type) {
  const map = {
    success: 'rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700',
    warning: 'rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-700',
    error:   'rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700',
    info:    'rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700',
  }
  return map[type] || map.info
}

function getTypeLabel(type) {
  return { success: 'Éxito', warning: 'Aviso', error: 'Error', info: 'Info' }[type] || 'Info'
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}
