'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, MapPin, Music, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase'

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

// ─── Kleine avatar met initialen-fallback ──────────────────────────────────────

function MiniAvatar({ url, name }: { url: string | null; name: string }) {
  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors   = ['#E87722','#2A2420','#11998e','#6366F1','#DB2777']
  const color    = colors[name.charCodeAt(0) % colors.length]

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ ...DM, fontSize: 9, fontWeight: 700, color: 'white' }}>{initials}</span>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function cardTitle(post: FeedPostData): string {
  if (post.activity_name) return post.activity_name
  if (!post.content) return post.sport_tag ?? 'Training'
  const first = post.content.split('\n')[0].trim()
  return first.length > 52 ? first.slice(0, 50) + '…' : first
}

function displayUsername(post: FeedPostData): string {
  if (post.userUsername) return `@${post.userUsername}`
  return `@${post.userName.toLowerCase().replace(/\s+/g, '')}`
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

export function FeedCardSkeleton() {
  return (
    <div style={{ position: 'relative', paddingTop: 40 }}>
      {/* Tab skeleton */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 140, height: 40,
        background: CREAM,
        borderRadius: '14px 14px 0 0',
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
      }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EDE7DD' }} />
        <div style={{ width: 80, height: 10, borderRadius: 6, background: '#EDE7DD' }} />
      </div>
      <div style={{ position: 'absolute', top: 20, left: 140, width: 20, height: 20, background: 'radial-gradient(circle at 0% 100%, transparent 19px, #F5F0E8 20px)' }} />

      {/* Card body skeleton */}
      <div style={{ borderRadius: '0 20px 20px 20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,23,20,0.06)' }}>
        <div style={{
          aspectRatio: '4/5',
          background: 'linear-gradient(90deg, #EDE7DD 25%, #F5F0E8 50%, #EDE7DD 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
        <div style={{ background: '#FAF6EE', padding: 16 }}>
          <div style={{ width: '80%', height: 12, borderRadius: 6, background: '#EDE7DD', marginBottom: 8 }} />
          <div style={{ width: '55%', height: 12, borderRadius: 6, background: '#EDE7DD' }} />
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; }}`}</style>
    </div>
  )
}

// ─── Main card ─────────────────────────────────────────────────────────────────

export function FeedCard({ post, onLikeToggle }: {
  post: FeedPostData
  onLikeToggle: (postId: string, newLiked: boolean, newCount: number) => void
}) {
  const supabase   = createClient()
  const [liking,   setLiking]   = useState(false)
  const [expanded, setExpanded] = useState(false)

  const hasMedia = !!(post.media_url || post.thumbnail_url)
  const isVideo  = post.media_type === 'video'
  const sport    = (post.sport_tag ?? post.type ?? '').toUpperCase()
  const title    = cardTitle(post)
  const caption  = post.content ?? ''
  const isLong   = caption.length > 120
  const musicText = post.music_title
    ? `${post.music_artist ?? ''} — ${post.music_title}`.trim()
    : (post.music ?? null)
  const onDark = hasMedia

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
    <div style={{ position: 'relative', paddingTop: 40 }}>

      {/* ── TAB — profielfoto + @username ────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 40,
        display: 'flex', alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        {/* Tab content */}
        <div style={{
          background: CREAM,
          borderRadius: '14px 14px 0 0',
          padding: '0 12px',
          height: 40,
          display: 'flex', alignItems: 'center', gap: 8,
          minWidth: 120, maxWidth: 200,
          flexShrink: 0,
          pointerEvents: 'auto',
        }}>
          <MiniAvatar url={post.userAvatarUrl} name={post.userName} />
          <span style={{
            ...DM, fontSize: 12, fontWeight: 600, color: '#1A1714',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 130,
          }}>
            {displayUsername(post)}
          </span>
        </div>

        {/* Concave corner — radial-gradient trick */}
        <div style={{
          width: 20, height: 20, flexShrink: 0,
          background: 'radial-gradient(circle at 0% 100%, transparent 19px, #F5F0E8 20px)',
        }} />
      </div>

      {/* ── CARD BODY ────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: '0 20px 20px 20px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(26,23,20,0.06)',
      }}>

        {/* ── MEDIA HERO (4:5) ─────────────────────────────────────────── */}
        <div style={{ aspectRatio: '4/5', position: 'relative', background: '#1A1714' }}>

          {/* Achtergrond */}
          {hasMedia ? (
            isVideo ? (
              <>
                {post.thumbnail_url
                  ? <img src={post.thumbnail_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ position: 'absolute', inset: 0, background: '#1A1714' }} />
                }
                {/* Play overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,23,20,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play style={{ width: 20, height: 20, color: 'white', marginLeft: 2 }} />
                  </div>
                </div>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.media_url!} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )
          ) : (
            /* Geen media: gradient met quote */
            <>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #FAF6EE 0%, #E8E1D3 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: 28 }}>
                <p style={{ ...SYNE, fontWeight: 800, fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.02em', color: '#1A1714', opacity: 0.88 }}>
                  &ldquo;{caption.slice(0, 60)}{caption.length > 60 ? '…' : ''}&rdquo;
                </p>
              </div>
            </>
          )}

          {/* Gradient overlay voor leesbaarheid */}
          {hasMedia && (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.60) 100%)' }} />
          )}

          {/* TIJD BADGE — rechts boven (glass) */}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <div style={{
              ...DM,
              background: 'rgba(245,240,232,0.92)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 999,
              padding: '5px 11px',
              fontSize: 12, fontWeight: 500, color: '#1A1714',
            }}>
              {post.created_at}
            </div>
          </div>

          {/* LOCATIE BADGE — links boven (glass), alleen als aanwezig */}
          {post.userRegion && (
            <div style={{ position: 'absolute', top: 12, left: 12 }}>
              <div style={{
                ...DM,
                background: 'rgba(245,240,232,0.92)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: 999,
                padding: '5px 11px',
                fontSize: 12, fontWeight: 500, color: '#1A1714',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
                {post.userRegion}
              </div>
            </div>
          )}

          {/* SPORT EYEBROW + TITEL — links onder */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            {sport && (
              <p style={{
                ...DM, fontSize: 10, fontWeight: 500,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: onDark ? 'rgba(255,255,255,0.70)' : 'rgba(26,23,20,0.60)',
                marginBottom: 4,
              }}>
                {sport}
              </p>
            )}
            <p style={{
              ...SYNE, fontWeight: 800, fontSize: 22, lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: onDark ? '#FFFFFF' : '#1A1714',
            }}>
              {title}
            </p>
            {post.distance_km && (
              <p style={{ ...DM, fontSize: 13, marginTop: 3, color: onDark ? 'rgba(255,255,255,0.70)' : 'rgba(26,23,20,0.55)' }}>
                {post.distance_km} km{post.duration_minutes ? ` · ${Math.floor(post.duration_minutes / 60)}:${String(post.duration_minutes % 60).padStart(2, '0')}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── META SECTIE ──────────────────────────────────────────────── */}
        <div style={{ background: '#FAF6EE', padding: '14px 16px 16px' }}>

          {/* Caption */}
          {caption && (
            <div style={{ marginBottom: 12 }}>
              <p style={{
                ...DM, fontSize: 14, color: '#1A1714', lineHeight: 1.55,
                display: expanded ? 'block' : '-webkit-box',
                WebkitLineClamp: expanded ? undefined : 2,
                WebkitBoxOrient: 'vertical',
                overflow: expanded ? 'visible' : 'hidden',
              }}>
                {caption}
              </p>
              {isLong && !expanded && (
                <button onClick={() => setExpanded(true)} style={{ ...DM, fontSize: 12, fontWeight: 600, color: 'rgba(26,23,20,0.50)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 2 }}>
                  meer lezen
                </button>
              )}
            </div>
          )}

          {/* Actie-iconen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: (musicText || post.location) ? 12 : 0 }}>
            <button onClick={handleLike} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <Heart style={{ width: 18, height: 18, color: post.liked ? '#E87722' : '#1A1714', fill: post.liked ? '#E87722' : 'none', transition: 'transform 150ms', transform: liking ? 'scale(1.3)' : 'scale(1)' }} />
              <span style={{ ...DM, fontSize: 12, fontWeight: 500, color: 'rgba(26,23,20,0.55)' }}>{post.likes_count}</span>
            </button>

            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <MessageCircle style={{ width: 18, height: 18, color: '#1A1714' }} />
              <span style={{ ...DM, fontSize: 12, fontWeight: 500, color: 'rgba(26,23,20,0.55)' }}>{post.comments_count}</span>
            </button>

            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: 'auto' }}>
              <Share2 style={{ width: 18, height: 18, color: '#1A1714' }} />
            </button>
          </div>

          {/* Muziek + locatie pills */}
          {(musicText || post.location) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {musicText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E8E1D3', borderRadius: 999, padding: '6px 12px', maxWidth: 180, overflow: 'hidden' }}>
                  <Music style={{ width: 12, height: 12, flexShrink: 0, color: '#1A1714' }} />
                  <p style={{ ...DM, fontSize: 12, color: '#1A1714', whiteSpace: 'nowrap', animation: 'marquee 12s linear infinite' }}>{musicText}</p>
                </div>
              )}
              {post.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E8E1D3', borderRadius: 999, padding: '6px 12px' }}>
                  <MapPin style={{ width: 12, height: 12, color: '#1A1714' }} />
                  <p style={{ ...DM, fontSize: 12, color: '#1A1714' }}>{post.location}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  )
}
