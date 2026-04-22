'use client'

import { useState } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#C4F542', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#EC4899',
  'Voetbal': '#10B981', default: '#6B7280',
}
const SPORT_EMOJIS: Record<string, string> = {
  'Hardlopen': '🏃', 'Fietsen': '🚴', 'Zwemmen': '🏊', 'Gym': '💪',
  'Tennis': '🎾', 'Padel': '🏸', 'Voetbal': '⚽', default: '🏅',
}

type MeetupPin = {
  id: string; sport: string; title: string; city: string
  latitude: number; longitude: number; status: string; is_spontaneous: boolean
}
type Props = { meetups: MeetupPin[] }

export default function AdminMeetupMap({ meetups }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = meetups.find(m => m.id === selectedId)

  return (
    <>
      <style>{`
        .admin-popup .mapboxgl-popup-content {
          padding: 0; border-radius: 12px; overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.07);
          font-family: 'DM Sans', sans-serif;
        }
        .admin-popup .mapboxgl-popup-close-button { display: none; }
      `}</style>

      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: 5.3, latitude: 52.3, zoom: 7 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={() => setSelectedId(null)}
        attributionControl={false}
      >
        {meetups.map(m => {
          const color = SPORT_COLORS[m.sport] ?? SPORT_COLORS.default
          const emoji = SPORT_EMOJIS[m.sport] ?? SPORT_EMOJIS.default
          const shortTitle = m.title.length > 16 ? m.title.slice(0, 14) + '…' : m.title
          return (
            <Marker
              key={m.id}
              longitude={m.longitude}
              latitude={m.latitude}
              anchor="bottom"
              onClick={(e: { originalEvent: MouseEvent }) => { e.originalEvent.stopPropagation(); setSelectedId(m.id) }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                height: 28, padding: '0 8px', borderRadius: 20,
                background: color, color: '#fff',
                fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
                cursor: 'pointer', transition: 'transform 0.15s',
              }}>
                <span>{emoji}</span>
                <span>{shortTitle}</span>
              </div>
            </Marker>
          )
        })}

        {selected && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            anchor="bottom"
            onClose={() => setSelectedId(null)}
            closeButton={false}
            offset={[0, -8] as [number, number]}
            className="admin-popup"
            maxWidth="240px"
          >
            <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ background: SPORT_COLORS[selected.sport] ?? SPORT_COLORS.default, padding: '8px 12px' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{selected.sport}</span>
                {selected.is_spontaneous && <span style={{ marginLeft: 6, fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>⚡ Spontaan</span>}
              </div>
              <div style={{ padding: '8px 12px 10px' }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#1E2B20', margin: '0 0 4px' }}>{selected.title}</p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>📍 {selected.city}</p>
                <a
                  href={`/dashboard/meetup/${selected.id}`}
                  style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#C4F542', fontWeight: 600, textDecoration: 'none' }}
                >
                  Bekijk →
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </>
  )
}
