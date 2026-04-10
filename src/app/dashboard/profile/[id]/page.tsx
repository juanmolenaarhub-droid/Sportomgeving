'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  MapPin, Award, MessageCircle, UserPlus, Check, ArrowLeft,
  Users, Heart, Flame, Trophy, Calendar, Clock, ChevronRight,
  Send, X, Lock,
} from 'lucide-react'
import { ProfileHeader } from '@/components/ProfileHeader'

// ── Demo data ─────────────────────────────────────────────────────────────────
const PROFILES: Record<string, {
  id: string; name: string; region: string; age: number; bio: string
  sports: { label: string; level: string }[]
  following: boolean; requested: boolean; openFollow?: boolean
  bannerUrl?: string; avatarUrl?: string
  stats: { volgers: number; volgend: number; posts: number; groepen: number }
  recentPosts: { id: string; content: string; sport: string; time: string; likes: number; comments: number; image?: string; distance?: number; duration?: number }[]
  groups: { name: string; members: number; sport: string }[]
  achievements: { label: string; icon: string }[]
}> = {
  '1': {
    id: '1', name: 'Tim van Berg', region: 'Amsterdam', age: 28,
    bio: 'Hardloper en fietser. Op zoek naar iemand voor ochtendrondes in het Vondelpark. Ik train 4x per week en doe mee aan lokale races.',
    sports: [{ label: 'Hardlopen', level: 'Gevorderd' }, { label: 'Fietsen', level: 'Gemiddeld' }],
    following: false, requested: false,
    stats: { volgers: 142, volgend: 89, posts: 34, groepen: 3 },
    recentPosts: [
      { id: 'r1', content: 'Geweldige ochtendrun door het Vondelpark. 10km in 52 minuten — persoonlijk record!', sport: 'Hardlopen', time: '2 uur geleden', likes: 24, comments: 5, image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', distance: 10.4, duration: 52 },
      { id: 'r2', content: 'Halve marathon dit weekend. Wie loopt er ook mee in Amsterdam?', sport: 'Hardlopen', time: '3 dagen geleden', likes: 38, comments: 12 },
      { id: 'r3', content: '80km fietstocht langs de kust. Uitgeput maar tevreden!', sport: 'Fietsen', time: '1 week geleden', likes: 19, comments: 3, image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', distance: 80, duration: 195 },
    ],
    groups: [{ name: 'Vondelpark Runners', members: 41, sport: 'Hardlopen' }, { name: 'Cycling Amsterdam', members: 24, sport: 'Fietsen' }],
    achievements: [{ label: '10 runs gedeeld', icon: '🏃' }, { label: 'Eerste halve marathon', icon: '🏅' }, { label: '100km gefietst', icon: '🚴' }],
  },
  '2': {
    id: '2', name: 'Sarah Jansen', region: 'Utrecht', age: 25,
    bio: 'Wielrenster op zoek naar trainingsmaatje voor lange tochten in het weekend. Lid van meerdere fietsclubs en altijd in voor avontuur op de fiets.',
    sports: [{ label: 'Fietsen', level: 'Gevorderd' }, { label: 'Yoga', level: 'Beginner' }],
    following: true, requested: false, openFollow: true,
    stats: { volgers: 287, volgend: 134, posts: 67, groepen: 5 },
    recentPosts: [
      { id: 'r1', content: '45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht.', sport: 'Fietsen', time: '1 uur geleden', likes: 41, comments: 8, image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', distance: 45, duration: 105 },
      { id: 'r2', content: 'Eerste yogales ooit — ik ben compleet gebroken maar in de beste zin.', sport: 'Yoga', time: '5 dagen geleden', likes: 55, comments: 14 },
    ],
    groups: [{ name: 'Cycling Amsterdam', members: 24, sport: 'Fietsen' }, { name: 'Utrecht Yoga Club', members: 18, sport: 'Yoga' }, { name: 'Fietstouren NL', members: 203, sport: 'Fietsen' }],
    achievements: [{ label: '500km gefietst', icon: '🚴' }, { label: 'Open profiel', icon: '⭐' }, { label: 'Top bijdrager', icon: '🔥' }],
  },
  '3': {
    id: '3', name: 'Marco de Wit', region: 'Rotterdam', age: 32,
    bio: 'Powerlifter, 3x per week in de gym. Op zoek naar een spotterbuddy voor zware sessies. Competitief ingesteld maar gezellig van aard.',
    sports: [{ label: 'Gym', level: 'Gevorderd' }, { label: 'Voetbal', level: 'Gemiddeld' }],
    following: false, requested: true,
    stats: { volgers: 98, volgend: 71, posts: 22, groepen: 2 },
    recentPosts: [
      { id: 'r1', content: 'PR vandaag op deadlift: 160kg. Hard werk loont!', sport: 'Gym', time: '3 uur geleden', likes: 67, comments: 12 },
    ],
    groups: [{ name: 'Rotterdam Gym Crew', members: 15, sport: 'Gym' }],
    achievements: [{ label: 'Deadlift PR 160kg', icon: '💪' }, { label: '3 maanden streak', icon: '🔥' }],
  },
  '4': {
    id: '4', name: 'Lisa Hoek', region: 'Amsterdam', age: 30,
    bio: 'Yoga en meditatie. Elke zondagochtend park yoga, iedereen welkom. Ik geloof in sport als verbinding tussen mensen.',
    sports: [{ label: 'Yoga', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Beginner' }],
    following: false, requested: false,
    stats: { volgers: 412, volgend: 98, posts: 89, groepen: 4 },
    recentPosts: [
      { id: 'r1', content: 'Zondagochtend yoga in het park. Wie wil volgende week ook komen?', sport: 'Yoga', time: 'Gisteren', likes: 89, comments: 21, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80' },
    ],
    groups: [{ name: 'Amsterdam Yoga', members: 76, sport: 'Yoga' }, { name: 'Park Sports AMS', members: 134, sport: 'Hardlopen' }],
    achievements: [{ label: '100 posts', icon: '📸' }, { label: 'Yoga instructeur', icon: '🧘' }, { label: 'Community builder', icon: '❤️' }],
  },
  '5': {
    id: '5', name: 'Kevin Smit', region: 'Den Haag', age: 22,
    bio: 'Voetballer en recreatief tennisspeler. Op zoek naar iemand voor weekendmatches.',
    sports: [{ label: 'Voetbal', level: 'Gemiddeld' }, { label: 'Tennis', level: 'Beginner' }],
    following: false, requested: false,
    stats: { volgers: 54, volgend: 40, posts: 8, groepen: 1 },
    recentPosts: [{ id: 'r1', content: 'Wie wil er zondag mee voetballen in Den Haag? We hebben nog 2 man nodig!', sport: 'Voetbal', time: 'Gisteren', likes: 11, comments: 7 }],
    groups: [{ name: 'Den Haag FC Casual', members: 22, sport: 'Voetbal' }],
    achievements: [{ label: 'Eerste match gedeeld', icon: '⚽' }],
  },
  '6': {
    id: '6', name: 'Anna de Boer', region: 'Amsterdam', age: 27,
    bio: 'Triatleet in opleiding. Zwem, fiets en ren. Op zoek naar trainingspartner voor alle drie.',
    sports: [{ label: 'Zwemmen', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Gemiddeld' }, { label: 'Fietsen', level: 'Gemiddeld' }],
    following: false, requested: false,
    stats: { volgers: 203, volgend: 115, posts: 45, groepen: 3 },
    recentPosts: [{ id: 'r1', content: '2km gezwommen in het openwater. Klaar voor de triathlon!', sport: 'Zwemmen', time: '2 dagen geleden', likes: 33, comments: 9 }],
    groups: [{ name: 'Amsterdam Triathlon', members: 88, sport: 'Zwemmen' }],
    achievements: [{ label: 'Triathlon deelnemer', icon: '🏊' }, { label: '200km gefietst', icon: '🚴' }],
  },
}

function getLevelStyleCard(level: string) {
  if (level === 'Gevorderd') return 'bg-black text-white'
  if (level === 'Gemiddeld') return 'bg-[#E87722] text-white'
  return 'bg-gray-100 text-gray-500'
}

// ── Locked sectie placeholder ─────────────────────────────────────────────────
function LockedSection({ firstName, onUnlock }: { firstName: string; onUnlock: () => void }) {
  return (
    <div className="relative rounded-xl overflow-hidden min-h-[80px]">
      {/* Vage nep-content */}
      <div className="blur-sm select-none pointer-events-none space-y-2.5 p-1">
        <div className="h-6 bg-gray-200 rounded-full w-3/4" />
        <div className="h-6 bg-gray-200 rounded-full w-1/2" />
        <div className="h-6 bg-gray-200 rounded-full w-2/3" />
      </div>
      {/* Slot overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-[2px]">
        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 font-semibold text-center leading-tight">
          Volg {firstName} om dit te zien
        </p>
        <button
          onClick={onUnlock}
          className="text-[10px] font-bold text-[#E87722] hover:underline"
        >
          Stuur verzoek
        </button>
      </div>
    </div>
  )
}

// ── Locked tijdlijn ───────────────────────────────────────────────────────────
function LockedFeed({ firstName, onUnlock }: { firstName: string; onUnlock: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-100 min-h-[220px] bg-white">
      {/* Vage nep-post */}
      <div className="blur-md select-none pointer-events-none p-5">
        <div className="h-32 bg-gray-100 rounded-xl mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
      {/* Slot overlay */}
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

// ── Verzoek modal ─────────────────────────────────────────────────────────────
function RequestModal({ name, onClose, onSend }: { name: string; onClose: () => void; onSend: () => void }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const MAX = 300

  function handleSend() {
    setSending(true)
    setTimeout(() => { onSend(); setSending(false) }, 600)
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
          <button onClick={handleSend} disabled={sending} className="flex-1 py-3 rounded-xl bg-[#111111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] disabled:opacity-50">
            <Send className="w-4 h-4" />{sending ? 'Verzenden...' : 'Verstuur'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const profile = PROFILES[id] ?? null

  const [following, setFollowing] = useState(profile?.following ?? false)
  const [requested, setRequested] = useState(profile?.requested ?? false)
  const [showRequest, setShowRequest] = useState(false)

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-gray-400 font-semibold">Profiel niet gevonden.</p>
        <Link href="/dashboard/find" className="mt-4 inline-block text-[#E87722] font-bold hover:underline">Terug naar zoeken</Link>
      </div>
    )
  }

  // Inhoud is vergrendeld totdat je wordt gevolgd/geaccepteerd (tenzij open profiel)
  const isLocked = !following

  const firstName = profile.name.split(' ')[0]

  function handleFollowClick() {
    if (following || requested) return
    if (profile!.openFollow) {
      setFollowing(true)
    } else {
      setShowRequest(true)
    }
  }

  function handleRequestSent() {
    setRequested(true)
    setShowRequest(false)
  }

  const stats = profile.stats

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Terug knop */}
      <Link href="/dashboard/find" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug naar zoeken
      </Link>

      {/* Profiel header — oranje */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        {/* Banner + avatar via ProfileHeader (avatar heeft witte rand) */}
        <div className="bg-[#111111]">
          <ProfileHeader
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            bannerUrl={profile.bannerUrl}
            editable={false}
            size="md"
          />
        </div>

        {/* Info sectie */}
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
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.region}</span>
                <span>{profile.age} jaar</span>
              </div>
              <p className="text-sm text-white/80 mt-3 leading-relaxed max-w-lg">{profile.bio}</p>
            </div>

            {/* Actieknopen */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {following && (
                <button className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors" title="Bericht sturen">
                  <MessageCircle className="w-4 h-4 text-white" />
                </button>
              )}
              <button
                onClick={handleFollowClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                  following
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : requested
                    ? 'bg-white/10 text-white/50 cursor-default'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {following
                  ? <><Check className="w-4 h-4" /> Volgend</>
                  : requested
                  ? 'Verzonden'
                  : <><UserPlus className="w-4 h-4" />{profile.openFollow ? 'Volgen' : 'Stuur verzoek'}</>
                }
              </button>
            </div>
          </div>

          {/* Stats balk */}
          <div className="flex gap-6 mt-5 pt-5 border-t border-white/20">
            {[
              { label: 'Volgers', value: following ? stats.volgers + 1 : stats.volgers },
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

      {/* Sporten badge als locked hint */}
      {isLocked && !requested && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-black">Profiel vergrendeld</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Stuur {firstName} een volgverzoek om sporten, groepen, prestaties en activiteiten te zien.
            </p>
          </div>
        </div>
      )}
      {isLocked && requested && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-black">Verzoek verzonden</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Wacht tot {firstName} jouw verzoek accepteert om het volledige profiel te zien.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">

        {/* Linker kolom */}
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
                {profile.sports.map(sport => (
                  <div key={sport.label} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{sport.label}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLevelStyleCard(sport.level)}`}>{sport.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Groepen */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-black mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E87722]" /> Groepen
            </h3>
            {isLocked ? (
              <LockedSection firstName={firstName} onUnlock={handleFollowClick} />
            ) : (
              <div className="space-y-3">
                {profile.groups.map(group => (
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
            )}
          </div>

          {/* Prestaties */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-black mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#E87722]" /> Prestaties
            </h3>
            {isLocked ? (
              <LockedSection firstName={firstName} onUnlock={handleFollowClick} />
            ) : (
              <div className="space-y-2.5">
                {profile.achievements.map(a => (
                  <div key={a.label} className="flex items-center gap-3">
                    <span className="text-lg">{a.icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{a.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Word buddy CTA */}
          {!following && !requested && (
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

        {/* Rechter kolom: tijdlijn */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-black text-black flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#E87722]" /> Recente activiteit
          </h2>

          {isLocked ? (
            <LockedFeed firstName={firstName} onUnlock={handleFollowClick} />
          ) : (
            profile.recentPosts.map(post => (
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
          )}
        </div>
      </div>

      {/* Verzoek modal */}
      {showRequest && (
        <RequestModal
          name={profile.name}
          onClose={() => setShowRequest(false)}
          onSend={handleRequestSent}
        />
      )}
    </div>
  )
}
