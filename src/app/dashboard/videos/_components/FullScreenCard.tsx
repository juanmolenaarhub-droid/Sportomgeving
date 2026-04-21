'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Heart, MessageCircle, Send, Bookmark, Plus, Play,
  MapPin,
} from 'lucide-react'
import type { PlayPost } from './types'
import { CommentsSheet } from '@/components/feed/CommentsSheet'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
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
  post, isActive, isMuted, onMuteToggle: _onMuteToggle, onNextPost, onPrevPost,
}: Props) {
  const [mediaIndex,   setMediaIndex]   = useState(0)
  const [liked,        setLiked]        = useState(false)
  const [likes,        setLikes]        = useState(post.likes_count)
  const [comments,     setComments]     = useState(post.comments_count)
  const [showComments, setShowComments] = useState(false)
  const currentUidRef = useRef<string | null>(null)
  const [saved,        setSaved]        = useState(false)
  const [bounce,       setBounce]       = useState(false)
  const [paused,       setPaused]       = useState(false)
  const [loaded,       setLoaded]       = useState(false)
  const [hasError,     setHasError]     = useState(false)
  const [expanded,     setExpanded]     = useState(false)
  const [lastTap,      setLastTap]      = useState(0)
  const [heartAnim,    setHeartAnim]    = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [seeking,      setSeeking]      = useState(false)

  const videoRef   = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const touchX   = useRef(0)
  const touchY   = useRef(0)

  const media    = post.media_items
  const current  = media[mediaIndex]
  const isVideo  = current?.type === 'video'
  const sport    = post.sport_tags[0]
  const location = (post as unknown as Record<string, unknown>).location as string | null | undefined

  // Reset on post change + fetch like status
  useEffect(() => {
    setMediaIndex(0)
    setLoaded(false)
    setHasError(false)
    setExpanded(false)
    setLikes(post.likes_count)
    setComments(post.comments_count)

    async function fetchLikeStatus() {
      const supabase = (await import('@/lib/supabase')).createClient()
      if (!currentUidRef.current) {
        const { data: { user } } = await supabase.auth.getUser()
        currentUidRef.current = user?.id ?? null
      }
      if (!currentUidRef.current) return
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', post.id)
        .eq('user_id', currentUidRef.current)
        .maybeSingle()
      setLiked(!!data)
    }
    fetchLikeStatus()
  }, [post.id, post.likes_count, post.comments_count])

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
        // Persist double-tap like
        import('@/lib/supabase').then(({ createClient }) => {
          const uid = currentUidRef.current
          if (uid) createClient().from('post_likes').upsert({ post_id: post.id, user_id: uid })
        })
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

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    const newLiked = !liked
    setLiked(newLiked)
    setLikes(p => newLiked ? p + 1 : Math.max(0, p - 1))
    setBounce(true)
    setTimeout(() => setBounce(false), 300)

    const supabase = (await import('@/lib/supabase')).createClient()
    if (!currentUidRef.current) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUidRef.current = user?.id ?? null
    }
    if (!currentUidRef.current) return
    if (newLiked) {
      await supabase.from('post_likes').upsert({ post_id: post.id, user_id: currentUidRef.current })
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUidRef.current)
    }
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

  function handleSeek(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    const bar = progressRef.current
    const v = videoRef.current
    if (!bar || !v || !duration) return
    const rect = bar.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = ratio * duration
    setProgress(ratio)
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
          ref={(el) => {
            videoRef.current = el
            if (el) el.muted = true  // iOS Safari vereist muted vóór autoplay
          }}
          src={current?.url}
          poster={current?.thumbnail_url ?? undefined}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          loop playsInline
          preload={isActive ? 'auto' : 'metadata'}
          onCanPlay={() => {
            setLoaded(true)
            if (isActive && videoRef.current) videoRef.current.play().catch(() => {})
          }}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
          onTimeUpdate={() => {
            const v = videoRef.current
            if (v && v.duration && !seeking) setProgress(v.currentTime / v.duration)
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

      {/* ── Action rail — rechts, + boven, glass cluster eronder ────────── */}
      <div
        style={{
          position: 'absolute', right: 12,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
          zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Follow button — oranje bovenaan */}
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
            onClick={e => { e.stopPropagation(); setShowComments(true) }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <MessageCircle size={26} strokeWidth={2} color="white" fill="white" />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1 }}>
              {fmt(comments)}
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
        </div>
      </div>

      {/* ── Metadata overlay — bottom left ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 72,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
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
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', flexShrink: 0, display: 'inline-block' }} />
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

        {/* Description — altijd tonen als er content is na de eerste regel */}
        {post.content && (
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
            {post.content.includes('\n')
              ? post.content.split('\n').slice(1).join('\n')
              : post.content}
          </p>
        )}
      </div>

      {/* ── Progress / seekbar ─────────────────────────────────────────────── */}
      {isVideo && (
        <div
          ref={progressRef}
          style={{
            position: 'absolute', left: 0, right: 0,
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            zIndex: 25, padding: '10px 16px', cursor: 'pointer',
          }}
          onClick={e => { e.stopPropagation(); handleSeek(e) }}
          onTouchStart={e => { e.stopPropagation(); setSeeking(true) }}
          onTouchMove={e => { e.stopPropagation(); handleSeek(e) }}
          onTouchEnd={e => { e.stopPropagation(); setSeeking(false) }}
        >
          {/* Track */}
          <div style={{ position: 'relative', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.25)' }}>
            {/* Fill */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${progress * 100}%`,
              borderRadius: 2, background: '#E87722',
              transition: seeking ? 'none' : 'width 0.25s linear',
            }} />
            {/* Thumb */}
            <div style={{
              position: 'absolute', top: '50%',
              left: `${progress * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: '#E87722',
              boxShadow: '0 0 6px rgba(232,119,34,0.7)',
              transition: seeking ? 'none' : 'left 0.25s linear',
            }} />
          </div>
          {/* Time labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              {formatTime(progress * duration)}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}

      {/* ── Comments sheet ─────────────────────────────────────────────────── */}
      {showComments && (
        <CommentsSheet
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCountChange={delta => setComments(p => Math.max(0, p + delta))}
        />
      )}

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
