'use client'

import { useEffect, useRef } from 'react'

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#8B5CF6', default: '#6B7280',
}

type Props = {
  meetups: {
    id: string; sport: string; title: string; city: string
    latitude: number; longitude: number; status: string; is_spontaneous: boolean
  }[]
}

export default function AdminMeetupMap({ meetups }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return

    import('leaflet').then(L => {
      if (!mapRef.current || instanceRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Centreer op Nederland
      const map = L.map(mapRef.current!, { zoomControl: true }).setView([52.3, 5.3], 7)
      instanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      meetups.forEach(m => {
        const color = SPORT_COLORS[m.sport] ?? SPORT_COLORS.default
        const svg = `<svg width="28" height="34" viewBox="0 0 28 34" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.3 0 0 6.3 0 14C0 23.3 14 34 14 34C14 34 28 23.3 28 14C28 6.3 21.7 0 14 0Z" fill="${color}"/>
          <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
        </svg>`

        const icon = L.divIcon({ html: svg, className: '', iconSize: [28, 34], iconAnchor: [14, 34], popupAnchor: [0, -34] })

        L.marker([m.latitude, m.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'DM Sans',sans-serif;padding:2px">
              <span style="background:${color};color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px">${m.sport}</span>
              <p style="font-weight:800;font-size:13px;margin:5px 0 2px">${m.title}</p>
              <p style="font-size:11px;color:#6b7280">📍 ${m.city}</p>
              <a href="/dashboard/meetup/${m.id}" style="font-size:11px;color:#E87722;font-weight:600">Bekijk →</a>
            </div>
          `)
      })
    })

    return () => {
      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null }
    }
  }, [])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
