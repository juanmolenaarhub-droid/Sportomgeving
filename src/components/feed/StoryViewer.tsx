'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StoryFrame = {
  id: string
  mediaUrl: string | null
  mediaType: string | null
  thumbnailUrl: string | null
  content: string | null
  createdAt: string
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

const DURATION = 5000 // ms per story frame

// ─── StoryViewer ───────────────────────────────────────────────────────────────

export function StoryViewer({
  stories,
  userName,
  userAvatarUrl,
  onClose,
}: {
  stories: StoryFrame[]
  userName: string
  userAvatarUrl: string | null
  onClose: () => void
}) {
  const [index,       setIndex]       = useState(0)
  const [progress,    setProgress]    = useState(0)   // 0–1
  const [vidProgress, setVidProgress] = useState(0)   // 0–1, video only

  // Refs so timer always reads fresh values without stale closures
  const indexRef      = useRef(0)
  const pausedRef     = useRef(false)
  const elapsedRef    = useRef(0)       // ms accumulated for current frame
  const lastTickRef   = useRef(Date.now())
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  indexRef.current = index

  const current = stories[index]
  const isVideo = current?.mediaType === 'video'

  // ── Navigation helpers ────────────────────────────────────────────────────

  function advance() {
    const next = indexRef.current + 1
    if (next < stories.length) {
      elapsedRef.current = 0
      setProgress(0)
      setVidProgress(0)
      setIndex(next)
    } else {
      onClose()
    }
  }

  function retreat() {
    const prev = indexRef.current - 1
    if (prev >= 0) {
      elapsedRef.current = 0
      setProgress(0)
      setVidProgress(0)
      setIndex(prev)
    }
  }

  // ── Timer (runs for image/text frames) ───────────────────────────────────

  useEffect(() => {
    // Reset on every new frame
    elapsedRef.current = 0
    pausedRef.current  = false
    lastTickRef.current = Date.now()
    setProgress(0)

    if (isVideo) return // video drives progress via onTimeUpdate

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      if (pausedRef.current) {
        // While paused: keep resetting lastTick so paused time is never counted
        lastTickRef.current = Date.now()
        return
      }

      const now = Date.now()
      elapsedRef.current += now - lastTickRef.current
      lastTickRef.current = now

      const p = Math.min(elapsedRef.current / DURATION, 1)
      setProgress(p)

      if (p >= 1) {
        clearInterval(timerRef.current!)
        timerRef.current = null
        advance()
      }
    }, 50)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isVideo])

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft')  retreat()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Lock body scroll ──────────────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── Hold to pause handlers ────────────────────────────────────────────────

  function handleHoldStart() {
    pausedRef.current = true
  }

  function handleHoldEnd() {
    pausedRef.current = false
    lastTickRef.current = Date.now()
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!current) return null

  const initials = userName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const displayProgress = isVideo ? vidProgress : progress

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >

      {/* ── Gradient voor leesbaarheid progress + header ──────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 140,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)',
        zIndex: 9,
        pointerEvents: 'none',
      }} />

      {/* ── Progress bars ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 10,
        display: 'flex', gap: 3,
        padding: 'calc(env(safe-area-inset-top) + 10px) 12px 0',
        pointerEvents: 'none',
      }}>
        {stories.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2.5, borderRadius: 2,
            background: 'rgba(255,255,255,0.30)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: 'rgba(255,255,255,0.95)',
              width: i < index
                ? '100%'
                : i === index
                  ? `${displayProgress * 100}%`
                  : '0%',
            }} />
          </div>
        ))}
      </div>

      {/* ── Header: avatar + naam + sluit ─────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 24px)',
        left: 0, right: 0,
        zIndex: 10,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 10,
      }}>
        {userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userAvatarUrl} alt={userName}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#C4F542', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: 'white' }}>
              {initials}
            </span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2, margin: 0 }}>
            {userName}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2, margin: 0 }}>
            {current.createdAt}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', flexShrink: 0 }}
        >
          <X style={{ width: 24, height: 24, color: 'white' }} />
        </button>
      </div>

      {/* ── Media + tekst ─────────────────────────────────────────────── */}
      <div
        style={{ flex: 1, position: 'relative' }}
        onPointerDown={handleHoldStart}
        onPointerUp={handleHoldEnd}
        onPointerLeave={handleHoldEnd}
        onPointerCancel={handleHoldEnd}
      >
        {/* Media */}
        {(current.mediaUrl || current.thumbnailUrl) ? (
          isVideo ? (
            <video
              key={current.id}
              src={current.mediaUrl!}
              autoPlay
              playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              onTimeUpdate={e => {
                const v = e.currentTarget
                if (v.duration > 0) setVidProgress(v.currentTime / v.duration)
              }}
              onEnded={advance}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.id}
              src={current.mediaUrl ?? current.thumbnailUrl!}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )
        ) : (
          /* Tekst-post */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 48,
            background: 'linear-gradient(135deg, #1A1714 0%, #2A2420 100%)',
          }}>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800, fontSize: 26, lineHeight: 1.15,
              color: 'white', textAlign: 'center',
            }}>
              &ldquo;{(current.content ?? '').slice(0, 140)}&rdquo;
            </p>
          </div>
        )}

        {/* Caption overlay (bij media-posts) */}
        {current.content && (current.mediaUrl || current.thumbnailUrl) && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '60px 24px 40px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: 500,
              color: 'white', lineHeight: 1.5, margin: 0,
            }}>
              {current.content.slice(0, 150)}{current.content.length > 150 ? '…' : ''}
            </p>
          </div>
        )}

        {/* Tap-zones: links = vorig, rechts = volgende */}
        <div
          style={{ position: 'absolute', top: 0, left: 0, width: '35%', bottom: 0, zIndex: 5 }}
          onClick={e => { e.stopPropagation(); retreat() }}
        />
        <div
          style={{ position: 'absolute', top: 0, right: 0, width: '35%', bottom: 0, zIndex: 5 }}
          onClick={e => { e.stopPropagation(); advance() }}
        />
      </div>
    </div>
  )
}
