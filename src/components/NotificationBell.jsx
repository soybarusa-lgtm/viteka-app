import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NotificationBell({
  userId,
  onNavigate,
}) {
  const wrapperRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return

    loadNotifications()

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
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

    if (error) {
      console.error(error.message)
      return
    }

    setNotifications(data || [])
  }

  async function openNotification(notification) {
    await supabase
      .from('notifications')
      .update({
        read: true,
      })
      .eq('id', notification.id)

    await loadNotifications()

    setOpen(false)

    if (onNavigate) {
      onNavigate(notification)
    }
  }

  async function markAllAsRead() {
    if (!userId) return

    await supabase
      .from('notifications')
      .update({
        read: true,
      })
      .eq('user_id', userId)
      .eq('read', false)

    await loadNotifications()
  }

  async function deleteNotification(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      alert(error.message)
      return
    }

    await loadNotifications()
  }

  async function deleteAllNotifications() {
    const confirmed = window.confirm(
      '¿Eliminar todas las notificaciones?'
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (error) {
      alert(error.message)
      return
    }

    await loadNotifications()
  }

  const unreadCount = useMemo(() => {
    return notifications.filter(item => !item.read).length
  }, [notifications])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white text-sm shadow-sm transition hover:bg-[#F8FAFC]"
        title="Notificaciones"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[410px] overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
            <div>
              <h2 className="text-lg text-[#0F172A] font-medium">
                Notificaciones
              </h2>

              <p className="mt-1 text-xs text-[#64748B]">
                {unreadCount} sin leer
              </p>
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="rounded-xl bg-[#F1F5F9] px-3 py-2 text-xs text-[#334155] hover:bg-[#E2E8F0]"
                >
                  Leídas
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={deleteAllNotifications}
                  className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 hover:bg-red-100"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {loading && (
              <div className="p-8 text-center text-sm text-[#64748B]">
                Cargando...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="p-8 text-center text-sm text-[#64748B]">
                No hay notificaciones.
              </div>
            )}

            {!loading &&
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border-b border-[#F1F5F9] p-5 transition hover:bg-[#F8FAFC] ${
                    !notification.read
                      ? 'bg-[#ECFDF5]'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className={getTypeClass(notification.type)}>
                          {getTypeLabel(notification.type)}
                        </span>

                        <span className="text-xs text-[#94A3B8]">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-[#0F172A] font-medium">
                        {notification.title}
                      </p>

                      {notification.message && (
                        <p className="mt-2 text-sm leading-6 text-[#64748B]">
                          {notification.message}
                        </p>
                      )}
                    </button>

                    <div className="flex items-center gap-3">
                      {!notification.read && (
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#059669]" />
                      )}

                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>
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
  const classes = {
    success:
      'rounded-full bg-[#DCFCE7] px-2 py-1 text-[11px] text-[#166534]',
    warning:
      'rounded-full bg-[#FEF3C7] px-2 py-1 text-[11px] text-[#92400E]',
    error:
      'rounded-full bg-[#FEE2E2] px-2 py-1 text-[11px] text-[#B91C1C]',
    info:
      'rounded-full bg-[#DBEAFE] px-2 py-1 text-[11px] text-[#1D4ED8]',
  }

  return classes[type] || classes.info
}

function getTypeLabel(type) {
  const labels = {
    success: 'Éxito',
    warning: 'Aviso',
    error: 'Error',
    info: 'Info',
  }

  return labels[type] || 'Info'
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString()
}