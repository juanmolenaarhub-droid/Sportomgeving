'use client'

import { useState, useTransition } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { showInterest } from '@/app/actions/meetups'
import type { MeetupListItem } from '@/app/actions/meetups'
import { getSportEmoji } from './MeetupMapPin'

const SPORT_GRADIENTS: Record<string, string> = {
  'Hardlopen': 'linear-gradient(160deg, #E87722 0%, #8B3300 100%)',
  'Fietsen':   'linear-gradient(160deg, #3B82F6 0%, #1E3A8A 100%)',
  'Zwemmen':   'linear-gradient(160deg, #06B6D4 0%, #164E63 100%)',
  'Gym':       'linear-gradient(160deg, #22C55E 0%, #14532D 100%)',
  'Tennis':    'linear-gradient(160deg, #8B5CF6 0%, #4C1D95 100%)',
  'Padel':     'linear-gradient(160deg, #8B5CF6 0%, #4C1D95 100%)',
  'Golf':      'linear-gradient(160deg, #22C55E 0%, #166534 100%)',
  'Voetbal':   'linear-gradient(160deg, #10B981 0%, #064E3B 100%)',
  'Yoga':      'linear-gradient(160deg, #F59E0B 0%, #78350F 100%)',
  'Boksen':    'linear-gradient(160deg, #EF4444 0%, #7F1D1D 100%)',
}
const DEFAULT_GRADIENT = 'linear-gradient(160deg, #111111 0%, #374151 100%)'

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

function timeUntilExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}u ${m}m` : `${m} min`
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`
}

type Props = {
  meetup: MeetupListItem
  currentUserId: string
  userLat?: number
  userLon?: number
  onClose: () => void
  onInterestSuccess: (meetupId: string) => void
  onDetailsClick: (meetupId: string) => void
}

export default function MeetupPopupCard({
  meetup, currentUserId, userLat, userLon, onClose, onInterestSuccess, onDetailsClick,
}: Props) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [interestMsg, setInterestMsg] = useState('')
  const [myStatus, setMyStatus] = useState(meetup.myStatus)
  const [isPending, startTransition] = useTransition()

  const isCreator = meetup.creatorId === currentUserId
  const spotsLeft = meetup.maxParticipants - meetup.acceptedCount
  const emoji = getSportEmoji(meetup.sport)
  const chip = INTEREST_CHIPS[meetup.sport] ?? INTEREST_CHIPS.default

  const isExpiringSoon = meetup.isSpontaneous && meetup.expiresAt
    ? (new Date(meetup.expiresAt).getTime() - Date.now()) < 3600000
    : false

  const coverBg: React.CSSProperties = meetup.creatorBannerUrl
    ? {
        backgroundImage: `url(${meetup.creatorBannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: SPORT_GRADIENTS[meetup.sport] ?? DEFAULT_GRADIENT }

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

  const primaryBtnBase: React.CSSProperties = {
    flex: 1, border: 'none', borderRadius: 10, padding: '11px 0',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
  }

  return (
    <div style={{
      position: 'relative',
      width: 320,
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
      borderRadius: 16,
      background: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    }}>

      {/* ── COVER (180px) ── */}
      <div style={{ height: 180, position: 'relative', ...coverBg }}>
        {/* Gradient overlay onderaan */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 60%)',
        }} />

        {/* Rechtsboven: spontaan badge + sluitknop */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          {meetup.isSpontaneous && (
            <span style={{
              background: '#E87722', color: '#fff', fontSize: 12, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20, lineHeight: 1,
            }}>⚡ Nu</span>
          )}
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)',
              border: 'none', cursor: 'pointer', color: 'white', fontSize: 17,
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* Linksonder: sport emoji vierkant + titel */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          display: 'flex', alignItems: 'flex-end', gap: 9,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {emoji}
          </div>
          <p style={{
            color: '#fff', fontSize: 17, fontWeight: 700, lineHeight: 1.25, margin: 0, flex: 1,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {meetup.title}
          </p>
        </div>
      </div>

      {/* ── INFO SECTIE ── */}
      <div style={{ background: '#fff', padding: '14px 16px 0' }}>

        {/* Chips rij */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid #E5E7EB', borderRadius: 20, padding: '5px 10px',
            fontSize: 13, color: isExpiringSoon ? '#DC2626' : '#374151', background: '#fff',
          }}>
            <Clock size={12} />
            {meetup.isSpontaneous
              ? (meetup.expiresAt ? timeUntilExpiry(meetup.expiresAt) : 'Nu')
              : meetup.date
                ? new Date(`${meetup.date}T${meetup.time ?? '00:00'}`).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
                : '—'}
          </span>

          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid #E5E7EB', borderRadius: 20, padding: '5px 10px',
            fontSize: 13, color: '#374151', background: '#fff',
            maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <MapPin size={12} />
            {meetup.locationName.split(',')[0]}
          </span>

          {userLat !== undefined && userLon !== undefined && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              border: '1px solid #E5E7EB', borderRadius: 20, padding: '5px 10px',
              fontSize: 13, color: '#374151', background: '#fff',
            }}>
              {calcDist(userLat, userLon, meetup.latitude, meetup.longitude)}
            </span>
          )}
        </div>

        {/* Deelnemers + Host rij */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: meetup.acceptedCount === 0 ? '#9CA3AF' : '#111' }}>
              {meetup.acceptedCount}
            </strong>
            <span style={{ color: '#9CA3AF' }}> aanwezig</span>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #E5E7EB', overflow: 'hidden', flexShrink: 0 }}>
              <Avatar name={meetup.creatorName} imageUrl={meetup.creatorAvatarUrl} size="xs" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, lineHeight: 1 }}>host</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meetup.creatorName.split(' ')[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Beschrijving */}
        {meetup.description && (
          <p style={{
            fontSize: 13, color: '#6B7280', margin: '0 0 8px', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {meetup.description}
          </p>
        )}

        {/* Plekken indicator */}
        {meetup.status === 'vol' ? (
          <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 500, margin: '0 0 12px' }}>Vol</p>
        ) : spotsLeft > 0 && spotsLeft <= 5 ? (
          <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 500, margin: '0 0 12px' }}>
            {spotsLeft} {spotsLeft === 1 ? 'plek' : 'plekken'} over
          </p>
        ) : (
          <div style={{ height: 12 }} />
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        background: '#F5F0E8', padding: '12px 16px',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', gap: 8,
        borderRadius: '0 0 16px 16px',
      }}>
        {/* Linkerknop */}
        {isCreator ? (
          <button
            onClick={() => onDetailsClick(meetup.id)}
            style={{ ...primaryBtnBase, background: '#111', color: '#fff' }}
          >
            Beheer Meetup
          </button>
        ) : myStatus === 'geaccepteerd' ? (
          <a
            href="/dashboard/messages?tab=meetups"
            style={{ ...primaryBtnBase, background: '#16A34A', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Ga naar chat
          </a>
        ) : myStatus === 'interesse' ? (
          <span style={{ ...primaryBtnBase, background: '#9CA3AF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', cursor: 'default' }}>
            Wacht...
          </span>
        ) : meetup.status === 'open' ? (
          <button
            onClick={() => setShowOverlay(true)}
            style={{ ...primaryBtnBase, background: '#111', color: '#fff' }}
          >
            Interesse tonen
          </button>
        ) : null}

        {/* Rechterknop: Details */}
        <button
          onClick={() => onDetailsClick(meetup.id)}
          style={{
            flex: 1, background: '#F5F0E8', color: '#111',
            border: '1.5px solid #111', borderRadius: 10, padding: '11px 0',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Details ›
        </button>
      </div>

      {/* ── INTERESSE OVERLAY ── */}
      {showOverlay && (
        <div style={{
          position: 'absolute', inset: 0, background: '#F5F0E8', zIndex: 20,
          display: 'flex', flexDirection: 'column', padding: '16px 16px 14px',
          borderRadius: 16,
        }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#111', margin: '0 0 2px', fontFamily: "'Syne', sans-serif" }}>
            Laat {meetup.creatorName.split(' ')[0]} weten wie je bent
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' }}>Optioneel berichtje</p>

          <button
            onClick={() => setInterestMsg(chip)}
            style={{
              textAlign: 'left', background: '#fff', border: '1.5px solid rgba(0,0,0,0.08)',
              borderRadius: 10, padding: '8px 10px', fontSize: 12, color: '#374151',
              cursor: 'pointer', marginBottom: 8, lineHeight: 1.4,
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
              width: '100%', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: 10,
              padding: '8px 10px', fontSize: 12, resize: 'none', fontFamily: "'DM Sans', sans-serif",
              background: '#fff', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 10, color: '#9CA3AF', margin: '4px 0 10px' }}>
            {interestMsg.length}/200
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowOverlay(false)}
              style={{ flex: 1, background: 'transparent', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, color: '#6B7280', cursor: 'pointer' }}
            >
              Annuleer
            </button>
            <button
              onClick={handleInterestSubmit}
              disabled={isPending}
              style={{ flex: 1, background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Bezig...' : 'Stuur interesse'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
