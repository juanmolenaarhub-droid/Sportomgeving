'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Users, BarChart2, Trophy, CheckCircle } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

const benefits = [
  {
    icon: Users,
    title: 'Verified badge',
    desc: 'Krijg een oranje verified badge op je profiel en verschijn hoger in zoekresultaten.',
  },
  {
    icon: BarChart2,
    title: 'Analytics dashboard',
    desc: 'Zie wie je volgt, welke posts scoren en wanneer je publiek actief is.',
  },
  {
    icon: Trophy,
    title: 'Host challenges',
    desc: 'Maak betaalde of gratis sport-challenges aan en bouw een actieve community.',
  },
]

const perks = [
  'Verified badge op je profiel en in de feed',
  'Eigen creator dashboard met analytics',
  'Challenges aanmaken voor je volgers',
  'Hoger zichtbaar in zoekresultaten',
  'Directe inkomsten via betaalde challenges',
  'Community van actieve sporters bereiken',
]

export default function CreatorLandingPage() {
  return (
    <div style={DM} className="bg-[#F5F0E8] min-h-screen overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Inloggen</Link>
            <Link href="/creator/aanmelden" className="bg-[#111111] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#E87722] transition-all duration-200 flex items-center gap-1.5">
              Aanmelden als creator <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO — zwarte achtergrond ── */}
      <section className="pt-32 pb-24 bg-[#111111] relative overflow-hidden">
        {/* Subtiel grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Oranje glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.12) 0%, transparent 65%)' }} />

        <div className="relative max-w-5xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 border border-[#E87722]/30 bg-[#E87722]/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-[#E87722] rounded-full" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            <span className="text-xs font-bold text-[#E87722] uppercase tracking-widest">Voor Creators & Trainers</span>
          </div>

          <h1 style={{ ...SYNE, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.02em' }}
            className="text-[clamp(48px,7vw,96px)] text-white mb-6">
            Bouw je<br />
            <span className="text-[#E87722]">sport-community</span><br />
            op Buddys.
          </h1>

          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed font-light mb-10">
            Bereik duizenden sporters, host challenges en verdien aan jouw expertise — allemaal op één platform.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/creator/aanmelden"
              className="group inline-flex items-center gap-2 bg-[#E87722] text-white font-bold px-10 py-4 rounded-2xl hover:bg-white hover:text-black transition-all duration-200 text-base">
              Aanmelden als creator
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 border border-white/15 text-white/70 font-semibold px-8 py-4 rounded-2xl hover:border-white/40 hover:text-white transition-all duration-200 text-base">
              Al een account? Log in
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-6">Gratis aanmelden · Beoordeling binnen 48 uur · Direct live na goedkeuring</p>
        </div>
      </section>

      {/* ── VOORDELEN ── */}
      <section className="py-28 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-4">Wat je krijgt</p>
            <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(36px,5vw,64px)] text-black">
              Alles voor serieuze creators.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl border border-[#E8E0D5] p-8 hover:border-[#111]/20 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-[#E87722]/10 rounded-2xl flex items-center justify-center mb-5">
                  <b.icon className="w-6 h-6 text-[#E87722]" />
                </div>
                <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-xl text-black mb-2">{b.title}</h3>
                <p className="text-gray-500 leading-relaxed font-light">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Perks checklist */}
          <div className="bg-white rounded-3xl border border-[#E8E0D5] p-10">
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-4">
              {perks.map(perk => (
                <div key={perk} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-[#111111] rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 bg-[#111111]">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { val: '2.400+', lbl: 'Actieve sporters' },
              { val: '850+', lbl: 'Matches gemaakt' },
              { val: '48u', lbl: 'Beoordeling aanvraag' },
            ].map(s => (
              <div key={s.lbl}>
                <p style={{ ...SYNE, fontWeight: 800 }} className="text-[clamp(36px,4vw,52px)] text-[#E87722]">{s.val}</p>
                <p className="text-gray-500 text-sm mt-1 font-medium">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-28 bg-[#F5F0E8]">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
            className="text-[clamp(40px,5vw,72px)] text-black mb-5">
            Klaar om te beginnen?
          </h2>
          <p className="text-gray-500 text-lg mb-10 font-light max-w-xl mx-auto">
            Meld je aan als creator en bereik duizenden sporters die al actief zijn op Buddys.
          </p>
          <Link href="/creator/aanmelden"
            className="inline-flex items-center gap-2 bg-[#E87722] text-white font-bold px-10 py-5 rounded-2xl hover:bg-[#111111] transition-all duration-200 text-base">
            Start je creator profiel <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-400 text-sm mt-5">Gratis · Geen creditcard nodig · Binnen 48 uur live</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A1714] py-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/logo.png" alt="Buddys" height={24} width={80} className="object-contain brightness-0 invert" />
          <p className="text-xs text-gray-600">© 2025 Buddys · Gemaakt in Nederland</p>
          <Link href="/" className="text-xs text-gray-600 hover:text-white transition-colors">← Terug naar hoofdpagina</Link>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
