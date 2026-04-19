'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, Plus, Zap, Calendar, ChevronDown, Users, Unlock } from 'lucide-react'
import { getMeetups, type MeetupListItem } from '@/app/actions/meetups'
import { createClient } from '@/lib/supabase'
import InterestModal from './InterestModal'

const MeetupMap = dynamic(() => import('./MeetupMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <MapPin className="w-8 h-8 text-gray-300" />
    </div>
  ),
})

const MeetupDetailSheet = dynamic(() => import('./MeetupDetailSheet'), { ssr: false })

type Props = {
  initialMeetups: MeetupListItem[]
  center: [number, number]
  currentUserId: string
}

export default function MeetupPageClient({ initialMeetups, center, currentUserId }: Props) {
  const [meetups, setMeetups] = useState(initialMeetups)
  const [sportFilter, setSportFilter] = useState('')
  const [showSpontaan, setShowSpontaan] = useState(false)
  const [showGepland, setShowGepland] = useState(false)
  const [showOpen, setShowOpen] = useState(false)
  const [showBuddies, setShowBuddies] = useState(false)
  const [showSportPicker, setShowSportPicker] = useState(false)
  const [interestMeetup, setInterestMeetup] = useState<MeetupListItem | null>(null)
  const [detailMeetupId, setDetailMeetupId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const sportPickerRef = useRef<HTMLDivElement>(null)

  const availableSports = [...new Set(meetups.map(m => m.sport))].sort()

  const filtered = meetups.filter(m => {
    if (sportFilter && m.sport !== sportFilter) return false
    if (showSpontaan && !m.isSpontaneous) return false
    if (showGepland && m.isSpontaneous) return false
    if (showOpen && m.status !== 'open') return false
    return true
  })

  const refreshMeetups = useCallback(async () => {
    const fresh = await getMeetups({ latitude: center[0], longitude: center[1], radiusKm: 50 })
    setMeetups(fresh)
  }, [center])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('meetups-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetups' }, () => refreshMeetups())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetup_participants' }, () => refreshMeetups())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [refreshMeetups])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sportPickerRef.current && !sportPickerRef.current.contains(e.target as Node)) {
        setShowSportPicker(false)
      }
    }
    if (showSportPicker) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSportPicker])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function handleInterestSuccess(meetupId: string) {
    setMeetups(prev =>
      prev.map(m => m.id === meetupId ? { ...m, myStatus: 'interesse', interestedCount: m.interestedCount + 1 } : m)
    )
    showToast('Je interesse is verstuurd! De organisator beslist of je mee mag doen.')
  }

  function handleMeetupDeleted(meetupId: string) {
    setMeetups(prev => prev.filter(m => m.id !== meetupId))
    setDetailMeetupId(null)
  }

  const pillBase = 'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all select-none'
  const pillShadow = { boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MeetupMap
          meetups={filtered}
          center={center}
          currentUserId={currentUserId}
          onInterestSuccess={handleInterestSuccess}
          onDetailsClick={id => setDetailMeetupId(id)}
        />
      </div>

      {/* Filter pills — floating bovenop kaart */}
      <div
        className="absolute left-0 right-0 z-10"
        style={{ top: 0, paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <div
          className="flex gap-2 px-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Sport */}
          <div ref={sportPickerRef} className="relative flex-shrink-0">
            <button
              onClick={() => setShowSportPicker(v => !v)}
              className={pillBase + (sportFilter ? ' bg-[#E87722] text-white' : ' bg-white text-gray-800')}
              style={pillShadow}
            >
              {sportFilter || 'Sport'}
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {showSportPicker && (
              <div
                className="absolute left-0 top-full mt-2 bg-white rounded-2xl overflow-hidden min-w-[160px]"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
              >
                <button
                  onClick={() => { setSportFilter(''); setShowSportPicker(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${!sportFilter ? 'bg-[#E87722]/10 text-[#E87722]' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  Alle sporten
                </button>
                {availableSports.map(sport => (
                  <button
                    key={sport}
                    onClick={() => { setSportFilter(sport); setShowSportPicker(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${sportFilter === sport ? 'bg-[#E87722]/10 text-[#E87722]' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {sport}
                  </button>
                ))}
                {availableSports.length === 0 && (
                  <p className="px-4 py-2.5 text-sm text-gray-400">Geen sporten</p>
                )}
              </div>
            )}
          </div>

          {/* Locatie */}
          <button
            className={pillBase + ' bg-white text-gray-800 flex-shrink-0'}
            style={pillShadow}
          >
            <MapPin className="w-3.5 h-3.5" />
            Locatie
          </button>

          {/* Spontaan */}
          <button
            onClick={() => { setShowSpontaan(v => !v); if (!showSpontaan) setShowGepland(false) }}
            className={pillBase + ' flex-shrink-0 ' + (showSpontaan ? 'bg-[#111] text-white' : 'bg-white text-gray-800')}
            style={pillShadow}
          >
            <Zap className="w-3.5 h-3.5" />
            Spontaan
          </button>

          {/* Gepland */}
          <button
            onClick={() => { setShowGepland(v => !v); if (!showGepland) setShowSpontaan(false) }}
            className={pillBase + ' flex-shrink-0 ' + (showGepland ? 'bg-[#111] text-white' : 'bg-white text-gray-800')}
            style={pillShadow}
          >
            <Calendar className="w-3.5 h-3.5" />
            Gepland
          </button>

          {/* Buddies */}
          <button
            onClick={() => setShowBuddies(v => !v)}
            className={pillBase + ' flex-shrink-0 ' + (showBuddies ? 'bg-[#111] text-white' : 'bg-white text-gray-800')}
            style={pillShadow}
          >
            <Users className="w-3.5 h-3.5" />
            Buddies
          </button>

          {/* Open */}
          <button
            onClick={() => setShowOpen(v => !v)}
            className={pillBase + ' flex-shrink-0 ' + (showOpen ? 'bg-[#111] text-white' : 'bg-white text-gray-800')}
            style={pillShadow}
          >
            <Unlock className="w-3.5 h-3.5" />
            Open
          </button>
        </div>
      </div>

      {/* Meetup teller */}
      <div
        className="absolute z-10"
        style={{
          top: 'calc(env(safe-area-inset-top) + 56px)',
          right: 16,
        }}
      >
        <div
          className="bg-white rounded-full px-3 py-1.5 text-xs font-bold text-gray-700"
          style={pillShadow}
        >
          {filtered.length} meetup{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* FAB — meetup aanmaken */}
      <Link
        href="/dashboard/meetup/nieuw"
        className="absolute z-10 flex items-center gap-2 text-white font-bold text-sm px-4 py-3 rounded-2xl"
        style={{
          bottom: 24,
          right: 16,
          background: '#E87722',
          boxShadow: '0 4px 20px rgba(232,119,34,0.45)',
          fontFamily: "'Syne', sans-serif",
        }}
      >
        <Plus className="w-4 h-4" />
        Meetup
      </Link>

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
