'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import Link from 'next/link'
import {
  MapPin, Calendar, MessageCircle, UserPlus, Check, Lock, Clock,
  Send, X, ChevronDown, Camera, Pencil, Heart,
  Image as ImageIcon, Video as VideoIcon, Bookmark, Activity,
  ArrowLeft, ShieldCheck, List, Plus,
  CalendarDays, Users, LayoutGrid,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

// ── Types ─────────────────────────────────────────────────────────────────────

export type FollowStatus = 'none' | 'pending' | 'pending_received' | 'accepted'

export type MeetupStats = {
  meetupsHosted: number
  meetupsJoined: number
  meetupsAttended: number
  organizerRating: number | null
  organizerReviewCount: number
  createdAt: string
}

export type ProfileData = {
  id: string
  name: string
  username?: string
  region: string
  bio: string
  sports: { label: string; level: string }[]
  avatarUrl?: string
  bannerUrl?: string
  openFollow?: boolean
  isVerified?: boolean
  beschikbaarheid?: string[]
  createdAt?: string
  stats?: { volgers: number; volgend: number; posts: number; groepen: number }
  meetupStats?: MeetupStats
}

type Props = {
  profile: ProfileData
  followStatus: FollowStatus
  currentUserId: string
  isOwnProfile: boolean
}

type Tab = 'posts' | 'photos' | 'videos' | 'saved' | 'activities' | 'meetups' | 'about'

type Post = {
  id: string
  content: string | null
  sport: string | null
  type?: string | null
  created_at: string
  image_url?: string | null
  media_url?: string | null
  likes_count?: number
  activity_name?: string | null
  distance_km?: number | null
  duration_minutes?: number | null
  calories?: number | null
  activity_date?: string | null
}

type UserRow = { id: string; full_name: string | null; username: string | null; avatar_url: string | null }

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelBadge(level: string) {
  const l = level?.toLowerCase()
  if (l === 'gevorderd' || l === 'advanced')    return { label: 'Gevorderd', bg: '#111',     color: 'white'   }
  if (l === 'gemiddeld' || l === 'intermediate') return { label: 'Gemiddeld', bg: '#E87722', color: 'white'   }
  return { label: 'Beginner', bg: '#F3F4F6', color: '#6B7280' }
}

function formatMemberDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return n.toString()
}

const SPORT_GRADIENTS: Record<string, string> = {
  hardlopen: 'linear-gradient(145deg, #E87722, #C0392B)',
  fietsen:   'linear-gradient(145deg, #059669, #064E3B)',
  zwemmen:   'linear-gradient(145deg, #0284C7, #1E3A5F)',
  gym:       'linear-gradient(145deg, #292524, #111)',
  triathlon: 'linear-gradient(145deg, #6366F1, #4F46E5)',
  yoga:      'linear-gradient(145deg, #7C3AED, #4C1D95)',
  voetbal:   'linear-gradient(145deg, #16A34A, #14532D)',
  tennis:    'linear-gradient(145deg, #D97706, #92400E)',
  padel:     'linear-gradient(145deg, #0891B2, #164E63)',
  boksen:    'linear-gradient(145deg, #DC2626, #7F1D1D)',
  klimmen:   'linear-gradient(145deg, #65A30D, #365314)',
  default:   'linear-gradient(145deg, #374151, #111)',
}

function sportGradient(sport: string | null): string {
  return SPORT_GRADIENTS[sport?.toLowerCase() ?? ''] ?? SPORT_GRADIENTS.default
}

function formatPace(durationMinutes: number, distanceKm: number): string {
  if (!distanceKm || distanceKm <= 0) return '--'
  const total = (durationMinutes / distanceKm) * 60
  const m = Math.floor(total / 60)
  const s = Math.round(total % 60)
  return `${m}:${s.toString().padStart(2, '0')}/km`
}

function formatTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}u ${m}m` : `${m}m`
}

// ── Request modal ─────────────────────────────────────────────────────────────

function RequestModal({ name, toUserId, currentUserId, sport, onClose, onSent }: {
  name: string; toUserId: string; currentUserId: string
  sport: string | null; onClose: () => void; onSent: () => void
}) {
  const [message, setMessage] = useState('')
  const [isPending, start] = useTransition()
  const MAX = 300

  function handleSend() {
    start(async () => {
      const supabase = createClient()
      await supabase.from('follow_requests').upsert({
        from_user_id: currentUserId,
        to_user_id: toUserId,
        message: message.trim() || null,
        status: 'pending',
        sport,
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
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 15 }}>Stuur een buddy verzoek</p>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 mb-4">{name.split(' ')[0]} krijgt jouw verzoek en kan het accepteren of weigeren.</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX))}
            placeholder={`Hoi ${name.split(' ')[0]}, ik zou graag met je sporten...`}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E87722] resize-none transition-colors"
          />
          <div className="flex justify-end mt-1"><span className="text-xs text-gray-300">{message.length}/{MAX}</span></div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Annuleren</button>
          <button onClick={handleSend} disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-[#111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" />{isPending ? 'Verzenden...' : 'Verstuur'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stats modal (volgers / buddies list) ───────────────────────────────────────

function StatsModal({ title, profileId, onClose }: {
  title: 'Volgers' | 'Buddies'
  profileId: string
  onClose: () => void
}) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      let ids: string[] = []
      if (title === 'Volgers') {
        const { data } = await supabase
          .from('follow_requests')
          .select('from_user_id')
          .eq('to_user_id', profileId)
          .eq('status', 'accepted')
        ids = (data ?? []).map((r: { from_user_id: string }) => r.from_user_id)
      } else {
        const { data: a } = await supabase
          .from('follow_requests')
          .select('from_user_id')
          .eq('to_user_id', profileId)
          .eq('status', 'accepted')
        const { data: b } = await supabase
          .from('follow_requests')
          .select('to_user_id')
          .eq('from_user_id', profileId)
          .eq('status', 'accepted')
        const set = new Set([
          ...(a ?? []).map((r: { from_user_id: string }) => r.from_user_id),
          ...(b ?? []).map((r: { to_user_id: string }) => r.to_user_id),
        ])
        ids = [...set]
      }
      if (ids.length === 0) { setLoading(false); return }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', ids)
        .limit(100)
      setUsers((profiles as UserRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [profileId, title])

  const filtered = users.filter(u =>
    !search || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 15 }}>{title}</p>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoeken..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#E87722] transition-colors"
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="space-y-3 p-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-32" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">Geen resultaten</div>
          )}
          {!loading && filtered.map(u => (
            <Link
              key={u.id}
              href={`/dashboard/profile/${u.id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF7] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#F5F0E8] shrink-0 overflow-hidden flex items-center justify-center">
                {u.avatar_url
                  ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />
                  : <span style={{ ...SYNE, fontWeight: 900, fontSize: 14, color: '#E87722' }}>{(u.full_name ?? '?').charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{u.full_name ?? u.username ?? 'Onbekend'}</p>
                {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
              </div>
              <span className="text-xs text-[#E87722] font-semibold shrink-0">Bekijk →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sport Highlights ───────────────────────────────────────────────────────────

function HighlightsRow({ isOwnProfile, sports }: {
  isOwnProfile: boolean
  sports: { label: string; level: string }[]
}) {
  const autoHighlights = sports.map(s => ({ id: s.label, title: s.label, sport: s.label }))

  if (!isOwnProfile && autoHighlights.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-black/8 px-5 py-4 mb-4">
      <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {isOwnProfile && (
          <Link href="/dashboard/instellingen/profiel" className="flex flex-col items-center gap-1.5 shrink-0 group">
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-[#E87722] transition-colors"
              style={{ background: '#FAFAF7' }}
            >
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#E87722] transition-colors" />
            </div>
            <span className="text-[11px] text-gray-400 font-semibold text-center max-w-[72px] truncate">Nieuw</span>
          </Link>
        )}
        {autoHighlights.map(h => (
          <button key={h.id} className="flex flex-col items-center gap-1.5 shrink-0 group">
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center ring-2 ring-[#E87722] ring-offset-2"
              style={{ background: sportGradient(h.sport) }}
            >
              <span className="text-white text-lg font-black">{h.title.charAt(0)}</span>
            </div>
            <span className="text-[11px] font-semibold text-gray-700 text-center max-w-[72px] truncate">{h.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Posts ────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  activity:  { label: 'Activiteit', color: '#E87722', bg: '#FFF0E5' },
  meetup:    { label: 'Meetup',     color: '#3B82F6', bg: '#EFF6FF' },
  challenge: { label: 'Challenge',  color: '#F59E0B', bg: '#FFF7ED' },
  question:  { label: 'Vraag',      color: '#8B5CF6', bg: '#FAF5FF' },
  media:     { label: 'Foto',       color: '#16A34A', bg: '#F0FDF4' },
}

function PostsTab({ profileId, isLocked }: { profileId: string; isLocked: boolean }) {
  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (isLocked) { setLoading(false); return }
    createClient()
      .from('posts')
      .select('id, content, sport, type, created_at, image_url, media_url, likes_count')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(24)
      .then(({ data }) => { setPosts(data ?? []); setLoading(false) })
  }, [profileId, isLocked])

  if (isLocked) return <LockedTabContent />

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (posts.length === 0) return (
    <div className="text-center py-16 space-y-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <ImageIcon className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">Nog geen posts gedeeld</p>
    </div>
  )

  const img = (p: Post) => p.media_url ?? p.image_url

  return (
    <div>
      {/* View toggle */}
      <div className="flex justify-end mb-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className="w-8 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ background: viewMode === 'grid' ? 'white' : 'transparent' }}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className="w-8 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ background: viewMode === 'list' ? 'white' : 'transparent' }}
          >
            <List className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {posts.map(post => {
            const typeBadge = post.type ? TYPE_BADGE[post.type] : null
            return (
              <div key={post.id} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-pointer">
                {img(post) ? (
                  <img src={img(post)!} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                ) : (
                  <div className="w-full h-full flex flex-col p-3 justify-between" style={{ background: post.type === 'activity' ? sportGradient(post.sport) : '#F5F0E8' }}>
                    {post.sport && (
                      <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full self-start">{post.sport}</span>
                    )}
                    <p className="text-xs text-white/90 line-clamp-4 font-medium">{post.content}</p>
                  </div>
                )}
                {typeBadge && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeBadge.bg, color: typeBadge.color }}>
                    {typeBadge.label}
                  </span>
                )}
                {(post.likes_count ?? 0) > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Heart className="w-2.5 h-2.5" /> {post.likes_count}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const typeBadge = post.type ? TYPE_BADGE[post.type] : null
            return (
              <div key={post.id} className="flex gap-3 bg-[#FAFAF7] rounded-xl p-3">
                {img(post) && (
                  <img src={img(post)!} className="w-16 h-16 rounded-lg object-cover shrink-0" alt="" />
                )}
                {!img(post) && post.type === 'activity' && (
                  <div className="w-16 h-16 rounded-lg shrink-0" style={{ background: sportGradient(post.sport) }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {typeBadge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: typeBadge.bg, color: typeBadge.color }}>
                        {typeBadge.label}
                      </span>
                    )}
                    {post.sport && <span className="text-[11px] text-gray-400">{post.sport}</span>}
                  </div>
                  {post.content && <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(post.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Foto's ───────────────────────────────────────────────────────────────

function PhotosTab({ profileId, isLocked }: { profileId: string; isLocked: boolean }) {
  const [photos, setPhotos]   = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (isLocked) { setLoading(false); return }
    createClient()
      .from('posts')
      .select('id, content, sport, created_at, image_url, media_url')
      .eq('user_id', profileId)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setPhotos((data ?? []).filter((p: Post) => p.media_url ?? p.image_url)); setLoading(false) })
  }, [profileId, isLocked])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight' && lightbox !== null) setLightbox(i => Math.min((i ?? 0) + 1, photos.length - 1))
      if (e.key === 'ArrowLeft'  && lightbox !== null) setLightbox(i => Math.max((i ?? 0) - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, photos.length])

  if (isLocked) return <LockedTabContent />

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (photos.length === 0) return (
    <div className="text-center py-16 space-y-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <ImageIcon className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">Nog geen foto's gedeeld</p>
    </div>
  )

  const getUrl = (p: Post) => p.media_url ?? p.image_url ?? ''

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <div key={photo.id} onClick={() => setLightbox(i)}
            className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer group">
            <img src={getUrl(photo)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
          </div>
        ))}
      </div>
      {lightbox !== null && (
        <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
          {lightbox > 0 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(l => (l ?? 1) - 1) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 text-xl">
              ‹
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setLightbox(l => (l ?? 0) + 1) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 text-xl">
            ›
            </button>
          )}
          <img
            src={getUrl(photos[lightbox])}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
            alt=""
          />
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            {lightbox + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}

// ── Tab: Video's ──────────────────────────────────────────────────────────────

function VideosTab({ isLocked }: { isLocked: boolean }) {
  if (isLocked) return <LockedTabContent />
  return (
    <div className="text-center py-16 space-y-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <VideoIcon className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">Nog geen video's gedeeld</p>
    </div>
  )
}

// ── Tab: Opgeslagen ───────────────────────────────────────────────────────────

function SavedTab({ currentUserId }: { currentUserId: string }) {
  const [saved, setSaved]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient()
      .from('saved_content')
      .select('id, post_id, saved_at, posts(id, content, sport, type, media_url, image_url, user_id, profiles:user_id(full_name, username, avatar_url))')
      .eq('user_id', currentUserId)
      .order('saved_at', { ascending: false })
      .limit(24)
      .then(({ data }) => { setSaved(data ?? []); setLoading(false) })
  }, [currentUserId])

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (saved.length === 0) return (
    <div className="text-center py-16 space-y-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <Bookmark className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">Nog niets opgeslagen</p>
      <p className="text-xs text-gray-400 max-w-xs mx-auto">
        Sla posts op via het bookmark icoon.
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {saved.map((s: any) => {
        const post = s.posts
        const imgUrl = post?.media_url ?? post?.image_url
        const author = post?.profiles
        return (
          <div key={s.id} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-pointer">
            {imgUrl ? (
              <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
            ) : (
              <div className="w-full h-full flex flex-col p-3 justify-between" style={{ background: post?.type === 'activity' ? sportGradient(post?.sport) : '#F5F0E8' }}>
                <p className="text-xs text-gray-600 line-clamp-4">{post?.content}</p>
              </div>
            )}
            {/* Author overlay */}
            {author && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
                <div className="w-4 h-4 rounded-full bg-[#E87722] overflow-hidden shrink-0">
                  {author.avatar_url && <img src={author.avatar_url} className="w-full h-full object-cover" alt="" />}
                </div>
                <span className="text-[10px] text-white font-semibold truncate max-w-[80px]">
                  {author.full_name ?? author.username}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Activiteiten ─────────────────────────────────────────────────────────

type Period = 'all' | 'year' | 'month'

function ActivitiesTab({ profileId, isLocked }: { profileId: string; isLocked: boolean }) {
  const [items, setItems]     = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState<Period>('all')

  const loadActivities = useCallback(async (p: Period) => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('posts')
      .select('id, content, sport, type, created_at, activity_name, distance_km, duration_minutes, calories, activity_date')
      .eq('user_id', profileId)
      .eq('type', 'activity')
      .order('activity_date', { ascending: false })

    if (p === 'year') {
      const y = new Date(); y.setMonth(0); y.setDate(1)
      q = q.gte('activity_date', y.toISOString())
    } else if (p === 'month') {
      const m = new Date(); m.setDate(1)
      q = q.gte('activity_date', m.toISOString())
    }
    const { data } = await q.limit(50)
    setItems(data ?? [])
    setLoading(false)
  }, [profileId])

  useEffect(() => {
    if (isLocked) { setLoading(false); return }
    loadActivities(period)
  }, [isLocked, period, loadActivities])

  if (isLocked) return <LockedTabContent />

  // Cumulative stats
  const totalDist = items.reduce((s, a) => s + (a.distance_km ?? 0), 0)
  const totalMin  = items.reduce((s, a) => s + (a.duration_minutes ?? 0), 0)
  const totalActs = items.length

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex gap-2">
        {([['all','Altijd'],['year','Dit jaar'],['month','Deze maand']] as [Period,string][]).map(([v,l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            className="px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
            style={{
              background: period === v ? '#E87722' : '#F5F2EE',
              color:      period === v ? 'white'   : '#6B7280',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Cumulative stats */}
      {totalActs > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Activiteiten', value: totalActs.toString() },
            { label: 'Totaal km',    value: totalDist > 0 ? `${totalDist.toFixed(1)} km` : '--' },
            { label: 'Totaal tijd',  value: totalMin > 0 ? formatTime(totalMin) : '--' },
          ].map(s => (
            <div key={s.label} className="bg-[#FAFAF7] rounded-xl p-3 text-center">
              <p style={{ ...SYNE, fontWeight: 900, fontSize: 18, color: '#E87722' }}>{s.value}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activity cards */}
      {items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Activity className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-700">Geen activiteiten {period !== 'all' ? 'in deze periode' : ''}</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-3">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />
          {items.map(a => {
            const date = a.activity_date ?? a.created_at
            const grad = sportGradient(a.sport)
            const pace = a.distance_km && a.duration_minutes
              ? formatPace(a.duration_minutes, a.distance_km) : null
            const bigStat = a.distance_km != null
              ? { value: a.distance_km.toFixed(1), unit: 'km' }
              : a.duration_minutes != null
              ? { value: formatTime(a.duration_minutes), unit: '' }
              : null

            return (
              <div key={a.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-6 w-4 h-4 rounded-full border-2 border-white top-4 shrink-0" style={{ background: '#E87722' }} />

                {/* Date label */}
                <p className="text-[11px] text-gray-400 font-semibold mb-1.5">
                  {new Date(date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>

                {/* Activity card */}
                <div className="rounded-2xl overflow-hidden flex h-[100px] shadow-sm">
                  {/* Gradient block */}
                  <div className="w-[100px] shrink-0 flex flex-col justify-between p-3" style={{ background: grad }}>
                    <span className="text-[10px] font-bold text-white/80" style={SYNE}>{a.sport ?? 'Activiteit'}</span>
                    {bigStat && (
                      <div>
                        <span className="text-white font-black leading-none" style={{ fontSize: 24, ...SYNE }}>
                          {bigStat.value}
                        </span>
                        {bigStat.unit && (
                          <span className="text-white/70 text-[11px] font-bold ml-1">{bigStat.unit}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 bg-white px-3 py-2.5 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {a.activity_name ?? a.sport ?? 'Activiteit'}
                      </p>
                      {a.content && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{a.content}</p>
                      )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {a.duration_minutes != null && (
                        <span className="text-[11px] text-gray-500">
                          <span className="font-bold text-gray-700">{formatTime(a.duration_minutes)}</span> tijd
                        </span>
                      )}
                      {pace && (
                        <span className="text-[11px] text-gray-500">
                          <span className="font-bold text-gray-700">{pace}</span>
                        </span>
                      )}
                      {a.calories != null && (
                        <span className="text-[11px] text-gray-500">
                          <span className="font-bold text-gray-700">{a.calories}</span> kcal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Meetups ──────────────────────────────────────────────────────────────

type MeetupSubTab = 'organized' | 'joined'

type MeetupRow = {
  id: string
  name: string
  sport: string | null
  date: string | null
  start_time: string | null
  location_name: string | null
  max_participants: number | null
  skill_level: string | null
  status: string | null
  organizer_id: string
}

function MeetupsTab({ profileId, isLocked }: { profileId: string; isLocked: boolean }) {
  const [subTab, setSubTab]           = useState<MeetupSubTab>('organized')
  const [organized, setOrganized]     = useState<MeetupRow[]>([])
  const [joined, setJoined]           = useState<MeetupRow[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (isLocked) { setLoading(false); return }
    async function load() {
      const supabase = createClient()
      const [orgRes, joinRes] = await Promise.all([
        supabase
          .from('meetups')
          .select('id, name, sport, date, start_time, location_name, max_participants, skill_level, status, organizer_id')
          .eq('organizer_id', profileId)
          .order('date', { ascending: false })
          .limit(20),
        supabase
          .from('meetup_invites')
          .select('meetups(id, name, sport, date, start_time, location_name, max_participants, skill_level, status, organizer_id)')
          .eq('user_id', profileId)
          .eq('status', 'accepted')
          .limit(20),
      ])
      setOrganized(orgRes.data ?? [])
      setJoined((joinRes.data ?? []).map((r: any) => r.meetups).filter(Boolean))
      setLoading(false)
    }
    load()
  }, [profileId, isLocked])

  if (isLocked) return <LockedTabContent />
  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  const list = subTab === 'organized' ? organized : joined

  function statusBadge(m: MeetupRow) {
    if (!m.date) return null
    const isPast = new Date(m.date) < new Date()
    if (isPast) return { label: 'Afgelopen', bg: '#F3F4F6', color: '#6B7280' }
    return { label: 'Gepland', bg: '#FFF0E5', color: '#E87722' }
  }

  return (
    <div>
      {/* Sub-tab toggle */}
      <div className="flex gap-2 mb-4">
        {([['organized', 'Georganiseerd'], ['joined', 'Deelgenomen']] as [MeetupSubTab, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)}
            className="flex-1 py-2 rounded-full text-[13px] font-bold transition-all"
            style={{
              background: subTab === v ? '#E87722' : '#F5F2EE',
              color:      subTab === v ? 'white'   : '#6B7280',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <CalendarDays className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-700">
            {subTab === 'organized' ? 'Geen meetups georganiseerd' : 'Geen meetups deelgenomen'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(m => {
            const badge = statusBadge(m)
            const meetupDate = m.date
              ? new Date(m.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
              : null
            return (
              <Link
                key={m.id}
                href={`/dashboard/meetup/${m.id}`}
                className="block bg-[#FAFAF7] rounded-xl p-4 border border-[#F0EDE8] hover:border-[#E87722]/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {m.sport && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                          {m.sport}
                        </span>
                      )}
                      {badge && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                    {meetupDate && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <CalendarDays className="w-3 h-3" />
                        {meetupDate}{m.start_time && ` · ${m.start_time}`}
                      </p>
                    )}
                    {m.location_name && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {m.location_name}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 text-right">
                    {m.skill_level && <p className="font-semibold">{m.skill_level}</p>}
                    {m.max_participants && (
                      <p className="flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> Max {m.max_participants}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Over ─────────────────────────────────────────────────────────────────

function AboutTab({ profile }: { profile: ProfileData }) {
  const BESCH_META: Record<string, { label: string; sub: string }> = {
    ochtend: { label: 'Ochtend', sub: '06–12' },
    middag:  { label: 'Middag',  sub: '12–17' },
    avond:   { label: 'Avond',   sub: '17–22' },
    weekend: { label: 'Weekend', sub: 'Za & Zo' },
  }

  return (
    <div className="space-y-5">
      {profile.bio && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Bio</p>
          <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {profile.sports.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Sporten</p>
          <div className="space-y-2">
            {profile.sports.map(s => {
              const badge = levelBadge(s.level)
              return (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{s.label}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {profile.beschikbaarheid && profile.beschikbaarheid.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Beschikbaarheid</p>
          <div className="flex flex-wrap gap-2">
            {profile.beschikbaarheid.map(slot => {
              const meta = BESCH_META[slot]
              if (!meta) return null
              return (
                <span key={slot} className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: '#FFF5EE', color: '#E87722', border: '1px solid #FDDCBD' }}>
                  {meta.label} <span className="font-normal" style={{ color: '#FDBA74' }}>{meta.sub}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-gray-100">
        {profile.region && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />{profile.region}
          </div>
        )}
        {profile.createdAt && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />Lid sinds {formatMemberDate(profile.createdAt)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Locked tab placeholder ────────────────────────────────────────────────────

function LockedTabContent() {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <Lock className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-bold text-gray-700">Inhoud vergrendeld</p>
      <p className="text-xs text-gray-400 max-w-xs mx-auto">Word buddy om dit te zien.</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileContent({ profile, followStatus: initialStatus, currentUserId, isOwnProfile }: Props) {
  const [followStatus, setFollowStatus] = useState<FollowStatus>(initialStatus)
  const [showRequest, setShowRequest]   = useState(false)
  const [activeTab, setActiveTab]       = useState<Tab>('posts')
  const [bioExpanded, setBioExpanded]   = useState(false)
  const [statsModal, setStatsModal]     = useState<'Volgers' | 'Buddies' | null>(null)

  const sport     = profile.sports?.[0]?.label ?? null
  const firstName = profile.name.split(' ')[0]
  const isAccepted = followStatus === 'accepted'
  const isLocked   = !isOwnProfile && !isAccepted && !profile.openFollow
  const stats      = profile.stats ?? { volgers: 0, volgend: 0, posts: 0, groepen: 0 }
  const bioLong    = (profile.bio?.length ?? 0) > 150

  // Track profile view
  useEffect(() => {
    if (isOwnProfile) return
    createClient()
      .from('profile_views')
      .insert({ profile_user_id: profile.id, viewer_user_id: currentUserId })
      .then(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'posts',      label: 'Posts'        },
    { key: 'photos',     label: "Foto's"       },
    { key: 'activities', label: 'Activiteiten' },
    { key: 'meetups',    label: 'Meetups'      },
    ...(isOwnProfile ? [{ key: 'saved' as Tab, label: 'Opgeslagen' }] : []),
    { key: 'about',      label: 'Over'         },
  ]

  function handleFollowClick() {
    if (followStatus === 'accepted' || followStatus === 'pending') return
    if (profile.openFollow) {
      createClient().from('follow_requests').upsert({
        from_user_id: currentUserId,
        to_user_id: profile.id,
        status: 'accepted',
      }, { onConflict: 'from_user_id,to_user_id' }).then(() => setFollowStatus('accepted'))
    } else {
      setShowRequest(true)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Back link */}
      {!isOwnProfile && (
        <div className="mb-4">
          <Link href="/dashboard/find" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> Terug
          </Link>
        </div>
      )}

      {/* ── HEADER CARD ── */}
      <div className="bg-white rounded-2xl overflow-hidden border border-black/8 mb-4">

        {/* Banner */}
        <div className="relative h-[140px] sm:h-[200px] bg-gray-100 overflow-hidden">
          {profile.bannerUrl
            ? <img src={profile.bannerUrl} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #F5F0E8 0%, #e0d8cc 100%)' }} />
          }
          {isOwnProfile && (
            <Link href="/dashboard/instellingen/profiel"
              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all group">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <Camera className="w-3.5 h-3.5" /> Banner wijzigen
              </div>
            </Link>
          )}
        </div>

        <div className="px-5 pb-5">
          {/* Avatar + action buttons row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              {/* Avatar */}
              <div className="-mt-12 mb-3">
                {isOwnProfile ? (
                  <Link href="/dashboard/instellingen/profiel" className="block relative group w-fit">
                    <div className="w-24 h-24 rounded-full ring-4 ring-white overflow-hidden bg-[#F5F0E8] flex items-center justify-center">
                      {profile.avatarUrl
                        ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
                        : <span style={{ ...SYNE, fontWeight: 900, fontSize: 28, color: '#E87722' }}>{profile.name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ) : (
                  <div className="w-24 h-24 rounded-full ring-4 ring-white overflow-hidden bg-[#F5F0E8] flex items-center justify-center">
                    {profile.avatarUrl
                      ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
                      : <span style={{ ...SYNE, fontWeight: 900, fontSize: 28, color: '#E87722' }}>{profile.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                )}
              </div>

              {/* Name + username */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: '#111', lineHeight: 1.2 }}>{profile.name}</h1>
                {profile.isVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#E87722] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              {profile.username && <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>}
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
                {profile.region && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />{profile.region}
                  </span>
                )}
                {profile.createdAt && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />Lid sinds {formatMemberDate(profile.createdAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0 pt-1">
              {isOwnProfile ? (
                <Link href="/dashboard/instellingen/profiel"
                  className="flex items-center gap-1.5 border border-black/15 text-gray-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                  <Pencil className="w-3.5 h-3.5" /> Bewerken
                </Link>
              ) : (
                <>
                  {isAccepted && (
                    <Link href="/dashboard/messages"
                      className="flex items-center gap-1.5 bg-[#111] text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#333] transition-colors whitespace-nowrap">
                      <MessageCircle className="w-3.5 h-3.5" /> Bericht
                    </Link>
                  )}
                  <button
                    onClick={handleFollowClick}
                    disabled={followStatus === 'pending'}
                    className="flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                    style={{
                      background: isAccepted ? 'transparent' : followStatus === 'pending' ? '#F3F4F6' : '#E87722',
                      color:      isAccepted ? '#22C55E' : followStatus === 'pending' ? '#9CA3AF' : 'white',
                      border:     isAccepted ? '1.5px solid #22C55E' : 'none',
                    }}
                  >
                    {isAccepted
                      ? <><Check className="w-3.5 h-3.5" /> Buddies</>
                      : followStatus === 'pending'
                      ? <><Clock className="w-3.5 h-3.5" /> Verzonden</>
                      : followStatus === 'pending_received'
                      ? <><UserPlus className="w-3.5 h-3.5" /> Accepteer</>
                      : <><UserPlus className="w-3.5 h-3.5" /> Buddy verzoek</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sport badges */}
          {profile.sports.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {profile.sports.map(s => {
                const badge = levelBadge(s.level)
                return (
                  <div key={s.label} className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full"
                    style={{ border: '1.5px solid #FDDCBD', background: '#FFF5EE' }}>
                    <span className="text-sm font-bold text-[#E87722]">{s.label}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Stats bar — clickable */}
          <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: 'Posts',       value: isLocked ? null : stats.posts,   onClick: undefined },
              { label: 'Volgers',     value: isLocked ? null : stats.volgers,  onClick: () => setStatsModal('Volgers') },
              { label: 'Buddies',     value: isLocked ? null : stats.volgers,  onClick: () => setStatsModal('Buddies') },
              { label: 'Activiteiten', value: isLocked ? null : stats.posts,   onClick: undefined },
            ].map(s => (
              <button
                key={s.label}
                onClick={s.onClick}
                disabled={!s.onClick}
                className="text-center py-1 rounded-xl transition-colors"
                style={{ cursor: s.onClick ? 'pointer' : 'default' }}
              >
                {s.value === null
                  ? <Lock className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                  : <p style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#E87722' }}>{formatNumber(s.value)}</p>
                }
                <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Bio */}
          {profile.bio && !isLocked && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm text-gray-600 leading-relaxed flex-1 ${!bioExpanded && bioLong ? 'line-clamp-3' : ''}`}>
                  {profile.bio}
                </p>
                {isOwnProfile && (
                  <Link href="/dashboard/instellingen/profiel" className="text-gray-400 hover:text-[#E87722] transition-colors shrink-0 mt-0.5">
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              {bioLong && (
                <button onClick={() => setBioExpanded(v => !v)}
                  className="flex items-center gap-1 text-xs text-[#E87722] font-semibold mt-1.5 hover:underline">
                  {bioExpanded
                    ? <><ChevronDown className="w-3.5 h-3.5 rotate-180" /> Minder</>
                    : <><ChevronDown className="w-3.5 h-3.5" /> Meer lezen</>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── SPORT HIGHLIGHTS ── */}
      {profile.sports.length > 0 && (
        <HighlightsRow
          isOwnProfile={isOwnProfile}
          sports={profile.sports}
        />
      )}

      {/* ── LOCK NOTICE ── */}
      {isLocked && (
        <div className="bg-white rounded-2xl border border-black/8 p-6 mb-4 text-center space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: '#111' }}>
              {followStatus === 'pending' ? 'Verzoek verzonden' : `Stuur ${firstName} een buddy verzoek`}
            </p>
            <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              {followStatus === 'pending'
                ? `Wacht tot ${firstName} jouw verzoek accepteert.`
                : `Stuur een buddy verzoek om het volledige profiel te zien.`
              }
            </p>
          </div>
          {followStatus === 'none' && (
            <button onClick={() => setShowRequest(true)}
              className="px-6 py-2.5 bg-[#E87722] text-white font-bold text-sm rounded-xl hover:bg-[#d06a1a] transition-colors">
              Buddy verzoek sturen
            </button>
          )}
        </div>
      )}

      {/* ── TABS ── */}
      {(!isLocked || isOwnProfile) && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          {/* Tab nav */}
          <div className="flex overflow-x-auto border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="relative flex-shrink-0 px-5 py-4 text-sm font-semibold transition-colors whitespace-nowrap"
                style={{ color: activeTab === tab.key ? '#111' : '#9CA3AF' }}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E87722]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'posts'       && <PostsTab       profileId={profile.id} isLocked={isLocked} />}
            {activeTab === 'photos'      && <PhotosTab      profileId={profile.id} isLocked={isLocked} />}
            {activeTab === 'activities'  && <ActivitiesTab  profileId={profile.id} isLocked={isLocked} />}
            {activeTab === 'meetups'     && <MeetupsTab     profileId={profile.id} isLocked={isLocked} />}
            {activeTab === 'saved'       && isOwnProfile && <SavedTab currentUserId={currentUserId} />}
            {activeTab === 'about'       && <AboutTab       profile={profile} />}
          </div>
        </div>
      )}

      {/* Modals */}
      {showRequest && (
        <RequestModal
          name={profile.name}
          toUserId={profile.id}
          currentUserId={currentUserId}
          sport={sport}
          onClose={() => setShowRequest(false)}
          onSent={() => { setFollowStatus('pending'); setShowRequest(false) }}
        />
      )}

      {statsModal && (
        <StatsModal
          title={statsModal}
          profileId={profile.id}
          onClose={() => setStatsModal(null)}
        />
      )}
    </div>
  )
}
