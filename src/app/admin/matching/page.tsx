import { createAdminClient } from '@/lib/supabase-admin'
import { BarChart } from '../_components/BarChart'
import { InfoButton } from '../_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <p style={{ ...SYNE, fontWeight: 800, fontSize: 36, color: color ?? '#C4F542', lineHeight: 1 }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
    </div>
  )
}

export default async function MatchingPage() {
  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const { data: matches } = await supabase
    .from('matches')
    .select('id, status, sport, requested_at, accepted_at, from_user_id, to_user_id')

  const total = matches?.length ?? 0
  const accepted = matches?.filter(m => m.status === 'accepted').length ?? 0
  const declined = matches?.filter(m => m.status === 'declined' || m.status === 'rejected').length ?? 0
  const pending = matches?.filter(m => m.status === 'pending').length ?? 0
  const acceptRatio = total > 0 ? Math.round(accepted / total * 100) : 0

  const withTimes = matches?.filter(m => m.accepted_at && m.requested_at) ?? []
  const avgWait = withTimes.length > 0
    ? Math.round(
        withTimes.reduce((sum, m) => {
          const diff = new Date(m.accepted_at).getTime() - new Date(m.requested_at).getTime()
          return sum + diff / (1000 * 60 * 60)
        }, 0) / withTimes.length
      )
    : null

  const sportStats: Record<string, { total: number; accepted: number; waitHours: number[] }> = {}
  matches?.forEach(m => {
    const sport = m.sport ?? 'Onbekend'
    if (!sportStats[sport]) sportStats[sport] = { total: 0, accepted: 0, waitHours: [] }
    sportStats[sport].total++
    if (m.status === 'accepted') {
      sportStats[sport].accepted++
      if (m.accepted_at && m.requested_at) {
        const h = (new Date(m.accepted_at).getTime() - new Date(m.requested_at).getTime()) / (1000 * 60 * 60)
        sportStats[sport].waitHours.push(h)
      }
    }
  })
  const sportRows = Object.entries(sportStats)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([sport, s]) => [
      sport,
      s.total,
      `${s.total > 0 ? Math.round(s.accepted / s.total * 100) : 0}%`,
      s.waitHours.length > 0 ? `${Math.round(s.waitHours.reduce((a, b) => a + b, 0) / s.waitHours.length)}u` : '—',
    ])

  const userMatchCount: Record<string, number> = {}
  matches?.filter(m => m.status === 'accepted').forEach(m => {
    if (m.from_user_id) userMatchCount[m.from_user_id] = (userMatchCount[m.from_user_id] ?? 0) + 1
    if (m.to_user_id) userMatchCount[m.to_user_id] = (userMatchCount[m.to_user_id] ?? 0) + 1
  })
  const topMatchers = Object.entries(userMatchCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([uid, count]) => [uid.slice(0, 12) + '…', count])

  const { data: recentMatches } = await supabase
    .from('matches')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const matchByDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    matchByDay[d.toISOString().split('T')[0]] = 0
  }
  recentMatches?.forEach(m => {
    const key = m.created_at?.split('T')[0]
    if (key && matchByDay[key] !== undefined) matchByDay[key]++
  })
  const matchChartData = Object.entries(matchByDay).map(([date, value]) => ({ label: date.slice(5), value }))

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div className="mb-2">
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#C4F542' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Matching</h1>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Buddy-aanvragen overzicht</p>
          <InfoButton
            title="Buddy-aanvragen overzicht"
            body={`Totaal verzoeken → alle buddy-aanvragen die ooit verstuurd zijn.\n\nGeaccepteerd → de andere persoon heeft 'ja' gezegd. Dit zijn echte buddy-koppels.\n\nGeweigerd → de andere persoon heeft 'nee' gezegd of genegeerd.\n\nPending → aanvraag is verstuurd maar nog niet beantwoord.`}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Totaal verzoeken" value={total} />
          <StatCard label="Geaccepteerd" value={accepted} color="#22c55e" />
          <StatCard label="Geweigerd" value={declined} color="#ef4444" />
          <StatCard label="Pending" value={pending} color="#f59e0b" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Accept ratio</p>
            <InfoButton
              title="Accept ratio"
              body={`Van alle verstuurde buddy-aanvragen: hoeveel procent wordt geaccepteerd?\n\n50%+ is gezond → de helft van alle aanvragen leidt tot een echte buddy.\nOnder 50% → mensen sturen aanvragen maar worden vaak afgewezen. Misschien zijn de profielen te vaag of te weinig overeenkomst.`}
            />
          </div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 48, lineHeight: 1, color: acceptRatio >= 50 ? '#22c55e' : '#C4F542' }}>
            {acceptRatio}%
          </p>
          <p className="text-xs text-gray-400 mt-2">{acceptRatio >= 50 ? '✓ Gezond' : '⚠ Lager dan gemiddeld'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gem. wachttijd</p>
            <InfoButton
              title="Gemiddelde wachttijd"
              body={`Hoeveel uur het gemiddeld duurt voordat iemand een buddy-aanvraag beantwoordt.\n\nKort (< 24u) → mensen reageren snel, goede betrokkenheid.\nLang (> 48u) → aanvragen blijven hangen. Misschien push notificaties verbeteren.`}
            />
          </div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 48, lineHeight: 1, color: '#C4F542' }}>
            {avgWait !== null ? `${avgWait}u` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-2">van verzoek tot acceptatie</p>
        </div>
      </div>

      {/* Grafiek */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Matches per dag</p>
          <InfoButton
            title="Matches per dag"
            body={`Hoeveel nieuwe buddy-aanvragen er elke dag aangemaakt worden, afgelopen 30 dagen.\n\nDit zijn alle aanvragen (pending + accepted + declined), niet alleen geaccepteerde.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Afgelopen 30 dagen</p>
        <BarChart data={matchChartData} color="#1E2B20" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Per sport */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8 flex items-center gap-2">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Per sport</p>
            <InfoButton
              title="Matching per sport"
              body={`Verzoeken → totaal aanvragen voor dit sport.\nRatio → percentage dat geaccepteerd werd.\nGem. wacht → hoe lang het duurt voordat iemand reageert.\n\nZo zie je welke sporten het makkelijkst matchen en welke het langst duren.`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8">
                  {['Sport', 'Verzoeken', 'Ratio', 'Gem. wacht'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sportRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-300 text-xs">Geen data</td></tr>
                ) : sportRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-[#F4F1E8]/50' : ''}>
                    {row.map((cell, j) => <td key={j} className="px-4 py-3 text-gray-700">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top matchers */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-black/8 flex items-center gap-2">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Top 10 matchers</p>
            <InfoButton
              title="Top 10 matchers"
              body={`De 10 users met de meeste geaccepteerde buddy-matches.\n\nDit zijn je meest actieve community-leden — mensen die veel buddies hebben gevonden. Handig om te weten wie de kern van je community vormt.`}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8">
                  {['#', 'User ID', 'Matches'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topMatchers.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-300 text-xs">Geen data</td></tr>
                ) : topMatchers.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-[#F4F1E8]/50' : ''}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    {row.map((cell, j) => <td key={j} className="px-4 py-3 text-gray-700 font-mono text-xs">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
