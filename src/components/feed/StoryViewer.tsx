'use client'

import { useState, useEffect, useCallback } from 'react'
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

const DURATION = 5000

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
  const [index,      setIndex]      = useState(0)
  const [animPaused, setAnimPaused] = useState(false)
  const [vidProgress,setVidProgress]= useState(0)

  const current = stories[index]
  const isVideo  = current?.mediaType === 'video'

  const goNext = useCallback(() => {
    setVidProgress(0)
    if (index < stories.length - 1) {
      setIndex(i => i + 1)
    } else {
      onClose()
    }
  }, [index, stories.length, onClose])

  const goPrev = useCallback(() => {
    setVidProgress(0)
    if (index > 0) setIndex(i => i - 1)
  }, [index])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  goNext()
      if (e.key === 'ArrowLeft')   goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goNext, goPrev])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!current) return null

  const initials = userName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        userSelect: 'none',
      }}
    >

      {/* ── Progress bars ─────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 10,
        display: 'flex', gap: 3,
        padding: 'calc(env(safe-area-inset-top) + 10px) 10px 0',
        pointerEvents: 'none',
      }}>
        {stories.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2.5, borderRadius: 2,
            background: 'rgba(255,255,255,0.28)',
            overflow: 'hidden',
          }}>
            {/* Past stories: full */}
            {i < index && (
              <div style={{ height: '100%', background: 'white', width: '100%' }} />
            )}

            {/* Current story: CSS animation (image) or controlled width (video) */}
            {i === index && (
              isVideo ? (
                <div style={{ height: '100%', background: 'white', width: `${vidProgress * 100}%`, transition: 'width 0.1s linear' }} />
              ) : (
                <div
                  key={`prog-${index}`}
                  onAnimationEnd={goNext}
                  style={{
                    height: '100%',
                    background: 'white',
                    animationName: 'story-fill',
                    animationDuration: `${DURATION}ms`,
                    animationTimingFunction: 'linear',
                    animationFillMode: 'forwards',
                    animationPlayState: animPaused ? 'paused' : 'running',
                  }}
                />
              )
            )}
            {/* Future stories: empty */}
          </div>
        ))}
      </div>

      {/* ── Header: avatar + naam + close ─────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 24px)',
        left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
      }}>
        {/* Avatar */}
        {userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userAvatarUrl} alt={userName}
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#E87722', border: '2px solid white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: 'white' }}>
              {initials}
            </span>
          </div>
        )}

        {/* Naam + tijd */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2, margin: 0 }}>
            {userName}
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.2, margin: 0 }}>
            {current.createdAt}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', flexShrink: 0 }}
        >
          <X style={{ width: 24, height: 24, color: 'white' }} />
        </button>
      </div>

      {/* ── Media / tekst ─────────────────────────────────────────────── */}
      <div
        style={{ flex: 1, position: 'relative' }}
        onPointerDown={() => setAnimPaused(true)}
        onPointerUp={() => setAnimPaused(false)}
        onPointerLeave={() => setAnimPaused(false)}
      >
        {/* Media */}
        {current.mediaUrl || current.thumbnailUrl ? (
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
              onEnded={goNext}
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
          /* Tekst post */
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

        {/* Caption overlay (alleen bij media) */}
        {current.content && (current.mediaUrl || current.thumbnailUrl) && (
          <div style={{
            position: 'absolute', bottom: 60, left: 0, right: 0,
            padding: '0 24px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
            paddingTop: 48,
            pointerEvents: 'none',
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, color: 'white', lineHeight: 1.5, margin: 0,
            }}>
              {current.content.slice(0, 150)}{current.content.length > 150 ? '…' : ''}
            </p>
          </div>
        )}

        {/* Tap zones: links = vorig, rechts = volgende */}
        <div
          style={{ position: 'absolute', top: 0, left: 0, width: '38%', bottom: 0, zIndex: 5 }}
          onClick={goPrev}
        />
        <div
          style={{ position: 'absolute', top: 0, right: 0, width: '38%', bottom: 0, zIndex: 5 }}
          onClick={goNext}
        />
      </div>

      {/* CSS keyframe voor progress animation */}
      <style>{`
        @keyframes story-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
