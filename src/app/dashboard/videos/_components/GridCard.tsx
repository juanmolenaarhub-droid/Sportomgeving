'use client'

import { Play, Images } from 'lucide-react'
import type { PlayPost } from './types'

interface Props {
  post: PlayPost
  onClick: () => void
}

export function GridCard({ post, onClick }: Props) {
  const thumb =
    post.media_items[0]?.thumbnail_url ??
    (post.primary_type === 'image' ? post.media_items[0]?.url : null)

  const isVideo    = post.primary_type === 'video'
  const multiMedia = post.media_items.length > 1
  const tag        = post.sport_tags[0]

  return (
    <button
      onClick={onClick}
      className="relative w-full aspect-[9/14] rounded-xl overflow-hidden bg-zinc-900 focus:outline-none group"
    >
      {/* Thumbnail / placeholder */}
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={post.content.slice(0, 60)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
          <Play className="w-8 h-8 text-zinc-600" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 pointer-events-none" />

      {/* Top-right: play icon or multi-media icon */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {multiMedia && (
          <span className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Images className="w-3 h-3 text-white" />
          </span>
        )}
        {isVideo && (
          <span className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-3 h-3 text-white ml-0.5" />
          </span>
        )}
      </div>

      {/* Bottom: sport tag + caption */}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
        {tag && (
          <span
            className="inline-block text-white text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: '#C4F542' }}
          >
            {tag}
          </span>
        )}
        <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2 drop-shadow">
          {post.content}
        </p>
      </div>
    </button>
  )
}
