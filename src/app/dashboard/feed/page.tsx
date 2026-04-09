'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Clock,
  Flame, X, Send, Bookmark, Play, Camera, Video, Image as ImageIcon, Smile,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'

// ─── Types ────────────────────────────────────────────────────────────────────

type Story = {
  id: string
  user: { name: string }
  media_url?: string
  created_at: string
}

type Reel = {
  id: string
  user: { name: string }
  thumbnail_url: string
  caption: string
  sport_tag: string
  view_count: number
}

type Post = {
  id: string
  user: { name: string; region: string }
  content: string
  activity_type: string
  distance_km?: number
  duration_minutes?: number
  image_url?: string
  likes_count: number
  comments_count: number
  liked: boolean
  saved: boolean
  created_at: string
  comments: { user: string; text: string }[]
  showComments: boolean
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_STORIES: Story[] = [
  { id: 's1', user: { name: 'Tim van Berg' }, media_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80', created_at: '12 min geleden' },
  { id: 's2', user: { name: 'Sarah Jansen' }, media_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&q=80', created_at: '1 uur geleden' },
  { id: 's3', user: { name: 'Marco de Wit' }, media_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80', created_at: '2 uur geleden' },
  { id: 's4', user: { name: 'Lisa Hoek' }, media_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80', created_at: '3 uur geleden' },
  { id: 's5', user: { name: 'Kevin Storm' }, media_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80', created_at: '4 uur geleden' },
  { id: 's6', user: { name: 'Emma Kool' }, media_url: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=600&q=80', created_at: '5 uur geleden' },
]

const DEMO_REELS: Reel[] = [
  { id: 'r1', user: { name: 'Tim van Berg' }, thumbnail_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', caption: 'Interval training dag 3', sport_tag: 'Hardlopen', view_count: 1240 },
  { id: 'r2', user: { name: 'Sarah Jansen' }, thumbnail_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80', caption: '80km tocht langs de kust', sport_tag: 'Fietsen', view_count: 847 },
  { id: 'r3', user: { name: 'Marco de Wit' }, thumbnail_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80', caption: 'PR deadlift 160kg!', sport_tag: 'Gym', view_count: 3200 },
  { id: 'r4', user: { name: 'Lisa Hoek' }, thumbnail_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80', caption: 'Ochtend yoga flow', sport_tag: 'Yoga', view_count: 621 },
  { id: 'r5', user: { name: 'Kevin Storm' }, thumbnail_url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&q=80', caption: 'Open water zwemmen', sport_tag: 'Zwemmen', view_count: 988 },
]

const DEMO_POSTS: Post[] = [
  {
    id: '1', user: { name: 'Tim van Berg', region: 'Amsterdam' },
    content: 'Geweldige ochtendrun door het Vondelpark. De lucht was perfect en ik voelde me sterk vandaag. Wie wil er volgende week mee?',
    activity_type: 'run', distance_km: 10.4, duration_minutes: 52,
    image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    likes_count: 24, comments_count: 5, liked: false, saved: false, created_at: '2 minuten geleden',
    comments: [{ user: 'Sarah J.', text: 'Goed gedaan! Ik doe mee volgende week.' }, { user: 'Marco W.', text: 'Mooi tempo.' }],
    showComments: false,
  },
  {
    id: '2', user: { name: 'Sarah Jansen', region: 'Utrecht' },
    content: 'Vandaag 45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht. De route is een aanrader voor iedereen in de buurt van Utrecht.',
    activity_type: 'cycle', distance_km: 45, duration_minutes: 105,
    image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
    likes_count: 41, comments_count: 8, liked: true, saved: false, created_at: '1 uur geleden',
    comments: [{ user: 'Kevin S.', text: 'Die route ken ik! Prachtig inderdaad.' }],
    showComments: false,
  },
  {
    id: '3', user: { name: 'Marco de Wit', region: 'Rotterdam' },
    content: 'PR vandaag op deadlift: 160kg. Zes maanden hard werken heeft zijn vruchten afgeworpen. Op zoek naar een trainingsbuddy voor de komende maanden.',
    activity_type: 'gym',
    likes_count: 67, comments_count: 12, liked: false, saved: true, created_at: '3 uur geleden',
    comments: [{ user: 'Anna B.', text: 'Indrukwekkend!' }, { user: 'Tim vB.', text: 'Goed werk, stuur me een bericht.' }],
    showComments: false,
  },
  {
    id: '4', user: { name: 'Lisa Hoek', region: 'Amsterdam' },
    content: 'Zondagochtend yoga in het park. Er is niets beter dan buiten bewegen terwijl de stad nog slaapt. Wie wil volgende week ook komen? We starten om 8:00 bij het Amstelpark.',
    activity_type: 'yoga',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    likes_count: 89, comments_count: 21, liked: false, saved: false, created_at: 'Gisteren',
    comments: [{ user: 'Emma K.', text: 'Ik kom! Moet ik een matje meenemen?' }, { user: 'Lisa H.', text: 'Nee, ik heb extra matten.' }],
    showComments: false,
  },
  {
    id: '5', user: { name: 'Kevin Storm', region: 'Den Haag' },
    content: 'Open water zwemmen bij Scheveningen. 2,5km in 38 minuten — nieuwe persoonlijk record! De zee was rustig en het water lekker fris.',
    activity_type: 'swim', distance_km: 2.5, duration_minutes: 38,
    image_url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
    likes_count: 55, comments_count: 9, liked: false, saved: false, created_at: 'Gisteren',
    comments: [{ user: 'Marco dW.', text: 'Respect! Koud water, goed gedaan.' }],
    showComments: false,
  },
  {
    id: '6', user: { name: 'Emma Kool', region: 'Eindhoven' },
    content: 'Na 3 maanden blessure eindelijk weer volledig terug op het veld. Voelt zo goed. Dankbaar voor iedereen die me heeft ondersteund!',
    activity_type: 'football',
    likes_count: 134, comments_count: 28, liked: true, saved: false, created_at: '2 dagen geleden',
    comments: [{ user: 'Tim vB.', text: 'Welkom terug!' }, { user: 'Sarah J.', text: 'Super blij voor je!' }],
    showComments: false,
  },
]

const ACTIVITY_TYPES = [
  { value: 'run', label: 'Hardlopen' }, { value: 'cycle', label: 'Fietsen' },
  { value: 'swim', label: 'Zwemmen' }, { value: 'gym', label: 'Gym' },
  { value: 'tennis', label: 'Tennis' }, { value: 'football', label: 'Voetbal' },
  { value: 'yoga', label: 'Yoga' }, { value: 'hiking', label: 'Wandelen' },
  { value: 'other', label: 'Anders' },
]

function getActivityLabel(type: string) {
  return ACTIVITY_TYPES.find(a => a.value === type)?.label ?? 'Sport'
}

function truncateName(name: string, max = 10) {
  const first = name.split(' ')[0]
  return first.length > max ? first.slice(0, max) + '…' : first
}

function formatViews(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────

function StoryViewer({ stories, startIndex, onClose }: { stories: Story[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const story = stories[current]
  const DURATION = 5000

  useEffect(() => {
    const t = setTimeout(() => {
      if (current < stories.length - 1) setCurrent(c => c + 1)
      else onClose()
    }, DURATION)
    return () => clearTimeout(t)
  }, [current, stories.length, onClose])

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    if (current > 0) setCurrent(c => c - 1)
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation()
    if (current < stories.length - 1) setCurrent(c => c + 1)
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <style>{`
        @keyframes story-fill { from { width: 0% } to { width: 100% } }
        .story-progress-active { animation: story-fill ${DURATION}ms linear forwards; }
      `}</style>

      <div className="relative w-full max-w-[400px] h-[100dvh] sm:h-[88vh] flex flex-col overflow-hidden sm:rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              {i < current && <div className="h-full w-full bg-white rounded-full" />}
              {i === current && <div key={current} className="story-progress-active h-full bg-white rounded-full" />}
            </div>
          ))}
        </div>

        {/* Background */}
        {story.media_url
          ? <img src={story.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#E87722] to-orange-900" />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full ring-2 ring-[#E87722] ring-offset-1 ring-offset-transparent overflow-hidden">
              <Avatar name={story.user.name} size="sm" className="w-full h-full" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{story.user.name}</p>
              <p className="text-white/55 text-xs">{story.created_at}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Tap zones */}
        <button className="absolute left-0 top-0 bottom-0 w-1/3 z-10" onClick={prev} />
        <button className="absolute right-0 top-0 bottom-0 w-1/3 z-10" onClick={next} />
      </div>
    </div>
  )
}

// ─── Reels Row ────────────────────────────────────────────────────────────────

function ReelsRow({ reels }: { reels: Reel[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 overflow-hidden">
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Play className="w-3 h-3 fill-[#E87722] text-[#E87722]" />
        Reels · Sportvideo&apos;s
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {reels.map(reel => (
          <div key={reel.id} className="shrink-0 w-[130px] cursor-pointer group" style={{ aspectRatio: '9/16' }}>
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-900">
              <img src={reel.thumbnail_url} alt={reel.caption}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />

              {/* Play icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#E87722]/80 transition-colors">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-white text-[11px] font-bold leading-tight truncate">{reel.user.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-white/70 text-[10px] font-medium">{reel.sport_tag}</span>
                  <span className="text-white/60 text-[10px]">{formatViews(reel.view_count)} views</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Upload modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSelectType }: { onClose: () => void; onSelectType: (type: 'story' | 'reel' | 'post') => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-black text-base">Wat wil je plaatsen?</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <button onClick={() => onSelectType('story')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-[#E87722] hover:bg-orange-50 transition-all group text-left">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E87722] to-orange-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-black text-sm">Verhaal maken</p>
              <p className="text-xs text-gray-400 mt-0.5">Verdwijnt automatisch na 24 uur</p>
            </div>
          </button>

          <button onClick={() => onSelectType('reel')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-[#E87722] hover:bg-orange-50 transition-all group text-left">
            <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center shrink-0">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-black text-sm">Reel plaatsen</p>
              <p className="text-xs text-gray-400 mt-0.5">Sportvideo — blijft permanent staan</p>
            </div>
          </button>

          <button onClick={() => onSelectType('post')}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-[#E87722] hover:bg-orange-50 transition-all group text-left">
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-black text-black text-sm">Post plaatsen</p>
              <p className="text-xs text-gray-400 mt-0.5">Foto of tekst — blijft in jouw profiel</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── File upload modal (story/reel) ───────────────────────────────────────────

function MediaUploadModal({ type, onClose }: { type: 'story' | 'reel'; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')
  const [sportTag, setSportTag] = useState('run')

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-black text-black text-base">
            {type === 'story' ? 'Verhaal maken' : 'Reel plaatsen'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <button onClick={() => fileRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-[#E87722] transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-orange-50">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              {type === 'story' ? <Camera className="w-5 h-5 text-[#E87722]" /> : <Video className="w-5 h-5 text-[#E87722]" />}
            </div>
            <p className="text-sm font-semibold text-gray-500">Klik om te uploaden</p>
            <p className="text-xs text-gray-400">{type === 'story' ? 'Foto of video (max 30 sec)' : 'Video (9:16 verhouding)'}</p>
          </button>
          <input ref={fileRef} type="file" accept={type === 'story' ? 'image/*,video/*' : 'video/*'} className="hidden" />

          {type === 'reel' && (
            <>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Onderschrift</label>
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Beschrijf je reel..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Sport</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.slice(0, 6).map(a => (
                    <button key={a.value} onClick={() => setSportTag(a.value)}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${sportTag === a.value ? 'border-[#E87722] bg-orange-50 text-[#E87722]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 text-sm">Annuleren</button>
          <button onClick={onClose} className="flex-1 bg-[#E87722] text-white font-bold py-3 rounded-xl hover:bg-[#d06a1a] text-sm">
            {type === 'story' ? 'Verhaal plaatsen' : 'Reel plaatsen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [showUploadChoice, setShowUploadChoice] = useState(false)
  const [uploadType, setUploadType] = useState<'story' | 'reel' | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newActivityType, setNewActivityType] = useState('run')
  const [newDistance, setNewDistance] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const mediaRef = useRef<HTMLInputElement>(null)

  function toggleLike(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 } : p))
  }
  function toggleSave(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p))
  }
  function toggleComments(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, showComments: !p.showComments } : p))
  }
  function submitComment(postId: string) {
    const text = commentInputs[postId]?.trim()
    if (!text) return
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, comments: [...p.comments, { user: 'Jij', text }], comments_count: p.comments_count + 1 }
      : p))
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
  }
  function createPost() {
    if (!newPostContent.trim()) return
    setPosts(prev => [{
      id: Date.now().toString(),
      user: { name: 'Jouw Naam', region: 'Jouw Stad' },
      content: newPostContent,
      activity_type: newActivityType,
      distance_km: newDistance ? parseFloat(newDistance) : undefined,
      duration_minutes: newDuration ? parseInt(newDuration) : undefined,
      likes_count: 0, comments_count: 0, liked: false, saved: false,
      created_at: 'Zojuist', comments: [], showComments: false,
    }, ...prev])
    setNewPostContent(''); setNewDistance(''); setNewDuration('')
    setShowCreatePost(false)
  }

  function handleUploadType(type: 'story' | 'reel' | 'post') {
    setShowUploadChoice(false)
    if (type === 'post') { setShowCreatePost(true); return }
    setUploadType(type)
  }

  // Build feed items: insert reels row every 5 posts
  const feedItems: Array<{ kind: 'post'; post: Post } | { kind: 'reels' }> = []
  posts.forEach((post, i) => {
    if (i > 0 && i % 5 === 0) feedItems.push({ kind: 'reels' })
    feedItems.push({ kind: 'post', post })
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Post composer balk ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        {/* Top row: avatar + text field */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-[#E87722]/20">
            <Avatar name="Jouw Naam" size="md" className="w-full h-full" />
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-gray-400 text-sm text-left hover:bg-gray-200 transition-colors"
          >
            Wat ben je aan het doen, Jouw Naam?
          </button>
        </div>

        {/* Bottom row: three action icons */}
        <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setUploadType('reel')}
            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Video className="w-3.5 h-3.5 text-red-500" />
            </div>
            <span className="text-[13px] font-semibold text-gray-600 hidden sm:inline">Video / Reel</span>
          </button>

          <button
            onClick={() => setShowCreatePost(true)}
            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-green-500" />
            </div>
            <span className="text-[13px] font-semibold text-gray-600 hidden sm:inline">Foto / Activiteit</span>
          </button>

          <button
            onClick={() => setShowCreatePost(true)}
            className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
              <Smile className="w-3.5 h-3.5 text-yellow-500" />
            </div>
            <span className="text-[13px] font-semibold text-gray-600 hidden sm:inline">Gevoel</span>
          </button>
        </div>
      </div>

      {/* ── Stories balk ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-4 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

          {/* Eigen verhaal knop */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button onClick={() => setShowUploadChoice(true)}
              className="relative w-[58px] h-[58px] rounded-full bg-gray-50 border-2 border-dashed border-gray-200 hover:border-[#E87722] flex items-center justify-center transition-colors group">
              <Camera className="w-5 h-5 text-gray-300 group-hover:text-[#E87722] transition-colors" />
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#E87722] rounded-full flex items-center justify-center text-white text-[11px] font-bold leading-none">+</span>
            </button>
            <span className="text-[11px] text-gray-400 font-medium w-[58px] text-center truncate">Verhaal maken</span>
          </div>

          {/* Connectie verhalen */}
          {DEMO_STORIES.map((story, index) => (
            <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0">
              <button onClick={() => setStoryIndex(index)} className="relative w-[58px] h-[58px] rounded-full">
                <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E87722] to-orange-300 p-[2.5px]">
                  <span className="block w-full h-full rounded-full bg-white p-[2px]">
                    <span className="block w-full h-full rounded-full overflow-hidden">
                      <Avatar name={story.user.name} size="lg" className="w-full h-full" />
                    </span>
                  </span>
                </span>
              </button>
              <span className="text-[11px] text-gray-600 font-semibold w-[58px] text-center truncate">
                {truncateName(story.user.name)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Story viewer */}
      {storyIndex !== null && (
        <StoryViewer stories={DEMO_STORIES} startIndex={storyIndex} onClose={() => setStoryIndex(null)} />
      )}

      {/* Upload keuze modal */}
      {showUploadChoice && (
        <UploadModal onClose={() => setShowUploadChoice(false)} onSelectType={handleUploadType} />
      )}

      {/* Media upload modal */}
      {uploadType && (
        <MediaUploadModal type={uploadType} onClose={() => setUploadType(null)} />
      )}

      {/* Post modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-black text-black text-lg">Nieuwe post</h3>
              <button onClick={() => setShowCreatePost(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={3} autoFocus
                placeholder="Wat heb je gedaan? Deel je training, resultaat of zoek een buddy..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E87722]" />

              {/* Foto / video uploaden */}
              <button
                type="button"
                onClick={() => mediaRef.current?.click()}
                className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 hover:border-[#E87722] rounded-xl px-4 py-3 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 group-hover:bg-orange-50 flex items-center justify-center shrink-0 transition-colors">
                  <ImageIcon className="w-4 h-4 text-green-500 group-hover:text-[#E87722] transition-colors" />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-[#E87722] font-medium transition-colors">Foto of video toevoegen</span>
              </button>
              <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden" />

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Sport</label>
                <div className="grid grid-cols-3 gap-2">
                  {ACTIVITY_TYPES.map(a => (
                    <button key={a.value} onClick={() => setNewActivityType(a.value)}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${newActivityType === a.value ? 'border-[#E87722] bg-orange-50 text-[#E87722]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Afstand (km)</label>
                  <input type="number" value={newDistance} onChange={e => setNewDistance(e.target.value)} placeholder="bv. 10.5"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Duur (minuten)</label>
                  <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="bv. 45"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreatePost(false)} className="flex-1 border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Annuleren</button>
              <button onClick={createPost} disabled={!newPostContent.trim()} className="flex-1 bg-[#E87722] text-white font-bold py-2.5 rounded-xl hover:bg-[#d06a1a] disabled:opacity-40 text-sm">Delen</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feed ── */}
      {feedItems.map((item, idx) => {
        if (item.kind === 'reels') {
          return <ReelsRow key={`reels-${idx}`} reels={DEMO_REELS} />
        }
        const post = item.post
        return (
          <article key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full shrink-0 cursor-pointer" onClick={() => {
                  const si = DEMO_STORIES.findIndex(s => s.user.name === post.user.name)
                  if (si !== -1) setStoryIndex(si)
                }}>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#E87722] to-orange-300 p-[2px]">
                    <span className="block w-full h-full rounded-full bg-white p-[2px]">
                      <span className="block w-full h-full rounded-full overflow-hidden">
                        <Avatar name={post.user.name} size="md" className="w-full h-full" />
                      </span>
                    </span>
                  </span>
                </div>
                <div>
                  <p className="font-black text-black text-sm">{post.user.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.user.region}</span>
                    <span>·</span><span>{post.created_at}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{getActivityLabel(post.activity_type)}</span>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>

            {/* Image */}
            {post.image_url && (
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                <img src={post.image_url} alt="post" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            )}

            {/* Activity stats (no image) */}
            {!post.image_url && (post.distance_km || post.duration_minutes) && (
              <div className="mx-5 mb-2">
                <div className="bg-gray-50 rounded-xl p-3 flex gap-4">
                  {post.distance_km && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#E87722]" /><div><p className="text-xs text-gray-400">Afstand</p><p className="text-sm font-black text-black">{post.distance_km} km</p></div></div>}
                  {post.duration_minutes && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#E87722]" /><div><p className="text-xs text-gray-400">Duur</p><p className="text-sm font-black text-black">{post.duration_minutes} min</p></div></div>}
                  {post.distance_km && post.duration_minutes && <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-[#E87722]" /><div><p className="text-xs text-gray-400">Tempo</p><p className="text-sm font-black text-black">{Math.floor(post.duration_minutes / post.distance_km)}:{String(Math.round((post.duration_minutes / post.distance_km % 1) * 60)).padStart(2, '0')} /km</p></div></div>}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-5 py-3">
              <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
            </div>

            {/* Stats below image */}
            {post.image_url && (post.distance_km || post.duration_minutes) && (
              <div className="px-5 pb-2 flex gap-4">
                {post.distance_km && <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"><MapPin className="w-3.5 h-3.5 text-[#E87722]" />{post.distance_km} km</span>}
                {post.duration_minutes && <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"><Clock className="w-3.5 h-3.5 text-[#E87722]" />{post.duration_minutes} min</span>}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
              <div className="flex items-center gap-1">
                <button onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-sm font-semibold ${post.liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-400 hover:bg-red-50'}`}>
                  <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500' : ''}`} /> {post.likes_count}
                </button>
                <button onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-blue-400 hover:bg-blue-50 transition-colors">
                  <MessageCircle className="w-4 h-4" /> {post.comments_count}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors">
                  <Share2 className="w-4 h-4" /> Delen
                </button>
              </div>
              <button onClick={() => toggleSave(post.id)}
                className={`p-2 rounded-xl transition-colors ${post.saved ? 'text-[#E87722]' : 'text-gray-300 hover:text-gray-500'}`}>
                <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-[#E87722]' : ''}`} />
              </button>
            </div>

            {/* Comments */}
            {post.showComments && (
              <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-3">
                {post.comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Avatar name={c.user} size="xs" />
                    <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                      <p className="text-xs font-bold text-black">{c.user}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <Avatar name="Jouw Naam" size="xs" />
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <input type="text" value={commentInputs[post.id] ?? ''}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                      placeholder="Schrijf een reactie..."
                      className="flex-1 bg-transparent text-xs text-black focus:outline-none" />
                    <button onClick={() => submitComment(post.id)} className="text-[#E87722] hover:text-[#d06a1a] transition-colors">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
