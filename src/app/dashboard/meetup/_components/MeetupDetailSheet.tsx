'use client'

import { useState, useEffect, useTransition } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin, Users, Globe, Lock } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import {
  getMeetupDetailForModal,
  respondToInterest,
  markAttended,
  removeParticipant,
  showInterest,
  withdrawInterest,
  type MeetupModalDetail,
  type ModalParticipant,
} from '@/app/actions/meetups'
import MeetupBeheerSheet from './MeetupBeheerSheet'

const LocationPreviewMap = dynamic(() => import('./LocationPreviewMap'), { ssr: false })

// ─── Constanten ───────────────────────────────────────────────────────────────

const ORANGE_GRADIENT = 'linear-gradient(160deg, #C4F542 0%, #8B3300 100%)'

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

function timeUntilExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}u ${m}m` : `${m} min`
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)
  if (m < 1) return 'Zojuist'
  if (m < 60) return `${m} min geleden`
  if (h < 24) return `${h} uur geleden`
  return `${day} dag${day > 1 ? 'en' : ''} geleden`
}

// ─── Gedeelde stijlen ─────────────────────────────────────────────────────────

const ROW: React.CSSProperties = {
  padding: '14px 16px', borderBottom: '1px solid #F9FAFB',
  display: 'flex', alignItems: 'center', gap: 14,
}
const ICON_BOX: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%', background: '#F3F4F6',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
const ROW_LABEL: React.CSSProperties = { fontSize: 13, color: '#9CA3AF', margin: '0 0 2px' }
const ROW_VALUE: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: '#1E2B20', margin: 0 }
const CHIP: React.CSSProperties = {
  border: '1px solid #E5E7EB', borderRadius: 20, padding: '5px 12px',
  fontSize: 13, color: '#374151', background: '#fff',
}

// ─── Typen ────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'aanwezig' | 'geinteresseerd'

type Props = {
  meetupId: string
  onClose: () => void
  onInterestSuccess: (meetupId: string) => void
  onMeetupDeleted?: (meetupId: string) => void
}

// ─── Hoofd component ──────────────────────────────────────────────────────────

export default function MeetupDetailSheet({ meetupId, onClose, onInterestSuccess, onMeetupDeleted }: Props) {
  const [data, setData] = useState<MeetupModalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [tab, setTab] = useState<Tab>('info')
  const [visible, setVisible] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [actionPending, setActionPending] = useState<string | null>(null)
  const [myStatus, setMyStatus] = useState<string | null>(null)
  const [myDeclinedAt, setMyDeclinedAt] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setLoading(true)
    setFetchError(false)
    getMeetupDetailForModal(meetupId)
      .then(async d => {
        setData(d)
        if (d) {
          setMyStatus(d.myStatus)
          // Haal declined_at op als geweigerd
          if (d.myStatus === 'geweigerd' && d.currentUserId) {
            try {
              const { createClient } = await import('@/lib/supabase')
              const supabase = createClient()
              const { data: p } = await supabase
                .from('meetup_participants')
                .select('declined_at')
                .eq('meetup_id', meetupId)
                .eq('user_id', d.currentUserId)
                .single()
              setMyDeclinedAt((p as Record<string, unknown>)?.declined_at as string | null ?? null)
            } catch { /* kolom bestaat mogelijk nog niet */ }
          }
        }
        if (!d) setFetchError(true)
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [meetupId, retryCount])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  function showToastMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleRespond(userId: string, response: 'geaccepteerd' | 'geweigerd') {
    if (!data) return
    setActionPending(userId)
    await respondToInterest(data.meetup.id, userId, response)
    const fresh = await getMeetupDetailForModal(meetupId)
    setData(fresh)
    setActionPending(null)
    showToastMsg(response === 'geaccepteerd' ? 'Deelnemer geaccepteerd' : 'Deelnemer geweigerd')
    if (response === 'geaccepteerd') onInterestSuccess(meetupId)
  }

  async function handleMarkAttended(userId: string) {
    if (!data) return
    setActionPending(userId + '_attend')
    await markAttended(data.meetup.id, userId)
    const fresh = await getMeetupDetailForModal(meetupId)
    setData(fresh)
    setActionPending(null)
    showToastMsg('Aanwezigheid bevestigd')
  }

  async function handleRemove(userId: string) {
    if (!data) return
    setActionPending(userId + '_remove')
    await removeParticipant(data.meetup.id, userId)
    const fresh = await getMeetupDetailForModal(meetupId)
    setData(fresh)
    setActionPending(null)
    showToastMsg('Deelnemer verwijderd')
  }

  function handleInterest() {
    if (!data || actionPending) return
    setActionPending('interest')
    startTransition(async () => {
      const res = await showInterest(data.meetup.id)
      if (res.success) {
        setMyStatus('interesse')
        onInterestSuccess(meetupId)
        showToastMsg('Interesse verstuurd! De organisator beslist of je mee mag doen.')
      }
      setActionPending(null)
    })
  }

  function handleWithdraw() {
    if (!data || actionPending) return
    setActionPending('withdraw')
    startTransition(async () => {
      const res = await withdrawInterest(data.meetup.id)
      if (res.success) {
        setMyStatus(null)
        showToastMsg('Interesse ingetrokken.')
      }
      setActionPending(null)
    })
  }

  async function handleRefreshData() {
    const fresh = await getMeetupDetailForModal(meetupId)
    if (fresh) setData(fresh)
  }

  function handleMeetupGone() {
    onMeetupDeleted?.(meetupId)
    handleClose()
  }

  // Cover achtergrond
  const m = data?.meetup
  const coverBg: React.CSSProperties = m?.coverImageUrl
    ? { backgroundImage: `url(${m.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: ORANGE_GRADIENT }


  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
          height: '92vh', borderRadius: '20px 20px 0 0',
          background: '#FFFFFF', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-out',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 -4px 40px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: '#D1D5DB', borderRadius: 4 }} />
        </div>

        {/* ── STICKY HEADER ── */}
        <div style={{ position: 'relative', height: 140, flexShrink: 0, ...coverBg }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)',
          }} />

          {/* Terug pijl */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute', top: 12, left: 12, zIndex: 5,
              width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft size={16} color="white" />
          </button>

          {/* Spontaan badge */}
          {m?.isSpontaneous && (
            <span style={{
              position: 'absolute', top: 12, right: 12, zIndex: 5,
              background: '#C4F542', color: '#fff', fontSize: 12, fontWeight: 700,
              padding: '4px 10px', borderRadius: 20,
            }}>Nu</span>
          )}

          {/* Sport emoji + titel linksonder */}
          {m && (
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', alignItems: 'flex-end', gap: 9 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white', flexShrink: 0, letterSpacing: 0.5 }}>
                {m.sport.slice(0, 3).toUpperCase()}
              </div>
              <p style={{ color: '#fff', fontSize: 17, fontWeight: 700, lineHeight: 1.25, margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m.title}
              </p>
            </div>
          )}
        </div>

        {/* ── STICKY TABS ── */}
        <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          {([
            { key: 'info' as const, label: 'Info', count: null },
            { key: 'aanwezig' as const, label: 'Aanwezig', count: data?.acceptedParticipants.length ?? null },
            { key: 'geinteresseerd' as const, label: 'Geïnteresseerd', count: null },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '12px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: tab === t.key ? '2px solid #C4F542' : '2px solid transparent',
                fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? '#1E2B20' : '#9CA3AF',
                transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              {t.label}
              {t.count !== null && (
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 90, background: '#fff' }}>
          {loading ? (
            <LoadingSkeleton />
          ) : fetchError || !data ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1E2B20', margin: '0 0 6px' }}>Kon meetup niet laden</p>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px' }}>Controleer je verbinding en probeer opnieuw</p>
              <button
                onClick={() => setRetryCount(c => c + 1)}
                style={{ background: '#1E2B20', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Probeer opnieuw
              </button>
            </div>
          ) : tab === 'info' ? (
            <InfoTab data={data} />
          ) : tab === 'aanwezig' ? (
            <AanwezigTab data={data} actionPending={actionPending} onMarkAttended={handleMarkAttended} onRemove={handleRemove} />
          ) : (
            <GeinteresseerdTab data={data} actionPending={actionPending} onRespond={handleRespond} />
          )}
        </div>

        {/* ── STICKY FOOTER ── */}
        {!loading && data && (
          <div style={{ background: '#fff', borderTop: '1px solid #F3F4F6', padding: '12px 16px', flexShrink: 0 }}>
            <FooterButton
              meetup={data.meetup}
              isCreator={data.isCreator}
              myStatus={myStatus}
              myDeclinedAt={myDeclinedAt}
              onInterest={handleInterest}
              onManage={() => setShowManage(true)}
              onWithdraw={handleWithdraw}
              onDeclinedCleared={() => setMyStatus(null)}
              actionPending={actionPending}
            />
          </div>
        )}

        {/* ── BEHEER SHEET (slide in van rechts, bovenop de sheet) ── */}
        {data && (
          <MeetupBeheerSheet
            data={data}
            meetupId={meetupId}
            visible={showManage}
            onBack={() => setShowManage(false)}
            onMeetupGone={handleMeetupGone}
            onRefresh={handleRefreshData}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 210,
          background: '#1E2B20', color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '10px 20px', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}

// ─── Tab 1: Info ──────────────────────────────────────────────────────────────

function InfoTab({ data }: {
  data: MeetupModalDetail
}) {
  const m = data.meetup
  const c = data.creator
  const interestedCount = data.interestedParticipants.length
  const spotsLeft = m.maxParticipants - data.acceptedParticipants.length

  const isExpiringSoon = m.isSpontaneous && m.expiresAt
    ? (new Date(m.expiresAt).getTime() - Date.now()) < 3600000
    : false

  function formatDay(): string {
    if (m.isSpontaneous) return 'Nu'
    if (!m.date) return '—'
    return new Date(`${m.date}T00:00`).toLocaleDateString('nl-NL', { weekday: 'long' })
  }

  function formatDateValue(): string {
    if (m.isSpontaneous) {
      return m.expiresAt ? `Verloopt over ${timeUntilExpiry(m.expiresAt)}` : 'Spontaan'
    }
    if (!m.date) return '—'
    const d = new Date(`${m.date}T${m.time ?? '00:00'}`)
    const dateStr = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
    const timeStr = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    return `${dateStr} · ${timeStr}`
  }

  return (
    <div>
      {/* Social proof banner */}
      {interestedCount >= 3 && (
        <div style={{ margin: '16px 16px 0', background: '#DCFCE7', borderRadius: 20, padding: '6px 14px' }}>
          <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>
            Al {interestedCount} mensen zijn geïnteresseerd
          </span>
        </div>
      )}

      {/* Property chips */}
      <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span style={CHIP}>🏆 Alle niveaus welkom</span>
        <span style={CHIP}>👥 Max {m.maxParticipants} personen</span>
        {m.visibility === 'publiek'
          ? <span style={CHIP}><Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Publiek</span>
          : <span style={CHIP}><Lock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Alleen buddies</span>
        }
      </div>

      {/* Beschrijving */}
      {m.description && (
        <p style={{ padding: '0 16px 16px', fontSize: 15, color: '#374151', lineHeight: 1.6, margin: 0 }}>
          {m.description}
        </p>
      )}

      {/* Info rijen */}
      <div>
        {/* Host rij */}
        <Link href={`/dashboard/profile/${c.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ ...ROW, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <Avatar name={c.name} imageUrl={c.avatarUrl} size="sm" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={ROW_LABEL}>Host</p>
              <p style={ROW_VALUE}>{c.name}</p>
            </div>
            <span style={{ color: '#D1D5DB', fontSize: 20 }}>›</span>
          </div>
        </Link>

        {/* Datum/tijd rij */}
        <div style={ROW}>
          <div style={ICON_BOX}>
            <CalendarDays size={20} color="#6B7280" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={ROW_LABEL}>{formatDay()}</p>
            <p style={{ ...ROW_VALUE, color: isExpiringSoon ? '#DC2626' : '#1E2B20' }}>
              {formatDateValue()}
            </p>
          </div>
        </div>

        {/* Locatie rij */}
        {m.hasLocationAccess ? (
          <a
            href={`https://maps.apple.com/?q=${encodeURIComponent(m.locationName)}&ll=${m.latitude},${m.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...ROW, textDecoration: 'none', color: 'inherit', display: 'flex', cursor: 'pointer' }}
          >
            <div style={ICON_BOX}>
              <MapPin size={20} color="#6B7280" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={ROW_LABEL}>{m.locationName}</p>
              <p style={ROW_VALUE}>{m.locationAddress ?? m.city}</p>
            </div>
            <span style={{ color: '#D1D5DB', fontSize: 20 }}>›</span>
          </a>
        ) : (
          <div style={ROW}>
            <div style={ICON_BOX}>
              <MapPin size={20} color="#6B7280" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={ROW_LABEL}>{m.locationName}</p>
              <p style={{ ...ROW_VALUE, color: '#9CA3AF', fontSize: 13 }}>Exact adres na acceptatie</p>
            </div>
          </div>
        )}

        {/* Deelnemers rij */}
        <div style={ROW}>
          <div style={ICON_BOX}>
            <Users size={20} color="#6B7280" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={ROW_LABEL}>Deelnemers</p>
            <p style={{ ...ROW_VALUE, color: spotsLeft <= 0 ? '#DC2626' : '#1E2B20' }}>
              {data.acceptedParticipants.length} aanwezig
              {spotsLeft > 0 ? ` · ${spotsLeft} plekken over` : ' · Vol'}
            </p>
          </div>
        </div>
      </div>

      {/* Mini Mapbox kaart */}
      <div style={{ margin: '8px 16px 0', borderRadius: 12, overflow: 'hidden', height: 200, border: '1px solid rgba(0,0,0,0.07)' }}>
        <LocationPreviewMap lat={m.displayLat} lon={m.displayLon} />
      </div>

      {m.hasLocationAccess ? (
        <a
          href={`https://maps.apple.com/?q=${encodeURIComponent(m.locationName)}&ll=${m.latitude},${m.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', fontSize: 13, color: '#3B82F6', fontWeight: 600, padding: '8px 16px', textDecoration: 'none' }}
        >
          Openen in Maps →
        </a>
      ) : (
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>
          Locatie op postcodeniveau — exacte pin na acceptatie
        </p>
      )}
    </div>
  )
}

// ─── Tab 2: Aanwezig ──────────────────────────────────────────────────────────

function AanwezigTab({ data, actionPending, onMarkAttended, onRemove }: {
  data: MeetupModalDetail
  actionPending: string | null
  onMarkAttended: (userId: string) => void
  onRemove: (userId: string) => void
}) {
  if (data.acceptedParticipants.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Users size={48} color="#9CA3AF" style={{ display: 'block', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>Nog geen deelnemers</p>
      </div>
    )
  }

  return (
    <div>
      {data.acceptedParticipants.map((p: ModalParticipant) => (
        <div key={p.userId} style={{ ...ROW, alignItems: 'center' }}>
          <Link href={`/dashboard/profile/${p.userId}`} style={{ flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden' }}>
              <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
            </div>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/dashboard/profile/${p.userId}`} style={{ fontSize: 14, fontWeight: 700, color: '#1E2B20', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}>
              {p.name}
            </Link>
            {p.attended
              ? <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 700 }}>✓ Aanwezig</span>
              : <span style={{ fontSize: 12, color: '#9CA3AF' }}>Geaccepteerd</span>
            }
          </div>
          {data.isCreator && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {!p.attended && (
                <button
                  onClick={() => onMarkAttended(p.userId)}
                  disabled={actionPending === p.userId + '_attend'}
                  style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
                >
                  ✓ Aanwezig
                </button>
              )}
              <button
                onClick={() => onRemove(p.userId)}
                disabled={actionPending === p.userId + '_remove'}
                style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', background: 'transparent', border: '1px solid #FCA5A5', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
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
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Lock size={32} color="#9CA3AF" style={{ display: 'block', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>Alleen zichtbaar voor de organisator</p>
      </div>
    )
  }

  const spotsLeft = data.meetup.maxParticipants - data.acceptedParticipants.length

  return (
    <div>
      {/* Banner */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
        <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
          <strong>{data.interestedParticipants.length}</strong> mensen geïnteresseerd ·{' '}
          <span style={{ color: spotsLeft > 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
            {spotsLeft > 0 ? `${spotsLeft} plekken beschikbaar` : 'Vol'}
          </span>
        </p>
      </div>

      {data.interestedParticipants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>Nog niemand heeft interesse getoond.</p>
        </div>
      ) : (
        data.interestedParticipants.map((p: ModalParticipant) => (
          <div key={p.userId} style={{ padding: '12px 16px', borderBottom: '1px solid #F9FAFB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: p.message ? 8 : 6 }}>
              <Link href={`/dashboard/profile/${p.userId}`} style={{ flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden' }}>
                  <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/dashboard/profile/${p.userId}`} style={{ fontSize: 14, fontWeight: 700, color: '#1E2B20', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textDecoration: 'none' }}>
                  {p.name}
                </Link>
                {p.joinedAt && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '1px 0 0' }}>{timeAgo(p.joinedAt)}</p>
                )}
              </div>
            </div>
            {p.message && (
              <p style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', margin: '0 0 8px', paddingLeft: 56, lineHeight: 1.4 }}>
                &ldquo;{p.message}&rdquo;
              </p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onRespond(p.userId, 'geaccepteerd')}
                disabled={!!actionPending || spotsLeft <= 0}
                style={{
                  flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '6px 14px', fontSize: 13, fontWeight: 700,
                  cursor: (actionPending || spotsLeft <= 0) ? 'not-allowed' : 'pointer',
                  opacity: (actionPending || spotsLeft <= 0) ? 0.5 : 1,
                }}
              >
                ✓ Accepteer
              </button>
              <button
                onClick={() => onRespond(p.userId, 'geweigerd')}
                disabled={!!actionPending}
                style={{
                  flex: 1, background: '#fff', color: '#DC2626', border: '1.5px solid #DC2626',
                  borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700,
                  cursor: actionPending ? 'not-allowed' : 'pointer',
                  opacity: actionPending ? 0.5 : 1,
                }}
              >
                ✗ Weiger
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Footer knop ──────────────────────────────────────────────────────────────

function FooterButton({ meetup, isCreator, myStatus, myDeclinedAt, onInterest, onManage, onWithdraw, onDeclinedCleared, actionPending }: {
  meetup: MeetupModalDetail['meetup']
  isCreator: boolean
  myStatus: string | null
  myDeclinedAt: string | null
  onInterest: () => void
  onManage: () => void
  onWithdraw: () => void
  onDeclinedCleared: () => void
  actionPending: string | null
}) {
  const hoursSinceDecline = myDeclinedAt
    ? (Date.now() - new Date(myDeclinedAt).getTime()) / 3600000
    : null
  const declineExpired = hoursSinceDecline !== null && hoursSinceDecline >= 24

  // Na 24u: verwijder geweigerd record
  useEffect(() => {
    if (myStatus === 'geweigerd' && declineExpired) {
      import('@/app/actions/meetups').then(({ clearDeclinedParticipant }) => {
        clearDeclinedParticipant(meetup.id).then(({ cleared }) => {
          if (cleared) onDeclinedCleared()
        })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)

  const base: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'center',
    borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700,
    border: 'none', cursor: 'pointer', textDecoration: 'none',
  }

  if (isCreator) {
    return (
      <button onClick={onManage} style={{ ...base, background: '#1E2B20', color: '#fff' }}>
        Beheer Meetup
      </button>
    )
  }
  if (myStatus === 'geaccepteerd') {
    return (
      <a href={`/dashboard/messages?meetup=${meetup.id}`} style={{ ...base, background: '#16A34A', color: '#fff', display: 'block' }}>
        Ga naar Meetup chat
      </a>
    )
  }
  if (myStatus === 'geweigerd' && !declineExpired) {
    return (
      <div style={{ textAlign: 'center' }}>
        <button disabled style={{ ...base, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', cursor: 'not-allowed' }}>
          Niet geselecteerd
        </button>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '6px 0 0' }}>
          Je kunt opnieuw interesse tonen na 24 uur
        </p>
      </div>
    )
  }
  if (myStatus === 'interesse') {
    if (confirmWithdraw) {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setConfirmWithdraw(false)}
            style={{ flex: 1, background: '#F3F4F6', color: '#1E2B20', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Nee
          </button>
          <button
            onClick={onWithdraw}
            disabled={actionPending === 'withdraw'}
            style={{ flex: 1, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: actionPending === 'withdraw' ? 0.6 : 1 }}
          >
            {actionPending === 'withdraw' ? 'Bezig...' : 'Ja, intrekken'}
          </button>
        </div>
      )
    }
    return (
      <div style={{ textAlign: 'center' }}>
        <button disabled style={{ ...base, background: '#C4F542', color: '#fff', opacity: 0.85, cursor: 'not-allowed' }}>
          Wacht op acceptatie...
        </button>
        <button
          onClick={() => setConfirmWithdraw(true)}
          style={{ marginTop: 6, fontSize: 12, color: '#9CA3AF', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Intrekken ×
        </button>
      </div>
    )
  }
  if (meetup.status === 'open') {
    return (
      <button
        onClick={onInterest}
        disabled={actionPending === 'interest'}
        style={{
          ...base, background: '#C4F542', color: '#fff',
          opacity: actionPending === 'interest' ? 0.6 : 1,
          cursor: actionPending === 'interest' ? 'not-allowed' : 'pointer',
        }}
      >
        {actionPending === 'interest' ? 'Bezig...' : 'Interesse tonen'}
      </button>
    )
  }
  return null
}

// ─── Laad-skeleton ────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`@keyframes skelPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      {[72, 56, 44, 200, 56, 56].map((h, i) => (
        <div
          key={i}
          style={{
            height: h, background: 'rgba(0,0,0,0.07)', borderRadius: 12,
            animation: `skelPulse 1.5s ease-in-out ${i * 0.08}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
