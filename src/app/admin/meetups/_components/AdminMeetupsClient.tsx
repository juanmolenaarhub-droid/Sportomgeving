'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, Zap, Calendar, ChevronDown, Search, Eye, X } from 'lucide-react'
import { cancelMeetup } from '@/app/actions/meetups'

const AdminMeetupMap = dynamic(() => import('./AdminMeetupMap'), { ssr: false })

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#8B5CF6', default: '#6B7280',
}
function getSportColor(s: string) { return SPORT_COLORS[s] ?? SPORT_COLORS.default }

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function formatDate(date: string | null, time: string | null) {
  if (!date) return '—'
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function timeUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const hours = Math.floor(diff / 3600000)
  return hours > 0 ? `${hours}u` : `${Math.floor(diff / 60000)}m`
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-green-50 text-green-700',
  vol: 'bg-amber-50 text-amber-700',
  geannuleerd: 'bg-gray-100 text-gray-500',
  afgerond: 'bg-blue-50 text-blue-600',
  verlopen: 'bg-gray-50 text-gray-400',
}

type Meetup = {
  id: string; creatorName: string; sport: string; title: string; city: string
  is_spontaneous: boolean; date: string | null; time: string | null; expires_at: string | null
  max_participants: number; status: string; created_at: string
  latitude: number; longitude: number
  acceptedCount: number; interestedCount: number
}

type Props = {
  meetups: Meetup[]
  kpis: { activeCount: number; weekCount: number; topSport: string; convRatio: number }
}

export default function AdminMeetupsClient({ meetups, kpis }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('alle')
  const [sportFilter, setSportFilter] = useState('alle')
  const [modeFilter, setModeFilter] = useState('alle')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const sports = ['alle', ...Array.from(new Set(meetups.map(m => m.sport))).sort()]

  const filtered = meetups.filter(m => {
    if (statusFilter !== 'alle' && m.status !== statusFilter) return false
    if (sportFilter !== 'alle' && m.sport !== sportFilter) return false
    if (modeFilter === 'spontaan' && !m.is_spontaneous) return false
    if (modeFilter === 'gepland' && m.is_spontaneous) return false
    if (search) {
      const q = search.toLowerCase()
      if (!m.title.toLowerCase().includes(q) && !m.city.toLowerCase().includes(q) && !m.creatorName.toLowerCase().includes(q)) return false
    }
    return true
  })

  async function handleCancel(id: string) {
    setCancelling(true)
    await cancelMeetup(id)
    setCancelId(null)
    setCancelling(false)
    setToast('Meetup geannuleerd')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 26, color: '#111' }}>Meetups</h1>
        <p className="text-sm text-gray-400 mt-1">Overzicht van alle sportactiviteiten op het platform</p>
      </div>

      {/* KPI balk */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Actieve Meetups', value: kpis.activeCount, sub: 'open of vol', color: '#059669' },
          { label: 'Deze week', value: kpis.weekCount, sub: 'aangemaakt', color: '#3B82F6' },
          { label: 'Populairste sport', value: kpis.topSport, sub: 'meeste meetups', color: '#E87722' },
          { label: 'Conversieratio', value: `${kpis.convRatio}%`, sub: 'interesse → geaccepteerd', color: '#8B5CF6' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/8 p-5">
            <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
            <p style={{ ...SYNE, fontWeight: 900, fontSize: 28, color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Kaart */}
      <div className="bg-white rounded-2xl border border-black/8 p-5">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: '#111', marginBottom: 12 }}>Actieve meetups in Nederland</p>
        <div style={{ height: 340, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
          <AdminMeetupMap meetups={meetups.filter(m => m.status === 'open' || m.status === 'vol')} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op titel, stad of creator..."
            className="pl-8 pr-4 py-2 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722] bg-white w-64"
          />
        </div>

        {[
          { value: statusFilter, setter: setStatusFilter, options: ['alle', 'open', 'vol', 'geannuleerd', 'verlopen'], label: 'Status' },
          { value: sportFilter, setter: setSportFilter, options: sports, label: 'Sport' },
          { value: modeFilter, setter: setModeFilter, options: ['alle', 'spontaan', 'gepland'], label: 'Modus' },
        ].map(({ value, setter, options, label }) => (
          <div key={label} className="relative">
            <select
              value={value}
              onChange={e => setter(e.target.value)}
              className="appearance-none bg-white border border-black/10 rounded-xl pl-3 pr-7 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#E87722] cursor-pointer"
            >
              {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        ))}

        <span className="text-xs text-gray-400 ml-auto">{filtered.length} meetups</span>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/6 bg-[#F5F0E8]/50">
                {['Datum', 'Creator', 'Sport', 'Titel', 'Stad', 'Modus', 'Geïnt.', 'Deeln.', 'Status', 'Acties'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400 text-sm">Geen meetups gevonden</td></tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {m.is_spontaneous
                        ? <span className="text-red-500 font-semibold">{m.expires_at ? timeUntilExpiry(m.expires_at) : '—'}</span>
                        : formatDate(m.date, m.time)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{m.creatorName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ background: getSportColor(m.sport) }}>
                        {m.sport}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 max-w-[180px] truncate">{m.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.city}</td>
                    <td className="px-4 py-3">
                      {m.is_spontaneous
                        ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 flex items-center gap-1 w-fit"><Zap className="w-3 h-3" />Spontaan</span>
                        : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1 w-fit"><Calendar className="w-3 h-3" />Gepland</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[#E87722]">{m.interestedCount}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{m.acceptedCount}/{m.max_participants}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[m.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/meetup/${m.id}`} className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Bekijk
                        </Link>
                        {(m.status === 'open' || m.status === 'vol') && (
                          <button
                            onClick={() => setCancelId(m.id)}
                            className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Annuleer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel confirm modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setCancelId(null)}>
          <div className="bg-[#F5F0E8] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 style={{ ...SYNE, fontWeight: 800, marginBottom: 8 }}>Meetup annuleren?</h3>
            <p className="text-sm text-gray-600 mb-6">Alle geaccepteerde deelnemers ontvangen een notificatie.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600">Terug</button>
              <button onClick={() => handleCancel(cancelId)} disabled={cancelling} className="flex-1 py-3 rounded-xl text-sm font-bold text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50">
                {cancelling ? 'Bezig...' : 'Annuleren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
