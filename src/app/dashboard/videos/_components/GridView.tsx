'use client'

import { useEffect, useRef } from 'react'
import { GridCard } from './GridCard'
import type { PlayPost } from './types'

interface Props {
  posts: PlayPost[]
  loading: boolean
  onCardClick: (index: number) => void
  onLoadMore: () => void
  hasMore: boolean
}

export function GridView({ posts, loading, onCardClick, onLoadMore, hasMore }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) onLoadMore() },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (posts.length === 0 && !loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 text-sm">Geen posts gevonden</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <div className="grid grid-cols-2 gap-2">
        {posts.map((post, i) => (
          <GridCard key={post.id} post={post} onClick={() => onCardClick(i)} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-10 mt-2 flex items-center justify-center">
        {loading && (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#E87722] rounded-full animate-spin" />
        )}
      </div>
    </div>
  )
}
