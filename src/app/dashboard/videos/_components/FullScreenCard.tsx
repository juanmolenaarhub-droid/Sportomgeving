'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Heart, MessageCircle, Send, Bookmark, Plus, Play,
  MapPin, Trophy, Activity, Bike, Waves, Dumbbell,
  Flower2, Zap, Volume2, VolumeX,
} from 'lucide-react'
import type { PlayPost } from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

// ─── Sport icon mapping ────────────────────────────────────────────────────────

const SPORT_ICONS: Record<string, React.ElementType> = {
  Tennis:    Trophy,
  Hardlopen: Activity,
  Fietsen:   Bike,
  Zwemmen:   Waves,
  Gym:       Dumbbell,
  Yoga:      Flower2,
  Voetbal:   Trophy,
  Futsal:    Trophy,
  Triathlon: Zap,
  Boksen:    Dumbbell,
  Padel:     Trophy,
  Klimmen:   Activity,
}

function SportIcon({ sport, size = 12 }: { sport: string; size?: number }) {
  const Icon = SPORT_ICONS[sport] ?? Trophy
  return <Icon size={size} color="white" strokeWidth={2} />
}

// ─── Mini avatar ──────────────────────────────────────────────────────────────

function MiniAvatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#E87722',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: size * 0.45, fontWeight: 700, color: 'white', lineHeight: 1 }}>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  post: PlayPost
  isActive: boolean
  isMuted: boolean
  onMuteToggle: () => void
  onNextPost?: () => void
  onPrevPost?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FullScreenCard({
  post, isActive, isMuted, onMuteToggle, onNextPost, onPrevPost,
}: Props) {
  const [mediaIndex,   setMediaIndex]   = useState(0)
  const [liked,        setLiked]        = useState(false)
  const [likes,        setLikes]        = useState(post.likes_count)
  const [saved,        setSaved]        = useState(false)
  const [bounce,       setBounce]       = useState(false)
  const [paused,       setPaused]       = useState(false)
  const [loaded,       setLoaded]       = useState(false)
  const [hasError,     setHasError]     = useState(false)
  const [expanded,     setExpanded]     = useState(false)
  const [lastTap,      setLastTap]      = useState(0)
  const [heartAnim,    setHeartAnim]    = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const touchX   = useRef(0)
  const touchY   = useRef(0)

  const media    = post.media_items
  const current  = media[mediaIndex]
  const isVideo  = current?.type === 'video'
  const sport    = post.sport_tags[0]
  const location = (post as unknown as Record<string, unknown>).location as string | null | undefined

  // Reset on post change
  useEffect(() => {
    setMediaIndex(0)
    setLoaded(false)
    setHasError(false)
    setExpanded(false)
  }, [post.id])

  // Auto-play / pause
  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo) return
    if (isActive) {
      v.muted = isMuted
      v.currentTime = 0
      v.play().then(() => setPaused(false)).catch(() => setPaused(true))
    } else {
      v.pause()
      setPaused(false)
    }
  }, [isActive, isVideo, mediaIndex, isMuted])

  // Sync mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  const handleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTap < 300) {
      // Double tap → like + heart animation
      if (!liked) {
        setLiked(true)
        setLikes(p => p + 1)
      }
      setBounce(true)
      setTimeout(() => setBounce(false), 400)
      setHeartAnim(true)
      setTimeout(() => setHeartAnim(false), 900)
    } else {
      // Single tap → play/pause
      if (isVideo) {
        const v = videoRef.current
        if (!v) return
        if (v.paused) { v.play().then(() => setPaused(false)).catch(() => {}) }
        else { v.pause(); setPaused(true) }
      }
    }
    setLastTap(now)
  }, [lastTap, liked, isVideo])

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    setLiked(p => !p)
    setLikes(p => liked ? p - 1 : p + 1)
    setBounce(true)
    setTimeout(() => setBounce(false), 300)
  }

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
    touchY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchX.current
    const dy = e.changedTouches[0].clientY - touchY.current
    if (Math.abs(dx) < Math.abs(dy) * 0.8 || Math.abs(dx) < 30) return
    if (dx < 0) {
      if (mediaIndex < media.length - 1) { setMediaIndex(i => i + 1); setLoaded(false) }
      else onNextPost?.()
    } else {
      if (mediaIndex > 0) { setMediaIndex(i => i - 1); setLoaded(false) }
      else onPrevPost?.()
    }
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', background: '#111', userSelect: 'none' }}
      onClick={handleTap}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Media ──────────────────────────────────────────────────────────── */}
      {isVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          key={`${post.id}-${mediaIndex}`}
          ref={videoRef}
          src={current?.url}
          poster={current?.thumbnail_url ?? undefined}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          loop playsInline autoPlay={isActive} muted
          preload={isActive ? 'auto' : 'none'}
          onCanPlay={() => {
            setLoaded(true)
            if (isActive && videoRef.current) videoRef.current.play().catch(() => {})
          }}
          onError={() => { setHasError(true); setLoaded(true) }}
        />
      ) : current?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${post.id}-${mediaIndex}`}
          src={current.url}
          alt={post.content.slice(0, 60)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onLoad={() => setLoaded(true)}
          onError={() => { setHasError(true); setLoaded(true) }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: '#1a1a1a' }} />
      )}

      {/* Loading */}
      {isActive && !loaded && !hasError && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      {/* ── Gradients ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 160,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), transparent)',
        pointerEvents: 'none', zIndex: 10,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 320,
        background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* ── Carousel dots ──────────────────────────────────────────────────── */}
      {media.length > 1 && (
        <div style={{
          position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 4, zIndex: 20,
        }}>
          {media.map((_, i) => (
            <span key={i} style={{
              height: 3, borderRadius: 999,
              width: i === mediaIndex ? 16 : 6,
              background: i === mediaIndex ? '#E87722' : 'rgba(255,255,255,0.5)',
              transition: 'width 200ms',
            }} />
          ))}
        </div>
      )}

      {/* ── Pause indicator ────────────────────────────────────────────────── */}
      {paused && isVideo && !hasError && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={28} color="white" style={{ marginLeft: 3 }} />
          </div>
        </div>
      )}

      {/* ── Double-tap heart ───────────────────────────────────────────────── */}
      {heartAnim && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 25, pointerEvents: 'none',
          animation: 'heartPop 0.9s ease-out forwards',
        }}>
          <Heart size={80} color="#E87722" fill="#E87722" />
        </div>
      )}

      {/* ── Action rail — right side, geclusterd glass blokje ──────────────── */}
      <div
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glass cluster */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 28,
          padding: '12px 8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          {/* Like */}
          <button
            onClick={handleLike}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Heart
              size={26} strokeWidth={2}
              color={liked ? '#E87722' : 'white'}
              fill={liked ? '#E87722' : 'white'}
              style={{ transform: bounce ? 'scale(1.4)' : 'scale(1)', transition: 'transform 150ms' }}
            />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1 }}>
              {fmt(likes)}
            </span>
          </button>

          {/* Comment */}
          <button
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <MessageCircle size={26} strokeWidth={2} color="white" fill="white" />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1 }}>
              {fmt(post.comments_count)}
            </span>
          </button>

          {/* Share */}
          <button
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Send size={24} strokeWidth={2} color="white" />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1 }}>
              Deel
            </span>
          </button>

          {/* Save */}
          <button
            onClick={e => { e.stopPropagation(); setSaved(p => !p) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Bookmark
              size={24} strokeWidth={2}
              color="white" fill={saved ? 'white' : 'none'}
            />
          </button>

          {/* Mute (video only) */}
          {isVideo && (
            <button
              onClick={e => { e.stopPropagation(); onMuteToggle() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {isMuted
                ? <VolumeX size={24} strokeWidth={2} color="white" />
                : <Volume2 size={24} strokeWidth={2} color="white" />
              }
            </button>
          )}
        </div>

        {/* Follow button — oranje, los onder cluster */}
        <button
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#E87722',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(232,119,34,0.45)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Metadata overlay — bottom left ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 80,   // ← ruimte voor de action rail
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
          zIndex: 20,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Username pill */}
        <div style={{
          alignSelf: 'flex-start',
          background: 'rgba(245,240,232,0.92)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 999,
          padding: '5px 12px 5px 6px',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <MiniAvatar url={post.avatar_url} name={post.displayName} size={24} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#111111' }}>
            @{post.username}
          </span>
        </div>

        {/* Sport + location pills */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {sport && (
            <div style={{
              background: '#E87722', borderRadius: 999,
              padding: '5px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <SportIcon sport={sport} size={12} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'white' }}>
                {sport}
              </span>
            </div>
          )}
          {location && (
            <div style={{
              background: 'rgba(30,26,22,0.72)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 999,
              padding: '5px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <MapPin size={12} color="white" strokeWidth={2} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: 'white' }}>
                {location}
              </span>
            </div>
          )}
        </div>

        {/* Title — eerste regel van content */}
        {post.content && (
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 17, lineHeight: 1.2,
            color: 'white',
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
            margin: 0,
          }}>
            {post.content.split('\n')[0]}
          </h2>
        )}

        {/* Description — rest van content, max 2 regels, tap = expand */}
        {post.content && post.content.includes('\n') && (
          <p
            onClick={() => setExpanded(p => !p)}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: 'rgba(255,255,255,0.80)',
              lineHeight: 1.45, margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: expanded ? 99 : 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {post.content.split('\n').slice(1).join('\n')}
          </p>
        )}
      </div>

      {/* ── CSS animations ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes heartPop {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(0.3) }
          35%  { opacity: 1; transform: translate(-50%,-50%) scale(1.3) }
          65%  { opacity: 1; transform: translate(-50%,-50%) scale(1.0) }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(1.1) }
        }
      `}</style>
    </div>
  )
}
