'use client'

import { motion } from 'framer-motion'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type Testimonial = {
  quote: string
  name: string
  location: string
  sport: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Via Buddys vond ik binnen een week iemand met dezelfde trainingsambities. Nu lopen we drie keer per week samen.',
    name: 'Daan V.',
    location: 'Amsterdam',
    sport: 'Hardlopen',
  },
  {
    quote: 'Eindelijk iemand met hetzelfde niveau en dezelfde doelen. We doen nu samen een sportief weekend in de Ardennen.',
    name: 'Lisa M.',
    location: 'Utrecht',
    sport: 'Fietsen',
  },
  {
    quote: 'Als triatleet zocht ik iemand voor de zwemtraining. Na twee dagen had ik drie serieuze reacties.',
    name: 'Marco R.',
    location: 'Rotterdam',
    sport: 'Triathlon',
  },
  {
    quote: 'Ik trainde altijd alleen in de gym. Via Buddys heb ik nu een vaste trainingspartner gevonden op mijn niveau.',
    name: 'Kevin B.',
    location: 'Den Haag',
    sport: 'Gym',
  },
  {
    quote: 'Super makkelijk om iemand te vinden die ook aan padel wil doen. Binnen een dag mijn eerste wedstrijd gepland.',
    name: 'Sara N.',
    location: 'Eindhoven',
    sport: 'Padel',
  },
  {
    quote: 'Geweldige app voor mensen die serieus willen trainen maar niemand kennen in hun nieuwe stad.',
    name: 'Thomas K.',
    location: 'Utrecht',
    sport: 'Hardlopen',
  },
  {
    quote: 'Ik zocht een fietsmaatje voor lange ritten. Nu rijden we elke zaterdag samen 80km.',
    name: 'Joris V.',
    location: 'Haarlem',
    sport: 'Fietsen',
  },
  {
    quote: 'Via de groepsfunctie heb ik een heel hardloopclubje opgericht in mijn wijk.',
    name: 'Fatima A.',
    location: 'Amsterdam',
    sport: 'Hardlopen',
  },
  {
    quote: 'Eindelijk een platform dat niet aanvoelt als een dating-app maar gewoon om samen te sporten.',
    name: 'Niels D.',
    location: 'Rotterdam',
    sport: 'Zwemmen',
  },
]

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase()
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 w-[300px] shrink-0">
      {/* Stars */}
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-[#E87722] text-sm">★</span>
        ))}
      </div>

      {/* Quote */}
      <p className="text-neutral-300 text-sm leading-relaxed font-light flex-1">
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ ...SYNE, background: '#E87722' }}
        >
          {getInitials(t.name)}
        </div>
        <div>
          <p className="text-white font-bold text-sm" style={SYNE}>{t.name}</p>
          <p className="text-neutral-500 text-xs mt-0.5">
            {t.location} · <span className="text-orange-500">{t.sport}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function ScrollingColumn({ items, duration, reverse = false }: { items: Testimonial[]; duration: number; reverse?: boolean }) {
  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden flex flex-col"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}>
      <motion.div
        animate={{ y: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
        className="flex flex-col gap-4"
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  )
}

export function TestimonialV2() {
  const col1 = TESTIMONIALS.slice(0, 3)
  const col2 = TESTIMONIALS.slice(3, 6)
  const col3 = TESTIMONIALS.slice(6, 9)

  return (
    <section id="community" className="py-32 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
          <div>
            <p className="text-xs font-semibold text-[#E87722] uppercase tracking-widest mb-4">Community</p>
            <h2
              style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(40px,5vw,72px)] text-white"
            >
              Zij vonden hun buddy
            </h2>
          </div>
          <a href="/register" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E87722] hover:text-white transition-colors">
            Sluit je aan
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>
        </div>

        {/* Scrolling columns */}
        <div className="flex gap-4 h-[520px]">
          {/* Column 1 — always visible */}
          <div className="flex-1">
            <ScrollingColumn items={col1} duration={15} />
          </div>

          {/* Column 2 — md and up */}
          <div className="flex-1 hidden md:block">
            <ScrollingColumn items={col2} duration={19} reverse />
          </div>

          {/* Column 3 — lg and up */}
          <div className="flex-1 hidden lg:block">
            <ScrollingColumn items={col3} duration={17} />
          </div>
        </div>
      </div>
    </section>
  )
}
