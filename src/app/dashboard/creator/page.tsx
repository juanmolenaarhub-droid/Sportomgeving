'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, BarChart2, Trophy, Euro, Plus, X, Check,
  AlertCircle, CheckCircle, Calendar, Tag, ToggleLeft, ToggleRight,
  ChevronRight, Flame,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const SPORTS = [
  'Hardlopen', 'Fietsen', 'Zwemmen', 'Gym', 'Voetbal',
  'Tennis', 'Golf', 'Yoga', 'Padel', 'Triathlon', 'Boksen', 'Klimmen',
]

type CreatorProfile = {
  id: string
  is_verified: boolean
  creator_category: string
  total_followers: number
  status: string
}

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
  is_active: boolean
}

type Analytics = {
  profile_views: number
  new_followers: number
  challenge_signups: number
  total_revenue: number
}

// ── Demo data voor UI preview ─────────────────────────────────────────────────
const DEMO_CHALLENGES: Challenge[] = [
  {
    id: 'c1', title: '30 Dagen Hardloop Challenge', description: 'Loop elke dag minstens 3km gedurende 30 dagen.',
    sport_tag: 'Hardlopen', price: 0, duration_days: 30, max_participants: 100,
    current_participants: 47, start_date: '2025-05-01', end_date: '2025-05-31', is_active: true,
  },
  {
    id: 'c2', title: 'Summer Cycling 500km', description: 'Fiets 500km in één maand. Met wekelijkse check-ins.',
    sport_tag: 'Fietsen', price: 9.99, duration_days: 30, max_participants: 50,
    current_participants: 23, start_date: '2025-06-01', end_date: '2025-06-30', is_active: true,
  },
]

const DEMO_ANALYTICS: Analytics = {
  profile_views: 1284,
  new_followers: 38,
  challenge_signups: 70,
  total_revenue: 229.77,
}

export default function CreatorDashboardPage() {
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>(DEMO_CHALLENGES)
  const [analytics] = useState<Analytics>(DEMO_ANALYTICS)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [savingChallenge, setSavingChallenge] = useState(false)

  // New challenge form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSport, setNewSport] = useState('Hardlopen')
  const [newPrice, setNewPrice] = useState('')
  const [newDays, setNewDays] = useState('30')
  const [newMax, setNewMax] = useState('100')
  const [newStart, setNewStart] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('creator_profiles')
        .select('id, is_verified, creator_category, total_followers, status')
        .eq('user_id', user.id)
        .single()
      if (data) setCreator(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleCreateChallenge() {
    if (!newTitle.trim() || !newDesc.trim() || !newStart) return
    setSavingChallenge(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !creator) return

      const startDate = new Date(newStart)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + parseInt(newDays || '30'))

      const { data, error } = await supabase.from('creator_challenges').insert({
        creator_id: creator.id,
        title: newTitle,
        description: newDesc,
        sport_tag: newSport,
        price: parseFloat(newPrice || '0'),
        duration_days: parseInt(newDays || '30'),
        max_participants: parseInt(newMax || '100'),
        start_date: newStart,
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
      }).select().single()

      if (!error && data) {
        setChallenges(prev => [data, ...prev])
        setShowModal(false)
        setNewTitle(''); setNewDesc(''); setNewPrice(''); setNewStart('')
        setNewDays('30'); setNewMax('100'); setNewSport('Hardlopen')
      }
    } finally {
      setSavingChallenge(false)
    }
  }

  function toggleChallenge(id: string) {
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#E87722] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not a creator yet
  if (!creator) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 bg-[#E87722]/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Flame className="w-8 h-8 text-[#E87722]" />
        </div>
        <h1 style={{ ...SYNE, fontWeight: 800 }} className="text-2xl text-black mb-3">Je bent nog geen creator</h1>
        <p className="text-gray-500 mb-8">Meld je aan als creator om toegang te krijgen tot het dashboard, challenges en de verified badge.</p>
        <Link href="/creator/aanmelden"
          className="inline-flex items-center gap-2 bg-[#E87722] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#111] transition-colors">
          Aanmelden als creator <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const isVerified = creator.is_verified
  const isPending = creator.status === 'pending'

  return (
    <div style={DM} className="space-y-8 max-w-5xl">

      {/* Verificatie status balk */}
      {!isVerified && isPending && (
        <div className="flex items-start gap-3 bg-[#E87722]/8 border border-[#E87722]/25 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 text-[#E87722] shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            <strong>Je bent nog niet geverifieerd.</strong> Ons team beoordeelt jouw aanvraag binnen 48 uur.
            Na goedkeuring verschijnt de verified badge op je profiel.
          </p>
        </div>
      )}
      {isVerified && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-green-800">Je bent een verified creator op Buddys.</p>
            <VerifiedBadge />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ ...SYNE, fontWeight: 800 }} className="text-2xl text-black">Creator Studio</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {creator.creator_category.replace('_', ' ')} {isVerified && '· Verified'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#E87722] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#111] transition-colors"
        >
          <Plus className="w-4 h-4" /> Nieuwe challenge
        </button>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Totaal volgers', value: creator.total_followers.toLocaleString('nl-NL'), icon: Users, color: 'bg-blue-50 text-blue-500' },
          { label: 'Profielviews (mnd)', value: analytics.profile_views.toLocaleString('nl-NL'), icon: BarChart2, color: 'bg-purple-50 text-purple-500' },
          { label: 'Challenge deelnemers', value: analytics.challenge_signups.toLocaleString('nl-NL'), icon: Trophy, color: 'bg-[#E87722]/10 text-[#E87722]' },
          { label: 'Totale inkomsten', value: `€${analytics.total_revenue.toFixed(2)}`, icon: Euro, color: 'bg-green-50 text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#E8E0D5] p-5">
            <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-4.5 h-4.5" />
            </div>
            <p style={SYNE} className="text-2xl font-black text-black">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── CHALLENGES ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ ...SYNE, fontWeight: 700 }} className="text-lg text-black">Mijn challenges</h2>
          <span className="text-xs text-gray-400">{challenges.length} challenge{challenges.length !== 1 ? 's' : ''}</span>
        </div>

        {challenges.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-400">Nog geen challenges</p>
            <p className="text-sm text-gray-400 mt-1">Maak je eerste challenge aan via de knop hierboven.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map(ch => (
              <div key={ch.id} className="bg-white rounded-2xl border border-[#E8E0D5] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-black">{ch.title}</h3>
                      {ch.is_active
                        ? <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actief</span>
                        : <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactief</span>
                      }
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {ch.sport_tag}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {ch.current_participants}/{ch.max_participants} deelnemers
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {ch.start_date} {ch.end_date ? `→ ${ch.end_date}` : ''}
                      </span>
                      <span className="font-semibold text-black">
                        {ch.price === 0 ? 'Gratis' : `€${ch.price}`}
                      </span>
                    </div>
                    {/* Voortgangsbalk */}
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                      <div
                        className="h-full bg-[#E87722] rounded-full"
                        style={{ width: `${Math.min((ch.current_participants / ch.max_participants) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChallenge(ch.id)}
                    className="shrink-0 mt-1"
                    title={ch.is_active ? 'Deactiveren' : 'Activeren'}
                  >
                    {ch.is_active
                      ? <ToggleRight className="w-6 h-6 text-[#E87722]" />
                      : <ToggleLeft className="w-6 h-6 text-gray-300" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: Nieuwe challenge ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 style={{ ...SYNE, fontWeight: 800 }} className="text-xl text-black">Nieuwe challenge aanmaken</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Titel *</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Bijv. 30 Dagen Hardloop Challenge"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Beschrijving *</label>
                <textarea rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Vertel wat deelnemers kunnen verwachten..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Sport</label>
                  <select value={newSport} onChange={e => setNewSport(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white">
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Prijs (€)</label>
                  <input type="number" min="0" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    placeholder="0 = gratis"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Duur (dagen)</label>
                  <input type="number" min="1" value={newDays} onChange={e => setNewDays(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Max. deelnemers</label>
                  <input type="number" min="1" value={newMax} onChange={e => setNewMax(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Startdatum *</label>
                <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                Annuleren
              </button>
              <button
                onClick={handleCreateChallenge}
                disabled={!newTitle.trim() || !newDesc.trim() || !newStart || savingChallenge}
                className="flex-1 bg-[#E87722] text-white font-bold py-3 rounded-xl hover:bg-[#111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
              >
                {savingChallenge ? 'Aanmaken...' : <><Check className="w-4 h-4" /> Challenge aanmaken</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
