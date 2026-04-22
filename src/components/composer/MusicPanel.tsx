'use client'

import { useState } from 'react'
import { Music2, X } from 'lucide-react'

interface MusicPanelProps {
  value: string
  onChange: (v: string) => void
}

export default function MusicPanel({ value, onChange }: MusicPanelProps) {
  const [open, setOpen] = useState(false)
  const [artist, setArtist] = useState('')
  const [track, setTrack] = useState('')

  function handleTriggerClick() {
    if (value) {
      onChange('')
      return
    }
    setOpen((prev) => !prev)
  }

  function handleOk() {
    const trimmedArtist = artist.trim()
    const trimmedTrack = track.trim()
    if (trimmedArtist || trimmedTrack) {
      onChange(`${trimmedArtist} — ${trimmedTrack}`)
    }
    setOpen(false)
    setArtist('')
    setTrack('')
  }

  return (
    <div className="w-full" style={{ borderBottom: '1px solid #F5F2EE' }}>
      {/* Trigger row */}
      <button
        type="button"
        onClick={handleTriggerClick}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Music2 size={16} className="text-gray-400" />
          <span
            style={{ fontFamily: "'Syne', sans-serif" }}
            className="text-[14px] text-gray-700"
          >
            Muziek toevoegen
          </span>
        </div>

        <div className="flex items-center">
          {value ? (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#F0FDF4] text-[#16A34A] text-[12px] font-medium">
              <Music2 size={11} />
              <span className="max-w-[140px] truncate">{value}</span>
              <span
                role="button"
                aria-label="Muziek verwijderen"
                className="ml-0.5 hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange('')
                }}
              >
                <X size={11} />
              </span>
            </span>
          ) : (
            <Music2 size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded input area */}
      {open && !value && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Artiest"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full px-3 py-2 text-[14px] text-gray-700 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4F542]"
            style={{ borderColor: '#F5F2EE', backgroundColor: '#FAFAF7' }}
          />
          <input
            type="text"
            placeholder="Nummer"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleOk()}
            className="w-full px-3 py-2 text-[14px] text-gray-700 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#C4F542]"
            style={{ borderColor: '#F5F2EE', backgroundColor: '#FAFAF7' }}
          />
          <button
            type="button"
            onClick={handleOk}
            className="self-end px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4F542]"
            style={{ backgroundColor: '#C4F542', fontFamily: "'Syne', sans-serif" }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}
