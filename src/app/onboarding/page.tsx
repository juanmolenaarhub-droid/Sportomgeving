'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const SPORTS = [
  { id: 1, name: 'Hardlopen' },
  { id: 2, name: 'Fietsen' },
  { id: 3, name: 'Zwemmen' },
  { id: 4, name: 'Gym / Fitness' },
  { id: 5, name: 'Voetbal' },
  { id: 6, name: 'Tennis' },
  { id: 7, name: 'Golf' },
  { id: 8, name: 'Yoga' },
  { id: 9, name: 'Wandelen' },
  { id: 10, name: 'Basketbal' },
  { id: 11, name: 'Padel' },
  { id: 12, name: 'Volleybal' },
]

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Gemiddeld' },
  { value: 'advanced', label: 'Gevorderd' },
]

type SelectedSport = { sport_id: number; level: string }

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [region, setRegion] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [selectedSports, setSelectedSports] = useState<SelectedSport[]>([])
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [availability, setAvailability] = useState<string[]>([])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  function toggleSport(sportId: number) {
    setSelectedSports((prev) => {
      const exists = prev.find((s) => s.sport_id === sportId)
      if (exists) return prev.filter((s) => s.sport_id !== sportId)
      return [...prev, { sport_id: sportId, level: 'beginner' }]
    })
  }

  function setSportLevel(sportId: number, level: string) {
    setSelectedSports((prev) =>
      prev.map((s) => (s.sport_id === sportId ? { ...s, level } : s))
    )
  }

  function toggleAvailability(val: string) {
    setAvailability((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  async function handleFinish() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let avatarUrl = ''
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        region,
        age: age ? parseInt(age) : null,
        bio,
        avatar_url: avatarUrl || undefined,
        relationship_status: relationshipStatus || null,
      })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (selectedSports.length > 0) {
      await supabase.from('user_sports').upsert(
        selectedSports.map((s) => ({
          user_id: user.id,
          sport_id: s.sport_id,
          level: s.level,
          looking_for_partner: true,
        }))
      )
    }

    router.push('/dashboard')
  }

  const steps = [
    { number: 1, label: 'Jouw profiel' },
    { number: 2, label: 'Jouw sporten' },
    { number: 3, label: 'Voorkeuren' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigatiebalk */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/logo.png" alt="Buddys" height={36} width={120} className="object-contain" /></Link>
          <span className="text-sm text-gray-400">Stap {step} van 3</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
        {/* Stap indicator */}
        <div className="flex items-center gap-0 mb-10">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                  step === s.number ? 'bg-[#E87722] text-white' :
                  step > s.number ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'
                }`}>{s.number}</div>
                <span className={`text-sm font-semibold hidden sm:block ${step === s.number ? 'text-black' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-4 ${step > s.number ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulier kolom */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

            {/* STAP 1 */}
            {step === 1 && (
              <>
                <h2 className="text-2xl font-black text-black mb-1">Vertel iets over jezelf</h2>
                <p className="text-gray-400 text-sm mb-8">Dit is wat andere sporters als eerste zien op jouw profiel.</p>

                <div className="flex items-start gap-6 mb-8">
                  <label className="cursor-pointer group shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-[#E87722] transition-colors">
                      {avatarPreview
                        ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                        : <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                      }
                    </div>
                    <p className="text-center text-xs text-[#E87722] font-semibold mt-2">Foto uploaden</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Volledige naam *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                      placeholder="Jan de Vries"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Regio / Stad *</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                      placeholder="Amsterdam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Leeftijd</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min={16} max={99}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                      placeholder="25"
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Over mij</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] resize-none"
                    placeholder="Ik sport graag 3x per week en zoek iemand om mee te hardlopen in de ochtend..."
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!fullName || !region}
                  className="bg-[#E87722] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#d06a1a] transition-colors disabled:opacity-40"
                >
                  Volgende stap →
                </button>
              </>
            )}

            {/* STAP 2 */}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-black text-black mb-1">Welke sporten doe jij?</h2>
                <p className="text-gray-400 text-sm mb-8">Selecteer alle sporten die je beoefent. Je kunt er altijd meer toevoegen later.</p>

                <div className="grid grid-cols-4 gap-3 mb-8">
                  {SPORTS.map((sport) => {
                    const selected = selectedSports.find((s) => s.sport_id === sport.id)
                    return (
                      <button
                        key={sport.id}
                        onClick={() => toggleSport(sport.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          selected ? 'border-[#E87722] bg-orange-50' : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{sport.name}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedSports.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-5 mb-8">
                    <p className="text-sm font-bold text-gray-700 mb-4">Jouw niveau per sport</p>
                    <div className="space-y-3">
                      {selectedSports.map((s) => {
                        const sport = SPORTS.find((sp) => sp.id === s.sport_id)!
                        return (
                          <div key={s.sport_id} className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700 w-28">{sport.name}</span>
                            <div className="flex gap-2">
                              {LEVELS.map((l) => (
                                <button
                                  key={l.value}
                                  onClick={() => setSportLevel(s.sport_id, l.value)}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                                    s.level === l.value ? 'bg-[#E87722] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
                                  }`}
                                >
                                  {l.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">← Terug</button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={selectedSports.length === 0}
                    className="bg-[#E87722] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#d06a1a] transition-colors disabled:opacity-40"
                  >
                    Volgende stap →
                  </button>
                </div>
              </>
            )}

            {/* STAP 3 */}
            {step === 3 && (
              <>
                <h2 className="text-2xl font-black text-black mb-1">Jouw voorkeuren</h2>
                <p className="text-gray-400 text-sm mb-8">Wanneer ben jij beschikbaar om te sporten?</p>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Beschikbaarheid</label>
                  <div className="flex gap-3">
                    {['Ochtend', 'Avond', 'Weekend'].map((slot) => (
                      <button
                        key={slot}
                        onClick={() => toggleAvailability(slot)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          availability.includes(slot)
                            ? 'border-[#E87722] bg-orange-50 text-[#E87722]'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Relatiestatus <span className="text-gray-400 font-normal">(optioneel)</span></label>
                  <select
                    value={relationshipStatus}
                    onChange={(e) => setRelationshipStatus(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] bg-white"
                  >
                    <option value="">Liever niet zeggen</option>
                    <option value="single">Single</option>
                    <option value="relationship">In een relatie</option>
                  </select>
                </div>

                {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">← Terug</button>
                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="bg-[#E87722] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#d06a1a] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Opslaan...' : 'Profiel afronden →'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Rechter kolom: tips */}
          <div className="hidden lg:block space-y-4">
            <div className="bg-black text-white rounded-2xl p-6">
              <p className="text-[#E87722] font-bold text-xs uppercase tracking-widest mb-3">Pro tip</p>
              {step === 1 && <p className="text-sm text-gray-300 leading-relaxed">Een profielfoto vergroot je kans op een match met <strong className="text-white">3x</strong>. Voeg er een toe!</p>}
              {step === 2 && <p className="text-sm text-gray-300 leading-relaxed">Sporters met meerdere sporten krijgen <strong className="text-white">meer reacties</strong>. Voeg alle sporten toe die je beoefent.</p>}
              {step === 3 && <p className="text-sm text-gray-300 leading-relaxed">Je kunt je voorkeuren later altijd aanpassen in je profiel instellingen.</p>}
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
              <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-2">Bijna klaar</p>
              <p className="text-sm text-gray-600">Na het afronden van je profiel kun je direct beginnen met het zoeken naar sportpartners in jouw regio.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
