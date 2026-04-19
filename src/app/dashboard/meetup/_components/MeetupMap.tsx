'use client'

import { useState } from 'react'
import Map, { Marker, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MeetupListItem } from '@/app/actions/meetups'
import MeetupMapPin from './MeetupMapPin'
import MeetupPopupCard from './MeetupPopupCard'

type Props = {
  meetups: MeetupListItem[]
  center: [number, number]
  currentUserId: string
  onInterestSuccess: (meetupId: string) => void
  onDetailsClick: (meetupId: string) => void
}

export default function MeetupMap({ meetups, center, currentUserId, onInterestSuccess, onDetailsClick }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedMeetup = meetups.find(m => m.id === selectedId) ?? null

  function handleDetailsClick(meetupId: string) {
    setSelectedId(null)
    onDetailsClick(meetupId)
  }

  return (
    <>
      <style>{`
        .meetup-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 36px rgba(0,0,0,0.18);
          border: 1px solid rgba(0,0,0,0.07);
        }
        .meetup-popup .mapboxgl-popup-tip { display: none; }
        .meetup-popup .mapboxgl-popup-close-button { display: none; }
      `}</style>

      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: center[1], latitude: center[0], zoom: 13 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={() => setSelectedId(null)}
        touchZoomRotate={true}
        dragRotate={false}
      >

        {meetups.filter(m => m.latitude != null && m.longitude != null).map(m => (
          <Marker
            key={m.id}
            longitude={m.longitude}
            latitude={m.latitude}
            anchor="bottom"
            onClick={(e: { originalEvent: MouseEvent }) => {
              e.originalEvent.stopPropagation()
              setSelectedId(prev => prev === m.id ? null : m.id)
            }}
          >
            <MeetupMapPin
              sport={m.sport}
              isSpontaneous={m.isSpontaneous}
              isSelected={selectedId === m.id}
              onClick={() => {}}
            />
          </Marker>
        ))}

        {selectedMeetup && selectedMeetup.latitude != null && selectedMeetup.longitude != null && (
          <Popup
            longitude={selectedMeetup.longitude}
            latitude={selectedMeetup.latitude}
            anchor="bottom"
            onClose={() => setSelectedId(null)}
            closeButton={false}
            closeOnClick={false}
            offset={[0, -52] as [number, number]}
            className="meetup-popup"
            maxWidth="320px"
          >
            <MeetupPopupCard
              meetup={selectedMeetup}
              currentUserId={currentUserId}
              userLat={center[0]}
              userLon={center[1]}
              onClose={() => setSelectedId(null)}
              onInterestSuccess={onInterestSuccess}
              onDetailsClick={handleDetailsClick}
            />
          </Popup>
        )}
      </Map>
    </>
  )
}
