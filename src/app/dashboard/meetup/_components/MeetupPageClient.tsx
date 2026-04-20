'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, Plus, Zap, Calendar, Users, Unlock, SlidersHorizontal, X } from 'lucide-react'
import { getMeetups, type MeetupListItem } from '@/app/actions/meetups'
import { createClient } from '@/lib/supabase'
import InterestModal from './InterestModal'

const MeetupMap = dynamic(() => import('./MeetupMap'), {
  ssr: false,
  loading: () => (
    <div style={{ position: 'absolute', inset: 0, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <MapPin style={{ width: 32, height: 32, color: '#d1d5db' }} />
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
  const [filterOpen, setFilterOpen] = useState(false)
  const [interestMeetup, setInterestMeetup] = useState<MeetupListItem | null>(null)
  const [detailMeetupId, setDetailMeetupId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const availableSports = [...new Set(meetups.map(m => m.sport))].sort()

  const activeFilterCount = [sportFilter, showSpontaan, showGepland, showOpen, showBuddies].filter(Boolean).length

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

  function clearFilters() {
    setSportFilter('')
    setShowSpontaan(false)
    setShowGepland(false)
    setShowOpen(false)
    setShowBuddies(false)
  }

  const shadow = { boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Full-screen map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MeetupMap
          meetups={filtered}
          center={center}
          currentUserId={currentUserId}
          onInterestSuccess={handleInterestSuccess}
          onDetailsClick={id => setDetailMeetupId(id)}
        />
      </div>

      {/* Filter knop — linksboven */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 16,
          paddingTop: 'max(14px, env(safe-area-inset-top))',
          zIndex: 20,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => setFilterOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: activeFilterCount > 0 ? '#E87722' : '#fff',
            color: activeFilterCount > 0 ? '#fff' : '#111',
            border: 'none',
            borderRadius: 999,
            padding: '9px 16px',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            ...shadow,
          }}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.3)',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 900,
              padding: '1px 6px',
              lineHeight: 1.4,
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Meetup teller */}
        <div style={{
          background: '#fff',
          borderRadius: 999,
          padding: '9px 14px',
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: 12,
          color: '#555',
          ...shadow,
        }}>
          {filtered.length} meetup{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* + Meetup knop */}
        <Link
          href="/dashboard/meetup/nieuw"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#E87722',
            color: '#fff',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            padding: '9px 16px',
            borderRadius: 999,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(232,119,34,0.45)',
          }}
        >
          <Plus size={15} />
          Meetup
        </Link>
      </div>

      {/* Filter sheet overlay */}
      {filterOpen && (
        <>
          <div
            onClick={() => setFilterOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.35)' }}
          />
          <div style={{
            position: 'fixed',
            left: 0, right: 0, bottom: 0,
            zIndex: 50,
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: '20px 20px 40px',
            paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom) + 24px))',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 18, color: '#111' }}>
                Filters
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    style={{ fontSize: 13, fontWeight: 600, color: '#E87722', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Wis alles
                  </button>
                )}
                <button
                  onClick={() => setFilterOpen(false)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: 999, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} color="#666" />
                </button>
              </div>
            </div>

            {/* Sport */}
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sport
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <FilterPill label="Alle sporten" active={!sportFilter} onToggle={() => setSportFilter('')} />
              {availableSports.map(s => (
                <FilterPill key={s} label={s} active={sportFilter === s} onToggle={() => setSportFilter(prev => prev === s ? '' : s)} />
              ))}
            </div>

            {/* Type */}
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Type
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <FilterPill label="⚡ Spontaan" active={showSpontaan} onToggle={() => { setShowSpontaan(v => !v); if (!showSpontaan) setShowGepland(false) }} icon={<Zap size={13} />} />
              <FilterPill label="Gepland" active={showGepland} onToggle={() => { setShowGepland(v => !v); if (!showGepland) setShowSpontaan(false) }} icon={<Calendar size={13} />} />
            </div>

            {/* Status */}
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Status
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              <FilterPill label="Open" active={showOpen} onToggle={() => setShowOpen(v => !v)} icon={<Unlock size={13} />} />
              <FilterPill label="Buddies" active={showBuddies} onToggle={() => setShowBuddies(v => !v)} icon={<Users size={13} />} />
            </div>

            {/* Toepassen */}
            <button
              onClick={() => setFilterOpen(false)}
              style={{
                width: '100%',
                background: '#111',
                color: '#fff',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                padding: '14px',
                borderRadius: 16,
                border: 'none',
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              Bekijk {filtered.length} meetup{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        </>
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

      {detailMeetupId && (
        <MeetupDetailSheet
          meetupId={detailMeetupId}
          onClose={() => setDetailMeetupId(null)}
          onInterestSuccess={handleInterestSuccess}
          onMeetupDeleted={handleMeetupDeleted}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          zIndex: 60, background: '#111', color: '#fff', fontSize: 14, fontWeight: 600,
          padding: '12px 20px', borderRadius: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          maxWidth: 300, textAlign: 'center', fontFamily: "'DM Sans', sans-serif",
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function FilterPill({ label, active, onToggle, icon }: { label: string; active: boolean; onToggle: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 999,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14,
        background: active ? '#111' : '#f3f4f6',
        color: active ? '#fff' : '#333',
        border: 'none', cursor: 'pointer', transition: 'all 150ms',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
