'use client'

import { useState } from 'react'
import { CalendarDays, MapPin, Check, X, Download, Clock } from 'lucide-react'
import { respondToAppointment } from '../../chat-actions'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export type AppointmentData = {
  id: string
  proposed_by: string
  proposed_to: string
  sport: string | null
  location: string | null
  proposed_date: string
  notes: string | null
  status: 'pending' | 'accepted' | 'declined'
}

function formatAppointmentDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', {
    weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

function downloadIcs(appt: AppointmentData, myName: string, otherName: string) {
  const start = new Date(appt.proposed_date)
  const end   = new Date(start.getTime() + 90 * 60000) // 1.5 uur default

  function fmtIcs(d: Date) {
    return d.toISOString().replace(/[-:]/g, '').replace('.000', '')
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Buddys//NL',
    'BEGIN:VEVENT',
    `UID:${appt.id}@buddys.app`,
    `DTSTAMP:${fmtIcs(new Date())}`,
    `DTSTART:${fmtIcs(start)}`,
    `DTEND:${fmtIcs(end)}`,
    `SUMMARY:${appt.sport ?? 'Training'} met ${otherName}`,
    appt.location ? `LOCATION:${appt.location}` : '',
    appt.notes    ? `DESCRIPTION:${appt.notes.replace(/\n/g, '\\n')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([lines], { type: 'text/calendar' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `training-${otherName.replace(/\s/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

type Props = {
  appointment: AppointmentData
  currentUserId: string
  otherUserName: string
  fromMe: boolean
}

export function AppointmentCard({ appointment, currentUserId, otherUserName, fromMe }: Props) {
  const [status, setStatus] = useState(appointment.status)
  const [responding, setResponding] = useState(false)
  const canRespond = !fromMe && status === 'pending'

  async function respond(response: 'accepted' | 'declined') {
    setResponding(true)
    const result = await respondToAppointment(appointment.id, response)
    setResponding(false)
    if (!result.error) setStatus(response)
  }

  return (
    <div
      className={`max-w-[300px] rounded-2xl border overflow-hidden text-left ${
        fromMe ? 'rounded-br-sm' : 'rounded-bl-sm'
      }`}
      style={{
        backgroundColor: '#FFFAF5',
        borderColor: status === 'accepted' ? '#22c55e40' : status === 'declined' ? '#ef444440' : '#C4F54240',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{
          backgroundColor: status === 'accepted' ? '#f0fdf4' : status === 'declined' ? '#fef2f2' : '#FFF8F2',
          borderBottom: `1px solid ${status === 'accepted' ? '#22c55e20' : status === 'declined' ? '#ef444420' : '#C4F54220'}`,
        }}
      >
        <CalendarDays
          className="w-4 h-4 shrink-0"
          style={{ color: status === 'accepted' ? '#22c55e' : status === 'declined' ? '#ef4444' : '#C4F542' }}
        />
        <span style={{ ...SYNE, fontSize: 12, fontWeight: 800 }} className="text-gray-800">
          {fromMe ? `Afspraak voorstel aan ${otherUserName}` : `Afspraak voorstel van ${otherUserName}`}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {/* Sport */}
        {appointment.sport && (
          <p className="text-xs font-bold text-[#C4F542]">{appointment.sport}</p>
        )}

        {/* Datum */}
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-sm font-semibold">{formatAppointmentDate(appointment.proposed_date)}</span>
        </div>

        {/* Locatie */}
        {appointment.location && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-sm">{appointment.location}</span>
          </div>
        )}

        {/* Notities */}
        {appointment.notes && (
          <p className="text-xs text-gray-500 italic leading-relaxed pt-0.5">{appointment.notes}</p>
        )}
      </div>

      {/* Footer / Acties */}
      <div className="px-4 pb-3">
        {status === 'pending' && canRespond && (
          <div className="flex gap-2">
            <button
              disabled={responding}
              onClick={() => respond('declined')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Afwijzen
            </button>
            <button
              disabled={responding}
              onClick={() => respond('accepted')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Accepteren
            </button>
          </div>
        )}

        {status === 'pending' && !canRespond && (
          <p className="text-xs text-gray-400 text-center py-1">Wachten op reactie...</p>
        )}

        {status === 'accepted' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center py-1">
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-bold text-green-600">Afspraak geaccepteerd!</span>
            </div>
            <button
              onClick={() => downloadIcs(appointment, currentUserId, otherUserName)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#111] hover:bg-[#333] text-white text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Voeg toe aan agenda
            </button>
          </div>
        )}

        {status === 'declined' && (
          <div className="flex items-center gap-2 justify-center py-1">
            <X className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-500">Afspraak afgewezen</span>
          </div>
        )}
      </div>
    </div>
  )
}
