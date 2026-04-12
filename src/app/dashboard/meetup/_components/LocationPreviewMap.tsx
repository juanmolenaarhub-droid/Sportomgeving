'use client'

import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

type Props = { lat: number; lon: number }

export default function LocationPreviewMap({ lat, lon }: Props) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ longitude: lon, latitude: lat, zoom: 15 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      scrollZoom={false}
      dragPan={false}
      dragRotate={false}
      doubleClickZoom={false}
      touchZoomRotate={false}
      keyboard={false}
      attributionControl={false}
    >
      <Marker longitude={lon} latitude={lat} anchor="bottom">
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: '#E87722', border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }} />
      </Marker>
    </Map>
  )
}
