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

type Tab = 'ontdekken' | 'volgend' | 'voorjou'

const SPORT_PILLS = [
  'Hardlopen', 'Fietsen', 'Zwemmen', 'Gym', 'Yoga',
  'Padel', 'Voetbal', 'Boksen', 'Klimmen', 'Tennis',
]

const PAGE_SIZE = 20

export default function PlayPage() {
  const supabase = createClient()

  const [tab,         setTab]         = useState<Tab>('ontdekken')
  const [searchQuery, setSearchQuery] = useState('')
  const [activePill,  setActivePill]  = useState<string | null>(null)
  const [isMuted,     setIsMuted]     = useState(true)

  // Ontdekken state
  const [explorePosts,   setExplorePosts]   = useState<PlayPost[]>([])
  const [exploreLoading, setExploreLoading] = useState(false)
  const [exploreHasMore, setExploreHasMore] = useState(true)
  const exploreCursorRef = useRef<string | null>(null)

  // Volgend state
  const [followPosts,     setFollowPosts]     = useState<PlayPost[]>([])
  const [followLoading,   setFollowLoading]   = useState(false)
  const [followHasMore,   setFollowHasMore]   = useState(true)
  const [followActiveIdx, setFollowActiveIdx] = useState(0)
  const followCursorRef = useRef<string | null>(null)

  // Buddy IDs in state so effects react when they arrive
  const [buddyIds, setBuddyIds] = useState<string[]>([])

  // Viewer (Ontdekken grid tap)
  const [viewerPosts, setViewerPosts] = useState<PlayPost[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerOpen,  setViewerOpen]  = useState(false)


  // ── Init: load buddy IDs ─────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: reqs } = await supabase
        .from('follow_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq('status', 'accepted')
      const ids = (reqs ?? []).map(r =>
        r.from_user_id === user.id ? r.to_user_id : r.from_user_id
      )
      setBuddyIds([user.id, ...ids])
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Fetch ontdekken posts ────────────────────────────────────────────────
  const loadExplorePosts = useCallback(async (reset = false) => {
    if (!reset && (!exploreHasMore || exploreLoading)) return
    if (reset) { exploreCursorRef.current = null; setExploreHasMore(true) }
    setExploreLoading(true)

    let q = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (exploreCursorRef.current) q = q.lt('created_at', exploreCursorRef.current)
    if (activePill)               q = q.contains('sport_tags', [activePill])
    if (searchQuery.trim())       q = q.ilike('content', `%${searchQuery.trim()}%`)

    const { data } = await q
    if (!data || data.length === 0) { setExploreHasMore(false); setExploreLoading(false); return }
    exploreCursorRef.current = data[data.length - 1].created_at

    const ids = [...new Set(data.map(p => p.user_id))]
    const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, region').in('id', ids)
    const pm: Record<string, unknown> = {}
    for (const p of profs ?? []) pm[p.id] = p
    const posts = data.map(r => normalizePost(r, pm[r.user_id]))

    if (reset) setExplorePosts(posts)
    else       setExplorePosts(prev => [...prev, ...posts])
    setExploreHasMore(data.length >= PAGE_SIZE)
    setExploreLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePill, searchQuery, exploreHasMore, exploreLoading])

  // ── Fetch volgend posts ──────────────────────────────────────────────────
  const loadFollowPosts = useCallback(async (reset = false, ids?: string[]) => {
    const resolvedIds = ids ?? buddyIds
    if (resolvedIds.length === 0) return
    if (!reset && (!followHasMore || followLoading)) return
    if (reset) { followCursorRef.current = null; setFollowHasMore(true) }
    setFollowLoading(true)

    let q = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at')
      .in('user_id', resolvedIds)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (followCursorRef.current) q = q.lt('created_at', followCursorRef.current)

    const { data } = await q
    if (!data || data.length === 0) { setFollowHasMore(false); setFollowLoading(false); return }
    followCursorRef.current = data[data.length - 1].created_at

    const ids2 = [...new Set(data.map(p => p.user_id))]
    const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url, region').in('id', ids2)
    const pm: Record<string, unknown> = {}
    for (const p of profs ?? []) pm[p.id] = p
    const posts = data.map(r => normalizePost(r, pm[r.user_id]))

    if (reset) setFollowPosts(posts)
    else       setFollowPosts(prev => [...prev, ...posts])
    setFollowHasMore(data.length >= PAGE_SIZE)
    setFollowLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buddyIds, followHasMore, followLoading])

  // Reload explore on filter change
  useEffect(() => { loadExplorePosts(true) }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [activePill, searchQuery])

  // Load volgend when buddy IDs arrive
  useEffect(() => {
    if (buddyIds.length > 0 && followPosts.length === 0) loadFollowPosts(true, buddyIds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buddyIds])

  // Load volgend on tab switch (IDs might already be available)
  useEffect(() => {
    if (tab === 'volgend' && buddyIds.length > 0 && followPosts.length === 0) loadFollowPosts(true, buddyIds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const isDark = tab !== 'ontdekken'

  return (
    <>
      {viewerOpen && (
        <FullScreenViewer
          posts={viewerPosts}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
        />
      )}

      {/*
        Stable wrapper — structure NEVER changes between tabs.
        flex-1 min-h-0 fills the layout's flex-1 flex-col overflow-hidden container.
      */}
      <div
        className="flex flex-col flex-1 min-h-0"
        style={{ background: isDark ? '#000' : undefined }}
      >
        {/* ── Tab bar — always sticky, always the same DOM position ── */}
        <div
          className="shrink-0 sticky top-0 z-20 border-b"
          style={{
            background:           isDark ? 'rgba(0,0,0,0.88)' : '#fff',
            borderColor:          isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            backdropFilter:       'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center px-4 pt-3 pb-0 gap-1">
            {(['ontdekken', 'volgend', 'voorjou'] as Tab[]).map(t => {
              const labels: Record<Tab, string> = { ontdekken: 'Ontdekken', volgend: 'Volgend', voorjou: 'Voor jou' }
              const active = tab === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setTab(t) }}
                  className="relative pb-3 px-3 text-sm font-bold transition-colors select-none"
                  style={{
                    color: active
                      ? (isDark ? '#fff'  : '#111')
                      : (isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af'),
                  }}
                >
                  {labels[t]}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: '#E87722' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Search + pills — Ontdekken only */}
          {tab === 'ontdekken' && (
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
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
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
                      type="button"
                      onClick={() => setActivePill(prev => prev === pill ? null : pill)}
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                      style={{ background: active ? '#E87722' : '#F3F4F6', color: active ? '#fff' : '#374151' }}
                    >
                      {pill}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/*
          ── Content panels — ALL THREE always in DOM ──────────────────
          CSS display controls visibility. No mount/unmount = no
          lifecycle side-effects that could interfere with navigation.
        */}

        {/* Ontdekken */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ display: tab === 'ontdekken' ? 'block' : 'none' }}
        >
          <div className="px-3 pt-3">
            <GridView
              posts={explorePosts}
              loading={exploreLoading}
              hasMore={exploreHasMore}
              onCardClick={i => { setViewerPosts(explorePosts); setViewerIndex(i); setViewerOpen(true) }}
              onLoadMore={() => loadExplorePosts(false)}
            />
          </div>
        </div>

        {/* Volgend — always mounted, isVisible controls play + display */}
        <VerticalFeed
          posts={followPosts}
          loading={followLoading}
          hasMore={followHasMore}
          onLoadMore={() => loadFollowPosts(false)}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
          activeIdx={followActiveIdx}
          onActiveIdx={setFollowActiveIdx}
          isVisible={tab === 'volgend'}
        />

        {/* Voor jou — always mounted, isVisible controls play + display */}
        <VoorJouFeed
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
          isVisible={tab === 'voorjou'}
        />
      </div>
    </>
  )
}
