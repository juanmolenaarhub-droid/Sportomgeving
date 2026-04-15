import { createAdminClient } from '@/lib/supabase-admin'
import { BarChart } from '../_components/BarChart'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export default async function ClubsPage() {
  const admin = createAdminClient()

  const [
    { data: groups },
    { data: members },
  ] = await Promise.all([
    admin.from('groups').select('id, name, sport, region, member_count, created_by, created_at, private').order('member_count', { ascending: false }),
    admin.from('group_members').select('group_id, joined_at'),
  ])

  const total = groups?.length ?? 0
  const totalMembers = (groups ?? []).reduce((sum, g) => sum + (g.member_count ?? 0), 0)
  const avgMembers = total > 0 ? (totalMembers / total).toFixed(1) : '0'
  const privateCount = (groups ?? []).filter(g => g.private).length
  const publicCount = total - privateCount

  // Sport verdeling clubs
  const sportCount: Record<string, number> = {}
  for (const g of groups ?? []) {
    if (g.sport) sportCount[g.sport] = (sportCount[g.sport] ?? 0) + 1
  }
  const sportChart = Object.entries(sportCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }))

  // Aanmeldingen per week (afgelopen 12 weken)
  const weekMap: Record<string, number> = {}
  for (let i = 0; i < 12; i++) {
    const d = new Date(); d.setDate(d.getDate() - (11 - i) * 7)
    const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    weekMap[monday.toISOString().split('T')[0]] = 0
  }
  const twelveWeeksAgo = new Date(); twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  for (const g of groups ?? []) {
    const created = new Date(g.created_at)
    if (created < twelveWeeksAgo) continue
    const monday = new Date(created); monday.setDate(created.getDate() - ((created.getDay() + 6) % 7))
    const key = monday.toISOString().split('T')[0]
    if (key in weekMap) weekMap[key]++
  }
  const creationChart = Object.entries(weekMap).sort(([a], [b]) => a.localeCompare(b)).map(([week, value]) => ({ label: week.slice(5), value }))

  // Members per club distribution
  const sizeBuckets = { '1': 0, '2-5': 0, '6-10': 0, '11-25': 0, '25+': 0 }
  for (const g of groups ?? []) {
    const n = g.member_count ?? 0
    if (n <= 1) sizeBuckets['1']++
    else if (n <= 5) sizeBuckets['2-5']++
    else if (n <= 10) sizeBuckets['6-10']++
    else if (n <= 25) sizeBuckets['11-25']++
    else sizeBuckets['25+']++
  }
  const sizeChart = Object.entries(sizeBuckets).map(([label, value]) => ({ label, value }))

  const topClubs = (groups ?? []).slice(0, 10)

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Clubs</h1>
        <p className="text-sm text-gray-400 mt-1">Overzicht van clubpagina&apos;s en groepen · {total} clubs</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Totaal clubs', value: total, sub: 'aangemaakt' },
          { label: 'Gem. leden', value: avgMembers, sub: 'per club', highlight: true },
          { label: 'Publiek', value: publicCount, sub: 'openbare clubs' },
          { label: 'Privé', value: privateCount, sub: 'besloten clubs' },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 32, lineHeight: 1, color: highlight ? '#E87722' : '#111' }}>{value}</p>
            <p className="text-xs text-gray-400 mt-2">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black mb-1">Clubs per sport</p>
          <p className="text-xs text-gray-400 mb-5">Top 10 sportcategorieën</p>
          {sportChart.length === 0
            ? <p className="text-sm text-gray-300 text-center py-8">Geen data beschikbaar</p>
            : <BarChart data={sportChart} />
          }
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black mb-1">Clubgrootte verdeling</p>
          <p className="text-xs text-gray-400 mb-5">Aantal leden per club</p>
          <BarChart data={sizeChart} color="#111111" />
        </div>
      </div>

      {/* Creation trend */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black mb-1">Clubs aangemaakt per week</p>
        <p className="text-xs text-gray-400 mb-6">Afgelopen 12 weken</p>
        {creationChart.every(d => d.value === 0)
          ? <p className="text-sm text-gray-300 text-center py-8">Geen nieuwe clubs in deze periode</p>
          : <BarChart data={creationChart} />
        }
      </div>

      {/* Top clubs table */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Meest actieve clubs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                {['Club', 'Sport', 'Regio', 'Leden', 'Type', 'Aangemaakt'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topClubs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-300 text-xs">Geen clubs gevonden</td></tr>
              ) : topClubs.map((g, i) => (
                <tr key={g.id} className={i % 2 === 1 ? 'bg-[#F5F0E8]/50' : ''}>
                  <td className="px-4 py-3 font-semibold text-gray-900 max-w-[160px] truncate">{g.name}</td>
                  <td className="px-4 py-3 text-gray-600">{g.sport ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{g.region ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span style={{ ...SYNE, fontWeight: 700, color: '#E87722' }}>{g.member_count ?? 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${g.private ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-[#E87722]'}`}>
                      {g.private ? 'Privé' : 'Publiek'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(g.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: '2-digit' })}
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
