'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    google: typeof google
    initPlacesAutocomplete?: () => void
  }
}

type PlacesInputProps = {
  value: string
  onChange: (value: string, lat?: number, lng?: number) => void
  placeholder?: string
  className?: string
  hasError?: boolean
}

export function PlacesInput({ value, onChange, placeholder = 'Amsterdam', className = '', hasError = false }: PlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [, setLoaded] = useState(false)

  function initAutocomplete() {
    if (!inputRef.current || !window.google?.maps?.places) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'nl' },
      types: ['(cities)'],
      fields: ['name', 'geometry'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current!.getPlace()
      const name = place.name ?? ''
      const lat  = place.geometry?.location?.lat()
      const lng  = place.geometry?.location?.lng()
      onChange(name, lat, lng)
    })
  }

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    if (window.google?.maps?.places) {
      initAutocomplete()
      setLoaded(true)
      return
    }

    if (document.querySelector('#google-maps-script')) {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(interval)
          initAutocomplete()
          setLoaded(true)
        }
      }, 100)
      return () => clearInterval(interval)
    }

    window.initPlacesAutocomplete = () => {
      initAutocomplete()
      setLoaded(true)
    }

    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initPlacesAutocomplete`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const borderColor = hasError ? '#ef4444' : 'var(--ob-border, #E5E5E5)'

  return (
    <>
      <style>{`
        .pac-container {
          border: 1.5px solid #E5E5E5;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          margin-top: 4px;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          z-index: 9999;
        }
        .pac-item {
          padding: 10px 14px;
          font-size: 13px;
          color: #333;
          cursor: pointer;
          border-top: 1px solid #F0F0F0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pac-item:first-child { border-top: none; }
        .pac-item:hover { background: #F9F9F9; }
        .pac-item-selected { background: #FFF5EE; }
        .pac-icon { display: none; }
        .pac-item-query { font-weight: 600; color: #111; font-size: 13px; }
        .pac-matched { color: #E87722; }
      `}</style>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`ob-field ${className}`}
        style={{ borderColor }}
        autoComplete="off"
      />
    </>
  )
}
