'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/Avatar'
import ToggleRow from '@/components/composer/ToggleRow'
import LocationPanel from '@/components/composer/LocationPanel'
import TagPeoplePanel from '@/components/composer/TagPeoplePanel'

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
  meetupName?: string
  meetupDate?: string
  meetupStartTime?: string
  meetupEndTime?: string
  maxParticipants?: number
  skillLevel?: string
  meetupDescription?: string
  existingMeetupId?: string
}

interface Props {
  onBack: () => void
  onSubmit: (data: StepTwoResult) => Promise<void>
  userName: string
  avatarUrl: string | null
  userId: string
}

interface ExistingMeetup {
  id: string
  name: string
  date: string
  sport: string
  participant_count: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const SPORTS = [
  'Hardlopen', 'Fietsen', 'Zwemmen', 'Gym', 'Voetbal',
  'Tennis', 'Padel', 'Yoga', 'Triathlon', 'Boksen', 'Klimmen', 'Overig',
]

const SKILL_LEVELS = ['Beginner', 'Gemiddeld', 'Gevorderd', 'Alle niveaus']

const SPORT_EMOJI: Record<string, string> = {
  Hardlopen: '🏃', Fietsen: '🚴', Zwemmen: '🏊', Gym: '🏋️',
  Voetbal: '⚽', Tennis: '🎾', Padel: '🏓', Yoga: '🧘',
  Triathlon: '🏅', Boksen: '🥊', Klimmen: '🧗', Overig: '🏅',
}

function formatMeetupDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step2Meetup({ onBack, onSubmit, userName, avatarUrl, userId }: Props) {
  const supabase = createClient()

  // Sub-mode
  const [mode, setMode] = useState<'new' | 'existing'>('new')

  // Existing meetups
  const [existingMeetups, setExistingMeetups] = useState<ExistingMeetup[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null)

  // Form fields
  const [meetupName, setMeetupName] = useState('')
  const [sport, setSport] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [skillLevel, setSkillLevel] = useState('Alle niveaus')
  const [description, setDescription] = useState('')
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
  const [taggedUserNames, setTaggedUserNames] = useState<
    { id: string; name: string; username: string; avatarUrl?: string }[]
  >([])
  const [isPublic, setIsPublic] = useState(true)
  const [autoClose, setAutoClose] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load existing meetups when switching to that mode
  useEffect(() => {
    if (mode !== 'existing') return
    setLoadingExisting(true)
    supabase
      .from('meetups')
      .select('*')
      .eq('organizer_id', userId)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .then(({ data }) => {
        setExistingMeetups((data as ExistingMeetup[]) ?? [])
        setLoadingExisting(false)
      })
  }, [mode, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Validation
  function validate(): boolean {
    const e: Record<string, string> = {}
    if (mode === 'new') {
      if (!meetupName.trim()) e.meetupName = 'Vereist'
      if (!sport) e.sport = 'Kies een sport'
      if (!locationName) e.locationName = 'Locatie is vereist'
    } else {
      if (!selectedExistingId) e.existing = 'Selecteer een meetup'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      let existingMeetupId: string | undefined

      if (mode === 'existing') {
        existingMeetupId = selectedExistingId ?? undefined
      } else {
        // Insert new meetup
        const { data: inserted, error } = await supabase
          .from('meetups')
          .insert({
            organizer_id: userId,
            name: meetupName.trim(),
            sport,
            date: date || null,
            start_time: startTime || null,
            end_time: endTime || null,
            location_name: locationName,
            location_lat: locationLat,
            location_lng: locationLng,
            max_participants: maxParticipants,
            skill_level: skillLevel,
            description: description.trim() || null,
            is_public: isPublic,
            auto_close: autoClose,
          })
          .select('id')
          .single()

        if (error) throw error
        existingMeetupId = (inserted as { id: string }).id
      }

      await onSubmit({
        content: description.trim(),
        sport,
        locationName,
        locationLat,
        locationLng,
        music: '',
        taggedUserIds,
        taggedUserNames,
        isPublic,
        commentsDisabled: false,
        likesHidden: false,
        notShareable: false,
        mediaFile: null,
        meetupName: meetupName.trim() || undefined,
        meetupDate: date || undefined,
        meetupStartTime: startTime || undefined,
        meetupEndTime: endTime || undefined,
        maxParticipants,
        skillLevel,
        meetupDescription: description.trim() || undefined,
        existingMeetupId,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const sportEmoji = SPORT_EMOJI[sport] ?? '🏅'
  const previewDate = date
    ? new Date(date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: '#FAFAF7', fontFamily: "'Syne', sans-serif" }}
    >
      {/* Navbar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#F5F2EE', background: '#FAFAF7' }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5F2EE] transition-colors"
        >
          <ArrowLeft size={20} color="#111" />
        </button>
        <span className="text-[15px] font-semibold text-gray-900" style={SYNE}>
          Nieuwe meetup
        </span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-1.5 rounded-full text-white text-[13px] font-semibold transition-opacity disabled:opacity-50"
          style={{ background: '#E87722', ...SYNE }}
        >
          {submitting ? 'Bezig…' : 'Delen'}
        </button>
      </div>

      {/* Sub-mode toggle */}
      <div className="flex gap-2 px-4 pt-4 pb-2 flex-shrink-0">
        {(['new', 'existing'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 rounded-full text-[13px] font-semibold transition-all"
            style={{
              ...SYNE,
              background: mode === m ? '#E87722' : '#F5F2EE',
              color: mode === m ? '#fff' : '#6B7280',
            }}
          >
            {m === 'new' ? 'Nieuwe meetup' : 'Bestaande meetup'}
          </button>
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* ── MODE: EXISTING ── */}
        {mode === 'existing' && (
          <div className="px-4 py-2 space-y-2">
            {errors.existing && (
              <p className="text-red-500 text-[12px]">{errors.existing}</p>
            )}
            {loadingExisting ? (
              <div className="py-12 text-center text-gray-400 text-[14px]">Laden…</div>
            ) : existingMeetups.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-[14px]">
                Geen aankomende meetups gevonden
              </div>
            ) : (
              existingMeetups.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedExistingId(m.id)}
                  className="w-full text-left p-4 rounded-2xl border transition-all"
                  style={{
                    background: selectedExistingId === m.id ? '#FFF0E5' : '#fff',
                    borderColor: selectedExistingId === m.id ? '#E87722' : '#F5F2EE',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-gray-900 truncate" style={SYNE}>
                        {m.name}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {formatMeetupDate(m.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: '#EFF6FF', color: '#3B82F6' }}
                      >
                        {m.sport}
                      </span>
                      <span className="text-[12px] text-gray-400 flex items-center gap-1">
                        <Users size={12} />
                        {m.participant_count ?? 0}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── MODE: NEW ── */}
        {mode === 'new' && (
          <div className="px-4 pb-8 space-y-5 pt-2">
            {/* User row */}
            <div className="flex items-center gap-3">
              <Avatar name={userName} imageUrl={avatarUrl} size="sm" />
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-gray-900" style={SYNE}>
                  {userName}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: '#EFF6FF', color: '#3B82F6', ...SYNE }}
                >
                  Meetup
                </span>
              </div>
            </div>

            {/* Meetup naam */}
            <div>
              <input
                type="text"
                value={meetupName}
                onChange={(e) => setMeetupName(e.target.value)}
                placeholder="Meetup naam *"
                className="w-full bg-transparent border-b text-[16px] font-semibold text-gray-900 placeholder-gray-300 outline-none pb-2 focus:border-[#E87722] transition-colors"
                style={{ borderColor: errors.meetupName ? '#EF4444' : '#E0DDD8', ...SYNE }}
              />
              {errors.meetupName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.meetupName}</p>
              )}
            </div>

            {/* Sport pills */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Sport *
              </p>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                    style={{
                      ...SYNE,
                      background: sport === s ? '#E87722' : '#F5F2EE',
                      color: sport === s ? '#fff' : '#6B7280',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.sport && (
                <p className="text-red-500 text-[11px] mt-1">{errors.sport}</p>
              )}
            </div>

            {/* Datum */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Datum
              </p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-900 outline-none focus:border-[#E87722] transition-colors bg-white"
                style={{ borderColor: '#F5F2EE', ...SYNE }}
              />
            </div>

            {/* Starttijd + Eindtijd */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                  Starttijd
                </p>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-900 outline-none focus:border-[#E87722] transition-colors bg-white"
                  style={{ borderColor: '#F5F2EE', ...SYNE }}
                />
              </div>
              <div>
                <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                  Eindtijd
                </p>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-900 outline-none focus:border-[#E87722] transition-colors bg-white"
                  style={{ borderColor: '#F5F2EE', ...SYNE }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Locatie *
              </p>
              <LocationPanel
                value={locationName}
                lat={locationLat}
                lng={locationLng}
                onChange={(name, lat, lng) => {
                  setLocationName(name)
                  setLocationLat(lat)
                  setLocationLng(lng)
                }}
                onClear={() => {
                  setLocationName('')
                  setLocationLat(null)
                  setLocationLng(null)
                }}
              />
              {errors.locationName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.locationName}</p>
              )}
            </div>

            {/* Max deelnemers */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Max deelnemers
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={2}
                  max={50}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="flex-1 accent-[#E87722]"
                />
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0"
                  style={{ background: '#E87722', ...SYNE }}
                >
                  {maxParticipants}
                </span>
              </div>
            </div>

            {/* Niveau */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Niveau
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILL_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSkillLevel(lvl)}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                    style={{
                      ...SYNE,
                      background: skillLevel === lvl ? '#E87722' : '#F5F2EE',
                      color: skillLevel === lvl ? '#fff' : '#6B7280',
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Beschrijving */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Beschrijving
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vertel meer over deze meetup…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-700 outline-none focus:border-[#E87722] transition-colors bg-white resize-none placeholder-gray-300"
                style={{ borderColor: '#F5F2EE', caretColor: '#E87722', ...SYNE }}
              />
            </div>

            {/* Tag people */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Mensen uitnodigen
              </p>
              <TagPeoplePanel
                taggedIds={taggedUserIds}
                taggedNames={taggedUserNames}
                onAdd={(user) => {
                  setTaggedUserIds((prev) => [...prev, user.id])
                  setTaggedUserNames((prev) => [...prev, user])
                }}
                onRemove={(id) => {
                  setTaggedUserIds((prev) => prev.filter((x) => x !== id))
                  setTaggedUserNames((prev) => prev.filter((x) => x.id !== id))
                }}
                currentUserId={userId}
              />
            </div>

            {/* Toggles */}
            <div
              className="rounded-2xl overflow-hidden divide-y"
              style={{ border: '1px solid #F5F2EE', background: '#fff' }}
            >
              <ToggleRow
                label="Openbaar"
                description="Zichtbaar voor iedereen / Alleen buddies"
                value={isPublic}
                onChange={setIsPublic}
              />
              <ToggleRow
                label="Automatisch sluiten"
                description="Sluiten bij maximaal aantal deelnemers"
                value={autoClose}
                onChange={setAutoClose}
              />
            </div>

            {/* Live preview card */}
            <div
              className="rounded-2xl p-4 mt-2"
              style={{
                border: '1.5px solid #E87722',
                borderRadius: 16,
                background: '#fff',
              }}
            >
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Voorbeeld
              </p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{sportEmoji}</span>
                <span className="text-[12px] text-gray-500" style={SYNE}>
                  {sport || 'Sport'}
                </span>
              </div>
              <p className="text-[16px] font-bold text-gray-900 mb-1" style={SYNE}>
                {meetupName || 'Meetup naam'}
              </p>
              {(previewDate || startTime) && (
                <p className="text-[13px] text-gray-600 mb-1" style={SYNE}>
                  {previewDate ?? ''}
                  {startTime && ` · ${startTime}`}
                  {endTime && `–${endTime}`}
                </p>
              )}
              {locationName && (
                <p className="text-[13px] text-gray-500 flex items-center gap-1 mb-1">
                  <MapPin size={12} color="#E87722" />
                  {locationName}
                </p>
              )}
              <p className="text-[12px] text-gray-400" style={SYNE}>
                {skillLevel} · Max {maxParticipants}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
