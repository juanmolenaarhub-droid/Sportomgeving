import { createAdminClient } from '@/lib/supabase-admin'
import { BarChart } from '../_components/BarChart'
import { InfoButton } from '../_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export default async function SessiesPage() {
  const admin = createAdminClient()

  const { data: meetups } = await admin
    .from('meetups')
    .select('id, created_at, max_participants, current_participants, status, created_by')
    .order('created_at', { ascending: false })
    .limit(1000)

  const total = meetups?.length ?? 0

  const successful = (meetups ?? []).filter(m => {
    const curr = m.current_participants ?? m.max_participants ?? 0
    return curr >= 2
  }).length

  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

  const statusCount: Record<string, number> = {}
  for (const m of meetups ?? []) {
    const s = m.status ?? 'onbekend'
    statusCount[s] = (statusCount[s] ?? 0) + 1
  }

  const weekMap: Record<string, { total: number; success: number }> = {}
  const twelveWeeksAgo = new Date(); twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

  for (let i = 0; i < 12; i++) {
    const d = new Date(); d.setDate(d.getDate() - (11 - i) * 7)
    const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    weekMap[monday.toISOString().split('T')[0]] = { total: 0, success: 0 }
  }

  for (const m of meetups ?? []) {
    const created = new Date(m.created_at)
    if (created < twelveWeeksAgo) continue
    const monday = new Date(created); monday.setDate(created.getDate() - ((created.getDay() + 6) % 7))
    const key = monday.toISOString().split('T')[0]
    if (!weekMap[key]) weekMap[key] = { total: 0, success: 0 }
    weekMap[key].total++
    const curr = m.current_participants ?? m.max_participants ?? 0
    if (curr >= 2) weekMap[key].success++
  }

  const weekEntries = Object.entries(weekMap).sort(([a], [b]) => a.localeCompare(b))
  const totalChart = weekEntries.map(([week, v]) => ({ label: week.slice(5), value: v.total }))
  const successChart = weekEntries.map(([week, v]) => ({ label: week.slice(5), value: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0 }))

  const avgParticipants = total > 0
    ? ((meetups ?? []).reduce((sum, m) => sum + (m.current_participants ?? 0), 0) / total).toFixed(1)
    : '0'

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Sessie Succes Rate</h1>
        <p className="text-sm text-gray-400 mt-1">Welk percentage meetups heeft daadwerkelijk deelnemers gekregen · {total} totaal</p>
      </div>

      {/* KPI grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Meetup statistieken</p>
          <InfoButton
            title="Meetup statistieken — wat betekenen deze getallen?"
            body={`Totaal aangemaakt → alle meetups die ooit aangemaakt zijn.\n\nSuccesvol → meetups met 2 of meer deelnemers. Dit betekent: de organisator én minimaal 1 andere persoon deed mee. Dat is een echte sessie.\n\nSucces rate → percentage van alle meetups dat succesvol was. 70%+ is goed.\n\nGem. deelnemers → gemiddeld hoeveel mensen er per meetup meedoen.`}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Totaal aangemaakt', value: total, sub: 'meetups' },
            { label: 'Succesvol', value: successful, sub: '≥ 2 deelnemers' },
            { label: 'Succes rate', value: `${successRate}%`, sub: 'van alle meetups', highlight: true },
            { label: 'Gem. deelnemers', value: avgParticipants, sub: 'per meetup' },
          ].map(({ label, value, sub, highlight }) => (
            <div key={label} className="bg-white rounded-2xl border border-black/8 p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{label}</p>
              <p style={{ ...SYNE, fontWeight: 800, fontSize: 32, lineHeight: 1, color: highlight ? '#E87722' : '#111' }}>{value}</p>
              <p className="text-xs text-gray-400 mt-2">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Success rate visual */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Succes vs niet-succes</p>
          <InfoButton
            title="Succes vs niet-succes"
            body={`De oranje balk = meetups met 2+ deelnemers (gelukt).\nDe grijze balk = meetups die maar 0 of 1 deelnemer hadden (mislukt).\n\nHoe groter het oranje gedeelte, hoe beter.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-6">Meetups met ≥ 2 deelnemers (oranje) vs zonder voldoende deelnemers (grijs)</p>
        <div className="flex h-8 rounded-xl overflow-hidden">
          <div
            className="bg-[#E87722] flex items-center justify-center text-white text-xs font-bold transition-all"
            style={{ width: `${successRate}%` }}
          >
            {successRate >= 15 ? `${successRate}%` : ''}
          </div>
          <div className="bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold flex-1">
            {successRate < 85 ? `${100 - successRate}%` : ''}
          </div>
        </div>
        <div className="flex gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E87722]" />
            <span className="text-xs text-gray-500">Succesvol ({successful})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-xs text-gray-500">Niet succesvol ({total - successful})</span>
          </div>
        </div>
      </div>

      {/* Meetups per week */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <div className="flex items-center gap-2 mb-1">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Aangemaakt per week</p>
            <InfoButton
              title="Meetups aangemaakt per week"
              body={`Hoeveel nieuwe meetups er elke week aangemaakt worden, afgelopen 12 weken.\n\nStijgende trend → mensen plannen meer sessies.\nDalende trend → minder activiteit, misschien het plannen makkelijker maken.`}
            />
          </div>
          <p className="text-xs text-gray-400 mb-5">Afgelopen 12 weken</p>
          {totalChart.every(d => d.value === 0)
            ? <p className="text-sm text-gray-300 text-center py-8">Geen data beschikbaar</p>
            : <BarChart data={totalChart} />
          }
        </div>
        <div className="bg-white rounded-2xl border border-black/8 p-6">
          <div className="flex items-center gap-2 mb-1">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Succes rate per week (%)</p>
            <InfoButton
              title="Succes rate per week"
              body={`Per week: hoeveel procent van de aangemaakte meetups ook daadwerkelijk 2+ deelnemers had.\n\nHoge balk = die week lukte het goed.\nLage balk = die week werden veel meetups aangemaakt maar niemand deed mee.`}
            />
          </div>
          <p className="text-xs text-gray-400 mb-5">Afgelopen 12 weken</p>
          {successChart.every(d => d.value === 0)
            ? <p className="text-sm text-gray-300 text-center py-8">Geen data beschikbaar</p>
            : <BarChart data={successChart} />
          }
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-6">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Status verdeling</p>
          <InfoButton
            title="Status verdeling meetups"
            body={`In welk stadium bevinden de meetups zich?\n\nOpen → nog aanmeldingen mogelijk.\nGesloten → vol of niet meer aan te melden.\nGeannuleerd → meetup is afgeblazen.\nVoltooid → meetup heeft plaatsgevonden.\n\nDe statussen kunnen per platform iets anders heten.`}
          />
        </div>
        {Object.keys(statusCount).length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-4">Geen statusdata beschikbaar</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(statusCount).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{status}</span>
                    <span style={{ ...SYNE, fontWeight: 700, color: '#E87722' }}>
                      {count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#E87722] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
