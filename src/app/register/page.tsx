'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const SYNE = { fontFamily: "'Syne', sans-serif" }
const DM = { fontFamily: "'DM Sans', sans-serif" }

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
        @keyframes reg-slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes reg-floatA {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-16px) rotate(10deg); }
        }
        @keyframes reg-floatB {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-10px) rotate(-6deg); }
        }
        @keyframes reg-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes reg-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes reg-shine {
          0%   { transform: translateX(-150%) skewX(-12deg); }
          100% { transform: translateX(250%) skewX(-12deg); }
        }
        .reg-a1 { animation: reg-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .reg-a2 { animation: reg-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .reg-a3 { animation: reg-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .reg-a4 { animation: reg-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
        .reg-input {
          width: 100%;
          background: white;
          border: 2px solid transparent;
          border-radius: 16px;
          padding: 14px 20px;
          color: black;
          font-size: 15px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          font-family: 'DM Sans', sans-serif;
        }
        .reg-input::placeholder { color: #c9c7c2; }
        .reg-input:focus {
          border-color: #E87722;
          box-shadow: 0 0 0 4px rgba(232,119,34,0.12);
        }
        .reg-cta {
          position: relative;
          width: 100%;
          background: #E87722;
          color: white;
          font-weight: 900;
          padding: 18px 24px;
          border-radius: 18px;
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          overflow: hidden;
          transition: background 0.2s, transform 0.15s;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .reg-cta:hover { background: #111; transform: translateY(-1px); }
        .reg-cta:active { transform: translateY(0px); }
        .reg-cta:disabled { opacity: 0.5; pointer-events: none; }
        .reg-cta::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          skewX: -12deg;
        }
        .reg-cta:hover::after { animation: reg-shine 0.6s ease forwards; }
      `}</style>

      <div style={DM} className="min-h-screen flex overflow-hidden">

        {/* ── LEFT PANEL ── Black, athletic */}
        <div className="hidden lg:flex relative flex-col w-[44%] bg-black overflow-hidden">

          {/* Ghost background word */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span style={{ ...SYNE, fontWeight: 900, fontSize: '18vw', lineHeight: 1, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.025)' }}>
              JOIN
            </span>
          </div>

          {/* Orange triangle — top right */}
          <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
            style={{ background: '#E87722', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

          {/* Spinning ring */}
          <div className="absolute bottom-28 right-10 w-36 h-36 rounded-full pointer-events-none"
            style={{ border: '2px solid rgba(232,119,34,0.22)', animation: 'reg-spin 25s linear infinite' }}>
            <div className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-[#E87722] rounded-full" />
            <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-1/2 bg-[#E87722]/50 rounded-full" />
          </div>
          <div className="absolute bottom-20 right-20 w-20 h-20 rounded-full pointer-events-none"
            style={{ border: '1px solid rgba(232,119,34,0.15)' }} />

          {/* Floating dots */}
          <div className="absolute top-44 left-14 w-5 h-5 bg-[#E87722] rounded-full pointer-events-none"
            style={{ animation: 'reg-floatA 6s ease-in-out infinite', opacity: 0.7 }} />
          <div className="absolute top-64 right-16 w-3 h-3 rounded-full pointer-events-none"
            style={{ background: 'rgba(232,119,34,0.35)', animation: 'reg-floatB 7.5s ease-in-out infinite 1.2s' }} />
          <div className="absolute top-80 left-8 w-2 h-2 bg-white/20 rounded-full pointer-events-none"
            style={{ animation: 'reg-floatA 5s ease-in-out infinite 0.5s' }} />

          {/* Horizontal rule accent */}
          <div className="absolute left-12 right-12 pointer-events-none" style={{ top: '42%', height: '1px', background: 'rgba(255,255,255,0.04)' }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full p-12">

            {/* Logo */}
            <div>
              <Link href="/">
                <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain brightness-0 invert" />
              </Link>
            </div>

            {/* Main copy */}
            <div className="flex-1 flex flex-col justify-center py-10">
              <p className="text-[#E87722] text-[10px] font-black uppercase tracking-[0.25em] mb-6">
                Gratis starten
              </p>
              <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em' }}
                className="text-white mb-3">
                <span style={{ fontSize: 'clamp(48px, 4.5vw, 72px)', display: 'block', ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em' }}>
                  Word lid van
                </span>
                <span style={{ fontSize: 'clamp(72px, 7vw, 110px)', display: 'block', color: '#E87722', fontFamily: "'Syne', sans-serif", fontWeight: 900, lineHeight: 0.85, letterSpacing: '-0.04em' }}>
                  2.400+
                </span>
                <span style={{ fontSize: 'clamp(48px, 4.5vw, 72px)', display: 'block', fontFamily: "'Syne', sans-serif", fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em' }}>
                  sporters.
                </span>
              </h2>

              <div className="mt-10 space-y-5">
                {[
                  { num: '01', text: 'Volledig gratis account' },
                  { num: '02', text: 'Match op jouw niveau en locatie' },
                  { num: '03', text: 'Meer dan 12 sporten beschikbaar' },
                ].map(item => (
                  <div key={item.num} className="flex items-center gap-4 group">
                    <span style={{ ...SYNE, fontSize: '10px', fontWeight: 700, color: 'rgba(232,119,34,0.5)', minWidth: '20px' }}>
                      {item.num}
                    </span>
                    <div style={{ width: '20px', height: '1px', background: 'rgba(232,119,34,0.25)' }} />
                    <span className="text-gray-400 text-sm font-medium group-hover:text-gray-200 transition-colors">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom link */}
            <div>
              <p className="text-gray-600 text-sm">
                Al een account?{' '}
                <Link href="/login" className="text-[#E87722] font-bold hover:underline transition-colors">
                  Inloggen →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── Form */}
        <div className="flex-1 flex flex-col relative overflow-hidden"
          style={{ background: '#edece8', backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1.2' fill='rgba(0,0,0,0.05)'/%3E%3C/svg%3E")` }}>

          {/* Corner accent */}
          <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none"
            style={{ background: '#E87722', clipPath: 'polygon(100% 0, 100% 100%, 0 100%)', opacity: 0.06 }} />

          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between p-6">
            <Link href="/"><Image src="/logo.png" alt="Buddys" height={26} width={90} className="object-contain" /></Link>
            <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">Inloggen</Link>
          </div>

          {/* Form area */}
          <div className="flex-1 flex items-center justify-center px-8 py-10">
            <div className="w-full max-w-[400px]">

              {/* Title */}
              <div className="reg-a1 mb-9">
                <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ background: 'rgba(232,119,34,0.1)', color: '#E87722' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E87722]"
                    style={{ animation: 'reg-pulse 2s ease-in-out infinite' }} />
                  Nu gratis starten
                </div>
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em', fontSize: 'clamp(38px, 5vw, 54px)' }}
                  className="text-black">
                  Account<br />aanmaken.
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="reg-a2">
                <div className="space-y-4">

                  <div>
                    <label style={{ ...SYNE, fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#111', display: 'block', marginBottom: '8px' }}>
                      Gebruikersnaam
                    </label>
                    <input
                      className="reg-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      required
                      minLength={3}
                      placeholder="jouwusername"
                    />
                  </div>

                  <div>
                    <label style={{ ...SYNE, fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#111', display: 'block', marginBottom: '8px' }}>
                      E-mailadres
                    </label>
                    <input
                      className="reg-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="jij@email.com"
                    />
                  </div>

                  <div>
                    <label style={{ ...SYNE, fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#111', display: 'block', marginBottom: '8px' }}>
                      Wachtwoord
                    </label>
                    <input
                      className="reg-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimaal 6 tekens"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="reg-a3 mt-6">
                  <button type="submit" disabled={loading} className="reg-cta">
                    {loading ? 'Bezig...' : (
                      <>
                        Maak gratis account aan
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>

                <p className="reg-a4 mt-4 text-xs text-gray-400 text-center" style={DM}>
                  Door te registreren ga je akkoord met onze{' '}
                  <span className="underline cursor-pointer hover:text-gray-600 transition-colors">voorwaarden</span>.
                </p>
              </form>

              {/* Mobile login link */}
              <p className="lg:hidden mt-8 text-center text-sm text-gray-500">
                Al een account?{' '}
                <Link href="/login" className="text-[#E87722] font-bold hover:underline">Inloggen</Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
