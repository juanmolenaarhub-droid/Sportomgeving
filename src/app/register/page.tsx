'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes r-dot {
          0%,100% { opacity:1; transform: scale(1); }
          50% { opacity:0.5; transform: scale(0.8); }
        }
        @keyframes r-float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(1deg); }
          66% { transform: translateY(-4px) rotate(-1deg); }
        }
        @keyframes r-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes r-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .r1 { animation: r-up .6s cubic-bezier(.16,1,.3,1) .06s both; }
        .r2 { animation: r-up .6s cubic-bezier(.16,1,.3,1) .14s both; }
        .r3 { animation: r-up .6s cubic-bezier(.16,1,.3,1) .22s both; }
        .r4 { animation: r-up .6s cubic-bezier(.16,1,.3,1) .30s both; }
        .r5 { animation: r-up .6s cubic-bezier(.16,1,.3,1) .38s both; }
        .r6 { animation: r-up .6s cubic-bezier(.16,1,.3,1) .46s both; }

        .ri {
          display: block; width: 100%;
          background: transparent; border: none;
          border-bottom: 2px solid rgba(17,17,17,0.15);
          padding: 13px 0; font-size: 16px; color: #111;
          outline: none; transition: border-color .2s;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
        }
        .ri::placeholder { color: rgba(17,17,17,0.3); font-weight: 400; }
        .ri:focus { border-bottom-color: #111; }

        .rb {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 18px 24px;
          background: #111; color: white; border: none; border-radius: 16px;
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px;
          letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; transition: background .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .rb:hover:not(:disabled) { background: #E87722; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,119,34,0.4); }
        .rb:active:not(:disabled) { transform: translateY(0px); }
        .rb:disabled { opacity: .45; cursor: not-allowed; }
      `}</style>

      <div style={DM} className="min-h-screen flex">

        {/* ── LEFT: Orange hero panel ── */}
        <div
          className="hidden lg:flex flex-col w-[46%] p-14 relative overflow-hidden select-none"
          style={{ background: '#E87722' }}
        >
          {/* Decorative geometric rings */}
          <div style={{ position: 'absolute', top: -120, right: -120, width: 560, height: 560, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -40, right: -40, width: 260, height: 260, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.1)', pointerEvents: 'none', animation: 'r-spin-slow 30s linear infinite' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 480, height: 480, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.07)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.09)', pointerEvents: 'none' }} />

          {/* Floating sport dots */}
          {[
            { top: '18%', left: '10%', size: 10, delay: '0s' },
            { top: '35%', right: '8%', size: 7, delay: '1.2s' },
            { top: '60%', left: '6%', size: 12, delay: '0.6s' },
            { top: '75%', right: '12%', size: 8, delay: '2s' },
          ].map((dot, i) => (
            <div key={i} style={{
              position: 'absolute', top: dot.top, left: (dot as any).left, right: (dot as any).right,
              width: dot.size, height: dot.size, borderRadius: '50%',
              background: 'rgba(0,0,0,0.2)',
              animation: `r-float 4s ease-in-out infinite`,
              animationDelay: dot.delay,
              pointerEvents: 'none',
            }} />
          ))}

          {/* Logo */}
          <Link href="/" className="relative z-10 shrink-0">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" />
          </Link>

          {/* Main content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center gap-8">

            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <div style={{ width: 28, height: 2, background: 'rgba(0,0,0,0.35)' }} />
              <span style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)' }}>
                Sport · Samen · Gratis
              </span>
            </div>

            {/* Main headline */}
            <div>
              <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.87, letterSpacing: '-0.03em', fontSize: 'clamp(48px, 3.6vw, 70px)', color: '#111' }}>
                Word lid<br />van 2.400+<br />sporters.
              </h2>
              <p style={{ ...DM, fontSize: 15, color: 'rgba(0,0,0,0.6)', marginTop: 14, fontWeight: 500, lineHeight: 1.5 }}>
                Vind de perfecte sportbuddy in jouw buurt. Gratis.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {[
                { icon: '🎯', text: 'Matches op sport, niveau en schema' },
                { icon: '📍', text: 'Sporters bij jou in de buurt' },
                { icon: '⚡', text: 'In 2 minuten aangemeld' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-3">
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {b.icon}
                  </div>
                  <span style={{ fontSize: 14, color: '#111', fontWeight: 600 }}>{b.text}</span>
                </div>
              ))}
            </div>

            {/* Live activity */}
            <div style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, width: 'fit-content' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#111', display: 'inline-block', animation: 'r-dot 2s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>24 sporters aangemeld vandaag</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.15)' }}>
              {[
                { val: '2.400+', lbl: 'Sporters' },
                { val: '850+', lbl: 'Matches' },
                { val: '4.8★', lbl: 'Score' },
              ].map(s => (
                <div key={s.lbl}>
                  <p style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: '#111', lineHeight: 1, letterSpacing: '-0.03em' }}>{s.val}</p>
                  <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 4, fontWeight: 500 }}>{s.lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom link */}
          <p className="relative z-10 shrink-0" style={{ fontSize: 13, color: 'rgba(0,0,0,0.4)' }}>
            Al een account?{' '}
            <Link href="/login" style={{ color: '#111', fontWeight: 800 }}>Inloggen →</Link>
          </p>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="flex-1 bg-[#F5F0E8] flex flex-col">

          {/* Mobile header */}
          <div className="lg:hidden" style={{ background: '#E87722', padding: '16px 24px 20px' }}>
            <div className="flex items-center justify-between mb-4">
              <Link href="/"><Image src="/logo.png" alt="Buddys" height={26} width={90} className="object-contain" /></Link>
              <Link href="/login" style={{ ...SYNE, fontSize: 12, fontWeight: 800, color: '#111', letterSpacing: '0.06em' }}>Inloggen</Link>
            </div>
            <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 28, lineHeight: 1, letterSpacing: '-0.03em', color: '#111' }}>
              Word lid van<br />2.400+ sporters.
            </h1>
          </div>

          <div className="flex-1 flex items-center justify-center px-8 py-12 lg:px-16">
            <div className="w-full max-w-[370px]">

              {/* Heading */}
              <div className="r1 mb-9">
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E87722', animation: 'r-dot 2s ease-in-out infinite', display: 'inline-block' }} />
                  <span style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#E87722' }}>
                    Gratis aanmelden
                  </span>
                </div>
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em', fontSize: 'clamp(36px, 4vw, 48px)', color: '#111' }}>
                  Account<br />aanmaken.
                </h1>
                <p style={{ fontSize: 14, color: '#999', marginTop: 10 }}>
                  Al een account?{' '}
                  <Link href="/login" style={{ color: '#E87722', fontWeight: 700 }}>Inloggen</Link>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister}>

                <div className="r2 mb-6">
                  <label style={{ ...SYNE, display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.17em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                    Gebruikersnaam
                  </label>
                  <input
                    className="ri"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    required
                    minLength={3}
                    placeholder="jouwusername"
                  />
                </div>

                <div className="r3 mb-6">
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

                <div className="r4 mb-8">
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
                  <button type="submit" disabled={loading} className="rb">
                    {loading ? 'Bezig...' : (
                      <>
                        Maak gratis account aan
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                {/* Social proof */}
                <div className="r6 flex items-center justify-center gap-2 mt-5">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>
                    24 sporters aangemeld vandaag
                  </span>
                </div>

                <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 14 }}>
                  Door te registreren ga je akkoord met onze{' '}
                  <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>voorwaarden</span>.
                </p>

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
