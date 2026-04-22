'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Search, X, Send, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getInitials } from '@/components/ui/Avatar'

// ─── Design tokens ────────────────────────────────────────────────────────────

const BONE   = '#F4F1E8'
const FOREST = '#1E2B20'
const LIME   = '#C4F542'
const DISPLAY: React.CSSProperties = { fontFamily: 'var(--font-display)' }
const BODY:    React.CSSProperties = { fontFamily: 'var(--font-body)' }

// ─── Types ────────────────────────────────────────────────────────────────────

type Buddy = {
  id: string
  name: string
  region: string
  age: number
  bio: string
  sports: { label: string; level: string }[]
  following: boolean
  requested: boolean
  openFollow?: boolean
  avatarUrl?: string
  beschikbaarheid?: string[]
  compatibilityScore: number
}

// ─── Request chips ────────────────────────────────────────────────────────────

const SPORT_REQUEST_CHIPS: Record<string, string[]> = {
  Hardlopen: ['Zin in een ochtendrun?', 'Wanneer train jij normaal?', 'Ik zoek een hardloopmaatje!'],
  Fietsen:   ['Zin om samen te fietsen?', 'Welke routes doe jij?', 'Zoek fietsmaatje voor weekendtochten!'],
  Gym:       ['Zin om samen te trainen?', 'Ik zoek een spotterbuddy!', 'Wanneer ga jij naar de gym?'],
  Tennis:    ['Zin voor een set tennis?', 'Welk niveau speel jij?', 'Op zoek naar tennisvriend!'],
  Yoga:      ['Zin om samen te yogen?', 'Welk type yoga doe jij?', 'Zoek yogamaatje voor in het park!'],
}
const DEFAULT_CHIPS = ['Hoi! Zin om samen te sporten?', 'Wanneer ben jij beschikbaar?', 'Laten we iets plannen!']

// ─── Request popover ──────────────────────────────────────────────────────────

function RequestPopover({ buddy, onClose, onSend }: { buddy: Buddy; onClose: () => void; onSend: () => void }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const chips = SPORT_REQUEST_CHIPS[buddy.sports?.[0]?.label ?? ''] ?? DEFAULT_CHIPS
  const inits = getInitials(buddy.name)

  async function handleSend() {
    setSending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('follow_requests').upsert({
          from_user_id: user.id, to_user_id: buddy.id,
          message: message.trim() || null, status: 'pending',
          sport: buddy.sports?.[0]?.label ?? null,
        }, { onConflict: 'from_user_id,to_user_id' })
      }
    } catch (_) {}
    onSend()
    setSending(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: BONE, width: '100%', borderRadius: '4px 4px 0 0', padding: '20px 20px 0', paddingBottom: 'calc(max(28px, env(safe-area-inset-bottom)) + 76px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {buddy.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={buddy.avatarUrl} alt={buddy.name} style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 4, background: FOREST, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ ...DISPLAY, fontSize: 14, fontWeight: 900, color: LIME }}>{inits}</span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ ...DISPLAY, fontWeight: 900, fontSize: 16, color: FOREST, textTransform: 'uppercase' }}>
              Buddy worden met {buddy.name.split(' ')[0]}
            </div>
            {buddy.sports[0] && (
              <div style={{ ...BODY, fontSize: 12, color: `rgba(30,43,32,0.60)`, marginTop: 1 }}>{buddy.sports[0].label}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: `rgba(30,43,32,0.08)`, border: 'none', borderRadius: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} color={FOREST} />
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {chips.map(c => (
            <button key={c} onClick={() => setMessage(c)} style={{
              padding: '7px 14px', borderRadius: 4, border: `1px solid ${message === c ? 'transparent' : `rgba(30,43,32,0.20)`}`,
              cursor: 'pointer',
              background: message === c ? FOREST : 'transparent',
              color: message === c ? LIME : FOREST,
              ...DISPLAY, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>{c}</button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 300))}
          placeholder="Of schrijf zelf iets..."
          rows={3}
          style={{ width: '100%', borderRadius: 4, border: `1.5px solid rgba(30,43,32,0.20)`, padding: '10px 14px', fontSize: 14, ...BODY, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12, background: 'transparent', color: FOREST }}
        />

        <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: 48, borderRadius: 4, border: `1px solid rgba(30,43,32,0.20)`, background: 'none', ...DISPLAY, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', color: FOREST, cursor: 'pointer' }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{ flex: 2, height: 48, borderRadius: 4, border: 'none', background: FOREST, color: LIME, ...DISPLAY, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending ? 0.6 : 1 }}
          >
            <Send size={15} />
            {sending ? 'Verzenden...' : 'Stuur verzoek'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Search result row ────────────────────────────────────────────────────────

function SearchRow({ buddy, onRequest }: { buddy: Buddy; onRequest: () => void }) {
  const inits = getInitials(buddy.name)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
      {buddy.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={buddy.avatarUrl} alt={buddy.name} style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 4, background: FOREST, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ ...DISPLAY, fontSize: 14, fontWeight: 900, color: LIME }}>{inits}</span>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...DISPLAY, fontSize: 14, fontWeight: 900, color: FOREST, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {buddy.name}
        </div>
        <div style={{ ...BODY, fontSize: 12, color: `rgba(30,43,32,0.60)`, marginTop: 1 }}>
          {[buddy.region, buddy.sports[0]?.label].filter(Boolean).join(' · ') || 'Sporter'}
        </div>
      </div>
      <button
        onClick={onRequest}
        disabled={buddy.following || buddy.requested}
        style={{
          flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 4,
          border: buddy.following || buddy.requested ? `1px solid rgba(30,43,32,0.15)` : 'none',
          cursor: buddy.following || buddy.requested ? 'default' : 'pointer',
          background: buddy.following || buddy.requested ? 'transparent' : FOREST,
          color: buddy.following || buddy.requested ? `rgba(30,43,32,0.40)` : LIME,
          ...DISPLAY, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase',
        }}
      >
        {buddy.following ? 'BUDDY' : buddy.requested ? 'VERZONDEN' : 'VERZOEK'}
      </button>
    </div>
  )
}

// ─── Hero match card ──────────────────────────────────────────────────────────

function FeaturedCard({ buddy, rank, onRequest }: { buddy: Buddy; rank: number; onRequest: () => void }) {
  const inits     = getInitials(buddy.name)
  const score     = Math.min(99, 50 + buddy.compatibilityScore)
  const firstName = buddy.name.split(' ')[0]

  return (
    <div style={{ borderRadius: 4, overflow: 'hidden', position: 'relative', background: FOREST, margin: '0 16px' }}>

      {/* Giant initials ornament */}
      <div style={{ position: 'absolute', right: -12, bottom: -20, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}>
        <span style={{ ...DISPLAY, fontWeight: 900, fontSize: 200, color: 'rgba(196,245,66,0.12)', lineHeight: 1, letterSpacing: -4 }}>
          {inits}
        </span>
      </div>

      {/* Media overlay if avatar */}
      {buddy.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={buddy.avatarUrl}
          alt={buddy.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.30 }}
        />
      )}

      {/* Content */}
      <div style={{ position: 'relative', padding: 16 }}>

        {/* Top pills row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ background: BONE, borderRadius: 4, padding: '4px 10px' }}>
            <span style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: FOREST, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              TOPMATCH #{String(rank).padStart(2, '0')}
            </span>
          </div>
          <div style={{ background: LIME, borderRadius: 4, padding: '4px 10px' }}>
            <span style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: FOREST, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              {score}% MATCH
            </span>
          </div>
        </div>

        {/* Name + location */}
        <h2 style={{ ...DISPLAY, fontWeight: 900, fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.01em', textTransform: 'uppercase', color: BONE, marginBottom: 4 }}>
          {buddy.name}
        </h2>
        <p style={{ ...BODY, fontSize: 12, color: LIME, marginBottom: 12 }}>
          {[buddy.region, buddy.age > 0 ? `${buddy.age} jaar` : null].filter(Boolean).join(' · ')}
        </p>

        {/* Quote */}
        {buddy.bio && (
          <p style={{ ...BODY, fontSize: 12, color: 'rgba(244,241,232,0.75)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 14 }}>
            &ldquo;{buddy.bio.slice(0, 80)}{buddy.bio.length > 80 ? '…' : ''}&rdquo;
          </p>
        )}

        {/* Sport pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {buddy.sports.slice(0, 3).map((s, i) => (
            <span key={s.label} style={{
              padding: '4px 10px', borderRadius: 4,
              background: i === 0 ? LIME : 'rgba(244,241,232,0.15)',
              ...DISPLAY, fontSize: 9, fontWeight: 900, letterSpacing: '0.10em', textTransform: 'uppercase',
              color: i === 0 ? FOREST : BONE,
            }}>
              {s.label.toUpperCase()}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onRequest}
          disabled={buddy.following || buddy.requested}
          style={{
            width: '100%', height: 52, borderRadius: 4, border: 'none',
            background: buddy.following || buddy.requested ? 'rgba(244,241,232,0.15)' : LIME,
            color: buddy.following || buddy.requested ? 'rgba(244,241,232,0.60)' : FOREST,
            ...DISPLAY, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase',
            cursor: buddy.following || buddy.requested ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {buddy.following ? (
            <>✓ JULLIE ZIJN BUDDIES</>
          ) : buddy.requested ? (
            <>VERZOEK VERSTUURD</>
          ) : (
            <><UserPlus size={15} /> BUDDY WORDEN MET {firstName.toUpperCase()}</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function MiniCard({ buddy, index, onRequest }: { buddy: Buddy; index: number; onRequest: () => void }) {
  const inits    = getInitials(buddy.name)
  const score    = Math.min(99, 50 + buddy.compatibilityScore)
  const isDark   = index % 2 === 0

  const bg          = isDark ? FOREST : BONE
  const border      = isDark ? 'none' : `1px solid ${FOREST}`
  const nameColor   = isDark ? BONE : FOREST
  const infoColor   = isDark ? `rgba(244,241,232,0.60)` : `rgba(30,43,32,0.60)`
  const ornamentColor = isDark ? 'rgba(196,245,66,0.12)' : 'rgba(30,43,32,0.08)'
  const scoreColor  = isDark ? LIME : FOREST

  return (
    <div
      style={{ borderRadius: 4, overflow: 'hidden', background: bg, border, position: 'relative', aspectRatio: '1 / 1.2', cursor: 'pointer' }}
      onClick={onRequest}
    >
      {/* Photo or initials ornament */}
      {buddy.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={buddy.avatarUrl} alt={buddy.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', right: -8, bottom: -10, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}>
          <span style={{ ...DISPLAY, fontWeight: 900, fontSize: 90, color: ornamentColor, lineHeight: 1 }}>
            {inits}
          </span>
        </div>
      )}

      {/* Score */}
      <div style={{ position: 'absolute', top: 8, right: 8 }}>
        <span style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: scoreColor, letterSpacing: '0.10em' }}>
          {score}%
        </span>
      </div>

      {/* Status */}
      {(buddy.following || buddy.requested) && (
        <div style={{ position: 'absolute', top: 8, left: 8, background: buddy.following ? LIME : `rgba(30,43,32,0.20)`, borderRadius: 4, padding: '3px 7px' }}>
          <span style={{ ...DISPLAY, fontSize: 8, fontWeight: 900, color: buddy.following ? FOREST : nameColor, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            {buddy.following ? 'BUDDY' : 'VERZONDEN'}
          </span>
        </div>
      )}

      {/* Name + info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 10px 10px', background: buddy.avatarUrl ? 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' : 'none' }}>
        <div style={{ ...DISPLAY, fontSize: 13, fontWeight: 900, letterSpacing: '-0.01em', textTransform: 'uppercase', color: buddy.avatarUrl ? '#fff' : nameColor, lineHeight: 1.1 }}>
          {buddy.name.split(' ')[0]}
        </div>
        {buddy.sports[0] && (
          <div style={{ ...BODY, fontSize: 10, color: buddy.avatarUrl ? 'rgba(255,255,255,0.70)' : infoColor, marginTop: 2 }}>
            {buddy.sports[0].label}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'topmatches' | 'nieuw' | 'ochtend' | 'avond' | 'weekend'

export default function FindPage() {
  const [buddies,        setBuddies]        = useState<Buddy[]>([])
  const [loading,        setLoading]        = useState(true)
  const [tab,            setTab]            = useState<Tab>('topmatches')
  const [requestTarget,  setRequestTarget]  = useState<Buddy | null>(null)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchResults,  setSearchResults]  = useState<Buddy[]>([])
  const [searchLoading,  setSearchLoading]  = useState(false)
  const [showAll,        setShowAll]        = useState(false)

  const byNewRef      = useRef<Buddy[] | null>(null)
  const searchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentUserId = useRef<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      currentUserId.current = user.id

      const [{ data: blockedRows }, { data: blockedByRows }] = await Promise.all([
        supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user.id),
        supabase.from('blocked_users').select('blocker_id').eq('blocked_id', user.id),
      ])
      const blockedIds = new Set([
        ...(blockedRows ?? []).map(r => r.blocked_id),
        ...(blockedByRows ?? []).map(r => r.blocker_id),
      ])

      const { data: profiles } = await supabase.from('profiles').select('*').neq('id', user.id).limit(50)
      if (!profiles?.length) { setLoading(false); return }

      const profileIds = profiles.map(p => p.id)
      const [{ data: myProfile }, { data: mySportsData }, { data: userSports }, { data: myRequests }] = await Promise.all([
        supabase.from('profiles').select('region, beschikbaarheid').eq('id', user.id).single(),
        supabase.from('user_sports').select('level, sports(name)').eq('user_id', user.id),
        supabase.from('user_sports').select('user_id, level, sports(name)').in('user_id', profileIds),
        supabase.from('follow_requests').select('to_user_id, status').eq('from_user_id', user.id).in('to_user_id', profileIds),
      ])

      const myBeschArr: string[] = (myProfile as unknown as Record<string, unknown>)?.beschikbaarheid as string[] ?? []
      const myRegion: string     = (myProfile as unknown as Record<string, unknown>)?.region as string ?? ''
      const lvlMap: Record<string, string> = { beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd' }
      const mySports = (mySportsData ?? []).map(s => ({ label: (Array.isArray(s.sports) ? (s.sports[0] as Record<string, unknown>)?.name : (s.sports as Record<string, unknown>)?.name) as string ?? '', level: lvlMap[s.level] ?? s.level }))

      const sportsMap: Record<string, { label: string; level: string }[]> = {}
      for (const us of userSports ?? []) {
        if (!sportsMap[us.user_id]) sportsMap[us.user_id] = []
        const name = (Array.isArray(us.sports) ? (us.sports[0] as Record<string, unknown>)?.name : (us.sports as Record<string, unknown>)?.name) as string ?? 'Sport'
        sportsMap[us.user_id].push({ label: name, level: lvlMap[us.level] ?? us.level })
      }

      const requestMap: Record<string, string> = {}
      for (const r of myRequests ?? []) requestMap[r.to_user_id] = r.status

      const list: Buddy[] = profiles.filter(p => !blockedIds.has(p.id)).map(p => {
        let sports = sportsMap[p.id] ?? []
        const profileSport = (p as unknown as Record<string, unknown>).sport as string | null
        if (sports.length === 0 && profileSport) sports = [{ label: profileSport, level: '' }]

        const beschikbaarheid: string[] = (p as unknown as Record<string, unknown>).beschikbaarheid as string[] ?? []
        let score = 0
        const shared = sports.filter(bs => mySports.some(ms => ms.label === bs.label))
        if (shared.length > 0) score += 40
        if (shared.some(bs => mySports.find(ms => ms.label === bs.label)?.level === bs.level)) score += 20
        score += Math.min(beschikbaarheid.filter(s => myBeschArr.includes(s)).length * 10, 30)
        if (myRegion && (p as unknown as Record<string, unknown>).region?.toString().toLowerCase() === myRegion.toLowerCase()) score += 10

        return {
          id: p.id,
          name: p.full_name ?? p.username ?? 'Onbekend',
          region: (p as unknown as Record<string, unknown>).region as string ?? '',
          age: (p as unknown as Record<string, unknown>).age as number ?? 0,
          bio: (p as unknown as Record<string, unknown>).bio as string ?? '',
          sports,
          avatarUrl: p.avatar_url ?? undefined,
          following: requestMap[p.id] === 'accepted',
          requested: requestMap[p.id] === 'pending',
          openFollow: (p as unknown as Record<string, unknown>).open_follow as boolean ?? false,
          beschikbaarheid,
          compatibilityScore: score,
        }
      })

      setBuddies(list)
      if (!byNewRef.current) byNewRef.current = [...list].sort(() => Math.random() - 0.5)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!searchQuery.trim()) { setSearchResults([]); return }

    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const supabase = createClient()
        const q = searchQuery.trim()
        const { data } = await supabase.from('profiles')
          .select('*')
          .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
          .neq('id', currentUserId.current ?? '')
          .limit(25)

        if (data) {
          const existingMap = new Map(buddies.map(b => [b.id, b]))
          const results: Buddy[] = data.map(p => {
            if (existingMap.has(p.id)) return existingMap.get(p.id)!
            const profileSport = (p as unknown as Record<string, unknown>).sport as string | null
            return {
              id: p.id,
              name: p.full_name ?? p.username ?? 'Onbekend',
              region: (p as unknown as Record<string, unknown>).region as string ?? '',
              age: (p as unknown as Record<string, unknown>).age as number ?? 0,
              bio: (p as unknown as Record<string, unknown>).bio as string ?? '',
              sports: profileSport ? [{ label: profileSport, level: '' }] : [],
              avatarUrl: p.avatar_url ?? undefined,
              following: false, requested: false,
              beschikbaarheid: [],
              compatibilityScore: 0,
            }
          })
          setSearchResults(results)
        }
      } catch (_) {}
      setSearchLoading(false)
    }, 300)
  }, [searchQuery, buddies])

  function confirmRequest(id: string) {
    setBuddies(prev => prev.map(b => b.id === id ? { ...b, requested: true } : b))
    setSearchResults(prev => prev.map(b => b.id === id ? { ...b, requested: true } : b))
    if (byNewRef.current) byNewRef.current = byNewRef.current.map(b => b.id === id ? { ...b, requested: true } : b)
    setRequestTarget(null)
  }

  function handleRequest(buddy: Buddy) {
    if (buddy.following || buddy.requested) return
    setRequestTarget(buddy)
  }

  function handleTabChange(t: Tab) { setTab(t); setShowAll(false) }

  const byScore = [...buddies].sort((a, b) => b.compatibilityScore - a.compatibilityScore)
  const byNew   = byNewRef.current ?? buddies
  const ochtend = buddies.filter(b => b.beschikbaarheid?.includes('ochtend'))
  const avond   = buddies.filter(b => b.beschikbaarheid?.includes('avond'))
  const weekend = buddies.filter(b => b.beschikbaarheid?.includes('weekend'))

  const tabData: Record<Tab, Buddy[]> = { topmatches: byScore, nieuw: byNew, ochtend, avond, weekend }
  const visible = tabData[tab]
  const [featured, ...rest] = visible
  const visibleRest = showAll ? rest : rest.slice(0, 8)
  const isSearching = searchQuery.trim().length > 0

  const tabDefs: { key: Tab; label: string; count: number }[] = [
    { key: 'topmatches', label: 'Matches',  count: byScore.length },
    { key: 'nieuw',      label: 'Nieuw',    count: byNew.length },
    { key: 'ochtend',    label: 'Ochtend',  count: ochtend.length },
    { key: 'avond',      label: 'Avond',    count: avond.length },
    { key: 'weekend',    label: 'Weekend',  count: weekend.length },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: BONE, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}>

        {/* ── Editorial header ──────────────────────────────────────────── */}
        <div style={{ padding: '0 20px 20px' }}>
          <p style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: LIME, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            VANDAAG
          </p>
          <h1 style={{ ...DISPLAY, fontSize: 38, fontWeight: 900, color: FOREST, letterSpacing: '-0.02em', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 20 }}>
            Wie past<br />bij jou?
          </h1>

          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 0 }}>
            <Search size={15} color={`rgba(30,43,32,0.45)`} style={{ position: 'absolute', left: 12, pointerEvents: 'none', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Zoek op naam, gebruikersnaam..."
              style={{
                width: '100%', height: 42, borderRadius: 4, border: `1px solid rgba(30,43,32,0.20)`,
                background: 'rgba(30,43,32,0.05)', paddingLeft: 38, paddingRight: searchQuery ? 40 : 14,
                ...BODY, fontSize: 14, color: FOREST, outline: 'none', boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 10, background: `rgba(30,43,32,0.10)`, border: 'none', borderRadius: 4, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} color={FOREST} />
              </button>
            )}
          </div>
        </div>

        {/* ── Search results ────────────────────────────────────────────── */}
        {isSearching ? (
          searchLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid rgba(30,43,32,0.10)`, borderTopColor: FOREST, animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 32px', ...BODY, fontSize: 14, color: `rgba(30,43,32,0.45)` }}>
              Geen gebruikers gevonden voor &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <div>
              <div style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: `rgba(30,43,32,0.45)`, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0 20px 12px' }}>
                {searchResults.length} RESULTATEN
              </div>
              {searchResults.map(b => (
                <SearchRow key={b.id} buddy={b} onRequest={() => handleRequest(b)} />
              ))}
            </div>
          )
        ) : (
          <>
            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 20, WebkitOverflowScrolling: 'touch' }}>
              {tabDefs.map(({ key, label, count }) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    style={{
                      flexShrink: 0, height: 34, padding: '0 12px', borderRadius: 4, cursor: 'pointer',
                      border: active ? 'none' : `1px solid ${FOREST}`,
                      background: active ? FOREST : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{ ...DISPLAY, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', color: active ? LIME : FOREST }}>
                      {label}
                    </span>
                    {count > 0 && (
                      <span style={{
                        minWidth: 18, height: 16, borderRadius: 4, padding: '0 4px',
                        background: active ? LIME : `rgba(30,43,32,0.10)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        ...DISPLAY, fontSize: 8, fontWeight: 900, color: active ? FOREST : `rgba(30,43,32,0.60)`,
                        letterSpacing: '0.05em',
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid rgba(30,43,32,0.10)`, borderTopColor: FOREST, animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            ) : visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 32px', ...BODY, fontSize: 14, color: `rgba(30,43,32,0.45)` }}>
                Geen buddies gevonden voor dit filter
              </div>
            ) : (
              <>
                {featured && (
                  <FeaturedCard buddy={featured} rank={1} onRequest={() => handleRequest(featured)} />
                )}

                {rest.length > 0 && (
                  <div style={{ padding: '24px 16px 0' }}>
                    <p style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: FOREST, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                      MEER {tab === 'topmatches' ? 'TOPMATCHES' : tab.toUpperCase()}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {visibleRest.map((b, i) => (
                        <MiniCard key={b.id} buddy={b} index={i} onRequest={() => handleRequest(b)} />
                      ))}
                    </div>

                    {rest.length > 8 && (
                      <button
                        onClick={() => setShowAll(v => !v)}
                        style={{
                          width: '100%', marginTop: 12, height: 48, borderRadius: 4,
                          border: `1px solid rgba(30,43,32,0.20)`, background: 'none',
                          ...DISPLAY, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', color: FOREST,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        {showAll ? 'MINDER TONEN' : <>{`ALLE ${rest.length} BUDDIES`} <ArrowRight size={14} /></>}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {requestTarget && (
        <RequestPopover
          buddy={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSend={() => confirmRequest(requestTarget.id)}
        />
      )}
    </div>
  )
}
