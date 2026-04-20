'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Send, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = '#E87722'
const INK    = '#111111'
const SYNE: React.CSSProperties  = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties  = { fontFamily: "'DM Sans', sans-serif" }

// ─── Card color palette ────────────────────────────────────────────────────────
const CARD_COLORS = ['#1B5E3E', '#2D4B8E', '#7C3AED', '#B45309', '#0F766E', '#9D174D', '#1E3A5F', '#3B1F6E']
function cardColor(name: string) { return CARD_COLORS[name.charCodeAt(0) % CARD_COLORS.length] }
function initials(name: string)  { return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() }

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Request chips ─────────────────────────────────────────────────────────────
const SPORT_REQUEST_CHIPS: Record<string, string[]> = {
  Hardlopen: ['Zin in een ochtendrun?', 'Wanneer train jij normaal?', 'Ik zoek een hardloopmaatje!'],
  Fietsen:   ['Zin om samen te fietsen?', 'Welke routes doe jij?', 'Zoek fietsmaatje voor weekendtochten!'],
  Gym:       ['Zin om samen te trainen?', 'Ik zoek een spotterbuddy!', 'Wanneer ga jij naar de gym?'],
  Tennis:    ['Zin voor een set tennis?', 'Welk niveau speel jij?', 'Op zoek naar tennisvriend!'],
  Yoga:      ['Zin om samen te yogen?', 'Welk type yoga doe jij?', 'Zoek yogamaatje voor in het park!'],
}
const DEFAULT_CHIPS = ['Hoi! Zin om samen te sporten?', 'Wanneer ben jij beschikbaar?', 'Laten we iets plannen!']

// ─── Follow request popover ────────────────────────────────────────────────────
function RequestPopover({ buddy, onClose, onSend }: { buddy: Buddy; onClose: () => void; onSend: () => void }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const chips = SPORT_REQUEST_CHIPS[buddy.sports?.[0]?.label ?? ''] ?? DEFAULT_CHIPS

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', width: '100%', borderRadius: '24px 24px 0 0', padding: '20px 20px 0', paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ ...SYNE, fontWeight: 900, fontSize: 17, color: INK }}>Stuur verzoek aan {buddy.name.split(' ')[0]}</div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 999, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#666" />
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {chips.map(c => (
            <button key={c} onClick={() => setMessage(c)} style={{
              padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: message === c ? INK : '#f3f4f6',
              color: message === c ? '#fff' : INK,
              ...DM, fontSize: 13, fontWeight: 600,
            }}>{c}</button>
          ))}
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 300))}
          placeholder="Of schrijf zelf iets..."
          rows={3}
          style={{ width: '100%', borderRadius: 14, border: '1.5px solid #e5e7eb', padding: '10px 14px', fontSize: 14, ...DM, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
          <button onClick={onClose} style={{ flex: 1, height: 48, borderRadius: 14, border: '1.5px solid #e5e7eb', background: 'none', ...DM, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuleren</button>
          <button onClick={handleSend} disabled={sending} style={{ flex: 2, height: 48, borderRadius: 14, border: 'none', background: ACCENT, color: '#fff', ...SYNE, fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending ? 0.6 : 1 }}>
            <Send size={15} />
            {sending ? 'Verzenden...' : 'Stuur verzoek'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Featured topmatch card ────────────────────────────────────────────────────
function FeaturedCard({ buddy, rank, onVolg }: { buddy: Buddy; rank: number; onVolg: () => void }) {
  const bg    = cardColor(buddy.name)
  const inits = initials(buddy.name)
  const score = Math.min(99, 50 + buddy.compatibilityScore)
  const firstName = buddy.name.split(' ')[0]

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: bg, margin: '0 16px' }}>
      {/* Big initials background */}
      <div style={{
        position: 'absolute', right: -10, top: -10,
        fontSize: 130, fontWeight: 900, color: 'rgba(255,255,255,0.10)',
        lineHeight: 1, userSelect: 'none', ...SYNE, letterSpacing: -4,
        pointerEvents: 'none',
      }}>
        {inits}
      </div>

      {/* Top badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 14px 0' }}>
        <div style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, ...DM, fontWeight: 800, color: '#fff' }}>⚡ Topmatch nummer {String(rank).padStart(2, '0')}</span>
        </div>
        <div style={{ background: ACCENT, borderRadius: 999, padding: '5px 12px' }}>
          <span style={{ fontSize: 11, ...DM, fontWeight: 900, color: '#fff' }}>{score}% MATCH</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ ...SYNE, fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 6 }}>{buddy.name}</div>
        <div style={{ ...DM, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
          {[buddy.region, buddy.age > 0 ? `${buddy.age}` : null].filter(Boolean).join(' · ')}
        </div>
        {buddy.bio && (
          <div style={{ ...DM, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.4, marginBottom: 14 }}>
            &ldquo;{buddy.bio.slice(0, 80)}{buddy.bio.length > 80 ? '...' : ''}&rdquo;
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {buddy.sports.slice(0, 3).map(s => (
            <span key={s.label} style={{ padding: '4px 12px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,0.4)', ...DM, fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <div style={{ padding: '0 12px 14px' }}>
        <button
          onClick={onVolg}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none',
            background: buddy.following ? 'rgba(255,255,255,0.2)' : '#fff',
            color: buddy.following ? '#fff' : INK,
            ...SYNE, fontSize: 15, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {buddy.following ? (
            <><span style={{ fontSize: 16 }}>✓</span> Volgend</>
          ) : buddy.requested ? (
            <>Verzoek verstuurd</>
          ) : (
            <><Heart size={16} fill={INK} color={INK} strokeWidth={0} /> VOLG {firstName.toUpperCase()}</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Mini grid card ────────────────────────────────────────────────────────────
function MiniCard({ buddy, onVolg }: { buddy: Buddy; onVolg: () => void }) {
  const bg    = cardColor(buddy.name)
  const inits = initials(buddy.name)
  const score = Math.min(99, 50 + buddy.compatibilityScore)

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: bg, position: 'relative', aspectRatio: '1 / 1.15' }} onClick={onVolg}>
      {/* Initials bg */}
      <div style={{ position: 'absolute', right: -8, top: -8, fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,0.12)', lineHeight: 1, ...SYNE, pointerEvents: 'none' }}>
        {inits}
      </div>

      {/* Match badge */}
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', borderRadius: 999, padding: '3px 8px' }}>
        <span style={{ ...DM, fontSize: 11, fontWeight: 900, color: '#fff' }}>{score}%</span>
      </div>

      {/* Bottom info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 12px 12px', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}>
        <div style={{ ...SYNE, fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{buddy.name.split(' ')[0]}</div>
        <div style={{ ...DM, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          {[buddy.region, buddy.sports[0]?.label].filter(Boolean).join(' · ')}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
type Tab = 'topmatches' | 'nieuw' | 'ochtend' | 'avond' | 'weekend'

export default function FindPage() {
  const [buddies, setBuddies]           = useState<Buddy[]>([])
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState<Tab>('topmatches')
  const [requestTarget, setRequestTarget] = useState<Buddy | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

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

      const myBeschArr: string[] = (myProfile as any)?.beschikbaarheid ?? []
      const myRegion: string     = (myProfile as any)?.region ?? ''
      const lvlMap: Record<string, string> = { beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd' }
      const mySports = (mySportsData ?? []).map(s => ({ label: (Array.isArray(s.sports) ? (s.sports[0] as any)?.name : (s.sports as any)?.name) ?? '', level: lvlMap[s.level] ?? s.level }))

      const sportsMap: Record<string, { label: string; level: string }[]> = {}
      for (const us of userSports ?? []) {
        if (!sportsMap[us.user_id]) sportsMap[us.user_id] = []
        const name = (Array.isArray(us.sports) ? (us.sports[0] as any)?.name : (us.sports as any)?.name) ?? 'Sport'
        sportsMap[us.user_id].push({ label: name, level: lvlMap[us.level] ?? us.level })
      }

      const requestMap: Record<string, string> = {}
      for (const r of myRequests ?? []) requestMap[r.to_user_id] = r.status

      const list: Buddy[] = profiles.filter(p => !blockedIds.has(p.id)).map(p => {
        const sports = sportsMap[p.id] ?? []
        const beschikbaarheid: string[] = (p as any).beschikbaarheid ?? []
        let score = 0
        const shared = sports.filter(bs => mySports.some(ms => ms.label === bs.label))
        if (shared.length > 0) score += 40
        if (shared.some(bs => mySports.find(ms => ms.label === bs.label)?.level === bs.level)) score += 20
        score += Math.min(beschikbaarheid.filter(s => myBeschArr.includes(s)).length * 10, 30)
        if (myRegion && (p as any).region?.toLowerCase() === myRegion.toLowerCase()) score += 10
        return {
          id: p.id,
          name: p.full_name ?? p.username ?? 'Onbekend',
          region: (p as any).region ?? '',
          age: (p as any).age ?? 0,
          bio: (p as any).bio ?? '',
          sports,
          avatarUrl: p.avatar_url ?? undefined,
          following: requestMap[p.id] === 'accepted',
          requested: requestMap[p.id] === 'pending',
          openFollow: (p as any).open_follow ?? false,
          beschikbaarheid,
          compatibilityScore: score,
        }
      })

      setBuddies(list)
      setLoading(false)
    }
    load()
  }, [])

  function confirmRequest(id: string) {
    setBuddies(prev => prev.map(b => b.id === id ? { ...b, requested: true } : b))
    setRequestTarget(null)
  }

  function handleVolg(buddy: Buddy) {
    if (buddy.following || buddy.requested) return
    if (buddy.openFollow) {
      setBuddies(prev => prev.map(b => b.id === buddy.id ? { ...b, following: true } : b))
    } else {
      setRequestTarget(buddy)
    }
  }

  // Tab filtering & sorting
  const byScore    = [...buddies].sort((a, b) => b.compatibilityScore - a.compatibilityScore)
  const byNew      = [...buddies].sort(() => Math.random() - 0.5) // fallback: no created_at
  const ochtend    = buddies.filter(b => b.beschikbaarheid?.includes('ochtend'))
  const avond      = buddies.filter(b => b.beschikbaarheid?.includes('avond'))
  const weekend    = buddies.filter(b => b.beschikbaarheid?.includes('weekend'))

  const tabData: Record<Tab, Buddy[]> = { topmatches: byScore, nieuw: byNew, ochtend, avond, weekend }
  const visible = tabData[tab]
  const [featured, ...rest] = visible

  const tabDefs: { key: Tab; label: string }[] = [
    { key: 'topmatches', label: `Topmatches ${byScore.length}` },
    { key: 'nieuw',      label: `Nieuw ${byNew.length}` },
    { key: 'ochtend',    label: `Ochtend ${ochtend.length}` },
    { key: 'avond',      label: `Avond ${avond.length}` },
    { key: 'weekend',    label: `Weekend ${weekend.length}` },
  ]

  const today = new Date().toLocaleDateString('nl-NL', { weekday: 'long' }).toUpperCase().replace(/^\w/, c => c)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' }}>

        {/* Header */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ ...SYNE, fontSize: 11, fontWeight: 900, color: ACCENT, letterSpacing: 1.5, marginBottom: 4 }}>{today}</div>
          <div style={{ ...SYNE, fontSize: 32, fontWeight: 900, color: INK, letterSpacing: -1, lineHeight: 1.05 }}>Wie past<br />bij jou?</div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 20, WebkitOverflowScrolling: 'touch' }}>
          {tabDefs.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: tab === key ? INK : '#F2F0EC',
              color: tab === key ? '#fff' : INK,
              ...SYNE, fontSize: 13, fontWeight: 800,
              transition: 'all 150ms',
            }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 32px', color: '#999', ...DM, fontSize: 14 }}>
            Geen buddies gevonden voor dit filter
          </div>
        ) : (
          <>
            {/* Featured card */}
            {featured && (
              <FeaturedCard
                buddy={featured}
                rank={1}
                onVolg={() => handleVolg(featured)}
              />
            )}

            {/* Meer topmatches */}
            {rest.length > 0 && (
              <div style={{ padding: '24px 16px 0' }}>
                <div style={{ ...SYNE, fontSize: 11, fontWeight: 900, color: '#999', letterSpacing: 1.2, marginBottom: 12 }}>
                  MEER {tab === 'topmatches' ? 'TOPMATCHES' : tab.toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {rest.slice(0, 8).map(b => (
                    <MiniCard key={b.id} buddy={b} onVolg={() => handleVolg(b)} />
                  ))}
                </div>

                {/* Alle buddies bekijken */}
                {rest.length > 8 && (
                  <button style={{
                    width: '100%', marginTop: 12, height: 48, borderRadius: 14, border: `1.5px solid #e5e7eb`,
                    background: 'none', ...SYNE, fontSize: 14, fontWeight: 800, color: INK, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    Alle {rest.length} buddies <ArrowRight size={15} />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Request popover */}
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
