'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2, MoreHorizontal, ImageIcon, MapPin, Clock, Flame, X, Send, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

const ACTIVITY_TYPES = [
  { value: 'run', label: 'Hardlopen' },
  { value: 'cycle', label: 'Fietsen' },
  { value: 'swim', label: 'Zwemmen' },
  { value: 'gym', label: 'Gym' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'football', label: 'Voetbal' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'hiking', label: 'Wandelen' },
  { value: 'other', label: 'Anders' },
]

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

const DEMO_POSTS: Post[] = [
  {
    id: '1',
    user: { name: 'Tim van Berg', region: 'Amsterdam' },
    content: 'Geweldige ochtendrun door het Vondelpark. De lucht was perfect en ik voelde me sterk vandaag. Wie wil er volgende week mee?',
    activity_type: 'run',
    distance_km: 10.4,
    duration_minutes: 52,
    image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    likes_count: 24, comments_count: 5, liked: false, saved: false, created_at: '2 minuten geleden',
    comments: [
      { user: 'Sarah J.', text: 'Goed gedaan! Ik doe mee volgende week.' },
      { user: 'Marco W.', text: 'Mooi tempo.' },
    ],
    showComments: false,
  },
  {
    id: '2',
    user: { name: 'Sarah Jansen', region: 'Utrecht' },
    content: 'Vandaag 45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht. De route is een aanrader voor iedereen in de buurt van Utrecht.',
    activity_type: 'cycle',
    distance_km: 45,
    duration_minutes: 105,
    image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80',
    likes_count: 41, comments_count: 8, liked: true, saved: false, created_at: '1 uur geleden',
    comments: [
      { user: 'Kevin S.', text: 'Die route ken ik! Prachtig inderdaad.' },
    ],
    showComments: false,
  },
  {
    id: '3',
    user: { name: 'Marco de Wit', region: 'Rotterdam' },
    content: 'PR vandaag op deadlift: 160kg. Zes maanden hard werken heeft zijn vruchten afgeworpen. Op zoek naar een trainingsbuddy voor de komende maanden.',
    activity_type: 'gym',
    likes_count: 67, comments_count: 12, liked: false, saved: true, created_at: '3 uur geleden',
    comments: [
      { user: 'Anna B.', text: 'Indrukwekkend!' },
      { user: 'Tim vB.', text: 'Goed werk, stuur me een bericht.' },
    ],
    showComments: false,
  },
  {
    id: '4',
    user: { name: 'Lisa Hoek', region: 'Amsterdam' },
    content: 'Zondagochtend yoga in het park. Er is niets beter dan buiten bewegen terwijl de stad nog slaapt. Wie wil volgende week ook komen? We starten om 8:00 bij het Amstelpark.',
    activity_type: 'yoga',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    likes_count: 89, comments_count: 21, liked: false, saved: false, created_at: 'Gisteren',
    comments: [
      { user: 'Emma K.', text: 'Ik kom! Moet ik een matje meenemen?' },
      { user: 'Lisa H.', text: 'Nee, ik heb extra matten.' },
    ],
    showComments: false,
  },
]

function getActivityLabel(type: string) {
  return ACTIVITY_TYPES.find(a => a.value === type)?.label ?? 'Sport'
}

// ─── Story viewer ────────────────────────────────────────────────────────────
function StoryViewer({ posts, startIndex, onClose }: { posts: Post[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const post = posts[current]

  function prev() { if (current > 0) { setCurrent(c => c - 1) } }
  function next() { if (current < posts.length - 1) { setCurrent(c => c + 1) } else { onClose() } }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-sm h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {posts.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div className={`h-full bg-white rounded-full ${i <= current ? 'w-full' : 'w-0'}`} />
            </div>
          ))}
        </div>

        {post.image_url
          ? <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#E87722] to-orange-900" />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

        <div className="relative z-10 flex items-center justify-between p-4 pt-8">
          <div className="flex items-center gap-3">
            <Avatar name={post.user.name} size="sm" className="border-2 border-[#E87722]" />
            <div>
              <p className="text-white font-bold text-sm">{post.user.name}</p>
              <p className="text-white/60 text-xs">{post.created_at}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {(post.distance_km || post.duration_minutes) && (
          <div className="relative z-10 mx-4 mt-2">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 flex gap-6">
              {post.distance_km && <div className="text-center"><p className="text-white font-black text-lg">{post.distance_km} km</p><p className="text-white/60 text-xs">Afstand</p></div>}
              {post.duration_minutes && <div className="text-center"><p className="text-white font-black text-lg">{post.duration_minutes} min</p><p className="text-white/60 text-xs">Duur</p></div>}
              <div className="text-center"><p className="text-white font-black text-sm">{getActivityLabel(post.activity_type)}</p><p className="text-white/60 text-xs">Sport</p></div>
            </div>
          </div>
        )}

        <div className="relative z-10 mt-auto p-5">
          <p className="text-white text-sm leading-relaxed mb-4">{post.content}</p>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-white/80 text-sm font-semibold"><Heart className="w-5 h-5" /> {post.likes_count}</button>
            <button className="flex items-center gap-2 text-white/80 text-sm font-semibold"><MessageCircle className="w-5 h-5" /> {post.comments_count}</button>
          </div>
        </div>

        <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" />
        <button onClick={next} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" />
        {current > 0 && <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-white" /></button>}
        {current < posts.length - 1 && <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center"><ChevronRight className="w-4 h-4 text-white" /></button>}
      </div>
    </div>
  )
}

// ─── Hoofdpagina ─────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [newPostContent, setNewPostContent] = useState('')
  const [newActivityType, setNewActivityType] = useState('run')
  const [newDistance, setNewDistance] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})

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
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, { user: 'Jij', text }], comments_count: p.comments_count + 1 } : p))
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Stories balk */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-4 overflow-x-auto pb-1">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button onClick={() => setShowCreatePost(true)} className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 hover:border-[#E87722] flex items-center justify-center transition-colors bg-gray-50">
              <span className="text-xl font-light text-gray-400">+</span>
            </button>
            <span className="text-xs text-gray-400 font-medium">Jij</span>
          </div>
          {posts.map((post, index) => (
            <div key={post.id} className="flex flex-col items-center gap-1.5 shrink-0">
              <button onClick={() => setStoryIndex(index)} className="relative w-14 h-14 rounded-full">
                <span className="absolute inset-0 rounded-full bg-[#E87722] blur-[5px] opacity-50 animate-pulse" />
                <span className="absolute inset-0 rounded-full ring-[3px] ring-[#E87722]" />
                <span className="absolute inset-[3px] rounded-full ring-2 ring-white" />
                <span className="relative w-full h-full rounded-full overflow-hidden">
                  <Avatar name={post.user.name} size="lg" className="w-full h-full" />
                </span>
              </button>
              <span className="text-xs text-gray-600 font-semibold w-14 text-center truncate">
                {post.user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {storyIndex !== null && (
        <StoryViewer posts={posts} startIndex={storyIndex} onClose={() => setStoryIndex(null)} />
      )}

      {/* Post aanmaken */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:border-gray-200 transition-colors" onClick={() => setShowCreatePost(true)}>
        <div className="flex items-center gap-3">
          <Avatar name="Jouw Naam" size="md" />
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-gray-400 text-sm">Deel een training of activiteit...</div>
          <button className="p-2 text-gray-400 hover:text-[#E87722] transition-colors"><ImageIcon className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Post modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-black text-black text-lg">Nieuwe post</h3>
              <button onClick={() => setShowCreatePost(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={4} autoFocus
                placeholder="Wat heb je gedaan? Deel je training, resultaat of zoek een buddy..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sport</label>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Afstand (km)</label>
                  <input type="number" value={newDistance} onChange={e => setNewDistance(e.target.value)} placeholder="bv. 10.5"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Duur (minuten)</label>
                  <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="bv. 45"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowCreatePost(false)} className="flex-1 border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 text-sm">Annuleren</button>
              <button onClick={createPost} disabled={!newPostContent.trim()} className="flex-1 bg-[#E87722] text-white font-bold py-2.5 rounded-xl hover:bg-[#d06a1a] disabled:opacity-40 text-sm">Plaatsen</button>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.map((post, index) => (
        <article key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setStoryIndex(index)} className="relative w-11 h-11 rounded-full shrink-0">
                <span className="absolute inset-0 rounded-full bg-[#E87722] blur-[4px] opacity-40" />
                <span className="absolute inset-0 rounded-full ring-2 ring-[#E87722]" />
                <span className="absolute inset-[2px] rounded-full ring-2 ring-white" />
                <span className="relative w-full h-full rounded-full overflow-hidden">
                  <Avatar name={post.user.name} size="md" className="w-full h-full" />
                </span>
              </button>
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

          {post.image_url && (
            <div className="relative w-full aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => setStoryIndex(index)}>
              <img src={post.image_url} alt="post" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          )}

          {!post.image_url && (post.distance_km || post.duration_minutes) && (
            <div className="mx-5 mb-2">
              <div className="bg-gray-50 rounded-xl p-3 flex gap-4">
                {post.distance_km && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#E87722]" /><div><p className="text-xs text-gray-400">Afstand</p><p className="text-sm font-black text-black">{post.distance_km} km</p></div></div>}
                {post.duration_minutes && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#E87722]" /><div><p className="text-xs text-gray-400">Duur</p><p className="text-sm font-black text-black">{post.duration_minutes} min</p></div></div>}
                {post.distance_km && post.duration_minutes && <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-[#E87722]" /><div><p className="text-xs text-gray-400">Tempo</p><p className="text-sm font-black text-black">{Math.floor(post.duration_minutes / post.distance_km)}:{String(Math.round((post.duration_minutes / post.distance_km % 1) * 60)).padStart(2, '0')} /km</p></div></div>}
              </div>
            </div>
          )}

          <div className="px-5 py-3">
            <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
          </div>

          {post.image_url && (post.distance_km || post.duration_minutes) && (
            <div className="px-5 pb-2 flex gap-4">
              {post.distance_km && <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"><MapPin className="w-3.5 h-3.5 text-[#E87722]" />{post.distance_km} km</span>}
              {post.duration_minutes && <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"><Clock className="w-3.5 h-3.5 text-[#E87722]" />{post.duration_minutes} min</span>}
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-sm font-semibold ${post.liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-400 hover:bg-red-50'}`}>
                <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500' : ''}`} /> {post.likes_count}
              </button>
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-blue-400 hover:bg-blue-50 transition-colors">
                <MessageCircle className="w-4 h-4" /> {post.comments_count}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors">
                <Share2 className="w-4 h-4" /> Delen
              </button>
            </div>
            <button onClick={() => toggleSave(post.id)} className={`p-2 rounded-xl transition-colors ${post.saved ? 'text-[#E87722]' : 'text-gray-300 hover:text-gray-500'}`}>
              <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-[#E87722]' : ''}`} />
            </button>
          </div>

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
                  <input type="text" value={commentInputs[post.id] ?? ''} onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && submitComment(post.id)} placeholder="Schrijf een reactie..."
                    className="flex-1 bg-transparent text-xs text-black focus:outline-none" />
                  <button onClick={() => submitComment(post.id)} className="text-[#E87722] hover:text-[#d06a1a] transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
