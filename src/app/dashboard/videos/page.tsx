'use client'

import { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Music2, Plus } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

// ─── Demo video data ──────────────────────────────────────────────────────────
const DEMO_VIDEOS = [
  {
    id: 'v1',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    displayName: 'Tim van Berg',
    username: 'tim_hardloopt',
    sport: 'Hardlopen',
    caption: 'Perfecte ochtendrun door het Vondelpark 🏃‍♂️ Wie wil er volgende week mee?',
    likes: 1840,
    comments: 47,
    music: 'Running Playlist — Spotify',
  },
  {
    id: 'v2',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    displayName: 'Sarah Jansen',
    username: 'sarah_fietst',
    sport: 'Fietsen',
    caption: 'Nieuwe PR op de fiets! 42 km in 1 uur 15 🚴‍♀️ Dit was mijn beste week ooit',
    likes: 934,
    comments: 23,
    music: 'Cycling Vibes — Spotify',
  },
  {
    id: 'v3',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    displayName: 'Marco de Wit',
    username: 'marco_gym',
    sport: 'Gym',
    caption: 'Arm dag 💪 Pull-ups PR: 20 reps clean. Tip: langzaam omlaag = beter resultaat',
    likes: 2100,
    comments: 89,
    music: 'Gym Hits 2026 — Spotify',
  },
  {
    id: 'v4',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    displayName: 'Lisa Hoek',
    username: 'lisa_yoga',
    sport: 'Yoga',
    caption: 'Morning flow 🧘‍♀️ Start je dag goed. 20 minuten en je voelt het verschil',
    likes: 673,
    comments: 31,
    music: 'Yoga & Meditation — Spotify',
  },
  {
    id: 'v5',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    displayName: 'Kevin Storm',
    username: 'kevin_padel',
    sport: 'Padel',
    caption: 'Beste padel punt ooit? 🎾 Eerlijk: ja. Buddy gezocht voor de rematch!',
    likes: 3200,
    comments: 142,
    music: 'Court Energy — Spotify',
  },
  {
    id: 'v6',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    displayName: 'Roos Vermeer',
    username: 'roos_hardloopt',
    sport: 'Hardlopen',
    caption: 'Halve marathon gehaald! 21 km in 1:58 uur 🎉 Maanden van training betalen zich uit',
    likes: 4100,
    comments: 203,
    music: 'Half Marathon Mix — Spotify',
  },
  {
    id: 'v7',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    displayName: 'Joris Bakker',
    username: 'joris_zwemt',
    sport: 'Zwemmen',
    caption: '100m vrije slag in 58 seconden 🏊‍♂️ Doel: onder de 55. Wie traint er mee?',
    likes: 780,
    comments: 44,
    music: 'Pool Vibes — Spotify',
  },
  {
    id: 'v8',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    displayName: 'Nadia El-Amin',
    username: 'nadia_triathlon',
    sport: 'Triathlon',
    caption: 'Eerste triathlon klaar 🏆 Zwemmen + fietsen + hardlopen in één dag. Nooit meer? Toch wel.',
    likes: 5600,
    comments: 318,
    music: 'Triathlon Beast Mode — Spotify',
  },
  {
    id: 'v9',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    displayName: 'Bram van Dijk',
    username: 'bram_bokst',
    sport: 'Boksen',
    caption: 'Training session 💥 3 minuten per ronde, 6 rondes. Boksen is de beste full-body workout',
    likes: 2890,
    comments: 97,
    music: 'Fight Night — Spotify',
  },
  {
    id: 'v10',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    displayName: 'Emma Kool',
    username: 'emma_klimt',
    sport: 'Klimmen',
    caption: 'Boulder 7A+ eindelijk geflashed! 🧗‍♀️ Drie weken geprobeerd. Het gevoel is onbeschrijflijk',
    likes: 1230,
    comments: 61,
    music: 'Send It — Spotify',
  },
]

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ─── Single video card ────────────────────────────────────────────────────────
function VideoCard({
  video,
  isActive,
  isMuted,
  onMuteToggle,
}: {
  video: typeof DEMO_VIDEOS[number]
  isActive: boolean
  isMuted: boolean
  onMuteToggle: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(video.likes)
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (isActive) {
      v.currentTime = 0
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [isActive])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted
  }, [isMuted])

  function handleLike() {
    setLiked(p => !p)
    setLikes(p => liked ? p - 1 : p + 1)
    setBounce(true)
    setTimeout(() => setBounce(false), 300)
  }

  return (
    <div className="relative w-full h-full bg-black select-none">
      {/* Video */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={video.src}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="auto"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/75 pointer-events-none" />

      {/* Right side actions */}
      <div className="absolute right-3 flex flex-col items-center gap-5" style={{ bottom: 96 }}>
        {/* Avatar + follow */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full ring-2 ring-white overflow-hidden">
            <Avatar name={video.displayName} imageUrl={null} size="sm" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#E87722] rounded-full flex items-center justify-center ring-2 ring-black">
            <Plus className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
            <Heart
              className="w-7 h-7 transition-all duration-150"
              style={{
                color: liked ? '#E87722' : 'white',
                fill: liked ? '#E87722' : 'none',
                transform: bounce ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{formatCount(likes)}</span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{formatCount(video.comments)}</span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">Deel</span>
        </button>

        {/* Mute toggle */}
        <button
          onClick={onMuteToggle}
          className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center"
        >
          {isMuted
            ? <VolumeX className="w-5 h-5 text-white" />
            : <Volume2 className="w-5 h-5 text-white" />
          }
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-4 right-20 space-y-1.5" style={{ bottom: 88 }}>
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-[15px] drop-shadow">@{video.username}</span>
          <span
            className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#E87722' }}
          >
            {video.sport}
          </span>
        </div>
        <p className="text-white/90 text-sm leading-snug drop-shadow">{video.caption}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Music2 className="w-3 h-3 text-white/70 shrink-0" />
          <span className="text-white/70 text-xs truncate">{video.music}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VideosPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function onScroll() {
      const { scrollTop, clientHeight } = container!
      const idx = Math.round(scrollTop / clientHeight)
      setActiveIndex(idx)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Full-screen overlay that sits above layout padding but below header + nav */}
      <div
        ref={containerRef}
        className="fixed left-0 right-0 overflow-y-scroll"
        style={{
          top: 64,       // below sticky header
          bottom: 0,
          zIndex: 40,
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {DEMO_VIDEOS.map((video, i) => (
          <div
            key={video.id}
            style={{
              height: 'calc(100vh - 64px)',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
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

      {/* Empty spacer so layout doesn't collapse */}
      <div style={{ height: 'calc(100vh - 64px)' }} />
    </>
  )
}
