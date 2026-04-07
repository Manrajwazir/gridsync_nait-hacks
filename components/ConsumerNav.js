import Link from 'next/link'
import { useRouter } from 'next/router'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'

/*
 * ConsumerNav — Bottom tab bar for the Subscriber Portal
 * Includes GridSync logo → '/' and Operator Sign In link in header.
 */

const tabs = [
  { href: '/dashboard', label: 'Portal',  Icon: HomeRoundedIcon },
  { href: '/profile',   label: 'Profile', Icon: PersonRoundedIcon },
]

export default function ConsumerNav() {
  const router = useRouter()

  return (
    <>
      {/* Top mini-header: logo → landing page + Operator Sign In */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1001,
        height: '48px',
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* GridSync logo → landing */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#ededed', letterSpacing: '-0.3px' }}>GridSync</span>
          <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(0,200,83,0.1)', color: '#00c853', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>LIVE</span>
        </Link>

        {/* Operator Sign In */}
        <Link href="/login" style={{
          fontSize: '11px', color: '#4d94ff',
          textDecoration: 'none',
          padding: '5px 12px',
          background: 'rgba(0,112,243,0.08)',
          border: '1px solid rgba(0,112,243,0.2)',
          borderRadius: '6px',
          fontWeight: '600',
          transition: 'all .2s',
        }}>
          Operator Sign In →
        </Link>
      </div>

      {/* Bottom tab bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '68px',
        background: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 40px',
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
      }}>
        {tabs.map(({ href, label, Icon }) => {
          const isActive = router.pathname === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', textDecoration: 'none',
              color: isActive ? '#00c853' : '#555',
              padding: '8px 32px', borderRadius: '12px',
              transition: 'color 0.2s ease', position: 'relative',
            }}>
              {isActive && (
                <span style={{
                  position: 'absolute', top: '2px',
                  width: '4px', height: '4px',
                  borderRadius: '50%', background: '#00c853',
                }} />
              )}
              <Icon sx={{ fontSize: 24 }} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400', letterSpacing: '0.2px' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
