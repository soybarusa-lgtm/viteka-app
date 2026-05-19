import { useEffect } from 'react'
import NotificationBell from '../components/NotificationBell'

function IcClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IcLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
        active
          ? 'bg-white/12 font-medium text-white'
          : 'font-normal text-white/60 hover:bg-white/8 hover:text-white'
      }`}
    >
      <span className={active ? 'text-white' : 'text-white/50'}><Icon /></span>
      <span className="truncate">{item.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />}
    </button>
  )
}

export default function MobileDrawer({ open, onClose, visibleNav, currentPage, navigate, profile, onLogout }) {
  // Bloquear scroll body
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 md:hidden"
        style={{ zIndex: 40 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 left-0 flex flex-col md:hidden"
        style={{
          zIndex: 50,
          width: '280px',
          maxWidth: '85vw',
          backgroundColor: '#1c473c',
          boxShadow: '4px 0 32px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          className="flex flex-shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: '60px' }}
        >
          <img
            src="/brand/logo-white.svg"
            alt="Viteka"
            style={{ height: '38px', maxWidth: '140px', objectFit: 'contain' }}
            draggable={false}
          />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <IcClose />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleNav.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => { navigate(item.id); onClose() }}
            />
          ))}
        </nav>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-3 pb-8 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="mb-2 px-1">
            <NotificationBell userId={profile?.id} dark sidebarExpanded={true} />
          </div>
          <div className="flex items-center gap-2.5 px-1 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{profile?.full_name}</p>
              <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.role}</p>
            </div>
            <button onClick={onLogout} className="text-white/30 hover:text-red-300 transition">
              <IcLogout />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
