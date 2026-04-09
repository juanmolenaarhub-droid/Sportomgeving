'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Camera, Check } from 'lucide-react'
import { PlacesInput } from '@/components/ui/places-input'
import { createClient } from '@/lib/supabase'
import { validateImageFile } from '@/lib/validateFile'
import { sanitizeText, limitLength } from '@/lib/sanitize'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const SPORTS = [
  { id: 1,  name: 'Hardlopen' },
  { id: 2,  name: 'Fietsen' },
  { id: 3,  name: 'Zwemmen' },
  { id: 4,  name: 'Gym' },
  { id: 5,  name: 'Voetbal' },
  { id: 6,  name: 'Tennis' },
  { id: 7,  name: 'Golf' },
  { id: 8,  name: 'Yoga' },
  { id: 9,  name: 'Padel' },
  { id: 10, name: 'Triathlon' },
  { id: 11, name: 'Boksen' },
  { id: 12, name: 'Klimmen' },
]

const LEVELS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Gevorderd' },
  { value: 'advanced',     label: 'Professioneel' },
]

const STEP_LABELS = ['Jouw profiel', 'Jouw sporten', 'Voorkeuren']

type SelectedSport = { sport_id: number; level: string }

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentEmail, setCurrentEmail] = useState('')

  // Step 1
  const [fullName, setFullName]     = useState('')
  const [region, setRegion]         = useState('')
  const [regionLat, setRegionLat]   = useState<number | undefined>()
  const [regionLng, setRegionLng]   = useState<number | undefined>()
  const [age, setAge]               = useState('')
  const [geslacht1, setGeslacht1]   = useState('')
  const [andersOptie, setAndersOptie] = useState('')
  const [bio, setBio]               = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [errors1, setErrors1]       = useState<Record<string, string>>({})

  // Step 2
  const [selectedSports, setSelectedSports] = useState<SelectedSport[]>([])
  const [niveau, setNiveau]         = useState('beginner')

  // Step 3
  const [taalvoorkeur, setTaalvoorkeur]         = useState('Nederlands')
  const [burgerlijkeStaat, setBurgerlijkeStaat] = useState('')
  const [radius, setRadius]                     = useState(25)
  const [geslacht, setGeslacht]                 = useState('geen')

  const fileRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setCurrentEmail(data.user.email)
    })
  }, [])


  function goTo(next: number, dir: 'forward' | 'back') {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 260)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); return }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  function toggleSport(id: number) {
    setSelectedSports(prev => {
      const exists = prev.find(s => s.sport_id === id)
      if (exists) return prev.filter(s => s.sport_id !== id)
      return [...prev, { sport_id: id, level: niveau }]
    })
  }

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Naam is verplicht'
    if (!region.trim())   e.region   = 'Stad is verplicht'
    if (!age)             e.age      = 'Leeftijd is verplicht'
    if (!geslacht1)       e.geslacht = 'Geslacht is verplicht'
    setErrors1(e)
    return Object.keys(e).length === 0
  }

  async function handleReset() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      full_name: null, region: null, age: null, bio: null, avatar_url: null, goal: null,
    }).eq('id', user.id)
    await supabase.from('user_sports').delete().eq('user_id', user.id)
    setStep(1); setFullName(''); setRegion(''); setAge(''); setBio('')
    setAvatarFile(null); setAvatarPreview(''); setBannerFile(null); setBannerPreview(''); setSelectedSports([])
    setGeslacht1(''); setAndersOptie(''); setRadius(25); setGeslacht('geen')
  }

  async function handleFinish() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      let avatarUrl = ''
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars').upload(path, avatarFile, { upsert: true })
        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(path)
          avatarUrl = data.publicUrl
        }
      }

      const { error: profileError } = await supabase.from('profiles').update({
        full_name:  sanitizeText(limitLength(fullName, 80)),
        region:     sanitizeText(limitLength(region, 80)),
        region_lat: regionLat ?? null,
        region_lng: regionLng ?? null,
        age:        age ? parseInt(age) : null,
        bio:        sanitizeText(limitLength(bio, 500)),
        avatar_url: avatarUrl || undefined,
        goal:       geslacht,
      }).eq('id', user.id)

      if (profileError) throw new Error(`Profiel: ${profileError.message}`)

      if (selectedSports.length > 0) {
        const { error: sportsError } = await supabase.from('user_sports').upsert(
          selectedSports.map(s => ({
            user_id: user.id,
            sport_id: s.sport_id,
            level: niveau,
            looking_for_partner: true,
          }))
        )
        if (sportsError) throw new Error(`Sporten: ${sportsError.message}`)
      }

      router.push('/dashboard/feed')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Er is iets misgegaan. Probeer het opnieuw.')
      setLoading(false)
    }
  }

  // Slide animation styles
  const slideIn: React.CSSProperties = {
    animation: animating
      ? `ob-slide-${direction === 'forward' ? 'out' : 'out-back'} 0.26s ease forwards`
      : `ob-slide-${direction === 'forward' ? 'in' : 'in-back'} 0.26s ease forwards`,
  }

  return (
    <>
      <style>{`
        @keyframes ob-slide-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ob-slide-in-back {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ob-slide-out {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes ob-slide-out-back {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40px); }
        }
        .ob-field {
          width: 100%;
          padding: 12px 14px;
          background: white;
          border: 1.5px solid #E5E5E5;
          border-radius: 10px;
          font-size: 15px;
          color: #111;
          outline: none;
          transition: border-color .15s;
          font-family: 'DM Sans', sans-serif;
          min-height: 44px;
        }
        .ob-field::placeholder { color: #aaa; }
        .ob-field:focus { border-color: #E87722; }
        .ob-field-error { border-color: #ef4444 !important; }
        @keyframes ob-anders-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type='range'] {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #E87722;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
        }
      `}</style>

      <div style={{ ...DM, background: '#edece8', minHeight: '100vh' }}>

        {/* Top bar */}
        <div className="flex items-center justify-center py-8 relative">
          <Link href="/">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" />
          </Link>
          {currentEmail === 'juanmolenaarhub@gmail.com' && (
            <button
              onClick={handleReset}
              className="absolute right-8"
              style={{ fontSize: 11, color: '#999', background: 'white', border: '1px solid #e5e5e5', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
            >
              ↺ Reset test
            </button>
          )}
        </div>

        {/* Card */}
        <div className="flex justify-center px-4 pb-16">
          <div className="w-full bg-white rounded-2xl shadow-sm border border-black/5" style={{ maxWidth: 540 }}>

            {/* Progress bar */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
              <div className="flex gap-2 mb-3">
                {STEP_LABELS.map((_, i) => {
                  const s = i + 1
                  const done    = step > s
                  const active  = step === s
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="relative w-full h-1.5 rounded-full" style={{ background: active || done ? '#E87722' : '#E5E5E5' }}>
                        {done && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                {STEP_LABELS.map((label, i) => {
                  const s = i + 1
                  return (
                    <div key={s} className="flex-1 text-center">
                      <span style={{ fontSize: 10, fontWeight: 600, color: step === s ? '#E87722' : '#aaa', letterSpacing: '0.02em' }}>
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step content */}
            <div className="px-8 py-8" style={slideIn}>

              {/* ── STAP 1 ── */}
              {step === 1 && (
                <div>
                  <h1 style={{ ...SYNE, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: '#111', marginBottom: 6 }}>
                    Vertel iets over jezelf.
                  </h1>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 28, fontWeight: 400 }}>
                    Hoe beter je profiel, hoe beter je match.
                  </p>

                  {/* Banner + Avatar */}
                  <div className="mb-8" style={{ position: 'relative', paddingBottom: 44 }}>
                    {/* Banner zone */}
                    <button
                      type="button"
                      onClick={() => bannerRef.current?.click()}
                      className="group"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: 120,
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: bannerPreview ? 'transparent' : '#F0EFED',
                        border: bannerPreview ? 'none' : '2px dashed #D5D3CF',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      {bannerPreview
                        ? <img src={bannerPreview} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="3" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#bbb' }}>Bannerafbeelding toevoegen</span>
                          </div>
                        )
                      }
                      {/* Hover overlay */}
                      <div className="group-hover:opacity-100" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', opacity: 0, transition: 'opacity .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Wijzigen</span>
                      </div>
                    </button>
                    <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />

                    {/* Avatar overlapping banner */}
                    <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="group"
                        style={{ display: 'block', position: 'relative', borderRadius: '50%', cursor: 'pointer' }}
                      >
                        <div style={{
                          width: 88,
                          height: 88,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '4px solid white',
                          background: '#F0EFED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        }}>
                          {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Camera style={{ width: 26, height: 26, color: '#ccc' }} />
                          }
                        </div>
                        {/* Camera badge */}
                        <div style={{
                          position: 'absolute', bottom: 2, right: 2,
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#E87722', border: '2px solid white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Camera style={{ width: 11, height: 11, color: 'white' }} />
                        </div>
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                  </div>

                  {/* Naam */}
                  <div className="mb-5">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                      Volledige naam <span style={{ color: '#E87722' }}>*</span>
                    </label>
                    <input
                      className={`ob-field ${errors1.fullName ? 'ob-field-error' : ''}`}
                      type="text"
                      value={fullName}
                      onChange={e => { setFullName(e.target.value); setErrors1(p => ({ ...p, fullName: '' })) }}
                      placeholder="Jan de Vries"
                    />
                    {errors1.fullName && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors1.fullName}</p>}
                  </div>

                  {/* Stad + Leeftijd */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                        Stad / Regio <span style={{ color: '#E87722' }}>*</span>
                      </label>
                      <PlacesInput
                        value={region}
                        onChange={(val, lat, lng) => {
                          setRegion(val)
                          setRegionLat(lat)
                          setRegionLng(lng)
                          setErrors1(p => ({ ...p, region: '' }))
                        }}
                        hasError={!!errors1.region}
                      />
                      {errors1.region && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors1.region}</p>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                        Leeftijd <span style={{ color: '#E87722' }}>*</span>
                      </label>
                      <input
                        className={`ob-field ${errors1.age ? 'ob-field-error' : ''}`}
                        type="number"
                        value={age}
                        onChange={e => { setAge(e.target.value); setErrors1(p => ({ ...p, age: '' })) }}
                        min={16} max={99}
                        placeholder="25"
                      />
                      {errors1.age && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors1.age}</p>}
                    </div>
                  </div>

                  {/* Geslacht */}
                  <div className="mb-5">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 10 }}>
                      Geslacht <span style={{ color: '#E87722' }}>*</span>
                    </label>
                    <div className="flex gap-2">
                      {/* Man */}
                      <button
                        onClick={() => { setGeslacht1('Man'); setAndersOptie(''); setErrors1(p => ({ ...p, geslacht: '' })) }}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s', background: geslacht1 === 'Man' ? '#E87722' : '#EDEDED', color: geslacht1 === 'Man' ? 'white' : '#555' }}
                      >Man</button>

                      {/* Vrouw */}
                      <button
                        onClick={() => { setGeslacht1('Vrouw'); setAndersOptie(''); setErrors1(p => ({ ...p, geslacht: '' })) }}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s', background: geslacht1 === 'Vrouw' ? '#E87722' : '#EDEDED', color: geslacht1 === 'Vrouw' ? 'white' : '#555' }}
                      >Vrouw</button>

                      {/* Anders */}
                      <button
                        onClick={() => { setGeslacht1('Anders'); setAndersOptie(''); setErrors1(p => ({ ...p, geslacht: '' })) }}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s', background: geslacht1 === 'Anders' ? '#E87722' : '#EDEDED', color: geslacht1 === 'Anders' ? 'white' : '#555' }}
                      >
                        {andersOptie && geslacht1 === 'Anders' ? andersOptie : 'Anders'}
                      </button>
                    </div>

                    {/* Dropdown — altijd zichtbaar als Anders geselecteerd en nog geen keuze */}
                    {geslacht1 === 'Anders' && !andersOptie && (
                      <div style={{
                        marginTop: 8, background: 'white', border: '1.5px solid #E5E5E5',
                        borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                        overflow: 'hidden',
                        animation: 'ob-anders-in .18s ease both',
                      }}>
                        {['Non-binair','Genderqueer','Genderfluid','Agender','Bigender','Transgender man','Transgender vrouw','Intersekse','Two-spirit','Liever niet zeggen'].map(o => (
                          <button
                            key={o}
                            onClick={() => { setAndersOptie(o); setErrors1(p => ({ ...p, geslacht: '' })) }}
                            style={{
                              display: 'block', width: '100%', textAlign: 'left',
                              padding: '12px 16px', minHeight: 44, fontSize: 13, fontWeight: 500,
                              border: 'none', borderBottom: '1px solid #F5F5F5',
                              background: 'white', color: '#333',
                              cursor: 'pointer', transition: 'background .12s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FFF5EE' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    )}

                    {errors1.geslacht && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors1.geslacht}</p>}
                  </div>

                  {/* Bio */}
                  <div className="mb-8">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                      Over mij
                    </label>
                    <textarea
                      className="ob-field"
                      rows={3}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Ik sport graag 3x per week en zoek iemand om mee te hardlopen..."
                      style={{ resize: 'none', minHeight: 'unset' }}
                    />
                  </div>

                  <button
                    onClick={() => { if (validateStep1()) goTo(2, 'forward') }}
                    className="w-full flex items-center justify-center gap-2"
                    style={{ ...SYNE, height: 52, background: '#E87722', color: 'white', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Volgende stap →
                  </button>
                </div>
              )}

              {/* ── STAP 2 ── */}
              {step === 2 && (
                <div>
                  <h1 style={{ ...SYNE, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: '#111', marginBottom: 6 }}>
                    Welke sporten doe je?
                  </h1>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 24, fontWeight: 400 }}>
                    Selecteer alles wat je doet. Je kan meerdere kiezen.
                  </p>

                  {/* Sport grid */}
                  <div className="grid grid-cols-3 gap-2.5 mb-6">
                    {SPORTS.map(sport => {
                      const selected = selectedSports.some(s => s.sport_id === sport.id)
                      return (
                        <button
                          key={sport.id}
                          onClick={() => toggleSport(sport.id)}
                          className="relative text-center py-4 px-2 rounded-xl transition-all"
                          style={{
                            border: `1.5px solid ${selected ? '#E87722' : '#E5E5E5'}`,
                            background: selected ? '#FFF5EE' : 'white',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            color: selected ? '#E87722' : '#333',
                            boxShadow: selected ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                        >
                          {selected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#E87722' }}>
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </span>
                          )}
                          {sport.name}
                        </button>
                      )
                    })}
                  </div>

                  {/* Niveau */}
                  {selectedSports.length > 0 && (
                    <div className="mb-8 p-4 rounded-xl" style={{ background: '#F9F9F9', border: '1px solid #F0F0F0' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 10 }}>Jouw niveau:</p>
                      <div className="flex gap-2">
                        {LEVELS.map(l => (
                          <button
                            key={l.value}
                            onClick={() => setNiveau(l.value)}
                            className="flex-1 py-2.5 rounded-xl transition-all"
                            style={{
                              fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                              background: niveau === l.value ? '#E87722' : '#EDEDED',
                              color: niveau === l.value ? 'white' : '#555',
                            }}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSports.length === 0 && <div className="mb-8" />}

                  <div className="flex gap-3">
                    <button
                      onClick={() => goTo(1, 'back')}
                      className="flex items-center justify-center"
                      style={{ height: 52, padding: '0 24px', background: 'white', border: '1.5px solid #E5E5E5', borderRadius: 14, fontWeight: 700, fontSize: 13, color: '#111', cursor: 'pointer', fontFamily: "'Syne', sans-serif", letterSpacing: '0.05em' }}
                    >
                      ← Vorige
                    </button>
                    <button
                      onClick={() => { if (selectedSports.length > 0) goTo(3, 'forward') }}
                      className="flex-1 flex items-center justify-center"
                      style={{ ...SYNE, height: 52, background: selectedSports.length === 0 ? '#F0C9A8' : '#E87722', color: 'white', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: selectedSports.length === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      Volgende stap →
                    </button>
                  </div>
                </div>
              )}

              {/* ── STAP 3 ── */}
              {step === 3 && (
                <div>
                  <h1 style={{ ...SYNE, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', color: '#111', marginBottom: 6 }}>
                    Bijna klaar!
                  </h1>
                  <p style={{ fontSize: 14, color: '#666', marginBottom: 28, fontWeight: 400 }}>
                    Stel je voorkeuren in zodat we de beste matches tonen.
                  </p>

                  {/* Taalvoorkeur */}
                  <div className="mb-5">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 10 }}>
                      Taalvoorkeur <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>(optioneel)</span>
                    </label>
                    <div className="flex gap-2">
                      {['Nederlands', 'Engels', 'Beide'].map(t => (
                        <button
                          key={t}
                          onClick={() => setTaalvoorkeur(t)}
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                            background: taalvoorkeur === t ? '#E87722' : '#EDEDED',
                            color: taalvoorkeur === t ? 'white' : '#555',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Burgerlijke staat */}
                  <div className="mb-5">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6 }}>
                      Burgerlijke staat <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>(optioneel)</span>
                    </label>
                    <select
                      className="ob-field"
                      value={burgerlijkeStaat}
                      onChange={e => setBurgerlijkeStaat(e.target.value)}
                      style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                    >
                      <option value="">Liever niet zeggen</option>
                      <option value="single">Single</option>
                      <option value="relationship">In een relatie</option>
                      <option value="married">Getrouwd</option>
                    </select>
                  </div>

                  {/* Zoekradius */}
                  <div className="mb-5">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 10 }}>
                      Zoekradius — <span style={{ color: '#E87722' }}>{radius} km</span>
                    </label>
                    <input
                      type="range"
                      min={5} max={100} step={5}
                      value={radius}
                      onChange={e => setRadius(Number(e.target.value))}
                      style={{ background: `linear-gradient(to right, #E87722 0%, #E87722 ${((radius - 5) / 95) * 100}%, #E5E5E5 ${((radius - 5) / 95) * 100}%, #E5E5E5 100%)` }}
                    />
                    <div className="flex justify-between mt-1">
                      <span style={{ fontSize: 11, color: '#aaa' }}>5 km</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>100 km</span>
                    </div>
                  </div>

                  {/* Geslacht voorkeur */}
                  <div className="mb-8">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 10 }}>
                      Voorkeur buddy <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}>(optioneel)</span>
                    </label>
                    <div className="flex gap-2">
                      {[{ val: 'geen', label: 'Geen voorkeur' }, { val: 'man', label: 'Man' }, { val: 'vrouw', label: 'Vrouw' }].map(g => (
                        <button
                          key={g.val}
                          onClick={() => setGeslacht(g.val)}
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .15s',
                            background: geslacht === g.val ? '#E87722' : '#EDEDED',
                            color: geslacht === g.val ? 'white' : '#555',
                          }}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => goTo(2, 'back')}
                      style={{ height: 52, padding: '0 24px', background: 'white', border: '1.5px solid #E5E5E5', borderRadius: 14, fontWeight: 700, fontSize: 13, color: '#111', cursor: 'pointer', fontFamily: "'Syne', sans-serif", letterSpacing: '0.05em' }}
                    >
                      ← Vorige
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center"
                      style={{ ...SYNE, height: 52, background: loading ? '#F0C9A8' : '#E87722', color: 'white', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                      {loading ? 'Opslaan...' : 'Start met Buddys →'}
                    </button>
                  </div>

                  {error && <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', marginTop: 10 }}>{error}</p>}

                  <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 14 }}>
                    Je kan dit later aanpassen in je profiel
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
