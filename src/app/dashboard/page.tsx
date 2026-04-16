'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin,
  Camera, Image as ImageIcon, Zap, X, Plus, Play,
  Users, Activity, Star, TrendingUp, UserPlus,
  Music2, AtSign, Flame, Trophy, HelpCircle, BarChart2, Calendar,
  Check, Compass,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import PostComposer from './_components/PostComposer'
import { useProfileCard } from '@/components/ProfileCardModal'

// ─── Design tokens ────────────────────────────────────────────────────────────
const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  region: string | null
  sport: string | null
}

type Post = {
  id: string
  userId: string
  userName: string
  userRegion: string
  userAvatarUrl?: string
  content: string
  type?: string
  sport_tag?: string
  activity_type?: string
  distance_km?: number
  duration_minutes?: number
  image_url?: string
  media_url?: string
  media_type?: string
  thumbnail_url?: string
  likes_count: number
  comments_count: number
  liked: boolean
  saved: boolean
  created_at: string
  is_sponsored?: boolean
  sponsor_name?: string
  is_discovery?: boolean   // komt uit de open-accounts discovery laag
  // Extra velden
  location?: string
  music?: string
  tagged_users?: string[]
  tagged_user_names?: string[]
  calories?: number
  activity_name?: string
  activity_date?: string
  challenge_name?: string
  challenge_type?: string
  challenge_goal?: string
  challenge_start?: string
  challenge_end?: string
  question?: string
  answer_type?: string
  poll_options?: string[]
}

type Story = {
  id: string
  userName: string
  avatarUrl?: string
  mediaUrl?: string
}

type BuddySuggestion = {
  id: string
  name: string
  region: string
  sport: string
  avatarUrl?: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_STORIES: Story[] = [
  { id: 's1', userName: 'Tim van Berg', mediaUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&q=80' },
  { id: 's2', userName: 'Sarah Jansen', mediaUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=200&q=80' },
  { id: 's3', userName: 'Marco de Wit', mediaUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=80' },
  { id: 's4', userName: 'Lisa Hoek', mediaUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&q=80' },
  { id: 's5', userName: 'Kevin Storm' },
  { id: 's6', userName: 'Emma Kool' },
]


const DEMO_SUGGESTIONS: BuddySuggestion[] = [
  { id: '1', name: 'Roos Vermeer', region: 'Amsterdam', sport: 'Hardlopen' },
  { id: '2', name: 'Joris Bakker', region: 'Amsterdam', sport: 'Fietsen' },
  { id: '3', name: 'Nadia El-Amin', region: 'Utrecht', sport: 'Yoga' },
  { id: '4', name: 'Bram van Dijk', region: 'Rotterdam', sport: 'Gym' },
]



type SportGradient = { start: string; mid: string; end: string }

function getSportGradient(sport?: string): SportGradient {
  const s = (sport ?? '').toLowerCase()
  if (s.includes('hardlopen') || s === 'run')      return { start: '#E87722', mid: '#FF6B35', end: '#C0392B' }
  if (s.includes('fietsen')   || s === 'cycle')    return { start: '#11998e', mid: '#059669', end: '#064E3B' }
  if (s.includes('zwemmen')   || s === 'swim')     return { start: '#0284C7', mid: '#0369A1', end: '#1E3A5F' }
  if (s.includes('gym'))                           return { start: '#1C1917', mid: '#292524', end: '#111111' }
  if (s.includes('triathlon'))                     return { start: '#6366F1', mid: '#8B5CF6', end: '#4F46E5' }
  if (s.includes('tennis'))                        return { start: '#CA8A04', mid: '#D97706', end: '#92400E' }
  if (s.includes('voetbal'))                       return { start: '#16A34A', mid: '#15803D', end: '#14532D' }
  if (s.includes('padel'))                         return { start: '#0891B2', mid: '#0E7490', end: '#164E63' }
  if (s.includes('yoga'))                          return { start: '#DB2777', mid: '#BE185D', end: '#9D174D' }
  if (s.includes('boksen'))                        return { start: '#DC2626', mid: '#B91C1C', end: '#7F1D1D' }
  if (s.includes('klimmen'))                       return { start: '#78350F', mid: '#92400E', end: '#451A03' }
  return                                                  { start: '#4F46E5', mid: '#6366F1', end: '#312E81' }
}

function getActivityStats(post: Post): { value: string; label: string }[] {
  const pace = post.distance_km && post.duration_minutes
    ? `${Math.floor(post.duration_minutes / post.distance_km)}:${String(Math.round((post.duration_minutes / post.distance_km % 1) * 60)).padStart(2, '0')}`
    : null
  const sport = (post.activity_type ?? post.sport_tag ?? '').toLowerCase()
  const stats: { value: string; label: string }[] = []
  if (post.distance_km)      stats.push({ value: `${post.distance_km} km`,      label: 'Afstand' })
  if (post.duration_minutes) {
    const h = Math.floor(post.duration_minutes / 60)
    const m = String(post.duration_minutes % 60).padStart(2, '0')
    stats.push({ value: h > 0 ? `${h}:${m}` : `${post.duration_minutes} min`, label: 'Tijd' })
  }
  if (pace && (sport.includes('run') || sport.includes('hardlopen'))) {
    stats.push({ value: `${pace}/km`, label: 'Tempo' })
  } else if (pace && (sport.includes('cycle') || sport.includes('fietsen'))) {
    const speed = post.distance_km && post.duration_minutes
      ? (post.distance_km / (post.duration_minutes / 60)).toFixed(1)
      : null
    if (speed) stats.push({ value: `${speed} km/h`, label: 'Snelheid' })
  }
  return stats
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fade-in-up pointer-events-none">
      <Check className="w-4 h-4 text-green-400 shrink-0" /> {msg}
    </div>
  )
}

function PostComposerBar({
  userName, avatarUrl, onOpen,
}: { userName: string; avatarUrl?: string | null; onOpen: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={userName} imageUrl={avatarUrl ?? null} size="sm" />
        <button
          onClick={onOpen}
          className="flex-1 text-left px-4 py-2.5 rounded-xl bg-[#F5F0E8] text-sm text-gray-400 font-medium hover:bg-[#ede8df] transition-colors"
        >
          Wat ben je aan het doen, {userName.split(' ')[0]}?
        </button>
        <div className="flex items-center gap-1">
          <button onClick={onOpen} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F5F0E8] transition-colors" title="Video">
            <Camera className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={onOpen} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F5F0E8] transition-colors" title="Foto">
            <ImageIcon className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={onOpen} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#F5F0E8] transition-colors" title="Activiteit">
            <Zap className="w-4 h-4 text-[#E87722]" />
          </button>
        </div>
      </div>
    </div>
  )
}

function StoriesBar({ stories, userName, avatarUrl, onAddStory }: {
  stories: Story[]
  userName: string
  avatarUrl?: string | null
  onAddStory: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {/* Own story */}
        <button onClick={onAddStory} className="flex flex-col items-center gap-1.5 shrink-0 group">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-black/8">
              <Avatar name={userName} imageUrl={avatarUrl ?? null} size="lg" />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#E87722] rounded-full flex items-center justify-center ring-2 ring-white">
              <Plus className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-500 w-14 text-center truncate">Jouw verhaal</span>
        </button>

        {/* Buddy stories */}
        {stories.map(story => (
          <button key={story.id} className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-14 h-14 rounded-full ring-2 ring-[#E87722] ring-offset-2 overflow-hidden">
              {story.mediaUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.mediaUrl} alt={story.userName} className="w-full h-full object-cover" />
              ) : (
                <Avatar name={story.userName} imageUrl={null} size="lg" />
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-500 w-14 text-center truncate">
              {story.userName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Shared action bar ─────────────────────────────────────────────────────────
function CardActions({ post, onLike, onSave }: {
  post: Post
  onLike: (id: string) => void
  onSave: (id: string) => void
}) {
  const [bounce, setBounce] = useState(false)
  function handleLike() {
    setBounce(true)
    onLike(post.id)
    setTimeout(() => setBounce(false), 300)
  }
  return (
    <div className="flex items-center gap-0.5 px-3 pb-4 pt-2">
      <button onClick={handleLike} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors">
        <Heart
          className="w-[19px] h-[19px] transition-transform duration-150"
          style={{
            color: post.liked ? '#E87722' : '#9CA3AF',
            fill:  post.liked ? '#E87722' : 'none',
            transform: bounce ? 'scale(1.35)' : 'scale(1)',
          }}
        />
        <span className="text-sm font-medium text-gray-500">{post.likes_count}</span>
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
        <MessageCircle className="w-[19px] h-[19px] text-gray-400 group-hover:text-[#E87722] transition-colors" />
        <span className="text-sm font-medium text-gray-500">{post.comments_count}</span>
      </button>
      <button onClick={() => onSave(post.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
        <Bookmark
          className="w-[19px] h-[19px] transition-colors"
          style={{ color: post.saved ? '#111111' : '#9CA3AF', fill: post.saved ? '#111111' : 'none' }}
        />
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group ml-auto">
        <Share2 className="w-[19px] h-[19px] text-gray-400 group-hover:text-[#E87722] transition-colors" />
      </button>
    </div>
  )
}

// ── Pragmatike curved block ────────────────────────────────────────────────────
// ── Inline video player ───────────────────────────────────────────────────────
function VideoBlock({ post }: { post: Post }) {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation()
    setPlaying(true)
    setTimeout(() => {
      const v = videoRef.current
      if (!v) return
      v.muted = false
      v.play().catch(() => {})
    }, 50)
  }

  if (!post.media_url) return null

  return (
    <div className="mx-3 rounded-[18px] overflow-hidden bg-black relative" style={{ aspectRatio: '16/9' }}>
      {playing ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={videoRef}
          src={post.media_url}
          className="w-full h-full object-contain"
          controls
          playsInline
          autoPlay
        />
      ) : (
        <>
          {post.thumbnail_url || post.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnail_url ?? post.image_url!}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
            >
              <Play className="w-7 h-7 text-white ml-1" />
            </button>
          </div>
          <div className="absolute top-3 right-3 bg-black/50 rounded-full px-2 py-0.5">
            <span className="text-white text-[10px] font-bold">VIDEO</span>
          </div>
        </>
      )}
    </div>
  )
}

function CurvedBlock({ post, gradient }: { post: Post; gradient: SportGradient }) {
  const isActivity = !!(post.distance_km || post.duration_minutes)
  const stats      = isActivity ? getActivityStats(post) : []
  const sportLabel = post.sport_tag ?? 'Activiteit'

  return (
    <div className="mx-3 rounded-[18px] overflow-hidden relative curved-block">
      {/* SVG Pragmatike curve background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`g-${post.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={gradient.start} />
            <stop offset="50%"  stopColor={gradient.mid}   />
            <stop offset="100%" stopColor={gradient.end}   />
          </linearGradient>
        </defs>
        <path
          d="M0,0 L260,0 Q400,0 400,140 L400,400 L0,400 Z"
          fill={`url(#g-${post.id})`}
        />
      </svg>


      {/* Content layer */}
      <div className="absolute inset-0 flex flex-col justify-between p-[22px]">
        {/* Top badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-white text-[11px] font-bold tracking-wide">
            {sportLabel} · Buddys
          </span>
        </div>

        {/* Middle content */}
        {isActivity && post.distance_km ? (
          <div>
            <div className="text-white font-black leading-none curved-stat-main">
              {post.distance_km}
              <span className="text-white/70 font-bold curved-stat-unit"> km</span>
            </div>
            <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mt-1">
              {sportLabel}
            </div>
          </div>
        ) : isActivity ? (
          <div>
            <div className="text-white font-black leading-none curved-stat-main">
              {Math.floor((post.duration_minutes ?? 0) / 60)}
              <span className="text-white/70 font-bold curved-stat-unit">:{String((post.duration_minutes ?? 0) % 60).padStart(2, '0')}</span>
            </div>
            <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mt-1">{sportLabel}</div>
          </div>
        ) : (
          <div className="text-white font-extrabold curved-text-content leading-snug">
            {(post.content ?? '').substring(0, 80)}{(post.content ?? '').length > 80 ? '…' : ''}
          </div>
        )}

        {/* Bottom: stats row or sport tags */}
        {isActivity && stats.length > 0 ? (
          <div className="flex border-t border-white/20 pt-3">
            {stats.map((s, i) => (
              <div key={s.label} className={`flex-1 ${i > 0 ? 'border-l border-white/20 pl-3' : ''}`}>
                <div className="text-white font-extrabold text-base leading-none">{s.value}</div>
                <div className="text-white/55 text-[10px] font-semibold uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {post.sport_tag && (
              <span className="bg-white/20 rounded-full px-2.5 py-1 text-white text-[11px] font-semibold">
                {post.sport_tag}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityCard({ post, onLike, onSave, isNew }: {
  post: Post
  onLike: (id: string) => void
  onSave: (id: string) => void
  isNew?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const gradient = getSportGradient(post.sport_tag ?? post.activity_type)
  const isLong   = (post.content?.length ?? 0) > 150
  const { openProfile } = useProfileCard()

  return (
    <div className={`animate-fade-in-up bg-white rounded-3xl overflow-hidden shadow-sm transition-shadow duration-700 ${isNew ? 'ring-2 ring-[#E87722] ring-offset-2 shadow-orange-100' : ''}`}>
      {/* Ontdekken badge */}
      {post.is_discovery && (
        <div className="px-4 pt-3 pb-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Compass className="w-3 h-3" /> Ontdekken
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[14px] pb-0">
        <button onClick={() => openProfile(post.userId)}>
          <Avatar name={post.userName} imageUrl={post.userAvatarUrl ?? null} size="sm" />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => openProfile(post.userId)} className="text-[14px] font-bold text-black leading-none hover:text-[#E87722] transition-colors">{post.userName}</button>
          <p className="text-[12px] text-gray-400 mt-0.5">{post.created_at} · {post.userRegion}</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Media block */}
      <div className="mt-3">
        {post.media_type === 'video' ? <VideoBlock post={post} /> : <CurvedBlock post={post} gradient={gradient} />}
      </div>

      {/* Caption */}
      {post.content && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[14px] text-[#374151]" style={{ lineHeight: 1.55 }}>
            <span className="font-bold text-black">{post.userName} </span>
            {isLong && !expanded ? post.content.slice(0, 150) + '…' : post.content}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)} className="text-xs font-bold mt-0.5" style={{ color: '#E87722' }}>
              {expanded ? 'Minder' : 'Meer lezen'}
            </button>
          )}
        </div>
      )}

      <PostMeta post={post} />
      <CardActions post={post} onLike={onLike} onSave={onSave} />
    </div>
  )
}

function PostCard({ post, onLike, onSave, isNew }: {
  post: Post
  onLike: (id: string) => void
  onSave: (id: string) => void
  isNew?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const gradient = getSportGradient(post.sport_tag ?? post.activity_type)
  const isLong   = (post.content?.length ?? 0) > 150
  const { openProfile } = useProfileCard()

  return (
    <div className={`animate-fade-in-up bg-white rounded-3xl overflow-hidden shadow-sm transition-shadow duration-700 ${isNew ? 'ring-2 ring-[#E87722] ring-offset-2 shadow-orange-100' : ''}`}>
      {/* Ontdekken badge */}
      {post.is_discovery && (
        <div className="px-4 pt-3 pb-0">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Compass className="w-3 h-3" /> Ontdekken
          </span>
        </div>
      )}
      {/* Sponsored label */}
      {post.is_sponsored && (
        <div className="px-4 pt-3 pb-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Gesponsord · {post.sponsor_name}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[14px] pb-0">
        <button onClick={() => openProfile(post.userId)}>
          <Avatar name={post.userName} imageUrl={post.userAvatarUrl ?? null} size="sm" />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => openProfile(post.userId)} className="text-[14px] font-bold text-black leading-none hover:text-[#E87722] transition-colors">{post.userName}</button>
          <p className="text-[12px] text-gray-400 mt-0.5">{post.created_at} · {post.userRegion}</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Media block — als er een foto is: schone foto zonder tekst erop */}
      {post.media_type === 'video' ? (
        <div className="mt-3"><VideoBlock post={post} /></div>
      ) : post.image_url ? (
        <div className="mx-3 mt-3 rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt="" className="w-full object-cover" />
        </div>
      ) : (
        <div className="mt-3"><CurvedBlock post={post} gradient={gradient} /></div>
      )}

      {/* Caption */}
      {post.content && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[14px] text-[#374151]" style={{ lineHeight: 1.55 }}>
            <span className="font-bold text-black">{post.userName} </span>
            {isLong && !expanded ? post.content.slice(0, 150) + '…' : post.content}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)} className="text-xs font-bold mt-0.5" style={{ color: '#E87722' }}>
              {expanded ? 'Minder' : 'Meer lezen'}
            </button>
          )}
        </div>
      )}

      <PostMeta post={post} />
      <CardActions post={post} onLike={onLike} onSave={onSave} />
    </div>
  )
}

function BuddySuggestionsRow({ buddies, onClose, onRequest }: {
  buddies: BuddySuggestion[]
  onClose: () => void
  onRequest: (id: string) => void
}) {
  const { openProfile } = useProfileCard()
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-black text-black" style={SYNE}>Suggesties voor jou</p>
        <button onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {buddies.map(buddy => (
          <div key={buddy.id} className="shrink-0 w-36 bg-[#F5F0E8] rounded-xl p-3 flex flex-col items-center gap-2 text-center">
            <button onClick={() => openProfile(buddy.id)}>
              <Avatar name={buddy.name} imageUrl={buddy.avatarUrl ?? null} size="sm" />
            </button>
            <div>
              <button onClick={() => openProfile(buddy.id)} className="text-xs font-bold text-black leading-tight hover:text-[#E87722] transition-colors">{buddy.name}</button>
              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />{buddy.region}
              </p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E87722]/10 text-[#E87722]">
                {buddy.sport}
              </span>
            </div>
            <button
              onClick={() => onRequest(buddy.id)}
              className="w-full py-1.5 rounded-lg text-[10px] font-black transition-colors"
              style={{ ...SYNE, background: '#111111', color: 'white' }}
            >
              Buddy verzoek
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function RightSidebar({ profile, buddyCount }: {
  profile: UserProfile | null
  buddyCount: number
}) {
  const displayName = profile?.full_name ?? profile?.username ?? 'Jij'
  const ACTIVE_BUDDIES = [
    { name: 'Tim van Berg', sport: 'Hardlopen' },
    { name: 'Sarah Jansen', sport: 'Fietsen' },
    { name: 'Marco de Wit', sport: 'Gym' },
  ]
  const TRENDING_SPORTS = ['Hardlopen', 'Padel', 'Gym']

  return (
    <div className="space-y-4 sticky top-24">
      {/* Blok 1 — Mini profiel */}
      <div className="bg-white rounded-2xl border border-black/8 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={displayName} imageUrl={profile?.avatar_url ?? null} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-black truncate" style={SYNE}>{displayName}</p>
            {profile?.region && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{profile.region}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 text-center">
          {[
            { label: 'Buddies', value: buddyCount },
            { label: 'Posts', value: '0' },
            { label: 'Week', value: '0' },
          ].map(s => (
            <div key={s.label} className="bg-[#F5F0E8] rounded-xl py-2">
              <p className="text-sm font-black text-[#E87722]" style={SYNE}>{s.value}</p>
              <p className="text-[10px] text-gray-500 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/profile/me"
          className="mt-3 w-full block text-center py-2 rounded-xl text-xs font-bold transition-colors text-white hover:opacity-90"
          style={{ background: '#E87722' }}
        >
          Bekijk profiel
        </Link>
      </div>

      {/* Blok 2 — Actieve buddies */}
      <div className="bg-white rounded-2xl border border-black/8 p-4">
        <p className="text-sm font-black text-black mb-3" style={SYNE}>Actieve buddies</p>
        <div className="space-y-2.5">
          {ACTIVE_BUDDIES.map(b => (
            <div key={b.name} className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar name={b.name} imageUrl={null} size="sm" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full ring-2 ring-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black truncate">{b.name}</p>
                <p className="text-[10px] text-gray-400">{b.sport}</p>
              </div>
              <button className="text-[10px] font-bold text-[#E87722] hover:underline whitespace-nowrap">
                Bericht
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Blok 3 — Uitnodiging van de week */}
      <div className="bg-white rounded-2xl border border-black/8 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 text-[#E87722]" />
          <p className="text-sm font-black text-black" style={SYNE}>Uitnodiging</p>
        </div>
        <div className="bg-[#F5F0E8] rounded-xl p-3">
          <p className="text-xs font-black text-black" style={SYNE}>Vondelpark Morning Run</p>
          <p className="text-[10px] text-gray-500 mt-1">Hardlopen · Amsterdam · za 19 apr</p>
          <p className="text-[10px] text-gray-400 mt-0.5">12 deelnemers</p>
        </div>
        <Link
          href="/dashboard/meetup"
          className="mt-3 w-full block text-center py-2 rounded-xl text-xs font-bold transition-colors"
          style={{ background: '#E87722', color: 'white', ...SYNE }}
        >
          Doe mee
        </Link>
      </div>

      {/* Blok 4 — Trending sporten */}
      <div className="bg-white rounded-2xl border border-black/8 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#E87722]" />
          <p className="text-sm font-black text-black" style={SYNE}>Trending in jouw regio</p>
        </div>
        <div className="space-y-1.5">
          {TRENDING_SPORTS.map((sport, i) => (
            <button
              key={sport}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#F5F0E8] transition-colors text-left"
            >
              <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
              <span className="text-xs font-bold text-gray-700">{sport}</span>
              <Activity className="w-3 h-3 text-[#E87722] ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Post meta chips (locatie, muziek, tags, challenge, poll) ─────────────────
function PostMeta({ post }: { post: Post }) {
  const [pollVotes, setPollVotes] = useState<Record<number, number>>({})
  const [myVote, setMyVote] = useState<number | null>(null)
  const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0)

  const hasChips = post.location || post.music || (post.tagged_user_names?.length ?? 0) > 0
  const isChallenge = post.type === 'challenge' && post.challenge_name
  const isPoll = post.type === 'question' && post.answer_type === 'poll' && (post.poll_options?.length ?? 0) > 0
  const isQuestion = post.type === 'question' && post.answer_type === 'open' && post.question
  const isActivity = post.type === 'activity' && (post.activity_name || post.calories || post.activity_date)

  if (!hasChips && !isChallenge && !isPoll && !isQuestion && !isActivity) return null

  return (
    <div className="px-4 pb-3 space-y-2.5">

      {/* Chips rij */}
      {hasChips && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.location && (
            <span className="inline-flex items-center gap-1 bg-[#F5F0E8] text-[#111] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <MapPin className="w-3 h-3 text-[#E87722]" />{post.location}
            </span>
          )}
          {post.music && (
            <span className="inline-flex items-center gap-1 bg-[#F5F0E8] text-[#111] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <Music2 className="w-3 h-3 text-[#E87722]" />{post.music}
            </span>
          )}
          {(post.tagged_user_names ?? []).map(name => (
            <span key={name} className="inline-flex items-center gap-1 bg-[#F5F0E8] text-[#111] text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <AtSign className="w-3 h-3 text-[#E87722]" />{name}
            </span>
          ))}
        </div>
      )}

      {/* Activiteit extra info */}
      {isActivity && (
        <div className="flex flex-wrap gap-1.5">
          {post.activity_name && (
            <span className="inline-flex items-center gap-1 bg-orange-50 text-[#E87722] text-[11px] font-bold px-2.5 py-1 rounded-full">
              <Flame className="w-3 h-3" />{post.activity_name}
            </span>
          )}
          {post.calories && (
            <span className="inline-flex items-center gap-1 bg-orange-50 text-[#E87722] text-[11px] font-bold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />{post.calories} kcal
            </span>
          )}
          {post.activity_date && (
            <span className="inline-flex items-center gap-1 bg-[#F5F0E8] text-gray-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <Calendar className="w-3 h-3" />{post.activity_date}
            </span>
          )}
        </div>
      )}

      {/* Challenge blok */}
      {isChallenge && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm font-black text-amber-900">{post.challenge_name}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {post.challenge_type && (
              <span className="text-[11px] text-amber-700 font-semibold">{post.challenge_type}</span>
            )}
            {post.challenge_goal && (
              <span className="text-[11px] text-amber-700 font-semibold">Doel: {post.challenge_goal}</span>
            )}
            {post.challenge_start && post.challenge_end && (
              <span className="text-[11px] text-amber-600">{post.challenge_start} → {post.challenge_end}</span>
            )}
          </div>
        </div>
      )}

      {/* Open vraag */}
      {isQuestion && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-purple-900">{post.question}</p>
        </div>
      )}

      {/* Poll */}
      {isPoll && (
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide">Poll</span>
          </div>
          {(post.poll_options ?? []).map((opt, i) => {
            const votes = pollVotes[i] ?? 0
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
            const voted = myVote === i
            return (
              <button
                key={i}
                onClick={() => {
                  if (myVote !== null) return
                  setMyVote(i)
                  setPollVotes(prev => ({ ...prev, [i]: (prev[i] ?? 0) + 1 }))
                }}
                className="w-full text-left rounded-xl overflow-hidden border transition-colors"
                style={{ borderColor: voted ? '#E87722' : '#E5E7EB' }}
              >
                <div className="relative px-3 py-2.5">
                  {myVote !== null && (
                    <div
                      className="absolute inset-0 rounded-xl transition-all"
                      style={{ width: `${pct}%`, background: voted ? '#FFF0E5' : '#F9FAFB' }}
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: voted ? '#E87722' : '#374151' }}>{opt}</span>
                    {myVote !== null && (
                      <span className="text-xs font-bold" style={{ color: voted ? '#E87722' : '#9CA3AF' }}>{pct}%</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
          {myVote !== null && (
            <p className="text-[11px] text-gray-400 text-center">{totalVotes} stem{totalVotes !== 1 ? 'men' : ''}</p>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-10 text-center">
      <div className="w-16 h-16 bg-[#E87722]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-[#E87722]" />
      </div>
      <h2 className="text-lg font-black text-black mb-2" style={SYNE}>Je feed is nog leeg</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
        Vind je eerste buddy en begin je sportnetwerk op te bouwen!
      </p>
      <Link
        href="/dashboard/find"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-colors"
        style={{ ...SYNE, background: '#E87722' }}
      >
        <UserPlus className="w-4 h-4" /> Buddy zoeken
      </Link>

      {/* Suggestie kaartjes */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DEMO_SUGGESTIONS.slice(0, 3).map(b => (
          <div key={b.id} className="bg-[#F5F0E8] rounded-xl p-4 flex flex-col items-center gap-2 text-center">
            <Avatar name={b.name} imageUrl={null} size="sm" />
            <div>
              <p className="text-xs font-bold text-black">{b.name}</p>
              <p className="text-[10px] text-gray-400">{b.region}</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E87722]/10 text-[#E87722]">
                {b.sport}
              </span>
            </div>
            <Link href={`/dashboard/profile/${b.id}`} className="text-[10px] font-bold text-[#E87722] hover:underline">
              Bekijk profiel →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}


function NewPostsBanner({ count, onRefresh }: { count: number; onRefresh: () => void }) {
  if (count === 0) return null
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-xl transition-all hover:scale-105"
        style={{ background: '#111111' }}
      >
        <TrendingUp className="w-4 h-4 text-[#E87722]" />
        {count} nieuwe post{count !== 1 ? 's'  : ''} — Klik om te vernieuwen
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const supabase = createClient()

  const [profile,          setProfile]          = useState<UserProfile | null>(null)
  const [posts,            setPosts]            = useState<Post[]>([])
  const [discoveryPosts,   setDiscoveryPosts]   = useState<Post[]>([])
  const [userId,           setUserId]           = useState<string | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [loadingMore,      setLoadingMore]      = useState(false)
  const [hasMore,          setHasMore]          = useState(true)
  const [allSeen,          setAllSeen]          = useState(false)
  const [composerOpen,     setComposerOpen]     = useState(false)
  const [newPostsCount,    setNewPostsCount]    = useState(0)
  const [hiddenSuggestions, setHiddenSuggestions] = useState(false)
  const [buddyCount,       setBuddyCount]       = useState(0)
  const [requestedIds,     setRequestedIds]     = useState<Set<string>>(new Set())
  const [toastMsg,         setToastMsg]         = useState<string | null>(null)
  const [justPosted,       setJustPosted]       = useState(false)

  const sentinelRef       = useRef<HTMLDivElement>(null)
  const lastCreatedAtRef  = useRef<string | null>(null)
  const PAGE_SIZE         = 8

  // No profiles join — fetched separately so a missing column never breaks the feed
  const POST_SELECT = 'id, user_id, content, type, sport_tag, activity_type, distance_km, duration_minutes, image_url, media_url, media_type, thumbnail_url, likes_count, created_at, location, music, tagged_users, calories, activity_name, activity_date, challenge_name, challenge_type, challenge_goal, challenge_start, challenge_end, question, answer_type, poll_options'
  const POST_SELECT_MIN = 'id, user_id, content, likes_count, created_at'

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 1)  return 'Zojuist'
    if (mins < 60) return `${mins} min geleden`
    if (hours < 24) return `${hours} uur geleden`
    return `${days} dag${days > 1 ? 'en' : ''} geleden`
  }

  // mapPosts: fetches author profiles + tagged-user names separately so a missing
  // column in profiles never causes the post query itself to fail.
  const mapPosts = useCallback(async (rawPosts: any[]): Promise<Post[]> => {
    if (rawPosts.length === 0) return []

    // Batch-load author profiles
    const authorIds = [...new Set(rawPosts.map((p: any) => p.user_id as string))]
    const { data: authorProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, region')
      .in('id', authorIds)
    const profileMap: Record<string, any> = Object.fromEntries(
      (authorProfiles ?? []).map((p: any) => [p.id, p])
    )

    // Batch-load tagged-user names
    const allTaggedIds = [...new Set(rawPosts.flatMap((p: any) => (p.tagged_users ?? []) as string[]))]
    let taggedNamesMap: Record<string, string> = {}
    if (allTaggedIds.length > 0) {
      const { data: taggedProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', allTaggedIds)
      taggedNamesMap = Object.fromEntries(
        (taggedProfiles ?? []).map((p: any) => [p.id, p.full_name ?? p.username ?? '?'])
      )
    }

    return rawPosts.map((p: any) => {
      const prof = profileMap[p.user_id] ?? null
      return {
        id: p.id,
        userId: p.user_id,
        userName: prof?.full_name ?? prof?.username ?? 'Gebruiker',
        userRegion: prof?.region ?? '',
        userAvatarUrl: prof?.avatar_url ?? undefined,
        content: p.content ?? '',
        type: p.type,
        sport_tag: p.sport_tag,
        activity_type: p.activity_type,
        distance_km: p.distance_km,
        duration_minutes: p.duration_minutes,
        media_type: p.media_type,
        media_url: p.media_url,
        thumbnail_url: p.thumbnail_url,
        image_url: p.media_type === 'video' ? (p.thumbnail_url ?? null) : (p.image_url ?? p.media_url),
        likes_count: p.likes_count ?? 0,
        comments_count: 0,
        liked: false,
        saved: false,
        created_at: timeAgo(p.created_at),
        location: p.location,
        music: p.music,
        tagged_users: p.tagged_users,
        tagged_user_names: (p.tagged_users ?? []).map((id: string) => taggedNamesMap[id]).filter(Boolean),
        calories: p.calories,
        activity_name: p.activity_name,
        activity_date: p.activity_date,
        challenge_name: p.challenge_name,
        challenge_type: p.challenge_type,
        challenge_goal: p.challenge_goal,
        challenge_start: p.challenge_start,
        challenge_end: p.challenge_end,
        question: p.question,
        answer_type: p.answer_type,
        poll_options: p.poll_options,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPosts = useCallback(async (uid?: string) => {
    // ── Stap 1: buddy-ID's ophalen ────────────────────────────────────────────
    const selfAndBuddyIds = new Set<string>()
    if (uid) {
      selfAndBuddyIds.add(uid)
      const { data: buddyData } = await supabase
        .from('follow_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
        .eq('status', 'accepted')
      ;(buddyData ?? []).forEach((b: { from_user_id: string; to_user_id: string }) => {
        selfAndBuddyIds.add(b.from_user_id === uid ? b.to_user_id : b.from_user_id)
      })
    }

    // ── Stap 2: Laag 1 — buddy-posts (eigen + geaccepteerde buddies) ──────────
    const buddyIdsArr = [...selfAndBuddyIds]
    let rawBuddyPosts: any[] = []
    if (buddyIdsArr.length > 0) {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .in('user_id', buddyIdsArr)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (!error && data) {
        rawBuddyPosts = data
      } else {
        const { data: minimal } = await supabase
          .from('posts')
          .select(POST_SELECT_MIN)
          .in('user_id', buddyIdsArr)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE)
        rawBuddyPosts = minimal ?? []
      }
    } else {
      // Geen buddies — laad recente posts van het platform als fallback
      const { data } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      rawBuddyPosts = data ?? []
    }

    // ── Stap 3: Laag 2 — discovery-posts (open accounts, geen buddy) ─────────
    let rawDiscoveryPosts: any[] = []
    try {
      // Haal recente posts op (meer dan nodig, dan client-side filteren)
      const { data: allRecent } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE * 3)

      if (allRecent) {
        const nonBuddy = allRecent.filter((p: any) => !selfAndBuddyIds.has(p.user_id))
        if (nonBuddy.length > 0) {
          const nonBuddyUserIds = [...new Set(nonBuddy.map((p: any) => p.user_id as string))]
          const { data: userProfiles } = await supabase
            .from('profiles')
            .select('id, account_type')
            .in('id', nonBuddyUserIds)
          const openIds = new Set(
            (userProfiles ?? [])
              .filter((p: any) => !p.account_type || p.account_type === 'open')
              .map((p: any) => p.id as string)
          )
          // Prioriteer video-content in discovery; max 1 per 5 buddy-posts
          const discoveryMax = Math.max(Math.ceil(rawBuddyPosts.length / 5), 2)
          const eligible = nonBuddy.filter((p: any) => openIds.has(p.user_id))
          const videos  = eligible.filter((p: any) => p.media_type === 'video')
          const others  = eligible.filter((p: any) => p.media_type !== 'video')
          rawDiscoveryPosts = [...videos, ...others].slice(0, discoveryMax)
        }
      }
    } catch { /* discovery is best-effort */ }

    if (rawBuddyPosts.length === 0 && rawDiscoveryPosts.length === 0) {
      setPosts([])
      setDiscoveryPosts([])
      setHasMore(false)
      return
    }

    if (rawBuddyPosts.length > 0) {
      lastCreatedAtRef.current = rawBuddyPosts[rawBuddyPosts.length - 1].created_at
    }

    const [mappedBuddy, mappedDiscovery] = await Promise.all([
      mapPosts(rawBuddyPosts),
      mapPosts(rawDiscoveryPosts),
    ])

    setPosts(mappedBuddy)
    setDiscoveryPosts(mappedDiscovery.map(p => ({ ...p, is_discovery: true })))
    setHasMore(rawBuddyPosts.length >= PAGE_SIZE)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPosts])

  // Load profile + initial posts
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { count: bc }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username, avatar_url, region').eq('id', user.id).single(),
        supabase.from('follow_requests').select('*', { count: 'exact', head: true }).or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`).eq('status', 'accepted'),
      ])

      if (prof) setProfile({ ...prof, sport: null })
      setBuddyCount(bc ?? 0)
      setUserId(user.id)

      await loadPosts(user.id)
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Simulate new posts banner after 30s
  useEffect(() => {
    const t = setTimeout(() => setNewPostsCount(3), 30000)
    return () => clearTimeout(t)
  }, [])

  // Infinite scroll — loads next page from DB using cursor
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || allSeen || !lastCreatedAtRef.current) return
    setLoadingMore(true)

    const cursor = lastCreatedAtRef.current
    let { data: rawPosts, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .lt('created_at', cursor)
      .limit(PAGE_SIZE)

    if (error) {
      const { data: minimal } = await supabase
        .from('posts')
        .select(POST_SELECT_MIN)
        .order('created_at', { ascending: false })
        .lt('created_at', cursor)
        .limit(PAGE_SIZE)
      rawPosts = minimal as any
    }

    if (!rawPosts || rawPosts.length === 0) {
      setAllSeen(true)
      setHasMore(false)
    } else {
      lastCreatedAtRef.current = rawPosts[rawPosts.length - 1].created_at
      const mapped = await mapPosts(rawPosts)
      setPosts(prev => [...prev, ...mapped])
      if (rawPosts.length < PAGE_SIZE) {
        setAllSeen(true)
        setHasMore(false)
      }
    }
    setLoadingMore(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, allSeen, mapPosts])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  function handleLike(id: string) {
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ))
  }

  function handleSave(id: string) {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, saved: !p.saved } : p
    ))
  }

  async function handlePosted() {
    await loadPosts(userId ?? undefined)
    setToastMsg('Je post is geplaatst!')
    setJustPosted(true)
    setTimeout(() => setJustPosted(false), 3000)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleRefreshFeed() {
    setNewPostsCount(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBuddyRequest(id: string) {
    setRequestedIds(prev => new Set(prev).add(id))
  }

  const displayName = profile?.full_name ?? profile?.username ?? 'Sporter'

  // Build feed items: buddy posts first, discovery interleaved every 5, suggestions every 10
  const feedItems: Array<{ type: 'post'; post: Post } | { type: 'suggestions' }> = []
  let discoveryIdx = 0
  posts.forEach((post, i) => {
    feedItems.push({ type: 'post', post })
    // Every 5 buddy posts → insert 1 discovery post
    if ((i + 1) % 5 === 0 && discoveryIdx < discoveryPosts.length) {
      feedItems.push({ type: 'post', post: discoveryPosts[discoveryIdx++] })
    }
    // Every 10 posts → buddy suggestions widget
    if ((i + 1) % 10 === 0 && !hiddenSuggestions) {
      feedItems.push({ type: 'suggestions' })
    }
  })
  // Append any remaining discovery posts at the end
  while (discoveryIdx < discoveryPosts.length) {
    feedItems.push({ type: 'post', post: discoveryPosts[discoveryIdx++] })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex gap-6">
        <div className="flex-1 max-w-[680px] mx-auto lg:mx-0 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-black/8 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
              <div className="h-48 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
      <NewPostsBanner count={newPostsCount} onRefresh={handleRefreshFeed} />
      <PostComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={handlePosted}
      />

      {/* Floating action button — mobile only */}
      <button
        onClick={() => setComposerOpen(true)}
        className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: '#E87722' }}
        aria-label="Nieuw bericht"
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>

      <div className="max-w-7xl mx-auto flex gap-6 items-start">
        {/* ── Main feed column ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 max-w-[680px] mx-auto lg:mx-0 space-y-3">

          <PostComposerBar
            userName={displayName}
            avatarUrl={profile?.avatar_url}
            onOpen={() => setComposerOpen(true)}
          />

          <StoriesBar
            stories={DEMO_STORIES}
            userName={displayName}
            avatarUrl={profile?.avatar_url}
            onAddStory={() => setComposerOpen(true)}
          />


          {/* Feed content */}
          {posts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {feedItems.map((item, i) => {
                if (item.type === 'suggestions') {
                  return (
                    <BuddySuggestionsRow
                      key={`suggestions-${i}`}
                      buddies={DEMO_SUGGESTIONS.filter(b => !requestedIds.has(b.id))}
                      onClose={() => setHiddenSuggestions(true)}
                      onRequest={handleBuddyRequest}
                    />
                  )
                }
                const post = item.post
                const isNew = justPosted && i === 0
                // Activity card for posts with activity data
                if (post.activity_type && (post.distance_km || post.duration_minutes)) {
                  return (
                    <ActivityCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onSave={handleSave}
                      isNew={isNew}
                    />
                  )
                }
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onSave={handleSave}
                    isNew={isNew}
                  />
                )
              })}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} />

              {/* Loading indicator */}
              {loadingMore && (
                <div className="flex justify-center py-6 gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full animate-pulse"
                      style={{ background: '#E87722', animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              )}

              {/* All seen message */}
              {allSeen && (
                <div className="bg-white rounded-2xl border border-black/8 p-8 text-center">
                  <p className="text-sm font-bold text-gray-400 mb-4">Je hebt alles gezien 🎉</p>
                  <Link
                    href="/dashboard/find"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white transition-colors"
                    style={{ ...SYNE, background: '#E87722' }}
                  >
                    <UserPlus className="w-4 h-4" /> Ontdek nieuwe sporters
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right sidebar — desktop only ────────────────────────────── */}
        <div className="hidden lg:block w-[300px] xl:w-[320px] shrink-0">
          <RightSidebar profile={profile} buddyCount={buddyCount} />
        </div>
      </div>

      {/* Scrollbar hide style */}
      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </>
  )
}
