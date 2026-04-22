'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { SportSelector } from '@/components/ui/SportSelector'
import { getSportById } from '@/lib/sports'
import { Avatar, getInitials } from '@/components/Avatar'
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
  question?: string
  questionContext?: string
  answerType?: 'open' | 'poll'
  pollOptions?: string[]
  pollDurationDays?: number
  anonymousAnswers?: boolean
}

interface Props {
  onBack: () => void
  onSubmit: (data: StepTwoResult) => Promise<void>
  userName: string
  avatarUrl: string | null
  userId: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }


const POLL_DURATIONS: { label: string; days: number }[] = [
  { label: '1 dag', days: 1 },
  { label: '3 dagen', days: 3 },
  { label: '7 dagen', days: 7 },
  { label: '14 dagen', days: 14 },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step2Question({ onBack, onSubmit, userName, avatarUrl, userId }: Props) {
  const [question, setQuestion] = useState('')
  const [questionContext, setQuestionContext] = useState('')
  const [sport, setSport] = useState('')
  const [answerType, setAnswerType] = useState<'open' | 'poll'>('open')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollDurationDays, setPollDurationDays] = useState(7)
  const [focusedOption, setFocusedOption] = useState<number | null>(null)
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
  const [taggedUserNames, setTaggedUserNames] = useState<
    { id: string; name: string; username: string; avatarUrl?: string }[]
  >([])
  const [isPublic, setIsPublic] = useState(true)
  const [anonymousAnswers, setAnonymousAnswers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!question.trim()) e.question = 'Stel een vraag om te delen'
    if (answerType === 'poll') {
      const filled = pollOptions.filter((o) => o.trim())
      if (filled.length < 2) e.poll = 'Vul minimaal 2 opties in'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({
        content: question.trim(),
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
        question: question.trim(),
        questionContext: questionContext.trim() || undefined,
        answerType,
        pollOptions: answerType === 'poll' ? pollOptions.filter((o) => o.trim()) : undefined,
        pollDurationDays: answerType === 'poll' ? pollDurationDays : undefined,
        anonymousAnswers,
      })
    } finally {
      setSubmitting(false)
    }
  }

  function updateOption(index: number, value: string) {
    setPollOptions((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function addOption() {
    if (pollOptions.length >= 4) return
    setPollOptions((prev) => [...prev, ''])
  }

  function removeOption(index: number) {
    if (pollOptions.length <= 2) return
    setPollOptions((prev) => prev.filter((_, i) => i !== index))
  }

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
          Nieuwe vraag
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5 pt-4">
        {/* User row */}
        <div className="flex items-center gap-3">
          <Avatar initials={getInitials(userName)} imageUrl={avatarUrl} size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-gray-900" style={SYNE}>
              {userName}
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: '#FAF5FF', color: '#8B5CF6', ...SYNE }}
            >
              Vraag
            </span>
          </div>
        </div>

        {/* Question textarea */}
        <div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Stel je vraag..."
            rows={4}
            className="w-full bg-transparent text-[20px] font-semibold text-gray-900 placeholder-gray-300 outline-none resize-none leading-snug"
            style={{ caretColor: '#E87722', minHeight: 120, ...SYNE }}
          />
          {errors.question && (
            <p className="text-red-500 text-[11px] mt-1">{errors.question}</p>
          )}
        </div>

        {/* Context textarea */}
        <textarea
          value={questionContext}
          onChange={(e) => setQuestionContext(e.target.value)}
          placeholder="Meer context (optioneel)..."
          rows={2}
          className="w-full bg-transparent text-[14px] text-gray-500 placeholder-gray-300 outline-none resize-none"
          style={{ caretColor: '#E87722', ...SYNE }}
        />

        {/* Divider */}
        <div className="border-t" style={{ borderColor: '#F5F2EE' }} />

        {/* Sport selector */}
        <div>
          <SportSelector
            value={sport}
            onChange={v => setSport(v as string)}
            multiple={false}
            label="Sport (optioneel)"
            placeholder="Kies een sport..."
          />
        </div>

        {/* Answer type toggle */}
        <div>
          <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
            Type antwoord
          </p>
          <div
            className="flex rounded-xl overflow-hidden border"
            style={{ borderColor: '#F5F2EE', background: '#fff' }}
          >
            {(['open', 'poll'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setAnswerType(type)}
                className="flex-1 py-2.5 text-[13px] font-semibold transition-all"
                style={{
                  ...SYNE,
                  background: answerType === type ? '#E87722' : 'transparent',
                  color: answerType === type ? '#fff' : '#6B7280',
                }}
              >
                {type === 'open' ? 'Open vraag' : 'Poll'}
              </button>
            ))}
          </div>
        </div>

        {/* Poll options */}
        {answerType === 'poll' && (
          <div className="space-y-3">
            <p className="text-[12px] text-gray-400 uppercase tracking-wide" style={SYNE}>
              Opties
            </p>
            {pollOptions.map((opt, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 bg-white transition-all"
                style={{
                  border: focusedOption === i ? '1.5px solid #E87722' : '1.5px solid #F5F2EE',
                  borderLeft: focusedOption === i ? '3px solid #E87722' : '1.5px solid #F5F2EE',
                }}
              >
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  onFocus={() => setFocusedOption(i)}
                  onBlur={() => setFocusedOption(null)}
                  placeholder={`Optie ${i + 1}`}
                  className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder-gray-300 outline-none"
                  style={{ caretColor: '#E87722', ...SYNE }}
                />
                {pollOptions.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X size={12} color="#9CA3AF" />
                  </button>
                )}
              </div>
            ))}

            {/* Add option button */}
            {pollOptions.length < 4 && (
              <button
                onClick={addOption}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium text-gray-400 transition-colors hover:bg-gray-50 flex items-center justify-center gap-1.5"
                style={{
                  border: '1.5px dashed #E0DDD8',
                  ...SYNE,
                }}
              >
                <Plus size={14} color="#9CA3AF" />
                Optie toevoegen
              </button>
            )}

            {errors.poll && (
              <p className="text-red-500 text-[11px]">{errors.poll}</p>
            )}

            {/* Poll duration */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Poll eindigt na
              </p>
              <select
                value={pollDurationDays}
                onChange={(e) => setPollDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border text-[14px] text-gray-900 outline-none focus:border-[#E87722] transition-colors bg-white appearance-none cursor-pointer"
                style={{ borderColor: '#F5F2EE', ...SYNE }}
              >
                {POLL_DURATIONS.map((d) => (
                  <option key={d.days} value={d.days}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Tag people */}
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

        {/* Toggles */}
        <div
          className="rounded-2xl overflow-hidden divide-y"
          style={{ border: '1px solid #F5F2EE', background: '#fff' }}
        >
          <ToggleRow
            label="Zichtbaar voor iedereen"
            description="Openbaar of alleen voor buddies"
            value={isPublic}
            onChange={setIsPublic}
          />
          <ToggleRow
            label="Anonieme antwoorden toestaan"
            value={anonymousAnswers}
            onChange={setAnonymousAnswers}
          />
        </div>
      </div>
    </div>
  )
}
