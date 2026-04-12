'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, List, Plus, ChevronDown, Clock, Users, Zap, Calendar } from 'lucide-react'
import type { MeetupListItem } from '@/app/actions/meetups'
import InterestModal from './InterestModal'

const MeetupMap = dynamic(() => import('./MeetupMap'), { ssr: false, loading: () => (
  <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
    <MapPin className="w-8 h-8 text-gray-300" />
  </div>
)})

const MeetupDetailSheet = dynamic(() => import('./MeetupDetailSheet'), { ssr: false })

const SPORTS = ['Alles', 'Hardlopen', 'Fietsen', 'Gym', 'Yoga', 'Zwemmen', 'Voetbal', 'Padel', 'Tennis', 'Wandelen', 'Boksen', 'Klimmen']
const DATE_FILTERS = [
  { value: 'alles', label: 'Alle datums' },
  { value: 'vandaag', label: 'Vandaag' },
  { value: 'morgen', label: 'Morgen' },
  { value: 'week', label: 'Deze week' },
  { value: 'spontaan', label: '⚡ Spontaan' },
]

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#8B5CF6', default: '#6B7280',
}

function getSportColor(sport: string) { return SPORT_COLORS[sport] ?? SPORT_COLORS.default }

function timeUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `${hours}u ${mins}m`
  return `${mins} min`
}

function formatMeetupDate(date: string | null, time: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type Props = {
  initialMeetups: MeetupListItem[]
  center: [number, number]
  currentUserId: string
}

export default function MeetupPageClient({ initialMeetups, center, currentUserId }: Props) {
  const [tab, setTab] = useState<'kaart' | 'lijst'>('kaart')
  const [meetups, setMeetups] = useState(initialMeetups)
  const [sportFilter, setSportFilter] = useState('Alles')
  const [dateFilter, setDateFilter] = useState('alles')
  const [interestMeetup, setInterestMeetup] = useState<MeetupListItem | null>(null)
  const [detailMeetupId, setDetailMeetupId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = meetups.filter(m => {
    if (sportFilter !== 'Alles' && m.sport !== sportFilter) return false
    if (dateFilter === 'spontaan' && !m.isSpontaneous) return false
    if (dateFilter === 'vandaag') {
      const today = new Date().toISOString().split('T')[0]
      if (m.date !== today && !m.isSpontaneous) return false
    }
    if (dateFilter === 'morgen') {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      if (m.date !== tomorrow) return false
    }
    if (dateFilter === 'week') {
      const today = new Date().toISOString().split('T')[0]
      const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      if (!m.date || m.date < today || m.date > weekLater) return false
    }
    return true
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleInterestSuccess(meetupId: string) {
    setMeetups(prev => prev.map(m => m.id === meetupId ? { ...m, myStatus: 'interesse', interestedCount: m.interestedCount + 1 } : m))
    showToast('Je interesse is verstuurd! De organisator beslist of je mee mag doen.')
  }

  function handleMeetupDeleted(meetupId: string) {
    setMeetups(prev => prev.filter(m => m.id !== meetupId))
    setDetailMeetupId(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 24, color: '#111' }}>Meetups</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sportactiviteiten bij jou in de buurt</p>
        </div>
        <Link
          href="/dashboard/meetup/nieuw"
          className="flex items-center gap-2 bg-[#E87722] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#d4691d] transition-colors"
          style={SYNE}
        >
          <Plus className="w-4 h-4" /> Meetup aanmaken
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-black/5 rounded-xl p-1 w-fit">
        {(['kaart', 'lijst'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
            }`}
          >
            {t === 'kaart' ? <MapPin className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            className="appearance-none bg-white border border-black/10 rounded-xl pl-3 pr-8 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E87722] cursor-pointer"
          >
            {SPORTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {DATE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                dateFilter === f.value
                  ? 'bg-[#111] text-white border-[#111]'
                  : 'bg-white text-gray-600 border-black/10 hover:border-black/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-400 ml-auto">{filtered.length} meetup{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Kaart tab */}
      {tab === 'kaart' && (
        <div style={{ height: 520, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
          <MeetupMap
            meetups={filtered}
            center={center}
            currentUserId={currentUserId}
            onInterestSuccess={handleInterestSuccess}
            onDetailsClick={id => setDetailMeetupId(id)}
          />
        </div>
      )}

      {/* Lijst tab */}
      {tab === 'lijst' && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-gray-500">Geen meetups gevonden</p>
              <p className="text-sm mt-1">Pas de filters aan of maak zelf een meetup aan</p>
            </div>
          ) : (
            filtered
              .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999))
              .map(m => <MeetupListCard key={m.id} meetup={m} currentUserId={currentUserId} onInterest={() => setInterestMeetup(m)} />)
          )}
        </div>
      )}

      {/* Interesse modal */}
      {interestMeetup && (
        <InterestModal
          meetupId={interestMeetup.id}
          meetupTitle={interestMeetup.title}
          creatorName={interestMeetup.creatorName}
          sport={interestMeetup.sport}
          onClose={() => setInterestMeetup(null)}
          onSuccess={() => handleInterestSuccess(interestMeetup.id)}
        />
      )}

      {/* Detail sheet */}
      {detailMeetupId && (
        <MeetupDetailSheet
          meetupId={detailMeetupId}
          onClose={() => setDetailMeetupId(null)}
          onInterestSuccess={handleInterestSuccess}
          onMeetupDeleted={handleMeetupDeleted}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl max-w-xs text-center">
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Lijstkaart per meetup ─────────────────────────────────────────────────────

function MeetupListCard({
  meetup, currentUserId, onInterest
}: {
  meetup: MeetupListItem
  currentUserId: string
  onInterest: () => void
}) {
  const color = getSportColor(meetup.sport)
  const isCreator = meetup.creatorId === currentUserId

  return (
    <div className="bg-white rounded-2xl border border-black/8 overflow-hidden hover:border-black/16 hover:shadow-sm transition-all flex">
      {/* Sport kleur balk */}
      <div className="w-1.5 shrink-0" style={{ background: color }} />

      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                {meetup.sport}
              </span>
              {meetup.isSpontaneous ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Spontaan
                </span>
              ) : null}
              {meetup.status === 'vol' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Vol</span>
              )}
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: '#111' }} className="truncate">
              {meetup.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">door {meetup.creatorName}</p>
          </div>

          <div className="text-right shrink-0">
            {meetup.isSpontaneous && meetup.expiresAt ? (
              <span className="text-xs font-bold text-red-500 flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" /> {timeUntilExpiry(meetup.expiresAt)}
              </span>
            ) : meetup.date ? (
              <span className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" /> {formatMeetupDate(meetup.date, meetup.time)}
              </span>
            ) : null}
            {meetup.distanceKm !== undefined && (
              <p className="text-xs text-gray-400 mt-0.5">{meetup.distanceKm.toFixed(1)} km</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {meetup.locationName}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3 h-3" /> {meetup.acceptedCount}/{meetup.maxParticipants}
              {meetup.interestedCount > 0 && <span className="text-[#E87722]"> · {meetup.interestedCount} geïnt.</span>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/dashboard/meetup/${meetup.id}`} className="text-xs font-bold text-gray-500 hover:text-black transition-colors">
              Details
            </Link>
            {!isCreator && meetup.myStatus === 'geaccepteerd' ? (
              <Link href="/dashboard/messages?tab=meetups" className="text-xs font-bold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                Chat
              </Link>
            ) : !isCreator && meetup.myStatus === 'interesse' ? (
              <span className="text-xs text-gray-400 italic">Wacht op acceptatie</span>
            ) : !isCreator && meetup.status === 'open' ? (
              <button
                onClick={onInterest}
                className="text-xs font-bold bg-[#E87722] text-white px-3 py-1.5 rounded-lg hover:bg-[#d4691d] transition-colors"
              >
                Interesse
              </button>
            ) : isCreator ? (
              <Link href={`/dashboard/meetup/${meetup.id}`} className="text-xs font-bold bg-[#111] text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
                Beheer
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
