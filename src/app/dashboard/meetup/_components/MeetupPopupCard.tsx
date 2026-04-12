'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, Clock, MapPin, Users, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { showInterest } from '@/app/actions/meetups'
import type { MeetupListItem } from '@/app/actions/meetups'
import { getSportColor } from './MeetupMapPin'

const SPORT_DARK: Record<string, string> = {
  '#E87722': '#b85a12', '#3B82F6': '#2563eb', '#06B6D4': '#0891b2',
  '#22C55E': '#16a34a', '#8B5CF6': '#7c3aed', '#EC4899': '#db2777',
  '#10B981': '#059669', '#111111': '#000000',
}

const INTEREST_CHIPS: Record<string, string> = {
  'Hardlopen': 'Hey! Train jij ook voor een wedstrijd? Zou leuk zijn samen te lopen!',
  'Fietsen': 'Ik ga ook regelmatig fietsen — zin om samen te rijden?',
  'Zwemmen': 'Ik zoek ook iemand om banenzwemmen mee te doen, interesse?',
  'Gym': 'Ik train ook in de gym, zoek een trainingsmaatje — heb jij interesse?',
  'Tennis': 'Ik speel ook tennis, zullen we een keertje samen?',
  'Padel': 'Ik speel ook Padel, zullen we een keertje samen?',
  'Voetbal': 'Ik voetbal ook graag — zin om samen te spelen?',
  default: 'Zag je Meetup en leek me leuk om mee te doen!',
}

function darken(color: string) { return SPORT_DARK[color] ?? '#000' }

function timeUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}u ${m}m` : `${m} min`
}

function formatDate(date: string | null, time: string | null) {
  if (!date) return null
  return new Date(`${date}T${time ?? '00:00'}`).toLocaleString('nl-NL', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`
}

type ExtraData = {
  bannerUrl: string | null
  avatars: Array<{ id: string; name: string; avatarUrl: string | null }>
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
  const [extra, setExtra] = useState<ExtraData | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [interestMsg, setInterestMsg] = useState('')
  const [myStatus, setMyStatus] = useState(meetup.myStatus)
  const [submitOk, setSubmitOk] = useState(false)
  const [isPending, startTransition] = useTransition()

  const color = getSportColor(meetup.sport)
  const darkColor = darken(color)
  const isCreator = meetup.creatorId === currentUserId
  const spotsLeft = meetup.maxParticipants - meetup.acceptedCount
  const chip = INTEREST_CHIPS[meetup.sport] ?? INTEREST_CHIPS.default

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: creator } = await supabase.from('profiles')
        .select('banner_url').eq('id', meetup.creatorId).maybeSingle()

      const { data: parts } = await supabase.from('meetup_participants')
        .select('user_id').eq('meetup_id', meetup.id).eq('status', 'geaccepteerd').limit(3)

      let avatars: ExtraData['avatars'] = []
      if (parts && parts.length > 0) {
        const { data: profiles } = await supabase.from('profiles')
          .select('id, full_name, username, avatar_url').in('id', parts.map(p => p.user_id))
        avatars = (profiles ?? []).map(p => ({
          id: p.id,
          name: p.full_name ?? p.username ?? '?',
          avatarUrl: p.avatar_url ?? null,
        }))
      }
      setExtra({ bannerUrl: (creator as { banner_url?: string | null })?.banner_url ?? null, avatars })
    })()
  }, [meetup.id, meetup.creatorId])

  function handleInterestSubmit() {
    startTransition(async () => {
      const res = await showInterest(meetup.id, interestMsg.trim() || undefined)
      if (res.success) {
        setMyStatus('interesse')
        setSubmitOk(true)
        setShowOverlay(false)
        onInterestSuccess(meetup.id)
        setTimeout(() => setSubmitOk(false), 2500)
      }
    })
  }

  const coverBg = extra?.bannerUrl
    ? { backgroundImage: `url(${extra.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${color}, ${darkColor})` }

  return (
    <div style={{
      position: 'relative',
      width: 320,
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
      borderRadius: 16,
    }}>

      {/* ── COVER FOTO ── */}
      <div style={{ height: 160, position: 'relative', ...coverBg }}>
        {/* Gradient overlay onderaan */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.65) 100%)',
        }} />

        {/* Rechts boven: sluit + spontaan badge */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
          {meetup.isSpontaneous && (
            <span style={{
              background: '#E87722', color: '#fff', fontSize: 10, fontWeight: 800,
              padding: '3px 7px', borderRadius: 999,
            }}>⚡ Nu</span>
          )}
          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.45)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={13} color="white" />
          </button>
        </div>

        {/* Onderaan: sport icoon + titel */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12, right: 12,
          display: 'flex', alignItems: 'flex-end', gap: 9,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {/* sport emoji */}
            {(['Hardlopen','Fietsen','Gym','Yoga','Zwemmen','Voetbal','Padel','Tennis','Wandelen','Boksen','Klimmen','Golf'] as const).includes(meetup.sport as never)
              ? { Hardlopen: '🏃', Fietsen: '🚴', Gym: '💪', Yoga: '🧘', Zwemmen: '🏊', Voetbal: '⚽', Padel: '🏸', Tennis: '🎾', Wandelen: '🚶', Boksen: '🥊', Klimmen: '🧗', Golf: '⛳' }[meetup.sport] ?? '🏅'
              : '🏅'}
          </div>
          <p style={{
            color: '#fff', fontSize: 15, fontWeight: 800,
            lineHeight: 1.25, margin: 0, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {meetup.title}
          </p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ background: '#fff', padding: '10px 14px 0' }}>
        {/* Info pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 9 }}>
          {/* Tijd */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f3f4f6', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: meetup.isSpontaneous ? '#ef4444' : '#374151' }}>
            <Clock size={10} />
            {meetup.isSpontaneous
              ? (meetup.expiresAt ? timeUntilExpiry(meetup.expiresAt) : 'Nu')
              : (meetup.time ? meetup.time.slice(0, 5) : '—')}
          </span>
          {/* Locatie */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f3f4f6', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#374151', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <MapPin size={10} />
            {meetup.locationName.split(',')[0]}
          </span>
          {/* Afstand */}
          {userLat !== undefined && userLon !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f3f4f6', borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#374151' }}>
              {calcDist(userLat, userLon, meetup.latitude, meetup.longitude)}
            </span>
          )}
          {/* Status vol */}
          {meetup.status === 'vol' && (
            <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>Vol</span>
          )}
        </div>

        {/* Deelnemers + host */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Overlappende avatars */}
            <div style={{ display: 'flex' }}>
              {(extra?.avatars ?? []).map((av, i) => (
                <div key={av.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: i }}>
                  <Avatar name={av.name} imageUrl={av.avatarUrl} size="xs" />
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
              <span style={{ color: '#111', fontWeight: 700 }}>{meetup.acceptedCount}</span> aanwezig
              {meetup.interestedCount > 0 && (
                <span style={{ color: '#9ca3af' }}> · +{meetup.interestedCount} geïnt.</span>
              )}
            </span>
          </div>
          {/* Host */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Avatar name={meetup.creatorName} imageUrl={meetup.creatorAvatarUrl} size="xs" />
            <div>
              <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, lineHeight: 1 }}>host</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#111', margin: 0, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meetup.creatorName.split(' ')[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Beschrijving */}
        {meetup.description && (
          <p style={{
            fontSize: 12, color: '#6b7280', margin: '0 0 10px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            lineHeight: 1.5,
          }}>
            {meetup.description}
          </p>
        )}

        {/* Plekken */}
        {spotsLeft > 0 && meetup.status === 'open' && (
          <p style={{ fontSize: 11, color: '#059669', fontWeight: 700, margin: '0 0 10px' }}>
            {spotsLeft} {spotsLeft === 1 ? 'plek' : 'plekken'} over
          </p>
        )}
      </div>

      {/* ── KNOPPEN ── */}
      <div style={{
        background: '#F5F0E8', padding: '10px 14px 12px',
        borderTop: '0.5px solid rgba(0,0,0,0.06)',
        display: 'flex', gap: 7,
      }}>
        {/* Linkerknop: actie */}
        {isCreator ? (
          <button
            onClick={() => onDetailsClick(meetup.id)}
            style={{ flex: 1, background: '#111', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Beheer Meetup
          </button>
        ) : myStatus === 'geaccepteerd' ? (
          <a
            href="/dashboard/messages?tab=meetups"
            style={{ flex: 1, background: '#22C55E', color: '#fff', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block' }}
          >
            {submitOk ? '✓ Chat' : 'Bekijk chat'}
          </a>
        ) : myStatus === 'interesse' ? (
          <span style={{ flex: 1, background: '#f3f4f6', color: '#9ca3af', borderRadius: 8, padding: '8px 0', fontSize: 11, textAlign: 'center', display: 'block', fontStyle: 'italic' }}>
            Wacht op acceptatie...
          </span>
        ) : meetup.status === 'open' ? (
          <button
            onClick={() => setShowOverlay(true)}
            style={{ flex: 1, background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Interesse tonen
          </button>
        ) : null}

        {/* Rechterknop: Details */}
        <button
          onClick={() => onDetailsClick(meetup.id)}
          style={{
            flex: 1, background: 'transparent', color: '#111', border: '1.5px solid #111',
            borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          }}
        >
          Details <ChevronRight size={13} />
        </button>
      </div>

      {/* ── INTERESSE OVERLAY ── */}
      {showOverlay && (
        <div style={{
          position: 'absolute', inset: 0, background: '#F5F0E8',
          zIndex: 20, display: 'flex', flexDirection: 'column',
          padding: '14px 14px 12px',
        }}>
          {/* Header */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#111', margin: '0 0 2px', fontFamily: "'Syne', sans-serif" }}>
              Laat {meetup.creatorName.split(' ')[0]} weten wie je bent
            </p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Optioneel berichtje</p>
          </div>

          {/* Chip suggestie */}
          <button
            onClick={() => setInterestMsg(chip)}
            style={{
              textAlign: 'left', background: '#fff', border: '1.5px solid rgba(0,0,0,0.08)',
              borderRadius: 10, padding: '7px 10px', fontSize: 11, color: '#374151',
              cursor: 'pointer', marginBottom: 8, lineHeight: 1.4,
            }}
          >
            &ldquo;{chip}&rdquo;
          </button>

          {/* Textarea */}
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
          <div style={{ textAlign: 'right', fontSize: 10, color: '#9ca3af', marginBottom: 10 }}>
            {interestMsg.length}/200
          </div>

          {/* Knoppen */}
          <div style={{ display: 'flex', gap: 7 }}>
            <button
              onClick={() => setShowOverlay(false)}
              style={{ flex: 1, background: 'transparent', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, color: '#6b7280', cursor: 'pointer' }}
            >
              Annuleer
            </button>
            <button
              onClick={handleInterestSubmit}
              disabled={isPending}
              style={{ flex: 1, background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Bezig...' : 'Stuur interesse'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
