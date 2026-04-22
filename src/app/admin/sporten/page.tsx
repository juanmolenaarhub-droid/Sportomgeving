import { createAdminClient } from '@/lib/supabase-admin'
import { BarChart } from '../_components/BarChart'
import { InfoButton } from '../_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/8">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-300 text-xs">Geen data</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className={i % 2 === 1 ? 'bg-[#F5F0E8]/50' : ''}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function SportenPage() {
  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: meetups },
  ] = await Promise.all([
    admin.from('profiles').select('sport, region, city, level'),
    admin.from('meetups').select('sport, location').limit(500),
  ])

  const total = profiles?.length ?? 0

  // Sport counts from profiles
  const sportCount: Record<string, number> = {}
  const regionCount: Record<string, number> = {}
  const cityCount: Record<string, number> = {}
  const levelBySport: Record<string, Record<string, number>> = {}

  for (const p of profiles ?? []) {
    if (p.sport) {
      sportCount[p.sport] = (sportCount[p.sport] ?? 0) + 1
      if (p.level) {
        if (!levelBySport[p.sport]) levelBySport[p.sport] = {}
        levelBySport[p.sport][p.level] = (levelBySport[p.sport][p.level] ?? 0) + 1
      }
    }
    if (p.region) regionCount[p.region] = (regionCount[p.region] ?? 0) + 1
    if (p.city)   cityCount[p.city]     = (cityCount[p.city] ?? 0) + 1
  }

  // Sport counts from meetups
  const meetupSportCount: Record<string, number> = {}
  for (const m of meetups ?? []) {
    if (m.sport) meetupSportCount[m.sport] = (meetupSportCount[m.sport] ?? 0) + 1
  }

  const sortedSports = Object.entries(sportCount).sort((a, b) => b[1] - a[1])
  const sortedRegions = Object.entries(regionCount).sort((a, b) => b[1] - a[1]).slice(0, 15)
  const sortedCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const sortedMeetupSports = Object.entries(meetupSportCount).sort((a, b) => b[1] - a[1])

  const sportChartData = sortedSports.slice(0, 12).map(([label, value]) => ({ label, value }))
  const regionChartData = sortedRegions.slice(0, 10).map(([label, value]) => ({ label, value }))
  const meetupChartData = sortedMeetupSports.slice(0, 12).map(([label, value]) => ({ label, value }))

  const sportRows = sortedSports.map(([sport, count]) => [
    sport,
    count,
    `${total > 0 ? Math.round((count / total) * 100) : 0}%`,
    Object.entries(levelBySport[sport] ?? {}).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} (${n})`).join(', ') || '—',
  ])

  const regionRows = sortedRegions.map(([region, count]) => [
    region, count, `${total > 0 ? Math.round((count / total) * 100) : 0}%`,
  ])

  const cityRows = sortedCities.map(([city, count]) => [
    city, count, `${total > 0 ? Math.round((count / total) * 100) : 0}%`,
  ])

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Sporten &amp; Regio&apos;s</h1>
        <p className="text-sm text-gray-400 mt-1">Sportverdeling en regionale spreiding · {total} gebruikers</p>
      </div>

      {/* KPI row */}
      <div className="flex items-center gap-2 mb-3">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Kerncijfers</p>
        <InfoButton
          title="Sporten & Regio's — kerncijfers"
          body={`Unieke sporten → hoeveel verschillende sporten er door gebruikers ingevuld zijn.\n\nPopulairste sport → het sport met de meeste users.\n\nUnieke regio's → hoeveel verschillende regio's vertegenwoordigd zijn.\n\nPopulairste regio → de regio met de meeste users.`}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unieke sporten', value: Object.keys(sportCount).length, sub: 'actief in gebruik' },
          { label: 'Populairste sport', value: sortedSports[0]?.[0] ?? '—', sub: `${sortedSports[0]?.[1] ?? 0} gebruikers` },
          { label: 'Unieke regio\'s', value: Object.keys(regionCount).length, sub: 'in profiles' },
          { label: 'Populairste regio', value: sortedRegions[0]?.[0] ?? '—', sub: `${sortedRegions[0]?.[1] ?? 0} gebruikers` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 28, color: '#E87722', lineHeight: 1 }} className="truncate">{value}</p>
            <p className="text-xs text-gray-400 mt-2">{sub}</p>
          </div>
        ))}
      </div>

      {/* Sports bar chart */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Gebruikers per sport</p>
          <InfoButton
            title="Gebruikers per sport"
            body={`Hoeveel gebruikers elk sport in hun profiel hebben staan.\n\nDe hoogte van de balk = het aantal users met dat sport.\n\nHandig om te zien waar de meeste vraag naar is bij het vinden van een buddy.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Op basis van sport in profielen</p>
        {sportChartData.length === 0
          ? <p className="text-sm text-gray-300 text-center py-8">Geen sportdata beschikbaar</p>
          : <BarChart data={sportChartData} />
        }
      </div>

      {/* Meetup sport chart */}
      {meetupChartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black mb-1">Meetups per sport</p>
          <p className="text-xs text-gray-400 mb-6">Aangemelde meetups per sportcategorie</p>
          <BarChart data={meetupChartData} color="#111111" />
        </div>
      )}

      {/* Region bar chart */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Gebruikers per regio</p>
          <InfoButton
            title="Gebruikers per regio"
            body={`Hoe je users geografisch verspreid zijn over Nederland (of andere regio's).\n\nHandig voor:\n- Beslissen waar je lokale marketing doet\n- Zien of bepaalde regio's ondervertegenwoordigd zijn\n- Potentie voor regionale events of meetups`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Top 10 regio&apos;s op basis van profielen</p>
        {regionChartData.length === 0
          ? <p className="text-sm text-gray-300 text-center py-8">Geen regiodata beschikbaar</p>
          : <BarChart data={regionChartData} color="#059669" />
        }
      </div>

      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Sporten detail</p>
          </div>
          <Table headers={['Sport', '#', '%', 'Niveaus']} rows={sportRows} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-black/8">
              <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Top 15 regio&apos;s</p>
            </div>
            <Table headers={['Regio', '#', '%']} rows={regionRows} />
          </div>

          <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-black/8">
              <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Top 10 steden</p>
            </div>
            <Table headers={['Stad', '#', '%']} rows={cityRows} />
          </div>
        </div>
      </div>
    </div>
  )
}
