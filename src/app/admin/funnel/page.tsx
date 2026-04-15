import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type FunnelStep = {
  label: string
  description: string
  count: number
  pct: number       // pct vs previous step
  pctTotal: number  // pct vs top step
  dropoff: number   // drop-off pct vs previous
  color: string
}

function FunnelBar({ step, isFirst }: { step: FunnelStep; isFirst: boolean }) {
  const barWidth = Math.max(step.pctTotal, 8)
  return (
    <div className="relative">
      {!isFirst && (
        <div className="flex items-center gap-3 py-2 pl-4">
          <div className="w-px h-6 bg-gray-200 ml-2" />
          <span className="text-xs text-red-400 font-semibold">↓ {step.dropoff}% uitgevallen</span>
        </div>
      )}
      <div className="flex items-center gap-4">
        {/* Bar */}
        <div
          className="rounded-xl flex items-center px-4 py-4 transition-all"
          style={{
            width: `${barWidth}%`,
            minWidth: 120,
            background: step.color,
          }}
        >
          <div>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 22, color: 'white', lineHeight: 1 }}>
              {step.count.toLocaleString('nl-NL')}
            </p>
            <p className="text-white/70 text-xs mt-0.5 font-medium">{step.label}</p>
          </div>
        </div>
        {/* Meta */}
        <div className="shrink-0">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14, color: '#111' }}>
            {step.pctTotal}%
          </p>
          <p className="text-xs text-gray-400">{step.description}</p>
        </div>
      </div>
    </div>
  )
}

export default async function FunnelPage() {
  const admin = createAdminClient()

  const [
    { count: totalRegistrations },
    { data: profiles },
    { data: meetupCreators },
    { data: meetupParticipants },
    { data: buddyMatches },
  ] = await Promise.all([
    // 1. Alle registraties
    admin.from('profiles').select('*', { count: 'exact', head: true }),

    // 2. Profielen met sportdata (= profiel ingevuld)
    admin.from('profiles').select('id, sport, avatar_url, region'),

    // 3. Meetup aanmakers (uniek)
    admin.from('meetups').select('created_by').limit(10000),

    // 4. Meetup deelnemers (via group_members, als proxy)
    admin.from('group_members').select('user_id').limit(10000),

    // 5. Buddy-matches (accepted)
    admin.from('follow_requests').select('from_user_id, to_user_id').eq('status', 'accepted').limit(10000),
  ])

  const step1 = totalRegistrations ?? 0

  // Profiel "compleet" = heeft sport ingevuld
  const step2 = (profiles ?? []).filter(p => p.sport).length

  // Profiel compleet met foto + regio
  const step2full = (profiles ?? []).filter(p => p.sport && p.avatar_url && p.region).length

  // Eerste meetup aangemaakt of deelgenomen
  const creatorIds = new Set((meetupCreators ?? []).map(m => m.created_by))
  const participantIds = new Set((meetupParticipants ?? []).map(m => m.user_id))
  const step3 = new Set([...creatorIds, ...participantIds]).size

  // Eerste buddy gematcht
  const matchedIds = new Set<string>()
  for (const m of buddyMatches ?? []) {
    matchedIds.add(m.from_user_id)
    matchedIds.add(m.to_user_id)
  }
  const step4 = matchedIds.size

  function pct(n: number, base: number) {
    return base > 0 ? Math.round((n / base) * 100) : 0
  }

  const steps: FunnelStep[] = [
    {
      label: 'Registraties',
      description: 'Aangemeld op het platform',
      count: step1,
      pct: 100,
      pctTotal: 100,
      dropoff: 0,
      color: '#E87722',
    },
    {
      label: 'Sport ingevuld',
      description: 'Hebben een sport in hun profiel',
      count: step2,
      pct: pct(step2, step1),
      pctTotal: pct(step2, step1),
      dropoff: 100 - pct(step2, step1),
      color: '#F59E0B',
    },
    {
      label: 'Volledig profiel',
      description: 'Sport + foto + regio ingevuld',
      count: step2full,
      pct: pct(step2full, step2),
      pctTotal: pct(step2full, step1),
      dropoff: 100 - pct(step2full, step2),
      color: '#10B981',
    },
    {
      label: 'Eerste sessie',
      description: 'Meetup aangemaakt of deelgenomen',
      count: step3,
      pct: pct(step3, step2full),
      pctTotal: pct(step3, step1),
      dropoff: 100 - pct(step3, step2full),
      color: '#3B82F6',
    },
    {
      label: 'Eerste buddy',
      description: 'Buddy-match geaccepteerd',
      count: step4,
      pct: pct(step4, step3),
      pctTotal: pct(step4, step1),
      dropoff: 100 - pct(step4, step3),
      color: '#8B5CF6',
    },
  ]

  // Overall conversion
  const overallConversion = pct(step4, step1)

  return (
    <div className="p-6 md:p-10 max-w-5xl space-y-8">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Conversie Funnel</h1>
        <p className="text-sm text-gray-400 mt-1">Van registratie naar actief gebruiker met buddy · totale conversie: <strong>{overallConversion}%</strong></p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registraties', value: step1 },
          { label: 'Profiel compleet', value: `${pct(step2full, step1)}%` },
          { label: 'Actief in sessie', value: `${pct(step3, step1)}%` },
          { label: 'Buddy gematcht', value: `${pct(step4, step1)}%` },
        ].map(({ label, value }, i) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 32, lineHeight: 1, color: i === 0 ? '#111' : '#E87722' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Funnel visualization */}
      <div className="bg-white rounded-2xl border border-black/8 p-6 md:p-8">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black mb-2">Funnel visualisatie</p>
        <p className="text-xs text-gray-400 mb-8">Breedte van de balk = % van totale registraties</p>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <FunnelBar key={step.label} step={step} isFirst={i === 0} />
          ))}
        </div>
      </div>

      {/* Step detail table */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Stap detail</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8">
                {['Stap', 'Gebruikers', '% van totaal', '% van vorige stap', 'Uitval'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.map((step, i) => (
                <tr key={step.label} className={i % 2 === 1 ? 'bg-[#F5F0E8]/50' : ''}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: step.color }} />
                      <span className="font-semibold text-gray-900">{step.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 ml-5 mt-0.5">{step.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ ...SYNE, fontWeight: 700 }}>{step.count.toLocaleString('nl-NL')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: '#E87722', ...SYNE, fontWeight: 700 }}>{step.pctTotal}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700">{i === 0 ? '—' : `${step.pct}%`}</span>
                  </td>
                  <td className="px-4 py-3">
                    {i === 0 ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <span className={`text-xs font-bold ${step.dropoff > 50 ? 'text-red-500' : step.dropoff > 25 ? 'text-amber-500' : 'text-green-500'}`}>
                        -{step.dropoff}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Improvement tips */}
      <div className="bg-[#F5F0E8] rounded-2xl p-6">
        <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black mb-4">Verbeterpunten</p>
        <div className="space-y-2">
          {steps.slice(1).filter(s => s.dropoff > 30).map(s => (
            <div key={s.label} className="flex items-start gap-2">
              <span className="text-[#E87722] mt-0.5">⚠</span>
              <p className="text-sm text-gray-600">
                <strong>{s.label}</strong> heeft een uitval van {s.dropoff}% — overweeg verbeteringen in deze stap van de gebruikersreis.
              </p>
            </div>
          ))}
          {steps.slice(1).every(s => s.dropoff <= 30) && (
            <p className="text-sm text-gray-500">Geen grote knelpunten gevonden. Alle stappen hebben &lt; 30% uitval.</p>
          )}
        </div>
      </div>
    </div>
  )
}
