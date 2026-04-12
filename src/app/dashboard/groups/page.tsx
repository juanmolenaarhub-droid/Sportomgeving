'use client'

import { useState, useEffect } from 'react'
import { Users, MapPin, Search, Plus, Lock, Globe, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Group = {
  id: string
  name: string
  sport: string | null
  region: string | null
  description: string | null
  private: boolean
  member_count: number
  joined: boolean
  created_by: string
}

const SPORTS = ['Hardlopen', 'Fietsen', 'Gym', 'Yoga', 'Zwemmen', 'Voetbal', 'Padel', 'Tennis', 'Golf', 'Wandelen', 'Boksen', 'Klimmen']

function GroupCard({ group, onJoin, onLeave }: { group: Group; onJoin: () => void; onLeave: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] p-5 hover:border-[#111]/20 hover:shadow-sm transition-all">
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
      {group.region && (
        <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
          <MapPin className="w-3 h-3" /> {group.region}
        </p>
      )}
      {group.sport && (
        <span className="inline-block text-[10px] font-bold bg-orange-50 text-[#E87722] px-2 py-0.5 rounded-full mb-2">{group.sport}</span>
      )}
      <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{group.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{group.member_count} leden</span>
        {group.joined ? (
          <button
            onClick={onLeave}
            className="flex items-center gap-1 text-xs font-bold text-[#E87722] bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <Check className="w-3 h-3" /> Lid
          </button>
        ) : (
          <button
            onClick={onJoin}
            className="text-xs font-bold text-white bg-[#111111] px-3 py-1.5 rounded-lg hover:bg-[#333] transition-colors"
          >
            Aansluiten
          </button>
        )}
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Create form state
  const [newName, setNewName] = useState('')
  const [newSport, setNewSport] = useState('Hardlopen')
  const [newRegion, setNewRegion] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPrivate, setNewPrivate] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: groups }, { data: memberships }] = await Promise.all([
      supabase.from('groups').select('id, name, sport, region, description, private, member_count, created_by').order('created_at', { ascending: false }).limit(100),
      supabase.from('group_members').select('group_id').eq('user_id', user.id),
    ])

    const joinedIds = new Set((memberships ?? []).map(m => m.group_id))
    const enriched: Group[] = (groups ?? []).map(g => ({ ...g, joined: joinedIds.has(g.id) }))

    setMyGroups(enriched.filter(g => g.joined))
    setAllGroups(enriched)
    setLoading(false)
  }

  async function joinGroup(groupId: string) {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role: 'member' })
    setMyGroups(prev => {
      const grp = allGroups.find(g => g.id === groupId)
      if (!grp) return prev
      return [...prev, { ...grp, joined: true, member_count: grp.member_count + 1 }]
    })
    setAllGroups(prev => prev.map(g => g.id === groupId ? { ...g, joined: true, member_count: g.member_count + 1 } : g))
  }

  async function leaveGroup(groupId: string) {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
    setMyGroups(prev => prev.filter(g => g.id !== groupId))
    setAllGroups(prev => prev.map(g => g.id === groupId ? { ...g, joined: false, member_count: Math.max(0, g.member_count - 1) } : g))
  }

  async function createGroup() {
    if (!newName.trim() || !userId) return
    setCreating(true)
    const supabase = createClient()
    const { data: grp } = await supabase.from('groups').insert({
      name: newName.trim(),
      sport: newSport || null,
      region: newRegion.trim() || null,
      description: newDesc.trim() || null,
      private: newPrivate,
      created_by: userId,
    }).select().single()

    if (grp) {
      // Maak aanmaker automatisch lid (als admin)
      await supabase.from('group_members').insert({ group_id: grp.id, user_id: userId, role: 'admin' })
      const newGroup: Group = { ...grp, joined: true, member_count: 1 }
      setMyGroups(prev => [newGroup, ...prev])
      setAllGroups(prev => [newGroup, ...prev])
    }

    setNewName(''); setNewSport('Hardlopen'); setNewRegion(''); setNewDesc(''); setNewPrivate(false)
    setShowCreate(false); setCreating(false)
  }

  const suggested = allGroups.filter(g => !g.joined && (
    !search || g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.sport ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (g.region ?? '').toLowerCase().includes(search.toLowerCase())
  ))

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
          className="flex items-center gap-2 bg-[#111111] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#333] transition-colors"
        >
          <Plus className="w-4 h-4" /> Groep aanmaken
        </button>
      </div>

      {/* Groep aanmaken modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-black">Nieuwe groep aanmaken</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Naam <span className="text-[#E87722]">*</span></label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                  placeholder="Bijv. Running Rotterdam" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Sport</label>
                  <select value={newSport} onChange={e => setNewSport(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722] bg-white">
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Stad</label>
                  <input type="text" value={newRegion} onChange={e => setNewRegion(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                    placeholder="Amsterdam" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Beschrijving</label>
                <textarea rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722] resize-none"
                  placeholder="Waar gaat de groep over?" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setNewPrivate(p => !p)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${newPrivate ? 'bg-[#111]' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${newPrivate ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Privé groep</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Annuleren
                </button>
                <button onClick={createGroup} disabled={!newName.trim() || creating}
                  className="flex-1 bg-[#111111] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#333] transition-colors disabled:opacity-40">
                  {creating ? 'Aanmaken...' : 'Aanmaken'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mijn groepen */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
        </div>
      ) : myGroups.length > 0 ? (
        <div>
          <h2 className="text-lg font-black text-black mb-4">Mijn groepen</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map(g => (
              <GroupCard key={g.id} group={g} onJoin={() => joinGroup(g.id)} onLeave={() => leaveGroup(g.id)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
          <p className="text-sm font-bold text-black">Je bent nog geen lid van een groep</p>
          <p className="text-xs text-gray-500 mt-0.5">Sluit je aan bij een bestaande groep of maak je eigen groep aan.</p>
        </div>
      )}

      {/* Ontdek groepen */}
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
        {suggested.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggested.map(g => (
              <GroupCard key={g.id} group={g} onJoin={() => joinGroup(g.id)} onLeave={() => leaveGroup(g.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">Geen groepen gevonden</p>
            <p className="text-sm mt-1">Maak de eerste groep aan!</p>
          </div>
        )}
      </div>
    </div>
  )
}
