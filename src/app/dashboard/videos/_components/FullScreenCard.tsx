'use client'

import {
  useState, useEffect, useRef, useCallback,
} from 'react'
import {
  Heart, MessageCircle, Share2,
  Volume2, VolumeX, Play, Plus, Music2,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import type { PlayPost } from './types'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

interface Props {
  post: PlayPost
  isActive: boolean
  isMuted: boolean
  onMuteToggle: () => void
  /** called when swiping past the last media item → advance to next post */
  onNextPost?: () => void
  /** called when swiping before first media item → go to previous post */
  onPrevPost?: () => void
}

export function FullScreenCard({
  post, isActive, isMuted, onMuteToggle, onNextPost, onPrevPost,
}: Props) {
  const [mediaIndex, setMediaIndex] = useState(0)
  const [liked,      setLiked]      = useState(false)
  const [likes,      setLikes]      = useState(post.likes_count)
  const [bounce,     setBounce]     = useState(false)
  const [paused,     setPaused]     = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [loaded,     setLoaded]     = useState(false)
  const [hasError,   setHasError]   = useState(false)

  const videoRef  = useRef<HTMLVideoElement>(null)
  const barRef    = useRef<HTMLDivElement>(null)
  const touchX    = useRef(0)
  const touchY    = useRef(0)

  const media    = post.media_items
  const current  = media[mediaIndex]
  const isVideo  = current?.type === 'video'

  // Reset to first slide when post changes
  useEffect(() => { setMediaIndex(0); setLoaded(false); setHasError(false) }, [post.id])

  // Auto-play / pause video
  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo) return
    if (isActive) {
      v.muted = true
      v.currentTime = 0
      v.play().then(() => setPaused(false)).catch(() => setPaused(true))
    } else {
      v.pause()
      setPaused(false)
      setProgress(0)
    }
  }, [isActive, isVideo, mediaIndex])

  // Sync mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  // Progress bar
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    function tick() {
      if (v!.duration) setProgress(v!.currentTime / v!.duration)
    }
    v.addEventListener('timeupdate', tick)
    return () => v.removeEventListener('timeupdate', tick)
  }, [mediaIndex])

  // Seek
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const v   = videoRef.current
    const bar = barRef.current
    if (!v || !bar || !v.duration) return
    const rect = bar.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }, [])

  // Tap to play/pause
  function handleTap() {
    const v = videoRef.current
    if (!v || !isVideo) return
    if (v.paused) {
      v.muted = isMuted
      v.play().then(() => setPaused(false)).catch(() => {})
    } else {
      v.pause()
      setPaused(true)
    }
  }

  function handlePlayBtn(e: React.MouseEvent) {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.play().then(() => { setPaused(false); setHasError(false) }).catch(() => setHasError(true))
  }

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    setLiked(p => !p)
    setLikes(p => liked ? p - 1 : p + 1)
    setBounce(true)
    setTimeout(() => setBounce(false), 300)
  }

  // Horizontal carousel swipe
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX
    touchY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchX.current
    const dy = e.changedTouches[0].clientY - touchY.current
    if (Math.abs(dx) < Math.abs(dy) * 0.8 || Math.abs(dx) < 30) return // vertical scroll wins

    if (dx < 0) {
      // swipe left → next media or next post
      if (mediaIndex < media.length - 1) {
        setMediaIndex(i => i + 1)
        setLoaded(false)
      } else {
        onNextPost?.()
      }
    } else {
      // swipe right → prev media or prev post
      if (mediaIndex > 0) {
        setMediaIndex(i => i - 1)
        setLoaded(false)
      } else {
        onPrevPost?.()
      }
    }
  }

  const tag = post.sport_tags[0]

  return (
    <div
      className="relative w-full h-full bg-black select-none"
      onClick={handleTap}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Media */}
      {isVideo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          key={`${post.id}-${mediaIndex}`}
          ref={videoRef}
          src={current?.url}
          poster={current?.thumbnail_url ?? undefined}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          preload={isActive ? 'auto' : 'metadata'}
          onCanPlay={() => setLoaded(true)}
          onError={() => { setHasError(true); setLoaded(true) }}
        />
      ) : current?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${post.id}-${mediaIndex}`}
          src={current.url}
          alt={post.content.slice(0, 60)}
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={() => setLoaded(true)}
          onError={() => { setHasError(true); setLoaded(true) }}
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}

      {/* Loading spinner */}
      {isActive && !loaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80 pointer-events-none" />

      {/* Play button */}
      {paused && !hasError && isVideo && (
        <button
          className="absolute inset-0 flex items-center justify-center"
          onClick={handlePlayBtn}
        >
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-7 h-7 text-white ml-1" />
          </div>
        </button>
      )}

      {/* Carousel dot indicators */}
      {media.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {media.map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full transition-all duration-200"
              style={{
                width:      i === mediaIndex ? 16 : 6,
                background: i === mediaIndex ? '#E87722' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
      )}

      {/* Right actions */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-10"
        style={{ bottom: 108 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Avatar + follow */}
        <div className="relative">
          <div className="w-11 h-11 rounded-full ring-2 ring-white overflow-hidden">
            <Avatar name={post.displayName} imageUrl={post.avatar_url} size="sm" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#E87722] rounded-full flex items-center justify-center ring-2 ring-black">
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <Heart
              className="w-6 h-6 transition-transform duration-150"
              style={{
                color:     liked ? '#E87722' : 'white',
                fill:      liked ? '#E87722' : 'none',
                transform: bounce ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">{fmt(likes)}</span>
        </button>

        {/* Comment */}
        <button onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">{fmt(post.comments_count)}</span>
        </button>

        {/* Share */}
        <button onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">Deel</span>
        </button>

        {/* Mute (only for video) */}
        {isVideo && (
          <button
            onClick={e => { e.stopPropagation(); onMuteToggle() }}
            className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm"
          >
            {isMuted
              ? <VolumeX className="w-5 h-5 text-white" />
              : <Volume2 className="w-5 h-5 text-white" />
            }
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div
        className="absolute left-4 right-16 space-y-1 z-10"
        style={{ bottom: 88 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-[14px] drop-shadow">@{post.username}</span>
          {tag && (
            <span
              className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#E87722' }}
            >
              {tag}
            </span>
          )}
        </div>
        <p className="text-white/90 text-[13px] leading-snug drop-shadow line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-1.5">
          <Music2 className="w-3 h-3 text-white/60 shrink-0" />
          <span className="text-white/60 text-xs truncate">{post.displayName}</span>
        </div>
      </div>

      {/* Progress bar (video only) */}
      {isVideo && (
        <div
          ref={barRef}
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/25 cursor-pointer z-10"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white"
            style={{ width: `${progress * 100}%`, transition: 'width 0.1s linear' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md -translate-x-1/2"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
