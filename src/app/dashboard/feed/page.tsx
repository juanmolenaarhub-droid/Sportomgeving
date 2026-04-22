'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FeedList, FeedCardSkeleton, type FeedPostData } from '@/components/feed/FeedCard'
import { StoriesRow, type StoryBuddy } from '@/components/feed/StoriesRow'
import { StoryViewer, type StoryFrame } from '@/components/feed/StoryViewer'
import { createClient } from '@/lib/supabase'

// ─── Design tokens ─────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

// ─── Post select fields ────────────────────────────────────────────────────────

const POST_SELECT = [
  'id', 'user_id', 'content', 'type', 'sport_tag',
  'media_url', 'media_type', 'thumbnail_url',
  'likes_count', 'created_at',
  'location', 'music', 'music_title', 'music_artist',
  'distance_km', 'duration_minutes', 'activity_name',
].join(', ')

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'Zojuist'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}u`
  return `${days}d`
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const supabase = createClient()

  const [userId,         setUserId]         = useState<string | null>(null)
  const [userName,       setUserName]       = useState('')
  const [userAvatarUrl,  setUserAvatarUrl]  = useState<string | null>(null)
  const [posts,          setPosts]          = useState<FeedPostData[]>([])
  const [buddies,        setBuddies]        = useState<StoryBuddy[]>([])
  const [loading,        setLoading]        = useState(true)
  const [loadingMore,    setLoadingMore]    = useState(false)
  const [hasMore,        setHasMore]        = useState(true)
  const [storyViewer,    setStoryViewer]    = useState<{
    stories: StoryFrame[]
    userName: string
    userAvatarUrl: string | null
  } | null>(null)
  const [storyLoading,   setStoryLoading]   = useState(false)

  const cursorRef  = useRef<string | null>(null)
  const PAGE_SIZE  = 8

  // ── Datamapping ──────────────────────────────────────────────────────────────

  const mapRawPosts = useCallback(async (
    raw: Record<string, unknown>[],
    uid: string,
    existingLiked: Set<string> = new Set(),
  ): Promise<FeedPostData[]> => {
    if (!raw.length) return []

    const authorIds = [...new Set(raw.map(p => p.user_id as string))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, region')
      .in('id', authorIds)
    const profileMap: Record<string, Record<string, unknown>> = Object.fromEntries(
      (profiles ?? []).map(p => [p.id, p])
    )

    // Check liked posts + comment counts
    const postIds = raw.map(p => p.id as string)
    const [{ data: likedData }, { data: commentRows }] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', uid).in('post_id', postIds),
      supabase.from('post_comments').select('post_id').in('post_id', postIds),
    ])
    const likedSet = new Set([
      ...existingLiked,
      ...(likedData ?? []).map((l: { post_id: string }) => l.post_id),
    ])
    const commentCountMap: Record<string, number> = {}
    for (const row of commentRows ?? []) {
      commentCountMap[(row as { post_id: string }).post_id] =
        (commentCountMap[(row as { post_id: string }).post_id] ?? 0) + 1
    }

    return raw.map(p => {
      const prof = profileMap[p.user_id as string] ?? {}
      return {
        id:              p.id as string,
        userId:          p.user_id as string,
        userName:        (prof.full_name ?? prof.username ?? 'Gebruiker') as string,
        userUsername:    (prof.username ?? null) as string | null,
        userAvatarUrl:   (prof.avatar_url ?? null) as string | null,
        userRegion:      (prof.region ?? null) as string | null,
        content:         (p.content ?? null) as string | null,
        type:            (p.type ?? null) as string | null,
        sport_tag:       (p.sport_tag ?? null) as string | null,
        media_url:       (p.media_url ?? null) as string | null,
        media_type:      (p.media_type ?? null) as string | null,
        thumbnail_url:   (p.thumbnail_url ?? null) as string | null,
        likes_count:     (p.likes_count ?? 0) as number,
        comments_count:  commentCountMap[p.id as string] ?? 0,
        created_at:      timeAgo(p.created_at as string),
        created_at_raw:  p.created_at as string,
        location:        (p.location ?? null) as string | null,
        music:           (p.music ?? null) as string | null,
        music_title:     (p.music_title ?? null) as string | null,
        music_artist:    (p.music_artist ?? null) as string | null,
        distance_km:     (p.distance_km ?? null) as number | null,
        duration_minutes:(p.duration_minutes ?? null) as number | null,
        activity_name:   (p.activity_name ?? null) as string | null,
        liked:           likedSet.has(p.id as string),
      } as FeedPostData
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Eerste laden ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Profiel
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .single()
      setUserName(profile?.full_name ?? profile?.username ?? 'Gebruiker')
      setUserAvatarUrl(profile?.avatar_url ?? null)

      // Buddy-IDs ophalen voor stories row
      const { data: buddyData } = await supabase
        .from('follow_requests')
        .select('from_user_id, to_user_id')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq('status', 'accepted')

      const buddyIds = (buddyData ?? []).map((b: { from_user_id: string; to_user_id: string }) =>
        b.from_user_id === user.id ? b.to_user_id : b.from_user_id
      )

      // Buddy-profielen voor stories
      if (buddyIds.length > 0) {
        const { data: buddyProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', buddyIds)
          .limit(12)
        setBuddies((buddyProfiles ?? []).map(b => ({
          id:        b.id,
          name:      b.full_name ?? b.username ?? 'Buddy',
          avatarUrl: b.avatar_url ?? null,
          seen:      false,
        })))
      }

      // Eerste batch posts — alle posts van alle gebruikers
      const { data: raw } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (raw && raw.length > 0) {
        const mapped = await mapRawPosts(raw as unknown as Record<string, unknown>[], user.id)
        setPosts(mapped)
        cursorRef.current = (raw[raw.length - 1] as unknown as Record<string, unknown>).created_at as string
        setHasMore(raw.length === PAGE_SIZE)
      } else {
        setHasMore(false)
      }

      setLoading(false)
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Meer laden ───────────────────────────────────────────────────────────────

  async function loadMore() {
    if (!userId || loadingMore || !hasMore || !cursorRef.current) return
    setLoadingMore(true)

    const { data: raw } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .lt('created_at', cursorRef.current)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (raw && raw.length > 0) {
      const likedIds = new Set(posts.filter(p => p.liked).map(p => p.id))
      const mapped = await mapRawPosts(raw as unknown as Record<string, unknown>[], userId, likedIds)
      setPosts(prev => [...prev, ...mapped])
      cursorRef.current = (raw[raw.length - 1] as unknown as Record<string, unknown>).created_at as string
      setHasMore(raw.length === PAGE_SIZE)
    } else {
      setHasMore(false)
    }

    setLoadingMore(false)
  }

  // ── Like toggling (optimistic) ────────────────────────────────────────────────

  function handleLikeToggle(postId: string, newLiked: boolean, newCount: number) {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, liked: newLiked, likes_count: newCount } : p)
    )
  }

  // ── Story viewer ─────────────────────────────────────────────────────────────

  async function handleStoryClick(buddyId: string) {
    const buddy = buddies.find(b => b.id === buddyId)
    if (!buddy || storyLoading) return
    setStoryLoading(true)

    const { data: raw } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('user_id', buddyId)
      .order('created_at', { ascending: false })
      .limit(10)

    setStoryLoading(false)
    if (!raw || raw.length === 0) return

    const frames: StoryFrame[] = (raw as unknown as Record<string, unknown>[]).map(p => ({
      id:          p.id as string,
      mediaUrl:    (p.media_url ?? null) as string | null,
      mediaType:   (p.media_type ?? null) as string | null,
      thumbnailUrl:(p.thumbnail_url ?? null) as string | null,
      content:     (p.content ?? null) as string | null,
      createdAt:   timeAgo(p.created_at as string),
    }))

    setStoryViewer({ stories: frames, userName: buddy.name, userAvatarUrl: buddy.avatarUrl })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#F4F1E8', minHeight: '100vh' }}>

      {/* ── Editorial titelsectie ─────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 24px' }}>
        <p style={{
          ...DM,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'rgba(26,23,20,0.55)',
          marginBottom: 4,
        }}>
          VOOR JOU
        </p>
        <h1 style={{
          ...SYNE,
          fontWeight: 800,
          fontSize: 40,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: '#1A1714',
        }}>
          Discover
        </h1>
      </div>

      {/* ── Stories rij ───────────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 24px', overflowX: 'hidden' }}>
        <StoriesRow
          buddies={buddies}
          currentUserName={userName || 'G'}
          currentUserAvatarUrl={userAvatarUrl}
          onAddStory={() => {/* TODO: story maken */}}
          onStoryClick={handleStoryClick}
        />
      </div>

      {/* ── Feed ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Loading skeletons */}
        {loading && (
          <>
            <FeedCardSkeleton />
            <FeedCardSkeleton />
            <FeedCardSkeleton />
          </>
        )}

        {/* Posts */}
        {!loading && (
          <FeedList posts={posts} onLikeToggle={handleLikeToggle} />
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && <EmptyState />}

        {/* Laad meer */}
        {!loading && posts.length > 0 && (
          <div style={{ paddingBottom: 8 }}>
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  ...DM,
                  display: 'block',
                  width: '100%',
                  padding: '14px 24px',
                  background: loadingMore ? '#E8E1D3' : '#E8E1D3',
                  color: '#1A1714',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 999,
                  border: 'none',
                  cursor: loadingMore ? 'default' : 'pointer',
                  opacity: loadingMore ? 0.6 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                {loadingMore ? 'Laden…' : 'Laad meer'}
              </button>
            ) : (
              <p style={{
                ...DM,
                textAlign: 'center',
                fontSize: 13,
                color: 'rgba(26,23,20,0.40)',
                padding: '16px 0',
              }}>
                Je hebt alles gezien ✓
              </p>
            )}
          </div>
        )}

        {/* Ruimte voor floating nav */}
        <div style={{ height: 100 }} />
      </div>

      {/* Story loading indicator */}
      {storyLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 490,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#C4F542',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Story viewer */}
      {storyViewer && (
        <StoryViewer
          stories={storyViewer.stories}
          userName={storyViewer.userName}
          userAvatarUrl={storyViewer.userAvatarUrl}
          onClose={() => setStoryViewer(null)}
        />
      )}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      background: '#FAF6EE',
      borderRadius: 20,
      padding: 32,
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(26,23,20,0.06)',
    }}>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(26,23,20,0.50)',
        marginBottom: 8,
      }}>
        NOG LEEG
      </p>
      <h2 style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: 28,
        lineHeight: 1.0,
        color: '#1A1714',
        marginBottom: 12,
      }}>
        Vind je eerste buddy
      </h2>
      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        color: 'rgba(26,23,20,0.65)',
        lineHeight: 1.55,
        marginBottom: 24,
      }}>
        Zodra je matched met buddies zie je hun trainingen hier.
      </p>
      <Link
        href="/dashboard/find"
        style={{
          display: 'inline-block',
          background: '#2A2420',
          color: 'white',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          padding: '14px 24px',
          borderRadius: 999,
          textDecoration: 'none',
        }}
      >
        Buddy zoeken
      </Link>
    </div>
  )
}
