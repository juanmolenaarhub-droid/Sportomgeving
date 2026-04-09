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
      `}</style>

      <div style={DM} className="min-h-screen flex">

        {/* ── LEFT: Orange brand panel ── */}
        <div className="hidden lg:flex flex-col w-[42%] bg-[#E87722] p-14 relative overflow-hidden select-none">

          {/* Large jersey number in bg */}
          <div aria-hidden className="absolute -bottom-6 -right-4 pointer-events-none"
            style={{ ...SYNE, fontWeight: 900, fontSize: '38vw', lineHeight: 1, letterSpacing: '-0.06em', color: 'rgba(0,0,0,0.07)' }}>
            01
          </div>

          {/* Logo */}
          <Link href="/" className="relative z-10">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" style={{ filter: 'brightness(0)' }} />
          </Link>

          {/* Copy */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <p style={{ ...SYNE, fontSize: '10px', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)' }} className="mb-7">
              Gratis starten
            </p>
            <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.87, letterSpacing: '-0.03em', fontSize: 'clamp(46px, 3.8vw, 66px)', color: '#000' }}>
              Word lid.<br />
              Sport samen.<br />
              <span style={{ color: 'white' }}>Gratis.</span>
            </h2>

            <div className="mt-12 space-y-4">
              {[
                '2.400+ sporters actief in Nederland',
                'Match op sport, niveau én locatie',
                '12 sporten — van hardlopen tot zwemmen',
              ].map((txt) => (
                <div key={txt} className="flex items-start gap-3">
                  <div style={{ width: 18, height: 2, background: 'rgba(0,0,0,0.28)', marginTop: 8, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: 'rgba(0,0,0,0.62)', fontWeight: 500, lineHeight: 1.5 }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10" style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
            Al een account?{' '}
            <Link href="/login" style={{ color: '#000', fontWeight: 700 }}>Inloggen →</Link>
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
                  <button type="submit" disabled={loading} className="rb">
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
