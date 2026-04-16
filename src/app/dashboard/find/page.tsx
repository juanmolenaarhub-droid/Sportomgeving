'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, Filter, X, UserPlus, Check, MessageCircle, ChevronDown, Send, Lock, ArrowRight } from 'lucide-react'
import { StoryAvatar, type StoryPost } from '@/components/StoryAvatar'
import { ProfileHeader } from '@/components/ProfileHeader'
import { createClient } from '@/lib/supabase'
import { SportSelector } from '@/components/ui/SportSelector'
import { POPULAR_SPORTS, getSportById } from '@/lib/sports'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const LEVELS = ['Alle niveaus', 'Beginner', 'Gemiddeld', 'Gevorderd']

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
  post?: StoryPost
  bannerUrl?: string
  avatarUrl?: string
  beschikbaarheid?: string[]
  lastSeenAt?: string | null
  compatibilityScore?: number
}

const SPORT_REQUEST_CHIPS: Record<string, string[]> = {
  'Hardlopen': ['Zin in een ochtendrun? 🏃', 'Wanneer train jij normaal?', 'Ik zoek een hardloopmaatje!'],
  'Fietsen':   ['Zin om samen te fietsen? 🚴', 'Welke routes doe jij?', 'Zoek fietsmaatje voor weekendtochten!'],
  'Zwemmen':   ['Zin om samen te zwemmen? 🏊', 'Train jij ook vroeg ochtend?', 'Ik zoek baantraining gezelschap!'],
  'Gym':       ['Zin om samen te trainen? 💪', 'Ik zoek een spotterbuddy!', 'Wanneer ga jij naar de gym?'],
  'Voetbal':   ['Zin voor een potje voetbal? ⚽', 'Wanneer speel jij normaal?', 'Op zoek naar 1-op-1 maatje!'],
  'Tennis':    ['Zin voor een set tennis? 🎾', 'Welk niveau speel jij?', 'Op zoek naar tennisvriend!'],
  'Yoga':      ['Zin om samen te yogen? 🧘', 'Welk type yoga doe jij?', 'Zoek yogamaatje voor in het park!'],
  'Padel':     ['Zin voor padel? 🎾', 'Ik zoek een dubbelpartner!', 'Wanneer speel jij normaal?'],
  'Golf':      ['Zin voor een rondje? ⛳', 'Welke baan ken jij?', 'Op zoek naar golfpartner!'],
}
const DEFAULT_REQUEST_CHIPS = ['Hoi! Zin om samen te sporten? 💪', 'Wanneer ben jij beschikbaar?', 'Laten we iets plannen!']

const BESCHIKBAARHEID_LABELS: Record<string, string> = {
  ochtend: '☀️ Ochtend',
  middag:  '🌤 Middag',
  avond:   '🌙 Avond',
  weekend: '📅 Weekend',
}

function getActivityStatus(lastSeenAt: string | null | undefined): 'online' | 'recent' | null {
  if (!lastSeenAt) return null
  const diff = Date.now() - new Date(lastSeenAt).getTime()
  const hours = diff / (1000 * 60 * 60)
  if (hours < 24) return 'online'
  if (hours < 24 * 7) return 'recent'
  return null
}

const ALL_BUDDIES: Buddy[] = [
  {
    id: '1', name: 'Tim van Berg', region: 'Amsterdam', age: 28,
    bio: 'Hardloper en fietser. Op zoek naar iemand voor ochtendrondes in het Vondelpark.',
    sports: [{ label: 'Hardlopen', level: 'Gevorderd' }, { label: 'Fietsen', level: 'Gemiddeld' }],
    following: false, requested: false,
    post: { id: 'p1', user: { name: 'Tim van Berg', avatar: 'TV', region: 'Amsterdam' }, content: 'Geweldige ochtendrun door het Vondelpark. 10km in 52 minuten.', activity_type: 'run', activity_icon: '', activity_label: 'Hardlopen', distance_km: 10.4, duration_minutes: 52, image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', likes_count: 24, comments_count: 5, created_at: '2 min geleden' },
  },
  {
    id: '2', name: 'Sarah Jansen', region: 'Utrecht', age: 25,
    bio: 'Wielrenster op zoek naar trainingsmaatje voor lange tochten in het weekend.',
    sports: [{ label: 'Fietsen', level: 'Gevorderd' }, { label: 'Yoga', level: 'Beginner' }],
    following: true, requested: false, openFollow: true, // voorbeeld open follow
    post: { id: 'p2', user: { name: 'Sarah Jansen', avatar: 'SJ', region: 'Utrecht' }, content: '45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht.', activity_type: 'cycle', activity_icon: '', activity_label: 'Fietsen', distance_km: 45, duration_minutes: 105, image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', likes_count: 41, comments_count: 8, created_at: '1 uur geleden' },
  },
  {
    id: '3', name: 'Marco de Wit', region: 'Rotterdam', age: 32,
    bio: 'Powerlifter, 3x per week in de gym. Op zoek naar een spotterbuddy voor zware sessies.',
    sports: [{ label: 'Gym', level: 'Gevorderd' }, { label: 'Voetbal', level: 'Gemiddeld' }],
    following: false, requested: true,
  },
  {
    id: '4', name: 'Lisa Hoek', region: 'Amsterdam', age: 30,
    bio: 'Yoga en meditatie. Elke zondagochtend park yoga, iedereen welkom.',
    sports: [{ label: 'Yoga', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Beginner' }],
    following: false, requested: false,
    post: { id: 'p4', user: { name: 'Lisa Hoek', avatar: 'LH', region: 'Amsterdam' }, content: 'Zondagochtend yoga in het park. Wie wil volgende week ook komen?', activity_type: 'yoga', activity_icon: '', activity_label: 'Yoga', image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', likes_count: 89, comments_count: 21, created_at: 'Gisteren' },
  },
  {
    id: '5', name: 'Kevin Smit', region: 'Den Haag', age: 22,
    bio: 'Voetballer en recreatief tennisspeler. Op zoek naar iemand voor weekendmatches.',
    sports: [{ label: 'Voetbal', level: 'Gemiddeld' }, { label: 'Tennis', level: 'Beginner' }],
    following: false, requested: false,
  },
  {
    id: '6', name: 'Anna de Boer', region: 'Amsterdam', age: 27,
    bio: 'Triatleet in opleiding. Zwem, fiets en ren. Op zoek naar trainingspartner voor alle drie.',
    sports: [{ label: 'Zwemmen', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Gemiddeld' }, { label: 'Fietsen', level: 'Gemiddeld' }],
    following: false, requested: false,
  },
  {
    id: '7', name: 'Daan Bakker', region: 'Haarlem', age: 35,
    bio: 'Tennis op dinsdagavond en padelcompetitie. Op zoek naar een dubbelpartner.',
    sports: [{ label: 'Tennis', level: 'Gevorderd' }, { label: 'Padel', level: 'Gemiddeld' }],
    following: false, requested: false,
  },
  {
    id: '8', name: 'Emma Visser', region: 'Amstelveen', age: 29,
    bio: 'Golfer en wandelaar. Gezelligheid staat voorop.',
    sports: [{ label: 'Golf', level: 'Gemiddeld' }, { label: 'Wandelen', level: 'Beginner' }],
    following: false, requested: false,
  },
  {
    id: '9', name: 'Jelle Peters', region: 'Utrecht', age: 24,
    bio: 'Basketbal en gym. Op zoek naar iemand voor 1-op-1 in het weekend.',
    sports: [{ label: 'Basketbal', level: 'Gemiddeld' }, { label: 'Gym', level: 'Beginner' }],
    following: false, requested: false,
  },
]

function getLevelStyle(level: string) {
  if (level === 'Gevorderd') return 'bg-black text-white'
  if (level === 'Gemiddeld') return 'bg-[#E87722] text-white'
  return 'bg-gray-100 text-gray-500'
}

// ── Buddy verzoek popover ──────────────────────────────────────────────────────
function BuddyRequestPopover({
  buddy,
  onClose,
  onSend,
}: {
  buddy: Buddy
  onClose: () => void
  onSend: (message: string) => void
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const MAX = 300

  const chips = SPORT_REQUEST_CHIPS[buddy.sports?.[0]?.label ?? ''] ?? DEFAULT_REQUEST_CHIPS

  async function handleSend() {
    setSending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('follow_requests').upsert({
          from_user_id: user.id,
          to_user_id: buddy.id,
          message: message.trim() || null,
          status: 'pending',
          sport: buddy.sports?.[0]?.label ?? null,
        }, { onConflict: 'from_user_id,to_user_id' })

        await supabase.from('activity_log').insert({
          user_id: user.id,
          event_type: 'match_requested',
          metadata: { to_user_id: buddy.id, sport: buddy.sports?.[0]?.label ?? null },
        })
      }
    } catch (_) {
      // silently continue
    }
    onSend(message)
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <StoryAvatar name={buddy.name} size="sm" />
            <div>
              <p style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: '#111' }}>{buddy.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-gray-400">{buddy.region}</p>
                {buddy.sports[0] && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs font-semibold text-[#E87722]">{buddy.sports[0].label}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Snelle chips */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Snel starten</p>
          <div className="flex flex-col gap-1.5">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => setMessage(chip)}
                className="text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  border: `1.5px solid ${message === chip ? '#E87722' : '#F0F0F0'}`,
                  background: message === chip ? '#FFF5EE' : 'white',
                  color: message === chip ? '#E87722' : '#444',
                  cursor: 'pointer',
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Vrij tekstveld */}
        <div className="px-5 pb-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX))}
            placeholder="Of schrijf zelf iets..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] resize-none leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-300">{message.length}/{MAX}</span>
          </div>
        </div>

        {/* Acties */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-3 rounded-xl bg-[#E87722] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#d06a1a] transition-colors disabled:opacity-50"
            style={SYNE}
          >
            <Send className="w-4 h-4" />
            {sending ? 'Verzenden...' : 'Stuur verzoek'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profiel modal ──────────────────────────────────────────────────────────────
function ProfileModal({
  buddy,
  onClose,
  onRequestFollow,
}: {
  buddy: Buddy
  onClose: () => void
  onRequestFollow: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-y-auto shadow-2xl" style={{ maxHeight: 'calc(100dvh - 80px)', marginBottom: 0 }} onClick={e => e.stopPropagation()}>

        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <ProfileHeader
          name={buddy.name}
          bannerUrl={buddy.bannerUrl}
          avatarUrl={buddy.avatarUrl}
          editable={false}
          size="sm"
        />

        <div className="absolute left-5 top-[82px] z-10">
          <StoryAvatar name={buddy.name} size="lg" posts={buddy.post ? [buddy.post] : []} />
        </div>

        {/* Acties */}
        <div className="px-5 pb-2 flex items-center justify-end gap-2 -mt-3">
          {buddy.following && (
            <button className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <MessageCircle className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <FollowButton buddy={buddy} onRequest={onRequestFollow} size="md" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-xl font-black text-black">{buddy.name}</h2>
            {buddy.openFollow && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Open profiel</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1 mb-3">
            <MapPin className="w-3.5 h-3.5" />{buddy.region}
            <span className="text-gray-200">·</span>
            <span>{buddy.age} jaar</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{buddy.bio}</p>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Sporten</p>
            <div className="flex flex-wrap gap-2">
              {buddy.sports.map(sport => (
                <div key={sport.label} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-semibold text-gray-700">{sport.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getLevelStyle(sport.level)}`}>{sport.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volledig profiel knop */}
          <Link
            href={`/dashboard/profile/${buddy.id}`}
            onClick={onClose}
            className="mt-5 flex items-center justify-center gap-2 w-full bg-[#111] hover:bg-[#333] transition-colors rounded-xl px-4 py-3 group"
          >
            <span className="text-sm font-bold text-white">Bekijk volledig profiel</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Volg knop (herbruikbaar) ───────────────────────────────────────────────────
function FollowButton({ buddy, onRequest, size = 'sm' }: { buddy: Buddy; onRequest: () => void; size?: 'sm' | 'md' }) {
  const base = size === 'md'
    ? 'flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors'
    : 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors'

  if (buddy.following) {
    return (
      <button className={`${base} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
        <Check className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} /> Volgend
      </button>
    )
  }
  if (buddy.requested) {
    return (
      <button className={`${base} bg-gray-100 text-gray-400 cursor-default`}>
        Verzonden
      </button>
    )
  }
  if (buddy.openFollow) {
    return (
      <button onClick={onRequest} className={`${base} bg-black text-white hover:bg-gray-800`}>
        <UserPlus className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} /> Volgen
      </button>
    )
  }
  return (
    <button onClick={onRequest} className={`${base} bg-[#111111] text-white hover:bg-[#333]`}>
      <UserPlus className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />
      {size === 'md' ? 'Stuur verzoek' : 'Verzoek'}
    </button>
  )
}

// ── Hoofdpagina ────────────────────────────────────────────────────────────────
export default function FindPage() {
  const [buddies, setBuddies] = useState<Buddy[]>(ALL_BUDDIES)
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('Alle niveaus')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null)
  const [requestTarget, setRequestTarget] = useState<Buddy | null>(null)
  const [myBeschikbaarheid, setMyBeschikbaarheid] = useState<string[]>([])

  // Laad echte gebruikers uit Supabase
  useEffect(() => {
    async function loadRealProfiles() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Haal geblokkeerde gebruikers op (beide richtingen)
      const [{ data: blockedRows }, { data: blockedByRows }] = await Promise.all([
        supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user.id),
        supabase.from('blocked_users').select('blocker_id').eq('blocked_id', user.id),
      ])

      const blockedIds = new Set([
        ...(blockedRows ?? []).map(r => r.blocked_id),
        ...(blockedByRows ?? []).map(r => r.blocker_id),
      ])

      // Haal alle profielen op behalve de eigen gebruiker en geblokkeerden
      // show_in_find=true: alleen users die willen verschijnen in zoeken
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .limit(50)

      if (!profiles || profiles.length === 0) return

      const profileIds = profiles.map(p => p.id)

      // Haal eigen profiel + sporten op voor compatibiliteitsscore
      const [{ data: myProfile }, { data: mySportsData }] = await Promise.all([
        supabase.from('profiles').select('region, beschikbaarheid').eq('id', user.id).single(),
        supabase.from('user_sports').select('level, sports(name)').eq('user_id', user.id),
      ])
      const myBeschArr: string[] = (myProfile as any)?.beschikbaarheid ?? []
      const myRegionStr: string = (myProfile as any)?.region ?? ''
      const levelLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd' }
      const mySportsArr = (mySportsData ?? []).map(s => ({
        label: (Array.isArray(s.sports) ? (s.sports[0] as any)?.name : (s.sports as any)?.name) ?? '',
        level: levelLabel[s.level] ?? s.level,
      }))
      setMyBeschikbaarheid(myBeschArr)

      // Haal sporten op via user_sports + sports join
      const { data: userSports } = await supabase
        .from('user_sports')
        .select('user_id, level, sports(name)')
        .in('user_id', profileIds)

      // Haal follow_request status op voor deze user
      const { data: myRequests } = await supabase
        .from('follow_requests')
        .select('to_user_id, status')
        .eq('from_user_id', user.id)
        .in('to_user_id', profileIds)

      const requestMap: Record<string, string> = {}
      for (const r of myRequests ?? []) {
        requestMap[r.to_user_id] = r.status
      }

      const sportsMap: Record<string, { label: string; level: string }[]> = {}
      for (const us of userSports ?? []) {
        if (!sportsMap[us.user_id]) sportsMap[us.user_id] = []
        const name = (Array.isArray(us.sports) ? (us.sports[0] as any)?.name : (us.sports as any)?.name) ?? 'Sport'
        sportsMap[us.user_id].push({ label: name, level: levelLabel[us.level] ?? us.level })
      }

      const realBuddies: Buddy[] = profiles.filter(p => !blockedIds.has(p.id)).map(p => {
        const sports = sportsMap[p.id] ?? []
        const beschikbaarheid: string[] = (p as any).beschikbaarheid ?? []
        const lastSeenAt: string | null = (p as any).last_seen_at ?? null

        // Compatibiliteitsscore (max 100)
        let score = 0
        const sharedSports = sports.filter(bs => mySportsArr.some(ms => ms.label === bs.label))
        if (sharedSports.length > 0) score += 40
        if (sharedSports.some(bs => mySportsArr.find(ms => ms.label === bs.label)?.level === bs.level)) score += 20
        score += Math.min(beschikbaarheid.filter(s => myBeschArr.includes(s)).length * 10, 30)
        if (myRegionStr && (p as any).region && (p as any).region.toLowerCase() === myRegionStr.toLowerCase()) score += 10

        const showCity   = (p as Record<string, unknown>).show_city          !== false
        const showAge    = (p as Record<string, unknown>).show_age            !== false
        const showOnline = (p as Record<string, unknown>).show_online_status  !== false

        return {
          id: p.id,
          name: p.full_name ?? p.username ?? 'Onbekend',
          region: showCity   ? ((p as Record<string, unknown>).region as string ?? '') : '',
          age:    showAge    ? ((p as Record<string, unknown>).age    as number ?? 0)  : 0,
          bio: (p as Record<string, unknown>).bio as string ?? '',
          sports,
          avatarUrl: p.avatar_url ?? undefined,
          bannerUrl: (p as Record<string, unknown>).banner_url as string ?? undefined,
          following: requestMap[p.id] === 'accepted',
          requested: requestMap[p.id] === 'pending',
          beschikbaarheid,
          lastSeenAt: showOnline ? lastSeenAt : null,
          compatibilityScore: score,
        }
      })

      setBuddies(realBuddies)
    }
    loadRealProfiles()
  }, [])

  function openRequest(buddy: Buddy) {
    if (buddy.openFollow) {
      // Open follow profiel: direct volgen, geen verzoek nodig
      confirmFollow(buddy.id)
    } else {
      setRequestTarget(buddy)
    }
  }

  function confirmFollow(id: string) {
    setBuddies(prev => prev.map(b => b.id === id ? { ...b, following: true, requested: false } : b))
    setSelectedBuddy(prev => prev?.id === id ? { ...prev, following: true, requested: false } : prev)
  }

  function confirmRequest(id: string) {
    setBuddies(prev => prev.map(b => b.id === id ? { ...b, requested: true } : b))
    setSelectedBuddy(prev => prev?.id === id ? { ...prev, requested: true } : prev)
    setRequestTarget(null)
  }

  const filtered = buddies.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.region.toLowerCase().includes(search.toLowerCase())
    const matchSport = !selectedSport || b.sports.some(s => s.label.toLowerCase() === (getSportById(selectedSport)?.label.toLowerCase() ?? selectedSport.toLowerCase()))
    const matchLevel = selectedLevel === 'Alle niveaus' || b.sports.some(s => s.level === selectedLevel)
    const matchRegion = !selectedRegion || b.region.toLowerCase().includes(selectedRegion.toLowerCase())
    return matchSearch && matchSport && matchLevel && matchRegion
  })

  const following = filtered.filter(b => b.following)
  const suggested = filtered.filter(b => !b.following)

  return (
    <div className="space-y-6">

      {/* Info banner: hoe werkt volgen */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-[#E87722] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-black">Volgverzoeken vereist</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Stuur een volgverzoek met een persoonlijk berichtje. De andere sporter beslist of hij/zij jou accepteert.
            Profielen met <span className="font-bold text-amber-700">Open profiel</span> kun je direct volgen.
          </p>
        </div>
      </div>

      {/* Zoekbalk */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op naam of stad..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${showFilters ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Uitgebreide filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <div>
            <SportSelector
              value={selectedSport}
              onChange={v => setSelectedSport(v as string)}
              multiple={false}
              label="Sport"
              placeholder="Alle sporten"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Niveau</label>
              <div className="relative">
                <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] pr-8">
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Stad / Regio</label>
              <input type="text" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} placeholder="bv. Amsterdam" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
            </div>
          </div>
          {(selectedSport || selectedLevel !== 'Alle niveaus' || selectedRegion) && (
            <button onClick={() => { setSelectedSport(''); setSelectedLevel('Alle niveaus'); setSelectedRegion('') }} className="text-sm text-[#E87722] font-semibold hover:underline">Filters wissen</button>
          )}
        </div>
      )}

      {/* Sport snelfilter */}
      {!showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedSport('')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all shrink-0 ${!selectedSport ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}
          >
            Alle
          </button>
          {POPULAR_SPORTS.map(sport => (
            <button key={sport.id} onClick={() => setSelectedSport(selectedSport === sport.id ? '' : sport.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all shrink-0 ${selectedSport === sport.id ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}>
              {sport.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-400 font-medium"><span className="text-black font-bold">{filtered.length}</span> sporters gevonden</p>

      {following.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-black mb-4">Al volgend</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {following.map(buddy => (
              <BuddyCard key={buddy.id} buddy={buddy} myBeschikbaarheid={myBeschikbaarheid} onOpen={() => setSelectedBuddy(buddy)} onRequest={() => openRequest(buddy)} />
            ))}
          </div>
        </section>
      )}

      {suggested.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-black mb-4">{following.length > 0 ? 'Ontdek meer buddies' : 'Aanbevolen voor jou'}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suggested.map(buddy => (
              <BuddyCard key={buddy.id} buddy={buddy} myBeschikbaarheid={myBeschikbaarheid} onOpen={() => setSelectedBuddy(buddy)} onRequest={() => openRequest(buddy)} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Search className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <h3 className="font-black text-black mb-2">Geen sporters gevonden</h3>
          <p className="text-gray-400 text-sm">Pas je filters aan om meer resultaten te zien.</p>
        </div>
      )}

      {/* Profiel modal */}
      {selectedBuddy && !requestTarget && (
        <ProfileModal
          buddy={selectedBuddy}
          onClose={() => setSelectedBuddy(null)}
          onRequestFollow={() => openRequest(selectedBuddy)}
        />
      )}

      {/* Verzoek popover */}
      {requestTarget && (
        <BuddyRequestPopover
          buddy={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSend={() => confirmRequest(requestTarget.id)}
        />
      )}
    </div>
  )
}

function BuddyCard({ buddy, myBeschikbaarheid, onOpen, onRequest }: { buddy: Buddy; myBeschikbaarheid: string[]; onOpen: () => void; onRequest: () => void }) {
  const activityStatus = getActivityStatus(buddy.lastSeenAt)
  const score = buddy.compatibilityScore ?? 0
  const sharedSlots = (buddy.beschikbaarheid ?? []).filter(s => myBeschikbaarheid.includes(s))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          {/* Avatar met activiteitsdot */}
          <button onClick={onOpen} className="relative">
            <StoryAvatar name={buddy.name} size="lg" posts={buddy.post ? [buddy.post] : []} />
            {activityStatus && (
              <span
                className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{ background: activityStatus === 'online' ? '#22C55E' : '#F59E0B' }}
              />
            )}
          </button>

          <div className="flex flex-col items-end gap-1.5" onClick={e => e.stopPropagation()}>
            {/* Compatibiliteitsbadge */}
            {score >= 50 && (
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                style={{ background: '#E87722' }}
              >
                {score}% match
              </span>
            )}
            <FollowButton buddy={buddy} onRequest={onRequest} size="sm" />
          </div>
        </div>

        <button onClick={onOpen} className="text-left w-full">
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-black text-sm group-hover:text-[#E87722] transition-colors">{buddy.name}</h3>
            {buddy.openFollow && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Open</span>}
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{buddy.region} · {buddy.age} jaar</p>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{buddy.bio}</p>
        </button>
      </div>

      {/* Sport badges */}
      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
        {buddy.sports.slice(0, 2).map(sport => (
          <span key={sport.label} className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 px-2.5 py-1 rounded-full text-gray-600">
            {sport.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getLevelStyle(sport.level)}`}>{sport.level}</span>
          </span>
        ))}
        {buddy.sports.length > 2 && <span className="text-xs text-gray-400 font-medium px-2 py-1">+{buddy.sports.length - 2}</span>}
      </div>

      {/* Beschikbaarheid pills */}
      {(buddy.beschikbaarheid ?? []).length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-1">
          {(buddy.beschikbaarheid ?? []).map(slot => {
            const label = BESCHIKBAARHEID_LABELS[slot]
            if (!label) return null
            const shared = sharedSlots.includes(slot)
            return (
              <span
                key={slot}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  borderColor: shared ? '#E87722' : '#E5E5E5',
                  background:  shared ? '#FFF8F4' : 'white',
                  color:       shared ? '#E87722' : '#bbb',
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
