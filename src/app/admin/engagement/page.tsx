import { createAdminClient } from '@/lib/supabase-admin'
import { InfoButton } from '../_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function BigStat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
      <p style={{ ...SYNE, fontWeight: 800, fontSize: 36, color: color ?? '#C4F542', lineHeight: 1 }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
    </div>
  )
}

export default async function EngagementPage() {
  const supabase = createAdminClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7)
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30)

  const { data: dauRaw } = await supabase
    .from('activity_log')
    .select('user_id')
    .gte('created_at', today)
  const dau = new Set(dauRaw?.map(r => r.user_id) ?? []).size

  const { data: wauRaw } = await supabase
    .from('activity_log')
    .select('user_id')
    .gte('created_at', sevenDaysAgo.toISOString())
  const wau = new Set(wauRaw?.map(r => r.user_id) ?? []).size

  const { data: mauRaw } = await supabase
    .from('activity_log')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo.toISOString())
  const mau = new Set(mauRaw?.map(r => r.user_id) ?? []).size

  const stickiness = mau > 0 ? Math.round(dau / mau * 100) : 0

  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
  const { count: totalAcceptedMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
  const avgMsgPerMatch = totalAcceptedMatches && totalAcceptedMatches > 0 && totalMessages
    ? Math.round(totalMessages / totalAcceptedMatches * 10) / 10
    : 0

  const { count: postsToday } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today)
  const { count: postsYesterday } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday.toISOString().split('T')[0])
    .lt('created_at', today)

  const { data: todayActivity } = await supabase
    .from('activity_log')
    .select('user_id, event_type, created_at')
    .gte('created_at', today)
    .order('created_at', { ascending: false })

  const seenUsers = new Set<string>()
  const sessionList: { userId: string; eventType: string; time: string }[] = []
  todayActivity?.forEach(e => {
    if (!seenUsers.has(e.user_id)) {
      seenUsers.add(e.user_id)
      sessionList.push({
        userId: e.user_id,
        eventType: e.event_type,
        time: new Date(e.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      })
    }
  })

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div className="mb-2">
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#C4F542' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Engagement</h1>
      </div>

      {/* DAU / WAU / MAU */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Actieve gebruikers</p>
          <InfoButton
            title="DAU / WAU / MAU — actieve gebruikers"
            body={`DAU (Daily Active Users) → hoeveel verschillende mensen er vandaag iets gedaan hebben.\n\nWAU (Weekly Active Users) → afgelopen 7 dagen.\n\nMAU (Monthly Active Users) → afgelopen 30 dagen.\n\nStickiness → DAU gedeeld door MAU als percentage. Dit laat zien hoe "verslavend" de app is. 20%+ is gezond: van alle maandelijkse gebruikers komt dagelijks 1 op de 5 terug. Hoe hoger, hoe beter.`}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BigStat label="DAU" value={dau} sub="Unieke actieve users vandaag" />
          <BigStat label="WAU" value={wau} sub="Afgelopen 7 dagen" color="#1E2B20" />
          <BigStat label="MAU" value={mau} sub="Afgelopen 30 dagen" color="#1E2B20" />
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Stickiness</p>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 36, lineHeight: 1, color: stickiness >= 20 ? '#22c55e' : '#C4F542' }}>
              {stickiness}%
            </p>
            <p className="text-xs text-gray-400 mt-2">DAU/MAU ratio · {stickiness >= 20 ? '✓ Gezond' : 'Onder 20% streefwaarde'}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gem. berichten / match</p>
            <InfoButton
              title="Gemiddeld berichten per match"
              body={`Hoeveel berichten twee gebuddyde users gemiddeld met elkaar sturen.\n\nHoge waarde = mensen voeren echt gesprekken na het matchen. Dat is goed.\nLage waarde = mensen matchen maar praten nauwelijks met elkaar.\n\nBerekening: totaal berichten gedeeld door totaal actieve matches.`}
            />
          </div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 36, color: '#C4F542', lineHeight: 1 }}>{avgMsgPerMatch}</p>
          <p className="text-xs text-gray-400 mt-2">Per geaccepteerde match</p>
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Posts vandaag</p>
            <InfoButton
              title="Posts vandaag vs gisteren"
              body={`Hoeveel nieuwe posts er vandaag aangemaakt zijn.\n\nGisteren staat er ook bij zodat je direct kan vergelijken.\nGroen pijltje omhoog → meer dan gisteren.\nRood pijltje omlaag → minder dan gisteren.`}
            />
          </div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 36, color: '#C4F542', lineHeight: 1 }}>{postsToday ?? 0}</p>
          <p className="text-xs text-gray-400 mt-2">
            Gisteren: {postsYesterday ?? 0}
            {(postsToday ?? 0) > (postsYesterday ?? 0)
              ? <span className="text-green-500 ml-1">↑</span>
              : (postsToday ?? 0) < (postsYesterday ?? 0)
              ? <span className="text-red-400 ml-1">↓</span>
              : null}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Actief vandaag</p>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 36, color: '#C4F542', lineHeight: 1 }}>{sessionList.length}</p>
          <p className="text-xs text-gray-400 mt-2">unieke users met activiteit</p>
        </div>
      </div>

      {/* Sessie activiteit vandaag */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8 flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Sessie activiteit vandaag</p>
              <InfoButton
                title="Sessie activiteit vandaag"
                body={`Per user wordt de laatste actie van vandaag getoond.\n\nZo zie je wie er vandaag actief is geweest en wat ze als laatste deden.\n\nDe user ID is afgekort — ga naar Gebruikers om iemand op te zoeken.`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Laatste actie per user</p>
          </div>
        </div>
        {sessionList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-300 text-sm">Nog geen activiteit vandaag.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {sessionList.slice(0, 30).map((s, i) => (
              <div key={s.userId} className={`px-6 py-3.5 flex items-center justify-between ${i % 2 === 1 ? 'bg-[#F4F1E8]/40' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-[#1E2B20] rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{s.userId.slice(0, 16)}…</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{s.eventType}</span>
                </div>
                <span className="text-xs text-gray-400">{s.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
