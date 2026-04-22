'use client'

import { useState, useEffect } from 'react'
import { MapPin, Crown, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#C4F542', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#8B5CF6', default: '#6B7280',
}
function getSportColor(sport: string) { return SPORT_COLORS[sport] ?? SPORT_COLORS.default }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return 'Zojuist'
  if (mins < 60) return `${mins} min`
  if (hours < 24) return `${hours} uur`
  return `${Math.floor(diff / 86400000)} d`
}

function timeUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Verlopen'
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return hours > 0 ? `${hours}u ${mins}m` : `${mins}m`
}

function formatDate(date: string | null, time: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

type MeetupItem = {
  id: string
  sport: string
  title: string
  city: string
  location_name: string
  is_spontaneous: boolean
  date: string | null
  time: string | null
  expires_at: string | null
  status: string
  creator_id: string
  creatorName: string
  isCreator: boolean
  lastMessage: string | null
  lastMessageAt: string | null
  interestedCount: number
  acceptedCount: number
}

export default function MeetupChatList({ currentUserId, onSelect }: { currentUserId: string; onSelect: (meetupId: string) => void }) {
  const [meetups, setMeetups] = useState<MeetupItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [currentUserId])

  async function load() {
    const supabase = createClient()

    // Meetups waarbij ik organisator ben ÓÓÓF geaccepteerde deelnemer
    const [{ data: created }, { data: participating }] = await Promise.all([
      supabase.from('meetups')
        .select('id, sport, title, city, location_name, is_spontaneous, date, time, expires_at, status, creator_id')
        .eq('creator_id', currentUserId)
        .not('status', 'in', '("verlopen")')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('meetup_participants')
        .select('meetup_id')
        .eq('user_id', currentUserId)
        .eq('status', 'geaccepteerd'),
    ])

    const participatingIds = (participating ?? []).map(p => p.meetup_id)
    let participatingMeetups: any[] = []
    if (participatingIds.length > 0) {
      const { data } = await supabase.from('meetups')
        .select('id, sport, title, city, location_name, is_spontaneous, date, time, expires_at, status, creator_id')
        .in('id', participatingIds)
        .not('status', 'in', '("verlopen")')
        .order('created_at', { ascending: false })
      participatingMeetups = data ?? []
    }

    // Dedup
    const createdIds = new Set((created ?? []).map((m: any) => m.id))
    const allMeetups = [
      ...(created ?? []).map((m: any) => ({ ...m, isCreator: true })),
      ...participatingMeetups.filter((m: any) => !createdIds.has(m.id)).map((m: any) => ({ ...m, isCreator: false })),
    ]

    if (allMeetups.length === 0) { setMeetups([]); setLoading(false); return }

    const meetupIds = allMeetups.map(m => m.id)
    const creatorIds = [...new Set(allMeetups.filter(m => !m.isCreator).map(m => m.creator_id))]

    const [{ data: lastMessages }, { data: creators }, { data: participants }] = await Promise.all([
      supabase.from('meetup_messages')
        .select('meetup_id, content, created_at')
        .in('meetup_id', meetupIds)
        .order('created_at', { ascending: false })
        .limit(meetupIds.length * 5),
      creatorIds.length > 0
        ? supabase.from('profiles').select('id, full_name, username').in('id', creatorIds)
        : Promise.resolve({ data: [] }),
      supabase.from('meetup_participants')
        .select('meetup_id, status')
        .in('meetup_id', meetupIds),
    ])

    const lastMsgMap: Record<string, { content: string; created_at: string }> = {}
    for (const m of lastMessages ?? []) {
      if (!lastMsgMap[m.meetup_id]) lastMsgMap[m.meetup_id] = m
    }

    const creatorMap = Object.fromEntries((creators ?? []).map((c: any) => [c.id, c]))
    const acceptedMap: Record<string, number> = {}
    const interestedMap: Record<string, number> = {}
    for (const p of participants ?? []) {
      if (p.status === 'geaccepteerd') acceptedMap[p.meetup_id] = (acceptedMap[p.meetup_id] ?? 0) + 1
      if (p.status === 'interesse') interestedMap[p.meetup_id] = (interestedMap[p.meetup_id] ?? 0) + 1
    }

    const enriched: MeetupItem[] = allMeetups.map(m => {
      const creator = creatorMap[m.creator_id]
      const lastMsg = lastMsgMap[m.id]
      return {
        id: m.id,
        sport: m.sport,
        title: m.title,
        city: m.city,
        location_name: m.location_name,
        is_spontaneous: m.is_spontaneous,
        date: m.date,
        time: m.time,
        expires_at: m.expires_at,
        status: m.status,
        creator_id: m.creator_id,
        creatorName: m.isCreator ? 'Jij organiseert' : (creator?.full_name ?? creator?.username ?? 'Onbekend'),
        isCreator: m.isCreator,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.created_at ?? null,
        interestedCount: interestedMap[m.id] ?? 0,
        acceptedCount: acceptedMap[m.id] ?? 0,
      }
    })

    // Sorteer op meest recente activiteit
    enriched.sort((a, b) => {
      const dateA = a.lastMessageAt ?? '0'
      const dateB = b.lastMessageAt ?? '0'
      return dateB.localeCompare(dateA)
    })

    setMeetups(enriched)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (meetups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MapPin className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-gray-400">Geen actieve meetups</p>
        <a href="/dashboard/meetup" className="mt-3 text-xs font-bold text-[#C4F542] hover:underline">
          Ontdek meetups →
        </a>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto flex-1">
      {meetups.map(m => {
        const color = getSportColor(m.sport)
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="w-full flex items-start gap-0 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left"
          >
            {/* Sport kleur balk */}
            <div className="w-1 self-stretch shrink-0" style={{ background: color }} />

            <div className="flex-1 p-4 flex items-start gap-3 min-w-0">
              {/* Sport icoon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + '20' }}>
                <MapPin className="w-5 h-5" style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="font-bold text-sm text-black truncate">{m.title}</p>
                  <span className="text-xs text-gray-400 shrink-0">
                    {m.lastMessageAt ? timeAgo(m.lastMessageAt) : ''}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  {m.isCreator ? (
                    <><Crown className="w-3 h-3 text-[#C4F542]" /> Jij organiseert</>
                  ) : (
                    <><Users className="w-3 h-3" /> {m.creatorName}</>
                  )}
                </p>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 truncate flex-1">
                    {m.lastMessage
                      ? m.lastMessage.slice(0, 60) + (m.lastMessage.length > 60 ? '...' : '')
                      : (m.is_spontaneous
                          ? `⚡ Spontaan · verloopt over ${timeUntilExpiry(m.expires_at ?? '')}`
                          : m.date ? `📅 ${formatDate(m.date, m.time)}` : '📍 ' + m.location_name)
                    }
                  </p>

                  {/* Badge: nieuwe interesse-meldingen voor organisator */}
                  {m.isCreator && m.interestedCount > 0 && (
                    <span className="ml-2 bg-[#C4F542] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                      {m.interestedCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
