'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { FullScreenCard } from './FullScreenCard'
import { normalizePost } from './types'
import type { PlayPost } from './types'

interface Props {
  isMuted: boolean
  onMuteToggle: () => void
}

const PAGE_SIZE = 10

export function VoorJouFeed({ isMuted, onMuteToggle }: Props) {
  const supabase = createClient()

  const [posts,      setPosts]      = useState<PlayPost[]>([])
  const [activeIdx,  setActiveIdx]  = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const containerRef  = useRef<HTMLDivElement>(null)
  const cursorRef     = useRef<string | null>(null)
  const hasMoreRef    = useRef(true)
  const userIdRef     = useRef<string>('')
  const userSportsRef = useRef<string[]>([])
  const userRegionRef = useRef<string>('')
  const viewedIdsRef  = useRef<Set<string>>(new Set())

  // Load user context (sports, region)
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id

      const { data: prof } = await supabase
        .from('profiles')
        .select('region')
        .eq('id', user.id)
        .single()
      if (prof?.region) userRegionRef.current = prof.region

      const { data: sports } = await supabase
        .from('user_sports')
        .select('sports(name)')
        .eq('user_id', user.id)
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
    if (reset) {
      cursorRef.current = null
      hasMoreRef.current = true
    }
    setLoadingMore(!reset)

    // Fetch a batch of posts, ordered by score-proxies
    let query = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE * 3) // fetch more, then rank/filter client-side

    if (cursorRef.current) {
      query = query.lt('created_at', cursorRef.current)
    }

    const { data } = await query
    if (!data || data.length === 0) {
      hasMoreRef.current = false
      setLoadingMore(false)
      return
    }

    cursorRef.current = data[data.length - 1].created_at

    // Fetch profiles for these posts
    const userIds = [...new Set(data.map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, region')
      .in('id', userIds)
    const profileMap: Record<string, unknown> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    // Score and rank posts
    const scored = data.map(row => {
      const post = normalizePost(row, profileMap[row.user_id])
      let score = 0

      // Sport match
      const userSports = userSportsRef.current.map(s => s.toLowerCase())
      const postSports = post.sport_tags.map(s => s.toLowerCase())
      if (postSports.some(s => userSports.includes(s))) score += 50

      // Region match
      if (
        userRegionRef.current &&
        post.region &&
        post.region.toLowerCase().includes(userRegionRef.current.toLowerCase())
      ) score += 30

      // Video preferred
      if (post.primary_type === 'video') score += 20

      // Engagement
      score += Math.min(post.likes_count / 10, 20)

      // Not already seen
      if (viewedIdsRef.current.has(post.id)) score -= 1000

      return { post, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const ranked = scored.slice(0, PAGE_SIZE).map(s => s.post)

    // Track as viewed
    ranked.forEach(p => viewedIdsRef.current.add(p.id))

    if (reset) {
      setPosts(ranked)
    } else {
      setPosts(prev => [...prev, ...ranked])
    }

    hasMoreRef.current = data.length >= PAGE_SIZE
    setLoadingMore(false)
  }, [supabase])

  // Scroll tracking
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onScroll() {
      const idx = Math.round(el!.scrollTop / el!.clientHeight)
      setActiveIdx(idx)

      // Pre-load more when near end
      if (idx >= posts.length - 3 && hasMoreRef.current && !loadingMore) {
        loadPosts(false)
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [posts.length, loadingMore, loadPosts])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black gap-3">
        <p className="text-white/60 text-sm">Nog geen content voor jou</p>
        <p className="text-white/30 text-xs text-center px-8">Volg meer buddies en stel je sporten in om aanbevelingen te ontvangen</p>
      </div>
    )
  }

  return (
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
            isActive={i === activeIdx}
            isMuted={isMuted}
            onMuteToggle={onMuteToggle}
            onNextPost={() => {
              const el = containerRef.current
              if (!el) return
              el.scrollTo({ top: (i + 1) * el.clientHeight, behavior: 'smooth' })
            }}
            onPrevPost={() => {
              const el = containerRef.current
              if (!el) return
              el.scrollTo({ top: (i - 1) * el.clientHeight, behavior: 'smooth' })
            }}
          />
        </div>
      ))}

      {loadingMore && (
        <div className="w-full shrink-0 flex items-center justify-center bg-black" style={{ height: '100%' }}>
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
