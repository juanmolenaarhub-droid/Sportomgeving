'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, X } from 'lucide-react'

interface LocationPanelProps {
  value: string
  lat: number | null
  lng: number | null
  onChange: (name: string, lat: number, lng: number) => void
  onClear: () => void
}

interface MapboxFeature {
  place_name: string
  center: [number, number]
}

interface MapboxResponse {
  features: MapboxFeature[]
}

export default function LocationPanel({ value, onChange, onClear }: LocationPanelProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
  const hasToken = token.length > 0

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MapboxFeature[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!hasToken || query.trim().length < 2) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query.trim()
        )}.json?access_token=${token}&country=nl&language=nl&limit=5`
        const res = await fetch(url)
        const data: MapboxResponse = await res.json()
        setResults(data.features ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, token, hasToken])

  function handleTriggerClick() {
    if (value) {
      onClear()
      return
    }
    setOpen((prev) => !prev)
  }

  function handleSelect(feature: MapboxFeature) {
    const [featureLng, featureLat] = feature.center
    onChange(feature.place_name, featureLat, featureLng)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  function splitPlaceName(placeName: string): { main: string; context: string } {
    const idx = placeName.indexOf(',')
    if (idx === -1) return { main: placeName, context: '' }
    return {
      main: placeName.slice(0, idx).trim(),
      context: placeName.slice(idx + 1).trim(),
    }
  }

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <div className="w-full" style={{ borderBottom: '1px solid #F5F2EE' }}>
      {/* Trigger row */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" />
          <span
            style={{ fontFamily: "'Syne', sans-serif" }}
            className="text-[14px] text-gray-700"
          >
            {value ? `📍 ${value}` : 'Locatie toevoegen'}
          </span>
        </div>

        <div className="flex items-center">
          {value ? (
            <span
              role="button"
              aria-label="Locatie verwijderen"
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
            >
              <X size={16} />
            </span>
          ) : (
            <MapPin size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded search area */}
      {open && !value && (
        <div className="px-4 pb-3 flex flex-col gap-1">
          {hasToken ? (
            <>
              <input
                ref={inputRef}
                type="text"
                placeholder="Zoek een locatie..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-2 text-[14px] text-gray-700 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4F542]"
                style={{ borderColor: '#F5F2EE', backgroundColor: '#FAFAF7' }}
              />

              {loading && (
                <p className="text-[12px] text-gray-400 px-1 py-1">Zoeken…</p>
              )}

              {!loading && results.length > 0 && (
                <ul className="mt-1 rounded-lg overflow-hidden border" style={{ borderColor: '#F5F2EE' }}>
                  {results.map((feature, i) => {
                    const { main, context } = splitPlaceName(feature.place_name)
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => handleSelect(feature)}
                          className="w-full flex flex-col items-start px-3 py-2.5 hover:bg-[#FAFAF7] transition-colors text-left focus:outline-none"
                          style={{ borderBottom: i < results.length - 1 ? '1px solid #F5F2EE' : undefined }}
                        >
                          <span className="text-[13px] font-semibold text-gray-800">{main}</span>
                          {context && (
                            <span className="text-[12px] text-gray-400">{context}</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-[12px] text-gray-400 px-1 py-1">Geen resultaten gevonden.</p>
              )}
            </>
          ) : (
            /* Fallback: plain text input when no Mapbox token */
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Locatienaam"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    onChange(query.trim(), 0, 0)
                    setOpen(false)
                    setQuery('')
                  }
                }}
                className="flex-1 px-3 py-2 text-[14px] text-gray-700 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4F542]"
                style={{ borderColor: '#F5F2EE', backgroundColor: '#FAFAF7' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (query.trim()) {
                    onChange(query.trim(), 0, 0)
                    setOpen(false)
                    setQuery('')
                  }
                }}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none"
                style={{ backgroundColor: '#C4F542', fontFamily: "'Syne', sans-serif" }}
              >
                OK
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
