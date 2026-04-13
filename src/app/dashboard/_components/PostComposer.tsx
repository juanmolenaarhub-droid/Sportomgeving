'use client'

import { useState, useRef, useCallback } from 'react'
import {
  X, ArrowLeft, MessageSquare, Activity, CalendarDays,
  Star, HelpCircle, ImageIcon, MapPin, UserRoundPlus,
  Music2, ChevronRight, Send,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = 'post' | 'activity' | 'meetup' | 'challenge' | 'question' | 'media'

type PostComposerProps = {
  isOpen: boolean
  onClose: () => void
  onPosted?: () => void
  initialType?: PostType
  skipToStep2?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const POST_TYPES: {
  key: PostType
  label: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}[] = [
  { key: 'post',      label: 'Bericht',    icon: MessageSquare, iconBg: '#EDEAE5', iconColor: '#6B7280' },
  { key: 'activity',  label: 'Activiteit', icon: Activity,      iconBg: '#FFF0E5', iconColor: '#E87722' },
  { key: 'meetup',    label: 'Meetup',     icon: CalendarDays,  iconBg: '#EFF6FF', iconColor: '#3B82F6' },
  { key: 'challenge', label: 'Challenge',  icon: Star,          iconBg: '#FFF7ED', iconColor: '#F59E0B' },
  { key: 'question',  label: 'Vraag',      icon: HelpCircle,    iconBg: '#FAF5FF', iconColor: '#8B5CF6' },
  { key: 'media',     label: 'Foto/Video', icon: ImageIcon,     iconBg: '#F0FDF4', iconColor: '#16A34A' },
]

const SPORTS = [
  'Hardlopen', 'Fietsen', 'Zwemmen', 'Gym', 'Voetbal',
  'Tennis', 'Padel', 'Yoga', 'Triathlon', 'Boksen', 'Klimmen', 'Overig',
]

const INTEGRATIONS = [
  { name: 'Strava',  dot: '#E87722' },
  { name: 'Garmin',  dot: '#3B82F6' },
  { name: 'Apple Health', dot: '#111111' },
  { name: 'Spotify', dot: '#16A34A' },
  { name: 'Wahoo',   dot: '#DC2626' },
]

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? '#E87722' : '#DDD' }}
    >
      <span
        className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: on ? 'translateX(21px)' : 'translateX(3px)' }}
      />
    </button>
  )
}

// ─── Step 1 — type picker ─────────────────────────────────────────────────────

function StepOne({
  selected,
  onSelect,
  onContinue,
  onClose,
}: {
  selected: PostType
  onSelect: (t: PostType) => void
  onContinue: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <div className="flex items-center px-5 py-4 border-b border-[#F5F2EE]">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
        <p className="flex-1 text-center text-[15px] font-bold text-black" style={SYNE}>
          Nieuw bericht maken
        </p>
        <div className="w-8" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[#FAFAF7] px-5 py-6 space-y-5">
        {/* Upload hint */}
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <div className="w-14 h-14 rounded-2xl bg-[#EDEAE5] flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-[18px] font-bold text-black" style={SYNE}>Wat wil je delen?</p>
          <p className="text-[13px] text-gray-400">Kies een type of sleep media hierheen</p>
        </div>

        {/* Type grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {POST_TYPES.map(({ key, label, icon: Icon, iconBg, iconColor }) => {
            const active = selected === key
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl transition-all"
                style={{
                  background:   active ? '#FFF5EE' : '#F5F2EE',
                  border:       active ? '2px solid #E87722' : '2px solid transparent',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <span
                  className="text-[12px] font-bold"
                  style={{ color: active ? '#E87722' : '#888888' }}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#F5F2EE] bg-white">
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl text-white font-bold text-[15px] transition-colors hover:opacity-90"
          style={{ ...SYNE, background: '#E87722' }}
        >
          Doorgaan →
        </button>
      </div>
    </div>
  )
}

// ─── Step 2 — details form ────────────────────────────────────────────────────

function StepTwo({
  onBack,
  onPost,
  userName,
  avatarUrl,
  postType,
}: {
  onBack: () => void
  onPost: (data: PostFormData) => void
  userName: string
  avatarUrl?: string | null
  postType: PostType
}) {
  const [caption,          setCaption]          = useState('')
  const [sport,            setSport]            = useState('')
  const [location,         setLocation]         = useState('')
  const [music,            setMusic]            = useState('')
  const [taggedUsers,      setTaggedUsers]      = useState<string[]>([])
  const [isPublic,         setIsPublic]         = useState(true)
  const [commentsDisabled, setCommentsDisabled] = useState(false)
  const [likesHidden,      setLikesHidden]      = useState(false)
  const [notShareable,     setNotShareable]     = useState(false)
  const [mediaPreview,     setMediaPreview]     = useState<string | null>(null)
  const [mediaFile,        setMediaFile]        = useState<File | null>(null)
  const [showLocation,     setShowLocation]     = useState(false)
  const [showMusic,        setShowMusic]        = useState(false)
  const [submitting,       setSubmitting]       = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  function handleMediaPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    const url = URL.createObjectURL(file)
    setMediaPreview(url)
  }

  function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    onPost({
      content: caption,
      sport,
      location,
      music,
      taggedUsers,
      isPublic,
      commentsDisabled,
      likesHidden,
      notShareable,
      mediaFile,
    })
  }

  const sportLabel = POST_TYPES.find(t => t.key === postType)?.label ?? 'Bericht'

  return (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <div className="flex items-center px-5 py-4 border-b border-[#F5F2EE] shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <p className="flex-1 text-center text-[15px] font-bold text-black" style={SYNE}>
          Nieuw bericht maken
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="text-[15px] font-bold disabled:opacity-40 transition-opacity"
          style={{ color: '#E87722', ...SYNE }}
        >
          {submitting ? 'Delen...' : 'Delen'}
        </button>
      </div>

      {/* Body — two columns on md+, stacked on mobile */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col md:flex-row h-full">

          {/* Left — media preview */}
          <div
            className="md:w-[200px] md:shrink-0 h-48 md:h-full relative cursor-pointer"
            style={{ background: '#111111' }}
            onClick={() => fileRef.current?.click()}
          >
            {mediaPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-white/30" />
                <span className="text-white/40 text-xs font-semibold text-center px-4">Tik om media toe te voegen</span>
              </div>
            )}

            {/* Sport badge */}
            {sport && (
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                {sport}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaPick}
            />
          </div>

          {/* Right — form */}
          <div className="flex-1 flex flex-col divide-y divide-[#F5F2EE]">

            {/* User + type row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar name={userName} imageUrl={avatarUrl ?? null} size="sm" />
              <div>
                <p className="text-[14px] font-bold text-black">{userName}</p>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#FFF0E5', color: '#E87722' }}
                >
                  {sportLabel}
                </span>
              </div>
            </div>

            {/* Caption */}
            <div className="px-4 py-3 relative">
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value.slice(0, 500))}
                placeholder="Schrijf een bijschrift..."
                rows={3}
                className="w-full text-[14px] text-gray-700 placeholder-gray-300 bg-transparent resize-none focus:outline-none"
                style={{ minHeight: 80 }}
              />
              <span className="absolute bottom-3 right-4 text-[11px] text-gray-300">
                {caption.length} / 500
              </span>
            </div>

            {/* Sport pills */}
            <div className="px-4 py-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#AAA' }}>Sport</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {SPORTS.map(s => {
                  const active = sport === s
                  return (
                    <button
                      key={s}
                      onClick={() => setSport(active ? '' : s)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all"
                      style={{
                        background:   active ? '#FFF0E5' : '#F5F2EE',
                        color:        active ? '#E87722' : '#AAA',
                        border:       active ? '1.5px solid rgba(232,119,34,0.3)' : '1.5px solid transparent',
                      }}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Location */}
            <div>
              <button
                onClick={() => setShowLocation(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors"
              >
                <span className="text-[14px] text-gray-700">
                  {location || 'Locatie toevoegen'}
                </span>
                {location
                  ? <span className="text-[13px] text-gray-400 truncate max-w-[140px]">{location}</span>
                  : <MapPin className="w-4 h-4 text-gray-400" />
                }
              </button>
              {showLocation && (
                <div className="px-4 pb-3">
                  <input
                    autoFocus
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Zoek een locatie..."
                    className="w-full text-[13px] border border-[#F0EDE8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#E87722] transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Tag people */}
            <div>
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors"
                onClick={() => {/* TODO: user search */ }}
              >
                <span className="text-[14px] text-gray-700">Mensen taggen</span>
                <UserRoundPlus className="w-4 h-4 text-gray-400" />
              </button>
              {taggedUsers.length > 0 && (
                <div className="flex gap-1.5 flex-wrap px-4 pb-3">
                  {taggedUsers.map(u => (
                    <span key={u} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#F5F2EE] text-gray-600">
                      @{u}
                      <button onClick={() => setTaggedUsers(prev => prev.filter(x => x !== u))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Music */}
            <div>
              <button
                onClick={() => setShowMusic(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors"
              >
                <span className="text-[14px] text-gray-700">
                  {music || 'Muziek toevoegen'}
                </span>
                {music
                  ? (
                    <span className="flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                      <Music2 className="w-3 h-3" /> {music}
                      <button onClick={e => { e.stopPropagation(); setMusic('') }}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                  : <Music2 className="w-4 h-4 text-gray-400" />
                }
              </button>
              {showMusic && (
                <div className="px-4 pb-3 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={music}
                    onChange={e => setMusic(e.target.value)}
                    placeholder="Artiest — Nummer"
                    className="flex-1 text-[13px] border border-[#F0EDE8] rounded-xl px-3 py-2 focus:outline-none focus:border-[#E87722] transition-colors"
                  />
                  <button
                    onClick={() => setShowMusic(false)}
                    className="px-3 py-2 rounded-xl text-[12px] font-bold text-white"
                    style={{ background: '#E87722' }}
                  >
                    OK
                  </button>
                </div>
              )}
            </div>

            {/* Integrations */}
            <div className="px-4 py-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#AAA' }}>Activiteit koppelen</p>
              <div className="flex gap-2 flex-wrap">
                {INTEGRATIONS.map(({ name, dot }) => (
                  <div
                    key={name}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold"
                    style={{ border: '1px solid #EDE9E3', color: '#AAA', opacity: 0.6, cursor: 'default' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                    {name}
                    <span className="text-[10px] opacity-70">· Binnenkort</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors">
              <span className="text-[14px] text-gray-700">
                {isPublic ? 'Zichtbaar voor iedereen' : 'Alleen buddies'}
              </span>
              <Toggle on={isPublic} onChange={setIsPublic} />
            </div>

            {/* Advanced settings */}
            <div className="px-4 py-3 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#AAA' }}>Geavanceerde instellingen</p>

              {[
                { label: 'Reacties uitschakelen', value: commentsDisabled, onChange: setCommentsDisabled },
                { label: 'Likes verbergen',       value: likesHidden,      onChange: setLikesHidden      },
                { label: 'Niet deelbaar',         value: notShareable,     onChange: setNotShareable     },
              ].map(({ label, value, onChange }) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-[14px] text-gray-600">{label}</span>
                  <Toggle on={value} onChange={onChange} />
                </div>
              ))}
            </div>

            {/* Mobile share button */}
            <div className="md:hidden px-4 py-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ ...SYNE, background: '#E87722' }}
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Delen...' : 'Delen'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Form data type ───────────────────────────────────────────────────────────

export type PostFormData = {
  content: string
  sport: string
  location: string
  music: string
  taggedUsers: string[]
  isPublic: boolean
  commentsDisabled: boolean
  likesHidden: boolean
  notShareable: boolean
  mediaFile: File | null
}

// ─── Main composer ────────────────────────────────────────────────────────────

export default function PostComposer({
  isOpen,
  onClose,
  onPosted,
  initialType = 'post',
  skipToStep2 = false,
}: PostComposerProps) {
  const supabase = createClient()

  const [step,         setStep]         = useState<1 | 2>(skipToStep2 ? 2 : 1)
  const [selectedType, setSelectedType] = useState<PostType>(initialType)
  const [userName,     setUserName]     = useState('')
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null)
  const [userId,       setUserId]       = useState<string | null>(null)
  const [loaded,       setLoaded]       = useState(false)

  // Load user profile once on open
  const loadUser = useCallback(async () => {
    if (loaded) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', user.id)
      .single()
    if (data) {
      setUserName(data.full_name ?? data.username ?? 'Gebruiker')
      setAvatarUrl(data.avatar_url ?? null)
    }
    setLoaded(true)
  }, [loaded, supabase])

  // Load on first open
  if (isOpen && !loaded) {
    loadUser()
  }

  async function handlePost(form: PostFormData) {
    if (!userId) return

    let mediaUrl: string | null = null

    // Upload media if provided
    if (form.mediaFile) {
      const ext  = form.mediaFile.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(path, form.mediaFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path)
        mediaUrl = urlData.publicUrl
      }
    }

    await supabase.from('posts').insert({
      user_id:           userId,
      type:              selectedType,
      content:           form.content,
      sport_tag:         form.sport || null,
      location:          form.location || null,
      music:             form.music || null,
      tagged_users:      form.taggedUsers,
      visibility:        form.isPublic ? 'public' : 'buddies_only',
      comments_disabled: form.commentsDisabled,
      likes_hidden:      form.likesHidden,
      not_shareable:     form.notShareable,
      media_url:         mediaUrl,
      likes_count:       0,
    })

    onPosted?.()
    handleClose()
  }

  function handleClose() {
    onClose()
    // Reset after close animation
    setTimeout(() => {
      setStep(skipToStep2 ? 2 : 1)
      setSelectedType(initialType)
    }, 300)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        style={{ animation: 'fadeBackdrop 0.25s ease-out both' }}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none px-0 sm:px-4"
      >
        <div
          className="pointer-events-auto bg-white w-full sm:max-w-[640px] sm:rounded-[20px] rounded-t-[20px] shadow-2xl flex flex-col overflow-hidden"
          style={{
            height: '92vh',
            maxHeight: '92vh',
            animation: 'composerIn 0.25s ease-out both',
          }}
        >
          {/* Slide wrapper */}
          <div className="relative flex-1 overflow-hidden">
            {/* Step 1 */}
            <div
              className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
              style={{ transform: step === 1 ? 'translateX(0)' : 'translateX(-100%)' }}
            >
              <StepOne
                selected={selectedType}
                onSelect={setSelectedType}
                onContinue={() => setStep(2)}
                onClose={handleClose}
              />
            </div>

            {/* Step 2 */}
            <div
              className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
              style={{ transform: step === 2 ? 'translateX(0)' : 'translateX(100%)' }}
            >
              <StepTwo
                onBack={() => setStep(1)}
                onPost={handlePost}
                userName={userName || 'Laden...'}
                avatarUrl={avatarUrl}
                postType={selectedType}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeBackdrop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes composerIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}
