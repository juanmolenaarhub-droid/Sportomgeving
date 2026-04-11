'use client'

import { useState, useTransition } from 'react'
import { Search, Check, X, MessageCircle, Clock, Send } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
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

type Message = { text: string; time: string; fromMe: boolean }

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

export default function MessagesClient({ initialConversations }: { initialConversations: ConversationItem[] }) {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('requests')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ConversationItem | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [localMessages, setLocalMessages] = useState<Record<string, Message[]>>({})
  const [isPending, startTransition] = useTransition()

  const requests = conversations.filter(c => !c.accepted)
  const inbox = conversations.filter(c => c.accepted)

  function handleAccept(requestId: string) {
    startTransition(async () => {
      await acceptBuddyRequest(requestId)
      setConversations(prev =>
        prev.map(c => c.requestId === requestId ? { ...c, accepted: true } : c)
      )
      setSelected(prev => prev?.requestId === requestId ? { ...prev, accepted: true } : prev)
      setActiveTab('inbox')
    })
  }

  function handleDecline(requestId: string) {
    startTransition(async () => {
      await declineBuddyRequest(requestId)
      setConversations(prev => prev.filter(c => c.requestId !== requestId))
      if (selected?.requestId === requestId) setSelected(null)
    })
  }

  function sendMessage() {
    if (!newMessage.trim() || !selected?.accepted) return
    const msg: Message = { text: newMessage, time: 'Nu', fromMe: true }
    setLocalMessages(prev => ({
      ...prev,
      [selected.requestId]: [...(prev[selected.requestId] ?? []), msg],
    }))
    setNewMessage('')
  }

  const filtered = (activeTab === 'requests' ? requests : inbox)
    .filter(c => c.otherUserName.toLowerCase().includes(search.toLowerCase()))

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
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'requests' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Verzoeken
            {requests.length > 0 && (
              <span className="ml-1.5 bg-[#111111] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{requests.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'inbox' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Inbox
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageCircle className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-400">
                {activeTab === 'requests' ? 'Geen berichtverzoeken' : 'Nog geen gesprekken'}
              </p>
              {activeTab === 'inbox' && (
                <p className="text-xs text-gray-300 mt-1">Accepteer verzoeken om te chatten</p>
              )}
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.requestId}
                onClick={() => setSelected(conv)}
                className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${selected?.requestId === conv.requestId ? 'bg-gray-100' : ''}`}
              >
                <div className="relative shrink-0">
                  <Avatar name={conv.otherUserName} size="md" />
                  {!conv.accepted && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#E87722] rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-sm text-black truncate">{conv.otherUserName}</p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(conv.createdAt)}</span>
                  </div>
                  {conv.sport && <p className="text-xs text-gray-400 mb-1">{conv.sport}</p>}
                  <p className={`text-xs truncate ${!conv.accepted ? 'text-black font-semibold' : 'text-gray-400'}`}>
                    {conv.message ?? 'Wil jouw sportbuddy worden'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <button onClick={() => setSelected(null)} className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 font-bold">
              ←
            </button>
            <Avatar name={selected.otherUserName} size="sm" />
            <div className="flex-1">
              <p className="font-black text-black text-sm">{selected.otherUserName}</p>
              {selected.sport && <p className="text-xs text-gray-400">{selected.sport}</p>}
            </div>
            {!selected.accepted && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium hidden sm:block">Berichtverzoek</span>
                <button
                  onClick={() => handleDecline(selected.requestId)}
                  disabled={isPending}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAccept(selected.requestId)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 bg-[#111111] text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" /> Accepteren
                </button>
              </div>
            )}
          </div>

          {!selected.accepted && (
            <div className="mx-4 mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-black mb-0.5">Berichtverzoek van {selected.otherUserName}</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Je kunt dit bericht lezen. Accepteer het verzoek om te reageren en de conversatie te starten.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleDecline(selected.requestId)}
                  disabled={isPending}
                  className="text-xs font-semibold text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Weigeren
                </button>
                <button
                  onClick={() => handleAccept(selected.requestId)}
                  disabled={isPending}
                  className="text-xs font-bold bg-[#111111] text-white px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  Accepteren
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Initieel bericht van het buddy-verzoek */}
            {selected.message && (
              <div className="flex justify-start items-end gap-2">
                <Avatar name={selected.otherUserName} size="xs" />
                <div className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-gray-100 text-gray-800 rounded-bl-sm">
                  {selected.message}
                  <p className="text-[10px] mt-1 text-gray-400">{timeAgo(selected.createdAt)} geleden</p>
                </div>
              </div>
            )}
            {/* Lokale berichten (in-memory totdat chat tabel beschikbaar is) */}
            {(localMessages[selected.requestId] ?? []).map((msg, i) => (
              <div key={i} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {!msg.fromMe && <Avatar name={selected.otherUserName} size="xs" />}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe ? 'bg-[#111111] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.text}
                  <p className={`text-[10px] mt-1 ${msg.fromMe ? 'text-white/60' : 'text-gray-400'}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

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
