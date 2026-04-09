'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { validateImageFile } from '@/lib/validateFile'
import { sanitizeText, limitLength } from '@/lib/sanitize'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const SPORTS = [
  { id: 1,  name: 'Hardlopen',   emoji: '🏃' },
  { id: 2,  name: 'Fietsen',     emoji: '🚴' },
  { id: 3,  name: 'Zwemmen',     emoji: '🏊' },
  { id: 4,  name: 'Gym',         emoji: '🏋️' },
  { id: 5,  name: 'Voetbal',     emoji: '⚽' },
  { id: 6,  name: 'Tennis',      emoji: '🎾' },
  { id: 7,  name: 'Golf',        emoji: '⛳' },
  { id: 8,  name: 'Yoga',        emoji: '🧘' },
  { id: 9,  name: 'Wandelen',    emoji: '🥾' },
  { id: 10, name: 'Basketbal',   emoji: '🏀' },
  { id: 11, name: 'Padel',       emoji: '🏓' },
  { id: 12, name: 'Triathlon',   emoji: '🏅' },
  { id: 13, name: 'Boksen',      emoji: '🥊' },
  { id: 14, name: 'Klimmen',     emoji: '🧗' },
]

const LEVELS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Gevorderd' },
  { value: 'advanced',     label: 'Competitief' },
]

const GOALS = [
  { value: 'improve',  emoji: '🎯', title: 'Beter worden',    desc: 'Ik wil mijn niveau verhogen' },
  { value: 'fitness',  emoji: '💪', title: 'Fit blijven',     desc: 'Voor conditie en gezondheid' },
  { value: 'compete',  emoji: '🏆', title: 'Competitie',      desc: 'Ik doe aan wedstrijden' },
  { value: 'social',   emoji: '🤝', title: 'Sociaal sporten', desc: 'Ik sport voor het gezelschap' },
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
  const [goal, setGoal] = useState('')

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
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
        full_name: sanitizeText(limitLength(fullName, 80)),
        region: sanitizeText(limitLength(region, 80)),
        age: age ? parseInt(age) : null,
        bio: sanitizeText(limitLength(bio, 500)),
        avatar_url: avatarUrl || undefined,
        goal: goal || null,
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

    router.push('/dashboard/feed')
  }

  const TOTAL_STEPS = 3
  const progress = (step / TOTAL_STEPS) * 100

  return (
    <>
      <style>{`
        @keyframes ob-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ob-fade { animation: ob-up .45s cubic-bezier(.16,1,.3,1) both; }

        .ob-input {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(255,255,255,0.12);
          padding: 13px 0;
          font-size: 15px;
          color: white;
          outline: none;
          transition: border-color .2s;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }
        .ob-input::placeholder { color: rgba(255,255,255,0.25); font-weight: 400; }
        .ob-input:focus { border-bottom-color: #E87722; }
      `}</style>

      <div style={{ ...DM, background: '#111111', minHeight: '100vh', color: 'white' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5">
          <Link href="/">
            <Image src="/logo.png" alt="Buddys" height={28} width={98} className="object-contain brightness-0 invert" />
          </Link>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            Stap {step} van {TOTAL_STEPS}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#E87722', transition: 'width .4s cubic-bezier(.16,1,.3,1)' }} />
        </div>

        {/* Content */}
        <div className="flex items-start justify-center px-6 py-14">
          <div className="w-full max-w-xl">

            {/* ── STAP 1: Profiel ── */}
            {step === 1 && (
              <div className="ob-fade">
                <p style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#E87722' }} className="mb-5">
                  Stap 1 — Jouw profiel
                </p>
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', fontSize: 'clamp(38px, 5vw, 56px)' }} className="mb-10">
                  Vertel iets<br />over jezelf.
                </h1>

                {/* Avatar */}
                <div className="flex items-center gap-5 mb-10">
                  <label className="cursor-pointer group shrink-0">
                    <div
                      className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{ background: avatarPreview ? 'transparent' : '#1A1A1A', border: '2px dashed rgba(255,255,255,0.12)', transition: 'border-color .2s' }}
                    >
                      {avatarPreview
                        ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                        : <svg width="24" height="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      }
                    </div>
                    <p style={{ fontSize: 11, color: '#E87722', fontWeight: 700, textAlign: 'center', marginTop: 6 }}>Foto toevoegen</p>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
                      Volledige naam *
                    </label>
                    <input
                      className="ob-input"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jan de Vries"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
                      Stad / Regio *
                    </label>
                    <input
                      className="ob-input"
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="Amsterdam"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
                      Leeftijd
                    </label>
                    <input
                      className="ob-input"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min={16} max={99}
                      placeholder="25"
                    />
                  </div>
                </div>

                <div className="mb-10">
                  <label style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 8 }}>
                    Over mij
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Ik zoek iemand om mee te hardlopen 3x per week..."
                    style={{
                      display: 'block', width: '100%', background: 'transparent',
                      border: 'none', borderBottom: '2px solid rgba(255,255,255,0.12)',
                      padding: '13px 0', fontSize: 15, color: 'white', outline: 'none',
                      resize: 'none', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                    }}
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!fullName || !region}
                  style={{
                    ...SYNE, width: '100%', padding: '17px 24px',
                    background: !fullName || !region ? 'rgba(232,119,34,0.3)' : '#E87722',
                    color: 'white', border: 'none', borderRadius: 14,
                    fontWeight: 800, fontSize: 13, letterSpacing: '0.14em',
                    textTransform: 'uppercase', cursor: !fullName || !region ? 'not-allowed' : 'pointer',
                    transition: 'background .2s',
                  }}
                >
                  Volgende stap →
                </button>
              </div>
            )}

            {/* ── STAP 2: Sporten ── */}
            {step === 2 && (
              <div className="ob-fade">
                <p style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#E87722' }} className="mb-5">
                  Stap 2 — Jouw sporten
                </p>
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', fontSize: 'clamp(38px, 5vw, 56px)' }} className="mb-3">
                  Welke sporten<br />doe jij?
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginBottom: 32 }}>
                  Selecteer alles wat je beoefent. Je kunt later altijd meer toevoegen.
                </p>

                {/* Sport grid */}
                <div className="grid grid-cols-4 gap-2.5 mb-8">
                  {SPORTS.map((sport) => {
                    const selected = selectedSports.find((s) => s.sport_id === sport.id)
                    return (
                      <button
                        key={sport.id}
                        onClick={() => toggleSport(sport.id)}
                        style={{
                          padding: '14px 8px',
                          borderRadius: 12,
                          border: `2px solid ${selected ? '#E87722' : 'rgba(255,255,255,0.08)'}`,
                          background: selected ? 'rgba(232,119,34,0.12)' : '#1A1A1A',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          cursor: 'pointer', transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{sport.emoji}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: selected ? '#E87722' : 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.3 }}>
                          {sport.name}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Niveau per geselecteerde sport */}
                {selectedSports.length > 0 && (
                  <div style={{ background: '#1A1A1A', borderRadius: 14, padding: '18px 20px', marginBottom: 32 }}>
                    <p style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
                      Jouw niveau
                    </p>
                    <div className="space-y-3">
                      {selectedSports.map((s) => {
                        const sport = SPORTS.find((sp) => sp.id === s.sport_id)!
                        return (
                          <div key={s.sport_id} className="flex items-center justify-between gap-4">
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'white', minWidth: 90 }}>
                              {sport.emoji} {sport.name}
                            </span>
                            <div className="flex gap-2">
                              {LEVELS.map((l) => (
                                <button
                                  key={l.value}
                                  onClick={() => setSportLevel(s.sport_id, l.value)}
                                  style={{
                                    fontSize: 11, padding: '5px 12px', borderRadius: 20, fontWeight: 600,
                                    border: `1.5px solid ${s.level === l.value ? '#E87722' : 'rgba(255,255,255,0.1)'}`,
                                    background: s.level === l.value ? '#E87722' : 'transparent',
                                    color: 'white', cursor: 'pointer', transition: 'all .15s',
                                  }}
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
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding: '17px 24px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'white', fontFamily: "'Syne', sans-serif",
                      fontWeight: 800, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    ← Terug
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={selectedSports.length === 0}
                    style={{
                      ...SYNE, flex: 1, padding: '17px 24px',
                      background: selectedSports.length === 0 ? 'rgba(232,119,34,0.3)' : '#E87722',
                      color: 'white', border: 'none', borderRadius: 14,
                      fontWeight: 800, fontSize: 13, letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      cursor: selectedSports.length === 0 ? 'not-allowed' : 'pointer',
                      transition: 'background .2s',
                    }}
                  >
                    Volgende stap →
                  </button>
                </div>
              </div>
            )}

            {/* ── STAP 3: Doel ── */}
            {step === 3 && (
              <div className="ob-fade">
                <p style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#E87722' }} className="mb-5">
                  Stap 3 — Jouw doel
                </p>
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', fontSize: 'clamp(38px, 5vw, 56px)' }} className="mb-3">
                  Waarom<br />sport je?
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginBottom: 32 }}>
                  We gebruiken dit om je te matchen met sporters die hetzelfde nastreven.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-10">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      style={{
                        padding: '20px 18px',
                        borderRadius: 14,
                        border: `2px solid ${goal === g.value ? '#E87722' : 'rgba(255,255,255,0.08)'}`,
                        background: goal === g.value ? 'rgba(232,119,34,0.12)' : '#1A1A1A',
                        textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
                      }}
                    >
                      <span style={{ fontSize: 26, display: 'block', marginBottom: 8 }}>{g.emoji}</span>
                      <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: goal === g.value ? '#E87722' : 'white', marginBottom: 4 }}>
                        {g.title}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400, lineHeight: 1.4 }}>
                        {g.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                    <p style={{ color: '#f87171', fontSize: 13, fontWeight: 500 }}>{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      padding: '17px 24px', borderRadius: 14, border: '2px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'white', fontFamily: "'Syne', sans-serif",
                      fontWeight: 800, fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    ← Terug
                  </button>
                  <button
                    onClick={handleFinish}
                    disabled={loading || !goal}
                    style={{
                      ...SYNE, flex: 1, padding: '17px 24px',
                      background: loading || !goal ? 'rgba(232,119,34,0.3)' : '#E87722',
                      color: 'white', border: 'none', borderRadius: 14,
                      fontWeight: 800, fontSize: 13, letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      cursor: loading || !goal ? 'not-allowed' : 'pointer',
                      transition: 'background .2s',
                    }}
                  >
                    {loading ? 'Opslaan...' : 'Profiel afronden →'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
