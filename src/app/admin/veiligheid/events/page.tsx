'use client'

import { useState, useEffect } from 'react'
import { Zap, Download, AlertOctagon, ChevronDown } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type SecurityEvent = {
  id:         string
  created_at: string
  user_id:    string | null
  event_type: string
  metadata:   Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  profile?:   { username: string | null; full_name: string | null } | null
}

const EVENT_BADGES: Record<string, string> = {
  rate_limit_exceeded: 'bg-orange-100 text-orange-700',
  login_failed:        'bg-red-100 text-red-700',
  login_success:       'bg-green-100 text-green-700',
  password_changed:    'bg-blue-100 text-blue-700',
  email_changed:       'bg-blue-100 text-blue-700',
  account_deleted:     'bg-gray-100 text-gray-500',
  suspicious_upload:   'bg-red-100 text-red-700',
  blocked_user:        'bg-yellow-100 text-yellow-700',
  report_submitted:    'bg-yellow-100 text-yellow-700',
  admin_action:        'bg-blue-100 text-blue-700',
  session_revoked:     'bg-purple-100 text-purple-700',
  avg_request:         'bg-teal-100 text-teal-700',
}

function exportCsv(events: SecurityEvent[]) {
  const header = 'Tijdstip,User,Event,IP\n'
  const body   = events.map(e =>
    [
      e.created_at,
      e.profile?.username ?? e.profile?.full_name ?? e.user_id ?? '',
      e.event_type,
      e.ip_address ?? '',
    ].join(',')
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `security-events-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SecurityEventsPage() {
  const [events, setEvents]         = useState<SecurityEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch]         = useState('')

  useEffect(() => {
    async function load() {
      const admin = createAdminClient()
      const { data } = await admin
        .from('security_events')
        .select('*, profile:user_id(username, full_name)')
        .order('created_at', { ascending: false })
        .limit(500)
      setEvents((data as unknown as SecurityEvent[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = events.filter(e => {
    if (typeFilter !== 'all' && e.event_type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const u = (e.profile?.username ?? e.profile?.full_name ?? '').toLowerCase()
      if (!u.includes(q) && !(e.ip_address ?? '').includes(q)) return false
    }
    return true
  })

  // Aanval detectie — meer dan 5 rate limits van zelfde IP in 24u
  const day1 = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const ipCounts: Record<string, number> = {}
  events.filter(e => e.event_type === 'rate_limit_exceeded' && new Date(e.created_at) > day1 && e.ip_address)
    .forEach(e => { ipCounts[e.ip_address!] = (ipCounts[e.ip_address!] ?? 0) + 1 })
  const attacks = Object.entries(ipCounts).filter(([, n]) => n >= 5)

  const eventTypes = [...new Set(events.map(e => e.event_type))]

  if (loading) return (
    <div className="p-6 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#C4F542] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#1E2B20' }}>Security Events Log</h1>
          <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">{filtered.length}</span>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-semibold hover:bg-black/5 transition-colors"
          style={SYNE}
        >
          <Download className="w-4 h-4" /> Exporteer CSV
        </button>
      </div>

      {attacks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-700" style={SYNE}>Mogelijke geautomatiseerde aanval gedetecteerd</p>
            {attacks.map(([ip, count]) => (
              <p key={ip} className="text-xs text-red-600 mt-0.5">{count} rate limit events van IP {ip} in de afgelopen 24u</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-black/10 text-sm font-semibold bg-white focus:outline-none"
            style={SYNE}
          >
            <option value="all">Alle event types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op user of IP..."
          className="px-3 py-2 rounded-xl border border-black/10 text-sm bg-white focus:outline-none focus:border-[#C4F542] flex-1 min-w-40"
          style={SYNE}
        />
      </div>

      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#FAFAF7]">
                {['Tijdstip', 'User', 'Event type', 'Details', 'IP-adres'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider" style={SYNE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Geen events gevonden.</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-[#FAFAF7] transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(e.created_at).toLocaleString('nl-NL')}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {e.profile?.username ?? e.profile?.full_name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${EVENT_BADGES[e.event_type] ?? 'bg-gray-100 text-gray-500'}`}>
                      {e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-48 truncate">
                    {JSON.stringify(e.metadata)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {e.ip_address ?? '—'}
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
