'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Award, BarChart2, Trophy, Check, Menu, X } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

export default function VoorCreatorsPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={DM} className="bg-[#F4F1E8] min-h-screen">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F4F1E8]/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-9 text-sm font-medium text-gray-500">
            <Link href="/#hoe-het-werkt" className="hover:text-black transition-colors">Hoe het werkt</Link>
            <Link href="/voor-bedrijven" className="hover:text-black transition-colors">Voor bedrijven</Link>
            <Link href="/voor-creators" className="text-black font-semibold">Voor creators</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-medium text-gray-500 hover:text-black transition-colors">Inloggen</Link>
            <Link href="/register?type=creator" className="hidden md:flex bg-[#C4F542] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-black transition-all duration-200 items-center gap-1.5">
              Start als creator <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {/* Hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#F4F1E8] border-t border-black/8 px-8 py-5 space-y-4">
            <Link href="/#hoe-het-werkt" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-black transition-colors">Hoe het werkt</Link>
            <Link href="/voor-bedrijven" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-black transition-colors">Voor bedrijven</Link>
            <Link href="/voor-creators" onClick={() => setMobileOpen(false)} className="block text-sm font-bold text-black">Voor creators</Link>
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-black transition-colors">Inloggen</Link>
            <Link href="/register?type=creator" onClick={() => setMobileOpen(false)} className="block w-full text-center bg-[#C4F542] text-white font-semibold px-5 py-3 rounded-xl text-sm">
              Start als creator →
            </Link>
          </div>
        )}
      </header>

      {/* ── SECTIE 1: HERO (zwart) ── */}
      <section className="bg-[#1E2B20] pt-32 pb-28 relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Orange glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(232,119,34,0.12) 0%, transparent 60%)' }} />

        <div className="relative max-w-5xl mx-auto px-8 text-center">
          <span style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.2em' }}
            className="inline-block text-[#C4F542] uppercase mb-6">
            Voor personal trainers &amp; sport influencers
          </span>
          <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em' }}
            className="text-[clamp(40px,6vw,88px)] text-white mb-6">
            Jouw expertise.<br />Jouw community.<br />
            <span className="text-[#C4F542]">Jouw inkomen.</span>
          </h1>
          <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            Buddys geeft sport creators de tools om een loyale community te bouwen, challenges te hosten en te verdienen aan hun passie.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register?type=creator"
              className="inline-flex items-center gap-2 bg-[#C4F542] text-white font-bold px-8 py-4 rounded-2xl hover:bg-white hover:text-black transition-all duration-200 text-[15px]">
              Start als creator <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#uitleg"
              className="inline-flex items-center gap-2 border-2 border-white/15 text-white font-semibold px-8 py-4 rounded-2xl hover:border-white/40 transition-all duration-200 text-[15px]">
              Bekijk hoe het werkt
            </a>
          </div>
        </div>
      </section>

      {/* ── SECTIE 2: VOORDELEN (crème) ── */}
      <section className="py-24 bg-[#F4F1E8]">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#C4F542] uppercase tracking-widest mb-4">Creator voordelen</p>
            <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(32px,4.5vw,60px)] text-black">
              Alles wat je nodig hebt als creator
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Award,
                title: 'Verified badge',
                desc: 'Onderscheid jezelf met een oranje verified badge en hogere zichtbaarheid in zoekresultaten bij sporters in jouw niche.',
              },
              {
                icon: BarChart2,
                title: 'Creator analytics',
                desc: 'Zie wie je volgt, welke posts het beste scoren en wanneer jouw doelgroep het meest actief is op het platform.',
              },
              {
                icon: Trophy,
                title: 'Challenges & inkomsten',
                desc: 'Host betaalde of gratis sport challenges, coach sporters één op één en verdien een percentage van elke deelname.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-[#E8E0D5] hover:border-black/20 hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-[#C4F542]/10 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-[#C4F542]" />
                </div>
                <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-lg text-black mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTIE 3: HOE HET WERKT (wit) ── */}
      <section id="uitleg" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#C4F542] uppercase tracking-widest mb-4">Stappenplan</p>
            <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(32px,4.5vw,60px)] text-black">
              In 3 stappen live als creator
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Maak een account',
                desc: 'Registreer gratis via je e-mail of Google account. Duurt minder dan een minuut.',
              },
              {
                num: '02',
                title: 'Stel je creator profiel in',
                desc: 'Voeg je niche, sociale kanalen en expertise toe. Wij beoordelen je aanvraag binnen 24 uur.',
              },
              {
                num: '03',
                title: 'Bouw je community',
                desc: 'Start met posten, host je eerste challenge en groei je volgers op Buddys.',
              },
            ].map(step => (
              <div key={step.num} className="relative">
                <span style={{ ...SYNE, fontWeight: 900 }} className="text-[80px] leading-none text-[#C4F542]/12 block -mb-4">
                  {step.num}
                </span>
                <div className="w-10 h-10 bg-[#1E2B20] rounded-xl flex items-center justify-center mb-4">
                  <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-xl text-black mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/register?type=creator"
              className="inline-flex items-center gap-2 bg-[#1E2B20] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#C4F542] transition-all duration-200">
              Begin nu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTIE 4: VOOR WIE (crème) ── */}
      <section className="py-24 bg-[#F4F1E8]">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-xs font-semibold text-[#C4F542] uppercase tracking-widest mb-4">Doelgroep</p>
          <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
            className="text-[clamp(32px,4.5vw,60px)] text-black mb-10">
            Voor wie is Buddys Creator?
          </h2>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {[
              'Personal Trainer', 'Hardloopcoach', 'Triathlon coach', 'Sport Influencer',
              'Fysiotherapeut', 'Voedingscoach', 'Yoga instructeur', 'Zwemcoach',
            ].map(label => (
              <span key={label}
                className="px-5 py-2.5 bg-white border-2 border-[#E8E0D5] rounded-full text-sm font-semibold text-[#1E2B20] hover:border-[#C4F542] hover:text-[#C4F542] transition-colors cursor-default">
                {label}
              </span>
            ))}
          </div>
          <p className="text-gray-400 text-sm font-light">
            En iedereen die sporters wil begeleiden, inspireren of samenbrengen.
          </p>
        </div>
      </section>

      {/* ── SECTIE 5: PRICING (wit) ── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#C4F542] uppercase tracking-widest mb-4">Pricing</p>
            <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(32px,4.5vw,60px)] text-black mb-3">
              Wat kost het?
            </h2>
            <p className="text-gray-500 text-lg font-light">Starten is gratis. Je betaalt alleen als je verdient.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Starter */}
            <div className="bg-[#F4F1E8] rounded-3xl p-8 border border-[#E8E0D5] flex flex-col">
              <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-2xl text-black mb-1">Creator Starter</h3>
              <p className="text-gray-400 text-sm mb-7">Gratis beginnen als creator</p>
              <div className="mb-8">
                <span style={{ ...SYNE, fontWeight: 900 }} className="text-5xl text-black">€0</span>
                <span className="text-gray-400 text-sm ml-1">/ maand</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-gray-600 flex-1">
                {[
                  'Creator profiel aanmaken',
                  'Verified badge aanvragen',
                  'Gratis challenges hosten',
                  'Basis analytics',
                  'Zichtbaar in zoekresultaten',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#1E2B20] flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register?type=creator"
                className="block text-center bg-white border-2 border-black/10 text-black font-semibold py-3.5 rounded-2xl hover:bg-black hover:text-white hover:border-black transition-all">
                Gratis starten
              </Link>
            </div>

            {/* Pro — uitgelicht */}
            <div className="bg-[#1E2B20] rounded-3xl p-8 flex flex-col shadow-2xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#C4F542] text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">Meest gekozen</span>
              </div>
              <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-2xl text-white mb-1">Creator Pro</h3>
              <p className="text-white/40 text-sm mb-7">Voor de serieuze creator</p>
              <div className="mb-8">
                <span style={{ ...SYNE, fontWeight: 900 }} className="text-5xl text-[#C4F542]">€19,99</span>
                <span className="text-white/40 text-sm ml-1">/ maand</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-white/80 flex-1">
                {[
                  'Alles van Starter',
                  'Betaalde challenges hosten',
                  'Uitgebreide analytics dashboard',
                  'Verified badge prioriteit',
                  'Featured in sport-categorieën',
                  'Affiliate links in profiel',
                  'Directe chat met deelnemers',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#C4F542] flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register?type=creator"
                className="block text-center bg-[#C4F542] text-white font-bold py-3.5 rounded-2xl hover:bg-white hover:text-black transition-all">
                Start met Pro
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8 font-light">
            Buddys ontvangt 10% commissie op betaalde challenges en producten — alleen als jij verdient.
          </p>
        </div>
      </section>

      {/* ── SECTIE 6: CTA (zwart) ── */}
      <section className="bg-[#1E2B20] py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-3xl mx-auto px-8 text-center">
          <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.02em' }}
            className="text-[clamp(36px,5.5vw,72px)] text-white mb-5">
            Klaar om jouw sport-community te bouwen?
          </h2>
          <p className="text-gray-400 text-lg font-light mb-10">
            Gratis starten. Verified badge aanvragen. Vandaag nog live.
          </p>
          <Link href="/register?type=creator"
            className="inline-flex items-center gap-2 bg-[#C4F542] text-white font-bold px-10 py-5 rounded-2xl hover:bg-white hover:text-black transition-all duration-200 text-lg">
            Start als creator <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-600 text-sm mt-6">
            Al een account?{' '}
            <Link href="/dashboard/creator" className="text-gray-400 hover:text-white underline transition-colors">
              Activeer creator modus in je profiel instellingen.
            </Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1A1714] pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            <div className="col-span-2 md:col-span-1">
              <Image src="/logo.png" alt="Buddys" height={26} width={88} className="object-contain brightness-0 invert mb-5" />
              <p className="text-sm text-gray-600 leading-relaxed font-light">Vind je perfecte sportmaatje. Gemaakt in Nederland.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-5">Product</p>
              <ul className="space-y-3">
                {['Hoe het werkt', 'AI Matching', 'Community', 'Prijzen'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-gray-600 hover:text-white transition-colors font-light">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-5">Bedrijf</p>
              <ul className="space-y-3">
                {[
                  { label: 'Over ons', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'Voor bedrijven', href: '/voor-bedrijven' },
                  { label: 'Voor creators', href: '/voor-creators' },
                  { label: 'Vacatures', href: '#' },
                ].map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-gray-600 hover:text-white transition-colors font-light">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-5">Support</p>
              <ul className="space-y-3">
                {['Helpcentrum', 'Contact', 'Privacy', 'Voorwaarden'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-gray-600 hover:text-white transition-colors font-light">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8">
            <p className="text-sm text-gray-700 text-center">© 2025 Buddys · Gemaakt in Nederland</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}
