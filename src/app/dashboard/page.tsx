'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin,
  Camera, Image as ImageIcon, Zap, X, Plus,
  Users, Activity, Star, TrendingUp, UserPlus,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import PostComposer from './_components/PostComposer'

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
  sport_tag?: string
  activity_type?: string
  distance_km?: number
  duration_minutes?: number
  image_url?: string
  likes_count: number
  comments_count: number
  liked: boolean
  saved: boolean
  created_at: string
  is_sponsored?: boolean
  sponsor_name?: string
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

const DEMO_POSTS: Post[] = [
  {
    id: 'd1', userId: '1', userName: 'Tim van Berg', userRegion: 'Amsterdam',
    content: 'Geweldige ochtendrun door het Vondelpark. De lucht was perfect en ik voelde me sterk vandaag. Wie wil er volgende week mee?',
    sport_tag: 'Hardlopen', activity_type: 'run', distance_km: 10.4, duration_minutes: 52,
    image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    likes_count: 24, comments_count: 5, liked: false, saved: false, created_at: '2 min geleden',
  },
  {
    id: 'd2', userId: '2', userName: 'Sarah Jansen', userRegion: 'Utrecht',
    content: 'Vandaag 45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht. De route is een aanrader!',
    sport_tag: 'Fietsen', activity_type: 'cycle', distance_km: 45, duration_minutes: 105,
    image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
    likes_count: 41, comments_count: 8, liked: true, saved: false, created_at: '1 uur geleden',
  },
  {
    id: 'd3', userId: '3', userName: 'Marco de Wit', userRegion: 'Rotterdam',
    content: 'PR vandaag op deadlift: 160kg. Zes maanden hard werken heeft zijn vruchten afgeworpen. Op zoek naar een trainingsbuddy voor zware sessies!',
    sport_tag: 'Gym', activity_type: 'gym',
    likes_count: 67, comments_count: 12, liked: false, saved: true, created_at: '3 uur geleden',
  },
  {
    id: 'd4', userId: '4', userName: 'Lisa Hoek', userRegion: 'Amsterdam',
    content: 'Yoga in het park. Wie wil volgende week ook komen? Elke zondagochtend 9:00 bij het Vondelpark paviljoen.',
    sport_tag: 'Yoga',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    likes_count: 89, comments_count: 21, liked: false, saved: false, created_at: 'Gisteren',
  },
  {
    id: 'd5', userId: '5', userName: 'Kevin Storm', userRegion: 'Den Haag',
    content: 'Triathlon training week 8. Zwemmen ging super, fiets ook goed. Nu focussen op de run. Nog 3 weken tot de race!',
    sport_tag: 'Triathlon', activity_type: 'swim', distance_km: 2.4, duration_minutes: 48,
    likes_count: 34, comments_count: 7, liked: false, saved: false, created_at: 'Gisteren',
  },
  {
    id: 'd6', userId: '6', userName: 'Anna de Boer', userRegion: 'Amsterdam',
    content: 'Nieuwe padel partner gezocht! Ik speel op niveau 4 en zoek iemand voor wekelijkse sessies in Amsterdam-West.',
    sport_tag: 'Padel',
    likes_count: 15, comments_count: 9, liked: false, saved: false, created_at: '2 dagen geleden',
  },
  {
    id: 'd7', userId: '7', userName: 'Daan Bakker', userRegion: 'Haarlem',
    content: 'Net terug van een fantastische klimsessie. Boulderprobleem V6 eindelijk geflashed na twee weken proberen!',
    sport_tag: 'Klimmen',
    image_url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
    likes_count: 52, comments_count: 14, liked: false, saved: false, created_at: '2 dagen geleden',
  },
  {
    id: 'd8', userId: '2', userName: 'Sarah Jansen', userRegion: 'Utrecht',
    content: 'Ochtendzwemmen vóór het werk is echt de beste start van de dag. 2km open water!',
    sport_tag: 'Zwemmen', activity_type: 'swim', distance_km: 2, duration_minutes: 40,
    likes_count: 28, comments_count: 4, liked: false, saved: false, created_at: '3 dagen geleden',
  },
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

type FeedTab = 'buddies' | 'ontdekken' | 'trending'

function FeedTabs({ active, onChange }: { active: FeedTab; onChange: (t: FeedTab) => void }) {
  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'buddies',    label: 'Buddies'    },
    { key: 'ontdekken', label: 'Ontdekken'  },
    { key: 'trending',  label: 'Trending'   },
  ]
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-1.5 flex gap-1">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            ...SYNE,
            background: active === tab.key ? '#111111' : 'transparent',
            color: active === tab.key ? 'white' : '#6B7280',
          }}
        >
          {tab.label}
        </button>
      ))}
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

      {/* Photo background (if photo post) */}
      {post.image_url && !isActivity && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Re-draw curve as white tint so shape stays visible */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 400"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 L260,0 Q400,0 400,140 L400,400 L0,400 Z"
              fill="rgba(255,255,255,0.12)"
            />
          </svg>
        </>
      )}

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

function ActivityCard({ post, onLike, onSave }: {
  post: Post
  onLike: (id: string) => void
  onSave: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const gradient = getSportGradient(post.sport_tag ?? post.activity_type)
  const isLong   = (post.content?.length ?? 0) > 150

  return (
    <div className="animate-fade-in-up bg-white rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[14px] pb-0">
        <Link href={`/dashboard/profile/${post.userId}`}>
          <Avatar name={post.userName} imageUrl={post.userAvatarUrl ?? null} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-black leading-none">{post.userName}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{post.created_at} · {post.userRegion}</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Curved block */}
      <div className="mt-3">
        <CurvedBlock post={post} gradient={gradient} />
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

      <CardActions post={post} onLike={onLike} onSave={onSave} />
    </div>
  )
}

function PostCard({ post, onLike, onSave }: {
  post: Post
  onLike: (id: string) => void
  onSave: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const gradient = getSportGradient(post.sport_tag ?? post.activity_type)
  const isLong   = (post.content?.length ?? 0) > 150

  return (
    <div className="animate-fade-in-up bg-white rounded-3xl overflow-hidden shadow-sm">
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
        <Link href={`/dashboard/profile/${post.userId}`}>
          <Avatar name={post.userName} imageUrl={post.userAvatarUrl ?? null} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-black leading-none">{post.userName}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{post.created_at} · {post.userRegion}</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Curved block */}
      <div className="mt-3">
        <CurvedBlock post={post} gradient={gradient} />
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

      <CardActions post={post} onLike={onLike} onSave={onSave} />
    </div>
  )
}

function BuddySuggestionsRow({ buddies, onClose, onRequest }: {
  buddies: BuddySuggestion[]
  onClose: () => void
  onRequest: (id: string) => void
}) {
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
            <Link href={`/dashboard/profile/${buddy.id}`}>
              <Avatar name={buddy.name} imageUrl={buddy.avatarUrl ?? null} size="sm" />
            </Link>
            <div>
              <Link href={`/dashboard/profile/${buddy.id}`} className="text-xs font-bold text-black leading-tight hover:text-[#E87722] transition-colors">{buddy.name}</Link>
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
          className="mt-3 w-full block text-center py-2 rounded-xl text-xs font-bold border border-black/8 hover:bg-[#F5F0E8] transition-colors"
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

  const [profile,       setProfile]       = useState<UserProfile | null>(null)
  const [posts,         setPosts]         = useState<Post[]>([])
  const [tab,           setTab]           = useState<FeedTab>('buddies')
  const [loading,       setLoading]       = useState(true)
  const [loadingMore,   setLoadingMore]   = useState(false)
  const [hasMore,       setHasMore]       = useState(true)
  const [allSeen,       setAllSeen]       = useState(false)
  const [composerOpen,  setComposerOpen]  = useState(false)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [hiddenSuggestions, setHiddenSuggestions] = useState(false)
  const [buddyCount,    setBuddyCount]    = useState(0)
  const [requestedIds,  setRequestedIds]  = useState<Set<string>>(new Set())

  const sentinelRef = useRef<HTMLDivElement>(null)
  const pageRef     = useRef(0)
  const PAGE_SIZE   = 8

  // Load profile + initial posts
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { count: bc }] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, username, avatar_url, region')
          .eq('id', user.id)
          .single(),
        supabase.from('follow_requests')
          .select('*', { count: 'exact', head: true })
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .eq('status', 'accepted'),
      ])

      if (prof) setProfile({ ...prof, sport: null })
      setBuddyCount(bc ?? 0)

      // Try loading real posts, fallback to demo
      const { data: realPosts } = await supabase
        .from('posts')
        .select('id, user_id, content, sport_tag, activity_type, distance_km, duration_minutes, image_url, likes_count, created_at')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (realPosts && realPosts.length > 0) {
        const mapped: Post[] = realPosts.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          userName: 'Gebruiker',
          userRegion: '',
          content: p.content ?? '',
          sport_tag: p.sport_tag,
          activity_type: p.activity_type,
          distance_km: p.distance_km,
          duration_minutes: p.duration_minutes,
          image_url: p.image_url,
          likes_count: p.likes_count ?? 0,
          comments_count: 0,
          liked: false,
          saved: false,
          created_at: new Date(p.created_at).toLocaleDateString('nl-NL'),
        }))
        setPosts(mapped)
        setHasMore(realPosts.length === PAGE_SIZE)
      } else {
        // Demo fallback
        setPosts(DEMO_POSTS.slice(0, PAGE_SIZE))
        setHasMore(DEMO_POSTS.length > PAGE_SIZE)
      }

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

  // Infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || allSeen) return
    setLoadingMore(true)
    pageRef.current += 1

    await new Promise(r => setTimeout(r, 800)) // simulate network

    const start = pageRef.current * PAGE_SIZE
    const next  = DEMO_POSTS.slice(start, start + PAGE_SIZE)

    if (next.length === 0) {
      setAllSeen(true)
      setHasMore(false)
    } else {
      setPosts(prev => [...prev, ...next.map(p => ({ ...p, id: p.id + '_' + pageRef.current }))])
      if (start + PAGE_SIZE >= DEMO_POSTS.length) {
        setAllSeen(true)
        setHasMore(false)
      }
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, allSeen])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  // Tab change resets feed (demo: just shuffle order)
  function handleTabChange(t: FeedTab) {
    setTab(t)
    setAllSeen(false)
    setHasMore(true)
    pageRef.current = 0
    if (t === 'trending') {
      setPosts([...DEMO_POSTS].sort((a, b) => b.likes_count - a.likes_count))
    } else {
      setPosts([...DEMO_POSTS])
    }
  }

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

  function handleNewPost(content: string, sport: string) {
    const newPost: Post = {
      id: 'new_' + Date.now(),
      userId: profile?.id ?? 'me',
      userName: profile?.full_name ?? profile?.username ?? 'Jij',
      userRegion: profile?.region ?? '',
      content,
      sport_tag: sport || undefined,
      likes_count: 0,
      comments_count: 0,
      liked: false,
      saved: false,
      created_at: 'Nu',
    }
    setPosts(prev => [newPost, ...prev])
  }

  function handleRefreshFeed() {
    setNewPostsCount(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBuddyRequest(id: string) {
    setRequestedIds(prev => new Set(prev).add(id))
  }

  const displayName = profile?.full_name ?? profile?.username ?? 'Sporter'

  // Build feed items: inject buddy suggestions every 6 posts
  const feedItems: Array<{ type: 'post'; post: Post } | { type: 'suggestions' }> = []
  posts.forEach((post, i) => {
    feedItems.push({ type: 'post', post })
    if ((i + 1) % 6 === 0 && !hiddenSuggestions) {
      feedItems.push({ type: 'suggestions' })
    }
  })

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
      <NewPostsBanner count={newPostsCount} onRefresh={handleRefreshFeed} />
      <PostComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => handleNewPost('', '')}
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

          <FeedTabs active={tab} onChange={handleTabChange} />

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
                // Activity card for posts with activity data
                if (post.activity_type && (post.distance_km || post.duration_minutes)) {
                  return (
                    <ActivityCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onSave={handleSave}
                    />
                  )
                }
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onSave={handleSave}
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
