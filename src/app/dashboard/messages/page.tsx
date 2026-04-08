'use client'

import { useState } from 'react'
import { Search, Check, X, MessageCircle, Clock, Send } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

type Message = { text: string; time: string; fromMe: boolean }

type Conversation = {
  id: string
  user: { name: string; avatar?: string; region: string; sport: string }
  lastMessage: string
  time: string
  unread: number
  accepted: boolean
  messages: Message[]
}

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    user: { name: 'Tim van Berg', region: 'Amsterdam', sport: 'Hardlopen' },
    lastMessage: 'Hey! Ik zag dat jij ook in Amsterdam hardloopt. Zin om een keer samen te trainen?',
    time: '2 min',
    unread: 1,
    accepted: false,
    messages: [
      { text: 'Hey! Ik zag dat jij ook in Amsterdam hardloopt. Zin om een keer samen te trainen?', time: '14:32', fromMe: false },
    ],
  },
  {
    id: '2',
    user: { name: 'Sarah Jansen', region: 'Utrecht', sport: 'Fietsen' },
    lastMessage: 'Zeker! Zaterdag vroeg in de ochtend klinkt goed.',
    time: '1 uur',
    unread: 0,
    accepted: true,
    messages: [
      { text: 'Hoi! Ik ben ook op zoek naar een fietsmaatje voor het weekend.', time: '10:15', fromMe: false },
      { text: 'Dat klinkt leuk! Wanneer wil je gaan?', time: '10:22', fromMe: true },
      { text: 'Zaterdag vroeg in de ochtend? Dan is het nog niet te warm.', time: '10:45', fromMe: false },
      { text: 'Zeker! Zaterdag vroeg in de ochtend klinkt goed.', time: '11:02', fromMe: true },
    ],
  },
  {
    id: '3',
    user: { name: 'Marco de Wit', region: 'Rotterdam', sport: 'Gym' },
    lastMessage: 'Ik zoek iemand die mij kan spotten op deadlift. Ben jij beschikbaar deze week?',
    time: '3 uur',
    unread: 1,
    accepted: false,
    messages: [
      { text: 'Hey! Zag jouw profiel en je lijkt me een goede trainingspartner.', time: '09:10', fromMe: false },
      { text: 'Ik zoek iemand die mij kan spotten op deadlift. Ben jij beschikbaar deze week?', time: '09:11', fromMe: false },
    ],
  },
  {
    id: '4',
    user: { name: 'Lisa Hoek', region: 'Amsterdam', sport: 'Yoga' },
    lastMessage: 'Super! Tot zondag dan.',
    time: 'Gisteren',
    unread: 0,
    accepted: true,
    messages: [
      { text: 'Hoi! Kom je volgende week mee naar park yoga?', time: 'Gisteren 08:00', fromMe: false },
      { text: 'Ja leuk! Hoe laat beginnen jullie?', time: 'Gisteren 09:30', fromMe: true },
      { text: 'Om 8 uur, bij het Amstelpark ingang.', time: 'Gisteren 09:45', fromMe: false },
      { text: 'Super! Tot zondag dan.', time: 'Gisteren 10:00', fromMe: true },
    ],
  },
]

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_CONVERSATIONS)
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('requests')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')

  const requests = conversations.filter(c => !c.accepted)
  const inbox = conversations.filter(c => c.accepted)
  const totalUnreadRequests = requests.reduce((sum, c) => sum + c.unread, 0)

  function acceptRequest(id: string) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, accepted: true, unread: 0 } : c))
    setSelected(prev => prev?.id === id ? { ...prev, accepted: true, unread: 0 } : prev)
    setActiveTab('inbox')
  }

  function declineRequest(id: string) {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  function sendMessage() {
    if (!newMessage.trim() || !selected) return
    const msg: Message = { text: newMessage, time: 'Nu', fromMe: true }
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, messages: [...c.messages, msg], lastMessage: newMessage } : c
    ))
    setSelected(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : null)
    setNewMessage('')
  }

  const filtered = (activeTab === 'requests' ? requests : inbox)
    .filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()))

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
              className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]"
            />
          </div>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'requests' ? 'text-[#E87722] border-b-2 border-[#E87722]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Verzoeken
            {totalUnreadRequests > 0 && (
              <span className="ml-1.5 bg-[#E87722] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{totalUnreadRequests}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'inbox' ? 'text-[#E87722] border-b-2 border-[#E87722]' : 'text-gray-400 hover:text-gray-600'}`}
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
            </div>
          ) : (
            filtered.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={`w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${selected?.id === conv.id ? 'bg-orange-50' : ''}`}
              >
                <div className="relative shrink-0">
                  <Avatar name={conv.user.name} size="md" />
                  {conv.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#E87722] rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-sm text-black truncate">{conv.user.name}</p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{conv.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{conv.user.sport} · {conv.user.region}</p>
                  <p className={`text-xs truncate ${conv.unread > 0 ? 'text-black font-semibold' : 'text-gray-400'}`}>
                    {conv.lastMessage}
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
            <Avatar name={selected.user.name} size="sm" />
            <div className="flex-1">
              <p className="font-black text-black text-sm">{selected.user.name}</p>
              <p className="text-xs text-gray-400">{selected.user.sport} · {selected.user.region}</p>
            </div>
            {!selected.accepted && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium hidden sm:block">Berichtverzoek</span>
                <button onClick={() => declineRequest(selected.id)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <button onClick={() => acceptRequest(selected.id)} className="flex items-center gap-1.5 bg-[#E87722] text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#d06a1a] transition-colors">
                  <Check className="w-3.5 h-3.5" /> Accepteren
                </button>
              </div>
            )}
          </div>

          {!selected.accepted && (
            <div className="mx-4 mt-4 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#E87722] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-black mb-0.5">Berichtverzoek van {selected.user.name}</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Je kunt dit bericht lezen. Accepteer het verzoek om te reageren en de conversatie te starten.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => declineRequest(selected.id)} className="text-xs font-semibold text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  Weigeren
                </button>
                <button onClick={() => acceptRequest(selected.id)} className="text-xs font-bold bg-[#E87722] text-white px-3 py-1.5 rounded-lg hover:bg-[#d06a1a] transition-colors">
                  Accepteren
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selected.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {!msg.fromMe && <Avatar name={selected.user.name} size="xs" />}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.fromMe ? 'bg-[#E87722] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
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
                <button onClick={sendMessage} disabled={!newMessage.trim()} className="w-8 h-8 bg-[#E87722] rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-[#d06a1a] transition-colors shrink-0">
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
