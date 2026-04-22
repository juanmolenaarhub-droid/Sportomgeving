'use client'

import { useState } from 'react'
import { X, CalendarDays, MapPin, Clock, FileText } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export type AfspraakFormData = {
  location: string
  proposedDate: string  // ISO datetime-local string
  notes: string
}

type Props = {
  sport: string | null
  otherUserName: string
  onClose: () => void
  onSubmit: (data: AfspraakFormData) => Promise<void>
}

export function AfspraakModal({ sport, otherUserName, onClose, onSubmit }: Props) {
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Minimum: nu + 1 uur
  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!location.trim() || !date) return
    setSubmitting(true)
    try {
      await onSubmit({ location: location.trim(), proposedDate: date, notes: notes.trim() })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(17,17,17,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#F4F1E8] w-full sm:max-w-[400px] sm:rounded-[14px] rounded-t-[20px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-black/8">
          <div>
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 18, color: '#1E2B20' }}>
              Training plannen
            </h2>
            <p style={{ fontSize: 13 }} className="text-gray-400 mt-1">
              Stel een afspraak voor met {otherUserName}
              {sport && <span className="text-[#C4F542] font-semibold"> · {sport}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-black/8 rounded-full flex items-center justify-center hover:bg-black/12 transition-colors shrink-0 ml-3 mt-0.5"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Locatie */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              <MapPin className="w-3.5 h-3.5" /> Locatie
            </label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="bijv. Sportpark De Meer, Amsterdam"
              maxLength={100}
              required
              className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/30"
            />
          </div>

          {/* Datum & tijd */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              <Clock className="w-3.5 h-3.5" /> Datum & tijd
            </label>
            <input
              type="datetime-local"
              value={date}
              min={minDate}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/30"
            />
          </div>

          {/* Notities */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              <FileText className="w-3.5 h-3.5" /> Notitie <span className="normal-case font-normal text-gray-400">(optioneel)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 200))}
              placeholder="bijv. Breng een bal mee, parkeer bij ingang Noord..."
              rows={2}
              className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/30 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600 hover:bg-black/5 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!location.trim() || !date || submitting}
              style={SYNE}
              className="flex-1 py-3 rounded-xl bg-[#C4F542] text-white text-sm font-bold hover:bg-[#d06a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              {submitting ? 'Sturen...' : 'Stel voor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
