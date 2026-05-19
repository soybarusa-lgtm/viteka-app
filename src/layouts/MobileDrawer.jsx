import { useEffect } from 'react'
import NotificationBell from '../components/NotificationBell'

const BRAND          = '#1c473c'
const ITEM_ACTIVE_BG = 'rgba(255,255,255,0.12)'
const ITEM_HOVER_BG  = 'rgba(255,255,255,0.07)'
const DIVIDER        = 'rgba(255,255,255,0.08)'

function IcClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: '12px',
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '14px',
        fontWeight: active ? 500 : 400,
        color: active ? '#ffffff' : 'rgba(255,255,255,0.65)',
        backgroundColor: active ? ITEM_ACTIVE_BG : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 0.15s',
        boxSizing: 'border-box',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = ITEM_HOVER_BG }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <span style={{ color: active ? '#fff' : 'rgba(255,255,255,0.5)', flexShrink: 0, display: 'flex' }}>
        <Icon />
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {active && (
        <span style={{
          height: '6px', width: '6px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.5)', flexShrink: 0,
        }} />
      )}
    </button>
  )
}

export default function MobileDrawer({ open, onClose, visibleNav, currentPage, navigate, profile, onLogout }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'stretch',
    }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          WebkitTapHighlightColor: 'transparent',
        }}
      />
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '280px',
        maxWidth: '85vw',
        backgroundColor: BRAND,
        boxShadow: '4px 0 32px rgba(0,0,0,0.35)',
        zIndex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          flexShrink: 0,
          minHeight: '60px',
          borderBottom: `1px solid ${DIVIDER}`,
        }}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '-0.5px' }}>
            Viteka
          </span>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '34px', width: '34px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <IcClose />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {visibleNav.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => { navigate(item.id); onClose() }}
            />
          ))}
        </nav>

        <div style={{ flexShrink: 0, padding: '10px 12px 36px', borderTop: `1px solid ${DIVIDER}` }}>
          <div style={{ marginBottom: '8px', padding: '0 4px' }}>
            <NotificationBell userId={profile?.id} dark sidebarExpanded={true} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px' }}>
            <div style={{
              flexShrink: 0, height: '34px', width: '34px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, color: 'white',
            }}>
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {profile?.full_name || 'Usuario'}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', margin: '2px 0 0' }}>
                {profile?.role || ''}
              </p>
            </div>
            <button
              onClick={onLogout}
              style={{
                color: 'rgba(255,255,255,0.4)', background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <IcLogout />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
