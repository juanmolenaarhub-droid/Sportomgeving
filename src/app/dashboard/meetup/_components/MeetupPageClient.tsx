'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, Plus } from 'lucide-react'
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const INK     = '#111111'
const ACCENT  = '#E87722'
const PANEL   = '#F2F0EC'
const LINE    = '#E6E3DD'
const MUTE    = '#9A958D'
const WHITE   = '#ffffff'
const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

// ─── Sport emojis ─────────────────────────────────────────────────────────────
const SPORT_EMOJI: Record<string, string> = {
  Hardlopen: '🏃', Fietsen: '🚴', Yoga: '🧘', Gym: '🏋️',
  Tennis: '🎾', Voetbal: '⚽', Zwemmen: '🏊', Klimmen: '🧗',
  Basketbal: '🏀', Volleybal: '🏐', Boksen: '🥊', Skaten: '🛹',
  Padel: '🏸', Golf: '⛳', Crossfit: '💪', Roeien: '🚣',
  Surfen: '🏄', Mountainbiken: '🚵',
}

function getDatePills() {
  const today = new Date()
  const dayNames = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const label = i === 0 ? 'Vandaag' : i === 1 ? 'Morgen' : `${dayNames[d.getDay()]} ${d.getDate()}`
    return { label, key: d.toISOString().slice(0, 10) }
  })
}

type Props = {
  initialMeetups: MeetupListItem[]
  center: [number, number]
  currentUserId: string
}

export default function MeetupPageClient({ initialMeetups, center, currentUserId }: Props) {
  const [meetups, setMeetups]               = useState(initialMeetups)
  const [sportFilter, setSportFilter]       = useState('')
  const [showSpontaan, setShowSpontaan]     = useState(false)
  const [showGepland, setShowGepland]       = useState(false)
  const [wanneerFilter, setWanneerFilter]   = useState('')
  const [afstandKm, setAfstandKm]           = useState(30)
  const [niveauFilters, setNiveauFilters]   = useState<Set<string>>(new Set())
  const [statusFilters, setStatusFilters]   = useState<Set<string>>(new Set())
  const [filterOpen, setFilterOpen]         = useState(false)
  const [interestMeetup, setInterestMeetup] = useState<MeetupListItem | null>(null)
  const [detailMeetupId, setDetailMeetupId] = useState<string | null>(null)
  const [toast, setToast]                   = useState<string | null>(null)

  const datePills = getDatePills()

  // Sport counts across all meetups
  const sportCounts = meetups.reduce<Record<string, number>>((acc, m) => {
    acc[m.sport] = (acc[m.sport] ?? 0) + 1
    return acc
  }, {})
  const availableSports = Object.keys(sportCounts).sort()

  const activeFilterCount =
    (sportFilter ? 1 : 0) +
    (showSpontaan ? 1 : 0) +
    (showGepland ? 1 : 0) +
    (wanneerFilter ? 1 : 0) +
    (afstandKm < 30 ? 1 : 0) +
    niveauFilters.size +
    statusFilters.size

  const filtered = meetups.filter(m => {
    if (sportFilter && m.sport !== sportFilter) return false
    if (showSpontaan && !m.isSpontaneous) return false
    if (showGepland && m.isSpontaneous) return false
    if (wanneerFilter && m.date !== wanneerFilter) return false
    if (afstandKm < 30 && m.distanceKm !== undefined && m.distanceKm > afstandKm) return false
    if (statusFilters.has('plekken_vrij') && !(m.status === 'open' && m.acceptedCount < m.maxParticipants)) return false
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
    setSportFilter(''); setShowSpontaan(false); setShowGepland(false)
    setWanneerFilter(''); setAfstandKm(30)
    setNiveauFilters(new Set()); setStatusFilters(new Set())
  }

  function toggleNiveau(v: string) {
    setNiveauFilters(prev => { const s = new Set(prev); s.has(v) ? s.delete(v) : s.add(v); return s })
  }
  function toggleStatus(v: string) {
    setStatusFilters(prev => { const s = new Set(prev); s.has(v) ? s.delete(v) : s.add(v); return s })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <MeetupMap
          meetups={filtered}
          center={center}
          currentUserId={currentUserId}
          onInterestSuccess={handleInterestSuccess}
          onDetailsClick={id => setDetailMeetupId(id)}
        />
      </div>

      {/* Top chrome */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingLeft: 16, paddingRight: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        {/* Left group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* FILTERS pill */}
          <button
            onClick={() => setFilterOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 38, padding: '0 14px', borderRadius: 19,
              background: activeFilterCount > 0 ? INK : WHITE,
              color: activeFilterCount > 0 ? WHITE : INK,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
              ...SYNE, fontWeight: 900, fontSize: 12, letterSpacing: 0.3,
            }}
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <line x1="1" y1="1" x2="13" y2="1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
              <line x1="3" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
              <line x1="5" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
            </svg>
            FILTERS{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </button>

          {/* Count pill */}
          <div style={{
            height: 38, padding: '0 14px', borderRadius: 19,
            background: WHITE, display: 'flex', alignItems: 'center',
            boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
            ...DM, fontWeight: 800, fontSize: 12, color: INK,
          }}>
            {filtered.length} meetup{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* + MEETUP pill */}
        <Link href="/dashboard/meetup/nieuw" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 38, padding: '0 16px', borderRadius: 19,
          background: ACCENT, color: WHITE, textDecoration: 'none',
          boxShadow: `0 6px 14px ${ACCENT}77`,
          ...SYNE, fontWeight: 900, fontSize: 12, letterSpacing: 0.3,
        }}>
          <Plus size={13} strokeWidth={2.5} />
          MEETUP
        </Link>
      </div>

      {/* Filter sheet */}
      {filterOpen && (
        <>
          <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
            maxHeight: '82%', display: 'flex', flexDirection: 'column',
            borderRadius: '28px 28px 0 0', background: WHITE,
            boxShadow: '0 -20px 50px rgba(0,0,0,0.25)',
          }}>
            {/* Grabber */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: LINE }} />
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 20 }}>
                <div>
                  {activeFilterCount > 0 && (
                    <div style={{ ...SYNE, fontSize: 10, fontWeight: 900, color: ACCENT, letterSpacing: 1.2, marginBottom: 2 }}>
                      {activeFilterCount} ACTIEF
                    </div>
                  )}
                  <div style={{ ...SYNE, fontSize: 28, fontWeight: 900, color: INK, letterSpacing: -0.8, lineHeight: 1 }}>
                    Filters
                  </div>
                </div>
                <button onClick={clearFilters} style={{
                  padding: '6px 11px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: PANEL, ...DM, fontSize: 11, fontWeight: 800, color: INK,
                }}>
                  Reset
                </button>
              </div>

              {/* Sport */}
              <SectionLabel label="SPORT" meta={availableSports.length > 5 ? `+${availableSports.length - 5}` : undefined} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {/* Alle chip */}
                <SportChip
                  emoji={undefined}
                  label="Alle"
                  count={meetups.length}
                  active={!sportFilter}
                  onToggle={() => setSportFilter('')}
                />
                {availableSports.map(s => (
                  <SportChip
                    key={s}
                    emoji={SPORT_EMOJI[s]}
                    label={s}
                    count={sportCounts[s] ?? 0}
                    active={sportFilter === s}
                    onToggle={() => setSportFilter(prev => prev === s ? '' : s)}
                  />
                ))}
              </div>

              {/* Type */}
              <SectionLabel label="TYPE" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
                <TypeTile
                  active={showSpontaan}
                  onToggle={() => { setShowSpontaan(v => !v); if (!showSpontaan) setShowGepland(false) }}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1L8.5 5.5H13L9.5 8.5L11 13L7 10L3 13L4.5 8.5L1 5.5H5.5L7 1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  }
                  label="Spontaan"
                  sub="Nu – 4 uur"
                />
                <TypeTile
                  active={showGepland}
                  onToggle={() => { setShowGepland(v => !v); if (!showGepland) setShowSpontaan(false) }}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M1 6h12" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M4 1v3M10 1v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  }
                  label="Gepland"
                  sub="Tot 2 weken"
                />
              </div>

              {/* Wanneer */}
              <SectionLabel label="WANNEER" />
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}>
                {datePills.map(({ label, key }) => {
                  const active = wanneerFilter === key
                  return (
                    <button key={key} onClick={() => setWanneerFilter(prev => prev === key ? '' : key)} style={{
                      flexShrink: 0, height: 36, padding: '0 14px', borderRadius: 12,
                      border: 'none', cursor: 'pointer',
                      background: active ? INK : PANEL,
                      color: active ? WHITE : INK,
                      ...DM, fontSize: 12, fontWeight: 800,
                      transition: 'all 150ms',
                    }}>
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Afstand */}
              <SectionLabel label="AFSTAND" meta={`Max ${afstandKm < 30 ? afstandKm + ' km' : '30+ km'}`} />
              <div style={{ background: PANEL, borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ ...DM, fontSize: 11, fontWeight: 800, color: MUTE }}>Rondom jou</span>
                  <span style={{ ...DM, fontSize: 20, fontWeight: 900, color: ACCENT, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
                    {afstandKm < 30 ? `${afstandKm} km` : '30+ km'}
                  </span>
                </div>
                <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 3, background: WHITE }} />
                  <div style={{ position: 'absolute', left: 0, width: `${(afstandKm / 30) * 100}%`, height: 5, borderRadius: 3, background: INK }} />
                  <input
                    type="range" min={1} max={30} value={afstandKm}
                    onChange={e => setAfstandKm(Number(e.target.value))}
                    style={{ position: 'relative', width: '100%', zIndex: 1, appearance: 'none', background: 'transparent', cursor: 'pointer', margin: 0 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {['1 KM', '15 KM', '30+ KM'].map(l => (
                    <span key={l} style={{ ...DM, fontSize: 9, fontWeight: 800, color: MUTE }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Niveau & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <SectionLabel label="NIVEAU" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {['Start', 'Mid', 'Snel'].map(n => (
                      <FilterRowBtn key={n} label={n} active={niveauFilters.has(n)} onToggle={() => toggleNiveau(n)} />
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel label="STATUS" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      { key: 'plekken_vrij', label: 'Plekken vrij' },
                      { key: 'alleen_verified', label: 'Alleen verified' },
                      { key: 'alleen_gratis', label: 'Alleen gratis' },
                    ].map(({ key, label }) => (
                      <FilterRowBtn key={key} label={label} active={statusFilters.has(key)} onToggle={() => toggleStatus(key)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky CTA */}
            <div style={{
              flexShrink: 0, borderTop: `1px solid ${LINE}`, padding: '12px 20px',
              paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
              background: WHITE,
            }}>
              <button
                onClick={() => setFilterOpen(false)}
                style={{
                  width: '100%', height: 52, borderRadius: 26, border: 'none', cursor: 'pointer',
                  background: ACCENT, color: WHITE,
                  boxShadow: `0 8px 20px ${ACCENT}66`,
                  ...SYNE, fontWeight: 900, fontSize: 14, letterSpacing: 0.4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                TOON {filtered.length} MEETUP{filtered.length !== 1 ? 'S' : ''}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
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
          zIndex: 60, background: INK, color: WHITE, fontSize: 14, fontWeight: 600,
          padding: '12px 20px', borderRadius: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          maxWidth: 300, textAlign: 'center', ...DM,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, meta }: { label: string; meta?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 900, color: MUTE, letterSpacing: 1.2 }}>{label}</span>
      {meta && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 800, color: MUTE }}>{meta}</span>}
    </div>
  )
}

function SportChip({ emoji, label, count, active, onToggle }: {
  emoji?: string; label: string; count: number; active: boolean; onToggle: () => void
}) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      height: 36, padding: '0 12px', borderRadius: 18,
      border: active ? 'none' : `1px solid ${LINE}`,
      background: active ? INK : WHITE,
      color: active ? WHITE : INK,
      cursor: 'pointer', transition: 'all 150ms',
      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 800,
    }}>
      {emoji && <span style={{ fontSize: 14 }}>{emoji}</span>}
      {label}
      <span style={{
        fontSize: 9, fontWeight: 900, padding: '2px 5px', borderRadius: 5,
        background: active ? 'rgba(255,255,255,0.22)' : PANEL,
        color: active ? WHITE : MUTE,
      }}>
        {count}
      </span>
    </button>
  )
}

function TypeTile({ active, onToggle, icon, label, sub }: {
  active: boolean; onToggle: () => void; icon: React.ReactNode; label: string; sub: string
}) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 14px', borderRadius: 14, border: 'none', cursor: 'pointer',
      background: active ? INK : PANEL,
      transition: 'all 150ms',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? ACCENT : WHITE,
        color: active ? WHITE : INK,
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 900, color: active ? WHITE : INK, letterSpacing: -0.2 }}>{label}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: active ? 'rgba(255,255,255,0.7)' : MUTE }}>{sub}</div>
      </div>
    </button>
  )
}

function FilterRowBtn({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 36, padding: '0 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
      background: active ? INK : PANEL,
      color: active ? WHITE : INK,
      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 800,
      transition: 'all 150ms',
    }}>
      {label}
      {active && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
