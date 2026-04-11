'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, X, Mail, Ban, ChevronRight } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type Profile = {
  id: string
  full_name: string | null
  username: string | null
  email: string | null
  city: string | null
  sport: string | null
  level: string | null
  created_at: string
  last_seen_at: string | null
  is_active: boolean | null
  avatar_url: string | null
}

type UserDetail = Profile & {
  matches: number
  messages: number
  posts: number
}

function Avatar({ name, size = 32 }: { name: string | null; size?: number }) {
  const initials = (name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="bg-[#111111] rounded-lg flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

export default function GebruikersPage() {
  const supabase = createClient()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [stats, setStats] = useState({ noSport: 0, noPhoto: 0, inactive30: 0 })

  const loadProfiles = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
    const { data } = await q
    const profiles = (data ?? []) as Profile[]
    setProfiles(profiles)

    const now = Date.now()
    const noSport = profiles.filter(p => !p.sport).length
    const noPhoto = profiles.filter(p => !p.avatar_url).length
    const inactive30 = profiles.filter(p => {
      if (!p.last_seen_at) return true
      return (now - new Date(p.last_seen_at).getTime()) > 30 * 24 * 60 * 60 * 1000
    }).length
    setStats({ noSport, noPhoto, inactive30 })
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadProfiles() }, [loadProfiles])

  async function openUser(profile: Profile) {
    setModalLoading(true)
    setSelectedUser({ ...profile, matches: 0, messages: 0, posts: 0 })

    const [
      { count: matches },
      { count: messages },
      { count: posts },
    ] = await Promise.all([
      supabase.from('matches').select('*', { count: 'exact', head: true }).or(`from_user_id.eq.${profile.id},to_user_id.eq.${profile.id}`),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', profile.id),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
    ])

    setSelectedUser({ ...profile, matches: matches ?? 0, messages: messages ?? 0, posts: posts ?? 0 })
    setModalLoading(false)
  }

  async function deactivateUser(userId: string) {
    await supabase.from('profiles').update({ is_active: false }).eq('id', userId)
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_active: false } : p))
    setSelectedUser(null)
  }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || [p.full_name, p.username, p.email, p.city].some(v => v?.toLowerCase().includes(q))
    const matchSport = sportFilter === 'all' || p.sport === sportFilter
    const matchLevel = levelFilter === 'all' || p.level === levelFilter
    const matchActive = activeFilter === 'all' || (activeFilter === 'active' ? p.is_active !== false : p.is_active === false)
    return matchSearch && matchSport && matchLevel && matchActive
  })

  const sports = [...new Set(profiles.map(p => p.sport).filter(Boolean))] as string[]
  const levels = ['beginner', 'gemiddeld', 'gevorderd']

  return (
    <div className="p-6 md:p-10 max-w-6xl space-y-6">
      <div>
        <p style={{ ...SYNE, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', color: '#E87722' }} className="uppercase mb-2">Admin</p>
        <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em' }} className="text-black">Gebruikers</h1>
      </div>

      {/* Snelle stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Zonder sport', value: stats.noSport, color: '#f59e0b' },
          { label: 'Zonder foto', value: stats.noPhoto, color: '#f59e0b' },
          { label: '30+ dagen inactief', value: stats.inactive30, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-black/8 p-5">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{s.label}</p>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-black/8 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op naam, email of stad…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <select value={sportFilter} onChange={e => setSportFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none bg-white">
          <option value="all">Alle sporten</option>
          {sports.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none bg-white">
          <option value="all">Alle niveaus</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none bg-white">
          <option value="all">Actief & inactief</option>
          <option value="active">Alleen actief</option>
          <option value="inactive">Alleen inactief</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} users</span>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        {loading ? (
          <div className="p-10 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8">
                  {['Gebruiker', 'Sport', 'Niveau', 'Stad', 'Geregistreerd', 'Laatste login', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-300">Geen gebruikers gevonden</td></tr>
                ) : filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#F5F0E8]/60 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-[#F5F0E8]/30' : ''}`}
                    onClick={() => openUser(p)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.full_name ?? p.username} size={30} />
                        <div>
                          <p className="font-semibold text-black text-xs">{p.full_name ?? p.username ?? '—'}</p>
                          <p className="text-gray-400 text-[10px]">{p.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.sport ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs capitalize">{p.level ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.city ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {p.last_seen_at ? new Date(p.last_seen_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.is_active !== false ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {p.is_active !== false ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-end p-4" onClick={() => setSelectedUser(null)}>
          <div
            className="bg-[#F5F0E8] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#111111] px-6 py-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selectedUser.full_name ?? selectedUser.username} size={44} />
                <div>
                  <p style={{ ...SYNE, fontWeight: 700, fontSize: 16, color: 'white' }}>
                    {selectedUser.full_name ?? selectedUser.username ?? 'Onbekend'}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">{selectedUser.email ?? '—'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {modalLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-black/10 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Matches', value: selectedUser.matches },
                      { label: 'Berichten', value: selectedUser.messages },
                      { label: 'Posts', value: selectedUser.posts },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-black/8">
                        <p style={{ ...SYNE, fontWeight: 800, fontSize: 22, color: '#E87722' }}>{s.value}</p>
                        <p className="text-xs text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Profiel details */}
                  <div className="bg-white rounded-2xl border border-black/8 divide-y divide-black/5">
                    {[
                      { label: 'User ID', value: selectedUser.id },
                      { label: 'Sport', value: selectedUser.sport ?? '—' },
                      { label: 'Niveau', value: selectedUser.level ?? '—' },
                      { label: 'Stad', value: selectedUser.city ?? '—' },
                      { label: 'Geregistreerd', value: new Date(selectedUser.created_at).toLocaleDateString('nl-NL') },
                      { label: 'Laatste login', value: selectedUser.last_seen_at ? new Date(selectedUser.last_seen_at).toLocaleDateString('nl-NL') : '—' },
                      { label: 'Status', value: selectedUser.is_active !== false ? '✓ Actief' : '✗ Inactief' },
                    ].map(row => (
                      <div key={row.label} className="px-4 py-3 flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">{row.label}</span>
                        <span className="text-xs text-gray-700 font-mono max-w-48 truncate text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Acties */}
            <div className="px-6 py-4 border-t border-black/8 flex gap-3">
              <a
                href={`mailto:${selectedUser.email}`}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-black/10 text-black font-semibold text-sm py-3 rounded-xl hover:bg-black hover:text-white transition-all"
              >
                <Mail className="w-4 h-4" /> Stuur e-mail
              </a>
              {selectedUser.is_active !== false && (
                <button
                  onClick={() => deactivateUser(selectedUser.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-500 border border-red-100 font-semibold text-sm py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <Ban className="w-4 h-4" /> Deactiveer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
