'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { checkUsernameAvailability } from '@/app/actions/profile'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

type UsernameState = 'neutral' | 'checking' | 'available' | 'unavailable'

const UNAVAILABLE_MSGS: Record<string, string> = {
  taken:     'Al in gebruik.',
  invalid:   'Alleen letters, cijfers, _ en . toegestaan.',
  too_short: 'Minimaal 3 tekens.',
  too_long:  'Maximaal 30 tekens.',
  reserved:  'Gereserveerde naam.',
}

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [usernameState, setUsernameState] = useState<UsernameState>('neutral')
  const [usernameMsg, setUsernameMsg] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUsernameChange = useCallback((raw: string) => {
    const val = raw.toLowerCase().replace(/\s/g, '')
    setUsername(val)
    setUsernameMsg('')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!val || val.length < 3) {
      setUsernameState('neutral')
      return
    }

    setUsernameState('checking')
    debounceRef.current = setTimeout(async () => {
      const result = await checkUsernameAvailability(val)
      if (result.available) {
        setUsernameState('available')
        setUsernameMsg('')
      } else {
        setUsernameState('unavailable')
        setUsernameMsg(UNAVAILABLE_MSGS[(result as { available: false; reason: string }).reason] ?? 'Niet beschikbaar.')
      }
    }, 600)
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  async function handleRegister(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setError('Dit e-mailadres is al in gebruik.')
      } else if (error.message.includes('password')) {
        setError('Wachtwoord moet minimaal 6 tekens bevatten.')
      } else {
        setError('Er is iets misgegaan. Probeer het opnieuw.')
      }
      setLoading(false)
    } else {
      router.push('/onboarding')
    }
  }

  return (
    <>
      <style>{`
        @keyframes r-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes r-dot {
          0%,100% { opacity:1; } 50% { opacity:0.3; }
        }
        .r1 { animation: r-up .55s cubic-bezier(.16,1,.3,1) .08s both; }
        .r2 { animation: r-up .55s cubic-bezier(.16,1,.3,1) .18s both; }
        .r3 { animation: r-up .55s cubic-bezier(.16,1,.3,1) .28s both; }
        .r4 { animation: r-up .55s cubic-bezier(.16,1,.3,1) .38s both; }
        .r5 { animation: r-up .55s cubic-bezier(.16,1,.3,1) .48s both; }

        .ri {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 2px solid #e0deda;
          padding: 13px 0 13px 0;
          font-size: 16px;
          color: #111;
          outline: none;
          transition: border-color .2s;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }
        .ri::placeholder { color: #c0bdb8; font-weight: 400; }
        .ri:focus { border-bottom-color: #E87722; }

        .rb {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 17px 24px;
          background: #E87722;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: .14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background .2s, transform .15s;
        }
        .rb:hover:not(:disabled) { background: #111; transform: translateY(-1px); }
        .rb:disabled { opacity: .45; cursor: not-allowed; }

        @keyframes rticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes rpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes rfadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: translateY(-50%) rotate(0deg); }
          to   { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>

      <div style={DM} className="min-h-screen flex">

        {/* ── LEFT: Black brand panel ── */}
        <div className="hidden lg:flex flex-col w-[42%] p-14 relative overflow-hidden select-none" style={{ background: '#111111' }}>

          {/* Logo */}
          <Link href="/" className="relative z-10">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain brightness-0 invert" />
          </Link>

          {/* Main content — vertically centered */}
          <div className="relative z-10 flex-1 flex flex-col justify-center gap-10">

            {/* Label + Headline */}
            <div>
              <p style={{ ...SYNE, fontSize: '10px', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#E87722' }} className="mb-6">
                Gratis starten
              </p>
              <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em', fontSize: 'clamp(46px, 3.4vw, 64px)' }}>
                <span style={{ color: 'white' }}>Word lid.</span><br />
                <span style={{ color: 'white' }}>Sport samen.</span><br />
                <span style={{ color: '#E87722' }}>Gratis.</span>
              </h2>
            </div>

            {/* Live activity block */}
            <div style={{ background: '#1A1A1A', borderRadius: 16, padding: '16px 18px' }}>
              <div className="flex items-center gap-2 mb-4">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E87722', display: 'inline-block', animation: 'rpulse 2s ease-in-out infinite' }} />
                <span style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#E87722' }}>Nu actief op Buddys</span>
              </div>
              <div className="space-y-3">
                {[
                  { text: 'Daan V. uit Amsterdam vond een hardloopbuddy', time: '2 min geleden', delay: '0s' },
                  { text: 'Lisa M. uit Utrecht heeft een match geaccepteerd', time: '5 min geleden', delay: '0.3s' },
                  { text: 'Marco R. uit Rotterdam stuurde een buddy-verzoek', time: '8 min geleden', delay: '0.6s' },
                ].map((item) => (
                  <div key={item.text} className="flex items-start justify-between gap-3" style={{ animation: `rfadein .5s ease both`, animationDelay: item.delay }}>
                    <div className="flex items-start gap-2">
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500, lineHeight: 1.4 }}>{item.text}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrolling sport tags */}
            <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
              <div style={{ display: 'flex', gap: '8px', animation: 'rticker 22s linear infinite', whiteSpace: 'nowrap' }}>
                {[
                  { label: 'Hardlopen', highlight: false },
                  { label: 'Fietsen', highlight: false },
                  { label: 'Zwemmen', highlight: true },
                  { label: 'Gym', highlight: false },
                  { label: 'Voetbal', highlight: false },
                  { label: 'Tennis', highlight: false },
                  { label: 'Golf', highlight: false },
                  { label: 'Yoga', highlight: false },
                  { label: 'Padel', highlight: true },
                  { label: 'Triathlon', highlight: false },
                  { label: 'Wandelen', highlight: false },
                  { label: 'Basketbal', highlight: false },
                  { label: 'Boksen', highlight: false },
                  { label: 'Klimmen', highlight: false },
                  { label: 'Hardlopen', highlight: false },
                  { label: 'Fietsen', highlight: false },
                  { label: 'Zwemmen', highlight: true },
                  { label: 'Gym', highlight: false },
                  { label: 'Voetbal', highlight: false },
                  { label: 'Tennis', highlight: false },
                  { label: 'Golf', highlight: false },
                  { label: 'Yoga', highlight: false },
                  { label: 'Padel', highlight: true },
                  { label: 'Triathlon', highlight: false },
                  { label: 'Wandelen', highlight: false },
                  { label: 'Basketbal', highlight: false },
                  { label: 'Boksen', highlight: false },
                  { label: 'Klimmen', highlight: false },
                ].map((tag, i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: tag.highlight ? '#E87722' : '#222222',
                    color: 'white',
                    flexShrink: 0,
                  }}>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {[
                { val: '2.400+', lbl: 'Actieve sporters' },
                { val: '850+', lbl: 'Matches gemaakt' },
                { val: '4.8★', lbl: 'Gemiddelde score' },
              ].map((s, i) => (
                <div key={s.lbl} className="flex-1" style={{ paddingRight: i < 2 ? 16 : 0, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <p style={{ ...SYNE, fontWeight: 900, fontSize: 20, lineHeight: 1, color: 'white', letterSpacing: '-0.03em' }}>{s.val}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontWeight: 500 }}>{s.lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom link */}
          <p className="relative z-10" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Al een account?{' '}
            <Link href="/login" style={{ color: '#E87722', fontWeight: 700 }}>Inloggen →</Link>
          </p>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="flex-1 bg-white flex flex-col">

          {/* Mobile nav */}
          <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <Link href="/"><Image src="/logo.png" alt="Buddys" height={26} width={90} className="object-contain" /></Link>
            <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">Inloggen</Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-8 py-14 lg:px-16">
            <div className="w-full max-w-[370px]">

              {/* Heading */}
              <div className="r1 mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E87722', animation: 'r-dot 2s ease-in-out infinite', display: 'inline-block' }} />
                  <span style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#E87722' }}>
                    Nu aanmelden
                  </span>
                </div>
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em', fontSize: 'clamp(38px, 4vw, 50px)', color: '#111' }}>
                  Account<br />aanmaken.
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister}>

                <div className="r2 mb-7">
                  <label style={{ ...SYNE, display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.17em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                    Gebruikersnaam
                  </label>

                  {/* Preview */}
                  {username.length >= 3 && (
                    <p style={{ ...DM, fontSize: 11, color: '#bbb', marginBottom: 8 }}>
                      buddys.nl/@<span style={{ color: '#111', fontWeight: 600 }}>{username}</span>
                    </p>
                  )}

                  <div style={{ position: 'relative' }}>
                    <input
                      className="ri"
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      required
                      minLength={3}
                      placeholder="jouwusername"
                      style={{ paddingRight: 32 }}
                    />
                    {/* State indicator */}
                    <span style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      {usernameState === 'checking'   && <Loader2 size={16} color="#aaa" style={{ animation: 'spin 1s linear infinite' }} />}
                      {usernameState === 'available'  && <CheckCircle size={16} color="#22c55e" />}
                      {usernameState === 'unavailable' && <XCircle size={16} color="#ef4444" />}
                    </span>
                  </div>

                  {/* Feedback message */}
                  {usernameMsg && (
                    <p style={{ ...DM, fontSize: 11, color: '#ef4444', marginTop: 5 }}>{usernameMsg}</p>
                  )}
                </div>

                <div className="r3 mb-7">
                  <label style={{ ...SYNE, display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.17em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                    E-mailadres
                  </label>
                  <input
                    className="ri"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="jij@email.com"
                  />
                </div>

                <div className="r4 mb-9">
                  <label style={{ ...SYNE, display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.17em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                    Wachtwoord
                  </label>
                  <input
                    className="ri"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimaal 6 tekens"
                  />
                </div>

                {error && (
                  <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="r5">
                  <button type="submit" disabled={loading || usernameState === 'checking' || usernameState === 'unavailable'} className="rb">
                    {loading ? 'Bezig...' : (
                      <>
                        Maak gratis account aan
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M1 6.5h11M6.5 1l5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Live badge below CTA */}
                  <div className="flex items-center justify-center gap-2 mt-5">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ ...DM, fontSize: 12, color: '#aaa', fontWeight: 500 }}>
                      24 sporters aangemeld vandaag
                    </span>
                  </div>

                  <p style={{ ...DM, fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 16 }}>
                    Door te registreren ga je akkoord met onze{' '}
                    <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>voorwaarden</span>.
                  </p>
                </div>
              </form>

              {/* Mobile link */}
              <p className="lg:hidden mt-8 text-center" style={{ fontSize: 13, color: '#aaa' }}>
                Al een account?{' '}
                <Link href="/login" style={{ color: '#E87722', fontWeight: 700 }}>Inloggen</Link>
              </p>

            </div>
          </div>
        </div>

      </div>
    </>
  )
}
