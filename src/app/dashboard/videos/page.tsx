'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { GridView } from './_components/GridView'
import { VoorJouFeed } from './_components/VoorJouFeed'
import { VerticalFeed } from './_components/VerticalFeed'
import { FullScreenViewer } from './_components/FullScreenViewer'
import { normalizePost } from './_components/types'
import type { PlayPost } from './_components/types'

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = 'verkennen' | 'volgend' | 'voorjou'

const SPORT_PILLS = [
  'Hardlopen', 'Fietsen', 'Zwemmen', 'Gym', 'Yoga',
  'Padel', 'Voetbal', 'Boksen', 'Klimmen', 'Tennis',
]

const PAGE_SIZE = 20

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayPage() {
  const supabase = createClient()

  const [tab,         setTab]         = useState<Tab>('verkennen')
  const [searchQuery, setSearchQuery] = useState('')
  const [activePill,  setActivePill]  = useState<string | null>(null)
  const [isMuted,     setIsMuted]     = useState(true)

  // Verkennen (explore) state
  const [explorePosts,   setExplorePosts]   = useState<PlayPost[]>([])
  const [exploreLoading, setExploreLoading] = useState(false)
  const [exploreHasMore, setExploreHasMore] = useState(true)
  const exploreCursorRef = useRef<string | null>(null)

  // Volgend (following) state
  const [followPosts,    setFollowPosts]    = useState<PlayPost[]>([])
  const [followLoading,  setFollowLoading]  = useState(false)
  const [followHasMore,  setFollowHasMore]  = useState(true)
  const [followActiveIdx, setFollowActiveIdx] = useState(0)
  const followCursorRef  = useRef<string | null>(null)
  const buddyIdsRef      = useRef<string[]>([])

  // Viewer state (for Verkennen grid tap)
  const [viewerPosts, setViewerPosts] = useState<PlayPost[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerOpen,  setViewerOpen]  = useState(false)

  const userIdRef = useRef('')

  // ── Load buddy IDs once ──────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id

      const { data: reqs } = await supabase
        .from('follow_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq('status', 'accepted')

      const ids = (reqs ?? []).map(r =>
        r.from_user_id === user.id ? r.to_user_id : r.from_user_id
      )
      buddyIdsRef.current = [user.id, ...ids]
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch explore posts ──────────────────────────────────────────────────
  const loadExplorePosts = useCallback(async (reset = false) => {
    if (!reset && (!exploreHasMore || exploreLoading)) return
    if (reset) {
      exploreCursorRef.current = null
      setExploreHasMore(true)
    }
    setExploreLoading(true)

    let query = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (exploreCursorRef.current) query = query.lt('created_at', exploreCursorRef.current)
    if (activePill)               query = query.contains('sport_tags', [activePill])
    if (searchQuery.trim())       query = query.ilike('content', `%${searchQuery.trim()}%`)

    const { data } = await query
    if (!data || data.length === 0) {
      setExploreHasMore(false)
      setExploreLoading(false)
      return
    }

    exploreCursorRef.current = data[data.length - 1].created_at

    const userIds = [...new Set(data.map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, region')
      .in('id', userIds)
    const profileMap: Record<string, unknown> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    const newPosts = data.map(row => normalizePost(row, profileMap[row.user_id]))
    if (reset) setExplorePosts(newPosts)
    else       setExplorePosts(prev => [...prev, ...newPosts])

    setExploreHasMore(data.length >= PAGE_SIZE)
    setExploreLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePill, searchQuery, exploreHasMore, exploreLoading])

  // ── Fetch following posts ────────────────────────────────────────────────
  const loadFollowPosts = useCallback(async (reset = false) => {
    if (!reset && (!followHasMore || followLoading)) return
    if (reset) {
      followCursorRef.current = null
      setFollowHasMore(true)
    }
    setFollowLoading(true)

    const buddyIds = buddyIdsRef.current
    if (buddyIds.length === 0) {
      setFollowLoading(false)
      return
    }

    let query = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at')
      .in('user_id', buddyIds)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (followCursorRef.current) query = query.lt('created_at', followCursorRef.current)

    const { data } = await query
    if (!data || data.length === 0) {
      setFollowHasMore(false)
      setFollowLoading(false)
      return
    }

    followCursorRef.current = data[data.length - 1].created_at

    const userIds = [...new Set(data.map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, region')
      .in('id', userIds)
    const profileMap: Record<string, unknown> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    const newPosts = data.map(row => normalizePost(row, profileMap[row.user_id]))
    if (reset) setFollowPosts(newPosts)
    else       setFollowPosts(prev => [...prev, ...newPosts])

    setFollowHasMore(data.length >= PAGE_SIZE)
    setFollowLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followHasMore, followLoading])

  // Initial load + reload on filter change
  useEffect(() => {
    loadExplorePosts(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePill, searchQuery])

  useEffect(() => {
    if (tab === 'volgend' && followPosts.length === 0) loadFollowPosts(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function openViewer(posts: PlayPost[], index: number) {
    setViewerPosts(posts)
    setViewerIndex(index)
    setViewerOpen(true)
  }

  function togglePill(pill: string) {
    setActivePill(prev => prev === pill ? null : pill)
  }

  const isDark = tab !== 'verkennen'
  const isFullscreen = tab === 'volgend' || tab === 'voorjou'

  return (
    <>
      {/* FullScreen Viewer overlay (Verkennen grid tap) */}
      {viewerOpen && (
        <FullScreenViewer
          posts={viewerPosts}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
        />
      )}

      {/* Page wrapper — full height when in vertical feed mode */}
      <div
        className="flex flex-col"
        style={{
          height:     isFullscreen ? '100%' : undefined,
          background: isDark ? '#000' : undefined,
        }}
      >
        {/* ── Top bar ────────────────────────────────────────────────── */}
        <div
          className="shrink-0 sticky top-0 z-20 border-b"
          style={{
            background:          isDark ? 'rgba(0,0,0,0.85)' : '#fff',
            borderColor:         isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            backdropFilter:      'blur(12px)',
            WebkitBackdropFilter:'blur(12px)',
          }}
        >
          {/* Tabs */}
          <div className="flex items-center px-4 pt-3 pb-0 gap-1">
            {(['verkennen', 'volgend', 'voorjou'] as Tab[]).map(t => {
              const labels: Record<Tab, string> = {
                verkennen: 'Verkennen',
                volgend:   'Volgend',
                voorjou:   'Voor jou',
              }
              const active = tab === t
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative pb-3 px-3 text-sm font-bold transition-colors"
                  style={{
                    color: active
                      ? (isDark ? '#fff' : '#111')
                      : (isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af'),
                  }}
                >
                  {labels[t]}
                  {active && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: '#E87722' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Search + pills — only on Verkennen */}
          {tab === 'verkennen' && (
            <div className="px-4 pb-3 space-y-2 mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op sport, naam of beschrijving..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-100 rounded-xl border-none outline-none placeholder:text-gray-400 font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
                {SPORT_PILLS.map(pill => {
                  const active = activePill === pill
                  return (
                    <button
                      key={pill}
                      onClick={() => togglePill(pill)}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                      style={{
                        background: active ? '#E87722' : '#F3F4F6',
                        color:      active ? '#fff'    : '#374151',
                      }}
                    >
                      {pill}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Tab content ────────────────────────────────────────────── */}

        {tab === 'verkennen' && (
          <div className="px-3 pt-3">
            <GridView
              posts={explorePosts}
              loading={exploreLoading}
              hasMore={exploreHasMore}
              onCardClick={i => openViewer(explorePosts, i)}
              onLoadMore={() => loadExplorePosts(false)}
            />
          </div>
        )}

        {tab === 'volgend' && (
          <VerticalFeed
            posts={followPosts}
            loading={followLoading}
            hasMore={followHasMore}
            onLoadMore={() => loadFollowPosts(false)}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(v => !v)}
            activeIdx={followActiveIdx}
            onActiveIdx={setFollowActiveIdx}
          />
        )}

        {tab === 'voorjou' && (
          <VoorJouFeed isMuted={isMuted} onMuteToggle={() => setIsMuted(v => !v)} />
        )}
      </div>
    </>
  )
}
