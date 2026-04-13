'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  MapPin, Calendar, MessageCircle, UserPlus, Check, Lock, Clock,
  Send, X, ChevronDown, Camera, Pencil, Heart,
  Image as ImageIcon, Video as VideoIcon, Bookmark, Activity,
  Info, ArrowLeft, ShieldCheck,
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

type Tab = 'posts' | 'photos' | 'videos' | 'saved' | 'activities' | 'about'

type Post = {
  id: string
  content: string | null
  sport: string | null
  created_at: string
  image_url: string | null
  likes_count?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelBadge(level: string) {
  const l = level?.toLowerCase()
  if (l === 'gevorderd' || l === 'advanced')   return { label: 'Gevorderd', bg: '#111',     color: 'white'   }
  if (l === 'gemiddeld' || l === 'intermediate') return { label: 'Gemiddeld', bg: '#E87722', color: 'white'   }
  return { label: 'Beginner', bg: '#F3F4F6', color: '#6B7280' }
}

function formatMemberDate(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
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

// ── Tab: Posts ────────────────────────────────────────────────────────────────

function PostsTab({ profileId, isLocked }: { profileId: string; isLocked: boolean }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLocked) { setLoading(false); return }
    createClient()
      .from('posts')
      .select('id, content, sport, created_at, image_url, likes_count')
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
      <Link href="/dashboard/feed" className="text-xs text-[#E87722] font-semibold hover:underline">Eerste post delen</Link>
    </div>
  )

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {posts.map(post => (
        <div key={post.id} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-pointer">
          {post.image_url ? (
            <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
          ) : (
            <div className="w-full h-full flex flex-col p-3 justify-between" style={{ background: '#F5F0E8' }}>
              {post.sport && (
                <span className="text-[10px] font-bold text-[#E87722] bg-white/80 px-2 py-0.5 rounded-full self-start">{post.sport}</span>
              )}
              <p className="text-xs text-gray-600 line-clamp-4 font-medium">{post.content}</p>
            </div>
          )}
          {post.sport && post.image_url && (
            <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-[#E87722] px-2 py-0.5 rounded-full">{post.sport}</span>
          )}
          {(post.likes_count ?? 0) > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Heart className="w-2.5 h-2.5" /> {post.likes_count}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab: Foto's ───────────────────────────────────────────────────────────────

function PhotosTab({ profileId, isLocked }: { profileId: string; isLocked: boolean }) {
  const [photos, setPhotos] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (isLocked) { setLoading(false); return }
    createClient()
      .from('posts')
      .select('id, content, sport, created_at, image_url')
      .eq('user_id', profileId)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setPhotos((data ?? []).filter((p: Post) => p.image_url)); setLoading(false) })
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

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <div key={photo.id} onClick={() => setLightbox(i)}
            className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer group">
            <img src={photo.image_url!} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
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
            src={photos[lightbox].image_url!}
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

function SavedTab() {
  return (
    <div className="text-center py-16 space-y-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <Bookmark className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">Nog niets opgeslagen</p>
      <p className="text-xs text-gray-400 max-w-xs mx-auto">
        Sla foto's en video's op via het bookmark icoon op posts van anderen.
      </p>
    </div>
  )
}

// ── Tab: Activiteiten ─────────────────────────────────────────────────────────

function ActivitiesTab({ profileId, isLocked }: { profileId: string; isLocked: boolean }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLocked) { setLoading(false); return }
    createClient()
      .from('activity_log')
      .select('id, event_type, metadata, created_at')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setItems(data ?? []); setLoading(false) })
  }, [profileId, isLocked])

  if (isLocked) return <LockedTabContent />

  const EVENT_LABEL: Record<string, string> = {
    post_created:     'Post gedeeld',
    meetup_created:   'Meetup aangemaakt',
    meetup_joined:    'Meetup gejoined',
    match_requested:  'Buddy verzoek verstuurd',
    sport_updated:    'Sport bijgewerkt',
    profile_updated:  'Profiel bijgewerkt',
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (items.length === 0) return (
    <div className="text-center py-16 space-y-3">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
        <Activity className="w-5 h-5 text-gray-300" />
      </div>
      <p className="text-sm font-bold text-gray-700">Nog geen activiteiten</p>
      <p className="text-xs text-gray-400">Deel je eerste training of maak een meetup aan.</p>
    </div>
  )

  return (
    <div className="relative pl-6 space-y-3">
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />
      {items.map(a => (
        <div key={a.id} className="relative flex items-start gap-3">
          <div className="absolute -left-6 w-4 h-4 bg-[#E87722] rounded-full border-2 border-white top-1 shrink-0" />
          <div className="bg-white rounded-xl border border-gray-100 p-3 flex-1">
            <p className="text-sm font-semibold text-gray-700">{EVENT_LABEL[a.event_type] ?? a.event_type.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(a.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      ))}
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
    <div className="space-y-4">
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
      <p className="text-xs text-gray-400 max-w-xs mx-auto">
        Word buddy om dit te zien.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileContent({ profile, followStatus: initialStatus, currentUserId, isOwnProfile }: Props) {
  const [followStatus, setFollowStatus] = useState<FollowStatus>(initialStatus)
  const [showRequest, setShowRequest]   = useState(false)
  const [activeTab, setActiveTab]       = useState<Tab>('posts')
  const [bioExpanded, setBioExpanded]   = useState(false)

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

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'posts',      label: 'Posts',      icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { key: 'photos',     label: "Foto's",     icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { key: 'videos',     label: "Video's",    icon: <VideoIcon className="w-3.5 h-3.5" /> },
    ...(isOwnProfile ? [{ key: 'saved' as Tab, label: 'Opgeslagen', icon: <Bookmark className="w-3.5 h-3.5" /> }] : []),
    { key: 'activities', label: 'Activiteiten', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'about',      label: 'Over',         icon: <Info className="w-3.5 h-3.5" /> },
  ]

  function handleFollowClick() {
    if (followStatus === 'accepted' || followStatus === 'pending') return
    if (profile.openFollow) {
      const supabase = createClient()
      supabase.from('follow_requests').upsert({
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
          {/* Avatar + name row */}
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
              {profile.username && (
                <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
              )}
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
            <div className="flex items-center gap-2 shrink-0 pt-1">
              {isOwnProfile ? (
                <Link href="/dashboard/instellingen/profiel"
                  className="flex items-center gap-1.5 border border-black/15 text-gray-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Bewerken
                </Link>
              ) : (
                <>
                  {isAccepted && (
                    <Link href="/dashboard/messages"
                      className="flex items-center gap-1.5 bg-[#111] text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#333] transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> Bericht
                    </Link>
                  )}
                  <button
                    onClick={handleFollowClick}
                    disabled={followStatus === 'pending'}
                    className="flex items-center gap-1.5 font-bold text-sm px-4 py-2 rounded-xl transition-colors"
                    style={{
                      background: isAccepted ? 'transparent' : followStatus === 'pending' ? '#F3F4F6' : '#E87722',
                      color:      isAccepted ? '#22C55E'    : followStatus === 'pending' ? '#9CA3AF' : 'white',
                      border:     isAccepted ? '1.5px solid #22C55E' : 'none',
                      cursor:     followStatus === 'pending' ? 'default' : 'pointer',
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

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: 'Volgers',      value: isLocked ? null : stats.volgers },
              { label: 'Volgend',      value: isLocked ? null : stats.volgend },
              { label: 'Buddies',      value: isLocked ? null : stats.volgers },
              { label: 'Activiteiten', value: isLocked ? null : stats.posts   },
            ].map(s => (
              <div key={s.label} className="text-center">
                {s.value === null
                  ? <Lock className="w-4 h-4 text-gray-300 mx-auto mb-1" />
                  : <p style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#E87722' }}>{s.value}</p>
                }
                <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
              </div>
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
                ? `Wacht tot ${firstName} jouw verzoek accepteert om posts, foto's en activiteiten te zien.`
                : `Stuur een buddy verzoek om het volledige profiel van ${firstName} te zien.`
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
            {activeTab === 'posts'      && <PostsTab      profileId={profile.id} isLocked={isLocked} />}
            {activeTab === 'photos'     && <PhotosTab     profileId={profile.id} isLocked={isLocked} />}
            {activeTab === 'videos'     && <VideosTab     isLocked={isLocked} />}
            {activeTab === 'saved'      && isOwnProfile && <SavedTab />}
            {activeTab === 'activities' && <ActivitiesTab profileId={profile.id} isLocked={isLocked} />}
            {activeTab === 'about'      && <AboutTab      profile={profile} />}
          </div>
        </div>
      )}

      {/* Request modal */}
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
    </div>
  )
}
