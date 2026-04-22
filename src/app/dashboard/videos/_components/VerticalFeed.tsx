'use client'

import { useEffect, useRef } from 'react'
import { FullScreenCard } from './FullScreenCard'
import type { PlayPost } from './types'

interface Props {
  posts: PlayPost[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isMuted: boolean
  onMuteToggle: () => void
  activeIdx: number
  onActiveIdx: (i: number) => void
  isVisible: boolean
  emptyTitle?: string
  emptyBody?: string
}

export function VerticalFeed({
  posts, loading, hasMore, onLoadMore,
  isMuted, onMuteToggle,
  activeIdx, onActiveIdx,
  isVisible,
  emptyTitle = 'Nog geen video\'s hier',
  emptyBody  = 'Kom later terug',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onScroll() {
      const idx = Math.round(el!.scrollTop / el!.clientHeight)
      onActiveIdx(idx)
      if (idx >= posts.length - 3 && hasMore && !loading) onLoadMore()
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [posts.length, hasMore, loading, onLoadMore, onActiveIdx])

  // Single outer div — always in DOM
  return (
    <div
      className="flex-1 min-h-0 flex flex-col"
      style={{ display: isVisible ? 'flex' : 'none', background: '#000' }}
    >
      {loading && posts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
          <div style={{
            background: 'rgba(245,240,232,0.12)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 20,
            padding: '24px 28px',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: '#F4F1E8',
              marginBottom: 8,
            }}>{emptyTitle}</p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: 'rgba(245,240,232,0.55)',
              lineHeight: 1.5,
            }}>{emptyBody}</p>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-scroll"
          style={{
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
          {posts.map((post, i) => (
            <div
              key={post.id}
              className="w-full shrink-0"
              style={{ height: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
            >
              <FullScreenCard
                post={post}
                isActive={i === activeIdx && isVisible}
                isMuted={isMuted}
                onMuteToggle={onMuteToggle}
                onNextPost={() => {
                  const el = containerRef.current
                  if (el) el.scrollTo({ top: (i + 1) * el.clientHeight, behavior: 'smooth' })
                }}
                onPrevPost={() => {
                  const el = containerRef.current
                  if (el) el.scrollTo({ top: (i - 1) * el.clientHeight, behavior: 'smooth' })
                }}
              />
            </div>
          ))}
          {loading && (
            <div className="w-full shrink-0 flex items-center justify-center bg-black" style={{ height: '100%' }}>
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
