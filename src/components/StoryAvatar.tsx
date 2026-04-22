'use client'

import { useState } from 'react'
import { X, Heart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, getInitials } from '@/components/ui/Avatar'

export type StoryPost = {
  id: string
  user: { name: string; avatar?: string; region: string }
  content: string
  activity_type: string
  activity_icon?: string
  activity_label: string
  distance_km?: number
  duration_minutes?: number
  image_url?: string
  likes_count: number
  comments_count: number
  created_at: string
}

// ─── Story viewer overlay ────────────────────────────────────────────────────
function StoryViewer({ posts, startIndex, onClose }: { posts: StoryPost[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const post = posts[current]

  function prev() { if (current > 0) { setCurrent(c => c - 1) } }
  function next() { if (current < posts.length - 1) { setCurrent(c => c + 1) } else { onClose() } }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-sm h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Voortgangsbalken */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {posts.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div className={`h-full bg-white rounded-full ${i <= current ? 'w-full' : 'w-0'}`} />
            </div>
          ))}
        </div>

        {/* Achtergrond */}
        {post.image_url
          ? <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-forest" />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 pt-8">
          <div className="flex items-center gap-3">
            <div className="ring-2 ring-lime rounded-full">
              <Avatar initials={getInitials(post.user.name)} size="sm" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{post.user.name}</p>
              <p className="text-white/60 text-xs">{post.created_at}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Stats */}
        {(post.distance_km || post.duration_minutes) && (
          <div className="relative z-10 mx-4 mt-1">
            <div className="bg-black/40 backdrop-blur-sm rounded-[4px] p-3 flex gap-6">
              {post.distance_km && (
                <div className="text-center">
                  <p className="text-white font-black text-lg">{post.distance_km} km</p>
                  <p className="text-white/60 text-xs">Afstand</p>
                </div>
              )}
              {post.duration_minutes && (
                <div className="text-center">
                  <p className="text-white font-black text-lg">{post.duration_minutes} min</p>
                  <p className="text-white/60 text-xs">Duur</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-white font-black text-sm">{post.activity_label}</p>
                <p className="text-white/60 text-xs">Sport</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 mt-auto p-5">
          <p className="text-white text-sm leading-relaxed mb-4">{post.content}</p>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-white/80 text-sm font-semibold">
              <Heart className="w-5 h-5" /> {post.likes_count}
            </button>
            <button className="flex items-center gap-2 text-white/80 text-sm font-semibold">
              <MessageCircle className="w-5 h-5" /> {post.comments_count}
            </button>
          </div>
        </div>

        {/* Klikgebieden */}
        <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" />
        <button onClick={next} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" />
        {current > 0 && (
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        )}
        {current < posts.length - 1 && (
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Story avatar met lime gloed ─────────────────────────────────────────────
export function StoryAvatar({
  name,
  size = 'md',
  posts,
  postIndex = 0,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  posts?: StoryPost[]
  postIndex?: number
}) {
  const [open, setOpen] = useState(false)
  const hasStory = posts && posts.length > 0

  const avatarSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'

  return (
    <>
      <button
        onClick={() => hasStory && setOpen(true)}
        className={`relative shrink-0 rounded-full ${hasStory ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!hasStory}
      >
        {hasStory && (
          <>
            <span className="absolute inset-0 rounded-full bg-lime blur-[6px] opacity-40 animate-pulse" />
            <span className="absolute inset-0 rounded-full ring-2 ring-lime" />
            <span className="absolute inset-[3px] rounded-full ring-2 ring-bone" />
          </>
        )}
        <Avatar initials={getInitials(name)} size={avatarSize} />
      </button>

      {open && hasStory && (
        <StoryViewer posts={posts} startIndex={postIndex} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
