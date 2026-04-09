'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

const SYNE = { fontFamily: "'Syne', sans-serif" }
const DM = { fontFamily: "'DM Sans', sans-serif" }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      router.push('/dashboard')
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
        @keyframes log-slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes log-floatA {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(12deg); }
        }
        @keyframes log-floatB {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-10px) rotate(-8deg); }
        }
        @keyframes log-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes log-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.6; }
        }
        .log-a1 { animation: log-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .log-a2 { animation: log-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .log-a3 { animation: log-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        .log-a4 { animation: log-slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .log-input {
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
        .log-input::placeholder { color: #c9c7c2; }
        .log-input:focus {
          border-color: #E87722;
          box-shadow: 0 0 0 4px rgba(232,119,34,0.12);
        }
        .log-cta-primary {
          width: 100%;
          background: #111;
          color: white;
          font-weight: 900;
          padding: 17px 24px;
          border-radius: 18px;
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: background 0.2s, transform 0.15s;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .log-cta-primary:hover { background: #E87722; transform: translateY(-1px); }
        .log-cta-primary:active { transform: translateY(0); }
        .log-cta-primary:disabled { opacity: 0.5; pointer-events: none; }
        .log-google-btn {
          width: 100%;
          background: white;
          border: 2px solid rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 14px 20px;
          font-weight: 600;
          font-size: 14px;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .log-google-btn:hover {
          border-color: rgba(0,0,0,0.18);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
      `}</style>

      <div style={DM} className="min-h-screen flex overflow-hidden">

        {/* ── LEFT PANEL ── Orange, bold */}
        <div className="hidden lg:flex relative flex-col w-[44%] overflow-hidden"
          style={{ background: '#E87722' }}>

          {/* Ghost background word */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span style={{ ...SYNE, fontWeight: 900, fontSize: '16vw', lineHeight: 1, letterSpacing: '-0.04em', color: 'rgba(0,0,0,0.06)' }}>
              BACK
            </span>
          </div>

          {/* Black triangle — bottom left */}
          <div className="absolute bottom-0 left-0 w-56 h-56 pointer-events-none"
            style={{ background: 'black', clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }} />

          {/* Top right triangle */}
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.1)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

          {/* Spinning ring */}
          <div className="absolute top-32 right-12 w-28 h-28 rounded-full pointer-events-none"
            style={{ border: '2px solid rgba(0,0,0,0.15)', animation: 'log-spin 20s linear infinite' }}>
            <div className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: 'rgba(0,0,0,0.4)' }} />
          </div>

          {/* Floating shapes */}
          <div className="absolute bottom-44 right-8 w-6 h-6 rounded-full bg-black/20 pointer-events-none"
            style={{ animation: 'log-floatA 6s ease-in-out infinite' }} />
          <div className="absolute bottom-60 right-24 w-3 h-3 rounded-full bg-black/15 pointer-events-none"
            style={{ animation: 'log-floatB 7s ease-in-out infinite 1s' }} />
          <div className="absolute top-52 left-10 w-4 h-4 rounded-full bg-black/10 pointer-events-none"
            style={{ animation: 'log-floatA 5.5s ease-in-out infinite 0.8s' }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full p-12">

            {/* Logo — inverted to black on orange */}
            <div>
              <Link href="/">
                <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" style={{ filter: 'brightness(0)' }} />
              </Link>
            </div>

            {/* Main copy */}
            <div className="flex-1 flex flex-col justify-center py-10">
              <p className="text-black/40 text-[10px] font-black uppercase tracking-[0.25em] mb-6">
                Welkom terug
              </p>
              <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.85, letterSpacing: '-0.04em', fontSize: 'clamp(52px, 5vw, 80px)', color: 'black' }}>
                Jouw<br />buddy<br />wacht.
              </h2>

              <p className="mt-8 text-black/60 text-base leading-relaxed max-w-[260px]" style={DM}>
                Log in en ga direct verder met sporten met mensen die bij jou passen.
              </p>

              {/* Stats row */}
              <div className="mt-10 flex gap-8">
                {[
                  { val: '850+', lbl: 'Matches gemaakt' },
                  { val: '4.8', lbl: 'Gemiddelde score' },
                ].map(s => (
                  <div key={s.lbl}>
                    <p style={{ ...SYNE, fontWeight: 900, fontSize: '28px', lineHeight: 1, color: 'black', letterSpacing: '-0.03em' }}>
                      {s.val}
                    </p>
                    <p className="text-black/50 text-xs font-medium mt-1">{s.lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom link */}
            <div>
              <p className="text-black/50 text-sm">
                Nog geen account?{' '}
                <Link href="/register" className="text-black font-bold hover:underline transition-colors">
                  Registreer gratis →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── Form */}
        <div className="flex-1 flex flex-col relative overflow-hidden"
          style={{ background: '#edece8', backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1.2' fill='rgba(0,0,0,0.05)'/%3E%3C/svg%3E")` }}>

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-56 h-56 pointer-events-none"
            style={{ background: '#E87722', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', opacity: 0.07 }} />

          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between p-6">
            <Link href="/"><Image src="/logo.png" alt="Buddys" height={26} width={90} className="object-contain" /></Link>
            <Link href="/register" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">Registreren</Link>
          </div>

          {/* Form area */}
          <div className="flex-1 flex items-center justify-center px-8 py-10">
            <div className="w-full max-w-[400px]">

              {/* Title */}
              <div className="log-a1 mb-9">
                <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.03em', fontSize: 'clamp(38px, 5vw, 54px)' }}
                  className="text-black">
                  Inloggen.
                </h1>
                <p className="text-gray-500 text-sm mt-3">
                  Nog geen account?{' '}
                  <Link href="/register" className="text-[#E87722] font-bold hover:underline">
                    Maak er gratis een aan
                  </Link>
                </p>
              </div>

              {/* Google button */}
              <div className="log-a2">
                <button onClick={handleGoogleLogin} className="log-google-btn">
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
              <div className="log-a3 relative my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-black/10" />
                <span className="text-xs text-gray-400 font-medium" style={DM}>of met e-mail</span>
                <div className="flex-1 h-px bg-black/10" />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="log-a4">
                <div className="space-y-4">
                  <div>
                    <label style={{ ...SYNE, fontSize: '10px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#111', display: 'block', marginBottom: '8px' }}>
                      E-mailadres
                    </label>
                    <input
                      className="log-input"
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
                      className="log-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="mt-6">
                  <button type="submit" disabled={loading} className="log-cta-primary">
                    {loading ? 'Bezig...' : (
                      <>
                        Inloggen
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Mobile register link */}
              <p className="lg:hidden mt-8 text-center text-sm text-gray-500">
                Nog geen account?{' '}
                <Link href="/register" className="text-[#E87722] font-bold hover:underline">Registreer gratis</Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
