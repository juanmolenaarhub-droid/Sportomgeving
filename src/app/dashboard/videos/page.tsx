'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Home } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { VerticalFeed } from './_components/VerticalFeed'
import { VoorJouFeed } from './_components/VoorJouFeed'
import { normalizePost } from './_components/types'
import type { PlayPost } from './_components/types'

type Tab = 'ontdekken' | 'volgend' | 'voorjou'

const TAB_LABELS: Record<Tab, string> = {
  ontdekken: 'Ontdekken',
  volgend:   'Volgend',
  voorjou:   'Voor jou',
}

const PAGE_SIZE = 20

export default function PlayPage() {
  const supabase = createClient()

  // Force black background on body so no cream bleeds through on iOS
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = '#000'
    document.documentElement.style.background = '#000'
    return () => {
      document.body.style.background = prev
      document.documentElement.style.background = ''
    }
  }, [])

  const [tab,            setTab]            = useState<Tab>('ontdekken')
  const [dropdownOpen,   setDropdownOpen]   = useState(false)
  const [showDropdownUI, setShowDropdownUI] = useState(true)
  const [isMuted,        setIsMuted]        = useState(true)
  const dropdownRef         = useRef<HTMLDivElement>(null)
  const hasUserSwitchedFeed = useRef(false)

  // ── Ontdekken ────────────────────────────────────────────────────────────────
  const [explorePosts,   setExplorePosts]   = useState<PlayPost[]>([])
  const [exploreLoading, setExploreLoading] = useState(false)
  const [exploreHasMore, setExploreHasMore] = useState(true)
  const [exploreIdx,     setExploreIdx]     = useState(0)
  const exploreCursorRef = useRef<string | null>(null)

  // ── Volgend ──────────────────────────────────────────────────────────────────
  const [followPosts,   setFollowPosts]   = useState<PlayPost[]>([])
  const [followLoading, setFollowLoading] = useState(false)
  const [followHasMore, setFollowHasMore] = useState(true)
  const [followIdx,     setFollowIdx]     = useState(0)
  const [buddyIds,      setBuddyIds]      = useState<string[]>([])
  const followCursorRef = useRef<string | null>(null)

  // ── Auto-hide dropdown na 3 video's zonder tab-switch ─────────────────────────
  useEffect(() => {
    const activeIdx = tab === 'ontdekken' ? exploreIdx : followIdx
    if (activeIdx >= 3 && !hasUserSwitchedFeed.current) {
      setShowDropdownUI(false)
    }
  }, [exploreIdx, followIdx, tab])

  // ── Sluit dropdown bij klik buiten ───────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Buddy IDs ─────────────────────────────────────────────────────────────────
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

  // ── Fetch ontdekken ───────────────────────────────────────────────────────────
  const loadExplorePosts = useCallback(async (reset = false) => {
    if (!reset && (!exploreHasMore || exploreLoading)) return
    if (reset) { exploreCursorRef.current = null; setExploreHasMore(true) }
    setExploreLoading(true)

    let q = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at, location')
      .eq('media_type', 'video')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (exploreCursorRef.current) q = q.lt('created_at', exploreCursorRef.current)

    const { data } = await q
    if (!data || data.length === 0) { setExploreHasMore(false); setExploreLoading(false); return }
    exploreCursorRef.current = data[data.length - 1].created_at

    const ids = [...new Set(data.map(p => p.user_id))]
    const { data: profs } = await supabase
      .from('profiles').select('id, full_name, username, avatar_url, region').in('id', ids)
    const pm: Record<string, unknown> = {}
    for (const p of profs ?? []) pm[p.id] = p
    const posts = data.map(r => normalizePost(r, pm[r.user_id]))

    if (reset) setExplorePosts(posts)
    else       setExplorePosts(prev => [...prev, ...posts])
    setExploreHasMore(data.length >= PAGE_SIZE)
    setExploreLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploreHasMore, exploreLoading])

  // ── Fetch volgend ─────────────────────────────────────────────────────────────
  const loadFollowPosts = useCallback(async (reset = false, ids?: string[]) => {
    const resolvedIds = ids ?? buddyIds
    if (resolvedIds.length === 0) return
    if (!reset && (!followHasMore || followLoading)) return
    if (reset) { followCursorRef.current = null; setFollowHasMore(true) }
    setFollowLoading(true)

    let q = supabase
      .from('posts')
      .select('id, user_id, content, sport_tags, sport_tag, media_url, media_type, thumbnail_url, media_items, likes_count, comments_count, view_count, created_at, location')
      .in('user_id', resolvedIds)
      .eq('media_type', 'video')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (followCursorRef.current) q = q.lt('created_at', followCursorRef.current)

    const { data } = await q
    if (!data || data.length === 0) { setFollowHasMore(false); setFollowLoading(false); return }
    followCursorRef.current = data[data.length - 1].created_at

    const ids2 = [...new Set(data.map(p => p.user_id))]
    const { data: profs } = await supabase
      .from('profiles').select('id, full_name, username, avatar_url, region').in('id', ids2)
    const pm: Record<string, unknown> = {}
    for (const p of profs ?? []) pm[p.id] = p
    const posts = data.map(r => normalizePost(r, pm[r.user_id]))

    if (reset) setFollowPosts(posts)
    else       setFollowPosts(prev => [...prev, ...posts])
    setFollowHasMore(data.length >= PAGE_SIZE)
    setFollowLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buddyIds, followHasMore, followLoading])

  useEffect(() => { loadExplorePosts(true) }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [])

  useEffect(() => {
    if (buddyIds.length > 0 && followPosts.length === 0) loadFollowPosts(true, buddyIds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buddyIds])

  useEffect(() => {
    if (tab === 'volgend' && buddyIds.length > 0 && followPosts.length === 0) loadFollowPosts(true, buddyIds)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // ── Tab switch — markeert als "actief gebruikt" ────────────────────────────────
  function handleTabSwitch(t: Tab) {
    hasUserSwitchedFeed.current = true
    setShowDropdownUI(true)
    setTab(t)
    setDropdownOpen(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}
    >
      {/* ── Feeds — all three always in DOM ────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        <VerticalFeed
          posts={explorePosts}
          loading={exploreLoading}
          hasMore={exploreHasMore}
          onLoadMore={() => loadExplorePosts(false)}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
          activeIdx={exploreIdx}
          onActiveIdx={setExploreIdx}
          isVisible={tab === 'ontdekken'}
          emptyTitle="Nog geen video's hier"
          emptyBody="Kom later terug voor sportcontent"
        />
        <VerticalFeed
          posts={followPosts}
          loading={followLoading}
          hasMore={followHasMore}
          onLoadMore={() => loadFollowPosts(false)}
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
          activeIdx={followIdx}
          onActiveIdx={setFollowIdx}
          isVisible={tab === 'volgend'}
          emptyTitle="Nog geen video's hier"
          emptyBody="Volg meer buddies om hun content te zien"
        />
        <VoorJouFeed
          isMuted={isMuted}
          onMuteToggle={() => setIsMuted(v => !v)}
          isVisible={tab === 'voorjou'}
        />
      </div>

      {/* ── Home knop — altijd zichtbaar linksboven ────────────────────────── */}
      <div style={{
        position: 'absolute', left: 16, zIndex: 31,
        top: 0,
        paddingTop: 'max(14px, env(safe-area-inset-top))',
      }}>
        <Link href="/dashboard/feed" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.28)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999,
            width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Home size={16} color="white" strokeWidth={2} />
          </div>
        </Link>
      </div>

      {/* ── Floating dropdown — alleen zichtbaar als showDropdownUI ────────── */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, zIndex: 30,
          top: 0,
          paddingTop: 'max(14px, env(safe-area-inset-top))',
          display: 'flex', justifyContent: 'center',
          transition: 'opacity 500ms',
          opacity: showDropdownUI ? 1 : 0,
          pointerEvents: showDropdownUI ? 'auto' : 'none',
        }}
      >
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {/* Trigger pill — glass */}
          <button
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              background: 'rgba(0,0,0,0.28)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              padding: '8px 16px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: 'white' }}>
              {TAB_LABELS[tab]}
            </span>
            <ChevronDown
              size={14} color="white" strokeWidth={2.5}
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms',
              }}
            />
          </button>

          {/* Dropdown menu — dark glass */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 18,
              padding: '6px 0',
              minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
            }}>
              {(['ontdekken', 'volgend', 'voorjou'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => handleTabSwitch(t)}
                  style={{
                    width: '100%',
                    padding: '10px 20px',
                    textAlign: 'left',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700, fontSize: 14,
                    color: tab === t ? '#E87722' : 'white',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
