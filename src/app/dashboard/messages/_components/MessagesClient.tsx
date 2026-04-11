'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { Search, Check, X, MessageCircle, Clock, Send } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { acceptBuddyRequest, declineBuddyRequest } from '../../actions'

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

export default function MessagesClient({
  initialConversations,
  currentUserId,
}: {
  initialConversations: ConversationItem[]
  currentUserId: string
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ConversationItem | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll naar laatste bericht
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Online presence tracking
  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUserId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineUsers(new Set(Object.keys(state)))
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => { const s = new Set(prev); s.delete(key); return s })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  // Laad berichten + realtime subscription bij geselecteerd gesprek
  useEffect(() => {
    if (!selected?.accepted) {
      setMessages([])
      return
    }

    const convId = selected.requestId
    setLoadingMessages(true)

    // Laad bestaande berichten
    supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as ChatMessage[])
        setLoadingMessages(false)
      })

    // Realtime: luister naar nieuwe berichten
    const channel = supabase
      .channel(`chat:${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages(prev => {
            // Voorkom duplicaten
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as ChatMessage]
          })
        }
      )
      .subscribe()

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

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: selected.requestId,
      sender_id: currentUserId,
      content,
    })

    if (error) {
      // Zet bericht terug als sturen mislukt
      setNewMessage(content)
    }
  }

  const filtered = (activeTab === 'requests' ? conversations.filter(c => !c.accepted) : conversations.filter(c => c.accepted))
    .filter(c => c.otherUserName.toLowerCase().includes(search.toLowerCase()))

  const requests = conversations.filter(c => !c.accepted)

  return (
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
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                    {!conv.accepted && !isOnline && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#E87722] rounded-full border-2 border-white" />
                    )}
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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <button onClick={() => setSelected(null)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 font-bold">
              ←
            </button>
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
                <button
                  onClick={() => handleDecline(selected.requestId)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" /> Weigeren
                </button>
                <button
                  onClick={() => handleAccept(selected.requestId)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Accepteren
                </button>
              </div>
            )}
          </div>

          {/* Verzoek banner */}
          {!selected.accepted && (
            <div className="mx-4 mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-black mb-0.5">Berichtverzoek van {selected.otherUserName}</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Accepteer het verzoek om te reageren en de conversatie te starten.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleDecline(selected.requestId)}
                  disabled={isPending}
                  className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Weigeren
                </button>
                <button
                  onClick={() => handleAccept(selected.requestId)}
                  disabled={isPending}
                  className="text-xs font-bold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Accepteren
                </button>
              </div>
            </div>
          )}

          {/* Berichten */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Initieel buddy-verzoek bericht */}
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
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    fromMe ? 'bg-[#111111] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                    <p className={`text-[10px] mt-1 ${fromMe ? 'text-white/60' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

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
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-[#333] transition-colors shrink-0"
                >
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
  )
}
