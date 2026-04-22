import Link from 'next/link'
import { Bell } from 'lucide-react'

interface AppHeaderProps {
  notifCount?: number
}

export function AppHeader({ notifCount = 0 }: AppHeaderProps) {
  return (
    <header
      style={{
        background: '#F4F1E8',
        borderBottom: '1px solid rgba(30,43,32,0.10)',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        height: 52,
      }}>

        {/* Logo-mark */}
        <Link href="/dashboard/feed" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 26,
            height: 26,
            borderRadius: 4,
            background: '#1E2B20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 900,
              color: '#C4F542',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              B
            </span>
          </div>
        </Link>

        {/* Wordmark */}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 900,
          color: '#1E2B20',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          BUDDYS
        </span>

        {/* Bell */}
        <Link
          href="/dashboard/notifications"
          style={{ position: 'relative', textDecoration: 'none', flexShrink: 0 }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#1E2B20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bell style={{ width: 16, height: 16, color: '#C4F542' }} strokeWidth={2} />
          </div>

          {notifCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              background: '#C4F542',
              color: '#1E2B20',
              fontSize: 9,
              fontWeight: 900,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              fontFamily: 'var(--font-display)',
              border: '1.5px solid #F4F1E8',
            }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>

      </div>
    </header>
  )
}
