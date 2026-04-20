'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FullScreenCard } from './FullScreenCard'
import { normalizePost } from './types'
import type { PlayPost } from './types'

interface Props {
  isMuted: boolean
  onMuteToggle: () => void
  isVisible: boolean
}

const PAGE_SIZE = 10

export function VoorJouFeed({ isMuted, onMuteToggle, isVisible }: Props) {
  const supabase = createClient()

  const [posts,       setPosts]       = useState<PlayPost[]>([])
  const [activeIdx,   setActiveIdx]   = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const containerRef  = useRef<HTMLDivElement>(null)
  const cursorRef     = useRef<string | null>(null)
  const hasMoreRef    = useRef(true)
  const userSportsRef = useRef<string[]>([])
  const userRegionRef = useRef<string>('')
  const viewedIdsRef  = useRef<Set<string>>(new Set())

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles').select('region').eq('id', user.id).single()
      if (prof?.region) userRegionRef.current = prof.region

      const { data: sports } = await supabase
        .from('user_sports').select('sports(name)').eq('user_id', user.id)
      if (sports) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userSportsRef.current = sports.flatMap((s: any) => s.sports?.name ? [s.sports.name] : [])
      }

      await loadPosts(true)
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPosts = useCallback(async (reset = false) => {
    if (!hasMoreRef.current && !reset) return
    if (reset) { cursorRef.current = null; hasMoreRef.current = true }
    setLoadingMore(!reset)

    let query = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at')
      .eq('media_type', 'video')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE * 3)
    if (cursorRef.current) query = query.lt('created_at', cursorRef.current)

    const { data } = await query
    if (!data || data.length === 0) { hasMoreRef.current = false; setLoadingMore(false); return }
    cursorRef.current = data[data.length - 1].created_at

    const userIds = [...new Set(data.map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name, username, avatar_url, region').in('id', userIds)
    const pm: Record<string, unknown> = {}
    for (const p of profiles ?? []) pm[p.id] = p

    const scored = data.map(row => {
      const post = normalizePost(row, pm[row.user_id])
      let score = 0
      const us = userSportsRef.current.map(s => s.toLowerCase())
      const ps = post.sport_tags.map(s => s.toLowerCase())
      if (ps.some(s => us.includes(s))) score += 50
      if (userRegionRef.current && post.region?.toLowerCase().includes(userRegionRef.current.toLowerCase())) score += 30
      if (post.primary_type === 'video') score += 20
      score += Math.min(post.likes_count / 10, 20)
      if (viewedIdsRef.current.has(post.id)) score -= 1000
      return { post, score }
    })
    scored.sort((a, b) => b.score - a.score)
    const ranked = scored.slice(0, PAGE_SIZE).map(s => s.post)
    ranked.forEach(p => viewedIdsRef.current.add(p.id))

    if (reset) setPosts(ranked)
    else       setPosts(prev => [...prev, ...ranked])
    hasMoreRef.current = data.length >= PAGE_SIZE
    setLoadingMore(false)
  }, [supabase])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onScroll() {
      const idx = Math.round(el!.scrollTop / el!.clientHeight)
      setActiveIdx(idx)
      if (idx >= posts.length - 3 && hasMoreRef.current && !loadingMore) loadPosts(false)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [posts.length, loadingMore, loadPosts])

  // Single outer div — always in DOM, display controlled by parent
  return (
    <div
      className="flex-1 min-h-0 flex flex-col"
      style={{ display: isVisible ? 'flex' : 'none', background: '#000' }}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-white/60 text-sm">Nog geen content voor jou</p>
          <p className="text-white/30 text-xs text-center px-8">
            Volg meer buddies en stel je sporten in om aanbevelingen te ontvangen
          </p>
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
                onNextPost={() => containerRef.current?.scrollTo({ top: (i + 1) * containerRef.current.clientHeight, behavior: 'smooth' })}
                onPrevPost={() => containerRef.current?.scrollTo({ top: (i - 1) * containerRef.current.clientHeight, behavior: 'smooth' })}
              />
            </div>
          ))}
          {loadingMore && (
            <div className="w-full shrink-0 flex items-center justify-center bg-black" style={{ height: '100%' }}>
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
