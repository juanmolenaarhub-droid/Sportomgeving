'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Send, Download } from 'lucide-react'
import { InfoButton } from '../_components/InfoButton'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const TABLES = ['profiles', 'matches', 'messages', 'posts', 'creator_profiles', 'creator_challenges', 'challenge_participants', 'follow_requests', 'activity_log', 'system_notifications']

export default function PlatformPage() {
  const supabase = createClient()

  const [tableStats, setTableStats] = useState<Record<string, number>>({})
  const [statsLoading, setStatsLoading] = useState(true)
  const [notifMessage, setNotifMessage] = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [notifSent, setNotifSent] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    async function loadTableStats() {
      const results: Record<string, number> = {}
      await Promise.all(
        TABLES.map(async table => {
          const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
          results[table] = count ?? 0
        })
      )
      setTableStats(results)
      setStatsLoading(false)
    }
    loadTableStats()
  }, [supabase])

  async function sendNotification() {
    if (!notifMessage.trim()) return
    setNotifSending(true)
    await supabase.from('system_notifications').insert({
      message: notifMessage.trim(),
      is_active: true,
    })
    setNotifMessage('')
    setNotifSending(false)
    setNotifSent(true)
    setTimeout(() => setNotifSent(false), 3000)
  }

  async function exportEmails() {
    setExportLoading(true)
    const { data } = await supabase.from('profiles').select('email, full_name, username').order('created_at')
    if (data) {
      const csv = ['Email,Naam,Username', ...data.map(r => `${r.email ?? ''},${r.full_name ?? ''},${r.username ?? ''}`)]
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `buddys-users-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    setExportLoading(false)
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-8">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#C4F542' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Platform</h1>
      </div>

      {/* Database statistieken */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/8">
          <div className="flex items-center gap-2">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Database statistieken</p>
            <InfoButton
              title="Database statistieken"
              body={`Hoeveel rijen er in elke tabel van de database zitten.\n\nprofiles → accounts\nmatches → buddy-aanvragen\nmessages → verstuurde berichten\nposts → berichten in de feed\ncreator_profiles → creator-accounts\ncreator_challenges → uitdagingen van creators\nchallenge_participants → deelnemers aan uitdagingen\nfollow_requests → volg-aanvragen\nactivity_log → acties die users uitvoerden\nsystem_notifications → systeemmeldingen die jij verstuurd hebt`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Totaal rijen per tabel</p>
        </div>
        {statsLoading ? (
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            {TABLES.map(t => <div key={t} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-y divide-black/5">
            {TABLES.map((table, i) => (
              <div key={table} className={`p-5 ${i % 2 === 1 ? 'bg-[#F4F1E8]/40' : ''}`}>
                <p style={{ ...SYNE, fontWeight: 800, fontSize: 24, color: '#C4F542' }}>{tableStats[table] ?? 0}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{table}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Systeemmelding */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Systeemmelding sturen</p>
          <InfoButton
            title="Systeemmelding sturen"
            body={`Stuur een melding naar alle gebruikers. De melding verschijnt als een banner bovenaan hun dashboard.\n\nHandig voor:\n- Aankondiging van een nieuwe feature\n- Gepland onderhoud\n- Een wedstrijd of evenement\n\nDe melding blijft staan totdat je hem verwijdert.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-5">Wordt als banner getoond in het dashboard voor alle users</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={notifMessage}
            onChange={e => setNotifMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendNotification()}
            placeholder="Typ je systeemmelding…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <button
            onClick={sendNotification}
            disabled={notifSending || !notifMessage.trim()}
            className="flex items-center gap-2 bg-[#1E2B20] text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-[#C4F542] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {notifSending ? 'Bezig…' : notifSent ? '✓ Verstuurd!' : 'Stuur'}
          </button>
        </div>
        {notifSent && (
          <p className="text-xs text-green-600 font-semibold mt-3">
            ✓ Melding opgeslagen — verschijnt nu als banner in het dashboard.
          </p>
        )}
      </div>

      {/* Email export */}
      <div className="bg-white rounded-2xl border border-black/8 p-6">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 16 }} className="text-black">Exporteer user emails</p>
          <InfoButton
            title="Exporteer user emails"
            body={`Download een CSV-bestand met alle emailadressen, namen en usernames van je gebruikers.\n\nHandig voor:\n- Nieuwsbrief versturen\n- Outreach naar inactieve users\n- Back-up van je gebruikerslijst\n\nHet bestand heet buddys-users-[datum].csv.`}
          />
        </div>
        <p className="text-xs text-gray-400 mb-5">Download een CSV met alle email adressen, namen en usernames. Voor nieuwsbrief of outreach.</p>
        <button
          onClick={exportEmails}
          disabled={exportLoading}
          className="flex items-center gap-2 bg-[#F4F1E8] border border-black/10 text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-[#1E2B20] hover:text-white transition-all disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          {exportLoading ? 'Bezig…' : 'Download CSV'}
        </button>
      </div>
    </div>
  )
}
