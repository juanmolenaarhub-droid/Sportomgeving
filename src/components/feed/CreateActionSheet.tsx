'use client'

import { useEffect } from 'react'
import { Camera, MapPin, MessageCircle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── Types ─────────────────────────────────────────────────────────────────────

type CreateActionSheetProps = {
  open: boolean
  onClose: () => void
  onNewPost: () => void  // opent PostComposer in layout
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties   = { fontFamily: "'DM Sans', sans-serif" }

// ─── CreateActionSheet ─────────────────────────────────────────────────────────

export function CreateActionSheet({ open, onClose, onNewPost }: CreateActionSheetProps) {
  const router = useRouter()

  // Vergrendel body-scroll wanneer sheet open is
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  function handleNewPost() {
    onClose()
    // Kleine delay zodat de sheet sluit voor de composer opent
    setTimeout(onNewPost, 200)
  }

  function handleMeetup() {
    onClose()
    router.push('/dashboard/meetup/nieuw')
  }

  function handleMessage() {
    onClose()
    router.push('/dashboard/messages')
  }

  return (
    <>
      {/* Donkere overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(26,23,20,0.50)',
          zIndex: 55,
          animation: 'fadeIn 0.2s ease-out both',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 56,
          background: '#F5F0E8',
          borderRadius: '28px 28px 0 0',
          padding: '0 24px 40px',
          animation: 'slideUp 0.3s cubic-bezier(.16,1,.3,1) both',
        }}
      >
        {/* Grab handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(26,23,20,0.18)' }} />
        </div>

        {/* Eyebrow */}
        <p style={{
          ...DM,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(26,23,20,0.55)',
          marginBottom: 8,
        }}>
          ACTIES
        </p>

        {/* Titel */}
        <p style={{
          ...SYNE,
          fontWeight: 800,
          fontSize: 24,
          color: '#1A1714',
          lineHeight: 1.0,
          marginBottom: 20,
        }}>
          Wat wil je doen?
        </p>

        {/* Actie-kaarten */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ActionCard
            icon={<Camera style={{ width: 22, height: 22, color: 'white' }} />}
            title="Nieuwe post"
            subtitle="Deel een training of moment"
            onClick={handleNewPost}
          />
          <ActionCard
            icon={<MapPin style={{ width: 22, height: 22, color: 'white' }} />}
            title="Meetup aanmaken"
            subtitle="Plan een training met buddies"
            onClick={handleMeetup}
          />
          <ActionCard
            icon={<MessageCircle style={{ width: 22, height: 22, color: 'white' }} />}
            title="Nieuw bericht"
            subtitle="Start een gesprek"
            onClick={handleMessage}
          />
        </div>

        {/* Annuleren */}
        <button
          onClick={onClose}
          style={{
            ...DM,
            display: 'block',
            width: '100%',
            textAlign: 'center',
            marginTop: 24,
            fontSize: 14,
            fontWeight: 500,
            color: 'rgba(26,23,20,0.55)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          Annuleren
        </button>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0.8; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}

// ─── ActionCard ────────────────────────────────────────────────────────────────

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: '#FAF6EE',
        borderRadius: 20,
        padding: 16,
        height: 80,
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 150ms',
      }}
      onMouseDown={e => ((e.currentTarget as HTMLButtonElement).style.background = '#EDE7DD')}
      onMouseUp={e => ((e.currentTarget as HTMLButtonElement).style.background = '#FAF6EE')}
      onTouchStart={e => ((e.currentTarget as HTMLButtonElement).style.background = '#EDE7DD')}
      onTouchEnd={e => ((e.currentTarget as HTMLButtonElement).style.background = '#FAF6EE')}
    >
      {/* Icoon-vakje */}
      <div style={{
        width: 48, height: 48,
        borderRadius: '50%',
        background: '#2A2420',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Tekst */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700, fontSize: 15,
          color: '#1A1714',
          lineHeight: 1.2,
        }}>
          {title}
        </p>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          color: 'rgba(26,23,20,0.55)',
          marginTop: 2,
        }}>
          {subtitle}
        </p>
      </div>

      <ChevronRight style={{ width: 18, height: 18, color: 'rgba(26,23,20,0.35)', flexShrink: 0 }} />
    </button>
  )
}
