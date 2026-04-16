import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export default function PrivacybeleidPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/instellingen/over" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Terug
        </Link>

        <div className="bg-white rounded-3xl border border-black/8 p-8 space-y-8">
          <div>
            <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 28, color: '#111' }}>Privacybeleid</h1>
            <p className="text-sm text-gray-400 mt-1">Laatst bijgewerkt: april 2026</p>
          </div>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Welke gegevens verzamelen we?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Buddys verzamelt alleen de gegevens die nodig zijn om de app te laten werken: naam, e-mailadres, profielfoto, regio en sportvoorkeuren. We delen jouw gegevens nooit met derden voor commerciële doeleinden.
            </p>
          </section>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Hoe gebruiken we jouw gegevens?</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Jouw gegevens worden gebruikt om je profiel weer te geven aan andere gebruikers, buddy-matches te maken op basis van sport en regio, en om berichten en meetups mogelijk te maken.
            </p>
          </section>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Jouw rechten</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Je hebt altijd het recht om jouw gegevens in te zien, te wijzigen of te verwijderen. Dit kan via Instellingen → Account → Account verwijderen, of door contact op te nemen via{' '}
              <a href="mailto:hallo@buddys.nl" className="text-[#E87722] font-semibold hover:underline">hallo@buddys.nl</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Contact</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Vragen over dit privacybeleid? Stuur een e-mail naar{' '}
              <a href="mailto:hallo@buddys.nl" className="text-[#E87722] font-semibold hover:underline">hallo@buddys.nl</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
