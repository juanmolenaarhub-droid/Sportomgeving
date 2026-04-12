'use client'

import { useEffect, useRef } from 'react'
import type { MeetupListItem } from '@/app/actions/meetups'

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722',
  'Fietsen': '#3B82F6',
  'Zwemmen': '#06B6D4',
  'Gym': '#22C55E',
  'Tennis': '#8B5CF6',
  'Padel': '#8B5CF6',
  default: '#6B7280',
}

function getSportColor(sport: string) {
  return SPORT_COLORS[sport] ?? SPORT_COLORS.default
}

function makeIcon(color: string, pulse: boolean) {
  const pulse_css = pulse ? `
    @keyframes meetup-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.7; }
    }
    .pulse-ring {
      animation: meetup-pulse 1.5s ease-in-out infinite;
    }
  ` : ''

  return `
    <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <style>${pulse_css}</style>
      <g class="${pulse ? 'pulse-ring' : ''}">
        <ellipse cx="18" cy="40" rx="6" ry="2.5" fill="rgba(0,0,0,0.15)"/>
        <path d="M18 0 C8 0 0 8 0 18 C0 30 18 44 18 44 C18 44 36 30 36 18 C36 8 28 0 18 0Z" fill="${color}"/>
        <circle cx="18" cy="18" r="8" fill="white" opacity="0.9"/>
      </g>
    </svg>
  `
}

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

type Props = {
  meetups: MeetupListItem[]
  center: [number, number]
  currentUserId: string
  onInterest: (meetupId: string) => void
}

export default function MeetupMap({ meetups, center, currentUserId, onInterest }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamisch importeren om SSR-fouten te voorkomen
    import('leaflet').then(L => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Fix standaard Leaflet icon paden voor Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true }).setView(center, 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      meetups.forEach(meetup => {
        const color = getSportColor(meetup.sport)
        const isPulse = meetup.isSpontaneous
        const svgIcon = L.divIcon({
          html: makeIcon(color, isPulse),
          className: '',
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -44],
        })

        const spotsLeft = meetup.maxParticipants - meetup.acceptedCount
        const dateLabel = meetup.isSpontaneous
          ? `<span style="color:#ef4444;font-weight:700">⚡ Spontaan — verloopt over ${timeUntilExpiry(meetup.expiresAt ?? '')}</span>`
          : `<span style="color:#6b7280">${formatMeetupDate(meetup.date, meetup.time) ?? ''}</span>`

        let actionBtn = ''
        if (meetup.myStatus === 'geaccepteerd') {
          actionBtn = `<a href="/dashboard/messages?tab=meetups" style="display:block;margin-top:10px;background:#111;color:#fff;text-align:center;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none">Bekijk chat →</a>`
        } else if (meetup.myStatus === 'interesse') {
          actionBtn = `<p style="margin-top:10px;font-size:12px;color:#9ca3af;font-style:italic">Wacht op acceptatie...</p>`
        } else if (meetup.status === 'open' && meetup.creatorId !== currentUserId) {
          actionBtn = `<button data-meetup-id="${meetup.id}" class="meetup-interest-btn" style="margin-top:10px;width:100%;background:#E87722;color:#fff;border:none;padding:8px 12px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">Interesse tonen</button>`
        }

        const popup = L.popup({ maxWidth: 280, className: 'meetup-popup' }).setContent(`
          <div style="font-family:'DM Sans',sans-serif;padding:4px 2px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px">${meetup.sport}</span>
              ${meetup.status === 'vol' ? `<span style="background:#fef3c7;color:#d97706;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px">Vol</span>` : ''}
            </div>
            <p style="font-size:15px;font-weight:800;color:#111;margin:0 0 4px">${meetup.title}</p>
            <p style="font-size:12px;color:#6b7280;margin:0 0 4px">${dateLabel}</p>
            <p style="font-size:12px;color:#374151;margin:0 0 6px">📍 ${meetup.locationName}</p>
            <p style="font-size:12px;color:#6b7280;margin:0 0 4px">
              👤 <strong>${meetup.creatorName}</strong>
            </p>
            <p style="font-size:12px;color:#6b7280;margin:0">
              ${meetup.acceptedCount} geaccepteerd / ${meetup.maxParticipants} max
              ${meetup.interestedCount > 0 ? ` · ${meetup.interestedCount} geïnteresseerd` : ''}
              ${spotsLeft > 0 ? ` · <strong style="color:#059669">${spotsLeft} plekken over</strong>` : ''}
            </p>
            ${actionBtn}
            <a href="/dashboard/meetup/${meetup.id}" style="display:block;margin-top:6px;text-align:center;font-size:12px;color:#E87722;font-weight:600;text-decoration:none">Bekijk details →</a>
          </div>
        `)

        const marker = L.marker([meetup.latitude, meetup.longitude], { icon: svgIcon })
          .addTo(map)
          .bindPopup(popup)

        marker.on('popupopen', () => {
          const btn = document.querySelector(`[data-meetup-id="${meetup.id}"]`) as HTMLButtonElement | null
          if (btn) {
            btn.addEventListener('click', () => {
              map.closePopup()
              onInterest(meetup.id)
            })
          }
        })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // Eenmalig mounten

  // Update markers wanneer meetups veranderen — herlaad kaart
  useEffect(() => {
    if (!mapInstanceRef.current) return
    // Simpele aanpak: reload kaart bij filter-wijzigingen
  }, [meetups])

  return (
    <>
      <style>{`
        .leaflet-container { font-family: 'DM Sans', sans-serif; }
        .meetup-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.06);
          background: #FAFAF8;
        }
        .meetup-popup .leaflet-popup-tip { background: #FAFAF8; }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
    </>
  )
}
