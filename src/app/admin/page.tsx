import { createAdminClient } from '@/lib/supabase-admin'
import { InfoButton } from './_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <p style={{ ...SYNE, fontWeight: 800, fontSize: 36, color: '#C4F542', lineHeight: 1 }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
    </div>
  )
}

const EVENT_LABELS: Record<string, string> = {
  login: '🔑 Ingelogd',
  match_requested: '🤝 Match aangevraagd',
  match_accepted: '✅ Match geaccepteerd',
  message_sent: '💬 Bericht gestuurd',
  post_created: '📝 Post aangemaakt',
}

export default async function AdminOverzichtPage() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalUsers },
    { count: newToday },
    { count: activeMatches },
    { data: activityLog },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
    supabase.from('activity_log')
      .select('id, event_type, created_at, user_id, metadata')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const { data: dauData } = await supabase
    .from('activity_log')
    .select('user_id')
    .gte('created_at', today)
  const dau = new Set(dauData?.map(r => r.user_id) ?? []).size

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="mb-8">
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#C4F542' }} className="uppercase mb-2">
          Admin
        </p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">
          Overzicht
        </h1>
      </div>

      {/* KPI kaarten */}
      <div className="mb-3 flex items-center gap-2">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Kerncijfers</p>
        <InfoButton
          title="Kerncijfers — wat betekenen deze getallen?"
          body={`Totaal users → iedereen die zich ooit aangemeld heeft.\n\nNieuw vandaag → mensen die zich vandaag aangemeld hebben.\n\nActieve matches → buddy-koppels die elkaar geaccepteerd hebben (beide kanten 'ja').\n\nDAU (Daily Active Users) → hoeveel verschillende mensen er vandaag iets gedaan hebben op het platform. Dit wordt gemeten via de activity log.`}
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Totaal users" value={totalUsers ?? 0} sub="geregistreerd" />
        <KpiCard label="Nieuw vandaag" value={newToday ?? 0} sub="registraties" />
        <KpiCard label="Actieve matches" value={activeMatches ?? 0} sub="geaccepteerd" />
        <KpiCard label="DAU" value={dau} sub="unieke logins vandaag" />
      </div>

      {/* Activiteiten feed */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8 flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">
                Recente activiteit
              </h2>
              <InfoButton
                title="Recente activiteit"
                body={`De laatste 20 acties die users uitvoerden, in volgorde van nieuw naar oud.\n\nZo zie je in één oogopslag of het platform actief is en wat mensen doen.\n\nDe user ID is afgekort — klik in Gebruikers om de volledige naam te zien.`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Laatste 20 events</p>
          </div>
        </div>
        {!activityLog || activityLog.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">Geen activiteit gevonden.</p>
            <p className="text-gray-300 text-xs mt-1">Activity log wordt gevuld zodra users acties uitvoeren.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {activityLog.map((event, i) => (
              <div key={event.id} className={`px-6 py-3.5 flex items-center justify-between ${i % 2 === 0 ? 'bg-white' : 'bg-[#F4F1E8]/40'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{EVENT_LABELS[event.event_type] ?? event.event_type}</span>
                  <span className="text-xs text-gray-400 font-mono">{event.user_id?.slice(0, 8)}…</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(event.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
