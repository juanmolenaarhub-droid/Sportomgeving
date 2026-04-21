'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Check, X, MessageCircle, Clock, Send, Plus,
  MoreVertical, MoreHorizontal, EyeOff, AlertTriangle, Flag, Trash2, ImageIcon, CalendarDays,
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { acceptBuddyRequest, declineBuddyRequest } from '../../actions'
import { deleteConversation } from '../../safety-actions'
import {
  updateLastSeen, markMessagesAsRead,
  createAppointment, sendImageMessage,
  deleteMessageForAll, deleteMessageForMe,
} from '../../chat-actions'
import { ReportUserModal } from './ReportUserModal'
import { ConversationStarters } from './ConversationStarters'
import { AfspraakModal } from './AfspraakModal'
import { AppointmentCard, type AppointmentData } from './AppointmentCard'
import { MessageReactions, type Reaction } from './MessageReactions'
import { ImageLightbox } from './ImageLightbox'
import MeetupChatList from './MeetupChatList'
import MeetupChatView from './MeetupChatView'

export type ConversationItem = {
  requestId: string
  otherUserId: string
  otherUserName: string
  sport: string | null
  message: string | null
  createdAt: string
  accepted: boolean
  otherUserLastSeen?: string | null
  lastMessage?: string | null
  lastMessageType?: string | null
}

type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  message_type?: string
  image_url?: string | null
  read_at?: string | null
  deleted_for_all?: boolean
}

const PHONE_REGEX = /(\+316\d{8}|0031\s*6\s*\d{8}|06[-\s]?\d{8})/
const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }

// ── Sport kleuren ─────────────────────────────────────────────────────────────
const SPORT_COLORS: Record<string, string> = {
  Tennis: '#E87722', Hardlopen: '#E87722', Voetbal: '#E87722', Triathlon: '#E87722',
  Fietsen: '#1D9E75', Yoga: '#1D9E75',
  Zwemmen: '#3A7AC4',
  Gym: '#7F77DD',
  Padel: '#5B4A8B',
  Golf: '#D4A87A',
}
function getSportColor(sport: string | null): string {
  return sport ? (SPORT_COLORS[sport] ?? '#E87722') : '#E87722'
}

// ── Gebruiker kleur (consistent per userId) ───────────────────────────────────
const USER_COLORS = ['#D4538C','#7F77DD','#1D9E75','#E87722','#3A7AC4','#D4A87A','#E8A560','#5B4A8B']
function getUserColor(userId: string): string {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return USER_COLORS[hash % USER_COLORS.length]
}

function getInitials(name: string): string {
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'nu'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}u`
  if (days === 1) return 'gisteren'
  if (days < 7)  return `${days}d`
  return `${Math.floor(days / 7)}w`
}

function lastSeenLabel(lastSeen: string | null | undefined, isOnline: boolean): string {
  if (isOnline) return 'Online'
  if (!lastSeen) return 'Offline'
  const diff = Date.now() - new Date(lastSeen).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'Zojuist actief'
  if (mins < 60)  return `${mins} min geleden actief`
  if (hours < 24) return `${hours} uur geleden actief`
  return `${days} dag${days > 1 ? 'en' : ''} geleden actief`
}

// ── Verwijder bevestigingsdialog ──────────────────────────────────────────────
function DeleteDialog({ onClose, onConfirm, isPending }: { onClose: () => void; onConfirm: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#F5F0E8] w-full max-w-sm rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 style={{ ...SYNE, fontWeight: 800, fontSize: 17, color: '#111' }} className="mb-2">Chat verwijderen?</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Weet je zeker dat je deze chat wilt verwijderen? De berichten verdwijnen alleen bij jou. De andere persoon kan de chat nog steeds zien.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600 hover:bg-black/5 transition-colors">Annuleren</button>
          <button onClick={onConfirm} disabled={isPending} className="flex-1 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
            {isPending ? 'Verwijderen...' : 'Verwijderen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drie-puntjes menu ─────────────────────────────────────────────────────────
function ChatMenu({ onReport, onDelete, onClose }: { onReport: () => void; onDelete: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return (
    <div ref={ref} className="absolute right-4 top-14 z-50 bg-white rounded-xl shadow-xl border border-black/8 overflow-hidden w-52">
      <button onClick={() => { onReport(); onClose() }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-[#F5F0E8] transition-colors text-left">
        <Flag className="w-4 h-4 text-[#E87722]" /> Gebruiker rapporteren
      </button>
      <div className="border-t border-black/5" />
      <button onClick={() => { onDelete(); onClose() }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left">
        <Trash2 className="w-4 h-4" /> Chat verwijderen
      </button>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl">
      {message}
    </div>
  )
}

// ── Pill tab ──────────────────────────────────────────────────────────────────
function TabPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={active ? { background: '#111111' } : { background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(17,17,17,0.10)' }}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 active:scale-95 transition-all"
    >
      <span style={{ ...DM, fontSize: 13, fontWeight: 600, color: active ? 'white' : 'rgba(17,17,17,0.70)' }}>{label}</span>
      {count > 0 && (
        <span style={{ background: '#E87722', minWidth: 20, height: 20, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
          <span style={{ ...DM, fontSize: 11, fontWeight: 700, color: 'white' }}>{count}</span>
        </span>
      )}
    </button>
  )
}

// ── Meetup chat data type ─────────────────────────────────────────────────────
type MeetupChatData = {
  id: string
  title: string
  sport: string
  date: string | null
  time: string | null
  location: string
  isSpontaneous: boolean
  expiresAt: string | null
  hostId: string
  participants: { userId: string; name: string; avatarUrl: string | null; isHost: boolean }[]
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export default function MessagesClient({
  initialConversations,
  currentUserId,
}: {
  initialConversations: ConversationItem[]
  currentUserId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Meetup chat state
  const [activeMeetupId, setActiveMeetupId] = useState<string | null>(null)
  const [activeMeetupData, setActiveMeetupData] = useState<MeetupChatData | null>(null)
  const [loadingMeetupChat, setLoadingMeetupChat] = useState(false)

  // Basis state
  const [conversations, setConversations] = useState(() => [
    ...initialConversations.filter(c => !c.accepted),
    ...initialConversations.filter(c => c.accepted).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  ])
  const acceptedIdsRef = useRef<string[]>(initialConversations.filter(c => c.accepted).map(c => c.requestId))
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests' | 'meetups'>('inbox')
  const [selected, setSelected] = useState<ConversationItem | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Modals & menu
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAfspraakModal, setShowAfspraakModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Telefoonwaarschuwing
  const [phoneWarningDismissed, setPhoneWarningDismissed] = useState(false)
  const hasPhoneNumber = PHONE_REGEX.test(newMessage)
  const showPhoneWarning = hasPhoneNumber && !phoneWarningDismissed

  // Afspraken
  const [appointments, setAppointments] = useState<Record<string, AppointmentData>>({})

  // Reacties
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({})

  // Berichtverwijdering
  const [deletedForMeIds, setDeletedForMeIds] = useState<Set<string>>(new Set())
  const [msgMenuFor, setMsgMenuFor] = useState<string | null>(null)

  // Typing indicator
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const myDisplayNameRef  = useRef<string>('Iemand')
  const typingChannelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lange-druk preview
  const [previewConv, setPreviewConv] = useState<ConversationItem | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startLongPress(conv: ConversationItem) {
    longPressTimer.current = setTimeout(() => setPreviewConv(conv), 500)
  }
  function cancelLongPress() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }

  // Afbeeldingen
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Meetup chat: laad data voor geselecteerde meetup
  async function openMeetupChat(meetupId: string) {
    setActiveMeetupId(meetupId)
    setActiveMeetupData(null)
    setLoadingMeetupChat(true)
    setActiveTab('meetups')

    const [{ data: meetup }, { data: participants }] = await Promise.all([
      supabase.from('meetups')
        .select('id, title, sport, date, time, location_name, is_spontaneous, expires_at, creator_id')
        .eq('id', meetupId).single(),
      supabase.from('meetup_participants')
        .select('user_id, status')
        .eq('meetup_id', meetupId)
        .in('status', ['geaccepteerd']),
    ])

    if (!meetup) { setLoadingMeetupChat(false); return }

    const participantIds = (participants ?? []).map(p => p.user_id)
    const allUserIds = [...new Set([meetup.creator_id, ...participantIds])]
    const { data: profiles } = await supabase.from('profiles')
      .select('id, full_name, username, avatar_url').in('id', allUserIds)
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    const chatParticipants = allUserIds.map(uid => {
      const p = profileMap[uid]
      return {
        userId: uid,
        name: p?.full_name ?? p?.username ?? 'Onbekend',
        avatarUrl: p?.avatar_url ?? null,
        isHost: uid === meetup.creator_id,
      }
    })

    setActiveMeetupData({
      id: meetup.id,
      title: meetup.title,
      sport: meetup.sport,
      date: meetup.date ?? null,
      time: meetup.time ?? null,
      location: meetup.location_name,
      isSpontaneous: meetup.is_spontaneous,
      expiresAt: meetup.expires_at ?? null,
      hostId: meetup.creator_id,
      participants: chatParticipants,
    })
    setLoadingMeetupChat(false)
  }

  useEffect(() => {
    const meetupParam = searchParams.get('meetup')
    if (meetupParam) openMeetupChat(meetupParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasPhoneNumber) setPhoneWarningDismissed(false)
  }, [hasPhoneNumber])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    updateLastSeen()
    const interval = setInterval(updateLastSeen, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name, username').eq('id', user.id).single()
        .then(({ data }) => { if (data) myDisplayNameRef.current = data.full_name ?? data.username ?? 'Iemand' })
    })
  }, [])

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUserId } },
    })
    channel
      .on('presence', { event: 'sync' }, () => setOnlineUsers(new Set(Object.keys(channel.presenceState()))))
      .on('presence', { event: 'join' }, ({ key }) => setOnlineUsers(prev => new Set([...prev, key])))
      .on('presence', { event: 'leave' }, ({ key }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(key); return s }))
      .subscribe(async status => { if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() }) })
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  useEffect(() => {
    acceptedIdsRef.current = conversations.filter(c => c.accepted).map(c => c.requestId)
  }, [conversations])

  useEffect(() => {
    const channel = supabase.channel('inbox-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const msg = payload.new as {
            conversation_id: string; content: string; created_at: string; message_type: string
          }
          if (!acceptedIdsRef.current.includes(msg.conversation_id)) return
          setConversations(prev => {
            const updated = prev.map(c =>
              c.requestId === msg.conversation_id
                ? { ...c, lastMessage: msg.content, lastMessageType: msg.message_type, createdAt: msg.created_at }
                : c
            )
            return [
              ...updated.filter(c => !c.accepted),
              ...updated.filter(c => c.accepted).sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              ),
            ]
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!selected?.accepted) { setMessages([]); setReactions({}); setAppointments({}); setDeletedForMeIds(new Set()); setTypingUsers({}); return }
    const convId = selected.requestId
    setLoadingMessages(true)

    Promise.all([
      supabase.from('chat_messages')
        .select('id, conversation_id, sender_id, content, created_at, message_type, image_url, read_at, deleted_for_all')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true }),
      supabase.from('training_appointments')
        .select('id, proposed_by, proposed_to, sport, location, proposed_date, notes, status')
        .eq('conversation_id', convId),
      supabase.from('message_reactions')
        .select('id, message_id, user_id, emoji')
        .in('message_id', ['00000000-0000-0000-0000-000000000000']),
    ]).then(([msgRes, apptRes]) => {
      const msgs = (msgRes.data ?? []) as ChatMessage[]
      setMessages(msgs)
      setLoadingMessages(false)

      const apptMap: Record<string, AppointmentData> = {}
      for (const a of apptRes.data ?? []) apptMap[a.id] = a as AppointmentData
      setAppointments(apptMap)

      const msgIds = msgs.map(m => m.id)
      if (msgIds.length > 0) {
        Promise.all([
          supabase.from('message_reactions').select('id, message_id, user_id, emoji').in('message_id', msgIds),
          supabase.from('deleted_messages').select('message_id').eq('user_id', currentUserId).in('message_id', msgIds),
        ]).then(([reactRes, deletedRes]) => {
          const rMap: Record<string, Reaction[]> = {}
          for (const r of reactRes.data ?? []) {
            if (!rMap[r.message_id]) rMap[r.message_id] = []
            rMap[r.message_id].push(r as Reaction)
          }
          setReactions(rMap)
          setDeletedForMeIds(new Set((deletedRes.data ?? []).map(r => r.message_id)))
        })
      }
      markMessagesAsRead(convId)
    })

    const chatChannel = supabase.channel(`chat:${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          if (newMsg.message_type === 'appointment' && newMsg.content) {
            supabase.from('training_appointments')
              .select('id, proposed_by, proposed_to, sport, location, proposed_date, notes, status')
              .eq('id', newMsg.content).single()
              .then(({ data }) => { if (data) setAppointments(prev => ({ ...prev, [data.id]: data as AppointmentData })) })
          }
          if (newMsg.sender_id !== currentUserId) markMessagesAsRead(convId)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const updated = payload.new as ChatMessage
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, read_at: updated.read_at } : m))
        }
      )
      .subscribe()

    const reactChannel = supabase.channel(`reactions:${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const r = payload.new as Reaction
          setReactions(prev => ({ ...prev, [r.message_id]: [...(prev[r.message_id] ?? []).filter(x => x.id !== r.id), r] }))
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const r = payload.old as { id: string; message_id: string }
          setReactions(prev => ({ ...prev, [r.message_id]: (prev[r.message_id] ?? []).filter(x => x.id !== r.id) }))
        }
      )
      .subscribe()

    const apptChannel = supabase.channel(`appointments:${convId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'training_appointments', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const updated = payload.new as AppointmentData
          setAppointments(prev => ({ ...prev, [updated.id]: updated }))
        }
      )
      .subscribe()

    setTypingUsers({})
    const typingChannel = supabase.channel(`typing:${convId}`, {
      config: { presence: { key: currentUserId } },
    })
    typingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState()
        const typers: Record<string, string> = {}
        for (const [key, presences] of Object.entries(state)) {
          if (key !== currentUserId) {
            const p = (presences as { name?: string }[])[0]
            if (p?.name) typers[key] = p.name
          }
        }
        setTypingUsers(typers)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== currentUserId) {
          const p = ((newPresences ?? []) as { name?: string }[])[0]
          if (p?.name) setTypingUsers(prev => ({ ...prev, [key]: p.name! }))
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== currentUserId) {
          setTypingUsers(prev => { const s = { ...prev }; delete s[key]; return s })
        }
      })
      .subscribe()
    typingChannelRef.current = typingChannel

    return () => {
      supabase.removeChannel(chatChannel)
      supabase.removeChannel(reactChannel)
      supabase.removeChannel(apptChannel)
      supabase.removeChannel(typingChannel)
      typingChannelRef.current = null
    }
  }, [selected?.requestId, selected?.accepted])

  const handleAccept = useCallback((requestId: string) => {
    startTransition(async () => {
      await acceptBuddyRequest(requestId)
      setConversations(prev => prev.map(c => c.requestId === requestId ? { ...c, accepted: true } : c))
      setSelected(prev => prev?.requestId === requestId ? { ...prev, accepted: true } : prev)
      setActiveTab('inbox')
    })
  }, [])

  const handleDecline = useCallback((requestId: string) => {
    startTransition(async () => {
      await declineBuddyRequest(requestId)
      setConversations(prev => prev.filter(c => c.requestId !== requestId))
      if (selected?.requestId === requestId) setSelected(null)
    })
  }, [selected?.requestId])

  function handleTyping() {
    if (!typingChannelRef.current) return
    typingChannelRef.current.track({ name: myDisplayNameRef.current })
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => { typingChannelRef.current?.untrack() }, 2000)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selected?.accepted || showPhoneWarning) return
    const content = newMessage.trim()
    setNewMessage('')
    setPhoneWarningDismissed(false)
    typingChannelRef.current?.untrack()
    if (typingTimerRef.current) { clearTimeout(typingTimerRef.current); typingTimerRef.current = null }
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: selected.requestId,
      sender_id: currentUserId,
      content,
      message_type: 'text',
    })
    if (error) setNewMessage(content)
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImage(file)
    setPendingImagePreview(URL.createObjectURL(file))
  }

  async function sendImage() {
    if (!pendingImage || !selected?.accepted || uploadingImage) return
    setUploadingImage(true)
    const ext  = pendingImage.name.split('.').pop() ?? 'jpg'
    const path = `${currentUserId}/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-images').upload(path, pendingImage, { contentType: pendingImage.type })
    if (uploadError) { setToast('Afbeelding uploaden mislukt'); setUploadingImage(false); return }
    const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(uploadData.path)
    const result = await sendImageMessage(selected.requestId, urlData.publicUrl)
    setUploadingImage(false)
    if (result.error) { setToast('Afbeelding verzenden mislukt') }
    else {
      setPendingImage(null)
      if (pendingImagePreview) { URL.revokeObjectURL(pendingImagePreview); setPendingImagePreview(null) }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function cancelImage() {
    setPendingImage(null)
    if (pendingImagePreview) { URL.revokeObjectURL(pendingImagePreview); setPendingImagePreview(null) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleAfspraakSubmit({ location, proposedDate, notes }: { location: string; proposedDate: string; notes: string }) {
    if (!selected) return
    const result = await createAppointment(
      selected.requestId, selected.otherUserId, selected.sport,
      location, new Date(proposedDate).toISOString(), notes,
    )
    if (result.error) setToast('Afspraak kon niet worden verzonden')
  }

  async function handleDeleteMsgForAll(messageId: string) {
    setMsgMenuFor(null)
    const result = await deleteMessageForAll(messageId)
    if (result.error) { setToast('Verwijderen mislukt'); return }
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleted_for_all: true, content: '' } : m))
  }

  async function handleDeleteMsgForMe(messageId: string) {
    setMsgMenuFor(null)
    const result = await deleteMessageForMe(messageId)
    if (!result.error) setDeletedForMeIds(prev => new Set([...prev, messageId]))
  }

  function handleDeleteConfirm() {
    if (!selected) return
    startTransition(async () => {
      const result = await deleteConversation(selected.requestId)
      setShowDeleteDialog(false)
      if (result.error) { setToast('Verwijderen mislukt'); return }
      setToast('Chat verwijderd')
      setSelected(null)
      setConversations(prev => prev.filter(c => c.requestId !== selected.requestId))
      router.push('/dashboard/messages')
    })
  }

  function getReadStatus(msg: ChatMessage): 'read' | 'sent' | null {
    if (msg.sender_id !== currentUserId) return null
    if (msg.message_type === 'appointment') return null
    return msg.read_at ? 'read' : 'sent'
  }

  // ── Conversation splits voor nieuw design ────────────────────────────────────
  const requests     = conversations.filter(c => !c.accepted)
  const acceptedSorted = conversations
    .filter(c => c.accepted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const heroConv     = acceptedSorted[0] ?? null
  const onlineConvs  = acceptedSorted.filter(c => onlineUsers.has(c.otherUserId) && c.requestId !== heroConv?.requestId)
  const earlierConvs = acceptedSorted.filter(c => c.requestId !== heroConv?.requestId)

  function getLastMsgPreview(conv: ConversationItem): string {
    if (conv.lastMessageType === 'image') return '📷 Afbeelding'
    if (conv.lastMessageType === 'appointment') return '📅 Afspraak voorstel'
    return conv.lastMessage ?? conv.message ?? 'Wil jouw sportbuddy worden'
  }

  return (
    <>
      <div
        className="flex overflow-hidden md:rounded-2xl md:border md:border-gray-100 md:h-[calc(100dvh-4rem)]"
        style={{
          position: 'fixed', inset: 0,
          paddingTop: 'env(safe-area-inset-top)',
          background: '#F5F0E8',
        }}
      >

        {/* ══ LINKER KOLOM — nieuw editorial design ══════════════════════════════ */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col ${(selected || activeMeetupId) ? 'hidden md:flex' : 'flex'}`}
          style={{ background: '#F5F0E8' }}
        >
          {/* Editorial header */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ ...DM, fontSize: 11, fontWeight: 600, color: '#E87722', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
                  VANDAAG
                </p>
                <h1 style={{ ...SYNE, fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: '#111111' }}>
                  Berichten
                </h1>
              </div>
              <button
                onClick={() => router.push('/dashboard/find')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#111111', borderRadius: 999,
                  padding: '8px 14px', border: 'none', cursor: 'pointer', marginTop: 4,
                }}
              >
                <Plus size={14} color="white" strokeWidth={2.5} />
                <span style={{ ...DM, fontSize: 12, fontWeight: 600, color: 'white' }}>Nieuw</span>
              </button>
            </div>

            {/* Pill tabs */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}
              className="scrollbar-hide">
              <TabPill label="Inbox"     count={0}              active={activeTab === 'inbox'}    onClick={() => setActiveTab('inbox')} />
              <TabPill label="Verzoeken" count={requests.length} active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
              <TabPill label="Meetups"   count={0}              active={activeTab === 'meetups'}  onClick={() => setActiveTab('meetups')} />
            </div>
          </div>

          {/* ── Scrollable content ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}>

            {/* MEETUPS TAB */}
            {activeTab === 'meetups' && (
              <MeetupChatList currentUserId={currentUserId} onSelect={openMeetupChat} />
            )}

            {/* VERZOEKEN TAB */}
            {activeTab === 'requests' && (
              <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {requests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <MessageCircle size={40} color="rgba(17,17,17,0.15)" style={{ margin: '0 auto 12px' }} />
                    <p style={{ ...DM, fontSize: 13, color: 'rgba(17,17,17,0.45)', fontWeight: 500 }}>Geen berichtverzoeken</p>
                  </div>
                ) : requests.map(conv => {
                  const color = getUserColor(conv.otherUserId)
                  return (
                    <button
                      key={conv.requestId}
                      onClick={() => { cancelLongPress(); setSelected(conv); setActiveMeetupId(null); setActiveMeetupData(null) }}
                      onMouseDown={() => startLongPress(conv)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onTouchStart={() => startLongPress(conv)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      style={{
                        width: '100%', background: 'white', borderRadius: 18,
                        padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ ...SYNE, fontSize: 13, fontWeight: 800, color: 'white' }}>{getInitials(conv.otherUserName)}</span>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: '50%', background: '#E87722', border: '2px solid #F5F0E8' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ ...DM, fontSize: 14, fontWeight: 700, color: '#111111', marginBottom: 2 }}>{conv.otherUserName}</p>
                        <p style={{ ...DM, fontSize: 12, color: 'rgba(17,17,17,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.message ?? 'Wil jouw sportbuddy worden'}
                        </p>
                      </div>
                      <span style={{ ...DM, fontSize: 10, color: 'rgba(17,17,17,0.40)', flexShrink: 0 }}>{timeAgo(conv.createdAt)}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* INBOX TAB */}
            {activeTab === 'inbox' && (
              <>
                {/* Empty state */}
                {acceptedSorted.length === 0 && (
                  <div style={{ margin: '32px 16px', background: 'white', borderRadius: 24, padding: '32px 24px', textAlign: 'center' }}>
                    <p style={{ ...SYNE, fontWeight: 800, fontSize: 18, color: '#111111', marginBottom: 8 }}>Nog geen berichten</p>
                    <p style={{ ...DM, fontSize: 13, color: 'rgba(17,17,17,0.55)', marginBottom: 20, lineHeight: 1.5 }}>
                      Start een gesprek via de Zoek pagina
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/find')}
                      style={{ background: '#111111', color: 'white', borderRadius: 999, padding: '10px 20px', border: 'none', cursor: 'pointer', ...DM, fontSize: 13, fontWeight: 600 }}
                    >
                      Vind een buddy
                    </button>
                  </div>
                )}

                {/* ── Hero card ──────────────────────────────────────────── */}
                {heroConv && (() => {
                  const heroColor = getUserColor(heroConv.otherUserId)
                  const heroInitials = getInitials(heroConv.otherUserName)
                  const isHeroOnline = onlineUsers.has(heroConv.otherUserId)
                  return (
                    <button
                      onClick={() => { cancelLongPress(); setSelected(heroConv); setActiveMeetupId(null); setActiveMeetupData(null) }}
                      onMouseDown={() => startLongPress(heroConv)}
                      onMouseUp={cancelLongPress}
                      onTouchStart={() => startLongPress(heroConv)}
                      onTouchEnd={cancelLongPress}
                      style={{
                        display: 'block', margin: '0 12px', width: 'calc(100% - 24px)',
                        borderRadius: 24, overflow: 'hidden', position: 'relative',
                        background: heroColor, border: 'none', cursor: 'pointer', textAlign: 'left',
                        marginTop: 4,
                      }}
                    >
                      {/* Reuze initialen ornament */}
                      <div style={{ position: 'absolute', right: -16, bottom: -24, pointerEvents: 'none', userSelect: 'none' }}>
                        <span style={{ ...SYNE, fontWeight: 800, fontSize: 200, color: 'rgba(255,255,255,0.10)', lineHeight: 1 }}>
                          {heroInitials}
                        </span>
                      </div>

                      <div style={{ position: 'relative', padding: 20, minHeight: 190, display: 'flex', flexDirection: 'column' }}>
                        {/* Top rij */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'auto' }}>
                          {isHeroOnline ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '6px 10px' }}>
                              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1D9E75' }} />
                              <span style={{ ...DM, fontSize: 11, fontWeight: 600, color: '#111111' }}>Online nu</span>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 10px' }}>
                              <span style={{ ...DM, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{timeAgo(heroConv.createdAt)}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom content */}
                        <div style={{ marginTop: 'auto' }}>
                          <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 22, color: 'white', lineHeight: 1.1, margin: 0 }}>
                            {heroConv.otherUserName}
                          </h2>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 10 }}>
                            {heroConv.sport && (
                              <span style={{ ...DM, fontSize: 11, color: 'rgba(255,255,255,0.80)' }}>{heroConv.sport}</span>
                            )}
                            {heroConv.sport && <span style={{ color: 'rgba(255,255,255,0.40)' }}>·</span>}
                            <span style={{ ...DM, fontSize: 11, color: 'rgba(255,255,255,0.80)' }}>{timeAgo(heroConv.createdAt)}</span>
                          </div>
                          <p style={{ ...DM, fontSize: 13, color: 'rgba(255,255,255,0.90)', lineHeight: 1.4, margin: 0,
                            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {getLastMsgPreview(heroConv)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })()}

                {/* ── Ook online ─────────────────────────────────────────── */}
                {onlineConvs.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ ...DM, fontSize: 10, fontWeight: 600, color: 'rgba(17,17,17,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 20px', marginBottom: 10 }}>
                      OOK ONLINE
                    </p>
                    <div style={{ padding: '0 16px', display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="scrollbar-hide">
                      {onlineConvs.slice(0, 8).map(conv => {
                        const color = getUserColor(conv.otherUserId)
                        return (
                          <button
                            key={conv.requestId}
                            onClick={() => { setSelected(conv); setActiveMeetupId(null); setActiveMeetupData(null) }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 56, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <div style={{ position: 'relative' }}>
                              <div style={{ width: 56, height: 56, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ ...SYNE, fontSize: 14, fontWeight: 800, color: 'white' }}>{getInitials(conv.otherUserName)}</span>
                              </div>
                              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: '50%', background: '#1D9E75', border: '2px solid #F5F0E8' }} />
                            </div>
                            <span style={{ ...DM, fontSize: 10, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                              {conv.otherUserName.split(' ')[0]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ── Eerder ─────────────────────────────────────────────── */}
                {earlierConvs.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <p style={{ ...DM, fontSize: 10, fontWeight: 600, color: 'rgba(17,17,17,0.50)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 20px', marginBottom: 10 }}>
                      EERDER
                    </p>
                    <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {earlierConvs.map(conv => {
                        const color = getUserColor(conv.otherUserId)
                        const isOnline = onlineUsers.has(conv.otherUserId)
                        const sportColor = getSportColor(conv.sport)
                        return (
                          <button
                            key={conv.requestId}
                            onClick={() => { cancelLongPress(); setSelected(conv); setActiveMeetupId(null); setActiveMeetupData(null) }}
                            onMouseDown={() => startLongPress(conv)}
                            onMouseUp={cancelLongPress}
                            onMouseLeave={cancelLongPress}
                            onTouchStart={() => startLongPress(conv)}
                            onTouchEnd={cancelLongPress}
                            onTouchMove={cancelLongPress}
                            style={{
                              width: '100%', background: 'white', borderRadius: 18,
                              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                              border: 'none', cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <div style={{ width: 44, height: 44, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ ...SYNE, fontSize: 13, fontWeight: 800, color: 'white' }}>{getInitials(conv.otherUserName)}</span>
                              </div>
                              {isOnline && (
                                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: '50%', background: '#1D9E75', border: '2px solid white' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                                <span style={{ ...DM, fontSize: 14, fontWeight: 700, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {conv.otherUserName}
                                </span>
                                <span style={{ ...DM, fontSize: 10, color: 'rgba(17,17,17,0.40)', flexShrink: 0 }}>{timeAgo(conv.createdAt)}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                {conv.sport && (
                                  <>
                                    <span style={{ ...DM, fontSize: 11, fontWeight: 600, color: sportColor }}>{conv.sport}</span>
                                    <span style={{ color: 'rgba(17,17,17,0.25)', fontSize: 10 }}>·</span>
                                  </>
                                )}
                                <span style={{ ...DM, fontSize: 11, color: 'rgba(17,17,17,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {getLastMsgPreview(conv)}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ══ MEETUP CHAT ════════════════════════════════════════════════════════ */}
        {activeMeetupId && activeMeetupData && (
          <MeetupChatView
            meetupId={activeMeetupId}
            meetupTitle={activeMeetupData.title}
            meetupSport={activeMeetupData.sport}
            meetupDate={activeMeetupData.date}
            meetupTime={activeMeetupData.time}
            meetupLocation={activeMeetupData.location}
            isSpontaneous={activeMeetupData.isSpontaneous}
            expiresAt={activeMeetupData.expiresAt}
            hostId={activeMeetupData.hostId}
            participants={activeMeetupData.participants}
            currentUserId={currentUserId}
            onBack={() => { setActiveMeetupId(null); setActiveMeetupData(null) }}
          />
        )}

        {activeMeetupId && loadingMeetupChat && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E87722] rounded-full animate-spin" />
          </div>
        )}

        {/* ══ CHAT RECHTER KOLOM — ongewijzigd ═══════════════════════════════════ */}
        {!activeMeetupId && selected ? (
          <div className="flex-1 flex flex-col min-w-0 relative" style={{ background: 'white' }}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <button onClick={() => setSelected(null)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 font-bold">←</button>
              <Link href={`/dashboard/profile/${selected.otherUserId}`} className="relative shrink-0">
                <Avatar name={selected.otherUserName} size="sm" />
                {onlineUsers.has(selected.otherUserId) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </Link>
              <div className="flex-1">
                <Link href={`/dashboard/profile/${selected.otherUserId}`} className="font-black text-black text-sm hover:text-[#E87722] transition-colors">{selected.otherUserName}</Link>
                <p className="text-xs font-medium" style={{ color: onlineUsers.has(selected.otherUserId) ? '#22c55e' : '#9ca3af' }}>
                  {lastSeenLabel(selected.otherUserLastSeen, onlineUsers.has(selected.otherUserId))}
                </p>
              </div>
              {!selected.accepted && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium hidden sm:block">Berichtverzoek</span>
                  <button onClick={() => handleDecline(selected.requestId)} disabled={isPending}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
                    <X className="w-3.5 h-3.5" /> Weigeren
                  </button>
                  <button onClick={() => handleAccept(selected.requestId)} disabled={isPending}
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Accepteren
                  </button>
                </div>
              )}
              <button onClick={() => setShowMenu(v => !v)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {showMenu && (
              <ChatMenu onReport={() => setShowReportModal(true)} onDelete={() => setShowDeleteDialog(true)} onClose={() => setShowMenu(false)} />
            )}

            {/* Verzoek banner */}
            {!selected.accepted && (
              <div className="mx-4 mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-black mb-0.5">Berichtverzoek van {selected.otherUserName}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">Accepteer het verzoek om te reageren en de conversatie te starten.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleDecline(selected.requestId)} disabled={isPending}
                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">Weigeren</button>
                  <button onClick={() => handleAccept(selected.requestId)} disabled={isPending}
                    className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">Accepteren</button>
                </div>
              </div>
            )}

            {/* Berichten */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {selected.message && (
                <div className="flex justify-start items-end gap-2 mb-2">
                  <Avatar name={selected.otherUserName} size="xs" />
                  <div className="max-w-[75%] px-4 py-2.5 text-sm leading-relaxed"
                    style={{ background: '#FFFFFF', color: '#111111', borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#3B82F6' }}>{selected.otherUserName}</p>
                    {selected.message}
                    <p className="text-[10px] mt-1 text-gray-400">{timeAgo(selected.createdAt)} geleden</p>
                  </div>
                </div>
              )}

              {loadingMessages && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                </div>
              )}

              {messages.map(msg => {
                if (deletedForMeIds.has(msg.id)) return null
                const fromMe = msg.sender_id === currentUserId
                const msgReactions = reactions[msg.id] ?? []
                const readStatus = getReadStatus(msg)
                const isAppointment = msg.message_type === 'appointment'
                const isImage = msg.message_type === 'image'
                const isDeleted = !!msg.deleted_for_all
                const appt = isAppointment ? appointments[msg.content] : null

                return (
                  <div key={msg.id} className={`group flex flex-col ${fromMe ? 'items-end' : 'items-start'} mb-1`}>
                    <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'} items-end gap-2 relative`}>
                      {!fromMe && <Avatar name={selected.otherUserName} size="xs" />}

                      {isDeleted ? (
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${fromMe ? 'rounded-br-sm' : 'rounded-bl-sm'} bg-gray-50 border border-gray-100`}>
                          <span className="text-gray-400 italic">Dit bericht is verwijderd</span>
                          <p className="text-[10px] mt-1 text-gray-300">{formatTime(msg.created_at)}</p>
                        </div>
                      ) : isAppointment && appt ? (
                        <AppointmentCard appointment={appt} currentUserId={currentUserId} otherUserName={selected.otherUserName} fromMe={fromMe} />
                      ) : isImage && msg.image_url ? (
                        <button onClick={() => setLightboxSrc(msg.image_url!)} className={`rounded-2xl overflow-hidden max-w-[240px] ${fromMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                          <img src={msg.image_url} alt="Afbeelding" className="w-full h-auto max-h-64 object-cover block" loading="lazy" />
                          <p className={`text-[10px] px-3 py-1 ${fromMe ? 'bg-[#111] text-white/60 text-right' : 'bg-gray-100 text-gray-400'}`}>{formatTime(msg.created_at)}</p>
                        </button>
                      ) : (
                        <div className="max-w-[75%] px-4 py-2.5 text-sm leading-relaxed"
                          style={{ background: fromMe ? '#FFF4ED' : '#FFFFFF', color: '#111111', borderRadius: fromMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                          <p className="text-xs font-semibold mb-0.5" style={{ color: fromMe ? '#E87722' : '#3B82F6' }}>
                            {fromMe ? 'Jij' : selected.otherUserName}
                          </p>
                          {msg.content}
                          <div className={`flex items-center gap-1 mt-1 ${fromMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                            {readStatus && (
                              <span style={{ fontSize: 10 }} className={readStatus === 'read' ? 'text-[#E87722]' : 'text-gray-300'}>
                                {readStatus === 'read' ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {fromMe && !isDeleted && (
                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 self-center relative">
                          <button onClick={() => setMsgMenuFor(msgMenuFor === msg.id ? null : msg.id)}
                            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <MoreHorizontal className="w-3 h-3 text-gray-500" />
                          </button>
                          {msgMenuFor === msg.id && (
                            <div className="absolute right-0 bottom-8 z-50 bg-white rounded-xl shadow-xl border border-black/8 overflow-hidden w-52">
                              <button onClick={() => handleDeleteMsgForAll(msg.id)} disabled={!!msg.read_at}
                                className="w-full flex items-start gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-40">
                                <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <p>Verwijderen voor iedereen</p>
                                  {msg.read_at && <p className="text-xs text-gray-400 font-normal">Al gelezen</p>}
                                </div>
                              </button>
                              <div className="border-t border-black/5" />
                              <button onClick={() => handleDeleteMsgForMe(msg.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                <EyeOff className="w-4 h-4 text-gray-400" />
                                Verwijder voor mij
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isAppointment && !isDeleted && (
                      <div className={`${fromMe ? 'mr-8' : 'ml-8'}`}>
                        <MessageReactions
                          messageId={msg.id}
                          reactions={msgReactions}
                          currentUserId={currentUserId}
                          fromMe={fromMe}
                          onReactionChange={(id, updated) => setReactions(prev => ({ ...prev, [id]: updated }))}
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 px-2 py-1 ml-1">
                  <div className="flex gap-[3px] items-end">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <span style={{ fontStyle: 'italic', color: '#6B7280', fontSize: 13 }}>
                    {Object.values(typingUsers).length === 1
                      ? `${Object.values(typingUsers)[0]} is aan het typen...`
                      : Object.values(typingUsers).length === 2
                      ? `${Object.values(typingUsers)[0]} en ${Object.values(typingUsers)[1]} zijn aan het typen...`
                      : 'Meerdere mensen typen...'}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Gespreksopeners */}
            {messages.length === 0 && !loadingMessages && selected?.accepted === true && (
              <ConversationStarters sport={selected.sport} onSelect={text => setNewMessage(text)} />
            )}

            {/* Telefoonwaarschuwing */}
            {showPhoneWarning && (
              <div className="mx-4 mb-2 bg-[#FFF8F2] border-l-4 border-[#E87722] rounded-r-xl px-4 py-3">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#E87722] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold text-[#E87722]">Wacht even — </span>
                    je staat op het punt je telefoonnummer te delen. Ken je deze persoon al goed genoeg? Je kunt altijd verder chatten voordat je persoonlijke gegevens deelt.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setPhoneWarningDismissed(true)} className="text-xs font-bold text-white bg-[#E87722] hover:bg-[#d06a1a] transition-colors px-4 py-1.5 rounded-lg">
                    Akkoord
                  </button>
                </div>
              </div>
            )}

            {/* Afbeelding preview */}
            {pendingImagePreview && (
              <div className="mx-4 mb-2 bg-white border border-black/8 rounded-2xl p-3 flex items-center gap-3">
                <img src={pendingImagePreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">{pendingImage?.name}</p>
                  <p className="text-xs text-gray-400">{pendingImage ? Math.round(pendingImage.size / 1024) + ' KB' : ''}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={cancelImage} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Annuleer</button>
                  <button onClick={sendImage} disabled={uploadingImage}
                    className="text-xs font-bold text-white bg-[#E87722] hover:bg-[#d06a1a] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    {uploadingImage ? 'Sturen...' : 'Verzenden'}
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            {selected.accepted ? (
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2">
                  <button onClick={() => fileInputRef.current?.click()} disabled={!!pendingImage}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#E87722] hover:bg-white transition-all disabled:opacity-30 shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />
                  <button onClick={() => setShowAfspraakModal(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#E87722] hover:bg-white transition-all shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => { setNewMessage(e.target.value); handleTyping() }}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Schrijf een bericht..."
                    className="flex-1 bg-transparent text-sm text-black focus:outline-none"
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim() || showPhoneWarning}
                    className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-[#333] transition-colors shrink-0">
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-400">Accepteer het verzoek om te reageren</p>
              </div>
            )}
          </div>
        ) : !activeMeetupId ? (
          <div className="hidden md:flex flex-1 items-center justify-center" style={{ background: 'white' }}>
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-black text-gray-300 text-lg">Selecteer een gesprek</p>
              <p className="text-gray-300 text-sm mt-1">Kies een bericht uit de lijst</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Modals & overlays ── */}
      {showReportModal && selected && (
        <ReportUserModal
          otherUserId={selected.otherUserId}
          otherUserName={selected.otherUserName}
          conversationId={selected.requestId}
          onClose={() => setShowReportModal(false)}
          onSubmit={() => setShowReportModal(false)}
        />
      )}

      {showDeleteDialog && (
        <DeleteDialog onClose={() => setShowDeleteDialog(false)} onConfirm={handleDeleteConfirm} isPending={isPending} />
      )}

      {showAfspraakModal && selected && (
        <AfspraakModal
          sport={selected.sport}
          otherUserName={selected.otherUserName}
          onClose={() => setShowAfspraakModal(false)}
          onSubmit={handleAfspraakSubmit}
        />
      )}

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Lange-druk preview sheet */}
      {previewConv && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(17,17,17,0.4)' }}
          onClick={() => setPreviewConv(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: getUserColor(previewConv.otherUserId), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ ...SYNE, fontSize: 13, fontWeight: 800, color: 'white' }}>{getInitials(previewConv.otherUserName)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-black text-base">{previewConv.otherUserName}</p>
                {previewConv.sport && <p className="text-xs font-semibold text-[#E87722]">{previewConv.sport}</p>}
              </div>
              <p className="text-xs text-gray-400">{timeAgo(previewConv.createdAt)}</p>
            </div>
            <div className="px-5 py-4 min-h-[80px] flex items-center">
              {previewConv.lastMessageType === 'image' ? (
                <p className="text-sm text-gray-500 italic">📷 Afbeelding</p>
              ) : previewConv.lastMessageType === 'appointment' ? (
                <p className="text-sm text-gray-500 italic">📅 Afspraak voorstel</p>
              ) : previewConv.lastMessage ? (
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{previewConv.lastMessage}</p>
              ) : previewConv.message ? (
                <p className="text-sm text-gray-500 italic leading-relaxed line-clamp-3">{previewConv.message}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Nog geen berichten</p>
              )}
            </div>
            <div className="px-5 pb-6 pt-2 flex gap-3">
              <button onClick={() => setPreviewConv(null)}
                className="flex-1 py-3 rounded-2xl border border-black/10 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Sluiten
              </button>
              <button onClick={() => { setSelected(previewConv); setPreviewConv(null) }}
                style={{ fontFamily: "'Syne', sans-serif" }}
                className="flex-1 py-3 rounded-2xl bg-[#111] text-white text-sm font-bold hover:bg-[#333] transition-colors">
                Chat openen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
