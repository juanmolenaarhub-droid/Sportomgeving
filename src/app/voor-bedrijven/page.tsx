import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

export default function VoorBedrijvenPage() {
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
            <Link href="/#community" className="hover:text-black transition-colors">Community</Link>
            <Link href="/voor-bedrijven" className="text-black font-semibold">Voor bedrijven</Link>
            <Link href="/voor-creators" className="hover:text-black transition-colors">Voor creators</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-black transition-colors">Inloggen</Link>
            <Link href="/register" className="bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#C4F542] transition-all duration-200 flex items-center gap-1.5">
              Gratis starten <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-7xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C4F542]/10 border border-[#C4F542]/20 rounded-full px-4 py-1.5 mb-8">
            <Building2 className="w-3.5 h-3.5 text-[#C4F542]" />
            <span className="text-xs font-semibold text-[#C4F542] uppercase tracking-widest">Voor merken & ondernemers</span>
          </div>
          <h1 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em' }}
            className="text-[clamp(48px,7vw,100px)] text-black mb-6">
            Jouw merk.<br />
            <span className="text-[#C4F542]">Duizenden sporters.</span><br />
            Één platform.
          </h1>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto leading-relaxed font-light mb-10">
            Buddys is waar sporters dagelijks komen om te connecten, te trainen en te kopen. Plaats jouw merk precies daar waar jouw doelgroep al actief is — niet ernaast, maar er middenin.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-[#1E2B20] text-white font-semibold px-8 py-4 rounded-2xl hover:bg-[#C4F542] transition-all duration-200 text-base">
              Gratis zakelijk profiel aanmaken <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-gray-400 text-sm mt-5">Geen maandelijkse kosten · Alleen commissie op verkoop · Direct live</p>
        </div>
      </section>

      {/* ── GESCHIKT VOOR ── */}
      <section className="py-14 bg-[#F4F1E8] border-b border-black/6">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-8">Geschikt voor</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Sportkleding & uitrusting',
              'Voeding & supplements',
              'Gyms & sportclubs',
              'Personal trainers',
              'Sportscholen',
              'Fysiotherapeuten',
              'Sporteventen',
              'Sportmerken',
            ].map(tag => (
              <span key={tag} className="bg-white border border-black/8 text-gray-600 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── VOORDELEN ── */}
      <section className="py-32 bg-[#F4F1E8]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-xs font-semibold text-[#C4F542] uppercase tracking-widest mb-4">Wat je krijgt</p>
              <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
                className="text-[clamp(36px,4.5vw,60px)] text-black mb-6">
                Alles wat je nodig hebt om te groeien.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed font-light mb-10">
                Eén profiel. Directe toegang tot een actieve community van sporters die al op zoek zijn naar wat jij aanbiedt.
              </p>
              <ul className="space-y-5">
                {[
                  { title: 'Eigen brandpagina', desc: 'Met producten, diensten, reviews en contactmogelijkheden.' },
                  { title: 'Zichtbaar op het juiste moment', desc: 'Jouw merk verschijnt bij sporters die actief zoeken in jouw categorie.' },
                  { title: 'Directe verkoop via het platform', desc: 'Geen externe webshop nodig — alles binnen Buddys.' },
                  { title: 'Community opbouwen', desc: 'Volgers, loyale klanten en terugkerende kopers vanuit de sport-community.' },
                  { title: 'Betaal alleen voor resultaat', desc: 'Geen vaste kosten — alleen commissie op wat je daadwerkelijk verkoopt.' },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-4">
                    <CheckCircle2 className="w-5 h-5 text-[#C4F542] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-black text-sm">{item.title}</p>
                      <p className="text-gray-500 text-sm mt-0.5 font-light">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Business card mockup */}
            <div className="bg-black rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/8">
                <div className="w-12 h-12 bg-[#C4F542] rounded-xl flex items-center justify-center text-white font-bold text-sm" style={SYNE}>RC</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-sm" style={SYNE}>RunClub Amsterdam</p>
                    <span className="text-[10px] bg-[#C4F542] text-white font-bold px-2 py-0.5 rounded-full">Pro</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">4.9 beoordeling · 238 leden</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
                &ldquo;Wij bereiken wekelijks nieuwe leden via Buddys. De zakelijke pagina heeft onze zichtbaarheid enorm vergroot.&rdquo;
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Nieuwe leden/mnd', val: '+24' },
                  { label: 'Profielviews', val: '1.2k' },
                  { label: 'Reviews', val: '87' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-4 text-center">
                    <p style={{ ...SYNE, fontWeight: 700 }} className="text-2xl text-[#C4F542]">{s.val}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link href="/register"
                className="flex items-center justify-center gap-2 w-full bg-[#C4F542] text-white font-semibold py-3.5 rounded-xl hover:bg-white hover:text-black transition-all duration-200 text-sm">
                Start jouw zakelijk profiel <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOE HET WERKT (zakelijk) ── */}
      <section className="py-24 bg-[#F4F1E8]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[#C4F542] uppercase tracking-widest mb-4">Zo simpel</p>
            <h2 style={{ ...SYNE, fontWeight: 800, lineHeight: 1.0, letterSpacing: '-0.02em' }}
              className="text-[clamp(36px,5vw,64px)] text-black">
              In 3 stappen live.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Maak je profiel aan', desc: 'Voeg je logo, beschrijving, producten en contactgegevens toe. Klaar in minder dan 10 minuten.' },
              { num: '02', title: 'Bereik jouw doelgroep', desc: 'Sporters die zoeken in jouw categorie zien jouw merk direct. Geen advertentiebudget nodig.' },
              { num: '03', title: 'Verkoop en groei', desc: 'Ontvang bestellingen, bouw reviews op en bouw een community van terugkerende klanten.' },
            ].map(step => (
              <div key={step.num} className="bg-white rounded-2xl p-8 border border-[#E8E0D5]">
                <p style={{ ...SYNE, fontWeight: 900, fontSize: '48px', lineHeight: 1, letterSpacing: '-0.04em', color: 'rgba(232,119,34,0.25)' }} className="mb-4">{step.num}</p>
                <h3 style={{ ...SYNE, fontWeight: 700 }} className="text-black text-lg mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 bg-[#1E2B20]">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 style={{ ...SYNE, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.03em' }}
            className="text-[clamp(40px,6vw,80px)] text-white mb-5">
            Klaar om te beginnen?
          </h2>
          <p className="text-white/60 text-lg mb-10 font-light">
            Gratis profiel aanmaken. Geen maandelijkse kosten. Alleen commissie op wat je verkoopt.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 bg-[#C4F542] text-white font-semibold px-10 py-5 rounded-2xl hover:bg-white hover:text-black transition-all duration-200 text-base">
            Gratis zakelijk profiel aanmaken <ArrowRight className="w-4 h-4" />
          </Link>
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
            {[
              { title: 'Product', links: ['Hoe het werkt', 'Community', 'Prijzen'] },
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
          <div className="border-t border-white/6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-700">© 2025 Buddys. Alle rechten voorbehouden.</p>
            <Link href="/" className="text-xs text-gray-600 hover:text-white transition-colors">← Terug naar de hoofdpagina</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
