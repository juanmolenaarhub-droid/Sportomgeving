'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, MapPin, Music, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { CommentsSheet } from './CommentsSheet'

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
const CREAM = '#F5F0E8'

// ─── Avatar ────────────────────────────────────────────────────────────────────

function PostAvatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors   = ['#E87722', '#2A2420', '#11998e', '#6366F1', '#DB2777']
  const color    = colors[name.charCodeAt(0) % colors.length]

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ ...DM, fontSize: size <= 28 ? 9 : 13, fontWeight: 700, color: 'white' }}>{initials}</span>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function displayUsername(post: FeedPostData): string {
  if (post.userUsername) return `@${post.userUsername}`
  return `@${post.userName.toLowerCase().replace(/\s+/g, '')}`
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

export function FeedCardSkeleton() {
  return (
    <div style={{ position: 'relative' }}>
      {/* Tab skeleton */}
      <div style={{
        position: 'absolute', top: 0, left: 0, zIndex: 2,
        height: 42,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: CREAM, borderRadius: '16px 16px 0 0', padding: '0 14px', minWidth: 140,
      }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EDE7DD' }} />
        <div style={{ width: 80, height: 10, borderRadius: 6, background: '#EDE7DD' }} />
      </div>

      {/* Card body skeleton */}
      <div style={{ position: 'relative', zIndex: 1, background: '#FFFFFF', borderRadius: '0 20px 20px 20px', boxShadow: '0 4px 20px rgba(26,23,20,0.06)', padding: '42px 10px 14px' }}>
        <div style={{ aspectRatio: '4/5', borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(90deg, #EDE7DD 25%, #F5F0E8 50%, #EDE7DD 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ padding: '12px 6px 4px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE7DD', flexShrink: 0 }} />
            <div>
              <div style={{ width: 110, height: 12, borderRadius: 6, background: '#EDE7DD', marginBottom: 6 }} />
              <div style={{ width: 75, height: 10, borderRadius: 6, background: '#EDE7DD' }} />
            </div>
          </div>
          <div style={{ width: '80%', height: 11, borderRadius: 6, background: '#EDE7DD', marginBottom: 8 }} />
          <div style={{ width: '55%', height: 11, borderRadius: 6, background: '#EDE7DD' }} />
        </div>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  )
}

// ─── Main card ─────────────────────────────────────────────────────────────────

export function FeedCard({ post, onLikeToggle }: {
  post: FeedPostData
  onLikeToggle: (postId: string, newLiked: boolean, newCount: number) => void
}) {
  const supabase       = createClient()
  const [liking,       setLiking]       = useState(false)
  const [expanded,     setExpanded]     = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments_count)

  const hasMedia  = !!(post.media_url || post.thumbnail_url)
  const isVideo   = post.media_type === 'video'
  const sport     = post.sport_tag ?? post.type ?? null
  const caption   = post.content ?? ''
  const isLong    = caption.length > 120
  const musicText = post.music_title
    ? `${post.music_artist ?? ''} — ${post.music_title}`.trim()
    : (post.music ?? null)

  async function handleLike() {
    if (liking) return
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

  return (
    <div style={{ position: 'relative' }}>

      {/* ── TAB ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, zIndex: 2,
        height: 42, pointerEvents: 'auto',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: CREAM,
        borderRadius: '16px 16px 0 0',
        padding: '0 14px',
        minWidth: 110, maxWidth: 200,
      }}>
        <PostAvatar url={post.userAvatarUrl} name={post.userName} size={24} />
        <span style={{
          ...DM, fontSize: 12, fontWeight: 600, color: '#1A1714',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130,
        }}>
          {displayUsername(post)}
        </span>
      </div>

      {/* ── CARD BODY ─────────────────────────────────────────────────────── */}
      {/* Starts at y=0 with paddingTop:42 so white bg shows behind inverted corner */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: '#FFFFFF',
        borderRadius: '0 20px 20px 20px',
        boxShadow: '0 4px 20px rgba(26,23,20,0.08)',
        paddingTop: 42,
        padding: '42px 10px 14px',
      }}>

        {/* ── MEDIA ───────────────────────────────────────────────────── */}
        {hasMedia && (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/5' }}>

            {isVideo ? (
              <>
                {post.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,23,20,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play style={{ width: 20, height: 20, color: 'white', marginLeft: 2 }} />
                  </div>
                </div>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.media_url!} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}

            {/* Pills onderaan foto: locatie + sport */}
            {(post.userRegion || sport) && (
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', flexWrap: 'wrap', gap: 6, zIndex: 1 }}>
                {post.userRegion && (
                  <div style={{ ...DM, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 500, color: '#1A1714' }}>
                    <MapPin style={{ width: 10, height: 10, flexShrink: 0 }} />
                    {post.userRegion}
                  </div>
                )}
                {sport && (
                  <div style={{ ...DM, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 500, color: '#1A1714' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #1A1714', display: 'inline-block', flexShrink: 0 }} />
                    {sport.charAt(0).toUpperCase() + sport.slice(1).toLowerCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Text post zonder media */}
        {!hasMedia && (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '4/5', background: 'linear-gradient(135deg, #FAF6EE 0%, #E8E1D3 100%)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: 28 }}>
              <p style={{ ...SYNE, fontWeight: 800, fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.02em', color: '#1A1714', opacity: 0.85 }}>
                &ldquo;{caption.slice(0, 80)}{caption.length > 80 ? '…' : ''}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* ── META SECTIE ─────────────────────────────────────────────── */}
        <div style={{ padding: '12px 6px 4px' }}>

          {/* Auteur rij */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <PostAvatar url={post.userAvatarUrl} name={post.userName} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: '#1A1714', lineHeight: 1.2 }}>{post.userName}</p>
              <p style={{ ...DM, fontSize: 12, color: 'rgba(26,23,20,0.50)', lineHeight: 1.2, marginTop: 2 }}>{displayUsername(post)}</p>
            </div>
            <span style={{ ...DM, fontSize: 11, color: 'rgba(26,23,20,0.40)', flexShrink: 0 }}>{post.created_at}</span>
          </div>

          {/* Caption */}
          {caption && (
            <div style={{ marginBottom: 10 }}>
              <p style={{
                ...DM, fontSize: 14, color: '#1A1714', lineHeight: 1.55,
                display: expanded ? 'block' : '-webkit-box',
                WebkitLineClamp: expanded ? undefined : 3,
                WebkitBoxOrient: 'vertical',
                overflow: expanded ? 'visible' : 'hidden',
              }}>
                {caption}
              </p>
              {isLong && !expanded && (
                <button onClick={() => setExpanded(true)} style={{ ...DM, fontSize: 12, fontWeight: 600, color: 'rgba(26,23,20,0.45)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 2 }}>
                  meer lezen
                </button>
              )}
            </div>
          )}

          {/* Actie-rij */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: musicText ? 10 : 0 }}>
            <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <Heart style={{ width: 18, height: 18, color: post.liked ? '#E87722' : '#1A1714', fill: post.liked ? '#E87722' : 'none', transition: 'transform 150ms', transform: liking ? 'scale(1.3)' : 'scale(1)' }} />
              <span style={{ ...DM, fontSize: 12, fontWeight: 500, color: 'rgba(26,23,20,0.55)' }}>{post.likes_count}</span>
            </button>
            <button onClick={() => setShowComments(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <MessageCircle style={{ width: 18, height: 18, color: '#1A1714' }} />
              <span style={{ ...DM, fontSize: 12, fontWeight: 500, color: 'rgba(26,23,20,0.55)' }}>{commentCount}</span>
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: 'auto' }}>
              <Share2 style={{ width: 18, height: 18, color: '#1A1714' }} />
            </button>
          </div>

          {/* Muziek pill */}
          {musicText && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8E1D3', borderRadius: 999, padding: '6px 12px', maxWidth: 220, overflow: 'hidden' }}>
              <Music style={{ width: 12, height: 12, flexShrink: 0, color: '#1A1714' }} />
              <p style={{ ...DM, fontSize: 12, color: '#1A1714', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{musicText}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>

      {showComments && (
        <CommentsSheet
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCountChange={delta => setCommentCount(p => Math.max(0, p + delta))}
        />
      )}
    </div>
  )
}
