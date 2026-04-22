import { createAdminClient } from '@/lib/supabase-admin'
import { BarChart } from '../_components/BarChart'
import { InfoButton } from '../_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function RetentieRing({ label, pct, sub }: { label: string; pct: number; sub: string }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6 flex flex-col items-center gap-3">
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={r} fill="none" stroke="#F4F1E8" strokeWidth={10} />
        <circle
          cx={48} cy={48} r={r}
          fill="none"
          stroke="#C4F542"
          strokeWidth={10}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={48} y={52} textAnchor="middle" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, fill: '#1E2B20' }}>
          {pct}%
        </text>
      </svg>
      <div className="text-center">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

export default async function RetentiePage() {
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('created_at, last_seen_at')

  const total = profiles?.length ?? 0
  let day1 = 0, day7 = 0, day30 = 0

  const cohortMap: Record<string, { signups: number; d1: number; d7: number; d30: number }> = {}

  for (const p of profiles ?? []) {
    const created = new Date(p.created_at)
    const seen = p.last_seen_at ? new Date(p.last_seen_at) : null
    const diffDays = seen ? (seen.getTime() - created.getTime()) / 86400000 : 0

    if (diffDays >= 1) day1++
    if (diffDays >= 7) day7++
    if (diffDays >= 30) day30++

    const monday = new Date(created)
    monday.setDate(created.getDate() - ((created.getDay() + 6) % 7))
    const weekKey = monday.toISOString().split('T')[0]
    if (!cohortMap[weekKey]) cohortMap[weekKey] = { signups: 0, d1: 0, d7: 0, d30: 0 }
    cohortMap[weekKey].signups++
    if (diffDays >= 1) cohortMap[weekKey].d1++
    if (diffDays >= 7) cohortMap[weekKey].d7++
    if (diffDays >= 30) cohortMap[weekKey].d30++
  }

  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0

  const cohortEntries = Object.entries(cohortMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
  const cohortChart = cohortEntries.map(([week, c]) => ({
    label: week.slice(5),
    value: c.signups > 0 ? Math.round((c.d1 / c.signups) * 100) : 0,
  }))

  const signupsChart = cohortEntries.map(([week, c]) => ({
    label: week.slice(5),
    value: c.signups,
  }))

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#C4F542' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Retentie</h1>
        <p className="text-sm text-gray-400 mt-1">Percentage gebruikers dat terugkomt na de eerste login · {total} totaal</p>
      </div>

      {/* Retention rings */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Retentie per periode</p>
          <InfoButton
            title="Retentie — wat betekent dit?"
            body={`Retentie = het percentage users dat na de aanmelding op een later moment nog actief was.\n\nDag 1 retentie → was de user 1+ dag na aanmelding nog terug? Zo ja, telt mee.\nDag 7 retentie → 7+ dagen na aanmelding nog actief.\nDag 30 retentie → 30+ dagen na aanmelding.\n\nBerekend op basis van 'laatste actief'-datum vs aanmelddatum.\n\nGoede benchmarks:\nDag 1: 40%+\nDag 7: 20%+\nDag 30: 10%+\n\nHoe hoger, hoe beter je gebruikers vasthoudt.`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RetentieRing label="Dag 1 retentie" pct={pct(day1)} sub={`${day1} van ${total} gebruikers`} />
          <RetentieRing label="Dag 7 retentie" pct={pct(day7)} sub={`${day7} van ${total} gebruikers`} />
          <RetentieRing label="Dag 30 retentie" pct={pct(day30)} sub={`${day30} van ${total} gebruikers`} />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs text-amber-700 font-semibold">ℹ️ Berekeningswijze</p>
        <p className="text-xs text-amber-600 mt-1">Retentie wordt berekend op basis van <code>last_seen_at</code> vs <code>created_at</code> in de profiles tabel. Dag 1 = gebruiker was minimaal 1 dag na aanmelding nog actief.</p>
      </div>

      {/* Weekly cohort — d1 retention */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Dag-1 retentie per aanmeldweek</p>
          <InfoButton
            title="Dag-1 retentie per aanmeldweek"
            body={`Per week wordt getoond hoeveel procent van de nieuwe users die week ook de dag erna nog actief was.\n\nDit helpt je zien of nieuwere gebruikers beter of slechter worden vastgehouden dan oudere.\n\nStijgende trend → je verbeteringen werken.\nDalende trend → recentere users haken sneller af.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Percentage terugkerend per inschrijvingscohort · afgelopen 12 weken</p>
        {cohortChart.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-8">Nog geen data</p>
        ) : (
          <BarChart data={cohortChart} />
        )}
      </div>

      {/* Weekly signups */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Aanmeldingen per week</p>
          <InfoButton
            title="Aanmeldingen per week"
            body={`Hoeveel nieuwe accounts er elke week aangemaakt werden, afgelopen 12 weken.\n\nHandig om te zien of je groei wekelijks stabiel is of schommelt.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Nieuw geregistreerde gebruikers · afgelopen 12 weken</p>
        {signupsChart.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-8">Nog geen data</p>
        ) : (
          <BarChart data={signupsChart} />
        )}
      </div>

      {/* Cohort table */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8 flex items-center gap-2">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Cohort overzicht per week</p>
          <InfoButton
            title="Cohort overzicht per week"
            body={`Een cohort = een groep gebruikers die zich in dezelfde week aanmeldden.\n\nDe tabel toont per week:\n- Aanmeldingen → hoeveel nieuwe users die week\n- Dag 1 % → hoeveel procent was dag erna terug\n- Dag 7 % → hoeveel procent was week later terug\n- Dag 30 % → hoeveel procent was maand later terug\n\nZo zie je precies bij welke groep de retentie het beste werkt.`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                {['Week', 'Aanmeldingen', 'Dag 1 %', 'Dag 7 %', 'Dag 30 %'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortEntries.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-300 text-xs">Geen data beschikbaar</td></tr>
              ) : cohortEntries.map(([week, c], i) => (
                <tr key={week} className={i % 2 === 1 ? 'bg-[#F4F1E8]/50' : ''}>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{week}</td>
                  <td className="px-4 py-3 text-gray-700">{c.signups}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: '#C4F542', ...SYNE, fontWeight: 700 }}>
                      {c.signups > 0 ? Math.round((c.d1 / c.signups) * 100) : 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: '#C4F542', ...SYNE, fontWeight: 700 }}>
                      {c.signups > 0 ? Math.round((c.d7 / c.signups) * 100) : 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: '#C4F542', ...SYNE, fontWeight: 700 }}>
                      {c.signups > 0 ? Math.round((c.d30 / c.signups) * 100) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
