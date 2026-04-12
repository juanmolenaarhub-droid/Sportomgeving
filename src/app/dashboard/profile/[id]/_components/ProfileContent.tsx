'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MapPin, Award, MessageCircle, UserPlus, Check, ArrowLeft,
  Users, Heart, Flame, Trophy, Calendar, Clock, ChevronRight,
  Send, X, Lock, Zap,
} from 'lucide-react'
import { ProfileHeader } from '@/components/ProfileHeader'
import { createClient } from '@/lib/supabase'

// ── Demo verrijkingsdata ──────────────────────────────────────────────────────
const DEMO_ENRICHMENT: Record<string, {
  age: number
  stats: { volgers: number; volgend: number; posts: number; groepen: number }
  recentPosts: { id: string; content: string; sport: string; time: string; likes: number; comments: number; image?: string; distance?: number; duration?: number }[]
  groups: { name: string; members: number; sport: string }[]
  achievements: { label: string; icon: string }[]
}> = {
  '1': {
    age: 28,
    stats: { volgers: 142, volgend: 89, posts: 34, groepen: 3 },
    recentPosts: [
      { id: 'r1', content: 'Geweldige ochtendrun door het Vondelpark. 10km in 52 minuten — persoonlijk record!', sport: 'Hardlopen', time: '2 uur geleden', likes: 24, comments: 5, image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', distance: 10.4, duration: 52 },
      { id: 'r2', content: 'Halve marathon dit weekend. Wie loopt er ook mee in Amsterdam?', sport: 'Hardlopen', time: '3 dagen geleden', likes: 38, comments: 12 },
    ],
    groups: [{ name: 'Vondelpark Runners', members: 41, sport: 'Hardlopen' }, { name: 'Cycling Amsterdam', members: 24, sport: 'Fietsen' }],
    achievements: [{ label: '10 runs gedeeld', icon: '🏃' }, { label: 'Eerste halve marathon', icon: '🏅' }],
  },
  '2': {
    age: 25,
    stats: { volgers: 287, volgend: 134, posts: 67, groepen: 5 },
    recentPosts: [
      { id: 'r1', content: '45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht.', sport: 'Fietsen', time: '1 uur geleden', likes: 41, comments: 8, image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', distance: 45, duration: 105 },
    ],
    groups: [{ name: 'Cycling Amsterdam', members: 24, sport: 'Fietsen' }, { name: 'Utrecht Yoga Club', members: 18, sport: 'Yoga' }],
    achievements: [{ label: '500km gefietst', icon: '🚴' }, { label: 'Top bijdrager', icon: '🔥' }],
  },
  '3': {
    age: 32,
    stats: { volgers: 98, volgend: 71, posts: 22, groepen: 2 },
    recentPosts: [
      { id: 'r1', content: 'PR vandaag op deadlift: 160kg. Hard werk loont!', sport: 'Gym', time: '3 uur geleden', likes: 67, comments: 12 },
    ],
    groups: [{ name: 'Rotterdam Gym Crew', members: 15, sport: 'Gym' }],
    achievements: [{ label: 'Deadlift PR 160kg', icon: '💪' }, { label: '3 maanden streak', icon: '🔥' }],
  },
  '4': {
    age: 30,
    stats: { volgers: 412, volgend: 98, posts: 89, groepen: 4 },
    recentPosts: [
      { id: 'r1', content: 'Zondagochtend yoga in het park. Wie wil volgende week ook komen?', sport: 'Yoga', time: 'Gisteren', likes: 89, comments: 21, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80' },
    ],
    groups: [{ name: 'Amsterdam Yoga', members: 76, sport: 'Yoga' }, { name: 'Park Sports AMS', members: 134, sport: 'Hardlopen' }],
    achievements: [{ label: '100 posts', icon: '📸' }, { label: 'Community builder', icon: '❤️' }],
  },
}

function getLevelStyleCard(level: string) {
  if (level === 'Gevorderd') return 'bg-black text-white'
  if (level === 'Gemiddeld') return 'bg-[#E87722] text-white'
  return 'bg-gray-100 text-gray-500'
}

function LockedSection({ firstName, onUnlock }: { firstName: string; onUnlock: () => void }) {
  return (
    <div className="relative rounded-xl overflow-hidden min-h-[80px]">
      <div className="blur-sm select-none pointer-events-none space-y-2.5 p-1">
        <div className="h-6 bg-gray-200 rounded-full w-3/4" />
        <div className="h-6 bg-gray-200 rounded-full w-1/2" />
        <div className="h-6 bg-gray-200 rounded-full w-2/3" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-[2px]">
        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 font-semibold text-center leading-tight">
          Volg {firstName} om dit te zien
        </p>
        <button onClick={onUnlock} className="text-[10px] font-bold text-[#E87722] hover:underline">
          Stuur verzoek
        </button>
      </div>
    </div>
  )
}

function LockedFeed({ firstName, onUnlock }: { firstName: string; onUnlock: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100 min-h-[220px] bg-white">
      <div className="blur-md select-none pointer-events-none p-5">
        <div className="h-32 bg-gray-100 rounded-xl mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[2px]">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-bold text-black text-sm">Activiteit vergrendeld</p>
          <p className="text-xs text-gray-400 mt-1">Volg {firstName} om posts en trainingen te zien</p>
        </div>
        <button
          onClick={onUnlock}
          className="px-4 py-2 bg-[#111111] text-white text-xs font-bold rounded-xl hover:bg-[#333] transition-colors"
        >
          Stuur volgverzoek
        </button>
      </div>
    </div>
  )
}

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#8B5CF6', default: '#6B7280',
}

function PublicMeetupsCard({ profileId }: { profileId: string }) {
  const [meetups, setMeetups] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const supabase = createClient()

  useState(() => {
    supabase
      .from('meetups')
      .select('id, sport, title, date, time, is_spontaneous, status, city, expires_at')
      .eq('creator_id', profileId)
      .eq('visibility', 'publiek')
      .in('status', ['open', 'vol'])
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { setMeetups(data ?? []); setLoaded(true) })
  })

  if (!loaded || meetups.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-black text-black mb-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#E87722]" /> Meetups
      </h3>
      <div className="space-y-2">
        {meetups.map(m => {
          const color = SPORT_COLORS[m.sport] ?? SPORT_COLORS.default
          return (
            <Link key={m.id} href={`/dashboard/meetup/${m.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-black truncate">{m.title}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {m.is_spontaneous
                    ? <><Zap className="w-3 h-3 text-red-400" /> Spontaan</>
                    : m.date ? <><Calendar className="w-3 h-3" /> {new Date(`${m.date}T${m.time ?? '00:00'}`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</> : m.city}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${m.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{m.status}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function RequestModal({
  name,
  toUserId,
  currentUserId,
  sport,
  onClose,
  onSent,
}: {
  name: string
  toUserId: string
  currentUserId: string
  sport: string | null
  onClose: () => void
  onSent: () => void
}) {
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const MAX = 300

  function handleSend() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('follow_requests').upsert({
        from_user_id: currentUserId,
        to_user_id: toUserId,
        message: message.trim() || null,
        status: 'pending',
        sport: sport,
      }, { onConflict: 'from_user_id,to_user_id' })

      await supabase.from('activity_log').insert({
        user_id: currentUserId,
        event_type: 'match_requested',
        metadata: { to_user_id: toUserId, sport },
      })

      onSent()
    })
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <p className="font-black text-black">Stuur een volgverzoek</p>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 mb-4">{name} krijgt jouw verzoek en kan het accepteren of weigeren. Voeg optioneel een berichtje toe.</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX))}
            placeholder={`Hoi ${name.split(' ')[0]}, ik zou graag met jou willen sporten...`}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
          />
          <div className="flex justify-end mt-1"><span className="text-xs text-gray-300">{message.length}/{MAX}</span></div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Annuleren</button>
          <button
            onClick={handleSend}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-[#111111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />{isPending ? 'Verzenden...' : 'Verstuur'}
          </button>
        </div>
      </div>
    </div>
  )
}

export type FollowStatus = 'none' | 'pending' | 'pending_received' | 'accepted'

const BESCHIKBAARHEID_META: Record<string, { emoji: string; label: string; sub: string }> = {
  ochtend: { emoji: '☀️', label: 'Ochtend', sub: '06–12' },
  middag:  { emoji: '🌤', label: 'Middag',  sub: '12–17' },
  avond:   { emoji: '🌙', label: 'Avond',   sub: '17–22' },
  weekend: { emoji: '📅', label: 'Weekend', sub: 'Za & Zo' },
}

export type ProfileData = {
  id: string
  name: string
  region: string
  bio: string
  sports: { label: string; level: string }[]
  avatarUrl?: string
  bannerUrl?: string
  openFollow?: boolean
  beschikbaarheid?: string[]
  stats?: { volgers: number; volgend: number; posts: number; groepen: number }
}

type Props = {
  profile: ProfileData
  followStatus: FollowStatus
  currentUserId: string
}

export default function ProfileContent({ profile, followStatus: initialStatus, currentUserId }: Props) {
  const [followStatus, setFollowStatus] = useState<FollowStatus>(initialStatus)
  const [showRequest, setShowRequest] = useState(false)

  const demo = DEMO_ENRICHMENT[profile.id]
  const age = demo?.age
  const stats = profile.stats ?? demo?.stats ?? { volgers: 0, volgend: 0, posts: 0, groepen: 0 }
  const recentPosts = demo?.recentPosts ?? []
  const groups = demo?.groups ?? []
  const achievements = demo?.achievements ?? []
  const sport = profile.sports?.[0]?.label ?? null

  const isAccepted = followStatus === 'accepted'
  const isLocked = !isAccepted && !profile.openFollow
  const firstName = profile.name.split(' ')[0]

  function handleFollowClick() {
    if (followStatus === 'accepted' || followStatus === 'pending') return
    if (profile.openFollow) {
      setFollowStatus('accepted')
    } else {
      setShowRequest(true)
    }
  }

  function handleRequestSent() {
    setFollowStatus('pending')
    setShowRequest(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <Link href="/dashboard/find" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug naar zoeken
      </Link>

      {/* Profiel header */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-[#111111]">
          <ProfileHeader
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            bannerUrl={profile.bannerUrl}
            editable={false}
            size="md"
          />
        </div>
        <div className="bg-[#111111] px-6 pb-6 -mt-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                {profile.openFollow && (
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">Open profiel</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70 mt-1">
                {profile.region && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.region}</span>}
                {age && <span>{age} jaar</span>}
              </div>
              <p className="text-sm text-white/80 mt-3 leading-relaxed max-w-lg">{profile.bio}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 mt-1">
              {isAccepted && (
                <Link href="/dashboard/messages" className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors" title="Bericht sturen">
                  <MessageCircle className="w-4 h-4 text-white" />
                </Link>
              )}
              <button
                onClick={handleFollowClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                  isAccepted
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : followStatus === 'pending'
                    ? 'bg-white/10 text-white/50 cursor-default'
                    : followStatus === 'pending_received'
                    ? 'bg-[#E87722] text-white hover:bg-[#d06a1a]'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {isAccepted
                  ? <><Check className="w-4 h-4" /> Buddies</>
                  : followStatus === 'pending'
                  ? 'Verzoek verzonden'
                  : followStatus === 'pending_received'
                  ? <><Check className="w-4 h-4" /> Accepteer verzoek</>
                  : <><UserPlus className="w-4 h-4" />{profile.openFollow ? 'Volgen' : 'Stuur verzoek'}</>
                }
              </button>
            </div>
          </div>

          {/* Stats balk */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-white/20">
            {[
              { label: 'Volgers', value: isAccepted ? stats.volgers + 1 : stats.volgers },
              { label: 'Volgend', value: stats.volgend },
              { label: 'Posts', value: stats.posts },
              { label: 'Groepen', value: stats.groepen },
            ].map(s => (
              <div key={s.label} className="text-center">
                {isLocked ? (
                  <Lock className="w-4 h-4 text-white/40 mx-auto mb-0.5" />
                ) : (
                  <p className="text-xl font-black text-white">{s.value}</p>
                )}
                <p className="text-xs text-white/60 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status banner */}
      {isLocked && followStatus === 'none' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-black">Profiel vergrendeld</p>
            <p className="text-xs text-gray-500 mt-0.5">Stuur {firstName} een volgverzoek om sporten, groepen, prestaties en activiteiten te zien.</p>
          </div>
        </div>
      )}
      {isLocked && followStatus === 'pending' && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-black">Verzoek verzonden</p>
            <p className="text-xs text-gray-500 mt-0.5">Wacht tot {firstName} jouw verzoek accepteert om het volledige profiel te zien.</p>
          </div>
        </div>
      )}
      {isLocked && followStatus === 'pending_received' && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <UserPlus className="w-4 h-4 text-[#E87722] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-black">{firstName} wil jouw buddy zijn!</p>
            <p className="text-xs text-gray-500 mt-0.5">Accepteer het verzoek om het volledige profiel te bekijken en berichten te sturen.</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-5">

          {/* Sporten */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-black mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#E87722]" /> Sporten
            </h3>
            {isLocked ? (
              <LockedSection firstName={firstName} onUnlock={handleFollowClick} />
            ) : (
              <div className="space-y-2.5">
                {profile.sports.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLevelStyleCard(s.level)}`}>{s.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Beschikbaarheid */}
          {profile.beschikbaarheid && profile.beschikbaarheid.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-black text-black mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E87722]" /> Beschikbaarheid
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.beschikbaarheid.map(slot => {
                  const meta = BESCHIKBAARHEID_META[slot]
                  if (!meta) return null
                  return (
                    <div key={slot} className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#FFF5EE', border: '1.5px solid #FDDCBD' }}>
                      <span style={{ fontSize: 16 }}>{meta.emoji}</span>
                      <div>
                        <p className="text-xs font-bold text-[#E87722]">{meta.label}</p>
                        <p style={{ fontSize: 10, color: '#FDBA74' }}>{meta.sub}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Groepen */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-black mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E87722]" /> Groepen
            </h3>
            {isLocked ? (
              <LockedSection firstName={firstName} onUnlock={handleFollowClick} />
            ) : groups.length > 0 ? (
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#E87722]/10 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-[#E87722]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-black truncate">{group.name}</p>
                      <p className="text-xs text-gray-400">{group.members} leden · {group.sport}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Nog geen groepen.</p>
            )}
          </div>

          {/* Prestaties */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-black mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#E87722]" /> Prestaties
            </h3>
            {isLocked ? (
              <LockedSection firstName={firstName} onUnlock={handleFollowClick} />
            ) : achievements.length > 0 ? (
              <div className="space-y-2.5">
                {achievements.map(a => (
                  <div key={a.label} className="flex items-center gap-3">
                    <span className="text-lg">{a.icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{a.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Nog geen prestaties.</p>
            )}
          </div>

          {/* Publieke meetups */}
          <PublicMeetupsCard profileId={profile.id} />

          {followStatus === 'none' && (
            <button
              onClick={handleFollowClick}
              className="w-full flex items-center justify-between bg-[#111111] text-white rounded-2xl p-5 hover:bg-[#333] transition-colors group"
            >
              <div>
                <p className="font-black">Word buddy</p>
                <p className="text-sm text-white/70 mt-0.5">Stuur {firstName} een verzoek</p>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* Tijdlijn */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-black text-black flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#E87722]" /> Recente activiteit
          </h2>

          {isLocked ? (
            <LockedFeed firstName={firstName} onUnlock={handleFollowClick} />
          ) : recentPosts.length > 0 ? (
            recentPosts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {post.image && (
                  <img src={post.image} alt={post.sport} className="w-full h-44 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold bg-[#E87722]/10 text-[#E87722] px-2.5 py-1 rounded-full">{post.sport}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{post.time}</span>
                  </div>
                  {(post.distance || post.duration) && (
                    <div className="flex gap-4 mb-3">
                      {post.distance && (
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-black text-black">{post.distance} km</span>
                        </div>
                      )}
                      {post.duration && (
                        <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-black text-black">{post.duration} min</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-pink-500 transition-colors">
                      <Heart className="w-4 h-4" /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4" /> {post.comments}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400">Nog geen activiteit gedeeld.</p>
            </div>
          )}
        </div>
      </div>

      {showRequest && (
        <RequestModal
          name={profile.name}
          toUserId={profile.id}
          currentUserId={currentUserId}
          sport={sport}
          onClose={() => setShowRequest(false)}
          onSent={handleRequestSent}
        />
      )}
    </div>
  )
}
