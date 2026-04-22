'use client'

import { useState, useTransition } from 'react'
import { X, Send } from 'lucide-react'
import { showInterest } from '@/app/actions/meetups'

const SPORT_CHIPS: Record<string, string[]> = {
  'Hardlopen': ['Ik loop ook! Welk tempo houd jij aan?', 'Op zoek naar een hardloopmaatje voor de ochtend', 'Ik doe mee! Ik ben beginner/gemiddeld niveau'],
  'Fietsen': ['Ik fietst ook! Welke afstand ga je?', 'Ik zoek ook een fietsmaatje!', 'Ik doe graag mee — ik ben gevorderd'],
  'Gym': ['Hey! Ik train ook in de gym. Spottermaatje gezocht?', 'Ik doe mee! Welke split doe jij?', 'Op zoek naar een trainingsbuddy'],
  'Yoga': ['Ik beoefen ook yoga! Welk niveau?', 'Ik doe graag mee aan jouw sessie', 'Op zoek naar een rustige trainingspartner'],
  'Zwemmen': ['Ik zwem ook! Welke stijl train jij?', 'Ik doe mee! Banen of vrij zwemmen?', 'Geweldig initiatief, ik sluit me graag aan'],
  default: ['Hey! Ik wil graag meedoen', 'Ik ben ook op zoek naar een trainingsmaatje', 'Klinkt super, ik doe mee!'],
}

type Props = {
  meetupId: string
  meetupTitle: string
  creatorName: string
  sport: string
  onClose: () => void
  onSuccess: () => void
}

export default function InterestModal({ meetupId, meetupTitle, creatorName, sport, onClose, onSuccess }: Props) {
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const chips = SPORT_CHIPS[sport] ?? SPORT_CHIPS.default

  function handleSend() {
    startTransition(async () => {
      const res = await showInterest(meetupId, message.trim() || undefined)
      if (res.success) {
        onSuccess()
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#F4F1E8] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-black/8">
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: '#1E2B20' }}>
              Laat {creatorName} weten wie je bent
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{meetupTitle}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center hover:bg-black/12 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => setMessage(chip)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${
                  message === chip
                    ? 'bg-[#C4F542] text-white border-[#C4F542]'
                    : 'bg-white text-gray-600 border-black/10 hover:border-[#C4F542] hover:text-[#C4F542]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 200))}
              placeholder={`Hey! Ik train ook ${sport} en ben op zoek naar een trainingsmaatje...`}
              className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C4F542]"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{message.length}/200</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600 hover:bg-black/5 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSend}
              disabled={isPending}
              className="flex-1 py-3 rounded-xl bg-[#C4F542] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#d4691d] transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isPending ? 'Versturen...' : 'Stuur interesse'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
