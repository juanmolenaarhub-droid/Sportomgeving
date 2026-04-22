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

const BONE   = '#F4F1E8'
const FOREST = '#1E2B20'
const LIME   = '#C4F542'
const DISPLAY: React.CSSProperties = { fontFamily: 'var(--font-display)' }
const BODY:    React.CSSProperties = { fontFamily: 'var(--font-body)' }

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
  return 'Late avond'
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

// ─── Like handler ──────────────────────────────────────────────────────────────

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
    <div style={{ background: BONE, borderRadius: 4, border: `1px solid ${FOREST}`, overflow: 'hidden' }}>
      <div style={{ aspectRatio: '5/4', background: 'linear-gradient(90deg, #E5E1D8 25%, #F4F1E8 50%, #E5E1D8 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ width: 80, height: 9, borderRadius: 4, background: '#E5E1D8', marginBottom: 10 }} />
        <div style={{ width: '75%', height: 22, borderRadius: 4, background: '#E5E1D8', marginBottom: 6 }} />
        <div style={{ width: '50%', height: 22, borderRadius: 4, background: '#E5E1D8' }} />
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
  const supabase    = createClient()
  const router      = useRouter()
  const [liking,       setLiking]       = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count)

  const eyebrow     = getEyebrowText(post)
  const title       = generateTitle(post)
  const metric      = getMetric(post)
  const hasMedia    = !!(post.media_url || post.thumbnail_url)
  const isVideo     = post.media_type === 'video'
  const firstName   = getFirstName(post.userName)
  const description = post.content

  function UserPill() {
    return (
      <button
        onClick={() => router.push(`/dashboard/profile/${post.userId}`)}
        style={{
          position: 'absolute', top: 10, left: 10,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: FOREST, borderRadius: 4, padding: '4px 10px 4px 4px',
          border: 'none', cursor: 'pointer',
        }}
      >
        <Avatar initials={getInitials(post.userName)} imageUrl={post.userAvatarUrl} size="xs" />
        <span style={{ ...DISPLAY, fontSize: 10, fontWeight: 900, color: LIME, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {firstName}
        </span>
      </button>
    )
  }

  return (
    <article style={{ background: BONE, borderRadius: 4, border: `1px solid ${FOREST}`, overflow: 'hidden' }}>

      {/* Media */}
      {hasMedia ? (
        <div style={{ position: 'relative', aspectRatio: '5/4', overflow: 'hidden' }}>
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
                <div style={{ width: 52, height: 52, borderRadius: 4, background: FOREST, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play style={{ width: 20, height: 20, color: LIME, marginLeft: 2 }} />
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push(`/dashboard/posts/${post.id}`)}
              style={{ display: 'block', position: 'absolute', inset: 0, border: 'none', padding: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.media_url!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          )}
          <UserPill />
          {metric && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(30,43,32,0.50)', borderRadius: 4, padding: '4px 10px' }}>
              <span style={{ ...BODY, fontSize: 10, fontWeight: 500, color: 'white' }}>{metric}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', aspectRatio: '5/4', overflow: 'hidden', background: 'rgba(30,43,32,0.06)' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: 24 }}>
            <p style={{ ...DISPLAY, fontWeight: 900, fontSize: 22, lineHeight: 1.1, color: FOREST, opacity: 0.65, textTransform: 'uppercase' }}>
              &ldquo;{(description ?? '').slice(0, 80)}{(description ?? '').length > 80 ? '…' : ''}&rdquo;
            </p>
          </div>
          <UserPill />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        <p style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: LIME, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          {eyebrow}
        </p>
        <h2
          onClick={() => router.push(`/dashboard/posts/${post.id}`)}
          style={{ ...DISPLAY, fontWeight: 900, fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.01em', textTransform: 'uppercase', color: FOREST, marginBottom: 6, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {title}
        </h2>
        {description && (
          <p style={{ ...BODY, fontSize: 12, color: 'rgba(30,43,32,0.70)', lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>
        )}
        <span style={{ ...BODY, fontSize: 10, color: 'rgba(30,43,32,0.40)', marginBottom: 14, display: 'block' }}>
          {post.created_at}
        </span>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button
              onClick={() => toggleLike(supabase, post, onLikeToggle, setLiking)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <Heart style={{ width: 18, height: 18, color: LIME, fill: post.liked ? LIME : 'none', transition: 'transform 150ms', transform: liking ? 'scale(1.3)' : 'scale(1)' }} />
              <span style={{ ...BODY, fontSize: 12, fontWeight: 600, color: FOREST }}>{post.likes_count}</span>
            </button>
            <button
              onClick={() => setShowComments(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <MessageCircle style={{ width: 18, height: 18, color: FOREST }} strokeWidth={1.75} />
              <span style={{ ...BODY, fontSize: 12, fontWeight: 600, color: FOREST }}>{commentCount}</span>
            </button>
            <button style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <Send style={{ width: 17, height: 17, color: FOREST }} strokeWidth={1.75} />
            </button>
          </div>
          <button
            onClick={() => router.push(`/dashboard/profile/${post.userId}`)}
            style={{ ...DISPLAY, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', background: FOREST, color: LIME, borderRadius: 4, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
          >
            +VOLG
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
  const supabase    = createClient()
  const router      = useRouter()
  const [liking,       setLiking]       = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count)

  const firstName   = getFirstName(post.userName)
  const eyebrow     = getEyebrowText(post)
  const title       = generateTitle(post)
  const metric      = getMetric(post)
  const hasMedia    = !!(post.media_url || post.thumbnail_url)
  const isVideo     = post.media_type === 'video'
  const description = post.content
  const sport       = post.sport_tag ?? post.type ?? null

  return (
    <article style={{ borderRadius: 4, overflow: 'hidden', position: 'relative', background: FOREST }}>

      {/* Giant initials ornament */}
      <div style={{ position: 'absolute', right: -10, bottom: -20, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}>
        <span style={{ ...DISPLAY, fontWeight: 900, fontSize: 240, color: 'rgba(196,245,66,0.10)', lineHeight: 1 }}>
          {getInitials(post.userName)}
        </span>
      </div>

      <div style={{ position: 'relative', padding: 16 }}>

        {/* User pill */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => router.push(`/dashboard/profile/${post.userId}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: BONE, borderRadius: 4, padding: '4px 12px 4px 4px', border: 'none', cursor: 'pointer' }}
          >
            <Avatar initials={getInitials(post.userName)} imageUrl={post.userAvatarUrl} size="sm" />
            <span style={{ ...BODY, fontSize: 11, fontWeight: 700, color: FOREST }}>{firstName}</span>
          </button>
        </div>

        {/* Media */}
        {hasMedia && (
          <button
            onClick={() => router.push(`/dashboard/posts/${post.id}`)}
            style={{ display: 'block', width: '100%', position: 'relative', aspectRatio: '5/3', borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', marginBottom: 16 }}
          >
            {isVideo ? (
              <>
                {post.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 4, background: 'rgba(196,245,66,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play style={{ width: 18, height: 18, color: LIME, marginLeft: 2 }} />
                  </div>
                </div>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.media_url!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {(sport || metric) && (
              <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 6 }}>
                {sport && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(30,43,32,0.65)', backdropFilter: 'blur(8px)', borderRadius: 4, padding: '3px 8px' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: LIME }} />
                    <span style={{ ...BODY, fontSize: 9, fontWeight: 600, color: 'white' }}>
                      {sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase()}
                    </span>
                  </div>
                )}
                {metric && (
                  <div style={{ background: 'rgba(30,43,32,0.65)', backdropFilter: 'blur(8px)', borderRadius: 4, padding: '3px 8px' }}>
                    <span style={{ ...BODY, fontSize: 9, fontWeight: 500, color: 'white' }}>{metric}</span>
                  </div>
                )}
              </div>
            )}
          </button>
        )}

        {/* Eyebrow */}
        <p style={{ ...DISPLAY, fontSize: 9, fontWeight: 900, color: LIME, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
          {eyebrow}
        </p>

        {/* Title */}
        <h2
          onClick={() => router.push(`/dashboard/posts/${post.id}`)}
          style={{ ...DISPLAY, fontWeight: 900, fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.01em', textTransform: 'uppercase', color: BONE, marginBottom: 6, cursor: 'pointer', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p style={{ ...BODY, fontSize: 12, color: 'rgba(244,241,232,0.75)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button
              onClick={() => toggleLike(supabase, post, onLikeToggle, setLiking)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <Heart style={{ width: 18, height: 18, color: LIME, fill: post.liked ? LIME : 'none', transition: 'transform 150ms', transform: liking ? 'scale(1.3)' : 'scale(1)' }} />
              <span style={{ ...BODY, fontSize: 12, fontWeight: 600, color: 'white' }}>{post.likes_count}</span>
            </button>
            <button
              onClick={() => setShowComments(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <MessageCircle style={{ width: 18, height: 18, color: 'white' }} strokeWidth={1.75} />
              <span style={{ ...BODY, fontSize: 12, fontWeight: 600, color: 'white' }}>{commentCount}</span>
            </button>
            <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <Send style={{ width: 17, height: 17, color: 'white' }} strokeWidth={1.75} />
            </button>
          </div>
          <button
            onClick={() => router.push(`/dashboard/profile/${post.userId}`)}
            style={{ ...DISPLAY, fontSize: 10, fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', background: LIME, color: FOREST, borderRadius: 4, padding: '6px 12px', border: 'none', cursor: 'pointer' }}
          >
            +VOLG
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
