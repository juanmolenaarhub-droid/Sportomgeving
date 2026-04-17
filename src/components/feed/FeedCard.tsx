'use client'

import { useState } from 'react'
import {
  Heart, MessageCircle, Share2, MapPin, Music,
  Play, Volume2,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
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
  created_at: string        // al geformatteerd: "2u geleden"
  created_at_raw: string    // ISO string voor cursor
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function heroTitle(post: FeedPostData): string {
  if (post.activity_name) return post.activity_name
  if (!post.content) return post.sport_tag ?? 'Training'
  const firstLine = post.content.split('\n')[0].trim()
  return firstLine.length > 50 ? firstLine.slice(0, 48) + '…' : firstLine
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

export function FeedCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(26,23,20,0.06)',
        margin: '0',
      }}
    >
      {/* Hero */}
      <div
        style={{
          aspectRatio: '4/5',
          background: 'linear-gradient(90deg, #EDE7DD 25%, #F5F0E8 50%, #EDE7DD 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      {/* Meta */}
      <div style={{ background: '#FAF6EE', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE7DD' }} />
          <div>
            <div style={{ width: 100, height: 12, borderRadius: 6, background: '#EDE7DD', marginBottom: 6 }} />
            <div style={{ width: 70, height: 10, borderRadius: 6, background: '#EDE7DD' }} />
          </div>
        </div>
        <div style={{ width: '80%', height: 12, borderRadius: 6, background: '#EDE7DD', marginBottom: 8 }} />
        <div style={{ width: '60%', height: 12, borderRadius: 6, background: '#EDE7DD' }} />
      </div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

// ─── Main card ─────────────────────────────────────────────────────────────────

export function FeedCard({ post, onLikeToggle }: {
  post: FeedPostData
  onLikeToggle: (postId: string, newLiked: boolean, newCount: number) => void
}) {
  const supabase = createClient()
  const [liking, setLiking] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const hasMedia  = !!(post.media_url || post.thumbnail_url)
  const isVideo   = post.media_type === 'video'
  const sport     = (post.sport_tag ?? post.type ?? '').toUpperCase()
  const title     = heroTitle(post)
  const caption   = post.content ?? ''
  const isLong    = caption.length > 120
  const musicText = post.music_title
    ? `${post.music_artist ?? 'Artiest'} — ${post.music_title}`
    : (post.music ?? null)

  async function handleLike() {
    if (liking) return
    setLiking(true)
    const newLiked = !post.liked
    const newCount = post.likes_count + (newLiked ? 1 : -1)

    // Optimistic update
    onLikeToggle(post.id, newLiked, newCount)

    if (newLiked) {
      await supabase.from('post_likes').upsert({ post_id: post.id, user_id: (await supabase.auth.getUser()).data.user?.id ?? '' })
    } else {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (uid) await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', uid)
    }
    setLiking(false)
  }

  return (
    <div
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(26,23,20,0.06)',
      }}
    >
      {/* ── DEEL A — Hero ────────────────────────────────────────────────── */}
      <div style={{ aspectRatio: '4/5', position: 'relative', background: '#E8E1D3' }}>

        {/* Achtergrond */}
        {hasMedia ? (
          isVideo ? (
            // Video: thumbnail met play-overlay
            <>
              {post.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.thumbnail_url}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: '#1A1714' }} />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(26,23,20,0.25)',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play style={{ width: 20, height: 20, color: 'white', marginLeft: 2 }} />
                </div>
              </div>
            </>
          ) : (
            // Foto
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url!}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )
        ) : (
          // Geen media — gradient met quote-tekst
          <>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #FAF6EE 0%, #E8E1D3 100%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              padding: '24px',
            }}>
              <p style={{
                ...SYNE,
                fontWeight: 800,
                fontSize: 28,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: '#1A1714',
                opacity: 0.9,
              }}>
                &ldquo;{caption.slice(0, 60)}{caption.length > 60 ? '…' : ''}&rdquo;
              </p>
            </div>
          </>
        )}

        {/* Gradient overlay over foto voor tekst leesbaarheid */}
        {hasMedia && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(26,23,20,0.0) 40%, rgba(26,23,20,0.65) 100%)',
          }} />
        )}

        {/* TOP-LEFT badges */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <PillBadge>{post.created_at}</PillBadge>
          {post.userRegion && (
            <PillBadge>
              <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
              {post.userRegion}
            </PillBadge>
          )}
        </div>

        {/* BOTTOM-LEFT: sport eyebrow + titel + subtitle */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16, right: 16,
        }}>
          {sport && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: hasMedia ? 'rgba(255,255,255,0.75)' : 'rgba(26,23,20,0.65)',
              marginBottom: 4,
            }}>
              {sport}
            </p>
          )}
          <p style={{
            ...SYNE,
            fontWeight: 800,
            fontSize: 22,
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            color: hasMedia ? '#FFFFFF' : '#1A1714',
            marginBottom: 4,
          }}>
            {title}
          </p>
          {post.distance_km && (
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: hasMedia ? 'rgba(255,255,255,0.75)' : 'rgba(26,23,20,0.55)',
            }}>
              {post.distance_km} km
              {post.duration_minutes ? ` · ${Math.floor(post.duration_minutes / 60)}:${String(post.duration_minutes % 60).padStart(2, '0')}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* ── DEEL B — Meta & Acties ────────────────────────────────────────── */}
      <div style={{ background: '#FAF6EE', padding: '16px' }}>

        {/* Auteur rij */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar name={post.userName} imageUrl={post.userAvatarUrl} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: '#1A1714',
              lineHeight: 1.2,
            }}>
              {post.userName}
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: 'rgba(26,23,20,0.55)',
            }}>
              {post.userUsername ? `@${post.userUsername}` : 'buddy'}
            </p>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: 'rgba(26,23,20,0.45)',
            flexShrink: 0,
          }}>
            {post.created_at}
          </p>
        </div>

        {/* Caption */}
        {caption && (
          <div style={{ marginBottom: 12 }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: '#1A1714',
              lineHeight: 1.55,
              display: expanded ? 'block' : '-webkit-box',
              WebkitLineClamp: expanded ? undefined : 2,
              WebkitBoxOrient: 'vertical',
              overflow: expanded ? 'visible' : 'hidden',
            }}>
              {caption}
            </p>
            {isLong && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(26,23,20,0.55)',
                  marginTop: 2,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                meer lezen
              </button>
            )}
          </div>
        )}

        {/* Actie-iconen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: musicText || post.location ? 12 : 0 }}>
          <button
            onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            }}
          >
            <Heart
              style={{
                width: 18, height: 18,
                color: post.liked ? '#E87722' : '#1A1714',
                fill: post.liked ? '#E87722' : 'none',
                transition: 'transform 150ms',
                transform: liking ? 'scale(1.3)' : 'scale(1)',
              }}
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: 'rgba(26,23,20,0.6)' }}>
              {post.likes_count}
            </span>
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <MessageCircle style={{ width: 18, height: 18, color: '#1A1714' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: 'rgba(26,23,20,0.6)' }}>
              {post.comments_count}
            </span>
          </button>

          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginLeft: 'auto' }}>
            <Share2 style={{ width: 18, height: 18, color: '#1A1714' }} />
          </button>
        </div>

        {/* Extras: muziek + locatie */}
        {(musicText || post.location) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {musicText && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#E8E1D3', borderRadius: 999,
                padding: '6px 12px',
                maxWidth: 180,
                overflow: 'hidden',
              }}>
                <Music style={{ width: 12, height: 12, flexShrink: 0, color: '#1A1714' }} />
                <div style={{ overflow: 'hidden' }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: '#1A1714',
                    whiteSpace: 'nowrap',
                    animation: 'marquee 12s linear infinite',
                  }}>
                    {musicText}
                  </p>
                </div>
              </div>
            )}
            {post.location && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#E8E1D3', borderRadius: 999,
                padding: '6px 12px',
              }}>
                <MapPin style={{ width: 12, height: 12, color: '#1A1714' }} />
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#1A1714' }}>
                  {post.location}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

// ─── Helper: pill-badge ──────────────────────────────────────────────────────

function PillBadge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'rgba(245,240,232,0.95)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: 999,
      padding: '6px 12px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 12,
      fontWeight: 500,
      color: '#1A1714',
      width: 'fit-content',
    }}>
      {children}
    </div>
  )
}

// Suppress unused import warning for Volume2 (reserved for future audio indicator)
void Volume2
