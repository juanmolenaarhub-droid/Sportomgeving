'use client'

import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MeetupListItem } from '@/app/actions/meetups'

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#EC4899',
  'Voetbal': '#10B981', default: '#6B7280',
}
const SPORT_EMOJIS: Record<string, string> = {
  'Hardlopen': '🏃', 'Fietsen': '🚴', 'Zwemmen': '🏊', 'Gym': '💪',
  'Tennis': '🎾', 'Padel': '🏸', 'Voetbal': '⚽', 'Yoga': '🧘',
  'Wandelen': '🚶', 'Golf': '⛳', 'Boksen': '🥊', 'Klimmen': '🧗',
  default: '🏅',
}

function getSportColor(s: string) { return SPORT_COLORS[s] ?? SPORT_COLORS.default }
function getSportEmoji(s: string) { return SPORT_EMOJIS[s] ?? SPORT_EMOJIS.default }

function timeUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return hours > 0 ? `${hours}u ${mins}m` : `${mins} min`
}

function formatMeetupDate(date: string | null, time: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

type Props = {
  meetups: MeetupListItem[]
  center: [number, number]
  currentUserId: string
  onInterest: (meetupId: string) => void
}

export default function MeetupMap({ meetups, center, currentUserId, onInterest }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedMeetup = meetups.find(m => m.id === selectedId) ?? null

  return (
    <>
      <style>{`
        @keyframes meetup-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6), 0 2px 8px rgba(0,0,0,0.25); }
          70% { box-shadow: 0 0 0 10px rgba(239,68,68,0), 0 2px 8px rgba(0,0,0,0.25); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0), 0 2px 8px rgba(0,0,0,0.25); }
        }
        .meetup-pill { cursor: pointer; user-select: none; transition: transform 0.15s, opacity 0.15s; }
        .meetup-pill:hover { transform: scale(1.08); opacity: 0.95; }
        .meetup-popup .mapboxgl-popup-content {
          padding: 0; border-radius: 16px; overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18); border: 1px solid rgba(0,0,0,0.07);
          font-family: 'DM Sans', sans-serif; min-width: 260px;
        }
        .meetup-popup .mapboxgl-popup-tip { border-top-color: #fff; }
        .meetup-popup .mapboxgl-popup-close-button { display: none; }
      `}</style>

      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: center[1], latitude: center[0], zoom: 13 }}
        style={{ width: '100%', height: '100%', borderRadius: 16 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={() => setSelectedId(null)}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {meetups.map(m => {
          const color = getSportColor(m.sport)
          const emoji = getSportEmoji(m.sport)
          const shortTitle = m.title.length > 18 ? m.title.slice(0, 16) + '…' : m.title
          const isSelected = m.id === selectedId

          return (
            <Marker
              key={m.id}
              longitude={m.longitude}
              latitude={m.latitude}
              anchor="bottom"
              onClick={(e: { originalEvent: MouseEvent }) => { e.originalEvent.stopPropagation(); setSelectedId(m.id) }}
            >
              <div
                className="meetup-pill"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  height: 32, padding: '0 10px', borderRadius: 20,
                  background: color, color: '#fff',
                  fontSize: 12, fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: m.isSpontaneous
                    ? '0 0 0 0 rgba(239,68,68,0.6), 0 2px 8px rgba(0,0,0,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.25)',
                  animation: m.isSpontaneous ? 'meetup-pulse 2s infinite' : 'none',
                  outline: isSelected ? `3px solid ${color}` : 'none',
                  outlineOffset: 2,
                  transform: isSelected ? 'scale(1.1)' : undefined,
                }}
              >
                <span>{emoji}</span>
                <span>{shortTitle}</span>
              </div>
            </Marker>
          )
        })}

        {selectedMeetup && (
          <Popup
            longitude={selectedMeetup.longitude}
            latitude={selectedMeetup.latitude}
            anchor="bottom"
            onClose={() => setSelectedId(null)}
            closeButton={false}
            offset={[0, -8] as [number, number]}
            className="meetup-popup"
            maxWidth="300px"
          >
            <PopupContent
              meetup={selectedMeetup}
              currentUserId={currentUserId}
              onInterest={() => { setSelectedId(null); onInterest(selectedMeetup.id) }}
            />
          </Popup>
        )}
      </Map>
    </>
  )
}

function PopupContent({
  meetup, currentUserId, onInterest
}: {
  meetup: MeetupListItem
  currentUserId: string
  onInterest: () => void
}) {
  const color = getSportColor(meetup.sport)
  const spotsLeft = meetup.maxParticipants - meetup.acceptedCount

  const dateLabel = meetup.isSpontaneous
    ? `⚡ Spontaan — verloopt over ${timeUntilExpiry(meetup.expiresAt ?? '')}`
    : formatMeetupDate(meetup.date, meetup.time)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sport-color header */}
      <div style={{ background: color, padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{meetup.sport}</span>
        {meetup.status === 'vol' && (
          <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>Vol</span>
        )}
        {meetup.isSpontaneous && (
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999, marginLeft: 'auto' }}>⚡ Nu</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px 12px' }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: '0 0 5px', lineHeight: 1.3 }}>{meetup.title}</p>

        {dateLabel && (
          <p style={{ fontSize: 11, color: meetup.isSpontaneous ? '#ef4444' : '#6b7280', margin: '0 0 3px', fontWeight: meetup.isSpontaneous ? 700 : 400 }}>
            {dateLabel}
          </p>
        )}

        <p style={{ fontSize: 11, color: '#374151', margin: '0 0 3px' }}>📍 {meetup.locationName}</p>
        <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 8px' }}>
          👤 <strong>{meetup.creatorName}</strong>
          {' · '}{meetup.acceptedCount}/{meetup.maxParticipants} deelnemers
          {spotsLeft > 0 && <span style={{ color: '#059669', fontWeight: 700 }}> · {spotsLeft} plekken</span>}
        </p>

        {/* Footer actions */}
        {meetup.myStatus === 'geaccepteerd' ? (
          <a
            href="/dashboard/messages?tab=meetups"
            style={{ display: 'block', background: '#111', color: '#fff', textAlign: 'center', padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
          >
            Bekijk chat →
          </a>
        ) : meetup.myStatus === 'interesse' ? (
          <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', margin: '4px 0 0' }}>Wacht op acceptatie...</p>
        ) : meetup.status === 'open' && meetup.creatorId !== currentUserId ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button
              onClick={onInterest}
              style={{ flex: 1, background: color, color: '#fff', border: 'none', padding: '7px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Interesse tonen
            </button>
            <a
              href={`/dashboard/meetup/${meetup.id}`}
              style={{ flex: 1, display: 'block', textAlign: 'center', background: '#f3f4f6', color: '#374151', padding: '7px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
            >
              Details →
            </a>
          </div>
        ) : (
          <a
            href={`/dashboard/meetup/${meetup.id}`}
            style={{ display: 'block', textAlign: 'center', fontSize: 12, color: color, fontWeight: 600, textDecoration: 'none', marginTop: 4 }}
          >
            Bekijk details →
          </a>
        )}
      </div>
    </div>
  )
}
