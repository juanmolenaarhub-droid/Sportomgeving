'use client'

import { useState, useEffect, useTransition } from 'react'
import { MapPin } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { showInterest, withdrawInterest, clearDeclinedParticipant } from '@/app/actions/meetups'
import type { MeetupListItem } from '@/app/actions/meetups'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const INTEREST_CHIPS: Record<string, string> = {
  'Hardlopen': 'Hey! Train jij ook voor een wedstrijd? Zou leuk zijn samen te lopen!',
  'Fietsen':   'Ik ga ook regelmatig fietsen — zin om samen te rijden?',
  'Zwemmen':   'Ik zoek ook iemand om banenzwemmen mee te doen, interesse?',
  'Gym':       'Ik train ook in de gym, zoek een trainingsmaatje — heb jij interesse?',
  'Tennis':    'Ik speel ook tennis, zullen we een keertje samen?',
  'Padel':     'Ik speel ook Padel, zullen we een keertje samen?',
  'Voetbal':   'Ik voetbal ook graag — zin om samen te spelen?',
  default:     'Zag je meetup en leek me leuk om mee te doen!',
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`
}

function formatTime(date: string | null, time: string | null): string {
  if (!date || !time) return '—'
  return time.slice(0, 5)
}

// ─── Participant avatar stack ─────────────────────────────────────────────────

function AvatarStack({ count, creatorName, creatorUrl }: {
  count: number
  creatorName: string
  creatorUrl: string | null
}) {
  const extra  = Math.max(0, count - 1)
  const colors = ['#C4A882', '#8B9E7A', '#7A8E9E', '#9E7A8B']

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex' }}>
        {/* Creator avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid white', overflow: 'hidden', flexShrink: 0,
        }}>
          <Avatar name={creatorName} imageUrl={creatorUrl} size="xs" />
        </div>
        {/* Extra placeholder circles */}
        {colors.slice(0, Math.min(extra, 4)).map((c, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: c,
            border: '2px solid white',
            marginLeft: -10,
            flexShrink: 0,
          }} />
        ))}
        {extra > 4 && (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#E8E1D3',
            border: '2px solid white',
            marginLeft: -10,
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...DM, fontSize: 10, fontWeight: 700, color: '#1A1714',
          }}>
            +{extra - 4}
          </div>
        )}
      </div>
      <span style={{ ...DM, fontSize: 13, color: '#1A1714' }}>
        {count > 0 ? 'Buddys doen mee' : 'Wees de eerste!'}
      </span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  meetup: MeetupListItem
  currentUserId: string
  userLat?: number
  userLon?: number
  onClose: () => void
  onInterestSuccess: (meetupId: string) => void
  onDetailsClick: (meetupId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MeetupPopupCard({
  meetup, currentUserId, userLat, userLon, onClose, onInterestSuccess, onDetailsClick,
}: Props) {
  const [showOverlay,     setShowOverlay]     = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [interestMsg,     setInterestMsg]     = useState('')
  const [myStatus,        setMyStatus]        = useState(meetup.myStatus)
  const [isPending,       startTransition]    = useTransition()

  const declinedAt       = meetup.declinedAt ?? null
  const hoursSinceDecline = declinedAt
    ? (Date.now() - new Date(declinedAt).getTime()) / 3600000
    : null
  const declineExpired = hoursSinceDecline !== null && hoursSinceDecline >= 24

  useEffect(() => {
    if (myStatus === 'geweigerd' && declineExpired) {
      clearDeclinedParticipant(meetup.id).then(({ cleared }) => {
        if (cleared) setMyStatus(null)
      })
    }
  }, [myStatus, declineExpired, meetup.id])

  const isCreator = meetup.creatorId === currentUserId
  const spotsLeft = meetup.maxParticipants - meetup.acceptedCount
  const chip      = INTEREST_CHIPS[meetup.sport] ?? INTEREST_CHIPS.default
  const dist      = userLat !== undefined && userLon !== undefined
    ? calcDist(userLat, userLon, meetup.latitude, meetup.longitude)
    : null
  const startTime = formatTime(meetup.date, meetup.time)

  function handleInterestSubmit() {
    startTransition(async () => {
      const res = await showInterest(meetup.id, interestMsg.trim() || undefined)
      if (res.success) {
        setMyStatus('interesse')
        setShowOverlay(false)
        onInterestSuccess(meetup.id)
      }
    })
  }

  // ── Main CTA label ────────────────────────────────────────────────────────

  function ctaLabel() {
    if (isCreator)                                          return 'Beheer'
    if (myStatus === 'geaccepteerd')                       return 'Chat'
    if (myStatus === 'interesse')                          return 'Wacht...'
    if (myStatus === 'geweigerd' && !declineExpired)       return 'Afgewezen'
    if (meetup.status === 'vol')                           return 'Vol'
    return 'Doe mee'
  }

  function ctaDisabled() {
    return myStatus === 'interesse' || (myStatus === 'geweigerd' && !declineExpired) || meetup.status === 'vol'
  }

  function handleCta() {
    if (isCreator)               return onDetailsClick(meetup.id)
    if (myStatus === 'geaccepteerd') return window.location.assign('/dashboard/messages?tab=meetups')
    if (!ctaDisabled())          return setShowOverlay(true)
  }

  return (
    <div style={{
      position: 'relative',
      width: 320,
      fontFamily: "'DM Sans', sans-serif",
      borderRadius: 20,
      background: '#FFFFFF',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      overflow: 'hidden',
    }}>

      {/* ── Close knop ────────────────────────────────────────────────────── */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12, zIndex: 10,
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(0,0,0,0.08)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: '#1A1714', lineHeight: 1,
        }}
      >×</button>

      {/* ── Card inhoud ───────────────────────────────────────────────────── */}
      <div style={{ padding: '18px 18px 0' }}>

        {/* Rij 1: LIVE NU badge + afstand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {meetup.isSpontaneous ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#FFF0EB',
              border: '1px solid rgba(232,119,34,0.20)',
              borderRadius: 999, padding: '5px 12px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E87722', flexShrink: 0 }} />
              <span style={{ ...DM, fontSize: 12, fontWeight: 700, color: '#E87722', letterSpacing: '0.04em' }}>
                LIVE NU
              </span>
            </div>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F3F4F6', borderRadius: 999, padding: '5px 12px',
            }}>
              <span style={{ ...DM, fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
                {meetup.date
                  ? new Date(meetup.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                  : 'Gepland'}
              </span>
            </div>
          )}

          {dist && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={13} color="#9CA3AF" strokeWidth={2} />
              <span style={{ ...DM, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{dist}</span>
            </div>
          )}
        </div>

        {/* Titel */}
        <h2 style={{
          ...SYNE,
          fontWeight: 800, fontSize: 22, lineHeight: 1.15,
          color: '#111111', margin: '0 0 14px',
          paddingRight: 20,
        }}>
          {meetup.title}
        </h2>

        {/* Avatar stack */}
        <div style={{ marginBottom: 16 }}>
          <AvatarStack
            count={meetup.acceptedCount}
            creatorName={meetup.creatorName}
            creatorUrl={meetup.creatorAvatarUrl}
          />
        </div>

        {/* Beschrijving (optioneel, max 2 regels) */}
        {meetup.description && (
          <p style={{
            ...DM, fontSize: 13, color: '#6B7280', lineHeight: 1.5,
            margin: '0 0 14px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {meetup.description}
          </p>
        )}

        {/* Plekken indicator */}
        {meetup.status === 'vol' && (
          <p style={{ ...DM, fontSize: 12, color: '#DC2626', fontWeight: 600, margin: '0 0 8px' }}>Vol</p>
        )}
        {meetup.status !== 'vol' && spotsLeft > 0 && spotsLeft <= 5 && (
          <p style={{ ...DM, fontSize: 12, color: '#16A34A', fontWeight: 600, margin: '0 0 8px' }}>
            {spotsLeft} {spotsLeft === 1 ? 'plek' : 'plekken'} over
          </p>
        )}
      </div>

      {/* ── Footer: tijd + doe mee ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '10px 18px 18px',
      }}>
        {/* Tijd */}
        <div>
          <p style={{ ...DM, fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.10em', textTransform: 'uppercase', margin: '0 0 2px' }}>
            Tijd
          </p>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 22, color: '#111111', margin: 0, lineHeight: 1.1 }}>
            {startTime}
          </p>
          {/* Locatie onder tijd */}
          <p style={{ ...DM, fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>
            {meetup.locationName.split(',')[0]}
          </p>
        </div>

        {/* CTA knop */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            onClick={handleCta}
            disabled={ctaDisabled()}
            style={{
              ...SYNE,
              background: ctaDisabled() ? '#E5E7EB' : '#E87722',
              color: ctaDisabled() ? '#9CA3AF' : '#FFFFFF',
              border: 'none',
              borderRadius: 16,
              padding: '14px 24px',
              fontSize: 18,
              fontWeight: 800,
              cursor: ctaDisabled() ? 'not-allowed' : 'pointer',
              lineHeight: 1.1,
              minWidth: 110,
              textAlign: 'center',
              boxShadow: ctaDisabled() ? 'none' : '0 4px 16px rgba(232,119,34,0.35)',
              transition: 'opacity 150ms',
            }}
          >
            {ctaLabel()}
          </button>

          {/* Details link */}
          <button
            onClick={() => onDetailsClick(meetup.id)}
            style={{
              ...DM, background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#9CA3AF', padding: 0, textDecoration: 'underline',
            }}
          >
            Details bekijken
          </button>
        </div>
      </div>

      {/* ── Interesse overlay ─────────────────────────────────────────────── */}
      {showOverlay && (
        <div style={{
          position: 'absolute', inset: 0, background: '#F5F0E8', zIndex: 20,
          display: 'flex', flexDirection: 'column', padding: '18px 18px 16px',
          borderRadius: 20,
        }}>
          <p style={{ ...SYNE, fontSize: 15, fontWeight: 800, color: '#111', margin: '0 0 2px' }}>
            Laat {meetup.creatorName.split(' ')[0]} weten wie je bent
          </p>
          <p style={{ ...DM, fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' }}>Optioneel berichtje</p>

          <button
            onClick={() => setInterestMsg(chip)}
            style={{
              textAlign: 'left', background: '#fff', border: '1.5px solid rgba(0,0,0,0.08)',
              borderRadius: 12, padding: '9px 12px', fontSize: 12, color: '#374151',
              cursor: 'pointer', marginBottom: 8, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            &ldquo;{chip}&rdquo;
          </button>

          <textarea
            rows={3}
            value={interestMsg}
            onChange={e => setInterestMsg(e.target.value.slice(0, 200))}
            placeholder="Of schrijf zelf iets..."
            style={{
              width: '100%', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: 12,
              padding: '9px 12px', fontSize: 12, resize: 'none',
              fontFamily: "'DM Sans', sans-serif",
              background: '#fff', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 10, color: '#9CA3AF', margin: '4px 0 12px' }}>
            {interestMsg.length}/200
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowOverlay(false)}
              style={{
                flex: 1, background: 'transparent', border: '1.5px solid rgba(0,0,0,0.12)',
                borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 700,
                color: '#6B7280', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Annuleer
            </button>
            <button
              onClick={handleInterestSubmit}
              disabled={isPending}
              style={{
                flex: 1, background: '#E87722', color: '#fff', border: 'none',
                borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.6 : 1,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {isPending ? 'Bezig...' : 'Stuur interesse'}
            </button>
          </div>

          {/* Intrekken optie als al interesse getoond */}
          {myStatus === 'interesse' && (
            confirmWithdraw ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setConfirmWithdraw(false)} style={{ flex: 1, background: '#F3F4F6', border: 'none', borderRadius: 12, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#374151' }}>Nee</button>
                <button onClick={() => startTransition(async () => { await withdrawInterest(meetup.id); setMyStatus(null); setConfirmWithdraw(false) })} disabled={isPending} style={{ flex: 1, background: '#DC2626', border: 'none', borderRadius: 12, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff', opacity: isPending ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif" }}>Intrekken</button>
              </div>
            ) : (
              <button onClick={() => setConfirmWithdraw(true)} style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" }}>
                Interesse intrekken ×
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
