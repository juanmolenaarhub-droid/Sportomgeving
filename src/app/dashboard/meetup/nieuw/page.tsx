'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createMeetup } from '@/app/actions/meetups'
import { createClient } from '@/lib/supabase'

const LocationPreviewMap = dynamic(() => import('../_components/LocationPreviewMap'), { ssr: false })

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  accent:         '#F07A1F',
  accentDark:     '#C85F10',
  accentLight:    '#FFF1E3',
  accentDisabled: '#FCD6B4',
  ink:            '#141414',
  mute:           '#6B6B6B',
  muteSoft:       '#9A958D',
  panel:          '#F5F3EF',
  line:           '#E8E5DF',
  success:        '#10B981',
} as const

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

// ─── Sports ───────────────────────────────────────────────────────────────────
const SPORTS = [
  { label: 'Hardlopen', emoji: '🏃' },
  { label: 'Fietsen',   emoji: '🚴' },
  { label: 'Yoga',      emoji: '🧘' },
  { label: 'Gym',       emoji: '🏋️' },
  { label: 'Tennis',    emoji: '🎾' },
  { label: 'Voetbal',   emoji: '⚽' },
  { label: 'Zwemmen',   emoji: '🏊' },
  { label: 'Klimmen',   emoji: '🧗' },
  { label: 'Basketbal', emoji: '🏀' },
  { label: 'Volleybal', emoji: '🏐' },
  { label: 'Boksen',    emoji: '🥊' },
  { label: 'Skaten',    emoji: '🛹' },
]

const COVERS: Record<string, string[]> = {
  Hardlopen: [
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486218119243-13883505764c?w=400&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=400&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80&auto=format&fit=crop',
  ],
  Fietsen: [
    'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80&auto=format&fit=crop',
  ],
  Yoga: [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80&auto=format&fit=crop',
  ],
  Gym: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&auto=format&fit=crop',
  ],
  Tennis: [
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&q=80&auto=format&fit=crop',
  ],
  Voetbal: [
    'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&q=80&auto=format&fit=crop',
  ],
  default: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&q=80&auto=format&fit=crop',
  ],
}

const INTROS: Record<string, string[]> = {
  Hardlopen: [
    "Hoi! Ik zoek gezelschap voor een rustig rondje. Tempo ~5'30\"/km, daarna koffie? ☕",
    'Wekelijkse trainingsmaatje gezocht! Ik loop elke ochtend en zoek gezelschap. 🏃',
  ],
  Fietsen: [
    'Weekend rit door de polder! Rustig tempo, gezelligheid staat voorop. 🚴',
    'Op zoek naar een fietsmaatje voor een mooie tour. Wie gaat er mee?',
  ],
  Yoga: [
    'Zin in een yoga sessie buiten? Alle niveaus welkom, gezelligheid staat voorop! 🧘',
    "Outdoor yoga in het park! Breng je mat mee, ik breng de thee. ☕",
  ],
  default: [
    'Hoi! Ik zoek gezelschap voor deze activiteit. Gezelligheid staat voorop! 💪',
    'Samen sporten is leuker dan alleen! Doe je mee?',
  ],
}

// ─── Geocoding ────────────────────────────────────────────────────────────────
type GeoResult = { lat: number; lon: number; display_name: string; city: string }

async function geocode(query: string): Promise<GeoResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return []
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=nl&language=nl&limit=5&access_token=${token}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.features ?? []).map((f: { center: [number, number]; place_name: string; context?: { id: string; text: string }[] }) => {
    const city = f.context?.find(c => c.id.startsWith('place.'))?.text
      ?? f.context?.find(c => c.id.startsWith('locality.'))?.text ?? ''
    return { lat: f.center[1], lon: f.center[0], display_name: f.place_name, city }
  })
}

function getNext7Days() {
  const WD = ['ZO','MA','DI','WO','DO','VR','ZA']
  const MO = ['JAN','FEB','MRT','APR','MEI','JUN','JUL','AUG','SEP','OKT','NOV','DEC']
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    return { iso: d.toISOString().split('T')[0], day: String(d.getDate()), wd: WD[d.getDay()], mo: MO[d.getMonth()] }
  })
}

// ─── Draft ────────────────────────────────────────────────────────────────────
type Loc = { name: string; lat: number; lon: number; city: string }
type Draft = {
  sport: string; sportEmoji: string
  title: string; description: string
  location: Loc | null
  isSpontaneous: boolean; date: string; startTime: string; durationMinutes: number
  level: 'start' | 'mid' | 'fast'; distanceKm: number; maxBuddies: number
  isPrivate: boolean; verifiedOnly: boolean; ageFilter: boolean
  coverFile: File | null; coverPreview: string | null; coverSuggestion: string | null
  introMessage: string
  commercial: boolean; rulesAccepted: boolean
}

const INIT: Draft = {
  sport: 'Hardlopen', sportEmoji: '🏃',
  title: '', description: '',
  location: null,
  isSpontaneous: false, date: '', startTime: '09:00', durationMinutes: 60,
  level: 'mid', distanceKm: 10, maxBuddies: 8,
  isPrivate: false, verifiedOnly: false, ageFilter: false,
  coverFile: null, coverPreview: null, coverSuggestion: null,
  introMessage: '',
  commercial: false, rulesAccepted: false,
}

// ─── Shared chrome ────────────────────────────────────────────────────────────
function SHeader({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div style={{ padding: '0 24px', paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 16px))', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6"/>
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 5, flex: 1 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? C.accent : '#EAE6DF', transition: 'background 200ms ease-out' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function STitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div style={{ padding: '4px 24px 20px', flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, ...DM }}>{kicker}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: -0.8, lineHeight: 1.05, ...SYNE }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: C.mute, fontWeight: 500, marginTop: 8, lineHeight: 1.4, ...DM }}>{sub}</div>}
    </div>
  )
}

function SFooter({ next = 'Volgende', canNext, onNext, onBack }: { next?: string; canNext: boolean; onNext: () => void; onBack: () => void }) {
  return (
    <div style={{
      padding: '14px 20px', flexShrink: 0,
      paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 14px))',
      background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, #fff 35%)',
      display: 'flex', gap: 10,
    }}>
      <button onClick={onBack} style={{
        flex: 1, height: 52, borderRadius: 26,
        border: `1.5px solid ${C.accent}`, background: 'none',
        color: C.accent, fontSize: 15, fontWeight: 700, cursor: 'pointer', ...DM,
      }}>Vorige</button>
      <button onClick={canNext ? onNext : undefined} style={{
        flex: 1.5, height: 52, borderRadius: 26, border: 'none',
        background: canNext ? C.accent : C.accentDisabled,
        color: '#fff', fontSize: 15, fontWeight: 700,
        cursor: canNext ? 'pointer' : 'default', ...DM,
        boxShadow: canNext ? `0 8px 20px ${C.accent}44` : 'none',
        transition: 'background 200ms, box-shadow 200ms',
      }}>{next}</button>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 26, borderRadius: 13, flexShrink: 0,
      background: on ? C.accent : C.line, border: 'none', cursor: 'pointer',
      position: 'relative', transition: 'background 160ms',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2,
        width: 22, height: 22, borderRadius: 11, background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)', transition: 'left 160ms ease',
      }} />
    </button>
  )
}

// ─── Step 1: Sport + Title + Description ──────────────────────────────────────
function Step1({ draft, update, onNext, onBack }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const canNext = draft.title.trim().length >= 4

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SHeader step={1} onBack={onBack} />
      <STitle kicker="Stap 1 / 6" title="Wat ga je doen?" sub="Kies je sport of activiteit." />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Tabs */}
        <div style={{ margin: '0 24px 18px', display: 'flex', gap: 22, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ paddingBottom: 10, borderBottom: `2.5px solid ${C.ink}`, fontSize: 14, fontWeight: 700, color: C.ink, ...DM, marginBottom: -1 }}>Kies sport</div>
          <div style={{ paddingBottom: 10, fontSize: 14, fontWeight: 600, color: C.mute, ...DM }}>Inspiratie</div>
        </div>

        {/* Sport grid */}
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {SPORTS.map(s => (
            <button key={s.label} onClick={() => update({ sport: s.label, sportEmoji: s.emoji })} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18,
                background: draft.sport === s.label ? C.accent : C.panel,
                border: `2px solid ${draft.sport === s.label ? C.accent : 'transparent'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, transition: 'all 180ms ease',
                boxShadow: draft.sport === s.label ? `0 6px 16px ${C.accent}44` : 'none',
              }}>{s.emoji}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: draft.sport === s.label ? C.accent : C.ink, ...DM }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Title */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.ink, ...DM }}>Titel *</label>
              <span style={{ fontSize: 11, color: C.mute, fontWeight: 600, ...DM }}>{draft.title.length}/50</span>
            </div>
            <input
              type="text" value={draft.title}
              onChange={e => update({ title: e.target.value.slice(0, 50) })}
              placeholder="Bijv. Ochtendrondje langs de Amstel"
              style={{ width: '100%', height: 50, padding: '0 16px', borderRadius: 14, background: C.panel, border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: C.ink, boxSizing: 'border-box', ...DM }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.ink, ...DM }}>Beschrijving</label>
              <span style={{ fontSize: 11, color: C.mute, fontWeight: 600, ...DM }}>optioneel · {draft.description.length}/300</span>
            </div>
            <textarea
              rows={3} value={draft.description}
              onChange={e => update({ description: e.target.value.slice(0, 300) })}
              placeholder="Waarom wil je deze activiteit met buddy's doen?"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: C.panel, border: 'none', outline: 'none', resize: 'none', fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.4, boxSizing: 'border-box', ...DM }}
            />
          </div>
        </div>
      </div>

      <SFooter canNext={canNext} onNext={onNext} onBack={onBack} />
    </div>
  )
}

// ─── Step 2: Location ─────────────────────────────────────────────────────────
function Step2({ draft, update, onNext, onBack }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const [query, setQuery] = useState(draft.location?.name ?? '')
  const [results, setResults] = useState<GeoResult[]>([])
  const [searching, setSearching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const canNext = draft.location !== null

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)
      setResults(await geocode(query))
      setSearching(false)
    }, 500)
  }, [query])

  function pick(r: GeoResult) {
    const short = r.display_name.split(',').slice(0, 2).join(',').trim()
    update({ location: { name: short, lat: r.lat, lon: r.lon, city: r.city } })
    setQuery(short); setResults([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SHeader step={2} onBack={onBack} />
      <STitle kicker="Stap 2 / 6" title="Waar?" sub="Kies een startpunt of een vaste locatie." />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Search */}
        <div style={{ padding: '0 24px 14px', position: 'relative' }}>
          <div style={{ height: 52, padding: '0 16px', borderRadius: 26, background: C.panel, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={11} cy={11} r={7}/><path d="M16 16l5 5"/>
            </svg>
            <input
              type="text" value={query}
              onChange={e => { setQuery(e.target.value); if (draft.location) update({ location: null }) }}
              placeholder="Zoek locatie, park, sportveld…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: C.ink, fontWeight: 500, ...DM }}
            />
            {searching && <div className="spin-loader" style={{ width: 16, height: 16, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: 8 }} />}
          </div>

          {results.length > 0 && (
            <div style={{ marginTop: 4, background: '#fff', borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', position: 'absolute', left: 24, right: 24, zIndex: 20 }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => pick(r)} style={{
                  width: '100%', textAlign: 'left', padding: '11px 16px',
                  border: 'none', borderBottom: i < results.length - 1 ? `1px solid ${C.line}` : 'none',
                  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8, ...DM,
                }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                    <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/><circle cx={12} cy={9} r={2.5}/>
                  </svg>
                  <span style={{ fontSize: 13, color: C.ink, fontWeight: 500, lineHeight: 1.3 }}>{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick pins */}
        <div style={{ padding: '0 24px 16px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[{ e: '📍', l: 'Huidige locatie' }, { e: '🌳', l: 'Park' }, { e: '🏟️', l: 'Sportpark' }, { e: '🏖️', l: 'Strand' }].map(p => (
            <button key={p.l} onClick={() => setQuery(p.l)} style={{
              flexShrink: 0, height: 36, padding: '0 12px', borderRadius: 18,
              background: '#fff', border: `1px solid ${C.line}`,
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: C.ink, cursor: 'pointer', ...DM,
            }}>{p.e} {p.l}</button>
          ))}
        </div>

        {/* Map */}
        {draft.location ? (
          <div style={{ margin: '0 24px 14px', borderRadius: 20, overflow: 'hidden', height: 300, border: `1px solid ${C.line}` }}>
            <LocationPreviewMap lat={draft.location.lat} lon={draft.location.lon} />
          </div>
        ) : (
          <div style={{ margin: '0 24px 14px', borderRadius: 20, height: 300, background: C.panel, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/><circle cx={12} cy={9} r={2.5}/>
            </svg>
            <p style={{ fontSize: 13, color: C.muteSoft, fontWeight: 500, margin: 0, ...DM }}>Zoek een locatie hierboven</p>
          </div>
        )}

        {/* Tip */}
        <div style={{ margin: '0 24px 20px', padding: '10px 14px', background: C.accentLight, borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx={12} cy={12} r={9}/><path d="M12 8v.01M11 12h1v5h1"/>
          </svg>
          <p style={{ fontSize: 12, color: C.ink, fontWeight: 500, lineHeight: 1.45, margin: 0, ...DM }}>
            <b>Tip:</b> kies een duidelijk herkenningspunt als startpunt.
          </p>
        </div>
      </div>

      <SFooter canNext={canNext} onNext={onNext} onBack={onBack} />
    </div>
  )
}

// ─── Step 3: When ─────────────────────────────────────────────────────────────
function Step3({ draft, update, onNext, onBack }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const days = getNext7Days()
  const canNext = draft.isSpontaneous || (draft.date !== '' && draft.startTime !== '')
  const durations = [{ m: 30, l: '30 min' }, { m: 60, l: '1 uur' }, { m: 90, l: '1,5 uur' }, { m: 120, l: '2 uur' }]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SHeader step={3} onBack={onBack} />
      <STitle kicker="Stap 3 / 6" title="Wanneer?" sub="Kies dag en starttijd." />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {/* Spontaan toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: C.panel, borderRadius: 14, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, ...DM }}>⚡ Nu starten (Spontaan)</div>
            <div style={{ fontSize: 11, color: C.mute, fontWeight: 500, ...DM }}>Verloopt automatisch na 12 uur</div>
          </div>
          <Toggle on={draft.isSpontaneous} onChange={v => update({ isSpontaneous: v })} />
        </div>

        {!draft.isSpontaneous && (
          <>
            {/* Day strip */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8, ...DM }}>Dag</div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 0', scrollbarWidth: 'none' }}>
                {days.map(d => (
                  <button key={d.iso} onClick={() => update({ date: d.iso })} style={{
                    flexShrink: 0, width: 54, height: 72, borderRadius: 14,
                    background: draft.date === d.iso ? C.accent : C.panel,
                    color: draft.date === d.iso ? '#fff' : C.ink,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: draft.date === d.iso ? `0 6px 14px ${C.accent}44` : 'none',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, opacity: draft.date === d.iso ? 0.85 : 0.55, letterSpacing: 0.6, ...DM }}>{d.wd}</span>
                    <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, ...SYNE }}>{d.day}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, opacity: draft.date === d.iso ? 0.85 : 0.55, letterSpacing: 0.6, ...DM }}>{d.mo}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 16, background: C.panel, borderRadius: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, ...DM }}>Start</div>
                <input
                  type="time" value={draft.startTime}
                  onChange={e => update({ startTime: e.target.value })}
                  style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: -1, border: 'none', background: 'none', outline: 'none', width: '100%', padding: 0, ...DM, fontVariantNumeric: 'tabular-nums' }}
                />
                <div style={{ fontSize: 11, color: C.mute, fontWeight: 600, marginTop: 4, ...DM }}>Starttijd</div>
              </div>
              <div style={{ padding: 16, background: '#fff', borderRadius: 16, border: `1px dashed ${C.line}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, ...DM }}>Eind</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.muteSoft, letterSpacing: -0.5, ...DM }}>Optioneel</div>
                <div style={{ fontSize: 11, color: C.muteSoft, fontWeight: 600, marginTop: 6, ...DM }}>Via duur instellen</div>
              </div>
            </div>
          </>
        )}

        {/* Duration pills */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, ...DM }}>Duur</span>
            <span style={{ fontSize: 11, color: C.mute, fontWeight: 600, ...DM }}>Snel instellen</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {durations.map(d => (
              <button key={d.m} onClick={() => update({ durationMinutes: d.m })} style={{
                flex: 1, height: 38, borderRadius: 12, border: 'none',
                background: draft.durationMinutes === d.m ? C.ink : C.panel,
                color: draft.durationMinutes === d.m ? '#fff' : C.ink,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', ...DM,
              }}>{d.l}</button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div style={{ padding: '12px 14px', background: C.accentLight, borderRadius: 14, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 12, color: C.ink, fontWeight: 500, lineHeight: 1.4, margin: 0, ...DM }}>
            <b>Tip:</b> Meetups die 3–7 dagen van tevoren staan, halen de hoogste opkomst.
          </p>
        </div>
      </div>

      <SFooter canNext={canNext} onNext={onNext} onBack={onBack} />
    </div>
  )
}

// ─── Step 4: Level & Group ────────────────────────────────────────────────────
function Step4({ draft, update, onNext, onBack }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const levels = [
    { key: 'start' as const, emoji: '🌱', label: 'Start', sub: 'Rustig, kennismaken' },
    { key: 'mid'   as const, emoji: '🔥', label: 'Mid',   sub: "~5'30\"/km" },
    { key: 'fast'  as const, emoji: '⚡', label: 'Snel',  sub: "< 5'00\"/km" },
  ]
  const estMin = Math.round(draft.distanceKm * (draft.level === 'fast' ? 5.5 : draft.level === 'mid' ? 6.5 : 8))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SHeader step={4} onBack={onBack} />
      <STitle kicker="Stap 4 / 6" title="Niveau & groep" sub="Wie mag er meedoen, en hoe snel?" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {/* Level */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8, ...DM }}>Niveau</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {levels.map(l => (
              <button key={l.key} onClick={() => update({ level: l.key })} style={{
                padding: '14px 10px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: draft.level === l.key ? C.accent : C.panel,
                color: draft.level === l.key ? '#fff' : C.ink,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                boxShadow: draft.level === l.key ? `0 6px 14px ${C.accent}44` : 'none',
                transition: 'all 180ms ease',
              }}>
                <span style={{ fontSize: 22 }}>{l.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 800, ...SYNE }}>{l.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, opacity: draft.level === l.key ? 0.9 : 0.65, textAlign: 'center', ...DM }}>{l.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div style={{ padding: 14, background: C.panel, borderRadius: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink, ...DM }}>Afstand</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.accent, fontVariantNumeric: 'tabular-nums', ...DM }}>{draft.distanceKm} km</span>
          </div>
          <div style={{ fontSize: 11, color: C.mute, fontWeight: 500, marginBottom: 12, ...DM }}>
            ~{estMin} min bij {draft.level} tempo
          </div>
          <input
            type="range" min={1} max={40} value={draft.distanceKm}
            onChange={e => update({ distanceKm: Number(e.target.value) })}
            style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: C.mute, fontWeight: 600, ...DM }}>
            <span>1 km</span><span>20 km</span><span>40 km</span>
          </div>
        </div>

        {/* Max buddies */}
        <div style={{ padding: 14, background: C.panel, borderRadius: 14, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: C.mute, fontWeight: 600, ...DM }}>Max buddy's</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: -0.5, lineHeight: 1.1, ...SYNE }}>{draft.maxBuddies}</div>
              <div style={{ fontSize: 11, color: C.mute, fontWeight: 500, marginTop: 2, ...DM }}>Inclusief jij als host</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => update({ maxBuddies: Math.max(2, draft.maxBuddies - 1) })} style={{ width: 38, height: 38, borderRadius: 19, background: C.line, border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink, fontWeight: 500 }}>−</button>
              <button onClick={() => update({ maxBuddies: Math.min(20, draft.maxBuddies + 1) })} style={{ width: 38, height: 38, borderRadius: 19, background: C.accent, border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 500 }}>+</button>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div style={{ background: C.panel, borderRadius: 14, padding: '4px 14px', marginBottom: 20 }}>
          {[
            { key: 'ageFilter',    label: 'Leeftijdsfilter 18–35',          sub: 'Toon aan iedereen' },
            { key: 'verifiedOnly', label: "Enkel verified buddy's",           sub: 'Veiliger groep' },
            { key: 'isPrivate',    label: 'Privé (alleen op uitnodiging)',    sub: 'Niet zichtbaar op kaart' },
          ].map((t, i) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < 2 ? `1px solid ${C.line}` : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, ...DM }}>{t.label}</div>
                <div style={{ fontSize: 11, color: C.mute, fontWeight: 500, ...DM }}>{t.sub}</div>
              </div>
              <Toggle on={(draft as unknown as Record<string, boolean>)[t.key]} onChange={v => update({ [t.key]: v } as Partial<Draft>)} />
            </div>
          ))}
        </div>
      </div>

      <SFooter canNext={true} onNext={onNext} onBack={onBack} />
    </div>
  )
}

// ─── Step 5: Personalize ──────────────────────────────────────────────────────
function Step5({ draft, update, onNext, onBack }: { draft: Draft; update: (p: Partial<Draft>) => void; onNext: () => void; onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [suggIdx, setSuggIdx] = useState(0)
  const suggestions = INTROS[draft.sport] ?? INTROS.default
  const covers = COVERS[draft.sport] ?? COVERS.default
  const activeImage = draft.coverPreview ?? draft.coverSuggestion
  const canNext = !!activeImage && draft.introMessage.trim().length >= 10

  useEffect(() => {
    if (!draft.coverSuggestion && !draft.coverPreview) {
      update({ coverSuggestion: covers[0] })
    }
    if (!draft.introMessage) {
      update({ introMessage: suggestions[0] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    update({ coverFile: file, coverPreview: URL.createObjectURL(file), coverSuggestion: null })
  }

  function pickSuggestion(i: number) {
    setSuggIdx(i)
    update({ introMessage: suggestions[i] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SHeader step={5} onBack={onBack} />
      <STitle kicker="Stap 5 / 6" title="Personaliseer" sub="Laat zien wie jij bent en maak het persoonlijk." />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {/* Cover */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8, ...DM }}>Coverfoto</div>

          {activeImage ? (
            <div style={{ height: 160, borderRadius: 16, overflow: 'hidden', position: 'relative', marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)' }} />
              <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} style={{ width: '100%', height: 120, borderRadius: 16, background: C.panel, border: `2px dashed ${C.line}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l2-3h4l2 3"/>
              </svg>
              <span style={{ fontSize: 13, color: C.mute, fontWeight: 600, ...DM }}>Upload eigen foto</span>
            </button>
          )}

          {/* Thumbnail row */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {covers.map((u) => (
              <button key={u} onClick={() => update({ coverSuggestion: u, coverPreview: null, coverFile: null })} style={{
                flexShrink: 0, width: 72, height: 52, borderRadius: 10, overflow: 'hidden',
                padding: 0, cursor: 'pointer', border: `2px solid ${draft.coverSuggestion === u ? C.accent : 'transparent'}`,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
            <button onClick={() => fileRef.current?.click()} style={{ flexShrink: 0, width: 72, height: 52, borderRadius: 10, background: C.panel, border: `2px dashed ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>

        {/* Intro message */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 8, ...DM }}>Stel jezelf voor</div>

          <div style={{ display: 'flex', gap: 4, background: C.panel, padding: 3, borderRadius: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 30, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.ink, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', ...DM }}>✨ Suggesties</div>
            <div style={{ flex: 1, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.mute, ...DM }}>Pas zelf aan</div>
          </div>

          <div style={{ padding: '14px 16px', background: C.accent, borderRadius: 14, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: '#fff', fontWeight: 500, lineHeight: 1.45, margin: 0, ...DM }}>{suggestions[suggIdx]}</p>
          </div>

          {suggestions.length > 1 && (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 10 }}>
              {suggestions.map((_, i) => (
                <button key={i} onClick={() => pickSuggestion(i)} style={{ width: i === suggIdx ? 18 : 5, height: 5, borderRadius: 3, background: i === suggIdx ? C.accent : C.line, border: 'none', cursor: 'pointer', padding: 0, transition: 'width 200ms' }} />
              ))}
            </div>
          )}

          <textarea
            rows={3} value={draft.introMessage}
            onChange={e => update({ introMessage: e.target.value })}
            placeholder="Of schrijf je eigen intro…"
            style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: C.panel, border: 'none', outline: 'none', resize: 'none', fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.4, boxSizing: 'border-box', ...DM }}
          />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />
      <SFooter canNext={canNext} onNext={onNext} onBack={onBack} />
    </div>
  )
}

// ─── Step 6: Summary + Publish ────────────────────────────────────────────────
function Step6({ draft, update, onPublish, isPending, error, onBack }: {
  draft: Draft; update: (p: Partial<Draft>) => void
  onPublish: () => void; isPending: boolean; error: string | null; onBack: () => void
}) {
  const canPublish = draft.rulesAccepted && !isPending
  const activeImage = draft.coverPreview ?? draft.coverSuggestion
  const levelLabel = { start: 'Start', mid: 'Mid', fast: 'Snel' }[draft.level]
  const WD = ['zo','ma','di','wo','do','vr','za']
  const MO = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']

  let dateLabel = 'Nu · Spontaan'
  if (!draft.isSpontaneous && draft.date) {
    const d = new Date(draft.date + 'T00:00:00')
    dateLabel = `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]} · ${draft.startTime}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SHeader step={6} onBack={onBack} />
      <STitle kicker="Laatste stap" title="Bijna klaar…" sub="Check de samenvatting en publiceer." />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        {/* Preview card */}
        <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <div style={{ height: 100, position: 'relative', background: C.panel }}>
            {activeImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ position: 'absolute', top: 10, left: 12, height: 24, padding: '0 10px 0 6px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: C.accent, color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 0.5, ...DM }}>
              {draft.sportEmoji} {draft.sport.toUpperCase()} · {levelLabel.toUpperCase()}
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: '#fff' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, letterSpacing: -0.3, marginBottom: 4, ...SYNE }}>{draft.title}</div>
            <div style={{ fontSize: 12, color: C.mute, fontWeight: 600, marginBottom: 10, ...DM }}>
              {dateLabel} · {draft.location?.name ?? '?'} · max {draft.maxBuddies} buddy's
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 700, color: C.mute, ...DM }}>
              <span>{draft.distanceKm} km</span><span>·</span>
              <span>{levelLabel} tempo</span><span>·</span>
              <span>Gratis</span>
            </div>
          </div>
        </div>

        {/* Commercial toggle */}
        <div style={{ padding: '14px 16px', background: C.panel, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, ...DM }}>Is dit commercieel?</div>
            <div style={{ fontSize: 11, color: C.mute, fontWeight: 500, ...DM }}>Clinic of bootcamp? €95 ex. BTW.</div>
          </div>
          <Toggle on={draft.commercial} onChange={v => update({ commercial: v })} />
        </div>

        {/* Community rules */}
        <div style={{ padding: '14px 16px', background: C.panel, borderRadius: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 12, ...DM }}>Community-regels</div>
          {['Geen commerciële events zonder markering', 'Respectvol en inclusief', 'Geen promotie van andere platforms'].map(r => (
            <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: 16, height: 16, borderRadius: 8, background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <span style={{ fontSize: 12, color: C.ink, fontWeight: 500, lineHeight: 1.4, ...DM }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Agree */}
        <button onClick={() => update({ rulesAccepted: !draft.rulesAccepted })} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: `${C.accent}10`, borderRadius: 12,
          border: `1px solid ${draft.rulesAccepted ? C.accent + '55' : C.line}`,
          cursor: 'pointer', marginBottom: 8, textAlign: 'left', transition: 'border-color 160ms',
        }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: draft.rulesAccepted ? C.accent : C.line, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 160ms' }}>
            {draft.rulesAccepted && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>}
          </div>
          <span style={{ fontSize: 12, color: C.ink, fontWeight: 600, lineHeight: 1.4, ...DM }}>Ik ga akkoord met de Buddy-regels.</span>
        </button>

        {error && (
          <div style={{ padding: '12px 16px', background: '#FEF2F2', borderRadius: 12, marginBottom: 8, border: '1px solid #FCA5A5' }}>
            <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, margin: 0, ...DM }}>{error}</p>
          </div>
        )}
      </div>

      <SFooter
        next={isPending ? 'Aanmaken…' : 'Publiceer meetup 🚀'}
        canNext={canPublish}
        onNext={onPublish}
        onBack={onBack}
      />
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function NewMeetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(INIT)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function update(partial: Partial<Draft>) {
    setDraft(prev => ({ ...prev, ...partial }))
  }

  function goNext() { setStep(s => Math.min(6, s + 1)); setError(null) }
  function goBack() {
    if (step === 1) router.push('/dashboard/meetup')
    else setStep(s => s - 1)
  }

  function handlePublish() {
    startTransition(async () => {
      let coverImageUrl: string | undefined

      if (draft.coverFile) {
        try {
          const supabase = createClient()
          const ext = draft.coverFile.name.split('.').pop()
          const path = `${Date.now()}.${ext}`
          const { data: up, error: upErr } = await supabase.storage
            .from('meetup-covers')
            .upload(path, draft.coverFile, { contentType: draft.coverFile.type, upsert: false })
          if (!upErr && up) {
            const { data: { publicUrl } } = supabase.storage.from('meetup-covers').getPublicUrl(up.path)
            coverImageUrl = publicUrl
          }
        } catch { /* upload optional */ }
      } else if (draft.coverSuggestion) {
        coverImageUrl = draft.coverSuggestion
      }

      const parts = [draft.description, draft.introMessage].filter(Boolean)

      const res = await createMeetup({
        sport: draft.sport,
        title: draft.title,
        description: parts.join('\n\n') || undefined,
        locationName: draft.location!.name,
        latitude: draft.location!.lat,
        longitude: draft.location!.lon,
        city: draft.location!.city,
        isSpontaneous: draft.isSpontaneous,
        date: !draft.isSpontaneous ? draft.date : undefined,
        time: !draft.isSpontaneous ? draft.startTime : undefined,
        maxParticipants: draft.maxBuddies,
        visibility: draft.isPrivate ? 'alleen_buddies' : 'publiek',
        coverImageUrl,
      })

      if (res.success) {
        router.push('/dashboard/meetup')
      } else {
        setError(res.error ?? 'Er ging iets mis')
      }
    })
  }

  const props = { draft, update, onNext: goNext, onBack: goBack }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#fff', overflow: 'hidden' }}>
      <style>{`
        .spin-loader { animation: wizSpin 0.8s linear infinite; }
        @keyframes wizSpin { to { transform: rotate(360deg); } }
        input[type=range] { -webkit-appearance: none; height: 6px; border-radius: 3px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 3px solid ${C.accent}; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
        input[type=range]::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 3px solid ${C.accent}; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {step === 1 && <Step1 {...props} />}
      {step === 2 && <Step2 {...props} />}
      {step === 3 && <Step3 {...props} />}
      {step === 4 && <Step4 {...props} />}
      {step === 5 && <Step5 {...props} />}
      {step === 6 && <Step6 {...props} onPublish={handlePublish} isPending={isPending} error={error} />}
    </div>
  )
}
