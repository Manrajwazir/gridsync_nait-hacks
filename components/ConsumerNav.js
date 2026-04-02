import Link from 'next/link'
import { useRouter } from 'next/router'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'

/*
 * ConsumerNav — Bottom tab bar for the Subscriber Portal
 * 2 tabs: Portal (home) and Profile. Uses Material UI icons.
 */

const tabs = [
  { href: '/dashboard', label: 'Portal',  Icon: HomeRoundedIcon },
  { href: '/profile',   label: 'Profile', Icon: PersonRoundedIcon },
]

export default function ConsumerNav() {
  const router = useRouter()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            textDecoration: 'none',
            color: isActive ? '#00c853' : '#555',
            padding: '8px 32px',
            borderRadius: '12px',
            transition: 'color 0.2s ease',
            position: 'relative',
          }}>
            {isActive && (
              <span style={{
                position: 'absolute',
                top: '2px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#00c853',
              }} />
            )}
            <Icon sx={{ fontSize: 24 }} />
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? '600' : '400',
              letterSpacing: '0.2px',
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
