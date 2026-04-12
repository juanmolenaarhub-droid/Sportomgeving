'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, X, Send, Users, Crown } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { sendMeetupMessage, getMeetupMessages, type MeetupMessageItem } from '@/app/actions/meetups'

// ─── Kleursysteem ─────────────────────────────────────────────────────────────

const CHAT_COLORS = [
  '#3B82F6', '#22C55E', '#8B5CF6', '#EC4899',
  '#F59E0B', '#06B6D4', '#EF4444', '#10B981',
]

function getUserColor(userId: string, participantIds: string[], hostId: string): string {
  if (userId === hostId) return CHAT_COLORS[0] // host krijgt altijd blauw
  const idx = participantIds.indexOf(userId)
  if (idx === -1) return CHAT_COLORS[1]
  return CHAT_COLORS[idx % CHAT_COLORS.length]
}

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Vandaag'
  if (d.toDateString() === yesterday.toDateString()) return 'Gisteren'
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Participant = {
  userId: string
  name: string
  avatarUrl: string | null
  isHost: boolean
}

type Props = {
  meetupId: string
  meetupTitle: string
  meetupSport: string
  meetupDate: string | null
  meetupTime: string | null
  meetupLocation: string
  isSpontaneous: boolean
  expiresAt: string | null
  hostId: string
  participants: Participant[]
  currentUserId: string
  onBack: () => void
}

// ─── Deelnemers overlay ───────────────────────────────────────────────────────

function ParticipantsOverlay({
  participants,
  hostId,
  currentUserId,
  participantIds,
  onClose,
}: {
  participants: Participant[]
  hostId: string
  currentUserId: string
  participantIds: string[]
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-4 top-16 z-50 bg-white rounded-2xl shadow-xl border border-black/8 overflow-hidden"
      style={{ width: 240 }}
    >
      <div className="px-4 py-3 border-b border-black/5">
        <p className="font-bold text-sm text-black">Deelnemers ({participants.length})</p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {participants.map(p => {
          const color = getUserColor(p.userId, participantIds, hostId)
          return (
            <div key={p.userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
              <div className="relative shrink-0">
                <Avatar name={p.name} imageUrl={p.avatarUrl} size="xs" />
              </div>
              <p className="flex-1 text-sm font-semibold text-black truncate">{p.name}</p>
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {p.isHost && (
                  <span className="text-[10px] font-bold text-[#E87722] bg-orange-50 px-1.5 py-0.5 rounded-full">host</span>
                )}
                {p.userId === currentUserId && (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">jij</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────

export default function MeetupChatView({
  meetupId, meetupTitle, meetupSport, meetupDate, meetupTime,
  meetupLocation, isSpontaneous, expiresAt, hostId,
  participants, currentUserId, onBack,
}: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<MeetupMessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Geordende lijst van participant IDs voor consistente kleurindex
  const participantIds = [...participants]
    .sort((a, b) => (a.userId === hostId ? -1 : b.userId === hostId ? 1 : a.userId.localeCompare(b.userId)))
    .map(p => p.userId)

  // Profielmap
  const profileMap = Object.fromEntries(participants.map(p => [p.userId, p]))

  function scrollToBottom(smooth = true) {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  const handleScroll = useCallback(() => {
    const el = messagesAreaRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setIsAtBottom(atBottom)
    if (atBottom) setNewCount(0)
  }, [])

  // Berichten laden
  useEffect(() => {
    getMeetupMessages(meetupId).then(({ data }) => {
      setMessages(data)
      setLoading(false)
      setTimeout(() => scrollToBottom(false), 50)
    })
  }, [meetupId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`meetup-chat:${meetupId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meetup_messages', filter: `meetup_id=eq.${meetupId}` },
        (payload) => {
          const raw = payload.new as {
            id: string; meetup_id: string; sender_id: string; content: string
            is_system: boolean; created_at: string
          }
          const profile = profileMap[raw.sender_id]
          const newMsg: MeetupMessageItem = {
            id: raw.id,
            meetupId: raw.meetup_id,
            senderId: raw.sender_id,
            senderName: profile?.name ?? 'Onbekend',
            senderAvatarUrl: profile?.avatarUrl ?? null,
            content: raw.content,
            isSystem: raw.is_system ?? false,
            createdAt: raw.created_at,
          }
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          setIsAtBottom(prev => {
            if (prev) {
              setTimeout(() => scrollToBottom(true), 50)
            } else if (raw.sender_id !== currentUserId) {
              setNewCount(c => c + 1)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [meetupId, currentUserId])

  async function handleSend() {
    const content = newMessage.trim()
    if (!content || sending) return
    setSending(true)
    setNewMessage('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const result = await sendMeetupMessage(meetupId, content)
    setSending(false)
    if (result.error) setNewMessage(content) // herstel bij fout
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNewMessage(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'
  }

  // Datum-label (voor scheiders)
  const displayDate = meetupDate
    ? new Date(`${meetupDate}T${meetupTime ?? '00:00'}`).toLocaleString('nl-NL', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : isSpontaneous
      ? `⚡ Spontaan${expiresAt ? ' · verloopt om ' + formatTime(expiresAt) : ''}`
      : null

  const visibleParticipants = participants.slice(0, 4)
  const extraCount = Math.max(0, participants.length - 4)

  return (
    <div className="flex-1 flex flex-col min-w-0 relative">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white shrink-0">
        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 font-bold">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-black text-black text-sm truncate">{meetupSport} · {meetupTitle}</p>
          {displayDate && (
            <p className="text-xs text-gray-400 truncate">{displayDate} · {meetupLocation}</p>
          )}
        </div>

        {/* Deelnemers avatars */}
        <button
          onClick={() => setShowParticipants(v => !v)}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="flex -space-x-1.5">
            {visibleParticipants.map(p => (
              <div key={p.userId} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden">
                <Avatar name={p.name} imageUrl={p.avatarUrl} size="xs" />
              </div>
            ))}
          </div>
          {extraCount > 0 && (
            <span className="text-xs font-bold text-gray-500 ml-1">+{extraCount}</span>
          )}
          <Users className="w-3.5 h-3.5 text-gray-400 ml-1" />
        </button>
      </div>

      {showParticipants && (
        <ParticipantsOverlay
          participants={participants}
          hostId={hostId}
          currentUserId={currentUserId}
          participantIds={participantIds}
          onClose={() => setShowParticipants(false)}
        />
      )}

      {/* Berichten */}
      <div
        ref={messagesAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ background: '#F5F0E8' }}
      >
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-[#E87722] rounded-full animate-spin" />
          </div>
        )}

        {messages.map((msg, idx) => {
          const fromMe = msg.senderId === currentUserId
          const prevMsg = messages[idx - 1]
          const showDateSep = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)
          const prevFromSame = prevMsg && !prevMsg.isSystem && prevMsg.senderId === msg.senderId && !showDateSep
          const showName = !fromMe && !msg.isSystem && !prevFromSame
          const color = getUserColor(msg.senderId, participantIds, hostId)
          const isHost = msg.senderId === hostId
          const profile = profileMap[msg.senderId]

          return (
            <div key={msg.id}>
              {/* Datumscheider */}
              {showDateSep && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-black/10" />
                  <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-black/8 rounded-full whitespace-nowrap">
                    {formatDateLabel(msg.createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-black/10" />
                </div>
              )}

              {/* Systeembericht */}
              {msg.isSystem ? (
                <div className="flex justify-center my-1.5">
                  <span className="text-xs text-gray-400 bg-[#E5E7EB] px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              ) : (
                /* Gewoon bericht */
                <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} mb-0.5`}>
                  {/* Naam boven bericht */}
                  {showName && (
                    <div className="flex items-center gap-1 ml-9 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color }}>
                        {msg.senderName}
                      </span>
                      {isHost && (
                        <span className="text-[10px] font-bold text-[#E87722] bg-orange-50 px-1 py-0.5 rounded-full flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> host
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`flex ${fromMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-1.5`}>
                    {/* Avatar (alleen bij eerste bericht in reeks) */}
                    {!fromMe && (
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 self-end">
                        {!prevFromSame
                          ? <Avatar name={msg.senderName} imageUrl={profile?.avatarUrl ?? null} size="xs" />
                          : <div className="w-7 h-7" />}
                      </div>
                    )}

                    {/* Ballon */}
                    <div
                      className="max-w-[75%] px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: fromMe ? '#FFF4ED' : '#FFFFFF',
                        color: '#111111',
                        borderRadius: fromMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                      }}
                    >
                      {/* Naam in eigen ballon rechts */}
                      {fromMe && (
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#E87722' }}>Jij</p>
                      )}
                      {msg.content}
                      <p className="text-[10px] mt-1" style={{ color: fromMe ? '#D1855A' : '#9CA3AF' }}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* "Nieuwe berichten" pill */}
      {!isAtBottom && newCount > 0 && (
        <button
          onClick={() => { scrollToBottom(true); setNewCount(0) }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-[#111] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-[#E87722] transition-colors"
        >
          {newCount} nieuwe bericht{newCount !== 1 ? 'en' : ''} ↓
        </button>
      )}

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Stuur een bericht..."
            rows={1}
            className="flex-1 bg-white border border-gray-200 rounded-[20px] px-4 py-2.5 text-sm text-black focus:outline-none focus:border-[#E87722] resize-none overflow-hidden leading-snug"
            style={{ minHeight: 40, maxHeight: 96 }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{
              background: newMessage.trim() ? '#E87722' : '#E5E7EB',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
