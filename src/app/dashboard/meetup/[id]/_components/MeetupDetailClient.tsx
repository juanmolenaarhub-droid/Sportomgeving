'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ArrowLeft, MapPin, Calendar, Clock, Zap, Check, X, MessageCircle,
  AlertTriangle, Send, Crown,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'

import { respondToInterest, leaveMeetup, cancelMeetup, sendMeetupMessage } from '@/app/actions/meetups'
import InterestModal from '../../_components/InterestModal'
import { createClient } from '@/lib/supabase'

const LocationPreviewMap = dynamic(() => import('../../_components/LocationPreviewMap'), { ssr: false })

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#8B5CF6', default: '#6B7280',
}
function getSportColor(sport: string) { return SPORT_COLORS[sport] ?? SPORT_COLORS.default }

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function timeUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return hours > 0 ? `${hours}u ${mins}m` : `${mins} min`
}

function formatDate(date: string | null, time: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'Zojuist'
  if (mins < 60) return `${mins} min geleden`
  if (hours < 24) return `${hours} uur geleden`
  return `${Math.floor(diff / 86400000)} dagen geleden`
}

type ChatMsg = { id: string; sender_id: string; content: string; created_at: string; is_system: boolean }
type Participant = { user_id: string; status: string; message: string | null; name: string; avatarUrl: string | null; joined_at: string }

type Props = {
  detail: {
    meetup: any
    creator: any
    participants: Participant[]
    isCreator: boolean
    myStatus: string | null
    currentUserId: string | null
  }
}

export default function MeetupDetailClient({ detail: initialDetail }: Props) {
  const [detail] = useState(initialDetail)
  const { meetup, creator, isCreator, currentUserId } = detail
  const [participants, setParticipants] = useState(initialDetail.participants)
  const [myStatus, setMyStatus] = useState(initialDetail.myStatus)

  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [showInterest, setShowInterest] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [newMsg, setNewMsg] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const color = getSportColor(meetup.sport)
  const accepted = participants.filter(p => p.status === 'geaccepteerd')
  const interested = participants.filter(p => p.status === 'interesse')
  const spotsLeft = meetup.max_participants - accepted.length
  const hasAccess = isCreator || myStatus === 'geaccepteerd'

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Laad + abonneer op chat
  useEffect(() => {
    if (!hasAccess) return

    async function loadMessages() {
      const { data } = await supabase
        .from('meetup_messages')
        .select('id, sender_id, content, created_at, is_system')
        .eq('meetup_id', meetup.id)
        .order('created_at', { ascending: true })
      setChatMessages(data ?? [])
    }
    loadMessages()

    const channel = supabase
      .channel(`meetup-chat-${meetup.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meetup_messages', filter: `meetup_id=eq.${meetup.id}` },
        payload => setChatMessages(prev => [...prev, payload.new as ChatMsg])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [hasAccess, meetup.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function handleRespond(userId: string, response: 'geaccepteerd' | 'geweigerd') {
    startTransition(async () => {
      await respondToInterest(meetup.id, userId, response)
      setParticipants(prev => prev.map(p => p.user_id === userId ? { ...p, status: response } : p))
      showToast(response === 'geaccepteerd' ? 'Deelnemer geaccepteerd!' : 'Deelnemer geweigerd')
    })
  }

  function handleLeave() {
    startTransition(async () => {
      await leaveMeetup(meetup.id)
      setMyStatus(null)
      setParticipants(prev => prev.filter(p => p.user_id !== currentUserId))
      showToast('Je hebt de meetup verlaten')
    })
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelMeetup(meetup.id)
      showToast('Meetup geannuleerd')
      setShowCancel(false)
    })
  }

  function handleSendMessage() {
    if (!newMsg.trim()) return
    const content = newMsg.trim()
    setNewMsg('')
    startTransition(async () => {
      await sendMeetupMessage(meetup.id, content)
    })
  }

  // ICS export
  function downloadIcs() {
    const start = new Date(`${meetup.date}T${meetup.time ?? '00:00'}:00`)
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${fmt(start)}\nDTEND:${fmt(end)}\nSUMMARY:${meetup.title}\nLOCATION:${meetup.location_name}\nDESCRIPTION:${meetup.description ?? ''}\nEND:VEVENT\nEND:VCALENDAR`
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'meetup.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  // Sendermap voor chat (creator + geaccepteerde deelnemers)
  const senderMap: Record<string, string> = {}
  if (creator) senderMap[creator.id] = creator.full_name ?? creator.username ?? 'Organisator'
  for (const p of accepted) senderMap[p.user_id] = p.name

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Terug */}
      <Link href="/dashboard/meetup" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug naar meetups
      </Link>

      {/* Hero header */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="h-2" style={{ background: color }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ background: color }}>{meetup.sport}</span>
                {meetup.is_spontaneous ? (
                  <span className="text-xs font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Spontaan — verloopt over {timeUntilExpiry(meetup.expires_at)}
                  </span>
                ) : meetup.date ? (
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(meetup.date, meetup.time)}
                  </span>
                ) : null}
                {meetup.status === 'vol' && <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">Vol</span>}
                {meetup.status === 'geannuleerd' && <span className="text-xs font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-full">Geannuleerd</span>}
              </div>
              <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: '#111', lineHeight: 1.2 }}>{meetup.title}</h1>
            </div>
          </div>

          {meetup.description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{meetup.description}</p>
          )}

          {/* Creator */}
          <div className="flex items-center gap-3 mt-4 p-3 bg-gray-50 rounded-xl">
            <Avatar name={creator?.full_name ?? 'O'} imageUrl={creator?.avatar_url} size="sm" />
            <div>
              <p className="text-xs text-gray-500">Organisator</p>
              <p className="text-sm font-bold text-black flex items-center gap-1">
                <Crown className="w-3 h-3 text-[#E87722]" />
                {creator?.full_name ?? creator?.username ?? 'Onbekend'}
              </p>
            </div>
          </div>

          {/* Locatie */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-[#E87722] shrink-0" />
              <span className="font-semibold">{meetup.location_name}</span>
              <span className="text-gray-400">· {meetup.city}</span>
            </div>

            {/* Kaartje: exact voor toegang, buurt voor rest */}
            <div className="rounded-xl overflow-hidden" style={{ height: 180, border: '1px solid rgba(0,0,0,0.08)' }}>
              <LocationPreviewMap
                lat={hasAccess ? meetup.latitude : Math.round(meetup.latitude * 100) / 100}
                lon={hasAccess ? meetup.longitude : Math.round(meetup.longitude * 100) / 100}
              />
            </div>
            {!hasAccess && (
              <p className="text-xs text-gray-400 text-center">Exact adres zichtbaar na acceptatie</p>
            )}
            {hasAccess && meetup.location_address && (
              <p className="text-xs text-gray-500">{meetup.location_address}</p>
            )}
          </div>

          {/* Deelnemers teller */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Geaccepteerd', value: accepted.length, color: '#059669' },
              { label: 'Geïnteresseerd', value: interested.length, color: '#E87722' },
              { label: 'Plekken over', value: Math.max(0, spotsLeft), color: spotsLeft > 0 ? '#111' : '#dc2626' },
            ].map(({ label, value, color: c }) => (
              <div key={label} className="text-center bg-gray-50 rounded-xl py-3">
                <p className="text-xl font-black" style={{ color: c }}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actie-sectie voor bezoekers */}
      {!isCreator && myStatus !== 'geaccepteerd' && meetup.status === 'open' && (
        <div className="bg-white rounded-2xl border border-black/8 p-5">
          {!myStatus ? (
            <div className="text-center">
              <p className="font-bold text-gray-800 mb-1">Wil jij meedoen?</p>
              <p className="text-sm text-gray-500 mb-4">Toon je interesse — de organisator beslist of je mee mag doen.</p>
              <button
                onClick={() => setShowInterest(true)}
                className="bg-[#E87722] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#d4691d] transition-colors"
                style={SYNE}
              >
                Interesse tonen
              </button>
            </div>
          ) : myStatus === 'interesse' ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-[#E87722]" />
              </div>
              <p className="font-bold text-gray-800">Je interesse is ontvangen</p>
              <p className="text-sm text-gray-500 mt-1">{creator?.full_name ?? 'De organisator'} beslist of je mee mag doen.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* ICS export + verlaten voor geaccepteerde deelnemers */}
      {!isCreator && myStatus === 'geaccepteerd' && (
        <div className="flex gap-3">
          {!meetup.is_spontaneous && meetup.date && (
            <button
              onClick={downloadIcs}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-black/10 text-sm font-bold text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4" /> Zet in agenda
            </button>
          )}
          <button
            onClick={handleLeave}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-sm font-bold text-red-500 py-3 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Verlaat Meetup
          </button>
        </div>
      )}

      {/* Organisator — interesse beheren */}
      {isCreator && interested.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/8 p-5">
          <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 12 }}>
            Interesse ({interested.length})
          </h2>
          <div className="space-y-3">
            {interested.map(p => (
              <div key={p.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-black">{p.name}</p>
                  {p.message && <p className="text-xs text-gray-500 truncate mt-0.5">{p.message}</p>}
                  <p className="text-xs text-gray-400">{timeAgo(p.joined_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRespond(p.user_id, 'geweigerd')}
                    disabled={isPending}
                    className="w-8 h-8 rounded-full border border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                  <button
                    onClick={() => handleRespond(p.user_id, 'geaccepteerd')}
                    disabled={isPending}
                    className="w-8 h-8 rounded-full bg-[#059669] flex items-center justify-center hover:bg-[#047857] transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geaccepteerde deelnemers */}
      {accepted.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/8 p-5">
          <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111', marginBottom: 12 }}>
            Deelnemers ({accepted.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {accepted.map(p => (
              <div key={p.user_id} className="flex items-center gap-2">
                <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                <span className="text-sm font-semibold text-gray-700">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meetup chat */}
      {hasAccess && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          {/* Chat header */}
          <div className="px-5 py-4 border-b border-black/6 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[#E87722]" />
            <div>
              <p style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: '#111' }}>Meetup chat</p>
              <p className="text-xs text-gray-500">{accepted.length + 1} deelnemers</p>
            </div>
            {/* Avatar preview */}
            <div className="flex -space-x-2 ml-auto">
              {[creator, ...accepted.slice(0, 4)].filter(Boolean).map((p: any, i) => (
                <Avatar key={i} name={p.full_name ?? p.name ?? '?'} imageUrl={p.avatar_url ?? p.avatarUrl} size="xs" />
              ))}
              {accepted.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white">
                  +{accepted.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Berichten */}
          <div className="h-72 overflow-y-auto px-4 py-3 space-y-3 bg-[#F5F0E8]/30">
            {chatMessages.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Nog geen berichten. Stel jezelf voor!</div>
            )}
            {chatMessages.map(msg => {
              if (msg.is_system) {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-black/6">{msg.content}</span>
                  </div>
                )
              }
              const isMe = msg.sender_id === currentUserId
              const senderName = senderMap[msg.sender_id] ?? 'Onbekend'
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <p className="text-xs text-gray-500 mb-1 px-1">{senderName}</p>}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe ? 'bg-[#111] text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm border border-black/6'
                  }`}>
                    {msg.content}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">{timeAgo(msg.created_at)}</p>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Invoer */}
          <div className="px-4 py-3 border-t border-black/6 flex gap-2">
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Stuur een bericht..."
              className="flex-1 bg-[#F5F0E8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMsg.trim() || isPending}
              className="w-10 h-10 rounded-xl bg-[#E87722] flex items-center justify-center hover:bg-[#d4691d] transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Organisator acties */}
      {isCreator && meetup.status !== 'geannuleerd' && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowCancel(true)}
            className="flex-1 border border-red-200 text-sm font-bold text-red-500 py-3 rounded-xl hover:bg-red-50 transition-colors"
          >
            Meetup annuleren
          </button>
        </div>
      )}

      {/* Cancel confirm */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCancel(false)}>
          <div className="bg-[#F5F0E8] w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 style={{ ...SYNE, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Meetup annuleren?</h3>
            <p className="text-sm text-gray-600 text-center mb-6">Alle geaccepteerde deelnemers ontvangen een notificatie.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600 hover:bg-black/5">Terug</button>
              <button onClick={handleCancel} disabled={isPending} className="flex-1 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 border border-red-200 disabled:opacity-50">
                {isPending ? 'Bezig...' : 'Annuleren'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interesse modal */}
      {showInterest && (
        <InterestModal
          meetupId={meetup.id}
          meetupTitle={meetup.title}
          creatorName={creator?.full_name ?? 'Organisator'}
          sport={meetup.sport}
          onClose={() => setShowInterest(false)}
          onSuccess={() => { setMyStatus('interesse'); showToast('Interesse verstuurd!') }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
