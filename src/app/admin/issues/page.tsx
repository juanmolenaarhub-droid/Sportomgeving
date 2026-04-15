import { createAdminClient } from '@/lib/supabase-admin'
import { BarChart } from '../_components/BarChart'
import { IssuesClient } from './_components/IssuesClient'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export type ReportRow = {
  id: string
  reporter_id: string
  reported_user_id: string
  reported_user_name: string
  reported_user_active: boolean
  conversation_id: string | null
  category: string
  description: string | null
  status: 'open' | 'in_review' | 'resolved' | 'dismissed'
  admin_note: string | null
  created_at: string
  resolved_at: string | null
}

export type BlockedRow = {
  id: string
  blocker_id: string
  blocked_id: string
  blocked_name: string
  created_at: string
}

export default async function IssuesPage() {
  const admin = createAdminClient()

  const [
    { data: reports },
    { data: blockedUsers },
  ] = await Promise.all([
    admin.from('reports')
      .select('id, reporter_id, reported_user_id, conversation_id, category, description, status, admin_note, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('blocked_users')
      .select('id, blocker_id, blocked_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  // Haal profielen op voor gemelde gebruikers + geblokkeerden
  const reportedIds = [...new Set((reports ?? []).map(r => r.reported_user_id))]
  const blockedIds = [...new Set((blockedUsers ?? []).map(r => r.blocked_id))]
  const allIds = [...new Set([...reportedIds, ...blockedIds])]

  let profileMap: Record<string, { full_name: string | null; username: string | null; is_active: boolean }> = {}
  if (allIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, username, is_active')
      .in('id', allIds)
    profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  }

  function getName(id: string) {
    const p = profileMap[id]
    return p?.full_name ?? p?.username ?? id.slice(0, 8)
  }

  const reportRows: ReportRow[] = (reports ?? []).map(r => ({
    ...r,
    reported_user_name: getName(r.reported_user_id),
    reported_user_active: profileMap[r.reported_user_id]?.is_active ?? true,
    status: r.status as ReportRow['status'],
  }))

  const blockedRows: BlockedRow[] = (blockedUsers ?? []).map(r => ({
    ...r,
    blocked_name: getName(r.blocked_id),
  }))

  // Categorie counts
  const catCounts: Record<string, number> = {}
  for (const r of reports ?? []) catCounts[r.category] = (catCounts[r.category] ?? 0) + 1

  // Gebruikers met 3+ meldingen
  const reportCounts: Record<string, number> = {}
  for (const r of reports ?? []) reportCounts[r.reported_user_id] = (reportCounts[r.reported_user_id] ?? 0) + 1
  const riskUsers = Object.values(reportCounts).filter(c => c >= 3).length

  // Open vs resolved/dismissed split
  const totalReports = reports?.length ?? 0
  const resolvedCount = (reports ?? []).filter(r => r.status === 'resolved' || r.status === 'dismissed').length
  const openTotal = (reports ?? []).filter(r => r.status === 'open' || r.status === 'in_review').length
  const resolvedPct = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0

  // Gemiddelde afhandelingstijd (resolved reports)
  const resolvedWithTime = (reports ?? []).filter(r => r.resolved_at && r.created_at)
  const avgResolutionMs = resolvedWithTime.length > 0
    ? resolvedWithTime.reduce((sum, r) => sum + (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()), 0) / resolvedWithTime.length
    : 0
  const avgResolutionHours = Math.round(avgResolutionMs / 3600000)
  const avgResolutionDisplay = avgResolutionHours < 48
    ? `${avgResolutionHours}u`
    : `${Math.round(avgResolutionHours / 24)}d`

  // Categorie breakdown voor chart
  const catChartData = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }))

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  for (const r of reports ?? []) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1

  // Weekly trend (afgelopen 8 weken)
  const weekMap: Record<string, number> = {}
  for (let i = 0; i < 8; i++) {
    const d = new Date(); d.setDate(d.getDate() - (7 - i) * 7)
    const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    weekMap[monday.toISOString().split('T')[0]] = 0
  }
  const eightWeeksAgo = new Date(); eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
  for (const r of reports ?? []) {
    const created = new Date(r.created_at)
    if (created < eightWeeksAgo) continue
    const monday = new Date(created); monday.setDate(created.getDate() - ((created.getDay() + 6) % 7))
    const key = monday.toISOString().split('T')[0]
    if (key in weekMap) weekMap[key]++
  }
  const weekChart = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, value]) => ({ label: week.slice(5), value }))

  return (
    <div className="p-6 md:p-10 max-w-7xl space-y-8">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">
          Admin
        </p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">
          Meldingen
        </h1>
        <p className="text-sm text-gray-400 mt-1">Rapportages, categorieën en afhandelingstijden · {totalReports} totaal</p>
      </div>

      {/* KPI balk */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open meldingen', value: openTotal, sub: 'wachten op beoordeling' },
          { label: 'Afgehandeld', value: resolvedCount, sub: 'opgelost of afgewezen' },
          { label: 'Gem. afhandeltijd', value: resolvedWithTime.length > 0 ? avgResolutionDisplay : '—', sub: resolvedWithTime.length > 0 ? `${resolvedWithTime.length} afgehandeld` : 'nog geen data', highlight: true },
          { label: 'Risico-accounts', value: riskUsers, sub: '3+ meldingen' },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 32, color: (highlight as boolean | undefined) ? '#E87722' : '#111', lineHeight: 1 }}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Open vs afgehandeld visualisatie */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black mb-1">Open vs afgehandeld</p>
        <p className="text-xs text-gray-400 mb-6">Opgelost + afgewezen (oranje) vs open + in behandeling (grijs)</p>
        <div className="flex h-8 rounded-xl overflow-hidden">
          <div
            className="bg-[#E87722] flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ width: `${resolvedPct}%` }}
          >
            {resolvedPct >= 15 ? `${resolvedPct}%` : ''}
          </div>
          <div className="bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold flex-1">
            {resolvedPct < 85 ? `${100 - resolvedPct}%` : ''}
          </div>
        </div>
        <div className="flex gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E87722]" />
            <span className="text-xs text-gray-500">Afgehandeld ({resolvedCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-xs text-gray-500">Open / in behandeling ({openTotal})</span>
          </div>
        </div>
      </div>

      {/* Categorie breakdown + weektrend */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black mb-1">Meldingen per categorie</p>
          <p className="text-xs text-gray-400 mb-5">Verdeling over alle rapportage-types</p>
          {catChartData.length === 0
            ? <p className="text-sm text-gray-300 text-center py-8">Geen categoriedata</p>
            : <BarChart data={catChartData} />
          }
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black mb-1">Meldingen per week</p>
          <p className="text-xs text-gray-400 mb-5">Afgelopen 8 weken</p>
          {weekChart.every(d => d.value === 0)
            ? <p className="text-sm text-gray-300 text-center py-8">Geen data beschikbaar</p>
            : <BarChart data={weekChart} color="#EF4444" />
          }
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black mb-6">Status verdeling</p>
        {Object.keys(statusCounts).length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-4">Geen statusdata</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const pct = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0
              const color = status === 'open' ? '#EF4444' : status === 'in_review' ? '#F59E0B' : status === 'resolved' ? '#10B981' : '#9CA3AF'
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                    <span style={{ ...SYNE, fontWeight: 700, color }}>
                      {count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Categorie detail tabel */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Categorie detail</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                {['Categorie', 'Totaal', '% van alle meldingen', 'Open', 'Afgehandeld'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catChartData.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-300 text-xs">Geen meldingen gevonden</td></tr>
              ) : catChartData.map(({ label: cat, value: count }, i) => {
                const catReports = (reports ?? []).filter(r => r.category === cat)
                const catOpen = catReports.filter(r => r.status === 'open' || r.status === 'in_review').length
                const catResolved = catReports.filter(r => r.status === 'resolved' || r.status === 'dismissed').length
                const pct = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0
                return (
                  <tr key={cat} className={i % 2 === 1 ? 'bg-[#F5F0E8]/50' : ''}>
                    <td className="px-4 py-3 font-semibold text-gray-900 capitalize">{cat}</td>
                    <td className="px-4 py-3">
                      <span style={{ ...SYNE, fontWeight: 700, color: '#E87722' }}>{count}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pct}%</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-red-500">{catOpen}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-green-500">{catResolved}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <IssuesClient reports={reportRows} blocked={blockedRows} />
    </div>
  )
}
