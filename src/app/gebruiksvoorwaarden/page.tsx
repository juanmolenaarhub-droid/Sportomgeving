import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export default function GebruiksvoorwaardenPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/instellingen/over" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Terug
        </Link>

        <div className="bg-white rounded-3xl border border-black/8 p-8 space-y-8">
          <div>
            <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 28, color: '#111' }}>Gebruiksvoorwaarden</h1>
            <p className="text-sm text-gray-400 mt-1">Laatst bijgewerkt: april 2026</p>
          </div>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Gebruik van de app</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Buddys is een platform om sporters met elkaar te verbinden. Je mag de app alleen gebruiken voor legale en sportgerelateerde doeleinden. Het is niet toegestaan om andere gebruikers te lastigvallen, spam te versturen of de app te misbruiken.
            </p>
          </section>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Account</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Je bent verantwoordelijk voor de veiligheid van jouw account. Gebruik een sterk wachtwoord en deel je inloggegevens nooit met anderen. Bij misbruik behoudt Buddys zich het recht voor om accounts te blokkeren of verwijderen.
            </p>
          </section>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Inhoud</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Je bent zelf verantwoordelijk voor de inhoud die je plaatst. Geen ongepaste, beledigende of illegale content. Buddys mag content verwijderen die in strijd is met deze voorwaarden.
            </p>
          </section>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Aansprakelijkheid</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Buddys is niet aansprakelijk voor ontmoetingen of activiteiten die via het platform worden georganiseerd. Gebruik je gezond verstand en zorg voor je eigen veiligheid.
            </p>
          </section>

          <section className="space-y-3">
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Contact</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Vragen over deze voorwaarden?{' '}
              <a href="mailto:hallo@buddys.nl" className="text-[#E87722] font-semibold hover:underline">hallo@buddys.nl</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
