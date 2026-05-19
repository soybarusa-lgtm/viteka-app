import { useEffect } from 'react'
import NotificationBell from '../components/NotificationBell'

const BRAND          = '#1c473c'
const ITEM_ACTIVE_BG = 'rgba(255,255,255,0.12)'
const ITEM_HOVER_BG  = 'rgba(255,255,255,0.07)'
const DIVIDER        = 'rgba(255,255,255,0.08)'

function IcClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
      style={{
        display: 'flex', width: '100%', alignItems: 'center', gap: '12px',
        borderRadius: '8px', padding: '10px 12px', fontSize: '14px',
        fontWeight: active ? 500 : 400,
        color: active ? '#ffffff' : 'rgba(255,255,255,0.6)',
        backgroundColor: active ? ITEM_ACTIVE_BG : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s', boxSizing: 'border-box',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = ITEM_HOVER_BG }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
        <Icon />
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {active && (
        <span style={{
          marginLeft: 'auto', height: '6px', width: '6px',
          borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)', flexShrink: 0,
        }} />
      )}
    </button>
  )
}

export default function MobileDrawer({ open, onClose, visibleNav, currentPage, navigate, profile, onLogout }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
      />
      {/* Panel */}
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        height: '100%', width: '280px', maxWidth: '85vw',
        backgroundColor: BRAND, boxShadow: '4px 0 32px rgba(0,0,0,0.3)', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', flexShrink: 0, minHeight: '60px',
          borderBottom: `1px solid ${DIVIDER}`,
        }}>
          <img src="/brand/logo-white.svg" alt="Viteka"
            style={{ height: '38px', maxWidth: '140px', objectFit: 'contain' }}
            draggable={false}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <button onClick={onClose} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '32px', width: '32px', borderRadius: '8px',
            color: 'rgba(255,255,255,0.7)', background: 'transparent', border: 'none', cursor: 'pointer',
          }}>
            <IcClose />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visibleNav.map(item => (
            <NavItem key={item.id} item={item} active={currentPage === item.id}
              onClick={() => { navigate(item.id); onClose() }} />
          ))}
        </nav>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: '12px 12px 32px', borderTop: `1px solid ${DIVIDER}` }}>
          <div style={{ marginBottom: '8px', padding: '0 4px' }}>
            <NotificationBell userId={profile?.id} dark sidebarExpanded={true} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px' }}>
            <div style={{
              flexShrink: 0, height: '32px', width: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: 'white',
            }}>
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {profile?.full_name}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', margin: 0 }}>
                {profile?.role}
              </p>
            </div>
            <button onClick={onLogout} style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <IcLogout />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
