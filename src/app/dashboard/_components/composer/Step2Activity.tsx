'use client'

import { useState, useCallback, useMemo } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
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

interface Step2ActivityProps {
  onBack: () => void
  onSubmit: (data: StepTwoResult) => Promise<void>
  userName: string
  avatarUrl: string | null
  userId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }


const GRADIENTS: Record<string, string> = {
  hardlopen: 'linear-gradient(145deg, #E87722, #C0392B)',
  fietsen:   'linear-gradient(145deg, #059669, #064E3B)',
  zwemmen:   'linear-gradient(145deg, #0284C7, #1E3A5F)',
  gym:       'linear-gradient(145deg, #292524, #111)',
  triathlon: 'linear-gradient(145deg, #6366F1, #4F46E5)',
  default:   'linear-gradient(145deg, #374151, #111)',
}

const INTEGRATIONS = [
  { name: 'Strava',       dot: '#E87722' },
  { name: 'Garmin',       dot: '#3B82F6' },
  { name: 'Apple Health', dot: '#111111' },
  { name: 'Wahoo',        dot: '#DC2626' },
]

const MAX_CAPTION = 500

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradientForSport(sport: string): string {
  return GRADIENTS[sport.toLowerCase()] ?? GRADIENTS.default
}

/** Parse "hh:mm" or "mm:ss" style text field into total minutes */
function parseTimeInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parts = trimmed.split(':')
  if (parts.length === 2) {
    const a = parseInt(parts[0], 10)
    const b = parseInt(parts[1], 10)
    if (!isNaN(a) && !isNaN(b)) return a * 60 + b
  }
  const mins = parseFloat(trimmed)
  return isNaN(mins) ? null : mins
}

/** Format minutes as "M:SS /km" tempo */
function formatTempo(durationMinutes: number, distanceKm: number): string {
  if (distanceKm <= 0) return '--'
  const totalSecs = (durationMinutes / distanceKm) * 60
  const m = Math.floor(totalSecs / 60)
  const s = Math.round(totalSecs % 60)
  return `${m}:${s.toString().padStart(2, '0')} /km`
}

/** Format speed in km/h */
function formatSpeed(durationMinutes: number, distanceKm: number): string {
  if (durationMinutes <= 0) return '--'
  return (distanceKm / (durationMinutes / 60)).toFixed(1)
}

function nowDatetimeLocal(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({
  label, required, htmlFor,
}: { label: string; required?: boolean; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold text-gray-400 uppercase mb-1.5"
      style={SYNE}
    >
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function StatInput({
  id, label, value, onChange, type = 'number', placeholder, unit, readOnly,
}: {
  id: string
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  placeholder?: string
  unit?: string
  readOnly?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] text-gray-400 font-semibold uppercase" style={SYNE}>
        {label}
      </label>
      <div className="flex items-center gap-1.5 border border-[#F5F2EE] rounded-lg px-3 py-2 bg-white">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] text-gray-800 focus:outline-none min-w-0 disabled:opacity-50"
          style={SYNE}
          min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? 'any' : undefined}
        />
        {unit && (
          <span className="text-[12px] text-gray-400 shrink-0" style={SYNE}>{unit}</span>
        )}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step2Activity({
  onBack, onSubmit, userName, avatarUrl, userId,
}: Step2ActivityProps) {
  const [sport, setSport]                     = useState('')
  const [activityName, setActivityName]       = useState('')
  const [content, setContent]                 = useState('')
  const [activityDate, setActivityDate]       = useState(nowDatetimeLocal())

  // Shared stats
  const [distanceRaw, setDistanceRaw]         = useState('')
  const [timeRaw, setTimeRaw]                 = useState('')     // "hh:mm"
  const [caloriesRaw, setCaloriesRaw]         = useState('')

  // Gym extras
  const [exercisesRaw, setExercisesRaw]       = useState('')

  // Swimming extras
  const [lanesRaw, setLanesRaw]               = useState('')

  // Common
  const [locationName, setLocationName]       = useState('')
  const [locationLat, setLocationLat]         = useState<number | null>(null)
  const [locationLng, setLocationLng]         = useState<number | null>(null)
  const [music, setMusic]                     = useState('')
  const [taggedUserIds, setTaggedUserIds]     = useState<string[]>([])
  const [taggedUserNames, setTaggedUserNames] = useState<
    { id: string; name: string; username: string; avatarUrl?: string }[]
  >([])
  const [isPublic, setIsPublic]               = useState(true)
  const [submitting, setSubmitting]           = useState(false)
  const [sportError, setSportError]           = useState<string | null>(null)
  const [statError, setStatError]             = useState<string | null>(null)

  // ─── Derived values ─────────────────────────────────────────────────────────

  const distanceKm = useMemo(() => {
    const v = parseFloat(distanceRaw)
    return isNaN(v) ? null : v
  }, [distanceRaw])

  const durationMinutes = useMemo(() => parseTimeInput(timeRaw), [timeRaw])

  const calories = useMemo(() => {
    const v = parseInt(caloriesRaw, 10)
    return isNaN(v) ? undefined : v
  }, [caloriesRaw])

  const sportKey = sport.toLowerCase()

  const tempo = useMemo(() => {
    if (durationMinutes && distanceKm) return formatTempo(durationMinutes, distanceKm)
    return '--'
  }, [durationMinutes, distanceKm])

  const speed = useMemo(() => {
    if (durationMinutes && distanceKm) return formatSpeed(durationMinutes, distanceKm)
    return '--'
  }, [durationMinutes, distanceKm])

  // Preview big stat
  const previewBigNumber = useMemo(() => {
    if (distanceKm !== null) return distanceKm.toString()
    if (durationMinutes !== null) return `${durationMinutes}min`
    return '--'
  }, [distanceKm, durationMinutes])

  const previewBigFontSize = distanceKm !== null ? 56 : 48

  // ─── Handlers ───────────────────────────────────────────────────────────────

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
    let valid = true

    if (!sport) {
      setSportError('Kies een sport om door te gaan.')
      valid = false
    } else {
      setSportError(null)
    }

    const hasAnyStat =
      distanceRaw.trim() !== '' ||
      timeRaw.trim() !== '' ||
      caloriesRaw.trim() !== '' ||
      exercisesRaw.trim() !== '' ||
      lanesRaw.trim() !== ''

    if (!hasAnyStat) {
      setStatError('Voeg minimaal één statistiek toe.')
      valid = false
    } else {
      setStatError(null)
    }

    if (!valid) return

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
        commentsDisabled: false,
        likesHidden: false,
        notShareable: false,
        mediaFile: null,
        activityName: activityName.trim() || undefined,
        distanceKm: distanceKm ?? undefined,
        durationMinutes: durationMinutes ?? undefined,
        calories,
        activityDate,
      })
    } finally {
      setSubmitting(false)
    }
  }, [
    sport, distanceRaw, timeRaw, caloriesRaw, exercisesRaw, lanesRaw,
    content, activityName, locationName, locationLat, locationLng,
    music, taggedUserIds, taggedUserNames, isPublic, distanceKm,
    durationMinutes, calories, activityDate, onSubmit,
  ])

  // ─── Sport-specific stat fields ─────────────────────────────────────────────

  function renderStatFields() {
    switch (sportKey) {
      case 'hardlopen':
      case 'overig':
        return (
          <div className="grid grid-cols-2 gap-3">
            <StatInput
              id="distance" label="Afstand" value={distanceRaw}
              onChange={setDistanceRaw} unit="km" placeholder="0.00"
            />
            <StatInput
              id="duration" label="Tijd" value={timeRaw}
              onChange={setTimeRaw} type="text" placeholder="hh:mm"
            />
            <StatInput
              id="tempo" label="Tempo (berekend)" value={tempo}
              unit="/km" readOnly
            />
            {statError && (
              <p className="col-span-2 text-[12px] text-red-500">{statError}</p>
            )}
          </div>
        )

      case 'fietsen':
        return (
          <div className="grid grid-cols-2 gap-3">
            <StatInput
              id="distance" label="Afstand" value={distanceRaw}
              onChange={setDistanceRaw} unit="km" placeholder="0.00"
            />
            <StatInput
              id="duration" label="Tijd" value={timeRaw}
              onChange={setTimeRaw} type="text" placeholder="hh:mm"
            />
            <StatInput
              id="speed" label="Snelheid (berekend)" value={speed}
              unit="km/h" readOnly
            />
            {statError && (
              <p className="col-span-2 text-[12px] text-red-500">{statError}</p>
            )}
          </div>
        )

      case 'zwemmen':
        return (
          <div className="grid grid-cols-2 gap-3">
            <StatInput
              id="distance" label="Afstand" value={distanceRaw}
              onChange={setDistanceRaw} unit="m" placeholder="0"
            />
            <StatInput
              id="lanes" label="Banen" value={lanesRaw}
              onChange={setLanesRaw} placeholder="0"
            />
            <StatInput
              id="duration" label="Tijd" value={timeRaw}
              onChange={setTimeRaw} type="text" placeholder="hh:mm"
            />
            {statError && (
              <p className="col-span-2 text-[12px] text-red-500">{statError}</p>
            )}
          </div>
        )

      case 'gym':
        return (
          <div className="grid grid-cols-2 gap-3">
            <StatInput
              id="duration" label="Duur" value={timeRaw}
              onChange={setTimeRaw} type="text" placeholder="hh:mm" unit="min"
            />
            <StatInput
              id="exercises" label="Oefeningen" value={exercisesRaw}
              onChange={setExercisesRaw} placeholder="0"
            />
            <StatInput
              id="calories" label="Calorieën" value={caloriesRaw}
              onChange={setCaloriesRaw} placeholder="0" unit="kcal"
            />
            {statError && (
              <p className="col-span-2 text-[12px] text-red-500">{statError}</p>
            )}
          </div>
        )

      default:
        // Fallback: distance + time
        return (
          <div className="grid grid-cols-2 gap-3">
            <StatInput
              id="distance" label="Afstand" value={distanceRaw}
              onChange={setDistanceRaw} unit="km" placeholder="0.00"
            />
            <StatInput
              id="duration" label="Tijd" value={timeRaw}
              onChange={setTimeRaw} type="text" placeholder="hh:mm"
            />
            {statError && (
              <p className="col-span-2 text-[12px] text-red-500">{statError}</p>
            )}
          </div>
        )
    }
  }

  // ─── Preview stat pills ──────────────────────────────────────────────────────

  function renderPreviewStats() {
    const statPillClass = 'text-[11px] text-white/90 font-semibold'
    const dividerClass  = 'w-px h-4 bg-white/20'

    const distLabel = distanceKm !== null ? `${distanceKm} km` : '--'
    const timeLabel = durationMinutes !== null
      ? (() => {
          const h = Math.floor(durationMinutes / 60)
          const m = durationMinutes % 60
          return h > 0 ? `${h}u ${m}m` : `${m}m`
        })()
      : '--'

    let thirdLabel = '--'
    if (sportKey === 'fietsen') {
      thirdLabel = speed !== '--' ? `${speed} km/h` : '--'
    } else {
      thirdLabel = tempo !== '--' ? tempo : '--'
    }

    const thirdTitle = sportKey === 'fietsen' ? 'Snelheid' : 'Tempo'

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-white/60 uppercase font-semibold" style={SYNE}>Afstand</span>
          <span className={statPillClass} style={SYNE}>{distLabel}</span>
        </div>
        <div className={dividerClass} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-white/60 uppercase font-semibold" style={SYNE}>Tijd</span>
          <span className={statPillClass} style={SYNE}>{timeLabel}</span>
        </div>
        <div className={dividerClass} />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-white/60 uppercase font-semibold" style={SYNE}>{thirdTitle}</span>
          <span className={statPillClass} style={SYNE}>{thirdLabel}</span>
        </div>
      </div>
    )
  }

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
          Activiteit loggen
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

        {/* Mobile placeholder to keep title centred */}
        <div className="md:hidden w-[60px]" />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

        {/* ── Left: Activity preview ── */}
        <div
          className="relative md:w-[220px] md:shrink-0 h-48 md:h-auto overflow-hidden"
          style={{ background: gradientForSport(sport) }}
        >
          <div className="absolute inset-0 flex flex-col justify-between p-4">

            {/* Top pill */}
            <div>
              <span
                className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm"
                style={SYNE}
              >
                {sport ? `${sport} · Buddys` : 'Activiteit · Buddys'}
              </span>
            </div>

            {/* Big number */}
            <div>
              <span
                className="font-black text-white leading-none block"
                style={{ fontSize: previewBigFontSize, ...SYNE }}
              >
                {previewBigNumber}
              </span>
            </div>

            {/* Bottom stats */}
            {renderPreviewStats()}
          </div>
        </div>

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
              Activiteit
            </span>
          </div>

          {/* Sport selector (required) */}
          <div className="px-4 py-3">
            <SportSelector
              value={sport}
              onChange={v => { setSport(v as string); setSportError(null) }}
              multiple={false}
              label="Sport"
              placeholder="Kies een sport..."
              error={sportError ?? undefined}
            />
          </div>

          {/* Activity name */}
          <div className="px-4 py-3">
            <FieldLabel label="Activiteit naam" htmlFor="activityName" />
            <input
              id="activityName"
              type="text"
              value={activityName}
              onChange={e => setActivityName(e.target.value)}
              placeholder="Bijv. Ochtendrun Vondelpark"
              className="w-full border border-[#F5F2EE] rounded-lg px-3 py-2 text-[14px] text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E87722]"
              style={SYNE}
            />
          </div>

          {/* Dynamic stat fields */}
          <div className="px-4 py-3">
            <FieldLabel label="Statistieken" required />
            {renderStatFields()}
          </div>

          {/* Date */}
          <div className="px-4 py-3">
            <FieldLabel label="Datum" htmlFor="activityDate" />
            <input
              id="activityDate"
              type="datetime-local"
              value={activityDate}
              onChange={e => setActivityDate(e.target.value)}
              className="w-full border border-[#F5F2EE] rounded-lg px-3 py-2 text-[14px] text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#E87722]"
              style={SYNE}
            />
          </div>

          {/* Caption */}
          <div className="px-4 py-3">
            <FieldLabel label="Beschrijving" htmlFor="caption" />
            <textarea
              id="caption"
              value={content}
              onChange={e => {
                if (e.target.value.length <= MAX_CAPTION) setContent(e.target.value)
              }}
              placeholder="Hoe was je activiteit?"
              rows={3}
              className="w-full resize-none border border-[#F5F2EE] rounded-lg px-3 py-2 text-[14px] text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E87722] min-h-[80px]"
              style={SYNE}
            />
            <div className="text-right text-[11px] text-gray-400 mt-1" style={SYNE}>
              {content.length}/{MAX_CAPTION}
            </div>
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
            description={isPublic ? 'Iedereen kan deze activiteit zien' : 'Alleen buddies kunnen deze activiteit zien'}
            value={isPublic}
            onChange={setIsPublic}
          />

          {/* Mobile share button */}
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
