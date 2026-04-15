'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, Activity, CalendarDays, Star, HelpCircle, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Step2Post    from './composer/Step2Post'
import Step2Activity  from './composer/Step2Activity'
import Step2Meetup    from './composer/Step2Meetup'
import Step2Challenge from './composer/Step2Challenge'
import Step2Question  from './composer/Step2Question'
import Step2Photo     from './composer/Step2Photo'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostType = 'post' | 'activity' | 'meetup' | 'challenge' | 'question' | 'media'

/** Superset of all Step2 result shapes */
export type StepTwoResult = {
  // Common
  content: string
  sport: string
  locationName: string
  locationLat: number | null
  locationLng: number | null
  music: string
  taggedUserIds: string[]
  taggedUserNames: { id: string; name: string; username: string; avatarUrl?: string }[]
  isPublic: boolean
  commentsDisabled: boolean
  likesHidden: boolean
  notShareable: boolean
  mediaFile: File | null
  thumbnailFile?: File | null
  // Activity
  activityName?: string
  distanceKm?: number
  durationMinutes?: number
  calories?: number
  activityDate?: string
  // Meetup
  meetupName?: string
  meetupDate?: string
  meetupStartTime?: string
  meetupEndTime?: string
  maxParticipants?: number
  skillLevel?: string
  meetupDescription?: string
  existingMeetupId?: string
  // Challenge
  challengeName?: string
  challengeType?: string
  challengeGoal?: string | number
  challengeStart?: string
  challengeEnd?: string
  challengeDescription?: string
  requiresVerification?: boolean
  existingChallengeId?: string
  // Question / Poll
  question?: string
  questionContext?: string
  answerType?: 'open' | 'poll'
  pollOptions?: string[]
  pollDurationDays?: number
  anonymousAnswers?: boolean
}

/** Legacy export kept for dashboard/page.tsx compatibility */
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
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <div className="w-14 h-14 rounded-2xl bg-[#EDEAE5] flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-[18px] font-bold text-black" style={SYNE}>Wat wil je delen?</p>
          <p className="text-[13px] text-gray-400">Kies een type om te beginnen</p>
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
                  background: active ? '#FFF5EE' : '#F5F2EE',
                  border:     active ? '2px solid #E87722' : '2px solid transparent',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <span className="text-[12px] font-bold" style={{ color: active ? '#E87722' : '#888888' }}>
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
          className="w-full py-3 rounded-xl text-white font-bold text-[15px] transition-opacity hover:opacity-90"
          style={{ ...SYNE, background: '#E87722' }}
        >
          Doorgaan →
        </button>
      </div>
    </div>
  )
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

  // Load user data when composer opens (proper useEffect, not render-body call)
  useEffect(() => {
    if (!isOpen || loaded) return
    async function loadUser() {
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
    }
    loadUser()
  }, [isOpen, loaded, supabase])

  async function handleSubmit(form: StepTwoResult) {
    if (!userId) throw new Error('Niet ingelogd — herlaad de pagina en probeer opnieuw.')

    // Upload media if present
    let mediaUrl: string | null = null
    let mediaType: string | null = null
    if (form.mediaFile) {
      const ext  = form.mediaFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(path, form.mediaFile)
      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Bestand uploaden mislukt: ${uploadError.message}`)
      }
      const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path)
      mediaUrl = urlData.publicUrl
      mediaType = form.mediaFile.type.startsWith('video/') ? 'video' : 'image'
    }

    // Upload thumbnail if present (video posts only)
    let thumbnailUrl: string | null = null
    if (form.thumbnailFile) {
      const ext  = form.thumbnailFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/thumb_${Date.now()}.${ext}`
      const { error: thumbError } = await supabase.storage
        .from('post-media')
        .upload(path, form.thumbnailFile)
      if (thumbError) {
        console.error('Thumbnail upload error:', thumbError)
        // non-fatal: continue without thumbnail
      } else {
        const { data: thumbData } = supabase.storage.from('post-media').getPublicUrl(path)
        thumbnailUrl = thumbData.publicUrl
      }
    }

    // Build the post row — include type-specific extras where the column exists
    const postRow: Record<string, unknown> = {
      user_id:           userId,
      type:              selectedType,
      content:           form.content || null,
      sport_tag:         form.sport   || null,
      location:          form.locationName || null,
      location_lat:      form.locationLat,
      location_lng:      form.locationLng,
      music:             form.music   || null,
      tagged_users:      form.taggedUserIds,
      visibility:        form.isPublic ? 'public' : 'buddies_only',
      comments_disabled: form.commentsDisabled,
      likes_hidden:      form.likesHidden,
      not_shareable:     form.notShareable,
      media_url:         mediaUrl,
      thumbnail_url:     thumbnailUrl,
      media_type:        mediaType,
      likes_count:       0,
    }

    // Activity extras
    if (selectedType === 'activity') {
      postRow.activity_name     = form.activityName     ?? null
      postRow.distance_km       = form.distanceKm       ?? null
      postRow.duration_minutes  = form.durationMinutes  ?? null
      postRow.calories          = form.calories         ?? null
      postRow.activity_date     = form.activityDate     ?? null
    }

    // Meetup: link the meetup_id (meetup record already created by Step2Meetup)
    if (selectedType === 'meetup' && form.existingMeetupId) {
      postRow.meetup_id = form.existingMeetupId
    }

    // Challenge
    if (selectedType === 'challenge') {
      postRow.challenge_name   = form.challengeName   ?? null
      postRow.challenge_type   = form.challengeType   ?? null
      postRow.challenge_goal   = form.challengeGoal   ?? null
      postRow.challenge_start  = form.challengeStart  ?? null
      postRow.challenge_end    = form.challengeEnd    ?? null
    }

    // Question / Poll
    if (selectedType === 'question') {
      postRow.question           = form.question        ?? null
      postRow.answer_type        = form.answerType      ?? 'open'
      postRow.poll_options       = form.pollOptions     ?? null
      postRow.poll_duration_days = form.pollDurationDays ?? null
      postRow.anonymous_answers  = form.anonymousAnswers ?? false
    }

    const { error: insertError } = await supabase.from('posts').insert(postRow)
    if (insertError) {
      console.error('Post insert error:', insertError)
      throw new Error(`Post opslaan mislukt: ${insertError.message}`)
    }

    onPosted?.()
    handleClose()
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setStep(skipToStep2 ? 2 : 1)
      setSelectedType(initialType)
    }, 300)
  }

  if (!isOpen) return null

  const step2Props = {
    onBack:    () => setStep(1),
    onSubmit:  handleSubmit,
    userName:  userName || 'Laden...',
    avatarUrl: avatarUrl,
    userId:    userId ?? '',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        style={{ animation: 'fadeBackdrop 0.25s ease-out both' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none px-0 sm:px-4">
        <div
          className="pointer-events-auto bg-white w-full sm:max-w-[640px] sm:rounded-[20px] rounded-t-[20px] shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '92vh', maxHeight: '92vh', animation: 'composerIn 0.25s ease-out both' }}
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

            {/* Step 2 — type-specific */}
            <div
              className="absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out"
              style={{ transform: step === 2 ? 'translateX(0)' : 'translateX(100%)' }}
            >
              {selectedType === 'post'       && <Step2Post       {...step2Props} />}
              {selectedType === 'activity'   && <Step2Activity   {...step2Props} />}
              {selectedType === 'meetup'     && <Step2Meetup     {...step2Props} />}
              {selectedType === 'challenge'  && <Step2Challenge  {...step2Props} />}
              {selectedType === 'question'   && <Step2Question   {...step2Props} />}
              {selectedType === 'media'      && <Step2Photo      {...step2Props} />}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeBackdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes composerIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  )
}
