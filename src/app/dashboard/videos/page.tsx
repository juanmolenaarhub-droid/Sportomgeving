'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Heart, MessageCircle, Share2,
  Volume2, VolumeX, Music2, Plus, Play,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'

type VideoItem = {
  id: string
  src: string
  thumbnailUrl?: string
  displayName: string
  username: string
  sport: string
  caption: string
  likes: number
  comments: number
  music: string
}

// ─── 10 demo video's als fallback (ForBigger series = kort + snel, ~3–12 MB) ──
const BASE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/'
const DEMO_VIDEOS: VideoItem[] = [
  { id:'v1',  src:`${BASE}ForBiggerFun.mp4`,       displayName:'Tim van Berg',   username:'tim_hardloopt', sport:'Hardlopen', caption:'Perfecte ochtendrun door het Vondelpark 🏃‍♂️ Wie wil mee?',              likes:1840, comments:47,  music:'Running Playlist — Spotify' },
  { id:'v2',  src:`${BASE}ForBiggerJoyrides.mp4`,  displayName:'Sarah Jansen',   username:'sarah_fietst',  sport:'Fietsen',   caption:'Nieuwe PR op de fiets! 42 km in 1:15 🚴‍♀️ Beste week ooit',           likes:934,  comments:23,  music:'Cycling Vibes — Spotify' },
  { id:'v3',  src:`${BASE}ForBiggerMeltdowns.mp4`, displayName:'Marco de Wit',   username:'marco_gym',     sport:'Gym',       caption:'Arm dag 💪 Pull-ups PR: 20 reps. Tip: langzaam omlaag = beter',         likes:2100, comments:89,  music:'Gym Hits 2026 — Spotify' },
  { id:'v4',  src:`${BASE}ForBiggerBlazes.mp4`,    displayName:'Lisa Hoek',      username:'lisa_yoga',     sport:'Yoga',      caption:'Morning flow 🧘‍♀️ 20 minuten en je voelt het verschil',                 likes:673,  comments:31,  music:'Yoga & Meditation — Spotify' },
  { id:'v5',  src:`${BASE}ForBiggerEscapes.mp4`,   displayName:'Kevin Storm',    username:'kevin_padel',   sport:'Padel',     caption:'Beste padel punt ooit? 🎾 Ja. Buddy gezocht voor de rematch!',          likes:3200, comments:142, music:'Court Energy — Spotify' },
  { id:'v6',  src:`${BASE}ForBiggerFun.mp4`,       displayName:'Joris Bakker',   username:'joris_zwemt',   sport:'Zwemmen',   caption:'100m vrije slag in 58 sec 🏊‍♂️ Doel: onder de 55. Wie traint mee?',    likes:780,  comments:44,  music:'Pool Vibes — Spotify' },
  { id:'v7',  src:`${BASE}ForBiggerJoyrides.mp4`,  displayName:'Bram van Dijk',  username:'bram_bokst',    sport:'Boksen',    caption:'Training 💥 3 min/ronde, 6 rondes. Boksen is beste full-body workout',  likes:2890, comments:97,  music:'Fight Night — Spotify' },
  { id:'v8',  src:`${BASE}ForBiggerMeltdowns.mp4`, displayName:'Nadia El-Amin',  username:'nadia_triathlon',sport:'Triathlon', caption:'Eerste triathlon klaar 🏆 Swim + bike + run in één dag. Nooit meer? Toch wel.', likes:5600, comments:318, music:'Beast Mode — Spotify' },
  { id:'v9',  src:`${BASE}ForBiggerBlazes.mp4`,    displayName:'Emma Kool',      username:'emma_klimt',    sport:'Klimmen',   caption:'Boulder 7A+ geflashed! 🧗‍♀️ Drie weken geprobeerd. Onbeschrijflijk',    likes:1230, comments:61,  music:'Send It — Spotify' },
  { id:'v10', src:`${BASE}ForBiggerEscapes.mp4`,   displayName:'Roos Vermeer',   username:'roos_hardloopt',sport:'Hardlopen', caption:'Halve marathon: 21 km in 1:58 🎉 Maanden van training betalen zich uit', likes:4100, comments:203, music:'Half Marathon Mix — Spotify' },
]

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─── VideoCard ────────────────────────────────────────────────────────────────
function VideoCard({
  video,
  isActive,
  isMuted,
  onMuteToggle,
}: {
  video: VideoItem
  isActive: boolean
  isMuted: boolean
  onMuteToggle: () => void
}) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const barRef     = useRef<HTMLDivElement>(null)
  const [liked,    setLiked]    = useState(false)
  const [likes,    setLikes]    = useState(video.likes)
  const [bounce,   setBounce]   = useState(false)
  const [paused,   setPaused]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded,   setLoaded]   = useState(false)
  const [hasError, setHasError] = useState(false)

  // ── Mount: force muted via DOM (React muted prop unreliable on mobile) ─────
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
  }, [])

  // ── Play / pause when card becomes active ─────────────────────────────────
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    if (isActive) {
      v.muted = true   // always start muted so autoplay policy allows it
      v.currentTime = 0
      const p = v.play()
      if (p !== undefined) {
        p.then(() => setPaused(false)).catch(() => setPaused(true))
      }
    } else {
      v.pause()
      setPaused(false)
      setProgress(0)
    }
  }, [isActive])

  // ── Mute toggle ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  // ── Progress bar ─────────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    function tick() {
      if (v!.duration) setProgress(v!.currentTime / v!.duration)
    }
    v.addEventListener('timeupdate', tick)
    return () => v.removeEventListener('timeupdate', tick)
  }, [])

  // ── Seek on progress bar tap ──────────────────────────────────────────────
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const v   = videoRef.current
    const bar = barRef.current
    if (!v || !bar || !v.duration) return
    const rect = bar.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }, [])

  // ── Tap video body to pause / resume ─────────────────────────────────────
  function handleTap() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.muted = isMuted
      v.play().then(() => setPaused(false)).catch(() => {})
    } else {
      v.pause()
      setPaused(true)
    }
  }

  // ── Play button (proper user-gesture target) ──────────────────────────────
  function handlePlayBtn(e: React.MouseEvent) {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = true   // must be muted for policy
    v.play()
      .then(() => { setPaused(false); setHasError(false) })
      .catch(() => setHasError(true))
  }

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation()
    setLiked(p => !p)
    setLikes(p => liked ? p - 1 : p + 1)
    setBounce(true)
    setTimeout(() => setBounce(false), 300)
  }

  return (
    <div className="relative w-full h-full bg-black select-none" onClick={handleTap}>

      {/* ── Video element ─────────────────────────────────────────── */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={video.src}
        poster={video.thumbnailUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
        onCanPlay={() => setLoaded(true)}
        onError={() => { setHasError(true); setLoaded(true) }}
      />

      {/* Loading spinner */}
      {isActive && !loaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <span className="text-white/60 text-sm">Video kan niet laden</span>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/80 pointer-events-none" />

      {/* ── Play button — real clickable target for user-gesture ─────── */}
      {paused && !hasError && (
        <button
          className="absolute inset-0 flex items-center justify-center"
          onClick={handlePlayBtn}
        >
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-7 h-7 text-white ml-1" />
          </div>
        </button>
      )}

      {/* ── Right actions — pushed up to clear mobile nav ────────────── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5"
        style={{ bottom: 108 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-11 h-11 rounded-full ring-2 ring-white overflow-hidden">
            <Avatar name={video.displayName} imageUrl={null} size="sm" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#E87722] rounded-full flex items-center justify-center ring-2 ring-black">
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <Heart
              className="w-6 h-6 transition-transform duration-150"
              style={{
                color: liked ? '#E87722' : 'white',
                fill:  liked ? '#E87722' : 'none',
                transform: bounce ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">{fmt(likes)}</span>
        </button>

        {/* Comment */}
        <button onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">{fmt(video.comments)}</span>
        </button>

        {/* Share */}
        <button onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-[11px] font-bold drop-shadow">Deel</span>
        </button>

        {/* Mute */}
        <button
          onClick={e => { e.stopPropagation(); onMuteToggle() }}
          className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm"
        >
          {isMuted
            ? <VolumeX className="w-5 h-5 text-white" />
            : <Volume2 className="w-5 h-5 text-white" />
          }
        </button>
      </div>

      {/* ── Bottom info — bottom-[88px] clears the mobile floating nav ── */}
      <div
        className="absolute left-4 right-16 space-y-1"
        style={{ bottom: 88 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-[14px] drop-shadow">@{video.username}</span>
          <span
            className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#E87722' }}
          >
            {video.sport}
          </span>
        </div>
        <p className="text-white/90 text-[13px] leading-snug drop-shadow line-clamp-2">{video.caption}</p>
        <div className="flex items-center gap-1.5">
          <Music2 className="w-3 h-3 text-white/60 shrink-0" />
          <span className="text-white/60 text-xs truncate">{video.music}</span>
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────── */}
      <div
        ref={barRef}
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/25 cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-white"
          style={{ width: `${progress * 100}%`, transition: 'width 0.1s linear' }}
        />
        {/* Scrubber dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md -translate-x-1/2"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VideosPage() {
  const supabase = createClient()
  const [videos, setVideos] = useState<VideoItem[]>(DEMO_VIDEOS)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch real video posts from DB; prepend them before the demo videos
  useEffect(() => {
    async function loadVideos() {
      const { data } = await supabase
        .from('posts')
        .select('id, user_id, content, sport_tag, media_url, thumbnail_url, likes_count, created_at, profiles(full_name, username)')
        .eq('media_type', 'video')
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30)

      if (!data || data.length === 0) return

      const dbVideos: VideoItem[] = data.map((p: any) => {
        const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        const displayName = prof?.full_name ?? prof?.username ?? 'Gebruiker'
        const username = (prof?.username ?? displayName).toLowerCase().replace(/\s+/g, '_')
        return {
          id: p.id,
          src: p.media_url,
          thumbnailUrl: p.thumbnail_url ?? undefined,
          displayName,
          username,
          sport: p.sport_tag ?? 'Sport',
          caption: p.content ?? '',
          likes: p.likes_count ?? 0,
          comments: 0,
          music: '',
        }
      })

      // Real videos first, then demo videos as fill
      setVideos([...dbVideos, ...DEMO_VIDEOS])
    }
    loadVideos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function onScroll() {
      const idx = Math.round(el!.scrollTop / el!.clientHeight)
      setActiveIndex(idx)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-scroll"
      style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {videos.map((video, i) => (
        <div
          key={video.id}
          className="w-full shrink-0"
          style={{ height: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
        >
          <VideoCard
            video={video}
            isActive={i === activeIndex}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(v => !v)}
          />
        </div>
      ))}
    </div>
  )
}
