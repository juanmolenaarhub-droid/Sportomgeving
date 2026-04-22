'use client'

import { useState, useRef, useCallback } from 'react'
import {
  ArrowLeft, Image as ImageIcon, Loader2,
} from 'lucide-react'
import { SportSelector } from '@/components/ui/SportSelector'
import { getSportById } from '@/lib/sports'
import { Avatar, getInitials } from '@/components/Avatar'
import ToggleRow from '@/components/composer/ToggleRow'
import LocationPanel from '@/components/composer/LocationPanel'
import TagPeoplePanel from '@/components/composer/TagPeoplePanel'
import MusicPanel from '@/components/composer/MusicPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepTwoResult = {
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
  activityName?: string
  distanceKm?: number
  durationMinutes?: number
  calories?: number
  activityDate?: string
}

interface Step2PostProps {
  onBack: () => void
  onSubmit: (data: StepTwoResult) => Promise<void>
  userName: string
  avatarUrl: string | null
  userId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const INTEGRATIONS = [
  { name: 'Strava',       dot: '#E87722' },
  { name: 'Garmin',       dot: '#3B82F6' },
  { name: 'Apple Health', dot: '#111111' },
  { name: 'Wahoo',        dot: '#DC2626' },
]

const MAX_CAPTION = 500

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step2Post({
  onBack, onSubmit, userName, avatarUrl, userId,
}: Step2PostProps) {
  const [content, setContent]                 = useState('')
  const [sport, setSport]                     = useState('')
  const [locationName, setLocationName]       = useState('')
  const [locationLat, setLocationLat]         = useState<number | null>(null)
  const [locationLng, setLocationLng]         = useState<number | null>(null)
  const [music, setMusic]                     = useState('')
  const [taggedUserIds, setTaggedUserIds]     = useState<string[]>([])
  const [taggedUserNames, setTaggedUserNames] = useState<
    { id: string; name: string; username: string; avatarUrl?: string }[]
  >([])
  const [isPublic, setIsPublic]               = useState(true)
  const [commentsDisabled, setCommentsDisabled] = useState(false)
  const [likesHidden, setLikesHidden]         = useState(false)
  const [notShareable, setNotShareable]       = useState(false)
  const [mediaFile, setMediaFile]             = useState<File | null>(null)
  const [mediaPreview, setMediaPreview]       = useState<string | null>(null)
  const [submitting, setSubmitting]           = useState(false)
  const [error, setError]                     = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleMediaClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setMediaFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setMediaPreview(url)
    } else {
      setMediaPreview(null)
    }
    setError(null)
  }, [])

  const handleTagAdd = useCallback((user: { id: string; name: string; username: string; avatarUrl?: string }) => {
    setTaggedUserIds(prev => [...prev, user.id])
    setTaggedUserNames(prev => [...prev, user])
  }, [])

  const handleTagRemove = useCallback((id: string) => {
    setTaggedUserIds(prev => prev.filter(uid => uid !== id))
    setTaggedUserNames(prev => prev.filter(u => u.id !== id))
  }, [])

  const handleLocationChange = useCallback((name: string, lat: number, lng: number) => {
    setLocationName(name)
    setLocationLat(lat)
    setLocationLng(lng)
  }, [])

  const handleLocationClear = useCallback(() => {
    setLocationName('')
    setLocationLat(null)
    setLocationLng(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !mediaFile) {
      setError('Voeg een beschrijving of media toe om te delen.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        content,
        sport: getSportById(sport)?.label ?? sport,
        locationName,
        locationLat,
        locationLng,
        music,
        taggedUserIds,
        taggedUserNames,
        isPublic,
        commentsDisabled,
        likesHidden,
        notShareable,
        mediaFile,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden bij het plaatsen.')
    } finally {
      setSubmitting(false)
    }
  }, [
    content, sport, locationName, locationLat, locationLng, music,
    taggedUserIds, taggedUserNames, isPublic, commentsDisabled,
    likesHidden, notShareable, mediaFile, onSubmit,
  ])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFAF7]">

      {/* ── Navbar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-[#F5F2EE] shrink-0 bg-[#FAFAF7]"
        style={SYNE}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
          aria-label="Terug"
        >
          <ArrowLeft size={20} />
        </button>

        <span className="text-[15px] font-semibold text-gray-900">
          Nieuw bericht maken
        </span>

        {/* Desktop share button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-[14px] font-semibold transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#E87722', ...SYNE }}
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
          Delen
        </button>

        {/* Mobile: placeholder to keep title centred */}
        <div className="md:hidden w-[60px]" />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

        {/* ── Left: Media panel ── */}
        <button
          type="button"
          onClick={handleMediaClick}
          className="relative md:w-[200px] md:shrink-0 h-48 md:h-auto bg-black overflow-hidden focus:outline-none"
          aria-label="Media toevoegen"
        >
          {mediaPreview ? (
            <img
              src={mediaPreview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
              <ImageIcon size={32} className="opacity-50" />
              <span className="text-[12px] text-gray-400" style={SYNE}>
                Tik om media toe te voegen
              </span>
            </div>
          )}

          {/* Sport badge */}
          {sport && (
            <span
              className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-white text-[11px] font-semibold"
              style={{ backgroundColor: '#E87722', ...SYNE }}
            >
              {getSportById(sport)?.label ?? sport}
            </span>
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ── Right: Form ── */}
        <div className="flex-1 divide-y divide-[#F5F2EE] overflow-y-auto">

          {/* User row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar initials={getInitials(userName)} imageUrl={avatarUrl} size="sm" />
            <span className="text-[14px] font-semibold text-gray-900" style={SYNE}>
              {userName}
            </span>
            <span
              className="ml-1 px-2.5 py-0.5 rounded-full text-white text-[11px] font-semibold"
              style={{ backgroundColor: '#E87722', ...SYNE }}
            >
              Bericht
            </span>
          </div>

          {/* Caption */}
          <div className="px-4 py-3">
            <textarea
              value={content}
              onChange={e => {
                if (e.target.value.length <= MAX_CAPTION) {
                  setContent(e.target.value)
                  setError(null)
                }
              }}
              placeholder="Wat wil je delen?"
              rows={3}
              className="w-full resize-none border-0 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-[14px] min-h-[80px]"
              style={SYNE}
            />
            {error && (
              <p className="text-[12px] text-red-500 mt-1">{error}</p>
            )}
            <div className="text-right text-[11px] text-gray-400 mt-1" style={SYNE}>
              {content.length}/{MAX_CAPTION}
            </div>
          </div>

          {/* Sport */}
          <div className="px-4 py-3">
            <SportSelector
              value={sport}
              onChange={v => setSport(v as string)}
              multiple={false}
              label="Sport"
              placeholder="Kies een sport (optioneel)..."
            />
          </div>

          {/* Location */}
          <LocationPanel
            value={locationName}
            lat={locationLat}
            lng={locationLng}
            onChange={handleLocationChange}
            onClear={handleLocationClear}
          />

          {/* Tag people */}
          <TagPeoplePanel
            taggedIds={taggedUserIds}
            taggedNames={taggedUserNames}
            onAdd={handleTagAdd}
            onRemove={handleTagRemove}
            currentUserId={userId}
          />

          {/* Music */}
          <MusicPanel value={music} onChange={setMusic} />

          {/* Integrations */}
          <div className="px-4 py-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2" style={SYNE}>
              Integraties
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEGRATIONS.map(int => (
                <div
                  key={int.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#F5F2EE] opacity-40"
                  style={SYNE}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: int.dot }}
                  />
                  <span className="text-[12px] text-gray-500">{int.name}</span>
                  <span className="text-[10px] text-gray-400 ml-0.5">Binnenkort</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visibility toggle */}
          <ToggleRow
            label="Zichtbaar voor iedereen"
            description={isPublic ? 'Iedereen kan dit bericht zien' : 'Alleen buddies kunnen dit bericht zien'}
            value={isPublic}
            onChange={setIsPublic}
          />

          {/* Advanced settings header */}
          <div className="px-4 py-2 bg-[#F5F2EE]">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider" style={SYNE}>
              Geavanceerde instellingen
            </span>
          </div>

          <ToggleRow
            label="Reacties uitschakelen"
            value={commentsDisabled}
            onChange={setCommentsDisabled}
          />

          <ToggleRow
            label="Likes verbergen"
            value={likesHidden}
            onChange={setLikesHidden}
          />

          <ToggleRow
            label="Niet deelbaar"
            value={notShareable}
            onChange={setNotShareable}
          />

          {/* Mobile-only share button */}
          <div className="md:hidden px-4 py-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[15px] font-semibold transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#E87722', ...SYNE }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Delen
            </button>
          </div>

          {/* Bottom spacer */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  )
}
