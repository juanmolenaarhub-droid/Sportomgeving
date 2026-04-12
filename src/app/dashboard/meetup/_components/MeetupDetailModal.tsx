'use client'

import { useState, useEffect, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, MapPin, Calendar, Users, Eye, Globe, Lock } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import HostTrustCard from './HostTrustCard'
import {
  getMeetupDetailForModal,
  respondToInterest,
  markAttended,
  removeParticipant,
  submitReview,
  type MeetupModalDetail,
} from '@/app/actions/meetups'

const LocationPreviewMap = dynamic(() => import('./LocationPreviewMap'), { ssr: false })

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#EC4899',
  'Voetbal': '#10B981', default: '#111111',
}
const SPORT_DARK: Record<string, string> = {
  '#E87722': '#b85a12', '#3B82F6': '#2563eb', '#06B6D4': '#0891b2',
  '#22C55E': '#16a34a', '#8B5CF6': '#7c3aed', '#EC4899': '#db2777',
  '#10B981': '#059669', '#111111': '#000000',
}
function getSportColor(s: string) { return SPORT_COLORS[s] ?? SPORT_COLORS.default }
function darken(c: string) { return SPORT_DARK[c] ?? '#000' }

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
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (m < 1) return 'Zojuist'
  if (m < 60) return `${m} min geleden`
  if (h < 24) return `${h} uur geleden`
  return `${day} dag${day > 1 ? 'en' : ''} geleden`
}

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type Tab = 'info' | 'aanwezig' | 'geinteresseerd'

type Props = {
  meetupId: string
  onClose: () => void
  onInterestSuccess: (meetupId: string) => void
}

export default function MeetupDetailModal({ meetupId, onClose, onInterestSuccess }: Props) {
  const [data, setData] = useState<MeetupModalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('info')
  const [visible, setVisible] = useState(false)
  const [, startTransition] = useTransition()
  const [actionPending, setActionPending] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(0)

  useEffect(() => {
    getMeetupDetailForModal(meetupId).then(d => {
      setData(d)
      setLoading(false)
    })
    // Slide in
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [meetupId])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleRespond(userId: string, response: 'geaccepteerd' | 'geweigerd') {
    if (!data) return
    setActionPending(userId)
    startTransition(async () => {
      await respondToInterest(data.meetup.id, userId, response)
      const d = await getMeetupDetailForModal(meetupId)
      setData(d)
      setActionPending(null)
      showToast(response === 'geaccepteerd' ? 'Deelnemer geaccepteerd' : 'Deelnemer geweigerd')
      if (response === 'geaccepteerd') onInterestSuccess(meetupId)
    })
  }

  async function handleMarkAttended(userId: string) {
    if (!data) return
    setActionPending(userId + '_attend')
    await markAttended(data.meetup.id, userId)
    const d = await getMeetupDetailForModal(meetupId)
    setData(d)
    setActionPending(null)
    showToast('Aanwezigheid bevestigd')
  }

  async function handleRemove(userId: string) {
    if (!data) return
    setActionPending(userId + '_remove')
    await removeParticipant(data.meetup.id, userId)
    const d = await getMeetupDetailForModal(meetupId)
    setData(d)
    setActionPending(null)
    showToast('Deelnemer verwijderd')
  }

  async function handleReview() {
    if (!data || rating === 0) return
    const res = await submitReview(data.meetup.id, data.creator.id, rating)
    if (res.success) {
      showToast('Bedankt voor je beoordeling!')
      setShowReview(false)
      const d = await getMeetupDetailForModal(meetupId)
      setData(d)
    }
  }

  const m = data?.meetup
  const c = data?.creator
  const color = m ? getSportColor(m.sport) : '#111'
  const darkColor = darken(color)

  const coverBg = c?.bannerUrl
    ? { backgroundImage: `url(${c.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : m ? { background: `linear-gradient(135deg, ${color}, ${darkColor})` } : { background: '#eee' }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.5)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          height: '91vh', borderRadius: '20px 20px 0 0',
          background: '#F5F0E8', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(.32,.72,0,1)',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── COVER HEADER ── */}
        <div style={{ height: 160, position: 'relative', flexShrink: 0, ...coverBg }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.65) 100%)' }} />

          {/* Terug knop */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: 14, left: 14, zIndex: 5,
              width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.45)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft size={16} color="white" />
          </button>

          {/* Badges rechts */}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
            {m?.isSpontaneous && (
              <span style={{ background: '#E87722', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999 }}>⚡ Spontaan</span>
            )}
            {m?.status === 'vol' && (
              <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999 }}>Vol</span>
            )}
          </div>

          {/* Titel onderaan */}
          {!loading && m && (
            <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ background: color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>{m.sport}</span>
              </div>
              <p style={{ ...SYNE, fontWeight: 900, fontSize: 18, color: '#fff', margin: 0, lineHeight: 1.25 }}>
                {m.title}
              </p>
            </div>
          )}
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)', background: '#F5F0E8', flexShrink: 0 }}>
          {([
            { key: 'info', label: 'Info' },
            { key: 'aanwezig', label: `Aanwezig ${data ? `(${data.acceptedParticipants.length})` : ''}` },
            { key: 'geinteresseerd', label: `Geïnteresseerd ${data ? `(${data.interestedParticipants.length})` : ''}` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '12px 4px', background: 'transparent', border: 'none',
                borderBottom: tab === t.key ? `2.5px solid #E87722` : '2.5px solid transparent',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                color: tab === t.key ? '#111' : '#9ca3af',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
          {loading ? (
            <LoadingSkeleton />
          ) : !data ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 40 }}>Kon gegevens niet laden.</p>
          ) : tab === 'info' ? (
            <InfoTab data={data} onInterestSuccess={onInterestSuccess} />
          ) : tab === 'aanwezig' ? (
            <AanwezigTab
              data={data}
              actionPending={actionPending}
              onMarkAttended={handleMarkAttended}
              onRemove={handleRemove}
            />
          ) : (
            <GeinteresseerdTab
              data={data}
              actionPending={actionPending}
              onRespond={handleRespond}
            />
          )}
        </div>

        {/* Review knop (als geaccepteerde deelnemer + meetup afgerond/in verleden) */}
        {data && !data.isCreator && data.myStatus === 'geaccepteerd' && !data.myReviewSubmitted && (
          <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#F5F0E8' }}>
            {showReview ? (
              <div>
                <p style={{ ...SYNE, fontWeight: 800, fontSize: 13, color: '#111', marginBottom: 8 }}>Beoordeel de organisator</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', opacity: s <= rating ? 1 : 0.35 }}
                    >⭐</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowReview(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: 'transparent', fontSize: 13, fontWeight: 700, color: '#6b7280', cursor: 'pointer' }}>Annuleer</button>
                  <button onClick={handleReview} disabled={rating === 0} style={{ flex: 2, padding: '9px 0', borderRadius: 10, background: rating > 0 ? '#E87722' : '#e5e7eb', color: rating > 0 ? '#fff' : '#9ca3af', border: 'none', fontSize: 13, fontWeight: 700, cursor: rating > 0 ? 'pointer' : 'default' }}>Verstuur beoordeling</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowReview(true)} style={{ width: '100%', padding: '11px 0', borderRadius: 10, background: 'transparent', border: '1.5px solid rgba(0,0,0,0.10)', fontSize: 13, fontWeight: 700, color: '#374151', cursor: 'pointer' }}>
                ⭐ Beoordeel {data.creator.name.split(' ')[0]} als organisator
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: '#111', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </>
  )
}

// ─── Tab 1: Info ──────────────────────────────────────────────────────────────

function InfoTab({ data, onInterestSuccess }: { data: MeetupModalDetail; onInterestSuccess: (id: string) => void }) {
  const m = data.meetup
  const color = getSportColor(m.sport)
  const [isPending, startTransition] = useTransition()
  const [myStatus, setMyStatus] = useState(data.myStatus)

  const spotsLeft = m.maxParticipants - data.acceptedParticipants.length
  const interestedCount = data.interestedParticipants.length

  function handleInterest() {
    startTransition(async () => {
      const { showInterest } = await import('@/app/actions/meetups')
      const res = await showInterest(m.id)
      if (res.success) { setMyStatus('interesse'); onInterestSuccess(m.id) }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Details rijen */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Datum / tijd */}
        <DetailRow icon={<Calendar size={14} color={color} />} label={
          m.isSpontaneous
            ? <><span style={{ color: '#ef4444', fontWeight: 700 }}>Nu · verloopt over {m.expiresAt ? timeUntilExpiry(m.expiresAt) : '—'}</span></>
            : <>{formatDate(m.date, m.time) ?? '—'}</>
        } />

        {/* Locatie */}
        <DetailRow icon={<MapPin size={14} color={color} />} label={
          <>
            {m.locationName}
            {m.hasLocationAccess && m.locationAddress && (
              <span style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{m.locationAddress}</span>
            )}
            {!m.hasLocationAccess && (
              <span style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Exact adres zichtbaar na acceptatie</span>
            )}
          </>
        } />

        {/* Deelnemers */}
        <DetailRow icon={<Users size={14} color={color} />} label={
          <>
            <span style={{ fontWeight: 700 }}>{data.acceptedParticipants.length}</span> aanwezig
            {interestedCount > 0 && <> · <span style={{ color: '#E87722', fontWeight: 700 }}>{interestedCount}</span> geïnteresseerd</>}
            {spotsLeft > 0 && <> · <span style={{ color: '#059669', fontWeight: 700 }}>{spotsLeft} plekken</span> over</>}
          </>
        } />

        {/* Zichtbaarheid */}
        <DetailRow icon={m.visibility === 'publiek' ? <Globe size={14} color={color} /> : <Lock size={14} color={color} />}
          label={m.visibility === 'publiek' ? 'Publiek' : 'Alleen buddies'} />

        {/* Beschrijving */}
        {m.description && (
          <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6, padding: '8px 0 0', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            {m.description}
          </p>
        )}
      </div>

      {/* Mini Mapbox kaart */}
      <div style={{ borderRadius: 14, overflow: 'hidden', height: 200, border: '1px solid rgba(0,0,0,0.07)' }}>
        <LocationPreviewMap lat={m.displayLat} lon={m.displayLon} />
      </div>
      {!m.hasLocationAccess && (
        <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: '-10px 0 0', fontStyle: 'italic' }}>
          Locatie op postcode-niveau — exacte pin zichtbaar na acceptatie
        </p>
      )}
      {m.hasLocationAccess && (
        <a
          href={`https://maps.apple.com/?q=${encodeURIComponent(m.locationName)}&ll=${m.latitude},${m.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', fontSize: 12, color: '#E87722', fontWeight: 700, textDecoration: 'none', marginTop: -8 }}
        >
          Open in Maps →
        </a>
      )}

      {/* Host profiel kaart */}
      <div>
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 13, color: '#111', marginBottom: 10 }}>Organisator</p>
        <HostTrustCard creator={data.creator} />
      </div>

      {/* Actie knop */}
      <ActionButton meetup={m} isCreator={data.isCreator} myStatus={myStatus} color={color} isPending={isPending} onInterest={handleInterest} />
    </div>
  )
}

function DetailRow({ icon, label }: { icon: React.ReactNode; label: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <p style={{ fontSize: 13, color: '#374151', margin: 0, flex: 1, lineHeight: 1.5 }}>{label}</p>
    </div>
  )
}

function ActionButton({
  meetup, isCreator, myStatus, color, isPending, onInterest,
}: {
  meetup: MeetupModalDetail['meetup']
  isCreator: boolean
  myStatus: string | null
  color: string
  isPending: boolean
  onInterest: () => void
}) {
  if (isCreator) {
    return (
      <a
        href={`/dashboard/meetup/${meetup.id}`}
        style={{ display: 'block', textAlign: 'center', background: '#111', color: '#fff', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
      >
        Beheer Meetup
      </a>
    )
  }
  if (myStatus === 'geaccepteerd') {
    return (
      <a
        href="/dashboard/messages?tab=meetups"
        style={{ display: 'block', textAlign: 'center', background: '#22C55E', color: '#fff', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
      >
        Bekijk Meetup chat
      </a>
    )
  }
  if (myStatus === 'interesse') {
    return (
      <div style={{ textAlign: 'center', background: '#f3f4f6', color: '#9ca3af', borderRadius: 14, padding: '13px 0', fontSize: 13, fontStyle: 'italic' }}>
        Wacht op acceptatie...
      </div>
    )
  }
  if (meetup.status === 'open') {
    return (
      <button
        onClick={onInterest}
        disabled={isPending}
        style={{ width: '100%', background: color, color: '#fff', border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.6 : 1 }}
      >
        {isPending ? 'Bezig...' : 'Interesse tonen'}
      </button>
    )
  }
  return null
}

// ─── Tab 2: Aanwezig ──────────────────────────────────────────────────────────

function AanwezigTab({ data, actionPending, onMarkAttended, onRemove }: {
  data: MeetupModalDetail
  actionPending: string | null
  onMarkAttended: (userId: string) => void
  onRemove: (userId: string) => void
}) {
  if (data.acceptedParticipants.length === 0) {
    return <EmptyState text="Nog geen geaccepteerde deelnemers." />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.acceptedParticipants.map(p => (
        <div key={p.userId} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{p.name}</p>
            {p.attended ? (
              <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 700 }}>✓ Aanwezigheid bevestigd</span>
            ) : (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Geaccepteerd</span>
            )}
          </div>
          {data.isCreator && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {!p.attended && (
                <button
                  onClick={() => onMarkAttended(p.userId)}
                  disabled={actionPending === p.userId + '_attend'}
                  style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
                >
                  ✓ Aanwezig
                </button>
              )}
              <button
                onClick={() => onRemove(p.userId)}
                disabled={actionPending === p.userId + '_remove'}
                style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'transparent', border: '1px solid #fca5a5', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
              >
                Verwijder
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tab 3: Geïnteresseerd ────────────────────────────────────────────────────

function GeinteresseerdTab({ data, actionPending, onRespond }: {
  data: MeetupModalDetail
  actionPending: string | null
  onRespond: (userId: string, response: 'geaccepteerd' | 'geweigerd') => void
}) {
  if (!data.isCreator) {
    return <EmptyState text="Alleen de organisator kan dit zien." icon={<Eye size={32} style={{ opacity: 0.3 }} />} />
  }
  const spotsLeft = data.meetup.maxParticipants - data.acceptedParticipants.length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Header telling */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '10px 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
          <strong>{data.interestedParticipants.length}</strong> mensen tonen interesse
        </span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>·</span>
        <span style={{ fontSize: 12, color: spotsLeft > 0 ? '#059669' : '#ef4444', fontWeight: 700 }}>
          {spotsLeft > 0 ? `${spotsLeft} plekken over` : 'Vol'}
        </span>
      </div>

      {data.interestedParticipants.length === 0 ? (
        <EmptyState text="Nog niemand heeft interesse getoond." />
      ) : (
        data.interestedParticipants.map(p => (
          <div key={p.userId} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: p.message ? 8 : 6 }}>
              <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '1px 0 0' }}>
                  {p.joinedAt ? timeAgo(p.joinedAt) : ''}
                </p>
              </div>
            </div>
            {p.message && (
              <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic', margin: '0 0 8px', paddingLeft: 52, lineHeight: 1.4 }}>
                &ldquo;{p.message}&rdquo;
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, paddingLeft: 2 }}>
              <button
                onClick={() => onRespond(p.userId, 'geaccepteerd')}
                disabled={!!actionPending || spotsLeft <= 0}
                style={{ flex: 1, background: '#22C55E', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: (actionPending || spotsLeft <= 0) ? 'not-allowed' : 'pointer', opacity: (actionPending || spotsLeft <= 0) ? 0.5 : 1 }}
              >
                {actionPending === p.userId ? 'Bezig...' : 'Accepteer ✓'}
              </button>
              <button
                onClick={() => onRespond(p.userId, 'geweigerd')}
                disabled={!!actionPending}
                style={{ flex: 1, background: 'transparent', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: actionPending ? 'not-allowed' : 'pointer', opacity: actionPending ? 0.5 : 1 }}
              >
                Wijs af ✗
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
      {icon ?? <MapPin size={32} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />}
      <p style={{ fontSize: 13 }}>{text}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[140, 100, 200, 300].map(h => (
        <div key={h} style={{ height: h, background: 'rgba(0,0,0,0.06)', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
