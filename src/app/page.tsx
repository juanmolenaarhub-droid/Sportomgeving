'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Users, Zap, ChevronDown, Building2, Star } from 'lucide-react'

const FREDOKA = { fontFamily: "'Fredoka', sans-serif" }
const JAKARTA = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

const ROTATING_WORDS = ['sportmaatje', 'fietsbuddy', 'zwempartner', 'gymmaatje']

const sports = [
  { name: 'Hardlopen', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80' },
  { name: 'Fietsen', img: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&q=80' },
  { name: 'Gym', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80' },
  { name: 'Yoga', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80' },
  { name: 'Zwemmen', img: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&q=80' },
  { name: 'Voetbal', img: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&q=80' },
  { name: 'Tennis', img: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=80' },
  { name: 'Padel', img: 'https://images.unsplash.com/photo-1612534542-4d3a30e14db5?w=400&q=80' },
]

const sportTags = ['Hardlopen', 'Fietsen', 'Zwemmen', 'Gym', 'Voetbal', 'Tennis', 'Golf', 'Yoga', 'Wandelen', 'Triathlon', 'Padel', 'Basketbal', 'Boksen', 'Klimmen', 'Roeien']

const steps = [
  { num: '01', emoji: '👤', title: 'Maak je profiel', desc: 'Voeg je sporten toe, kies je niveau en geef je regio op. Klaar in 2 minuten.' },
  { num: '02', emoji: '🔍', title: 'Vind je match', desc: 'Filter op sport, niveau, leeftijd en beschikbaarheid. Geen datingsfeer — gewoon sporten.' },
  { num: '03', emoji: '⚡', title: 'Ga samen', desc: 'Stuur een verzoek, word geaccepteerd en spreek af. Zo simpel is het.' },
]

const testimonials = [
  { name: 'Daan V.', region: 'Amsterdam', sport: 'Hardlopen', quote: 'Via Buddys vond ik binnen een week een hardloopmaatje op mijn niveau. Nu trainen we 3x per week samen.' },
  { name: 'Lisa M.', region: 'Utrecht', sport: 'Fietsen', quote: 'Eindelijk iemand gevonden om mee te fietsen. We doen nu samen een sportief weekend in de Ardennen.' },
  { name: 'Marco R.', region: 'Rotterdam', sport: 'Triathlon', quote: 'Als triatleet zocht ik iemand voor de zwemtraining. Na 2 dagen had ik al 3 reacties.' },
]

const stats = [
  { value: '2.400+', label: 'Actieve sporters', emoji: '🏃‍♂️' },
  { value: '40+', label: 'Sporten', emoji: '🏅' },
  { value: '850+', label: 'Matches gemaakt', emoji: '🤝' },
  { value: '4.8/5', label: 'Beoordeling', emoji: '⭐' },
]

export default function LandingPage() {
  const [visible, setVisible] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length)
        setWordVisible(true)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={JAKARTA} className="bg-[#edece8] overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#edece8]/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Buddys" height={32} width={110} className="object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#hoe-het-werkt" className="hover:text-black transition-colors">Hoe het werkt</a>
            <a href="#sporten" className="hover:text-black transition-colors">Sporten</a>
            <a href="#community" className="hover:text-black transition-colors">Community</a>
            <a href="#bedrijven" className="hover:text-black transition-colors">Voor bedrijven</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">Inloggen</Link>
            <Link href="/register" className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#E87722] transition-colors flex items-center gap-1.5">
              Gratis starten <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-[#E87722] rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] bg-[#E87722] rounded-full opacity-5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div className="transition-all duration-1000"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)' }}>
              <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-[#E87722] rounded-full animate-pulse" />
                2.400+ sporters actief in Nederland
              </div>

              <h1 style={{ ...FREDOKA, fontWeight: 700, lineHeight: 1.05 }}
                className="text-[clamp(56px,8vw,120px)] text-black">
                Vind je<br />
                <span className="text-[#E87722]">perfecte</span><br />
                <span
                  className="inline-block transition-all duration-400"
                  style={{
                    opacity: wordVisible ? 1 : 0,
                    transform: wordVisible ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                  }}
                >
                  {ROTATING_WORDS[wordIndex]}.
                </span>
              </h1>

              <p className="text-lg text-gray-600 mt-6 max-w-md leading-relaxed">
                Buddys koppelt sporters op niveau, locatie en beschikbaarheid. Of je nu hardloopt, fietst of traint — vind iemand die écht bij jou past.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/register"
                  className="group flex items-center gap-2 bg-[#E87722] text-white font-bold px-7 py-4 rounded-2xl hover:bg-black transition-all duration-300 text-base">
                  Start gratis account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#hoe-het-werkt"
                  className="flex items-center gap-2 border-2 border-black/10 text-gray-700 font-bold px-7 py-4 rounded-2xl hover:border-black hover:text-black transition-all duration-300 text-base">
                  Hoe werkt het?
                </a>
              </div>
            </div>

            {/* Right: floating cards */}
            <div className="relative h-[480px] hidden lg:block"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(60px)', transition: 'all 1.2s ease 0.2s' }}>
              <div className="absolute top-0 right-8 w-64 bg-white rounded-3xl shadow-2xl p-5 border border-gray-100"
                style={{ animation: 'float1 6s ease-in-out infinite' }}>
                <div className="w-14 h-14 bg-[#E87722] rounded-2xl mb-3 flex items-center justify-center text-white font-bold text-xl" style={FREDOKA}>TvB</div>
                <p className="font-bold text-black" style={FREDOKA}>Tim van Berg</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />Amsterdam</p>
                <div className="flex gap-1.5 mt-3">
                  <span className="text-xs bg-black text-white font-bold px-2.5 py-1 rounded-full">🏃 Hardlopen</span>
                  <span className="text-xs bg-orange-50 text-[#E87722] font-bold px-2.5 py-1 rounded-full">Gevorderd</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5 leading-relaxed">
                  "Zoek iemand voor ochtendtraining, 3x per week 🌅"
                </div>
              </div>

              <div className="absolute bottom-16 left-0 w-60 bg-black rounded-3xl shadow-2xl p-5"
                style={{ animation: 'float2 7s ease-in-out infinite' }}>
                <div className="w-12 h-12 bg-[#E87722] rounded-2xl mb-3 flex items-center justify-center text-white font-bold text-lg" style={FREDOKA}>SJ</div>
                <p className="font-bold text-white" style={FREDOKA}>Sarah Jansen</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />Utrecht</p>
                <div className="flex gap-1.5 mt-3">
                  <span className="text-xs bg-[#E87722] text-white font-bold px-2.5 py-1 rounded-full">🚴 Fietsen</span>
                  <span className="text-xs bg-white/10 text-white font-bold px-2.5 py-1 rounded-full">Gemiddeld</span>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E87722] text-white rounded-2xl px-4 py-2.5 shadow-xl z-10"
                style={{ animation: 'float3 5s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" fill="white" />
                  <span className="font-bold text-sm" style={FREDOKA}>Match gevonden! 🎉</span>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                style={{ animation: 'float2 8s ease-in-out infinite 1s' }}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E87722]" />
                  <div>
                    <p className="font-bold text-black text-sm" style={FREDOKA}>24 leden online 🟢</p>
                    <p className="text-xs text-gray-400">in Amsterdam</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <a href="#stats" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-black transition-colors"
          style={{ animation: 'bounce 2s ease-in-out infinite' }}>
          <span className="text-xs font-semibold tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </a>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" className="relative py-14 overflow-hidden" style={{ background: '#E87722' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
        <span className="absolute text-5xl opacity-10 top-2 left-8 rotate-12 select-none">🏆</span>
        <span className="absolute text-5xl opacity-10 bottom-2 left-1/4 -rotate-6 select-none">⚡</span>
        <span className="absolute text-5xl opacity-10 top-1 right-1/4 rotate-6 select-none">🎯</span>
        <span className="absolute text-5xl opacity-10 bottom-1 right-10 -rotate-12 select-none">🔥</span>

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label}
                className="text-center bg-white/15 backdrop-blur-sm rounded-3xl py-6 px-4 border border-white/20 hover:bg-white/25 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-2">{s.emoji}</div>
                <p style={{ ...FREDOKA, fontWeight: 700 }} className="text-4xl text-white leading-none">{s.value}</p>
                <p className="text-sm text-white/80 mt-1.5 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOE HET WERKT ── */}
      <section id="hoe-het-werkt" className="py-28 bg-[#edece8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Simpel en snel</p>
            <h2 style={{ ...FREDOKA, fontWeight: 700 }} className="text-[clamp(44px,6vw,80px)] text-black leading-tight">
              In 3 stappen je<br />buddy gevonden 🚀
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.num}
                className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-[#E87722] hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 transition-all duration-300 group-hover:bg-orange-100" />
                <div className="text-5xl mb-4">{step.emoji}</div>
                <p style={{ ...FREDOKA, fontWeight: 700 }} className="text-6xl text-[#E87722]/20 leading-none mb-4">{step.num}</p>
                <h3 style={{ ...FREDOKA, fontWeight: 600 }} className="text-xl text-black mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-[#E87722] rounded-full items-center justify-center shadow-md">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-[#E87722] text-white font-bold px-8 py-4 rounded-2xl hover:bg-black transition-colors text-base">
              Direct beginnen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SPORTEN ── */}
      <section id="sporten" className="py-28 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Voor elke sporter</p>
              <h2 style={{ ...FREDOKA, fontWeight: 700 }} className="text-[clamp(44px,6vw,80px)] text-white leading-tight">
                Voor elke sport<br />een buddy 🏅
              </h2>
            </div>
            <Link href="/register" className="text-sm font-semibold text-[#E87722] hover:text-white transition-colors flex items-center gap-1">
              Alle sporten bekijken <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-gray-400 mb-10 text-base">Van hardlopen tot golf, van zwemmen tot gym — Buddys dekt meer dan 40 sporten.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {sports.map((sport) => (
              <div key={sport.name} className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer">
                <img src={sport.img} alt={sport.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[#E87722]/0 group-hover:bg-[#E87722]/20 transition-colors duration-300" />
                <p style={{ ...FREDOKA, fontWeight: 600 }} className="absolute bottom-4 left-4 text-white text-xl">{sport.name}</p>
              </div>
            ))}
          </div>
          {/* Sport tags */}
          <div className="flex flex-wrap gap-2">
            {sportTags.map(tag => (
              <span key={tag} className="bg-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/10 hover:bg-[#E87722] hover:border-[#E87722] transition-all cursor-pointer">
                {tag}
              </span>
            ))}
            <span className="bg-[#E87722]/20 text-[#E87722] text-sm font-bold px-4 py-2 rounded-full border border-[#E87722]/30">
              + nog veel meer
            </span>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="community" className="py-28 bg-[#edece8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Community</p>
            <h2 style={{ ...FREDOKA, fontWeight: 700 }} className="text-[clamp(44px,6vw,80px)] text-black leading-tight">
              Wat sporters<br />zeggen 💬
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-lg hover:border-[#E87722]/30 transition-all duration-300 flex flex-col">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[#E87722] text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1 text-[15px]">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-50">
                  <div className="w-10 h-10 bg-[#E87722] rounded-xl flex items-center justify-center text-white font-bold" style={FREDOKA}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm" style={FREDOKA}>{t.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.region} · {t.sport}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIJZEN ── */}
      <section id="prijzen" className="py-28 bg-black">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Kies je plan</p>
            <h2 style={{ ...FREDOKA, fontWeight: 700 }} className="text-[clamp(44px,6vw,80px)] text-white leading-tight">
              Simpele prijzen 💸
            </h2>
            <p className="text-gray-400 mt-4 text-lg max-w-md mx-auto">Start gratis en upgrade wanneer jij er klaar voor bent.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all">
              <div className="text-4xl mb-4">🆓</div>
              <h3 style={{ ...FREDOKA, fontWeight: 700 }} className="text-2xl text-white mb-1">Gratis</h3>
              <p className="text-gray-400 text-sm mb-6">Voor iedereen die wil beginnen</p>
              <div className="mb-6">
                <span style={{ ...FREDOKA, fontWeight: 700 }} className="text-5xl text-white">€0</span>
                <span className="text-gray-400 text-sm ml-1">/ maand</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-300">
                {['✅ Profiel aanmaken', '✅ Buddies zoeken', '✅ Berichten sturen', '✅ Groepen joinen', '📢 Met advertenties'].map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href="/register" className="block text-center border-2 border-white/20 text-white font-bold py-3 rounded-2xl hover:bg-white hover:text-black transition-all">
                Start gratis
              </Link>
            </div>

            <div className="relative bg-white rounded-3xl p-8 border-2 border-[#E87722] shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E87722] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                ⭐ Meest gekozen
              </div>
              <div className="text-4xl mb-4">👑</div>
              <h3 style={{ ...FREDOKA, fontWeight: 700 }} className="text-2xl text-black mb-1">Premium</h3>
              <p className="text-gray-400 text-sm mb-6">Voor de serieuze sporter</p>
              <div className="mb-6">
                <span style={{ ...FREDOKA, fontWeight: 700 }} className="text-5xl text-[#E87722]">€10</span>
                <span className="text-gray-400 text-sm ml-1">/ maand</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-700">
                {['✅ Alles van Gratis', '🚫 Geen advertenties', '⚡ Voorrang in zoekresultaten', '📊 Uitgebreide statistieken', '🎯 Geavanceerde filters'].map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-[#E87722] text-white font-bold py-3 rounded-2xl hover:bg-black transition-all">
                Start met Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── VOOR BEDRIJVEN ── */}
      <section id="bedrijven" className="py-28 bg-[#edece8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-[#E87722]" />
              </div>
              <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Zakelijk</p>
              <h2 style={{ ...FREDOKA, fontWeight: 700 }} className="text-[clamp(36px,4vw,64px)] text-black leading-tight mb-4">
                Ben je een club, gym of personal trainer?
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Maak een premium bedrijfsprofiel en bereik duizenden sporters in jouw regio.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { emoji: '🏢', text: 'Eigen bedrijfspagina met reviews' },
                  { emoji: '🎯', text: 'Directe ledenwerving via het platform' },
                  { emoji: '👁️', text: 'Zichtbaarheid in de juiste sport-community' },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center text-lg shrink-0">{item.emoji}</span>
                    <span className="font-semibold text-gray-700">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 bg-black text-white font-bold px-7 py-4 rounded-2xl hover:bg-[#E87722] transition-colors">
                Bekijk zakelijke opties <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-black rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  <div className="w-12 h-12 bg-[#E87722] rounded-xl flex items-center justify-center text-white font-bold text-lg" style={FREDOKA}>RC</div>
                  <div>
                    <p className="font-bold" style={FREDOKA}>RunClub Amsterdam</p>
                    <p className="text-xs text-gray-400">⭐ 4.9 · 238 leden</p>
                  </div>
                  <span className="ml-auto bg-[#E87722] text-white text-xs font-bold px-2.5 py-1 rounded-full">Premium</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"Wij bereiken wekelijks nieuwe leden via Buddys. De zakelijke pagina heeft onze zichtbaarheid enorm vergroot."</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: 'Nieuwe leden/mnd', val: '+24' }, { label: 'Profielviews', val: '1.2k' }, { label: 'Reviews', val: '87' }].map(s => (
                    <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
                      <p style={{ ...FREDOKA, fontWeight: 700 }} className="text-2xl text-[#E87722]">{s.val}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREATOR SECTIE ── */}
      <section className="py-28 bg-black overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #E87722 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2">
              <div className="w-14 h-14 bg-[#E87722] rounded-2xl flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-white" fill="white" />
              </div>
              <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Voor creators</p>
              <h2 style={{ ...FREDOKA, fontWeight: 700 }} className="text-[clamp(36px,4vw,64px)] text-white leading-tight mb-4">
                Ben jij een sport-creator? 🎥
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                Organiseer challenges, bouw een community en monetiseer je publiek — allemaal op één plek.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { emoji: '✅', text: 'Verified creator badge' },
                  { emoji: '💰', text: 'Host betaalde challenges en groepsreizen' },
                  { emoji: '🔗', text: 'Affiliate inkomsten via jouw sport-niche' },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg shrink-0">{item.emoji}</span>
                    <span className="font-semibold text-gray-300">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="inline-flex items-center gap-2 bg-[#E87722] text-white font-bold px-7 py-4 rounded-2xl hover:bg-white hover:text-black transition-colors">
                Aanmelden als creator <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:order-1 grid grid-cols-2 gap-3">
              {[
                { name: 'FitWithSara', followers: '12.4k', sport: 'Gym', emoji: '💪' },
                { name: 'RunnerDaan', followers: '8.1k', sport: 'Hardlopen', emoji: '🏃' },
                { name: 'YogaByLisa', followers: '19.2k', sport: 'Yoga', emoji: '🧘' },
                { name: 'CyclistMike', followers: '5.7k', sport: 'Fietsen', emoji: '🚴' },
              ].map(c => (
                <div key={c.name} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-[#E87722]/40 transition-all">
                  <div className="text-3xl mb-2">{c.emoji}</div>
                  <p className="font-bold text-white text-sm flex items-center gap-1.5" style={FREDOKA}>
                    {c.name}
                    <span className="text-[#E87722] text-xs">✓</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.sport}</p>
                  <p className="text-xs text-[#E87722] font-bold mt-2">{c.followers} volgers</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative bg-[#E87722] py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
        <span className="absolute text-[120px] opacity-10 -top-6 -left-6 select-none">🏆</span>
        <span className="absolute text-[120px] opacity-10 -bottom-6 -right-6 select-none">🚀</span>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 style={{ ...FREDOKA, fontWeight: 700 }} className="text-[clamp(52px,7vw,100px)] text-white leading-tight mb-4">
            Klaar om je sportmaatje<br />te vinden? 💪
          </h2>
          <p className="text-white font-bold text-xl mb-10">Gratis. Altijd. Voor iedereen.</p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/register"
              className="group inline-flex items-center gap-2 bg-black text-white font-bold px-10 py-5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 text-lg">
              Start nu gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-white/70 text-sm">Geen creditcard nodig · Direct actief · Opzeggen wanneer je wil</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Image src="/logo.png" alt="Buddys" height={28} width={90} className="object-contain brightness-0 invert mb-4" />
              <p className="text-sm text-gray-500 leading-relaxed">Vind je perfecte sportmaatje. Gemaakt in Nederland 🇳🇱</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-2.5">
                {['Hoe het werkt', 'Sporten', 'Community', 'Prijzen'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Bedrijf</p>
              <ul className="space-y-2.5">
                {['Over ons', 'Blog', 'Pers', 'Vacatures'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Support</p>
              <ul className="space-y-2.5">
                {['Helpcentrum', 'Contact', 'Privacy', 'Voorwaarden'].map(l => (
                  <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8">
            <p className="text-sm text-gray-600 text-center">© 2025 Buddys · Gemaakt in Nederland 🇳🇱</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-16px) rotate(1deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-12px) rotate(-1deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -60%) scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, 6px); }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}
