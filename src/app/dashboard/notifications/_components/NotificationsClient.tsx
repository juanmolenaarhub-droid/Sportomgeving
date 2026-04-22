'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, Check, X, ChevronLeft,
  MapPin, MessageCircle, Heart, Zap, Trophy, UserPlus, Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { acceptBuddyRequest, declineBuddyRequest } from '../../actions'
import { markNotificationRead } from '@/app/actions/notifications'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Notif = {
  id: string
  type: string
  message: string
  link: string | null
  target_type: string | null
  target_id: string | null
  created_at: string
  read: boolean
}

type PendingRequest = {
  id: string
  from_user_id: string
  sport: string | null
  message: string | null
  created_at: string
  from_profile: {
    full_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }
const CREAM  = '#F4F1E8'
const ORANGE = '#C4F542'
const INK    = '#1E2B20'
const GREEN  = '#1D9E75'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const USER_COLORS = ['#D4538C','#7F77DD','#1D9E75','#C4F542','#3A7AC4','#D4A87A','#E8A560','#5B4A8B']

function getUserColor(id: string): string {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return USER_COLORS[hash % USER_COLORS.length]
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'nu'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}u`
  if (days  === 1) return 'gisteren'
  if (days  < 7)  return `${days}d`
  return `${Math.floor(days / 7)}w`
}

function resolveRoute(n: Notif): string {
  if (n.target_type && n.target_id) {
    switch (n.target_type) {
      case 'post':    return `/dashboard/posts/${n.target_id}`
      case 'comment': return `/dashboard/posts/${n.target_id}`
      case 'meetup':  return `/dashboard/meetup/${n.target_id}`
      case 'group':   return `/dashboard/groups/${n.target_id}`
      case 'message': return `/dashboard/messages`
      case 'buddy_request': return `/dashboard/notifications`
    }
  }
  if (n.link) return n.link
  const t = n.type.toLowerCase()
  if (t.includes('meetup'))                             return '/dashboard/meetup'
  if (t.includes('message') || t.includes('chat'))     return '/dashboard/messages'
  if (t.includes('accepted'))                          return '/dashboard/messages'
  if (t.includes('match') || t.includes('buddy') || t.includes('request') || t.includes('follow')) return '/dashboard/notifications'
  return '/dashboard/feed'
}

// ─── Kleur per notificatietype ──────────────────────────────────────────────────

function getTypeColor(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('meetup') || t.includes('spontaan'))    return ORANGE
  if (t.includes('message') || t.includes('chat'))       return '#3A7AC4'
  if (t.includes('accepted') || t.includes('match'))     return GREEN
  if (t.includes('like') || t.includes('heart'))         return '#D4538C'
  if (t.includes('interest') || t.includes('challenge') || t.includes('trophy')) return '#7F77DD'
  if (t.includes('buddy') || t.includes('request'))      return ORANGE
  return INK
}

function getTypeBg(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('meetup') || t.includes('spontaan')) return 'rgba(232,119,34,0.12)'
  if (t.includes('message') || t.includes('chat'))    return 'rgba(58,122,196,0.12)'
  if (t.includes('accepted') || t.includes('match'))  return 'rgba(29,158,117,0.12)'
  if (t.includes('like'))                             return 'rgba(212,83,140,0.12)'
  if (t.includes('interest') || t.includes('trophy')) return 'rgba(127,119,221,0.12)'
  return 'rgba(17,17,17,0.06)'
}

function getTypeBadgeLabel(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('meetup_created') || t.includes('new_meetup')) return 'NIEUWE MEETUP'
  if (t.includes('meetup_invite'))   return 'UITNODIGING'
  if (t.includes('meetup_interest') || t.includes('interest')) return 'INTERESSE'
  if (t.includes('meetup'))          return 'MEETUP'
  if (t.includes('match'))           return 'NIEUWE MATCH'
  if (t.includes('message') || t.includes('chat')) return 'BERICHT'
  if (t.includes('like'))            return 'LIKE'
  if (t.includes('trophy') || t.includes('achievement')) return 'PRESTATIE'
  if (t.includes('buddy') || t.includes('request')) return 'BUDDY VERZOEK'
  return 'NIEUW'
}

function getActionLabel(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('meetup'))          return 'Bekijk meetup'
  if (t.includes('match'))           return 'Bekijk profiel'
  if (t.includes('message') || t.includes('chat')) return 'Open chat'
  if (t.includes('interest'))        return 'Bekijk reactie'
  return 'Bekijken'
}

// ─── Icon per type ─────────────────────────────────────────────────────────────

function TypeIcon({ type, size = 16, color }: { type: string; size?: number; color?: string }) {
  const c = color ?? getTypeColor(type)
  const t = type.toLowerCase()
  const s = { width: size, height: size, color: c, flexShrink: 0 } as React.CSSProperties
  if (t.includes('meetup') || t.includes('spontaan')) return <MapPin style={s} />
  if (t.includes('message') || t.includes('chat'))    return <MessageCircle style={s} />
  if (t.includes('accepted') || t.includes('match'))  return <Check style={s} />
  if (t.includes('like'))                             return <Heart style={s} />
  if (t.includes('trophy') || t.includes('achievement')) return <Trophy style={s} />
  if (t.includes('spontaan'))                         return <Zap style={s} />
  if (t.includes('interest'))                         return <Zap style={s} />
  if (t.includes('buddy') || t.includes('request'))   return <UserPlus style={s} />
  if (t.includes('calendar'))                         return <Calendar style={s} />
  return <Bell style={s} />
}

// ─── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{ ...DM, fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(17,17,17,0.45)', padding: '0 20px', marginBottom: 10 }}>
      {label}
    </p>
  )
}

// ─── Featured hero: buddy verzoek ──────────────────────────────────────────────

function HeroRequestCard({
  req, onAccepted, onDeclined,
}: {
  req: PendingRequest
  onAccepted: () => void
  onDeclined: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)
  const router = useRouter()

  const name      = req.from_profile?.full_name ?? req.from_profile?.username ?? 'Iemand'
  const color     = getUserColor(req.from_user_id)
  const inits     = getInitials(name)
  const firstName = name.split(' ')[0]

  if (done === 'accepted') {
    return (
      <div style={{ margin: '0 20px', borderRadius: 24, background: GREEN, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check style={{ width: 22, height: 22, color: 'white' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 4 }}>Je bent nu buddies met {firstName}!</p>
          <button onClick={() => router.push('/dashboard/messages')} style={{ ...DM, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            Open chat →
          </button>
        </div>
      </div>
    )
  }

  if (done === 'declined') {
    return (
      <div style={{ margin: '0 20px', borderRadius: 24, background: 'white', padding: 20, textAlign: 'center' }}>
        <p style={{ ...DM, fontSize: 13, color: 'rgba(17,17,17,0.45)' }}>Verzoek van {firstName} geweigerd.</p>
      </div>
    )
  }

  return (
    <div style={{ margin: '0 20px', borderRadius: 24, overflow: 'hidden', position: 'relative', background: color }}>
      {/* Reuze initialen ornament */}
      <div style={{ position: 'absolute', right: -12, bottom: -20, pointerEvents: 'none', userSelect: 'none' }}>
        <span style={{ ...SYNE, fontWeight: 800, fontSize: 180, color: 'rgba(255,255,255,0.10)', lineHeight: 1 }}>
          {inits}
        </span>
      </div>
      <div style={{ position: 'relative', padding: 20, minHeight: 190, display: 'flex', flexDirection: 'column' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '6px 12px', alignSelf: 'flex-start' }}>
          <UserPlus style={{ width: 10, height: 10, color: INK }} />
          <span style={{ ...DM, fontSize: 10, fontWeight: 700, color: INK, letterSpacing: '0.08em' }}>BUDDY VERZOEK</span>
        </div>
        <div style={{ marginTop: 'auto', marginBottom: 12 }}>
          {req.from_profile?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={req.from_profile.avatar_url} alt={name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)', marginBottom: 8 }} />
          )}
          <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 20, color: 'white', lineHeight: 1.1, marginBottom: 4 }}>
            {firstName} wil jouw sportbuddy worden
          </h2>
          {(req.sport || req.message) && (
            <p style={{ ...DM, fontSize: 11, color: 'rgba(255,255,255,0.80)' }}>
              {req.sport && <strong>{req.sport}</strong>}
              {req.sport && req.message && ' · '}
              {req.message && `"${req.message.slice(0, 50)}…"`}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => startTransition(async () => { await acceptBuddyRequest(req.id); setDone('accepted'); onAccepted() })}
            disabled={isPending}
            style={{ flex: 1, height: 40, borderRadius: 20, border: 'none', background: 'white', color: INK, ...SYNE, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: isPending ? 0.7 : 1 }}>
            <Check style={{ width: 13, height: 13 }} /> Accepteer
          </button>
          <button onClick={() => startTransition(async () => { await declineBuddyRequest(req.id); setDone('declined'); onDeclined() })}
            disabled={isPending}
            style={{ flex: 1, height: 40, borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.35)', background: 'transparent', color: 'white', ...DM, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: isPending ? 0.7 : 1 }}>
            <X style={{ width: 13, height: 13 }} /> Weigeren
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Compact buddy request rij ─────────────────────────────────────────────────

function RequestRow({ req, onAccepted, onDeclined }: { req: PendingRequest; onAccepted: () => void; onDeclined: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)
  const router = useRouter()

  const name  = req.from_profile?.full_name ?? req.from_profile?.username ?? 'Iemand'
  const color = getUserColor(req.from_user_id)
  const inits = getInitials(name)

  if (done === 'accepted') {
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check style={{ width: 15, height: 15, color: 'white' }} />
        </div>
        <p style={{ ...DM, fontSize: 13, fontWeight: 700, color: GREEN, flex: 1 }}>Jullie zijn nu buddies!</p>
        <button onClick={() => router.push('/dashboard/messages')} style={{ ...DM, fontSize: 11, fontWeight: 700, color: INK, background: 'rgba(17,17,17,0.06)', border: 'none', borderRadius: 999, padding: '5px 10px', cursor: 'pointer' }}>Chat</button>
      </div>
    )
  }
  if (done === 'declined') {
    return (
      <div style={{ background: 'white', borderRadius: 16, padding: '10px 14px', textAlign: 'center' }}>
        <p style={{ ...DM, fontSize: 12, color: 'rgba(17,17,17,0.40)' }}>Verzoek geweigerd</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {req.from_profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={req.from_profile.avatar_url} alt={name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ ...SYNE, fontSize: 12, fontWeight: 800, color: 'white' }}>{inits}</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...DM, fontSize: 13, fontWeight: 700, color: INK }}>{name}</p>
        <p style={{ ...DM, fontSize: 11, color: 'rgba(17,17,17,0.55)', marginTop: 1 }}>
          {req.sport ?? 'Wil jouw sportbuddy worden'} · {timeAgo(req.created_at)}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => startTransition(async () => { await acceptBuddyRequest(req.id); setDone('accepted'); onAccepted() })}
          disabled={isPending}
          style={{ width: 32, height: 32, borderRadius: '50%', background: GREEN, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isPending ? 0.6 : 1 }}>
          <Check style={{ width: 14, height: 14, color: 'white' }} />
        </button>
        <button onClick={() => startTransition(async () => { await declineBuddyRequest(req.id); setDone('declined'); onDeclined() })}
          disabled={isPending}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(17,17,17,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isPending ? 0.6 : 1 }}>
          <X style={{ width: 13, height: 13, color: INK }} />
        </button>
      </div>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
    </div>
  )
}

// ─── Featured hero: system notificatie ─────────────────────────────────────────

function FeaturedNotifCard({ notif, onRead }: { notif: Notif; onRead: (id: string) => void }) {
  const router = useRouter()
  const color  = getUserColor(notif.target_id ?? notif.id)
  const inits  = getInitials(notif.message.split(' ').slice(0, 2).join(' '))

  async function handleClick() {
    onRead(notif.id)
    await markNotificationRead(notif.id)
    router.push(resolveRoute(notif))
  }

  return (
    <div style={{ margin: '0 20px', borderRadius: 24, overflow: 'hidden', position: 'relative', background: color }}>
      {/* Reuze initialen ornament */}
      <div style={{ position: 'absolute', right: -12, bottom: -20, pointerEvents: 'none', userSelect: 'none' }}>
        <span style={{ ...SYNE, fontWeight: 800, fontSize: 180, color: 'rgba(255,255,255,0.10)', lineHeight: 1 }}>
          {inits}
        </span>
      </div>
      <div style={{ position: 'relative', padding: 20, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '6px 12px', alignSelf: 'flex-start' }}>
          <TypeIcon type={notif.type} size={10} color={INK} />
          <span style={{ ...DM, fontSize: 10, fontWeight: 700, color: INK, letterSpacing: '0.08em' }}>
            {getTypeBadgeLabel(notif.type)}
          </span>
        </div>

        {/* Headline */}
        <div style={{ marginTop: 'auto' }}>
          <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 20, color: 'white', lineHeight: 1.15, marginBottom: 4 }}>
            {notif.message.length > 70 ? notif.message.slice(0, 68) + '…' : notif.message}
          </h2>
          <p style={{ ...DM, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 12 }}>
            {timeAgo(notif.created_at)} · {getActionLabel(notif.type) === 'Bekijk meetup' ? 'Doe je mee?' : 'Nieuw voor jou'}
          </p>
          {/* CTA */}
          <button
            onClick={handleClick}
            style={{ background: 'white', borderRadius: 999, padding: '7px 16px', border: 'none', cursor: 'pointer', ...DM, fontSize: 11, fontWeight: 700, color: INK }}
          >
            {getActionLabel(notif.type)}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Compacte notificatie rij ──────────────────────────────────────────────────

function NotifRow({ notif, onRead }: { notif: Notif; onRead: (id: string) => void }) {
  const router = useRouter()

  async function handleClick() {
    if (!notif.read) {
      onRead(notif.id)
      await markNotificationRead(notif.id)
    }
    router.push(resolveRoute(notif))
  }

  const typeColor = getTypeColor(notif.type)
  const typeBg    = getTypeBg(notif.type)

  return (
    <button
      onClick={handleClick}
      style={{
        width: '100%', background: 'white', borderRadius: 16,
        padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        opacity: notif.read ? 0.55 : 1,
        transition: 'opacity 200ms',
      }}
    >
      {/* Icon circle 32×32, gekleurde achtergrond per type */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: typeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <TypeIcon type={notif.type} size={14} color={typeColor} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...DM, fontSize: 12, fontWeight: notif.read ? 500 : 700, color: INK, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {notif.message}
        </p>
        <p style={{ ...DM, fontSize: 10, color: 'rgba(17,17,17,0.45)', marginTop: 2 }}>
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Oranje unread dot rechts */}
      {!notif.read && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
      )}
    </button>
  )
}

// ─── Priority logic voor featured ──────────────────────────────────────────────

const PRIORITY_TYPES = [
  'meetup_invite', 'match', 'meetup_created', 'meetup_interest', 'message',
]

function findFeaturedNotif(notifs: Notif[]): Notif | null {
  if (notifs.length === 0) return null
  // Prefer unread priority notifications first
  const unread = notifs.filter(n => !n.read)
  for (const pt of PRIORITY_TYPES) {
    const found = unread.find(n => n.type.toLowerCase().includes(pt))
    if (found) return found
  }
  if (unread.length > 0) return unread[0]
  // Fall back to most recent read notification so hero card always shows
  return notifs[0]
}

// ─── Hoofdcomponent ────────────────────────────────────────────────────────────

export default function NotificationsClient({
  notifications: initialNotifs,
  pendingRequests: initialRequests,
}: {
  notifications: Notif[]
  pendingRequests: PendingRequest[]
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [notifs,   setNotifs]   = useState<Notif[]>(initialNotifs ?? [])
  const [requests, setRequests] = useState<PendingRequest[]>(initialRequests ?? [])

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllAsRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('system_notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }

  // Realtime
  useEffect(() => {
    let userId = ''
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      userId = user.id
      const channel = supabase
        .channel('notif-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications', filter: `user_id=eq.${userId}` },
          payload => setNotifs(prev => [payload.new as Notif, ...prev]))
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Derived state ─────────────────────────────────────────────────────────────

  const featuredRequest = requests[0] ?? null
  const restRequests    = requests.slice(1)

  const featuredNotif = useMemo(() => {
    // Als er een buddy-request featured is, hoef je geen notif te featuren
    if (featuredRequest) return null
    return findFeaturedNotif(notifs)
  }, [notifs, featuredRequest])

  const recentNotifs = useMemo(() =>
    notifs.filter(n => !n.read && n.id !== featuredNotif?.id),
    [notifs, featuredNotif])

  const earlierNotifs = useMemo(() =>
    notifs.filter(n => n.read && n.id !== featuredNotif?.id),
    [notifs, featuredNotif])

  const totalUnread = requests.length + notifs.filter(n => !n.read).length
  const isEmpty     = requests.length === 0 && notifs.length === 0

  return (
    <div style={{ background: CREAM, minHeight: '100vh', paddingBottom: 40 }}>

      {/* ── Top nav ────────────────────────────────────────────────────── */}
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 8px) 12px 0', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeft style={{ width: 18, height: 18, color: INK }} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── Editorial header ───────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 24px' }}>
        <p style={{ ...DM, fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: ORANGE, marginBottom: 4 }}>
          ACTIVITEIT
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ ...SYNE, fontWeight: 800, fontSize: 36, lineHeight: 0.95, letterSpacing: '-0.02em', color: INK }}>
            Notificaties
          </h1>
          {totalUnread > 0 && (
            <span style={{ ...DM, fontSize: 12, fontWeight: 700, color: 'rgba(17,17,17,0.45)', paddingBottom: 4 }}>
              {totalUnread} nieuw
            </span>
          )}
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {isEmpty && (
        <div style={{ margin: '0 20px', background: 'white', borderRadius: 24, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Bell style={{ width: 22, height: 22, color: 'rgba(17,17,17,0.30)' }} />
          </div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 18, color: INK, marginBottom: 6 }}>Alles up to date</p>
          <p style={{ ...DM, fontSize: 13, color: 'rgba(17,17,17,0.50)' }}>Geen nieuwe notificaties</p>
        </div>
      )}

      {/* ── UITNODIGING: featured buddy request ────────────────────────── */}
      {featuredRequest && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="NIEUW VOOR JOU" />
          <HeroRequestCard
            req={featuredRequest}
            onAccepted={() => setRequests(prev => prev.filter(r => r.id !== featuredRequest.id))}
            onDeclined={() => setRequests(prev => prev.filter(r => r.id !== featuredRequest.id))}
          />
        </div>
      )}

      {/* ── VERZOEKEN: resterende buddy requests ───────────────────────── */}
      {restRequests.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label={`VERZOEKEN · ${restRequests.length}`} />
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {restRequests.map(req => (
              <RequestRow
                key={req.id}
                req={req}
                onAccepted={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
                onDeclined={() => setRequests(prev => prev.filter(r => r.id !== req.id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Featured system notificatie ────────────────────────────────── */}
      {featuredNotif && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="NIEUW VOOR JOU" />
          <FeaturedNotifCard notif={featuredNotif} onRead={markRead} />
        </div>
      )}

      {/* ── RECENT: overige ongelezen ──────────────────────────────────── */}
      {recentNotifs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="RECENT" />
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onRead={markRead} />
            ))}
          </div>
        </div>
      )}

      {/* ── EERDER: gelezen notificaties ──────────────────────────────── */}
      {earlierNotifs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionLabel label="EERDER" />
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {earlierNotifs.map(n => (
              <NotifRow key={n.id} notif={n} onRead={markRead} />
            ))}
          </div>
        </div>
      )}

      {/* ── Markeer alles als gelezen ─────────────────────────────────── */}
      {totalUnread > 0 && (
        <div style={{ padding: '0 12px' }}>
          <button
            onClick={markAllAsRead}
            style={{
              width: '100%', height: 36, borderRadius: 999,
              background: CREAM, border: '1px solid rgba(17,17,17,0.10)',
              ...DM, fontSize: 11, fontWeight: 500, color: 'rgba(17,17,17,0.60)',
              cursor: 'pointer',
            }}
          >
            Markeer alles als gelezen
          </button>
        </div>
      )}
    </div>
  )
}
