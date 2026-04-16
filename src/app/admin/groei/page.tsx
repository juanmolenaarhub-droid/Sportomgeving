import { createAdminClient } from '@/lib/supabase-admin'
import { BarChart } from '../_components/BarChart'
import { InfoButton } from '../_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function Table({ headers, rows, striped = true }: { headers: string[]; rows: (string | number)[][]; striped?: boolean }) {
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
            <tr key={i} className={striped && i % 2 === 1 ? 'bg-[#F5F0E8]/50' : ''}>
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

export default async function GroeiPage() {
  const supabase = createAdminClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const { data: registrations } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const regByDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    const key = d.toISOString().split('T')[0]
    regByDay[key] = 0
  }
  registrations?.forEach(r => {
    const key = r.created_at.split('T')[0]
    if (regByDay[key] !== undefined) regByDay[key]++
  })
  const chartData = Object.entries(regByDay).map(([date, value]) => ({
    label: date.slice(5),
    value,
  }))

  const { data: profiles } = await supabase
    .from('profiles')
    .select('sport, level, city, onboarding_progress')

  const sportCount: Record<string, number> = {}
  const levelCount: Record<string, number> = {}
  const cityCount: Record<string, number> = {}
  const funnelCount: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, 'complete': 0 }

  profiles?.forEach(p => {
    if (p.sport) sportCount[p.sport] = (sportCount[p.sport] ?? 0) + 1
    if (p.level) levelCount[p.level] = (levelCount[p.level] ?? 0) + 1
    if (p.city) cityCount[p.city] = (cityCount[p.city] ?? 0) + 1
    const prog = String(p.onboarding_progress ?? 0)
    funnelCount[prog] = (funnelCount[prog] ?? 0) + 1
  })

  const total = profiles?.length ?? 0

  const sportRows = Object.entries(sportCount)
    .sort((a, b) => b[1] - a[1])
    .map(([sport, count]) => [sport, count, `${total ? Math.round(count / total * 100) : 0}%`])

  const levelRows = Object.entries(levelCount)
    .sort((a, b) => b[1] - a[1])
    .map(([level, count]) => [level, count, `${total ? Math.round(count / total * 100) : 0}%`])

  const cityRows = Object.entries(cityCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([city, count]) => [city, count, `${total ? Math.round(count / total * 100) : 0}%`])

  const funnelSteps = [
    { label: 'Stap 1 bereikt', key: '1' },
    { label: 'Stap 2 bereikt', key: '2' },
    { label: 'Stap 3 bereikt', key: '3' },
    { label: 'Dashboard bereikt', key: 'complete' },
  ]

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div className="mb-2">
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Groei</h1>
      </div>

      {/* Registraties grafiek */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Registraties per dag</p>
          <InfoButton
            title="Registraties per dag"
            body={`Hoeveel nieuwe accounts er elke dag aangemaakt worden, afgelopen 30 dagen.\n\nStijgende lijn → de app groeit, meer mensen melden zich aan.\nDalende lijn → minder aanmeldingen, misschien marketing opstarten.\nFlat lijn → stabiel maar geen groei.\n\nTotaal in de ondertitel = het totaal aantal nieuwe users in deze periode.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Afgelopen 30 dagen · {registrations?.length ?? 0} totaal</p>
        <BarChart data={chartData} />
      </div>

      {/* Onboarding funnel */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Onboarding funnel</p>
          <InfoButton
            title="Onboarding funnel"
            body={`Hoeveel procent van alle aangemelde users ook daadwerkelijk door de onboarding heen gegaan is.\n\nStap 1 → eerste onboarding stap bereikt (bijv. naam invullen).\nStap 2 → tweede stap bereikt (bijv. sport kiezen).\nStap 3 → derde stap bereikt.\nDashboard bereikt → volledig klaar, ze zijn actieve user.\n\nAls er veel uitval is tussen stap 1 en 2, zit daar een probleem. Grote balk = goed, kleine balk = veel mensen haken daar af.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Op basis van onboarding_progress kolom in profiles</p>
        <div className="space-y-3">
          {funnelSteps.map(step => {
            const count = funnelCount[step.key] ?? 0
            const pct = total ? Math.round(count / total * 100) : 0
            return (
              <div key={step.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{step.label}</span>
                  <span style={{ ...SYNE, fontWeight: 700, color: '#E87722' }}>{count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E87722] rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sport verdeling */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8 flex items-center gap-2">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Sport verdeling</p>
            <InfoButton
              title="Sport verdeling"
              body={`Welke sporten het meest voorkomen bij jouw users, van hoog naar laag gesorteerd.\n\n# = aantal users met dit sport.\n% = percentage van alle users.\n\nHandig om te zien waar je het sterkst in bent en waar je nog kunt groeien.`}
            />
          </div>
          <Table headers={['Sport', '#', '%']} rows={sportRows} />
        </div>

        {/* Niveau verdeling */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8 flex items-center gap-2">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Niveau verdeling</p>
            <InfoButton
              title="Niveau verdeling"
              body={`Hoe de niveaus verdeeld zijn onder jouw users.\n\nBeginner, gemiddeld of gevorderd — dit vertelt je wat voor publiek je hebt.\n\nAls 80% beginner is, is dat heel andere content/marketing dan als iedereen gevorderd is.`}
            />
          </div>
          <Table headers={['Niveau', '#', '%']} rows={levelRows} />
        </div>

        {/* Stad verdeling */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8 flex items-center gap-2">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Top 10 steden</p>
            <InfoButton
              title="Top 10 steden"
              body={`De 10 steden met de meeste gebruikers.\n\nHandig voor:\n- Weten waar je platform het meest populair is\n- Beslissen waar je extra marketing doet\n- Zien of je een lokale hit bent of landelijk verspreid`}
            />
          </div>
          <Table headers={['Stad', '#', '%']} rows={cityRows} />
        </div>
      </div>
    </div>
  )
}
