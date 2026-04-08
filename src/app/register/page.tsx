'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

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
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/onboarding')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigatiebalk */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/logo.png" alt="Buddys" height={36} width={120} className="object-contain" /></Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/login" className="hover:text-black transition-colors">Inloggen</Link>
            <Link href="/register" className="bg-[#E87722] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#d06a1a] transition-colors">Registreren</Link>
          </nav>
        </div>
      </header>

      {/* Hoofd content */}
      <main className="flex flex-1">
        {/* Links: branding */}
        <div className="hidden lg:flex flex-col justify-center bg-[#E87722] text-white w-1/2 px-16 py-20">
          <p className="text-white/70 font-semibold text-sm uppercase tracking-widest mb-4">Gratis starten</p>
          <h2 className="text-5xl font-black leading-tight mb-6">
            Vind je ideale<br />sportpartner.
          </h2>
          <p className="text-white/80 text-lg max-w-sm">
            Maak een gratis account aan en kom in contact met sporters in jouw buurt die hetzelfde niveau hebben.
          </p>
          <div className="mt-12 space-y-4">
            {[
              '✓ Volledig gratis account',
              '✓ Vind buddies op jouw niveau',
              '✓ Sluit je aan bij sportgroepen',
              '✓ Deel je trainingen',
            ].map((item) => (
              <p key={item} className="text-white/90 font-medium">{item}</p>
            ))}
          </div>
        </div>

        {/* Rechts: formulier */}
        <div className="flex-1 flex items-center justify-center bg-white px-8 py-16">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-black text-black mb-2">Account aanmaken</h1>
            <p className="text-gray-400 mb-8">Al een account? <Link href="/login" className="text-[#E87722] font-semibold hover:underline">Inloggen</Link></p>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gebruikersnaam</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  required
                  minLength={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] focus:border-transparent"
                  placeholder="jouwusername"
                />
              </div>
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
                  minLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] focus:border-transparent"
                  placeholder="Minimaal 6 tekens"
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E87722] text-white font-bold py-3 rounded-xl hover:bg-[#d06a1a] transition-colors disabled:opacity-50 text-base"
              >
                {loading ? 'Bezig...' : 'Maak gratis account aan →'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Door te registreren ga je akkoord met onze voorwaarden.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
