'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Check, X, MessageCircle, Clock, Send,
  MoreVertical, AlertTriangle, Flag, Trash2
} from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { acceptBuddyRequest, declineBuddyRequest } from '../../actions'
import { reportUser, deleteConversation, REPORT_CATEGORIES } from '../../safety-actions'

export type ConversationItem = {
  requestId: string
  otherUserId: string
  otherUserName: string
  sport: string | null
  message: string | null
  createdAt: string
  accepted: boolean
}

type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

const PHONE_REGEX = /(\+316\d{8}|0031\s*6\s*\d{8}|06[-\s]?\d{8})/

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Zojuist'
  if (mins < 60) return `${mins} min`
  if (hours < 24) return `${hours} uur`
  return `${days} dag${days > 1 ? 'en' : ''}`
}

// ── Rapport modal ─────────────────────────────────────────────────────────────
function ReportModal({
  otherUserId,
  otherUserName,
  conversationId,
  onClose,
  onSubmit,
}: {
  otherUserId: string
  otherUserName: string
  conversationId: string
  onClose: () => void
  onSubmit: () => void
}) {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [blockAlso, setBlockAlso] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const MAX_DESC = 500

  async function handleSubmit() {
    if (!category) return
    setSubmitting(true)
    setError(null)
    const result = await reportUser(otherUserId, category, description, conversationId, blockAlso)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    onSubmit()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-[#F5F0E8] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-black/8 shrink-0">
          <div>
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 18, color: '#111' }}>
              Rapporteer {otherUserName}
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Je melding is anoniem. We beoordelen elk rapport zorgvuldig.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-black/8 rounded-full flex items-center justify-center hover:bg-black/12 transition-colors shrink-0 ml-3">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Reden</p>
            <div className="space-y-2">
              {REPORT_CATEGORIES.map(cat => (
                <label key={cat} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${category === cat ? 'border-[#E87722] bg-white' : 'border-transparent bg-white/60 hover:bg-white'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${category === cat ? 'border-[#E87722]' : 'border-gray-300'}`}>
                    {category === cat && <div className="w-2 h-2 rounded-full bg-[#E87722]" />}
                  </div>
                  <input type="radio" name="category" value={cat} checked={category === cat} onChange={() => setCategory(cat)} className="sr-only" />
                  <span className="text-sm font-medium text-gray-800">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Beschrijving <span className="normal-case font-normal text-gray-400">(optioneel)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Beschrijf wat er is gebeurd..."
              rows={3}
              className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]/40 resize-none leading-relaxed"
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-300">{description.length}/{MAX_DESC}</span>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-black/8 cursor-pointer">
            <div
              onClick={() => setBlockAlso(v => !v)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${blockAlso ? 'bg-[#111] border-[#111]' : 'border-gray-300'}`}
            >
              {blockAlso && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-700">Blokkeer deze gebruiker ook</span>
          </label>

          {error && (
            <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Acties */}
        <div className="px-6 pb-6 pt-4 border-t border-black/8 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600 hover:bg-black/5 transition-colors">
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!category || submitting}
            style={SYNE}
            className="flex-1 py-3 rounded-xl bg-[#E87722] text-white text-sm font-bold transition-colors hover:bg-[#d06a1a] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Indienen...' : 'Rapport indienen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Verwijder bevestigingsdialog ──────────────────────────────────────────────
function DeleteDialog({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#F5F0E8] w-full max-w-sm rounded-2xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ ...SYNE, fontWeight: 800, fontSize: 17, color: '#111' }} className="mb-2">
          Chat verwijderen?
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Weet je zeker dat je deze chat wilt verwijderen? De berichten verdwijnen alleen bij jou. De andere persoon kan de chat nog steeds zien.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600 hover:bg-black/5 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Verwijderen...' : 'Verwijderen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Drie-puntjes menu ─────────────────────────────────────────────────────────
function ChatMenu({
  onReport,
  onDelete,
  onClose,
}: {
  onReport: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className="absolute right-4 top-14 z-50 bg-white rounded-xl shadow-xl border border-black/8 overflow-hidden w-52">
      <button
        onClick={() => { onReport(); onClose() }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-[#F5F0E8] transition-colors text-left"
      >
        <Flag className="w-4 h-4 text-[#E87722]" />
        Gebruiker rapporteren
      </button>
      <div className="border-t border-black/5" />
      <button
        onClick={() => { onDelete(); onClose() }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
      >
        <Trash2 className="w-4 h-4" />
        Chat verwijderen
      </button>
    </div>
  )
}

// ── Toast notificatie ─────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl animate-fade-in">
      {message}
    </div>
  )
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
  const [conversations, setConversations] = useState(initialConversations)
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ConversationItem | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Menu & modals
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Telefoonwaarschuwing
  const [phoneWarningDismissed, setPhoneWarningDismissed] = useState(false)
  const hasPhoneNumber = PHONE_REGEX.test(newMessage)
  const showPhoneWarning = hasPhoneNumber && !phoneWarningDismissed

  useEffect(() => {
    if (!hasPhoneNumber) setPhoneWarningDismissed(false)
  }, [hasPhoneNumber])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Online presence
  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUserId } },
    })
    channel
      .on('presence', { event: 'sync' }, () => setOnlineUsers(new Set(Object.keys(channel.presenceState()))))
      .on('presence', { event: 'join' }, ({ key }) => setOnlineUsers(prev => new Set([...prev, key])))
      .on('presence', { event: 'leave' }, ({ key }) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(key); return s }))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() })
      })
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  // Berichten + realtime per gesprek
  useEffect(() => {
    if (!selected?.accepted) { setMessages([]); return }
    const convId = selected.requestId
    setLoadingMessages(true)
    supabase.from('chat_messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true })
      .then(({ data }) => { setMessages((data ?? []) as ChatMessage[]); setLoadingMessages(false) })

    const channel = supabase.channel(`chat:${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new as ChatMessage])
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
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

  async function sendMessage() {
    if (!newMessage.trim() || !selected?.accepted) return
    const content = newMessage.trim()
    setNewMessage('')
    setPhoneWarningDismissed(false)
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: selected.requestId,
      sender_id: currentUserId,
      content,
    })
    if (error) setNewMessage(content)
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

  const filtered = (activeTab === 'requests' ? conversations.filter(c => !c.accepted) : conversations.filter(c => c.accepted))
    .filter(c => c.otherUserName.toLowerCase().includes(search.toLowerCase()))
  const requests = conversations.filter(c => !c.accepted)

  return (
    <>
      <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl border border-gray-100 overflow-hidden">

        {/* Linker kolom */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-100 ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-100">
            <h1 className="text-xl font-black text-black mb-4">Berichten</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Zoek gesprekken..."
                className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>

          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'inbox' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Inbox
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'requests' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Volgverzoeken
              {requests.length > 0 && (
                <span className="ml-1.5 bg-[#E87722] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageCircle className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-semibold text-gray-400">
                  {activeTab === 'requests' ? 'Geen berichtverzoeken' : 'Nog geen gesprekken'}
                </p>
              </div>
            ) : (
              filtered.map(conv => {
                const isOnline = onlineUsers.has(conv.otherUserId)
                return (
                  <button
                    key={conv.requestId}
                    onClick={() => setSelected(conv)}
                    className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${selected?.requestId === conv.requestId ? 'bg-gray-100' : ''}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={conv.otherUserName} size="md" />
                      {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
                      {!conv.accepted && !isOnline && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#E87722] rounded-full border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-sm text-black truncate">{conv.otherUserName}</p>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(conv.createdAt)}</span>
                      </div>
                      {conv.sport && <p className="text-xs text-gray-400 mb-0.5">{conv.sport}</p>}
                      <p className={`text-xs truncate ${!conv.accepted ? 'text-black font-semibold' : 'text-gray-400'}`}>
                        {conv.message ?? 'Wil jouw sportbuddy worden'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Chat */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <button onClick={() => setSelected(null)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 font-bold">←</button>
              <div className="relative">
                <Avatar name={selected.otherUserName} size="sm" />
                {onlineUsers.has(selected.otherUserId) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-black text-black text-sm">{selected.otherUserName}</p>
                <p className="text-xs font-medium" style={{ color: onlineUsers.has(selected.otherUserId) ? '#22c55e' : '#9ca3af' }}>
                  {onlineUsers.has(selected.otherUserId) ? 'Online' : 'Offline'}
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
              {/* Drie-puntjes menu */}
              <button
                onClick={() => setShowMenu(v => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown menu */}
            {showMenu && (
              <ChatMenu
                onReport={() => setShowReportModal(true)}
                onDelete={() => setShowDeleteDialog(true)}
                onClose={() => setShowMenu(false)}
              />
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
                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    Weigeren
                  </button>
                  <button onClick={() => handleAccept(selected.requestId)} disabled={isPending}
                    className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    Accepteren
                  </button>
                </div>
              </div>
            )}

            {/* Berichten */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.message && (
                <div className="flex justify-start items-end gap-2">
                  <Avatar name={selected.otherUserName} size="xs" />
                  <div className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-gray-100 text-gray-800 rounded-bl-sm">
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
                const fromMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!fromMe && <Avatar name={selected.otherUserName} size="xs" />}
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${fromMe ? 'bg-[#111111] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      {msg.content}
                      <p className={`text-[10px] mt-1 ${fromMe ? 'text-white/60' : 'text-gray-400'}`}>{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Telefoonwaarschuwing */}
            {showPhoneWarning && (
              <div className="mx-4 mb-2 flex items-start gap-3 bg-[#FFF8F2] border-l-4 border-[#E87722] rounded-r-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-[#E87722] shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700 leading-relaxed flex-1">
                  <span className="font-bold text-[#E87722]">Let op: </span>
                  Geef nooit zomaar je nummer aan iemand die je nog niet hebt gezien of gesproken. Behoud het contact eerst via de chat.
                </p>
                <button onClick={() => setPhoneWarningDismissed(true)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input */}
            {selected.accepted ? (
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Schrijf een bericht..."
                    className="flex-1 bg-transparent text-sm text-black focus:outline-none"
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim()}
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
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-black text-gray-300 text-lg">Selecteer een gesprek</p>
              <p className="text-gray-300 text-sm mt-1">Kies een bericht uit de lijst</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showReportModal && selected && (
        <ReportModal
          otherUserId={selected.otherUserId}
          otherUserName={selected.otherUserName}
          conversationId={selected.requestId}
          onClose={() => setShowReportModal(false)}
          onSubmit={() => {
            setShowReportModal(false)
            setToast('Je melding is ontvangen. We bekijken dit zo snel mogelijk.')
          }}
        />
      )}

      {showDeleteDialog && (
        <DeleteDialog
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          isPending={isPending}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}
