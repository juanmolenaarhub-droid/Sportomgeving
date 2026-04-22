'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Users, Calendar, ArrowRight, Check, Euro, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Avatar } from '@/components/Avatar'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const SPORT_FILTERS = [
  { value: 'all', label: 'Alle sporten' },
  { value: 'Hardlopen', label: 'Hardlopen' },
  { value: 'Fietsen', label: 'Fietsen' },
  { value: 'Gym', label: 'Gym' },
  { value: 'Zwemmen', label: 'Zwemmen' },
  { value: 'Yoga', label: 'Yoga' },
  { value: 'Voetbal', label: 'Voetbal' },
  { value: 'Padel', label: 'Padel' },
  { value: 'Triathlon', label: 'Triathlon' },
]

type Challenge = {
  id: string
  title: string
  description: string
  sport_tag: string
  price: number
  duration_days: number
  max_participants: number
  current_participants: number
  start_date: string
  end_date: string | null
  creator_name: string
  creator_verified: boolean
}

// Demo challenges voor UI preview
const DEMO_CHALLENGES: Challenge[] = [
  {
    id: '1', title: '30 Dagen Hardloop Challenge',
    description: 'Loop elke dag minstens 3km gedurende 30 dagen. Met dagelijkse tips en wekelijkse check-ins via de app.',
    sport_tag: 'Hardlopen', price: 0, duration_days: 30, max_participants: 100, current_participants: 47,
    start_date: '2025-05-01', end_date: '2025-05-31', creator_name: 'RunCoach Tim', creator_verified: true,
  },
  {
    id: '2', title: 'Summer Cycling 500km',
    description: 'Fiets 500km in één maand. Wekelijkse routes, Strava koppeling en een eindprijs voor de snelste.',
    sport_tag: 'Fietsen', price: 9.99, duration_days: 30, max_participants: 50, current_participants: 23,
    start_date: '2025-06-01', end_date: '2025-06-30', creator_name: 'CyclingPro Sarah', creator_verified: true,
  },
  {
    id: '3', title: '21 Dagen Yoga Reset',
    description: 'Begin elke ochtend met een korte yogaroutine. Perfect voor beginners en gevorderden.',
    sport_tag: 'Yoga', price: 4.99, duration_days: 21, max_participants: 200, current_participants: 134,
    start_date: '2025-05-15', end_date: '2025-06-05', creator_name: 'YogaWithLisa', creator_verified: true,
  },
  {
    id: '4', title: 'Gym Gainz — 8 Weken Programma',
    description: 'Gestructureerd krachtprogramma van 8 weken. Van beginner tot gevorderd. Inclusief voedingsschema.',
    sport_tag: 'Gym', price: 14.99, duration_days: 56, max_participants: 75, current_participants: 31,
    start_date: '2025-06-01', end_date: '2025-07-27', creator_name: 'CoachMarco', creator_verified: true,
  },
  {
    id: '5', title: 'Open Water Zwemmarathon',
    description: 'Swim een totaal van 10km openwater gedurende de maand juni. In groepen of solo.',
    sport_tag: 'Zwemmen', price: 0, duration_days: 30, max_participants: 60, current_participants: 18,
    start_date: '2025-06-01', end_date: '2025-06-30', creator_name: 'AquaCoach Anna', creator_verified: false,
  },
  {
    id: '6', title: 'Triathlon Prep: Sprint Distance',
    description: '6 weken training naar je eerste sprint triathlon. Zwemmen, fietsen én lopen gecombineerd.',
    sport_tag: 'Triathlon', price: 19.99, duration_days: 42, max_participants: 30, current_participants: 12,
    start_date: '2025-05-20', end_date: '2025-07-01', creator_name: 'TriCoach Kevin', creator_verified: true,
  },
]

function ChallengeCard({ challenge, onJoin, joined }: { challenge: Challenge; onJoin: () => void; joined: boolean }) {
  const pct = Math.min((challenge.current_participants / challenge.max_participants) * 100, 100)
  const spotsLeft = challenge.max_participants - challenge.current_participants
  const isFull = spotsLeft <= 0

  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden hover:border-[#111]/20 hover:shadow-md transition-all flex flex-col">
      {/* Sport label */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold bg-[#C4F542]/10 text-[#C4F542] px-2.5 py-1 rounded-full">
            {challenge.sport_tag}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            challenge.price === 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
          }`}>
            {challenge.price === 0 ? 'Gratis' : `€${challenge.price}`}
          </span>
        </div>
        <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-black text-base leading-snug mb-1">{challenge.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{challenge.description}</p>
      </div>

      <div className="px-5 py-3 flex-1">
        {/* Creator */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar name={challenge.creator_name} size="xs" />
          <span className="text-xs font-semibold text-gray-700">{challenge.creator_name}</span>
          {challenge.creator_verified && <VerifiedBadge />}
        </div>

        {/* Stats */}
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Deelnemers</span>
            <span className="font-semibold text-black">{challenge.current_participants}/{challenge.max_participants}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#C4F542] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Duur</span>
            <span className="font-semibold text-black">{challenge.duration_days} dagen</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Start</span>
            <span className="font-semibold text-black">{challenge.start_date}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        {isFull ? (
          <div className="w-full py-2.5 bg-gray-100 text-gray-400 text-sm font-bold rounded-xl text-center">
            Vol
          </div>
        ) : joined ? (
          <div className="w-full py-2.5 bg-green-50 text-green-700 text-sm font-bold rounded-xl text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Aangemeld
          </div>
        ) : (
          <button
            onClick={onJoin}
            className="w-full py-2.5 bg-[#1E2B20] text-white text-sm font-bold rounded-xl hover:bg-[#C4F542] transition-colors flex items-center justify-center gap-2"
          >
            {challenge.price === 0 ? 'Gratis deelnemen' : `Deelnemen — €${challenge.price}`}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        {!isFull && !joined && spotsLeft <= 10 && (
          <p className="text-center text-[10px] text-[#C4F542] font-semibold mt-1.5">
            Nog {spotsLeft} plekken beschikbaar!
          </p>
        )}
      </div>
    </div>
  )
}

export default function ChallengesPage() {
  const [sportFilter, setSportFilter] = useState('all')
  const [challenges] = useState<Challenge[]>(DEMO_CHALLENGES)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())
  const [showPayModal, setShowPayModal] = useState<Challenge | null>(null)

  const filtered = sportFilter === 'all'
    ? challenges
    : challenges.filter(c => c.sport_tag === sportFilter)

  async function handleJoin(challenge: Challenge) {
    if (challenge.price > 0) {
      setShowPayModal(challenge)
      return
    }
    // Gratis challenge — direct aanmelden
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('challenge_participants').insert({
        challenge_id: challenge.id,
        user_id: user.id,
      })
    } catch {
      // Demo: ignore errors (challenge id's zijn demo UUIDs)
    }
    setJoinedIds(prev => new Set([...prev, challenge.id]))
  }

  return (
    <div style={DM} className="bg-[#F4F1E8] min-h-screen">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F4F1E8]/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="hover:text-black transition-colors">Dashboard</Link>
            <Link href="/challenges" className="text-black font-semibold">Challenges</Link>
            <Link href="/dashboard/find" className="hover:text-black transition-colors">Zoek buddies</Link>
          </nav>
          <Link href="/dashboard/creator"
            className="bg-[#1E2B20] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#C4F542] transition-colors flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Creator Studio
          </Link>
        </div>
      </header>

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-8">

        {/* Hero */}
        <div className="mb-10">
          <p className="text-xs font-bold text-[#C4F542] uppercase tracking-widest mb-3">Sport challenges</p>
          <h1 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
            className="text-[clamp(36px,5vw,64px)] text-black mb-3">
            Doe mee aan een challenge.
          </h1>
          <p className="text-gray-500 text-lg font-light max-w-xl">
            Door verified creators samengestelde sport-challenges. Gratis of betaald. Begin vandaag.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-8" style={{ scrollbarWidth: 'none' }}>
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {SPORT_FILTERS.map(f => (
            <button key={f.value} onClick={() => setSportFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all shrink-0 ${
                sportFilter === f.value
                  ? 'bg-[#1E2B20] text-white border-[#1E2B20]'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(ch => (
            <ChallengeCard
              key={ch.id}
              challenge={ch}
              joined={joinedIds.has(ch.id)}
              onJoin={() => handleJoin(ch)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-400">Geen challenges gevonden</p>
            <p className="text-sm text-gray-400 mt-1">Probeer een andere sport-filter.</p>
          </div>
        )}

        {/* Creator CTA */}
        <div className="mt-14 bg-[#1E2B20] rounded-3xl p-10 text-center">
          <p className="text-xs font-bold text-[#C4F542] uppercase tracking-widest mb-4">Ben jij een trainer of creator?</p>
          <h2 style={{ ...SYNE, fontWeight: 800 }} className="text-3xl text-white mb-3">
            Host jouw eigen challenge
          </h2>
          <p className="text-gray-400 font-light mb-8 max-w-md mx-auto">
            Bereik duizenden sporters en verdien aan jouw expertise. Gratis aanmelden als creator.
          </p>
          <Link href="/creator/aanmelden"
            className="inline-flex items-center gap-2 bg-[#C4F542] text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-black transition-all duration-200">
            Aanmelden als creator <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Betaal modal (placeholder) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPayModal(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-[#C4F542]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Euro className="w-6 h-6 text-[#C4F542]" />
              </div>
              <h3 style={SYNE} className="text-xl font-black text-black mb-1">{showPayModal.title}</h3>
              <p className="text-2xl font-black text-[#C4F542]" style={SYNE}>€{showPayModal.price}</p>
            </div>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              Betaling via iDEAL, creditcard of andere methode. Veilig en direct.
            </p>
            <button
              className="w-full bg-[#1E2B20] text-white font-bold py-3.5 rounded-2xl hover:bg-[#C4F542] transition-colors text-sm mb-3"
              onClick={() => { setJoinedIds(prev => new Set([...prev, showPayModal.id])); setShowPayModal(null) }}
            >
              Betalen — €{showPayModal.price} <span className="text-white/60 font-normal">(demo)</span>
            </button>
            <button onClick={() => setShowPayModal(null)}
              className="w-full text-gray-400 text-sm font-semibold py-2 hover:text-gray-600 transition-colors">
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
