'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { FullScreenCard } from './FullScreenCard'
import type { PlayPost } from './types'

interface Props {
  posts: PlayPost[]
  initialIndex: number
  onClose: () => void
  isMuted: boolean
  onMuteToggle: () => void
}

export function FullScreenViewer({ posts, initialIndex, onClose, isMuted, onMuteToggle }: Props) {
  const [index, setIndex] = useState(initialIndex)

  // Keyboard navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, posts.length - 1))
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  setIndex(i => Math.max(i - 1, 0))
    if (e.key === 'Escape') onClose()
  }, [posts.length, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Sync if new posts are loaded while viewer is open
  useEffect(() => {
    if (index >= posts.length && posts.length > 0) setIndex(posts.length - 1)
  }, [posts.length, index])

  const post = posts[index]
  if (!post) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      style={{ touchAction: 'none' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Post counter */}
      <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
        <span className="text-white text-xs font-bold">{index + 1} / {posts.length}</span>
      </div>

      {/* Prev/Next arrows (desktop) */}
      {index > 0 && (
        <button
          onClick={() => setIndex(i => i - 1)}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm items-center justify-center"
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
      )}
      {index < posts.length - 1 && (
        <button
          onClick={() => setIndex(i => i + 1)}
          className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm items-center justify-center"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      )}

      <FullScreenCard
        post={post}
        isActive={true}
        isMuted={isMuted}
        onMuteToggle={onMuteToggle}
        onNextPost={() => setIndex(i => Math.min(i + 1, posts.length - 1))}
        onPrevPost={() => setIndex(i => Math.max(i - 1, 0))}
      />
    </div>
  )
}
