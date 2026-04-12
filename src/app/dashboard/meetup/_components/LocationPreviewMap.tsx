'use client'

import { useEffect, useRef } from 'react'

type Props = { lat: number; lon: number }

export default function LocationPreviewMap({ lat, lon }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    import('leaflet').then(L => {
      if (!mapRef.current) return

      // Verwijder vorige instantie
      if (instanceRef.current) {
        instanceRef.current.remove()
        instanceRef.current = null
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        keyboard: false,
      }).setView([lat, lon], 15)

      instanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 19,
      }).addTo(map)

      L.marker([lat, lon]).addTo(map)
    })

    return () => {
      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null }
    }
  }, [lat, lon])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
