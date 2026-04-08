'use client'

import { useState } from 'react'
import { Users, MapPin, Search, Plus, Lock, Globe } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

const myGroups = [
  {
    id: 1, name: 'Running Amsterdam', sport: 'Hardlopen', region: 'Amsterdam',
    members: 24, description: 'Wekelijkse runs door Amsterdam. Elke dinsdag en donderdag om 07:00.',
    private: false, joined: true,
  },
  {
    id: 2, name: 'Cycling Utrecht', sport: 'Fietsen', region: 'Utrecht',
    members: 18, description: 'Zondagse fietstochten langs de Vecht en omgeving.',
    private: false, joined: true,
  },
  {
    id: 3, name: 'Gym Buddies Rotterdam', sport: 'Gym', region: 'Rotterdam',
    members: 9, description: 'Trainingsgroep voor gevorderde gym-sporters.',
    private: true, joined: true,
  },
]

const suggestedGroups = [
  {
    id: 4, name: 'Yoga in the Park', sport: 'Yoga', region: 'Amsterdam',
    members: 41, description: 'Buitenyoga elke zondagochtend in het Vondelpark.',
    private: false, joined: false,
  },
  {
    id: 5, name: 'Padel Den Haag', sport: 'Padel', region: 'Den Haag',
    members: 33, description: 'Padelgroep voor alle niveaus. Beginners welkom!',
    private: false, joined: false,
  },
  {
    id: 6, name: 'Zwemclub Noord', sport: 'Zwemmen', region: 'Amsterdam',
    members: 15, description: 'Vroege-ochtend zwemtrainingen, ma/wo/vr om 06:30.',
    private: true, joined: false,
  },
]

type Group = typeof myGroups[0] | typeof suggestedGroups[0]

function GroupCard({ group, onJoin }: { group: Group; onJoin?: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#E87722] hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
          <Users className="w-6 h-6 text-[#E87722]" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          {group.private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
          {group.private ? 'Privé' : 'Openbaar'}
        </div>
      </div>
      <h3 className="font-black text-black mb-1">{group.name}</h3>
      <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
        <MapPin className="w-3 h-3" /> {group.region}
      </p>
      <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{group.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-2">
            {['A', 'B', 'C'].map((l, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden">
                <Avatar name={l} size="xs" />
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-1">{group.members} leden</span>
        </div>
        {group.joined ? (
          <span className="text-xs font-bold text-[#E87722] bg-orange-50 px-3 py-1.5 rounded-lg">Lid</span>
        ) : (
          <button
            onClick={onJoin}
            className="text-xs font-bold text-white bg-[#E87722] px-3 py-1.5 rounded-lg hover:bg-[#d06a1a] transition-colors"
          >
            Aansluiten
          </button>
        )}
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const filteredSuggested = suggestedGroups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.sport.toLowerCase().includes(search.toLowerCase()) ||
    g.region.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-black">Groepen</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sluit je aan bij sportgroepen in jouw buurt</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#E87722] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#d06a1a] transition-colors"
        >
          <Plus className="w-4 h-4" /> Groep aanmaken
        </button>
      </div>

      {/* Groep aanmaken modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-black text-black mb-5">Nieuwe groep aanmaken</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Naam</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                  placeholder="Bijv. Running Rotterdam"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sport</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] bg-white">
                  <option>Hardlopen</option>
                  <option>Fietsen</option>
                  <option>Gym</option>
                  <option>Yoga</option>
                  <option>Zwemmen</option>
                  <option>Voetbal</option>
                  <option>Padel</option>
                  <option>Tennis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Beschrijving</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] resize-none"
                  placeholder="Waar gaat de groep over?"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-[#E87722] text-white font-bold py-3 rounded-xl hover:bg-[#d06a1a] transition-colors"
                >
                  Aanmaken
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mijn groepen */}
      <div>
        <h2 className="text-lg font-black text-black mb-4">Mijn groepen</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGroups.map(group => <GroupCard key={group.id} group={group} />)}
        </div>
      </div>

      {/* Zoeken + ontdekken */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-black">Ontdek groepen</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op naam, sport of stad..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722] bg-white w-64"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuggested.map(group => <GroupCard key={group.id} group={group} />)}
        </div>
        {filteredSuggested.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">Geen groepen gevonden</p>
            <p className="text-sm mt-1">Probeer een andere zoekterm</p>
          </div>
        )}
      </div>
    </div>
  )
}
