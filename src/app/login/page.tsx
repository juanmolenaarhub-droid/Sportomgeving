'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

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
    <div className="min-h-screen flex flex-col">
      {/* Navigatiebalk */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/logo.png" alt="Buddys" height={36} width={120} className="object-contain" /></Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/register" className="hover:text-black transition-colors">Registreren</Link>
            <Link href="/login" className="bg-[#E87722] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#d06a1a] transition-colors">Inloggen</Link>
          </nav>
        </div>
      </header>

      {/* Hoofd content */}
      <main className="flex flex-1">
        {/* Links: branding */}
        <div className="hidden lg:flex flex-col justify-center bg-black text-white w-1/2 px-16 py-20">
          <p className="text-[#E87722] font-semibold text-sm uppercase tracking-widest mb-4">Welkom terug</p>
          <h2 className="text-5xl font-black leading-tight mb-6">
            Jouw sportmaatje<br />wacht op je.
          </h2>
          <p className="text-gray-400 text-lg max-w-sm">
            Log in en ontdek nieuwe sportpartners in jouw buurt. Samen presteren is beter dan alleen.
          </p>
          <div className="mt-12 flex gap-8 text-sm text-gray-500">
            <div><span className="text-white font-bold text-2xl block">2.400+</span>Actieve leden</div>
            <div><span className="text-white font-bold text-2xl block">12</span>Sporten</div>
            <div><span className="text-white font-bold text-2xl block">50+</span>Regio's</div>
          </div>
        </div>

        {/* Rechts: formulier */}
        <div className="flex-1 flex items-center justify-center bg-white px-8 py-16">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-black text-black mb-2">Inloggen</h1>
            <p className="text-gray-400 mb-8">Nog geen account? <Link href="/register" className="text-[#E87722] font-semibold hover:underline">Maak er gratis een aan</Link></p>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Doorgaan met Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-400">of met e-mail</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mailadres</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] focus:border-transparent"
                  placeholder="jij@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Wachtwoord</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E87722] text-white font-bold py-3 rounded-xl hover:bg-[#d06a1a] transition-colors disabled:opacity-50 text-base"
              >
                {loading ? 'Bezig...' : 'Inloggen'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
