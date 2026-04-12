import { createAdminClient } from '@/lib/supabase-admin'
import AdminMeetupsClient from './_components/AdminMeetupsClient'

export const dynamic = 'force-dynamic'

export default async function AdminMeetupsPage() {
  const admin = createAdminClient()

  const [
    { data: meetups },
    { count: activeCount },
    { count: weekCount },
  ] = await Promise.all([
    admin.from('meetups')
      .select('id, creator_id, sport, title, city, is_spontaneous, date, time, expires_at, max_participants, status, visibility, created_at, latitude, longitude')
      .order('created_at', { ascending: false })
      .limit(500),
    admin.from('meetups').select('*', { count: 'exact', head: true }).in('status', ['open', 'vol']),
    admin.from('meetups').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  // Creator namen
  const creatorIds = [...new Set((meetups ?? []).map(m => m.creator_id))]
  let creatorMap: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, username')
      .in('id', creatorIds)
    creatorMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name ?? p.username ?? 'Onbekend']))
  }

  // Deelnemerstelling
  const meetupIds = (meetups ?? []).map(m => m.id)
  let acceptedMap: Record<string, number> = {}
  let interestedMap: Record<string, number> = {}
  if (meetupIds.length > 0) {
    const { data: participants } = await admin
      .from('meetup_participants')
      .select('meetup_id, status')
      .in('meetup_id', meetupIds)
    for (const p of participants ?? []) {
      if (p.status === 'geaccepteerd') acceptedMap[p.meetup_id] = (acceptedMap[p.meetup_id] ?? 0) + 1
      if (p.status === 'interesse') interestedMap[p.meetup_id] = (interestedMap[p.meetup_id] ?? 0) + 1
    }
  }

  // Populairste sport
  const sportCount: Record<string, number> = {}
  for (const m of meetups ?? []) sportCount[m.sport] = (sportCount[m.sport] ?? 0) + 1
  const topSport = Object.entries(sportCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  // Conversieratio
  const totalInterest = Object.values(interestedMap).reduce((a, b) => a + b, 0)
  const totalAccepted = Object.values(acceptedMap).reduce((a, b) => a + b, 0)
  const convRatio = totalInterest > 0 ? Math.round((totalAccepted / totalInterest) * 100) : 0

  const enriched = (meetups ?? []).map(m => ({
    ...m,
    creatorName: creatorMap[m.creator_id] ?? 'Onbekend',
    acceptedCount: acceptedMap[m.id] ?? 0,
    interestedCount: interestedMap[m.id] ?? 0,
  }))

  return (
    <AdminMeetupsClient
      meetups={enriched}
      kpis={{
        activeCount: activeCount ?? 0,
        weekCount: weekCount ?? 0,
        topSport,
        convRatio,
      }}
    />
  )
}
