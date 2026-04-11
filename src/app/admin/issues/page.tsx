import { createAdminClient } from '@/lib/supabase-admin'
import { IssuesClient } from './_components/IssuesClient'

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
    { count: openCount },
    { count: weekCount },
  ] = await Promise.all([
    admin.from('reports')
      .select('id, reporter_id, reported_user_id, conversation_id, category, description, status, admin_note, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('blocked_users')
      .select('id, blocker_id, blocked_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('reports').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
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

  // Meest gemelde categorie
  const catCounts: Record<string, number> = {}
  for (const r of reports ?? []) catCounts[r.category] = (catCounts[r.category] ?? 0) + 1
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // Gebruikers met 3+ meldingen
  const reportCounts: Record<string, number> = {}
  for (const r of reports ?? []) reportCounts[r.reported_user_id] = (reportCounts[r.reported_user_id] ?? 0) + 1
  const riskUsers = Object.values(reportCounts).filter(c => c >= 3).length

  return (
    <div className="p-6 md:p-10 max-w-7xl">
      <div className="mb-8">
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">
          Admin
        </p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">
          Meldingen
        </h1>
      </div>

      {/* KPI balk */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Open meldingen', value: openCount ?? 0, sub: 'wachten op beoordeling' },
          { label: 'Deze week', value: weekCount ?? 0, sub: 'ingediend' },
          { label: 'Meest gemeld', value: topCategory.length > 18 ? topCategory.slice(0, 16) + '…' : topCategory, sub: 'populairste categorie' },
          { label: 'Risico-accounts', value: riskUsers, sub: '3+ meldingen' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 32, color: '#E87722', lineHeight: 1 }}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
          </div>
        ))}
      </div>

      <IssuesClient reports={reportRows} blocked={blockedRows} />
    </div>
  )
}
