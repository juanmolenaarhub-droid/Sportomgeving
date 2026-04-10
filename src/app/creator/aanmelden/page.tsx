'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowLeft, Check, Instagram, Youtube, Globe, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const CATEGORIES = [
  { value: 'personal_trainer', label: 'Personal Trainer' },
  { value: 'sport_influencer', label: 'Sport Influencer' },
  { value: 'coach', label: 'Coach' },
  { value: 'athlete', label: 'Atleet' },
  { value: 'other', label: 'Anders' },
]

const SPORTS = [
  'Hardlopen', 'Fietsen', 'Zwemmen', 'Gym', 'Voetbal',
  'Tennis', 'Golf', 'Yoga', 'Padel', 'Triathlon', 'Boksen', 'Klimmen',
]

const GOALS = [
  { value: 'challenges', label: 'Challenges hosten' },
  { value: 'coaching', label: 'Sporters coachen' },
  { value: 'promotions', label: 'Producten promoten' },
  { value: 'community', label: 'Community bouwen' },
]

const STEP_LABELS = ['Basis info', 'Jouw bereik', 'Akkoord']

export default function CreatorAanmeldenPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [category, setCategory] = useState('')
  const [biocreator, setBiocreator] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Step 2
  const [currentReach, setCurrentReach] = useState('')
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  // Step 3
  const [agreed, setAgreed] = useState(false)

  function toggleSport(sport: string) {
    setSelectedSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    )
  }

  function toggleGoal(goal: string) {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    )
  }

  function canNext() {
    if (step === 1) return category !== '' && biocreator.trim().length >= 20
    if (step === 2) return selectedSports.length > 0 && selectedGoals.length > 0
    if (step === 3) return agreed
    return false
  }

  async function handleSubmit() {
    if (!agreed) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Je moet ingelogd zijn om een aanvraag in te dienen.'); setLoading(false); return }

      const { error: err } = await supabase.from('creator_profiles').upsert({
        user_id: user.id,
        status: 'pending',
        creator_category: category,
        bio_creator: biocreator,
        website_url: websiteUrl || null,
        instagram_url: instagramUrl || null,
        tiktok_url: tiktokUrl || null,
        youtube_url: youtubeUrl || null,
        current_reach: currentReach ? parseInt(currentReach) : 0,
        sports: selectedSports,
        goals: selectedGoals,
      }, { onConflict: 'user_id' })

      if (err) throw err
      setSubmitted(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Er is iets misgegaan. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  // Thank you screen
  if (submitted) {
    return (
      <div style={DM} className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#E87722]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#E87722]" />
          </div>
          <h1 style={{ ...SYNE, fontWeight: 800 }} className="text-3xl text-black mb-3">Aanvraag ontvangen!</h1>
          <p className="text-gray-500 leading-relaxed mb-8">
            We nemen binnen <strong className="text-black">48 uur</strong> contact op. Na goedkeuring krijg je
            direct toegang tot het creator dashboard en de verified badge.
          </p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#111111] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#333] transition-colors">
            Terug naar dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={DM} className="min-h-screen bg-[#F5F0E8]">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/creator">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" />
          </Link>
          <Link href="/creator" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
            ← Terug
          </Link>
        </div>
      </header>

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">

          {/* Stap indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    i + 1 < step ? 'bg-[#111111] text-white' :
                    i + 1 === step ? 'bg-[#E87722] text-white' :
                    'bg-white border-2 border-gray-200 text-gray-400'
                  }`}>
                    {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-sm font-semibold hidden sm:block ${i + 1 === step ? 'text-black' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`hidden sm:block h-px w-12 mx-2 ${i + 1 < step ? 'bg-[#111111]' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#E87722] rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / (STEP_LABELS.length - 1)) * 100}%` }} />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-[#E8E0D5] p-8 shadow-sm">

            {/* ── STAP 1 ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ ...SYNE, fontWeight: 800 }} className="text-2xl text-black mb-1">Jouw creator profiel</h2>
                  <p className="text-sm text-gray-400">Vertel ons wie je bent als creator.</p>
                </div>

                {/* Categorie */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Creator categorie *</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                          category === cat.value
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Creator bio *</label>
                  <textarea
                    rows={4}
                    value={biocreator}
                    onChange={e => setBiocreator(e.target.value)}
                    placeholder="Vertel waarom jij een creator wil worden op Buddys en wat jij te bieden hebt aan de community..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none placeholder-gray-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">{biocreator.length} / min. 20 tekens</p>
                </div>

                {/* URLs */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700">Socials & website <span className="font-normal text-gray-400">(optioneel)</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                      placeholder="https://jouwwebsite.nl"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                  </div>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)}
                      placeholder="@jouwinstagram"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                  </div>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.21 8.21 0 004.8 1.53V6.75a4.84 4.84 0 01-1.03-.06z"/>
                    </svg>
                    <input type="text" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)}
                      placeholder="@jouwtiktok"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                  </div>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                      placeholder="youtube.com/c/jouwkanaal"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STAP 2 ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ ...SYNE, fontWeight: 800 }} className="text-2xl text-black mb-1">Jouw bereik</h2>
                  <p className="text-sm text-gray-400">Vertel ons meer over jouw community en doelen.</p>
                </div>

                {/* Huidige volgers */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Huidig aantal volgers op andere platforms
                    <span className="font-normal text-gray-400 ml-1">(optioneel)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentReach}
                    onChange={e => setCurrentReach(e.target.value)}
                    placeholder="Bijv. 5000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <p className="text-xs text-gray-400 mt-1">Combineer je volgers van Instagram, TikTok, YouTube etc.</p>
                </div>

                {/* Sporten */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Welke sporten behandel je? *</label>
                  <div className="flex flex-wrap gap-2">
                    {SPORTS.map(sport => (
                      <button
                        key={sport}
                        onClick={() => toggleSport(sport)}
                        className={`px-3.5 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                          selectedSports.includes(sport)
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {sport}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doelen */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Wat wil je doen op Buddys? *</label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map(goal => (
                      <button
                        key={goal.value}
                        onClick={() => toggleGoal(goal.value)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                          selectedGoals.includes(goal.value)
                            ? 'bg-[#E87722] text-white border-[#E87722]'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STAP 3 ── */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 style={{ ...SYNE, fontWeight: 800 }} className="text-2xl text-black mb-1">Bijna klaar!</h2>
                  <p className="text-sm text-gray-400">Controleer je aanvraag en dien hem in.</p>
                </div>

                {/* Samenvatting */}
                <div className="bg-[#F5F0E8] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Categorie</span>
                    <span className="font-semibold text-black capitalize">
                      {CATEGORIES.find(c => c.value === category)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Sporten</span>
                    <span className="font-semibold text-black">{selectedSports.slice(0, 3).join(', ')}{selectedSports.length > 3 ? ` +${selectedSports.length - 3}` : ''}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Doelen</span>
                    <span className="font-semibold text-black">{selectedGoals.length} geselecteerd</span>
                  </div>
                  {currentReach && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Huidig bereik</span>
                      <span className="font-semibold text-black">{parseInt(currentReach).toLocaleString('nl-NL')} volgers</span>
                    </div>
                  )}
                </div>

                {/* Uitleg */}
                <div className="bg-[#E87722]/8 border border-[#E87722]/20 rounded-2xl p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Jouw aanvraag wordt binnen <strong>48 uur</strong> beoordeeld door het Buddys team.
                    Na goedkeuring krijg je direct toegang tot het creator dashboard, de verified badge
                    en de mogelijkheid om challenges aan te maken.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Akkoord checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <button
                    onClick={() => setAgreed(!agreed)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      agreed ? 'bg-[#111111] border-[#111111]' : 'bg-white border-gray-300'
                    }`}
                  >
                    {agreed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className="text-sm text-gray-600 leading-relaxed">
                    Ik ga akkoord met de{' '}
                    <a href="#" className="text-[#E87722] font-semibold hover:underline">creator voorwaarden</a>{' '}
                    van Buddys en begrijp dat mijn aanvraag beoordeeld wordt voor activering.
                  </span>
                </label>
              </div>
            )}

            {/* Navigatie knoppen */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Terug
                </button>
              )}
              <button
                onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()}
                disabled={!canNext() || loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111111] text-white font-bold py-3 rounded-xl hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Bezig...' : step === 3 ? 'Aanvraag indienen' : 'Volgende stap'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Al een account?{' '}
            <Link href="/login" className="text-[#E87722] font-semibold hover:underline">Inloggen</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
