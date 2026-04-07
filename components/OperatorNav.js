import Link from 'next/link'
import { useRouter } from 'next/router'
import { useUser } from '../hooks/useUser'

/*
 * OperatorNav — Sidebar for AESO operators
 * Design: Linear.app-inspired sidebar. Dark, minimal, professional.
 * Left border highlight on active page. Sign out + AESO status at bottom.
 */

const navItems = [
  {
    href: '/operator',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    href: '/operator/predictions',
    label: 'Predictions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1,12 5,7 9,9 15,3" />
        <polyline points="11,3 15,3 15,7" />
      </svg>
    ),
  },
  {
    href: '/operator/alerts',
    label: 'Alerts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 14h3M8 1.5C5 1.5 3 4 3 6.5c0 2 -1 3.5 -1 3.5h12s-1-1.5-1-3.5C13 4 11 1.5 8 1.5z" />
      </svg>
    ),
  },
  {
    href: '/operator/analytics',
    label: 'Analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="3" y1="14" x2="3" y2="9" />
        <line x1="8" y1="14" x2="8" y2="5" />
        <line x1="13" y1="14" x2="13" y2="2" />
      </svg>
    ),
  },
]

export default function OperatorNav() {
  const router = useRouter()
  const { user, signOut } = useUser()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <nav style={{
      width: '220px',
      minWidth: '220px',
      minHeight: '100vh',
      background: '#0a0a0a',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Logo — links back to landing page */}
      <Link href="/" style={{ padding: '28px 24px 32px', display: 'block', textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '17px', fontWeight: '700', color: '#ededed', letterSpacing: '-0.3px' }}>GridSync</span>
          <span style={{ fontSize: '9px', padding: '2px 7px', background: 'rgba(0, 112, 243, 0.12)', color: '#4d94ff', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>OPERATOR</span>
        </div>
        <div style={{ fontSize: '11px', color: '#444', marginTop: '6px' }}>Grid Management Console</div>
      </Link>

      {/* Section label */}
      <div style={{
        padding: '0 24px',
        marginBottom: '8px',
        fontSize: '10px',
        color: '#444',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontWeight: '600',
      }}>
        Menu
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => {
          const isActive = router.pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 24px',
              color: isActive ? '#ededed' : '#666',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '400',
              borderLeft: isActive ? '2px solid #0070f3' : '2px solid transparent',
              background: isActive ? 'rgba(0, 112, 243, 0.05)' : 'transparent',
              transition: 'all 0.15s ease',
            }}>
              <span style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Bottom: user + connection status */}
      <div style={{
        marginTop: 'auto',
        padding: '20px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* User info + sign out */}
        {user && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
              {user.email}
            </div>
            <button onClick={handleSignOut} style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: '#666',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}>
              Sign Out
            </button>
          </div>
        )}

        <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
          Data Source
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00c853', boxShadow: '0 0 6px rgba(0, 200, 83, 0.4)' }} />
          AESO Connected
        </div>
        <div style={{ fontSize: '11px', color: '#333', marginTop: '4px' }}>Live feed • 60s interval</div>

        {/* Cross-portal link */}
        <Link href="/dashboard" style={{
          display: 'block', marginTop: '16px',
          fontSize: '11px', color: '#333',
          textDecoration: 'none', transition: 'color .2s',
        }}
          onMouseEnter={e => e.target.style.color = '#666'}
          onMouseLeave={e => e.target.style.color = '#333'}
        >
          ← Subscriber Portal
        </Link>
      </div>
    </nav>
  )
}
