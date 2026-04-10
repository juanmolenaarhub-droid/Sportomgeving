'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mailadres of wachtwoord klopt niet.')
      setLoading(false)
    } else {
      const supabase2 = createClient()
      const { data: { user } } = await supabase2.auth.getUser()
      if (user) {
        const { data: profile } = await supabase2.from('profiles').select('full_name').eq('id', user.id).single()
        if (!profile?.full_name) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard/feed')
        }
      } else {
        router.push('/dashboard/feed')
      }
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <>
      <style>{`
        @keyframes l-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes l-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes l-float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes l-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes l-glow {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .l1 { animation: l-up .6s cubic-bezier(.16,1,.3,1) .06s both; }
        .l2 { animation: l-up .6s cubic-bezier(.16,1,.3,1) .14s both; }
        .l3 { animation: l-up .6s cubic-bezier(.16,1,.3,1) .22s both; }
        .l4 { animation: l-up .6s cubic-bezier(.16,1,.3,1) .30s both; }
        .l5 { animation: l-up .6s cubic-bezier(.16,1,.3,1) .38s both; }

        .li {
          display: block; width: 100%;
          background: transparent; border: none;
          border-bottom: 2px solid rgba(17,17,17,0.15);
          padding: 13px 0; font-size: 16px; color: #111;
          outline: none; transition: border-color .2s;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
        }
        .li::placeholder { color: rgba(17,17,17,0.3); font-weight: 400; }
        .li:focus { border-bottom-color: #E87722; }

        .lb {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 18px 24px;
          background: #111; color: white; border: none; border-radius: 16px;
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px;
          letter-spacing: .12em; text-transform: uppercase;
          cursor: pointer; transition: background .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .lb:hover:not(:disabled) { background: #E87722; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,119,34,0.4); }
        .lb:active:not(:disabled) { transform: translateY(0); }
        .lb:disabled { opacity: .45; cursor: not-allowed; }

        .lg-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 15px 20px;
          background: white; border: 2px solid rgba(17,17,17,0.1); border-radius: 14px;
          font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 14px; color: #333;
          cursor: pointer; transition: border-color .2s, box-shadow .2s, transform .15s;
        }
        .lg-btn:hover { border-color: rgba(17,17,17,0.25); box-shadow: 0 4px 16px rgba(0,0,0,.07); transform: translateY(-1px); }
      `}</style>

      <div style={DM} className="min-h-screen flex">

        {/* ── LEFT: Black brand panel ── */}
        <div
          className="hidden lg:flex flex-col w-[46%] p-14 relative overflow-hidden select-none"
          style={{ background: '#111111' }}
        >
          {/* Orange glow circle — decorative */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,119,34,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
            animation: 'l-glow 4s ease-in-out infinite',
          }} />

          {/* Orange ring */}
          <div style={{
            position: 'absolute', top: 30, right: 30,
            width: 180, height: 180, borderRadius: '50%',
            border: '2px solid rgba(232,119,34,0.25)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 60, right: 60,
            width: 120, height: 120, borderRadius: '50%',
            border: '1.5px solid rgba(232,119,34,0.15)',
            pointerEvents: 'none',
          }} />

          {/* Bottom rings */}
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 260, height: 260, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

          {/* Logo */}
          <Link href="/" className="relative z-10 shrink-0">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain brightness-0 invert" />
          </Link>

          {/* Main content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center gap-9">

            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E87722', display: 'inline-block', animation: 'l-pulse 2s ease-in-out infinite' }} />
              <span style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#E87722' }}>
                Welkom terug
              </span>
            </div>

            {/* Headline */}
            <div>
              <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em', fontSize: 'clamp(46px, 3.4vw, 66px)' }}>
                <span style={{ color: 'white' }}>Jouw buddy</span><br />
                <span style={{ color: '#E87722' }}>wacht</span>
                <span style={{ color: 'white' }}> op je.</span>
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 12, fontWeight: 500, lineHeight: 1.5 }}>
                Log in en ga verder waar je gebleven was.
              </p>
            </div>

            {/* Scrolling sport tags */}
            <div className="overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)' }}>
              <div style={{ display: 'flex', gap: '8px', animation: 'l-ticker 22s linear infinite', whiteSpace: 'nowrap' }}>
                {[
                  { label: 'Hardlopen', hl: false }, { label: 'Fietsen', hl: true },
                  { label: 'Zwemmen', hl: false }, { label: 'Gym', hl: false },
                  { label: 'Voetbal', hl: false }, { label: 'Tennis', hl: false },
                  { label: 'Yoga', hl: true }, { label: 'Padel', hl: false },
                  { label: 'Triathlon', hl: false }, { label: 'Wandelen', hl: false },
                  { label: 'Basketbal', hl: false }, { label: 'Boksen', hl: false },
                  // duplicate for seamless loop
                  { label: 'Hardlopen', hl: false }, { label: 'Fietsen', hl: true },
                  { label: 'Zwemmen', hl: false }, { label: 'Gym', hl: false },
                  { label: 'Voetbal', hl: false }, { label: 'Tennis', hl: false },
                  { label: 'Yoga', hl: true }, { label: 'Padel', hl: false },
                  { label: 'Triathlon', hl: false }, { label: 'Wandelen', hl: false },
                  { label: 'Basketbal', hl: false }, { label: 'Boksen', hl: false },
                ].map((tag, i) => (
                  <span key={i} style={{
                    display: 'inline-block', padding: '5px 13px', borderRadius: '999px',
                    fontSize: '11px', fontWeight: 600, flexShrink: 0,
                    background: tag.hl ? '#E87722' : '#1E1E1E', color: 'white',
                  }}>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-7" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80', animation: 'l-pulse 2.5s ease-in-out infinite' }} />
                <div>
                  <p style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>2.400+</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontWeight: 500 }}>Actieve sporters</p>
                </div>
              </div>
              {[
                { val: '850+', lbl: 'Matches gemaakt' },
                { val: '4.8★', lbl: 'Gemiddelde score' },
              ].map(s => (
                <div key={s.lbl}>
                  <p style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>{s.val}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontWeight: 500 }}>{s.lbl}</p>
                </div>
              ))}
            </div>

            {/* Mini testimonials */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { quote: 'Binnen een week mijn hardloopmaatje.', name: 'Daan V.', city: 'AMS' },
                { quote: 'Eindelijk op mijn niveau.', name: 'Lisa M.', city: 'UTR' },
                { quote: 'Drie reacties in twee dagen.', name: 'Marco R.', city: 'RTD' },
              ].map(t => (
                <div key={t.name} style={{ background: '#1A1A1A', borderRadius: 12, padding: '12px' }}>
                  <div style={{ color: '#E87722', fontSize: 9, marginBottom: 5 }}>★★★★★</div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, lineHeight: 1.4, fontWeight: 500, marginBottom: 6 }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 500 }}>{t.name} · {t.city}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom link */}
          <p className="relative z-10 shrink-0" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Nog geen account?{' '}
            <Link href="/register" style={{ color: '#E87722', fontWeight: 800 }}>Registreer gratis →</Link>
          </p>
        </div>

        {/* ── RIGHT: Form ── */}
        <div className="flex-1 bg-[#F5F0E8] flex flex-col">

          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(17,17,17,0.08)' }}>
            <Link href="/"><Image src="/logo.png" alt="Buddys" height={26} width={90} className="object-contain" /></Link>
            <Link href="/register" style={{ ...SYNE, fontSize: 12, fontWeight: 800, color: '#E87722', letterSpacing: '0.06em' }}>Registreren</Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-8 py-12 lg:px-16">
            <div className="w-full max-w-[370px]">

              {/* Heading */}
              <div className="l1 mb-9">
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em', fontSize: 'clamp(38px, 4vw, 50px)', color: '#111' }}>
                  Inloggen.
                </h1>
                <p style={{ fontSize: 14, color: '#999', marginTop: 10 }}>
                  Geen account?{' '}
                  <Link href="/register" style={{ color: '#E87722', fontWeight: 700 }}>Maak er gratis een aan</Link>
                </p>
              </div>

              {/* Google */}
              <div className="l2 mb-6">
                <button type="button" onClick={handleGoogleLogin} className="lg-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Doorgaan met Google
                </button>
              </div>

              {/* Divider */}
              <div className="l3 flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-black/10" />
                <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>of met e-mail</span>
                <div className="flex-1 h-px bg-black/10" />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin}>
                <div className="l3 mb-6">
                  <label style={{ ...SYNE, display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.17em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                    E-mailadres
                  </label>
                  <input
                    className="li"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="jij@email.com"
                  />
                </div>

                <div className="l4 mb-8">
                  <label style={{ ...SYNE, display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.17em', textTransform: 'uppercase', color: '#999', marginBottom: 10 }}>
                    Wachtwoord
                  </label>
                  <div className="relative">
                    <input
                      className="li"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{ paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#aaa' }}
                      aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="l5">
                  <button type="submit" disabled={loading} className="lb">
                    {loading ? 'Bezig...' : (
                      <>
                        Inloggen
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Mobile link */}
              <p className="lg:hidden mt-8 text-center" style={{ fontSize: 13, color: '#aaa' }}>
                Geen account?{' '}
                <Link href="/register" style={{ color: '#E87722', fontWeight: 700 }}>Registreer gratis</Link>
              </p>

            </div>
          </div>
        </div>

      </div>
    </>
  )
}
