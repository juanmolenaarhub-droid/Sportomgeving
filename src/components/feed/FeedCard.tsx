'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Send, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CommentsSheet } from './CommentsSheet'
import { Avatar, getInitials } from '@/components/ui/Avatar'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type FeedPostData = {
  id: string
  userId: string
  userName: string
  userUsername: string | null
  userAvatarUrl: string | null
  userRegion: string | null
  content: string | null
  type: string | null
  sport_tag: string | null
  media_url: string | null
  media_type: string | null
  thumbnail_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  created_at_raw: string
  location: string | null
  music: string | null
  music_title: string | null
  music_artist: string | null
  distance_km: number | null
  duration_minutes: number | null
  activity_name: string | null
  liked: boolean
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }
const ORANGE = '#E87722'
const INK    = '#111111'

// ─── Sport color mapping ────────────────────────────────────────────────────────

const SPORT_COLORS: Record<string, string> = {
  tennis:     '#E87722',
  hardlopen:  '#E87722',
  fietsen:    '#1D9E75',
  wielrennen: '#1D9E75',
  zwemmen:    '#3A7AC4',
  gym:        '#7F77DD',
  fitness:    '#7F77DD',
  yoga:       '#1D9E75',
  voetbal:    '#E87722',
  padel:      '#5B4A8B',
  golf:       '#D4A87A',
  triathlon:  '#E87722',
  basketbal:  '#E87722',
  hockey:     '#1D9E75',
  boksen:     '#D4538C',
}

function getSportColor(sport: string | null): string {
  if (!sport) return INK
  return SPORT_COLORS[sport.toLowerCase()] ?? INK
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getFirstName(fullName: string): string {
  return fullName.trim().split(' ')[0]
}

function getMetric(post: FeedPostData): string | null {
  if (post.distance_km) return `${post.distance_km} km`
  if (post.duration_minutes) {
    const h = Math.floor(post.duration_minutes / 60)
    const m = post.duration_minutes % 60
    return h > 0 ? `${h}u ${m}m` : `${m} min`
  }
  return null
}

function getEyebrowText(post: FeedPostData): string {
  const sport    = (post.sport_tag ?? post.type ?? '').toUpperCase()
  const location = post.location ? post.location.split(',')[0].trim().toUpperCase() : ''
  const metric   = getMetric(post)
  if (location) return sport ? `${sport} · ${location}` : location
  if (metric)   return sport ? `${sport} · ${metric.toUpperCase()}` : metric.toUpperCase()
  return sport || 'POST'
}

function getTimeOfDay(rawDate: string): string {
  const hour = new Date(rawDate).getHours()
  if (hour <  9) return 'Ochtend'
  if (hour < 12) return 'Voormiddag'
  if (hour < 18) return 'Middag'
  if (hour < 22) return 'Avond'
  return 'Late'
}

function generateTitle(post: FeedPostData): string {
  const sport    = post.sport_tag ?? post.type ?? null
  const metric   = getMetric(post)
  const time     = getTimeOfDay(post.created_at_raw)
  const location = post.location ? post.location.split(',')[0].trim() : null

  if (post.activity_name) return post.activity_name
  if (location && sport)  return `${sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase()} in ${location}`
  if (metric && sport)    return `${metric} ${sport.toLowerCase()}`
  if (sport)              return `${time} ${sport.toLowerCase()}`
  if (post.content)       return post.content.slice(0, 50) + (post.content.length > 50 ? '…' : '')
  return 'Post'
}

// ─── Like handler (shared) ─────────────────────────────────────────────────────

async function toggleLike(
  supabase: ReturnType<typeof createClient>,
  post: FeedPostData,
  onLikeToggle: (id: string, liked: boolean, count: number) => void,
  setLiking: (v: boolean) => void,
) {
  setLiking(true)
  const newLiked = !post.liked
  onLikeToggle(post.id, newLiked, post.likes_count + (newLiked ? 1 : -1))
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) { setLiking(false); return }
  if (newLiked) {
    await supabase.from('post_likes').upsert({ post_id: post.id, user_id: uid })
  } else {
    await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', uid)
  }
  setLiking(false)
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

export function FeedCardSkeleton() {
  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ margin: '14px 14px 0', aspectRatio: '5/4', borderRadius: 14, background: 'linear-gradient(90deg, #EDE7DD 25%, #F5F0E8 50%, #EDE7DD 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '16px 16px' }}>
        <div style={{ width: 80, height: 9, borderRadius: 6, background: '#EDE7DD', marginBottom: 10 }} />
        <div style={{ width: '75%', height: 18, borderRadius: 6, background: '#EDE7DD', marginBottom: 6 }} />
        <div style={{ width: '50%', height: 18, borderRadius: 6, background: '#EDE7DD' }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

// ─── EditorialCard (default) ───────────────────────────────────────────────────

function EditorialCard({ post, onLikeToggle }: {
  post: FeedPostData
  onLikeToggle: (id: string, liked: boolean, count: number) => void
}) {
  const supabase = createClient()
  const router   = useRouter()
  const [liking,       setLiking]       = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count)

  const sport      = post.sport_tag ?? post.type ?? null
  const sportColor = getSportColor(sport)
  const eyebrow    = getEyebrowText(post)
  const title      = generateTitle(post)
  const metric     = getMetric(post)
  const hasMedia   = !!(post.media_url || post.thumbnail_url)
  const isVideo    = post.media_type === 'video'
  const firstName  = getFirstName(post.userName)
  const description = post.content

  function UserPill({ absolute }: { absolute?: boolean }) {
    const style: React.CSSProperties = absolute
      ? { position: 'absolute', top: 10, left: 10 }
      : {}
    return (
      <button
        onClick={() => router.push(`/dashboard/profile/${post.userId}`)}
        style={{
          ...style,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
          borderRadius: 999, padding: '4px 10px 4px 4px',
          border: 'none', cursor: 'pointer',
        }}
      >
        <Avatar initials={getInitials(post.userName)} imageUrl={post.userAvatarUrl} size="xs" />
        <span style={{ ...DM, fontSize: 11, fontWeight: 600, color: INK }}>{firstName}</span>
      </button>
    )
  }

  return (
    <article style={{ background: 'white', borderRadius: 20, overflow: 'hidden' }}>

      {/* Media */}
      {hasMedia ? (
        <div style={{ margin: '14px 14px 0', position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '5/4' }}>
          {isVideo ? (
            <>
              {post.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.thumbnail_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <button
                onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.20)', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 20, height: 20, color: 'white', marginLeft: 2 }} />
                </div>
              </button>
            </>
          ) : (
            <button onClick={() => router.push(`/dashboard/posts/${post.id}`)} style={{ display: 'block', position: 'absolute', inset: 0, border: 'none', padding: 0, cursor: 'pointer', width: '100%', height: '100%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.media_url!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          )}
          <UserPill absolute />
          {metric && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 10px' }}>
              <span style={{ ...DM, fontSize: 10, fontWeight: 500, color: 'white' }}>{metric}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ margin: '14px 14px 0', position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '5/4', background: '#1E2B2020' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: 24 }}>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 22, lineHeight: 1.1, color: INK, opacity: 0.85 }}>
              &ldquo;{(description ?? '').slice(0, 80)}{(description ?? '').length > 80 ? '…' : ''}&rdquo;
            </p>
          </div>
          <UserPill absolute />
        </div>
      )}

      {/* Content below media */}
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ ...DM, fontSize: 10, fontWeight: 600, color: ORANGE, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          {eyebrow}
        </p>
        <h2
          onClick={() => router.push(`/dashboard/posts/${post.id}`)}
          style={{ ...SYNE, fontWeight: 800, fontSize: 20, lineHeight: 1.15, color: INK, marginBottom: 6, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {title}
        </h2>
        {description && (
          <p style={{ ...DM, fontSize: 11, color: 'rgba(17,17,17,0.60)', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {sport && (
            <div style={{ display: 'inline-flex', alignItems: 'center', background: `${sportColor}18`, borderRadius: 999, padding: '3px 8px' }}>
              <span style={{ ...DM, fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: sportColor }}>
                {sport.toUpperCase()}
              </span>
            </div>
          )}
          <span style={{ ...DM, fontSize: 10, color: 'rgba(17,17,17,0.40)' }}>{post.created_at}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => toggleLike(supabase, post, onLikeToggle, setLiking)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Heart style={{ width: 18, height: 18, color: post.liked ? ORANGE : INK, fill: post.liked ? ORANGE : 'none', transition: 'transform 150ms', transform: liking ? 'scale(1.3)' : 'scale(1)' }} />
            <span style={{ ...DM, fontSize: 12, fontWeight: 600, color: INK }}>{post.likes_count}</span>
          </button>
          <button onClick={() => setShowComments(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <MessageCircle style={{ width: 18, height: 18, color: INK }} />
            <span style={{ ...DM, fontSize: 12, fontWeight: 600, color: INK }}>{commentCount}</span>
          </button>
          <button style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Send style={{ width: 17, height: 17, color: INK }} />
          </button>
        </div>
      </div>

      {showComments && (
        <CommentsSheet
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCountChange={delta => setCommentCount(p => Math.max(0, p + delta))}
        />
      )}
    </article>
  )
}

// ─── HeroCard (every 4th post) ─────────────────────────────────────────────────

function HeroCard({ post, onLikeToggle }: {
  post: FeedPostData
  onLikeToggle: (id: string, liked: boolean, count: number) => void
}) {
  const supabase = createClient()
  const router   = useRouter()
  const [liking,       setLiking]       = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count)

  const firstName  = getFirstName(post.userName)
  const eyebrow    = getEyebrowText(post)
  const title      = generateTitle(post)
  const metric     = getMetric(post)
  const hasMedia   = !!(post.media_url || post.thumbnail_url)
  const isVideo    = post.media_type === 'video'
  const description = post.content
  const sport      = post.sport_tag ?? post.type ?? null

  return (
    <article style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', background: '#1E2B20' }}>

      {/* Giant initials ornament */}
      <div style={{ position: 'absolute', right: -10, bottom: -20, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}>
        <span style={{ ...SYNE, fontWeight: 800, fontSize: 280, color: 'rgba(196,245,66,0.08)', lineHeight: 1 }}>
          {getInitials(post.userName)}
        </span>
      </div>

      <div style={{ position: 'relative', padding: 16 }}>

        {/* User pill */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => router.push(`/dashboard/profile/${post.userId}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '4px 12px 4px 4px', border: 'none', cursor: 'pointer' }}
          >
            <Avatar initials={getInitials(post.userName)} imageUrl={post.userAvatarUrl} size="sm" />
            <span style={{ ...DM, fontSize: 11, fontWeight: 700, color: INK }}>{firstName}</span>
          </button>
        </div>

        {/* Media */}
        {hasMedia && (
          <button
            onClick={() => router.push(`/dashboard/posts/${post.id}`)}
            style={{ display: 'block', width: '100%', position: 'relative', aspectRatio: '5/3', borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', marginBottom: 16 }}
          >
            {isVideo ? (
              <>
                {post.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play style={{ width: 18, height: 18, color: 'white', marginLeft: 2 }} />
                  </div>
                </div>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.media_url!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 6 }}>
              {sport && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '3px 8px' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />
                  <span style={{ ...DM, fontSize: 9, fontWeight: 600, color: 'white' }}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase()}
                  </span>
                </div>
              )}
              {metric && (
                <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '3px 8px' }}>
                  <span style={{ ...DM, fontSize: 9, fontWeight: 500, color: 'white' }}>{metric}</span>
                </div>
              )}
            </div>
          </button>
        )}

        {/* Eyebrow + title + description */}
        <p style={{ ...DM, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          {eyebrow}
        </p>
        <h2
          onClick={() => router.push(`/dashboard/posts/${post.id}`)}
          style={{ ...SYNE, fontWeight: 800, fontSize: 22, lineHeight: 1.15, color: 'white', marginBottom: 6, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {title}
        </h2>
        {description && (
          <p style={{ ...DM, fontSize: 11, color: 'rgba(255,255,255,0.80)', lineHeight: 1.5, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={() => toggleLike(supabase, post, onLikeToggle, setLiking)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Heart style={{ width: 18, height: 18, color: 'white', fill: post.liked ? 'white' : 'none', transition: 'transform 150ms', transform: liking ? 'scale(1.3)' : 'scale(1)' }} />
            <span style={{ ...SYNE, fontSize: 13, fontWeight: 700, color: 'white' }}>{post.likes_count}</span>
          </button>
          <button onClick={() => setShowComments(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <MessageCircle style={{ width: 18, height: 18, color: 'white' }} />
            <span style={{ ...SYNE, fontSize: 13, fontWeight: 700, color: 'white' }}>{commentCount}</span>
          </button>
          <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <Send style={{ width: 17, height: 17, color: 'white' }} />
          </button>
        </div>
      </div>

      {showComments && (
        <CommentsSheet
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCountChange={delta => setCommentCount(p => Math.max(0, p + delta))}
        />
      )}
    </article>
  )
}

// ─── FeedList ──────────────────────────────────────────────────────────────────

export function FeedList({ posts, onLikeToggle }: {
  posts: FeedPostData[]
  onLikeToggle: (id: string, liked: boolean, count: number) => void
}) {
  return (
    <>
      {posts.map((post, index) =>
        index % 4 === 0 ? (
          <HeroCard key={post.id} post={post} onLikeToggle={onLikeToggle} />
        ) : (
          <EditorialCard key={post.id} post={post} onLikeToggle={onLikeToggle} />
        )
      )}
    </>
  )
}

// ─── Legacy export (backward compat) ──────────────────────────────────────────

export function FeedCard({ post, onLikeToggle }: {
  post: FeedPostData
  onLikeToggle: (postId: string, newLiked: boolean, newCount: number) => void
}) {
  return <EditorialCard post={post} onLikeToggle={onLikeToggle} />
}
