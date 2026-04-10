'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Clock,
  Flame, X, Send, Bookmark, Play, Camera, Video, Image as ImageIcon,
  Smile, Trophy, UserPlus, Filter, ChevronRight, Zap,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'

// ─── Types ────────────────────────────────────────────────────────────────────

type Story = {
  id: string
  user: { name: string }
  media_url?: string
  created_at: string
}

type Post = {
  id: string
  userId: string
  user: { name: string; region: string }
  content: string
  activity_type: string
  distance_km?: number
  duration_minutes?: number
  image_url?: string
  likes_count: number
  comments_count: number
  liked: boolean
  saved: boolean
  created_at: string
  comments: { user: string; text: string }[]
  showComments: boolean
}

type SuggestedBuddy = {
  id: string
  name: string
  region: string
  sport: string
  mutuals: number
}

// ─── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_STORIES: Story[] = [
  { id: 's1', user: { name: 'Tim van Berg' }, media_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80', created_at: '12 min geleden' },
  { id: 's2', user: { name: 'Sarah Jansen' }, media_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&q=80', created_at: '1 uur geleden' },
  { id: 's3', user: { name: 'Marco de Wit' }, media_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', created_at: '2 uur geleden' },
  { id: 's4', user: { name: 'Lisa Hoek' }, media_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80', created_at: '3 uur geleden' },
  { id: 's5', user: { name: 'Kevin Storm' }, media_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', created_at: '4 uur geleden' },
  { id: 's6', user: { name: 'Emma Kool' }, media_url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&q=80', created_at: '5 uur geleden' },
]

const DEMO_POSTS: Post[] = [
  {
    id: '1', userId: '1', user: { name: 'Tim van Berg', region: 'Amsterdam' },
    content: 'Geweldige ochtendrun door het Vondelpark. De lucht was perfect en ik voelde me sterk vandaag. Wie wil er volgende week mee?',
    activity_type: 'run', distance_km: 10.4, duration_minutes: 52,
    image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    likes_count: 24, comments_count: 5, liked: false, saved: false, created_at: '2 min geleden',
    comments: [{ user: 'Sarah J.', text: 'Goed gedaan! Ik doe mee volgende week.' }, { user: 'Marco W.', text: 'Mooi tempo.' }],
    showComments: false,
  },
  {
    id: '2', userId: '2', user: { name: 'Sarah Jansen', region: 'Utrecht' },
    content: 'Vandaag 45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht. De route is een aanrader!',
    activity_type: 'cycle', distance_km: 45, duration_minutes: 105,
    image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
    likes_count: 41, comments_count: 8, liked: true, saved: false, created_at: '1 uur geleden',
    comments: [{ user: 'Kevin S.', text: 'Die route ken ik! Prachtig inderdaad.' }],
    showComments: false,
  },
  {
    id: '3', userId: '3', user: { name: 'Marco de Wit', region: 'Rotterdam' },
    content: 'PR vandaag op deadlift: 160kg. Zes maanden hard werken heeft zijn vruchten afgeworpen. Op zoek naar een trainingsbuddy!',
    activity_type: 'gym',
    likes_count: 67, comments_count: 12, liked: false, saved: true, created_at: '3 uur geleden',
    comments: [{ user: 'Anna B.', text: 'Indrukwekkend!' }, { user: 'Tim vB.', text: 'Goed werk, stuur me een bericht.' }],
    showComments: false,
  },
  {
    id: '4', userId: '4', user: { name: 'Lisa Hoek', region: 'Amsterdam' },
    content: 'Zondagochtend yoga in het park. Er is niets beter dan buiten bewegen terwijl de stad nog slaapt. Wie wil volgende week ook komen? Start 08:00 bij het Amstelpark.',
    activity_type: 'yoga',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    likes_count: 89, comments_count: 21, liked: false, saved: false, created_at: 'Gisteren',
    comments: [{ user: 'Emma K.', text: 'Ik kom! Moet ik een matje meenemen?' }, { user: 'Lisa H.', text: 'Nee, ik heb extra matten.' }],
    showComments: false,
  },
  {
    id: '5', userId: '5', user: { name: 'Kevin Storm', region: 'Den Haag' },
    content: 'Open water zwemmen bij Scheveningen. 2,5km in 38 minuten — nieuw persoonlijk record! De zee was rustig en het water lekker fris.',
    activity_type: 'swim', distance_km: 2.5, duration_minutes: 38,
    image_url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
    likes_count: 55, comments_count: 9, liked: false, saved: false, created_at: 'Gisteren',
    comments: [{ user: 'Marco dW.', text: 'Respect! Koud water, goed gedaan.' }],
    showComments: false,
  },
  {
    id: '6', userId: '6', user: { name: 'Emma Kool', region: 'Eindhoven' },
    content: 'Na 3 maanden blessure eindelijk weer volledig terug op het veld. Voelt zo goed. Dankbaar voor iedereen die me heeft ondersteund!',
    activity_type: 'football',
    likes_count: 134, comments_count: 28, liked: true, saved: false, created_at: '2 dagen geleden',
    comments: [{ user: 'Tim vB.', text: 'Welkom terug!' }, { user: 'Sarah J.', text: 'Super blij voor je!' }],
    showComments: false,
  },
]

const SUGGESTED_BUDDIES: SuggestedBuddy[] = [
  { id: '7', name: 'Daan Bakker', region: 'Haarlem', sport: 'Tennis', mutuals: 3 },
  { id: '8', name: 'Anna de Boer', region: 'Amsterdam', sport: 'Zwemmen', mutuals: 5 },
  { id: '9', name: 'Jelle Peters', region: 'Utrecht', sport: 'Basketbal', mutuals: 2 },
]

const LEADERBOARD = [
  { rank: 1, name: 'Tim van Berg', userId: '1', value: '87 km', sport: 'Hardlopen', delta: '+12' },
  { rank: 2, name: 'Sarah Jansen', userId: '2', value: '210 km', sport: 'Fietsen', delta: '+45' },
  { rank: 3, name: 'Kevin Storm', userId: '5', value: '14 km', sport: 'Zwemmen', delta: '+2' },
  { rank: 4, name: 'Marco de Wit', userId: '3', value: '9 sessies', sport: 'Gym', delta: '+1' },
  { rank: 5, name: 'Jij', userId: 'me', value: '32 km', sport: 'Hardlopen', delta: '+8' },
]

const SPORT_FILTERS = [
  { value: 'all', label: 'Alles' },
  { value: 'run', label: '🏃 Hardlopen' },
  { value: 'cycle', label: '🚴 Fietsen' },
  { value: 'swim', label: '🏊 Zwemmen' },
  { value: 'gym', label: '💪 Gym' },
  { value: 'yoga', label: '🧘 Yoga' },
  { value: 'football', label: '⚽ Voetbal' },
]

const ACTIVITY_TYPES = [
  { value: 'run', label: 'Hardlopen' }, { value: 'cycle', label: 'Fietsen' },
  { value: 'swim', label: 'Zwemmen' }, { value: 'gym', label: 'Gym' },
  { value: 'tennis', label: 'Tennis' }, { value: 'football', label: 'Voetbal' },
  { value: 'yoga', label: 'Yoga' }, { value: 'hiking', label: 'Wandelen' },
  { value: 'other', label: 'Anders' },
]

function getActivityLabel(type: string) {
  return ACTIVITY_TYPES.find(a => a.value === type)?.label ?? 'Sport'
}

function truncateName(name: string, max = 10) {
  const first = name.split(' ')[0]
  return first.length > max ? first.slice(0, max) + '…' : first
}

// ─── Story Viewer ──────────────────────────────────────────────────────────────

function StoryViewer({ stories, startIndex, onClose }: { stories: Story[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const story = stories[current]
  const DURATION = 5000

  useEffect(() => {
    const t = setTimeout(() => {
      if (current < stories.length - 1) setCurrent(c => c + 1)
      else onClose()
    }, DURATION)
    return () => clearTimeout(t)
  }, [current, stories.length, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <style>{`
        @keyframes story-fill { from { width: 0% } to { width: 100% } }
        .story-progress-active { animation: story-fill ${DURATION}ms linear forwards; }
      `}</style>
      <div className="relative w-full max-w-[400px] h-[100dvh] sm:h-[88vh] flex flex-col overflow-hidden sm:rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              {i < current && <div className="h-full w-full bg-white rounded-full" />}
              {i === current && <div key={current} className="story-progress-active h-full bg-white rounded-full" />}
            </div>
          ))}
        </div>
        {story.media_url
          ? <img src={story.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#E87722] to-orange-900" />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
        <div className="relative z-10 flex items-center justify-between px-4 pt-10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full ring-2 ring-[#E87722] ring-offset-1 overflow-hidden">
              <Avatar name={story.user.name} size="sm" className="w-full h-full" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{story.user.name}</p>
              <p className="text-white/55 text-xs">{story.created_at}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <button className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={e => { e.stopPropagation(); if (current > 0) setCurrent(c => c - 1) }} />
        <button className="absolute right-0 top-0 bottom-0 w-1/3 z-10" onClick={e => { e.stopPropagation(); if (current < stories.length - 1) setCurrent(c => c + 1); else onClose() }} />
      </div>
    </div>
  )
}

// ─── Suggested Buddies card (tussendoor in feed) ───────────────────────────────

function SuggestedBuddiesCard({ buddies }: { buddies: SuggestedBuddy[] }) {
  const [dismissed, setDismissed] = useState<string[]>([])
  const visible = buddies.filter(b => !dismissed.includes(b.id))
  if (visible.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-black text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#E87722]" /> Misschien ken je deze sporters
        </h3>
        <Link href="/dashboard/find" className="text-xs text-[#E87722] font-semibold hover:underline flex items-center gap-0.5">
          Meer <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {visible.map(buddy => (
          <div key={buddy.id} className="shrink-0 w-36 bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 relative">
            <button
              onClick={() => setDismissed(p => [...p, buddy.id])}
              className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
            <Avatar name={buddy.name} size="md" className="w-12 h-12 rounded-full" />
            <div className="text-center">
              <p className="text-xs font-black text-black leading-tight">{buddy.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{buddy.region} · {buddy.sport}</p>
              <p className="text-[10px] text-gray-400">{buddy.mutuals} gemeenschappelijke buddies</p>
            </div>
            <Link
              href={`/dashboard/profile/${buddy.id}`}
              className="w-full py-1.5 bg-[#E87722] text-white text-[11px] font-bold rounded-lg text-center hover:bg-[#d06a1a] transition-colors"
            >
              Bekijk profiel
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Leaderboard sidebar ───────────────────────────────────────────────────────

function LeaderboardSidebar() {
  return (
    <div className="space-y-4 sticky top-24">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-black text-black mb-1 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#E87722]" /> Weeklijst
        </h3>
        <p className="text-xs text-gray-400 mb-4">Meeste km deze week</p>
        <div className="space-y-3">
          {LEADERBOARD.map((entry) => (
            <div key={entry.rank} className={`flex items-center gap-3 ${entry.name === 'Jij' ? 'bg-orange-50 -mx-2 px-2 py-1.5 rounded-xl' : ''}`}>
              <span className={`w-5 text-center text-xs font-black ${entry.rank === 1 ? 'text-yellow-500' : entry.rank === 2 ? 'text-gray-400' : entry.rank === 3 ? 'text-orange-600' : 'text-gray-300'}`}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
              </span>
              <Link href={entry.name === 'Jij' ? '/dashboard/profile/me' : `/dashboard/profile/${entry.userId}`} className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${entry.name === 'Jij' ? 'text-[#E87722]' : 'text-black hover:text-[#E87722]'} transition-colors`}>{entry.name}</p>
                <p className="text-[10px] text-gray-400">{entry.sport}</p>
              </Link>
              <div className="text-right">
                <p className="text-xs font-black text-black">{entry.value}</p>
                <p className="text-[10px] text-green-500 font-semibold">{entry.delta}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buddy zoeken CTA */}
      <Link href="/dashboard/find" className="flex items-center justify-between bg-[#E87722] text-white rounded-2xl p-4 hover:bg-[#d06a1a] transition-colors group block">
        <div>
          <p className="font-black text-sm">Zoek een buddy</p>
          <p className="text-xs text-white/70 mt-0.5">Vind sporters bij jou in de buurt</p>
        </div>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Actieve sporters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-black text-black mb-3 flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-[#E87722]" /> Nu actief
        </h3>
        <div className="space-y-2.5">
          {[
            { name: 'Tim van Berg', activity: 'Aan het hardlopen', userId: '1' },
            { name: 'Sarah Jansen', activity: 'Fietstocht bezig', userId: '2' },
            { name: 'Lisa Hoek', activity: 'Yoga sessie', userId: '4' },
          ].map(a => (
            <Link key={a.name} href={`/dashboard/profile/${a.userId}`} className="flex items-center gap-2.5 group">
              <div className="relative shrink-0">
                <Avatar name={a.name} size="sm" className="w-8 h-8 rounded-full" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-black truncate group-hover:text-[#E87722] transition-colors">{a.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{a.activity}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Post kaart ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onLike,
  onSave,
  onToggleComments,
  onSubmitComment,
  commentInput,
  onCommentChange,
  onOpenStory,
}: {
  post: Post
  onLike: () => void
  onSave: () => void
  onToggleComments: () => void
  onSubmitComment: () => void
  commentInput: string
  onCommentChange: (v: string) => void
  onOpenStory: () => void
}) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onOpenStory} className="relative w-10 h-10 rounded-full shrink-0">
            <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E87722] to-orange-300 p-[2px]">
              <span className="block w-full h-full rounded-full bg-white p-[2px]">
                <span className="block w-full h-full rounded-full overflow-hidden">
                  <Avatar name={post.user.name} size="md" className="w-full h-full" />
                </span>
              </span>
            </span>
          </button>
          <div>
            <Link href={`/dashboard/profile/${post.userId}`} className="font-black text-black text-sm hover:text-[#E87722] transition-colors">
              {post.user.name}
            </Link>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.user.region}</span>
              <span>·</span><span>{post.created_at}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-[#E87722]/10 text-[#E87722] px-2.5 py-1 rounded-full">
            {getActivityLabel(post.activity_type)}
          </span>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Foto met stats overlay (Strava-stijl) */}
      {post.image_url && (
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <img src={post.image_url} alt="post" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          {(post.distance_km || post.duration_minutes) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-4 py-3">
              <div className="flex gap-4">
                {post.distance_km && (
                  <div>
                    <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Afstand</p>
                    <p className="text-white font-black text-lg leading-tight">{post.distance_km} <span className="text-sm font-semibold">km</span></p>
                  </div>
                )}
                {post.duration_minutes && (
                  <div>
                    <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Duur</p>
                    <p className="text-white font-black text-lg leading-tight">{post.duration_minutes} <span className="text-sm font-semibold">min</span></p>
                  </div>
                )}
                {post.distance_km && post.duration_minutes && (
                  <div>
                    <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Tempo</p>
                    <p className="text-white font-black text-lg leading-tight">
                      {Math.floor(post.duration_minutes / post.distance_km)}:{String(Math.round((post.duration_minutes / post.distance_km % 1) * 60)).padStart(2, '0')} <span className="text-sm font-semibold">/km</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats zonder foto (compact blok) */}
      {!post.image_url && (post.distance_km || post.duration_minutes) && (
        <div className="mx-5 mb-2">
          <div className="bg-gradient-to-r from-[#E87722]/10 to-orange-50 rounded-xl p-3 flex gap-5">
            {post.distance_km && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#E87722] rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Afstand</p>
                  <p className="text-sm font-black text-black">{post.distance_km} km</p>
                </div>
              </div>
            )}
            {post.duration_minutes && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Duur</p>
                  <p className="text-sm font-black text-black">{post.duration_minutes} min</p>
                </div>
              </div>
            )}
            {post.distance_km && post.duration_minutes && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Tempo</p>
                  <p className="text-sm font-black text-black">{Math.floor(post.duration_minutes / post.distance_km)}:{String(Math.round((post.duration_minutes / post.distance_km % 1) * 60)).padStart(2, '0')} /km</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tekst */}
      <div className="px-5 py-3">
        <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
      </div>

      {/* Acties */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <button onClick={onLike}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-sm font-semibold ${post.liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-400 hover:bg-red-50'}`}>
            <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500' : ''}`} /> {post.likes_count}
          </button>
          <button onClick={onToggleComments}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-blue-400 hover:bg-blue-50 transition-colors">
            <MessageCircle className="w-4 h-4" /> {post.comments_count}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors">
            <Share2 className="w-4 h-4" /> Delen
          </button>
        </div>
        <button onClick={onSave}
          className={`p-2 rounded-xl transition-colors ${post.saved ? 'text-[#E87722]' : 'text-gray-300 hover:text-gray-500'}`}>
          <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-[#E87722]' : ''}`} />
        </button>
      </div>

      {/* Reacties */}
      {post.showComments && (
        <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {post.comments.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Avatar name={c.user} size="xs" />
              <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-bold text-black">{c.user}</p>
                <p className="text-xs text-gray-600 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <Avatar name="Jouw Naam" size="xs" />
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <input type="text" value={commentInput}
                onChange={e => onCommentChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSubmitComment()}
                placeholder="Schrijf een reactie..."
                className="flex-1 bg-transparent text-xs text-black focus:outline-none" />
              <button onClick={onSubmitComment} className="text-[#E87722] hover:text-[#d06a1a] transition-colors">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

// ─── Hoofdpagina ──────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [sportFilter, setSportFilter] = useState('all')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [uploadType, setUploadType] = useState<'story' | null>(null)
  const [newPostContent, setNewPostContent] = useState('')
  const [newActivityType, setNewActivityType] = useState('run')
  const [newDistance, setNewDistance] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const mediaRef = useRef<HTMLInputElement>(null)

  function toggleLike(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 } : p))
  }
  function toggleSave(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p))
  }
  function toggleComments(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, showComments: !p.showComments } : p))
  }
  function submitComment(postId: string) {
    const text = commentInputs[postId]?.trim()
    if (!text) return
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, comments: [...p.comments, { user: 'Jij', text }], comments_count: p.comments_count + 1 }
      : p))
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
  }
  function createPost() {
    if (!newPostContent.trim()) return
    setPosts(prev => [{
      id: Date.now().toString(), userId: 'me',
      user: { name: 'Jouw Naam', region: 'Jouw Stad' },
      content: newPostContent, activity_type: newActivityType,
      distance_km: newDistance ? parseFloat(newDistance) : undefined,
      duration_minutes: newDuration ? parseInt(newDuration) : undefined,
      likes_count: 0, comments_count: 0, liked: false, saved: false,
      created_at: 'Zojuist', comments: [], showComments: false,
    }, ...prev])
    setNewPostContent(''); setNewDistance(''); setNewDuration('')
    setShowCreatePost(false)
  }

  const filteredPosts = sportFilter === 'all' ? posts : posts.filter(p => p.activity_type === sportFilter)

  // Bouw feed op: voeg suggested buddies in na post 2, daarna elke 4 posts
  type FeedItem = { kind: 'post'; post: Post } | { kind: 'suggested' }
  const feedItems: FeedItem[] = []
  filteredPosts.forEach((post, i) => {
    feedItems.push({ kind: 'post', post })
    if (i === 2 || (i > 2 && (i - 2) % 4 === 0)) feedItems.push({ kind: 'suggested' })
  })

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 max-w-5xl mx-auto">

      {/* ── Linker kolom: feed ── */}
      <div className="space-y-4">

        {/* Post composer (Facebook-stijl) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-[#E87722]/20">
              <Avatar name="Jouw Naam" size="md" className="w-full h-full" />
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-400 text-sm text-left hover:bg-gray-200 transition-colors"
            >
              Deel je training of resultaat...
            </button>
          </div>
          <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
            <button onClick={() => setUploadType('story')}
              className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Camera className="w-3.5 h-3.5 text-[#E87722]" />
              </div>
              <span className="text-[13px] font-semibold text-gray-600 hidden sm:inline">Verhaal</span>
            </button>
            <button onClick={() => setShowCreatePost(true)}
              className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <ImageIcon className="w-3.5 h-3.5 text-green-500" />
              </div>
              <span className="text-[13px] font-semibold text-gray-600 hidden sm:inline">Foto / Activiteit</span>
            </button>
            <button onClick={() => setShowCreatePost(true)}
              className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Play className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
              </div>
              <span className="text-[13px] font-semibold text-gray-600 hidden sm:inline">Video / Reel</span>
            </button>
          </div>
        </div>

        {/* Stories balk */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex gap-4 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button onClick={() => setUploadType('story')}
                className="relative w-[58px] h-[58px] rounded-full bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#E87722] flex items-center justify-center transition-colors group">
                <Camera className="w-5 h-5 text-gray-300 group-hover:text-[#E87722] transition-colors" />
                <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#E87722] rounded-full flex items-center justify-center text-white text-[11px] font-bold">+</span>
              </button>
              <span className="text-[11px] text-gray-400 font-medium w-[58px] text-center truncate">Verhaal</span>
            </div>
            {DEMO_STORIES.map((story, index) => (
              <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0">
                <button onClick={() => setStoryIndex(index)} className="relative w-[58px] h-[58px] rounded-full">
                  <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E87722] to-orange-300 p-[2.5px]">
                    <span className="block w-full h-full rounded-full bg-white p-[2px]">
                      <span className="block w-full h-full rounded-full overflow-hidden">
                        <Avatar name={story.user.name} size="lg" className="w-full h-full" />
                      </span>
                    </span>
                  </span>
                </button>
                <span className="text-[11px] text-gray-600 font-semibold w-[58px] text-center truncate">
                  {truncateName(story.user.name)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sport filter (Strava-stijl) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {SPORT_FILTERS.map(f => (
            <button key={f.value} onClick={() => setSportFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all shrink-0 ${
                sportFilter === f.value ? 'bg-[#E87722] text-white border-[#E87722]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed items */}
        {feedItems.map((item, idx) =>
          item.kind === 'suggested' ? (
            <SuggestedBuddiesCard key={`sugg-${idx}`} buddies={SUGGESTED_BUDDIES} />
          ) : (
            <PostCard
              key={item.post.id}
              post={item.post}
              onLike={() => toggleLike(item.post.id)}
              onSave={() => toggleSave(item.post.id)}
              onToggleComments={() => toggleComments(item.post.id)}
              onSubmitComment={() => submitComment(item.post.id)}
              commentInput={commentInputs[item.post.id] ?? ''}
              onCommentChange={v => setCommentInputs(prev => ({ ...prev, [item.post.id]: v }))}
              onOpenStory={() => {
                const si = DEMO_STORIES.findIndex(s => s.user.name === item.post.user.name)
                if (si !== -1) setStoryIndex(si)
              }}
            />
          )
        )}

        {filteredPosts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="font-black text-black mb-2">Geen posts gevonden</p>
            <p className="text-sm text-gray-400">Pas je sportfilter aan om meer te zien.</p>
          </div>
        )}
      </div>

      {/* ── Rechter kolom: leaderboard + widgets (alleen desktop) ── */}
      <div className="hidden lg:block">
        <LeaderboardSidebar />
      </div>

      {/* Story viewer */}
      {storyIndex !== null && (
        <StoryViewer stories={DEMO_STORIES} startIndex={storyIndex} onClose={() => setStoryIndex(null)} />
      )}

      {/* Verhaal upload modal */}
      {uploadType === 'story' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4" onClick={() => setUploadType(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h3 className="font-black text-black text-base">Verhaal maken</h3>
              <button onClick={() => setUploadType(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-5">
              <button onClick={() => mediaRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-[#E87722] transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-orange-50">
                <Camera className="w-8 h-8 text-gray-300" />
                <p className="text-sm font-semibold text-gray-400">Foto of video uploaden</p>
                <p className="text-xs text-gray-300">Verdwijnt na 24 uur</p>
              </button>
              <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden" />
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setUploadType(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm">Annuleren</button>
              <button onClick={() => setUploadType(null)} className="flex-1 bg-[#E87722] text-white font-bold py-3 rounded-xl text-sm">Plaatsen</button>
            </div>
          </div>
        </div>
      )}

      {/* Post aanmaken modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-black text-black text-lg">Deel je training</h3>
              <button onClick={() => setShowCreatePost(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={3} autoFocus
                placeholder="Wat heb je gedaan? Deel je training, resultaat of zoek een buddy..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
              <button type="button" onClick={() => mediaRef.current?.click()}
                className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-[#E87722] rounded-xl px-4 py-3 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-green-100 group-hover:bg-orange-50 flex items-center justify-center shrink-0 transition-colors">
                  <ImageIcon className="w-4 h-4 text-green-500 group-hover:text-[#E87722] transition-colors" />
                </div>
                <span className="text-sm text-gray-400 font-medium">Foto of video toevoegen</span>
              </button>
              <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden" />
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Sport</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map(a => (
                    <button key={a.value} onClick={() => setNewActivityType(a.value)}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${newActivityType === a.value ? 'border-[#E87722] bg-orange-50 text-[#E87722]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Afstand (km)</label>
                  <input type="number" value={newDistance} onChange={e => setNewDistance(e.target.value)} placeholder="bv. 10.5"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Duur (minuten)</label>
                  <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="bv. 45"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreatePost(false)} className="flex-1 border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Annuleren</button>
              <button onClick={createPost} disabled={!newPostContent.trim()} className="flex-1 bg-[#E87722] text-white font-bold py-2.5 rounded-xl hover:bg-[#d06a1a] disabled:opacity-40 text-sm">Delen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
