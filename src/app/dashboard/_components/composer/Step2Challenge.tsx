'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { SportSelector } from '@/components/ui/SportSelector'
import { getSportById } from '@/lib/sports'
import { Avatar } from '@/components/Avatar'
import ToggleRow from '@/components/composer/ToggleRow'
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
  challengeName?: string
  challengeType?: string
  challengeGoal?: string | number
  challengeStart?: string
  challengeEnd?: string
  challengeDescription?: string
  requiresVerification?: boolean
  existingChallengeId?: string
}

interface Props {
  onBack: () => void
  onSubmit: (data: StepTwoResult) => Promise<void>
  userName: string
  avatarUrl: string | null
  userId: string
}

interface ExistingChallenge {
  id: string
  name: string
  sport: string
  start_date: string
  end_date: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }


type ChallengeType = 'Afstand (km)' | 'Tijd (min)' | 'Aantal (keer)' | 'Hoogteverschil (m)' | 'Vrij'

const CHALLENGE_TYPES: ChallengeType[] = [
  'Afstand (km)', 'Tijd (min)', 'Aantal (keer)', 'Hoogteverschil (m)', 'Vrij',
]

const UNIT_MAP: Record<ChallengeType, string> = {
  'Afstand (km)': 'km',
  'Tijd (min)': 'min',
  'Aantal (keer)': 'keer',
  'Hoogteverschil (m)': 'm',
  'Vrij': '',
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step2Challenge({ onBack, onSubmit, userName, avatarUrl, userId }: Props) {
  const supabase = createClient()

  const [mode, setMode] = useState<'new' | 'existing'>('new')

  // Existing challenges
  const [existingChallenges, setExistingChallenges] = useState<ExistingChallenge[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null)

  // Form
  const [challengeName, setChallengeName] = useState('')
  const [sport, setSport] = useState('')
  const [challengeType, setChallengeType] = useState<ChallengeType>('Afstand (km)')
  const [goalNumeric, setGoalNumeric] = useState<string>('')
  const [goalText, setGoalText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
  const [taggedUserNames, setTaggedUserNames] = useState<
    { id: string; name: string; username: string; avatarUrl?: string }[]
  >([])
  const [isPublic, setIsPublic] = useState(true)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (mode !== 'existing') return
    setLoadingExisting(true)
    supabase
      .from('challenges')
      .select('*')
      .eq('creator_id', userId)
      .gte('end_date', new Date().toISOString())
      .then(({ data }) => {
        setExistingChallenges((data as ExistingChallenge[]) ?? [])
        setLoadingExisting(false)
      })
  }, [mode, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (mode === 'new') {
      if (!challengeName.trim()) e.challengeName = 'Vereist'
      if (!sport) e.sport = 'Kies een sport'
    } else {
      if (!selectedExistingId) e.existing = 'Selecteer een challenge'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      let existingChallengeId: string | undefined

      const isNumericType = challengeType !== 'Vrij'
      const challengeGoal: string | number | undefined = isNumericType
        ? goalNumeric ? Number(goalNumeric) : undefined
        : goalText.trim() || undefined

      if (mode === 'existing') {
        existingChallengeId = selectedExistingId ?? undefined
      } else {
        const { data: inserted, error } = await supabase
          .from('challenges')
          .insert({
            creator_id: userId,
            name: challengeName.trim(),
            sport,
            challenge_type: challengeType,
            goal: challengeGoal,
            start_date: startDate || null,
            end_date: endDate || null,
            description: description.trim() || null,
            is_public: isPublic,
            requires_verification: requiresVerification,
          })
          .select('id')
          .single()

        if (error) throw error
        existingChallengeId = (inserted as { id: string }).id
      }

      await onSubmit({
        content: description.trim(),
        sport: getSportById(sport)?.label ?? sport,
        locationName: '',
        locationLat: null,
        locationLng: null,
        music: '',
        taggedUserIds,
        taggedUserNames,
        isPublic,
        commentsDisabled: false,
        likesHidden: false,
        notShareable: false,
        mediaFile: null,
        challengeName: challengeName.trim() || undefined,
        challengeType,
        challengeGoal,
        challengeStart: startDate || undefined,
        challengeEnd: endDate || undefined,
        challengeDescription: description.trim() || undefined,
        requiresVerification,
        existingChallengeId,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isNumericType = challengeType !== 'Vrij'
  const unit = UNIT_MAP[challengeType]

  const previewStart = startDate ? formatDateShort(startDate) : null
  const previewEnd = endDate ? formatDateShort(endDate) : null

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
          <ArrowLeft size={20} color="#1E2B20" />
        </button>
        <span className="text-[15px] font-semibold text-gray-900" style={SYNE}>
          Nieuwe challenge
        </span>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-1.5 rounded-full text-white text-[13px] font-semibold transition-opacity disabled:opacity-50"
          style={{ background: '#C4F542', ...SYNE }}
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
              background: mode === m ? '#C4F542' : '#F5F2EE',
              color: mode === m ? '#fff' : '#6B7280',
            }}
          >
            {m === 'new' ? 'Nieuwe challenge' : 'Bestaande challenge'}
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
            ) : existingChallenges.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-[14px]">
                Geen actieve challenges gevonden
              </div>
            ) : (
              existingChallenges.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedExistingId(c.id)}
                  className="w-full text-left p-4 rounded-2xl border transition-all"
                  style={{
                    background: selectedExistingId === c.id ? '#FFFBEB' : '#fff',
                    borderColor: selectedExistingId === c.id ? '#F59E0B' : '#F5F2EE',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] text-gray-900 truncate" style={SYNE}>
                        {c.name}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {formatDateShort(c.start_date)} → {formatDateShort(c.end_date)}
                      </p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
                      style={{ background: '#FFF7ED', color: '#F59E0B' }}
                    >
                      {c.sport}
                    </span>
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
                  style={{ background: '#FFF7ED', color: '#F59E0B', ...SYNE }}
                >
                  Challenge
                </span>
              </div>
            </div>

            {/* Challenge naam */}
            <div>
              <input
                type="text"
                value={challengeName}
                onChange={(e) => setChallengeName(e.target.value)}
                placeholder="Challenge naam *"
                className="w-full bg-transparent border-b text-[16px] font-semibold text-gray-900 placeholder-gray-300 outline-none pb-2 focus:border-[#C4F542] transition-colors"
                style={{ borderColor: errors.challengeName ? '#EF4444' : '#E0DDD8', ...SYNE }}
              />
              {errors.challengeName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.challengeName}</p>
              )}
            </div>

            {/* Sport selector */}
            <div>
              <SportSelector
                value={sport}
                onChange={v => setSport(v as string)}
                multiple={false}
                label="Sport *"
                placeholder="Kies een sport..."
                error={errors.sport}
              />
            </div>

            {/* Challenge type pills – horizontal scroll */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Type
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CHALLENGE_TYPES.map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setChallengeType(ct)}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap flex-shrink-0"
                    style={{
                      ...SYNE,
                      background: challengeType === ct ? '#C4F542' : '#F5F2EE',
                      color: challengeType === ct ? '#fff' : '#6B7280',
                    }}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>

            {/* Doel */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Doel{unit ? ` (${unit})` : ''}
              </p>
              {isNumericType ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={goalNumeric}
                    onChange={(e) => setGoalNumeric(e.target.value)}
                    placeholder="0"
                    min={0}
                    className="flex-1 px-3 py-2.5 rounded-xl border text-[14px] text-gray-900 outline-none focus:border-[#C4F542] transition-colors bg-white"
                    style={{ borderColor: '#F5F2EE', ...SYNE }}
                  />
                  {unit && (
                    <span className="text-[14px] text-gray-400 font-medium" style={SYNE}>
                      {unit}
                    </span>
                  )}
                </div>
              ) : (
                <textarea
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="Beschrijf het doel vrij…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-700 outline-none focus:border-[#C4F542] transition-colors bg-white resize-none placeholder-gray-300"
                  style={{ borderColor: '#F5F2EE', caretColor: '#C4F542', ...SYNE }}
                />
              )}
            </div>

            {/* Startdatum + Einddatum */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                  Startdatum
                </p>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-900 outline-none focus:border-[#C4F542] transition-colors bg-white"
                  style={{ borderColor: '#F5F2EE', ...SYNE }}
                />
              </div>
              <div>
                <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                  Einddatum
                </p>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-900 outline-none focus:border-[#C4F542] transition-colors bg-white"
                  style={{ borderColor: '#F5F2EE', ...SYNE }}
                />
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
                placeholder="Vertel meer over deze challenge…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-700 outline-none focus:border-[#C4F542] transition-colors bg-white resize-none placeholder-gray-300"
                style={{ borderColor: '#F5F2EE', caretColor: '#C4F542', ...SYNE }}
              />
            </div>

            {/* Tag people */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Deelnemers uitnodigen
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
                description="Zichtbaar voor iedereen"
                value={isPublic}
                onChange={setIsPublic}
              />
              <ToggleRow
                label="Verificatie vereist"
                description="Deelnemers moeten resultaat verifiëren"
                value={requiresVerification}
                onChange={setRequiresVerification}
              />
            </div>

            {/* Live preview card */}
            <div
              className="rounded-2xl p-4 mt-2"
              style={{ border: '1.5px solid #C4F542', borderRadius: 16, background: '#fff' }}
            >
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Voorbeeld
              </p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⭐</span>
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: '#F59E0B', ...SYNE }}
                >
                  Challenge
                </span>
              </div>
              <p className="text-[16px] font-bold text-gray-900 mb-1" style={SYNE}>
                {challengeName || 'Challenge naam'}
              </p>
              <p className="text-[13px] text-gray-500 mb-1" style={SYNE}>
                {sport || 'Sport'} · {challengeType}
              </p>
              {(previewStart || previewEnd) && (
                <p className="text-[13px] text-gray-500 mb-1" style={SYNE}>
                  {previewStart ?? '?'} → {previewEnd ?? '?'}
                </p>
              )}
              {(goalNumeric || goalText) && (
                <p className="text-[13px] font-semibold text-gray-700" style={SYNE}>
                  Doel: {goalNumeric || goalText} {unit}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
