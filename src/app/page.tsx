'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Play, Sparkles } from 'lucide-react'
import { TestimonialV2 } from '@/components/ui/testimonial-v2'

const SYNE = { fontFamily: "'Syne', sans-serif" }
const DM = { fontFamily: "'DM Sans', sans-serif" }

const ROTATING_WORDS = ['sportmaatje', 'fietsbuddy', 'zwempartner', 'gymmaatje']

const TICKER_ITEMS = [
  'Meer dan 1.000 sporters hebben hun buddy gevonden via Buddys',
  'Samen trainen. Samen groeien. Samen presteren.',
  'Van ochtendlopen tot avondritten — jouw buddy wacht op je',
  'Onvergetelijke sportavonturen beginnen met de juiste persoon',
  'Honderden nieuwe vriendschappen zijn hier gestart',
  'Jij bepaalt het niveau. Wij vinden de match.',
]

const steps = [
  {
    num: '01',
    title: 'Bouw je profiel',
    desc: 'Voeg je sporten, niveau en beschikbaarheid toe. Klaar in twee minuten.',
  },
  {
    num: '02',
    title: 'Vind je match',
    desc: 'Filter op sport, niveau, locatie en tijdstip — of laat onze AI het voor jou doen.',
  },
  {
    num: '03',
    title: 'Sport samen',
    desc: 'Stuur een verzoek, word geaccepteerd en spreek af. Direct. Zonder gedoe.',
  },
]



export default function LandingPage() {
  const [visible, setVisible] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length)
        setWordVisible(true)
      }, 350)
    }, 3000)
    return () => clearInterval(interval)
  }, [])


  return (
    <div style={DM} className="bg-[#edece8] overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#edece8]/95 backdrop-blur-sm border-b border-black/8">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Buddys" height={30} width={105} className="object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-9 text-sm font-medium text-gray-500">
            <a href="#hoe-het-werkt" className="hover:text-black transition-colors">Hoe het werkt</a>
<a href="#community" className="hover:text-black transition-colors">Community</a>
            <Link href="/voor-bedrijven" className="hover:text-black transition-colors">Voor bedrijven</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Inloggen</Link>
            <Link href="/register" className="bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#E87722] transition-all duration-200 flex items-center gap-1.5">
              Gratis starten <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── TICKER ── */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#E87722] overflow-hidden" style={{ height: '36px' }}>
        <div className="flex items-center h-full" style={{ animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap', willChange: 'transform' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 text-white text-xs font-semibold px-8 tracking-wide">
              <span className="w-1 h-1 bg-white/50 rounded-full shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-[100px] overflow-hidden">
        {/* Subtle grain overlay */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '200px' }} />

        {/* Oranje glow rechtsboven */}
        <div className="absolute -top-32 right-[-15%] w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.12) 0%, transparent 70%)' }} />

        <div className="max-w-7xl mx-auto px-8 w-full py-24">
          <div className="grid lg:grid-cols-5 gap-16 items-center">

            {/* Left: 3/5 */}
            <div className="lg:col-span-3"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)', transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)' }}>

              <div className="inline-flex items-center gap-2.5 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 border border-black/10 bg-white/60 text-gray-600 tracking-wide">
                <span className="w-1.5 h-1.5 bg-[#E87722] rounded-full" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                2.400+ sporters actief in Nederland
              </div>

              <h1 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
                className="text-[clamp(56px,7.5vw,116px)] text-black">
                Vind je<br />
                <span className="text-[#E87722]">perfecte</span><br />
                <span className="inline-block transition-all duration-350"
                  style={{
                    opacity: wordVisible ? 1 : 0,
                    transform: wordVisible ? 'translateY(0) skewX(0deg)' : 'translateY(14px) skewX(-2deg)',
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}>
                  {ROTATING_WORDS[wordIndex]}.
                </span>
              </h1>

              <p className="text-lg text-gray-500 mt-7 max-w-lg leading-relaxed font-light">
                Buddys koppelt sporters met dezelfde interesses, hetzelfde niveau en dezelfde ambities. Geen toevalligheden — slimme matching die echt werkt.
              </p>

              <div className="flex flex-wrap gap-3 mt-9">
                <Link href="/register"
                  className="group inline-flex items-center gap-2 bg-[#E87722] text-white font-semibold px-8 py-4 rounded-2xl hover:bg-black transition-all duration-250 text-[15px]">
                  Start gratis account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#hoe-het-werkt"
                  className="inline-flex items-center gap-2 border border-black/12 text-gray-600 font-semibold px-8 py-4 rounded-2xl hover:border-black hover:text-black transition-all duration-200 text-[15px] bg-white/50">
                  Hoe werkt het?
                </a>
              </div>

              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-black/6">
                {[
                  { val: '2.400+', lbl: 'Actieve sporters' },
                  { val: '850+', lbl: 'Matches gemaakt' },
                  { val: '4.8', lbl: 'Gemiddelde score' },
                ].map(s => (
                  <div key={s.lbl}>
                    <p style={SYNE} className="text-2xl font-bold text-black">{s.val}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 2/5 — floating cards */}
            <div className="lg:col-span-2 relative h-[460px] hidden lg:block"
              style={{ opacity: visible ? 1 : 0, transition: 'all 1.1s cubic-bezier(0.16,1,0.3,1) 0.15s' }}>

              <div className="absolute top-0 right-0 w-64 bg-white rounded-3xl shadow-xl p-5 border border-gray-100/80"
                style={{ animation: 'float1 7s ease-in-out infinite' }}>
                <div className="w-12 h-12 bg-[#E87722] rounded-2xl mb-3 flex items-center justify-center text-white font-bold text-base" style={SYNE}>TvB</div>
                <p className="font-bold text-black text-sm" style={SYNE}>Tim van Berg</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />Amsterdam</p>
                <div className="flex gap-1.5 mt-3">
                  <span className="text-xs bg-black text-white font-semibold px-2.5 py-1 rounded-full">Hardlopen</span>
                  <span className="text-xs bg-orange-50 text-[#E87722] font-semibold px-2.5 py-1 rounded-full">Gevorderd</span>
                </div>
                <p className="text-xs text-gray-400 mt-3 leading-relaxed bg-gray-50 rounded-xl p-2.5">
                  Zoek iemand voor ochtendtraining, 3x per week — snelheid en consistentie zijn mijn prioriteit.
                </p>
              </div>

              <div className="absolute bottom-20 left-0 w-56 bg-black rounded-3xl shadow-xl p-5"
                style={{ animation: 'float2 8s ease-in-out infinite 0.5s' }}>
                <div className="w-11 h-11 bg-[#E87722] rounded-xl mb-3 flex items-center justify-center text-white font-bold text-sm" style={SYNE}>SJ</div>
                <p className="font-bold text-white text-sm" style={SYNE}>Sarah Jansen</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />Utrecht</p>
                <div className="flex gap-1.5 mt-3">
                  <span className="text-xs bg-[#E87722] text-white font-semibold px-2.5 py-1 rounded-full">Fietsen</span>
                  <span className="text-xs bg-white/10 text-white font-semibold px-2.5 py-1 rounded-full">Gemiddeld</span>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E87722] text-white rounded-2xl px-4 py-2.5 shadow-lg z-10 whitespace-nowrap"
                style={{ animation: 'float3 5.5s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-semibold text-sm" style={SYNE}>97% match</span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-white rounded-2xl shadow-lg p-3.5 border border-gray-100"
                style={{ animation: 'float2 9s ease-in-out infinite 1s' }}>
                <p className="font-bold text-black text-xs" style={SYNE}>24 leden online</p>
                <p className="text-xs text-gray-400 mt-0.5">in jouw regio</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── HOE HET WERKT ── */}
      <section id="hoe-het-werkt" className="py-32 bg-[#edece8]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div>
              <p className="text-xs font-semibold text-[#E87722] uppercase tracking-widest mb-4">Simpel en direct</p>
              <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
                className="text-[clamp(40px,5vw,72px)] text-black mb-6">
                In 3 stappen je buddy gevonden
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed font-light">
                Geen ingewikkeld systeem. Geen lange vragenlijsten. Gewoon sporten met iemand die dezelfde doelen heeft als jij.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 mt-10 bg-black text-white font-semibold px-7 py-4 rounded-2xl hover:bg-[#E87722] transition-all duration-200">
                Direct beginnen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.num}
                  className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-[#E87722]/40 hover:shadow-lg transition-all duration-300 flex items-start gap-6">
                  <span style={{ ...SYNE, fontWeight: 800 }} className="text-4xl text-[#E87722]/25 leading-none shrink-0 group-hover:text-[#E87722]/50 transition-colors">{step.num}</span>
                  <div>
                    <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-xl text-black mb-2">{step.title}</h3>
                    <p className="text-gray-500 leading-relaxed font-light">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO SECTIE ── */}
      <section className="py-24 bg-[#edece8]">
        <div className="max-w-5xl mx-auto px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-[#E87722] uppercase tracking-widest mb-4">Bekijk hoe het werkt</p>
            <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(36px,4.5vw,64px)] text-black">
              Zie Buddys in actie
            </h2>
          </div>
          {/* Video placeholder */}
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden group cursor-pointer shadow-2xl">
            {/* Gradient achtergrond als placeholder */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)' }} />
            {/* Subtiel grid patroon */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Oranje glow */}
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, rgba(232,119,34,0.08) 0%, transparent 60%)' }} />
            {/* Play button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-[#E87722] rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 mb-6">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
              <p style={{ ...SYNE, fontWeight: 700 }} className="text-white text-xl">Bekijk de introductievideo</p>
              <p className="text-gray-500 text-sm mt-2">Video komt binnenkort beschikbaar</p>
            </div>
          </div>
        </div>
      </section>

      <TestimonialV2 />

      {/* ── PRIJZEN ── */}
      <section id="prijzen" className="py-32 bg-[#edece8]">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[#E87722] uppercase tracking-widest mb-4">Pricing</p>
            <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(40px,5vw,72px)] text-black mb-4">
              Begin vandaag. Het kost je niets.
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto font-light">Geen verrassingen. Geen verborgen kosten. Opzeggen wanneer je wil.</p>
          </div>

          {/* 3-column grid — Pro card is taller via self-stretch trick */}
          <div className="grid md:grid-cols-3 gap-5 items-center">

            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 transition-all flex flex-col">
              <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-2xl text-black mb-1">Starter</h3>
              <p className="text-gray-400 text-sm mb-7">Perfect om te beginnen</p>
              <div className="mb-7">
                <span style={{ ...SYNE, fontWeight: 800 }} className="text-5xl text-black">€0</span>
                <span className="text-gray-400 text-sm ml-1">/ maand</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-gray-500 flex-1">
                {[
                  { text: 'Profiel en sport-tags aanmaken', check: true },
                  { text: "Buddy's zoeken en matchen", check: true },
                  { text: 'Groepen joinen en aanmaken', check: true },
                  { text: 'Feed en verhalen bekijken', check: true },
                  { text: 'Met advertenties', check: false },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.check ? 'bg-[#E87722]' : 'bg-gray-100'}`}>
                      {item.check
                        ? <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <span className="text-gray-400 text-[9px] font-bold">—</span>
                      }
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-white border-2 border-black/10 text-black font-semibold py-3.5 rounded-2xl hover:bg-black hover:text-white hover:border-black transition-all">
                Start gratis
              </Link>
            </div>

            {/* Pro — featured, taller */}
            <div className="relative rounded-3xl p-8 flex flex-col -my-4 shadow-2xl" style={{ background: '#FF5000' }}>
              <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-2xl text-white mb-1">Pro</h3>
              <p className="text-white/70 text-sm mb-7">Voor de serieuze sporter</p>
              <div className="mb-7">
                <span style={{ ...SYNE, fontWeight: 800 }} className="text-5xl text-white">€6,99</span>
                <span className="text-white/70 text-sm ml-1">/ maand</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-white flex-1">
                {[
                  'Alles van Starter',
                  'Geen advertenties',
                  'Geavanceerde filters en AI matching',
                  'Onbeperkte buddy-verzoeken',
                  'Verified badge op je profiel',
                  'Strava en MyFitnessPal koppeling',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-white font-semibold py-3.5 rounded-2xl hover:bg-black hover:text-white transition-all" style={{ color: '#FF5000' }}>
                Start met Pro
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 transition-all flex flex-col">
              <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-2xl text-black mb-1">Business</h3>
              <p className="text-gray-400 text-sm mb-7">Voor clubs, trainers en creators</p>
              <div className="mb-7">
                <span style={{ ...SYNE, fontWeight: 800 }} className="text-5xl text-black">€19,99</span>
                <span className="text-gray-400 text-sm ml-1">/ maand</span>
              </div>
              <ul className="space-y-3.5 mb-8 text-sm text-gray-500 flex-1">
                {[
                  'Alles van Pro',
                  'Eigen bedrijfs- of creatorpagina',
                  'Producten en diensten verkopen',
                  'Challenges en events hosten',
                  'Analytics dashboard',
                  'Directe zichtbaarheid bij jouw doelgroep',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-[#E87722] flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-white border-2 border-black/10 text-black font-semibold py-3.5 rounded-2xl hover:bg-black hover:text-white hover:border-black transition-all">
                Start met Business
              </Link>
            </div>

          </div>

          {/* Trust line */}
          <p className="text-center text-xs text-gray-400 mt-10 font-light">
            Meer dan 2.400 sporters gingen je voor · Geen creditcard nodig voor Starter · Altijd opzegbaar
          </p>
        </div>
      </section>

      {/* ── ZAKELIJKE CTA (subtiel) ── */}
      <div className="max-w-7xl mx-auto px-8 py-6 text-center">
        <Link href="/voor-bedrijven" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Ben je een club, gym of merk? Bekijk onze zakelijke opties →
        </Link>
      </div>

      {/* ── FINAL CTA ── */}
      <section className="relative py-36 bg-[#E87722] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.02em' }}
            className="text-[clamp(52px,7vw,104px)] text-white mb-5">
            Klaar om je sportmaatje te vinden?
          </h2>
          <p className="text-white/70 text-xl mb-3 font-light">Gratis. Altijd. Voor iedereen.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-10 mb-7">
            <Link href="/register"
              className="group inline-flex items-center gap-2 bg-black text-white font-semibold px-10 py-5 rounded-2xl hover:bg-white hover:text-black transition-all duration-200 text-lg">
              Start nu gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-white/50 text-sm">Geen creditcard nodig · Direct actief · Opzeggen wanneer je wil</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            <div className="col-span-2 md:col-span-1">
              <Image src="/logo.png" alt="Buddys" height={26} width={88} className="object-contain brightness-0 invert mb-5" />
              <p className="text-sm text-gray-600 leading-relaxed font-light">Vind je perfecte sportmaatje. Gemaakt in Nederland.</p>
            </div>
            {[
              { title: 'Product', links: ['Hoe het werkt', 'AI Matching', 'Community', 'Prijzen'] },
              { title: 'Bedrijf', links: ['Over ons', 'Blog', 'Pers', 'Vacatures'] },
              { title: 'Support', links: ['Helpcentrum', 'Contact', 'Privacy', 'Voorwaarden'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-5">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-sm text-gray-600 hover:text-white transition-colors font-light">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8">
            <p className="text-sm text-gray-700 text-center">© 2025 Buddys · Gemaakt in Nederland</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-14px) rotate(0.5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50% { transform: translateY(-10px) rotate(-0.5deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -58%) scale(1.04); }
        }
        @keyframes bounce {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 5px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        html { scroll-behavior: smooth; }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
