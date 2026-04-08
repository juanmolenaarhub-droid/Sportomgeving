'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Users, Zap, ChevronDown } from 'lucide-react'

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

const steps = [
  { num: '01', title: 'Maak je profiel', desc: 'Vertel welke sporten je doet en op welk niveau. Voeg een foto toe en schrijf iets over jezelf.' },
  { num: '02', title: 'Vind sporters', desc: 'Zoek buddies in jouw buurt op sport, niveau en beschikbaarheid. Filter precies op wat jij zoekt.' },
  { num: '03', title: 'Train samen', desc: 'Stuur een berichtverzoek, spreek af en ga sporten. Sluit je aan bij groepen voor nog meer energie.' },
]

const testimonials = [
  { name: 'Lisa van Dam', region: 'Amsterdam', sport: 'Hardlopen', quote: 'Na twee weken had ik al een vaste trainingsmaatje gevonden. Nu lopen we elke dinsdagochtend samen.' },
  { name: 'Daan Hoekstra', region: 'Rotterdam', sport: 'Gym', quote: 'Eindelijk iemand op mijn niveau die ook vroeg wil trainen. Buddys heeft dat in één dag geregeld.' },
  { name: 'Fenna Smit', region: 'Utrecht', sport: 'Fietsen', quote: 'De groepen-functie is geweldig. Ik rijd nu elke zondag met een groep van tien mensen.' },
]

const stats = [
  { value: '2.400+', label: 'Actieve leden' },
  { value: '12', label: 'Sporten' },
  { value: '50+', label: "Regio's" },
  { value: '1.200+', label: 'Matches gemaakt' },
]

export default function LandingPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-[#edece8] overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#edece8]/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Buddys" height={32} width={110} className="object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#hoe-het-werkt" className="hover:text-black transition-colors">Hoe het werkt</a>
            <a href="#sporten" className="hover:text-black transition-colors">Sporten</a>
            <a href="#reviews" className="hover:text-black transition-colors">Reviews</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">Inloggen</Link>
            <Link href="/register" className="bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#E87722] transition-colors">
              Gratis starten
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-16 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Orange blob */}
        <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] bg-[#E87722] rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] bg-[#E87722] rounded-full opacity-5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div
              className="transition-all duration-1000"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)' }}
            >
              <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-[#E87722] rounded-full animate-pulse" />
                2.400+ sporters actief
              </div>
              <h1
                style={{ fontFamily: "'Bebas Neue', sans-serif", lineHeight: 0.9, letterSpacing: '0.02em' }}
                className="text-[clamp(72px,10vw,140px)] text-black"
              >
                VIND JE<br />
                <span className="text-[#E87722]">SPORT</span><br />
                MAATJE
              </h1>
              <p className="text-lg text-gray-600 mt-6 max-w-md leading-relaxed">
                Buddys koppelt sporters op niveau en locatie. Of je nu hardloopt, fietst of traint — vind iemand die bij jou past.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href="/register"
                  className="group flex items-center gap-2 bg-[#E87722] text-white font-bold px-7 py-4 rounded-2xl hover:bg-black transition-all duration-300 text-base"
                >
                  Gratis account aanmaken
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#hoe-het-werkt"
                  className="flex items-center gap-2 border-2 border-black/10 text-gray-700 font-bold px-7 py-4 rounded-2xl hover:border-black hover:text-black transition-all duration-300 text-base"
                >
                  Hoe werkt het?
                </a>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {['Gratis', 'Geen advertenties', 'Direct contact'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-sm text-gray-500">
                    <div className="w-4 h-4 bg-[#E87722] rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating profile cards */}
            <div
              className="relative h-[480px] hidden lg:block"
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(60px)', transition: 'all 1.2s ease 0.2s' }}
            >
              {/* Card 1 */}
              <div className="absolute top-0 right-8 w-64 bg-white rounded-3xl shadow-2xl p-5 border border-gray-100"
                style={{ animation: 'float1 6s ease-in-out infinite' }}>
                <div className="w-14 h-14 bg-[#E87722] rounded-2xl mb-3 flex items-center justify-center text-white font-black text-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>TvB</div>
                <p className="font-black text-black">Tim van Berg</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />Amsterdam</p>
                <div className="flex gap-1.5 mt-3">
                  <span className="text-xs bg-black text-white font-bold px-2.5 py-1 rounded-full">Hardlopen</span>
                  <span className="text-xs bg-orange-50 text-[#E87722] font-bold px-2.5 py-1 rounded-full">Gevorderd</span>
                </div>
                <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5 leading-relaxed">
                  "Zoek iemand voor ochtendtraining in Vondelpark, 3x per week."
                </div>
              </div>

              {/* Card 2 */}
              <div className="absolute bottom-16 left-0 w-60 bg-black rounded-3xl shadow-2xl p-5"
                style={{ animation: 'float2 7s ease-in-out infinite' }}>
                <div className="w-12 h-12 bg-[#E87722] rounded-2xl mb-3 flex items-center justify-center text-white font-black text-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SJ</div>
                <p className="font-black text-white">Sarah Jansen</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />Utrecht</p>
                <div className="flex gap-1.5 mt-3">
                  <span className="text-xs bg-[#E87722] text-white font-bold px-2.5 py-1 rounded-full">Fietsen</span>
                  <span className="text-xs bg-white/10 text-white font-bold px-2.5 py-1 rounded-full">Gemiddeld</span>
                </div>
              </div>

              {/* Match badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E87722] text-white rounded-2xl px-4 py-2.5 shadow-xl z-10"
                style={{ animation: 'float3 5s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" fill="white" />
                  <span className="font-black text-sm">Match gevonden!</span>
                </div>
              </div>

              {/* Stats bubble */}
              <div className="absolute bottom-0 right-0 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                style={{ animation: 'float2 8s ease-in-out infinite 1s' }}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E87722]" />
                  <div>
                    <p className="font-black text-black text-sm">24 leden online</p>
                    <p className="text-xs text-gray-400">in Amsterdam</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#stats" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-black transition-colors"
          style={{ animation: 'bounce 2s ease-in-out infinite' }}>
          <span className="text-xs font-semibold tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </a>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" className="bg-black py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-5xl text-[#E87722]">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1 font-medium">{s.label}</p>
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
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-[clamp(48px,6vw,88px)] text-black leading-none">
              IN 3 STAPPEN<br />AAN HET SPORTEN
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-[#E87722] hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 transition-all duration-300 group-hover:bg-orange-100" />
                <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-7xl text-[#E87722]/20 leading-none mb-6">{step.num}</p>
                <h3 className="text-xl font-black text-black mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-[#E87722] rounded-full flex items-center justify-center">
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
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Voor elke sporter</p>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-[clamp(48px,6vw,88px)] text-white leading-none">
                12 SPORTEN,<br />JOUW KEUZE
              </h2>
            </div>
            <Link href="/register" className="text-sm font-semibold text-[#E87722] hover:text-white transition-colors flex items-center gap-1">
              Alle sporten bekijken <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sports.map((sport) => (
              <div key={sport.name} className="group relative rounded-2xl overflow-hidden aspect-square cursor-pointer">
                <img src={sport.img} alt={sport.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-[#E87722]/0 group-hover:bg-[#E87722]/20 transition-colors duration-300" />
                <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="absolute bottom-4 left-4 text-white text-2xl tracking-wide">{sport.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" className="py-28 bg-[#edece8]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-bold text-[#E87722] uppercase tracking-widest mb-3">Wat leden zeggen</p>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-[clamp(48px,6vw,88px)] text-black leading-none">
              ECHTE MATCHES,<br />ECHTE VERHALEN
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#E87722]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed flex-1 mt-2 text-[15px]">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-50">
                  <div className="w-10 h-10 bg-[#E87722] rounded-xl flex items-center justify-center text-white font-black" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-black text-black text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.region} · {t.sport}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative bg-[#E87722] py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-black rounded-full opacity-10 blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black rounded-full opacity-10 blur-2xl" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-[clamp(56px,8vw,110px)] text-white leading-none mb-6">
            KLAAR OM TE<br />STARTEN?
          </h2>
          <p className="text-white/80 text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Maak vandaag nog gratis een account aan en vind je eerste sportmaatje binnen 24 uur.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register" className="group inline-flex items-center gap-2 bg-black text-white font-bold px-10 py-5 rounded-2xl hover:bg-white hover:text-black transition-all duration-300 text-lg">
              Gratis account aanmaken
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white/20 text-white font-bold px-10 py-5 rounded-2xl hover:bg-white/30 transition-all duration-300 text-lg border border-white/30">
              Al een account? Log in
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image src="/logo.png" alt="Buddys" height={28} width={90} className="object-contain brightness-0 invert" />
            <p className="text-sm text-gray-500">© 2025 Buddys. Vind je sportmaatje.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Voorwaarden</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
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
